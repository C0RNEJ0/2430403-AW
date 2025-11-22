<?php
/**

 * Archivo único de conexión usando PDO
 */

// Configuración de la base de datos
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'admin');
define('DB_PASS', 'e8d0055b61beef5a1681ee280703da98497636b40340afca');
define('DB_NAME', 'clinica_cornejo');
define('DB_CHARSET', 'utf8mb4');

/**
 * Obtener conexión PDO a la base de datos
 * 
 * @return PDO|null Conexión PDO o null en caso de error
 */
function obtener_conexion() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Error de conexión PDO: " . $e->getMessage());
            return null;
        }
    }
    
    return $pdo;
}

/**
 * Obtener conexión MySQLi (para compatibilidad con código antiguo)
 * 
 * @return mysqli|null Conexión MySQLi o null en caso de error
 */
function obtener_conexion_mysqli() {
    static $conn = null;
    
    if ($conn === null) {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        
        if ($conn->connect_error) {
            error_log("Error de conexión MySQLi: " . $conn->connect_error);
            return null;
        }
        
        $conn->set_charset(DB_CHARSET);
    }
    
    return $conn;
}
?>
