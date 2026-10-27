<?php
// Place at ~/campus-private/config.php, outside ~/public_html.
return [
  'dsn' => 'sqlite:' . __DIR__ . '/campus.sqlite',
  // Alternative when Mercury provides MySQL instead of PDO SQLite:
  // 'dsn'=>'mysql:host=localhost;dbname=YOUR_DATABASE;charset=utf8mb4',
  // 'username'=>'YOUR_DATABASE_USER',
  // 'password'=>'YOUR_DATABASE_PASSWORD',
];
