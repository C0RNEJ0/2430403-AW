<?php
$dbHost = '127.0.0.1';
$dbName = 'examen';
$dbUser = 'admin';
$dbPass = 'e8d0055b61beef5a1681ee280703da98497636b40340afca';

$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    exit('Error de conexión: ' . $e->getMessage());
}

