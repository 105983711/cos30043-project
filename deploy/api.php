<?php
declare(strict_types=1);
// Mercury adapter. Keep configuration and all database files outside public_html.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
date_default_timezone_set('Asia/Kuala_Lumpur');
function respond(int $status, $data): never
{
  http_response_code($status);
  echo json_encode($data, JSON_THROW_ON_ERROR);
  exit();
}
function stop(int $status, string $message): never
{
  respond($status, ['message' => $message]);
}
function value($v): string
{
  return is_string($v) ? trim($v) : '';
}
function query(string $sql, array $args = []): PDOStatement
{
  global $db;
  $q = $db->prepare($sql);
  $q->execute($args);
  return $q;
}
function one(string $sql, array $args = [])
{
  return query($sql, $args)->fetch();
}
function rows(string $sql, array $args = []): array
{
  return query($sql, $args)->fetchAll();
}
function publicUser($u)
{
  return $u
    ? ['id' => (int) $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role']]
    : null;
}
function auth($u): void
{
  if (!$u) {
    stop(401, 'Please log in to continue.');
  }
}
function organizer($u): void
{
  auth($u);
  if (!in_array($u['role'], ['organizer', 'admin'], true)) {
    stop(403, 'An organizer account is required.');
  }
}
function owns($u, $row): void
{
  organizer($u);
  if ($u['role'] !== 'admin' && (int) $row['owner_id'] !== (int) $u['id']) {
    stop(403, 'You can only manage content you created.');
  }
}
function normalized(array $row): array
{
  foreach (['id', 'clubId', 'owner_id', 'likes', 'attendees', 'members', 'capacity'] as $k) {
    if (isset($row[$k])) {
      $row[$k] = (int) $row[$k];
    }
  }
  if (isset($row['price'])) {
    $row['price'] = (float) $row['price'];
  }
  return $row;
}

try {
  $configPath = getenv('CAMPUS_CONFIG') ?: dirname(__DIR__, 2) . '/campus-private/config.php';
  if (!is_file($configPath)) {
    stop(503, 'The database is not configured. Follow the Mercury deployment guide.');
  }
  $config = require $configPath;
  $db = new PDO($config['dsn'], $config['username'] ?? null, $config['password'] ?? null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  $sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
  if ($sqlite) {
    $db->exec('PRAGMA foreign_keys=ON');
    $db->exec('PRAGMA busy_timeout=5000');
  }
  session_name('campus_php_session');
  session_set_cookie_params([
    'lifetime' => 604800,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  ]);
  ini_set('session.gc_maxlifetime', '604800');
  session_start();
  $path = $_GET['path'] ?? '/';
  $method = $_SERVER['REQUEST_METHOD'];
  if (!in_array($method, ['GET', 'HEAD'], true)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $originHost = $origin
      ? parse_url($origin, PHP_URL_HOST) .
        (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '')
      : '';
    if (
      ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site' ||
      ($origin && $originHost !== ($_SERVER['HTTP_HOST'] ?? ''))
    ) {
      stop(403, 'Cross-site requests are not allowed.');
    }
    if (!str_starts_with($_SERVER['CONTENT_TYPE'] ?? '', 'application/json')) {
      stop(415, 'Use JSON for API requests.');
    }
  }
  $body = [];
  if (in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
    $raw = file_get_contents('php://input', false, null, 0, 32001);
    if (strlen($raw) > 32000) {
      stop(413, 'Request is too large.');
    }
    $decoded = json_decode($raw ?: '{}');
    if (!is_object($decoded)) {
      stop(400, 'Invalid JSON object.');
    }
    $body = (array) $decoded;
  }
  $user = isset($_SESSION['user_id'])
    ? one('SELECT * FROM users WHERE id=?', [$_SESSION['user_id']])
    : null;
  $categories = [
    'Arts & culture',
    'Technology',
    'Sports & wellbeing',
    'Social',
    'Careers',
    'Volunteering',
  ];
  $locations = [
    'Student Commons',
    'Innovation Lab',
    'Sports Centre',
    'Main Auditorium',
    'Campus Green',
    'Library',
  ];
  $eventSelect =
    'SELECT e.*,c.name AS clubName,(SELECT COUNT(*) FROM likes WHERE event_id=e.id) AS likes,(SELECT COUNT(*) FROM registrations WHERE event_id=e.id) AS attendees FROM events e JOIN clubs c ON c.id=e.clubId';
  if ($path === '/health' && $method === 'GET') {
    respond(200, ['status' => 'ok', 'database' => $sqlite ? 'SQLite' : 'MySQL']);
  }
  if ($path === '/session' && $method === 'GET') {
    respond(200, ['user' => publicUser($user)]);
  }
  if (in_array($path, ['/register', '/login'], true) && $method === 'POST') {
    $ip = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'local');
    $window = intdiv(time(), 60);
    query('DELETE FROM login_attempts WHERE window_id<?', [$window - 2]);
    if (
      (int) one('SELECT COUNT(*) AS n FROM login_attempts WHERE ip=? AND window_id=?', [
        $ip,
        $window,
      ])['n'] >= 30
    ) {
      stop(429, 'Too many attempts. Try again in a minute.');
    }
    query('INSERT INTO login_attempts(ip,window_id) VALUES(?,?)', [$ip, $window]);
    $email = strtolower(value($body['email'] ?? ''));
    $password = $body['password'] ?? '';
    if (!is_string($password) || strlen($password) > 128) {
      stop(422, 'Use a password of at most 128 characters.');
    }
    if ($path === '/register') {
      $name = value($body['name'] ?? '');
      if (
        strlen($name) < 2 ||
        strlen($name) > 80 ||
        !filter_var($email, FILTER_VALIDATE_EMAIL) ||
        strlen($email) > 254 ||
        strlen($password) < 10
      ) {
        stop(422, 'Check your name, email, and password (10–128 characters).');
      }
      if (one('SELECT id FROM users WHERE email=?', [$email])) {
        stop(409, 'This email is already registered.');
      }
      query('INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)', [
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        'student',
      ]);
      $account = one('SELECT * FROM users WHERE id=?', [$db->lastInsertId()]);
    } else {
      $account = one('SELECT * FROM users WHERE email=?', [$email]);
      if (!$account || !password_verify($password, $account['password'])) {
        stop(401, 'Email or password is incorrect.');
      }
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $account['id'];
    respond($path === '/register' ? 201 : 200, ['user' => publicUser($account)]);
  }
  if ($path === '/logout' && $method === 'POST') {
    $_SESSION = [];
    session_destroy();
    setcookie(session_name(), '', [
      'expires' => time() - 3600,
      'path' => '/',
      'httponly' => true,
      'samesite' => 'Lax',
    ]);
    respond(200, ['ok' => true]);
  }
  if ($path === '/me' && $method === 'GET') {
    auth($user);
    $ids = fn($table, $field) => array_map(
      'intval',
      array_column(rows("SELECT $field FROM $table WHERE user_id=?", [$user['id']]), $field),
    );
    respond(200, [
      'user' => publicUser($user),
      'liked' => $ids('likes', 'event_id'),
      'registered' => $ids('registrations', 'event_id'),
      'clubs' => $ids('memberships', 'club_id'),
    ]);
  }
  if ($path === '/events' && $method === 'GET') {
    respond(200, array_map('normalized', rows($eventSelect . ' ORDER BY e.date,e.time')));
  }
  if ($path === '/clubs' && $method === 'GET') {
    respond(
      200,
      array_map(
        'normalized',
        rows(
          'SELECT c.*,(SELECT COUNT(*) FROM memberships WHERE club_id=c.id) AS members FROM clubs c ORDER BY c.name',
        ),
      ),
    );
  }
  $matched = preg_match('#^/(events|clubs)/(\d+)$#', $path, $m);
  if ($matched && $method === 'GET') {
    $row = one(
      $m[1] === 'events' ? $eventSelect . ' WHERE e.id=?' : 'SELECT * FROM clubs WHERE id=?',
      [(int) $m[2]],
    );
    if (!$row) {
      stop(404, 'Content not found.');
    }
    respond(200, normalized($row));
  }
  if (
    (in_array($path, ['/events', '/clubs'], true) && $method === 'POST') ||
    ($matched && in_array($method, ['PUT', 'DELETE'], true))
  ) {
    organizer($user);
    $type = $matched ? $m[1] : substr($path, 1);
    $id = $matched ? (int) $m[2] : null;
    if ($id) {
      $row = one("SELECT * FROM $type WHERE id=?", [$id]);
      if (!$row) {
        stop(404, 'Content not found.');
      }
      owns($user, $row);
    }
    if ($method === 'DELETE') {
      if ($type === 'clubs' && one('SELECT id FROM events WHERE clubId=?', [$id])) {
        stop(409, 'Move or delete this club’s events before deleting the club.');
      }
      query("DELETE FROM $type WHERE id=?", [$id]);
      respond(200, ['ok' => true]);
    }
    if ($type === 'events') {
      $item = [
        'title' => value($body['title'] ?? ''),
        'clubId' => (int) ($body['clubId'] ?? 0),
        'category' => value($body['category'] ?? ''),
        'date' => value($body['date'] ?? ''),
        'time' => value($body['time'] ?? ''),
        'location' => value($body['location'] ?? ''),
        'price' => $body['price'] ?? null,
        'capacity' => $body['capacity'] ?? null,
        'description' => value($body['description'] ?? ''),
        'artwork' => value($body['artwork'] ?? 'art'),
      ];
      $date = DateTimeImmutable::createFromFormat('!Y-m-d', $item['date']);
      if (
        strlen($item['title']) < 5 ||
        strlen($item['title']) > 100 ||
        !one('SELECT id FROM clubs WHERE id=?', [$item['clubId']]) ||
        !in_array($item['category'], $categories, true) ||
        !in_array($item['location'], $locations, true) ||
        !$date ||
        $date->format('Y-m-d') !== $item['date'] ||
        !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $item['time']) ||
        !is_numeric($item['price']) ||
        $item['price'] < 0 ||
        $item['price'] > 10000 ||
        filter_var($item['capacity'], FILTER_VALIDATE_INT) === false ||
        $item['capacity'] < 1 ||
        $item['capacity'] > 10000 ||
        strlen($item['description']) < 30 ||
        strlen($item['description']) > 5000 ||
        !in_array($item['artwork'], ['art', 'tech', 'sport', 'social', 'career', 'green'], true)
      ) {
        stop(422, 'Check all event fields, date, time, price, capacity, and description.');
      }
      if (
        $id &&
        $item['capacity'] <
          (int) one('SELECT COUNT(*) AS n FROM registrations WHERE event_id=?', [$id])['n']
      ) {
        stop(409, 'Capacity cannot be below the number of registrations.');
      }
      $item['price'] = (float) $item['price'];
      $item['capacity'] = (int) $item['capacity'];
    } else {
      $item = [
        'name' => value($body['name'] ?? ''),
        'category' => value($body['category'] ?? ''),
        'initials' => strtoupper(value($body['initials'] ?? '')),
        'color' => value($body['color'] ?? ''),
        'description' => value($body['description'] ?? ''),
        'contact' => value($body['contact'] ?? ''),
      ];
      if (
        strlen($item['name']) < 3 ||
        strlen($item['name']) > 80 ||
        !in_array($item['category'], $categories, true) ||
        !preg_match('/^[A-Z0-9]{1,3}$/', $item['initials']) ||
        !in_array($item['color'], ['peach', 'lavender', 'lime', 'pink', 'blue', 'mint'], true) ||
        strlen($item['description']) < 30 ||
        strlen($item['description']) > 5000 ||
        !filter_var($item['contact'], FILTER_VALIDATE_EMAIL) ||
        strlen($item['contact']) > 254
      ) {
        stop(422, 'Check all club fields and use a valid contact email.');
      }
    }
    $fields = array_keys($item);
    if ($id) {
      query(
        "UPDATE $type SET " . implode(',', array_map(fn($k) => "$k=?", $fields)) . ' WHERE id=?',
        [...array_values($item), $id],
      );
    } else {
      query(
        "INSERT INTO $type(" .
          implode(',', $fields) .
          ',owner_id) VALUES(' .
          implode(',', array_fill(0, count($fields) + 1, '?')) .
          ')',
        [...array_values($item), $user['id']],
      );
      $id = (int) $db->lastInsertId();
    }
    respond($method === 'POST' ? 201 : 200, ['id' => $id, ...$item]);
  }
  if (
    preg_match('#^/events/(\d+)/(like|registration)$#', $path, $m) &&
    in_array($method, ['POST', 'DELETE'], true)
  ) {
    auth($user);
    $id = (int) $m[1];
    $table = $m[2] === 'like' ? 'likes' : 'registrations';
    // Lock the event before checking capacity, including across PHP workers.
    if ($sqlite) {
      $db->exec('BEGIN IMMEDIATE');
    } else {
      $db->beginTransaction();
    }
    $e = one('SELECT * FROM events WHERE id=?' . ($sqlite ? '' : ' FOR UPDATE'), [$id]);
    if (!$e) {
      $sqlite ? $db->exec('ROLLBACK') : $db->rollBack();
      stop(404, 'Event not found.');
    }
    $existing = one("SELECT * FROM $table WHERE user_id=? AND event_id=?", [$user['id'], $id]);
    if ($method === 'POST' && !$existing) {
      if ($table === 'registrations' && strtotime($e['date'] . ' ' . $e['time']) < time()) {
        $sqlite ? $db->exec('ROLLBACK') : $db->rollBack();
        stop(409, 'Registration has closed for this event.');
      }
      if (
        $table === 'registrations' &&
        (int) one('SELECT COUNT(*) AS n FROM registrations WHERE event_id=?', [$id])['n'] >=
          (int) $e['capacity']
      ) {
        $sqlite ? $db->exec('ROLLBACK') : $db->rollBack();
        stop(409, 'This event is full.');
      }
      query("INSERT INTO $table(user_id,event_id) VALUES(?,?)", [$user['id'], $id]);
    } elseif ($method === 'DELETE') {
      query("DELETE FROM $table WHERE user_id=? AND event_id=?", [$user['id'], $id]);
    }
    $sqlite ? $db->exec('COMMIT') : $db->commit();
    respond(200, ['ok' => true]);
  }
  if (
    preg_match('#^/clubs/(\d+)/membership$#', $path, $m) &&
    in_array($method, ['POST', 'DELETE'], true)
  ) {
    auth($user);
    $id = (int) $m[1];
    if (!one('SELECT id FROM clubs WHERE id=?', [$id])) {
      stop(404, 'Club not found.');
    }
    if ($method === 'POST') {
      query(
        ($sqlite ? 'INSERT OR IGNORE' : 'INSERT IGNORE') .
          ' INTO memberships(user_id,club_id) VALUES(?,?)',
        [$user['id'], $id],
      );
    } else {
      query('DELETE FROM memberships WHERE user_id=? AND club_id=?', [$user['id'], $id]);
    }
    respond(200, ['ok' => true]);
  }
  stop(404, 'API endpoint not found.');
} catch (Throwable $e) {
  error_log((string) $e);
  respond(500, [
    'message' =>
      'The server could not complete the request. Check the private configuration and server log.',
  ]);
}
