<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') {
  http_response_code(403);
  exit('Run setup from the command line only.');
}
$configPath = getenv('CAMPUS_CONFIG') ?: $argv[1] ?? '';
if (!$configPath || !is_file($configPath)) {
  exit("Usage: php setup.php /absolute/private/config.php\n");
}
$config = require $configPath;
$db = new PDO($config['dsn'], $config['username'] ?? null, $config['password'] ?? null, [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);
$sqlite = $db->getAttribute(PDO::ATTR_DRIVER_NAME) === 'sqlite';
$schema = file_get_contents(__DIR__ . ($sqlite ? '/schema.sqlite.sql' : '/schema.mysql.sql'));
foreach (explode(';', $schema) as $statement) {
  if (trim($statement)) {
    $db->exec($statement);
  }
}
if ($sqlite) {
  $db->exec('PRAGMA foreign_keys=ON');
}
if (!$db->query("SELECT value FROM settings WHERE `key`='seeded'")->fetchColumn()) {
  $seed = json_decode(file_get_contents(__DIR__ . '/seed.json'), true, 512, JSON_THROW_ON_ERROR);
  $db->beginTransaction();
  foreach (['clubs', 'events'] as $table) {
    foreach ($seed[$table] as $row) {
      $q = $db->prepare(
        "INSERT INTO $table(" .
          implode(',', array_keys($row)) .
          ') VALUES(' .
          implode(',', array_fill(0, count($row), '?')) .
          ')',
      );
      $q->execute(array_values($row));
    };
  }
  $db->exec("INSERT INTO settings VALUES('seeded','1')");
  $db->commit();
}
$email = getenv('CAMPUS_ADMIN_EMAIL');
$password = getenv('CAMPUS_ADMIN_PASSWORD');
if ($email && $password) {
  if (
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($password) < 10 ||
    strlen($password) > 128
  ) {
    exit("Use a valid admin email and a 10–128 character password.\n");
  }
  $q = $db->prepare('SELECT id FROM users WHERE email=?');
  $q->execute([$email]);
  if (!$q->fetchColumn()) {
    $q = $db->prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,'admin')");
    $q->execute([
      'Campus Administrator',
      strtolower($email),
      password_hash($password, PASSWORD_DEFAULT),
    ]);
    echo "Administrator created.\n";
  } else {
    echo "Admin email already exists; no role or password changed.\n";
  }
}
echo "Database ready. Upload only the built website, not this private setup folder.\n";
