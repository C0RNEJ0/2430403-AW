<?php


require_once __DIR__ . '/bd_huevos.php';

/**
 * Obtener conexión MySQLi
 * Alias para obtener_conexion_mysqli()
 * 
 * @return mysqli|null Conexión MySQLi o null en caso de error
 */
function getConnection() {
    return obtener_conexion_mysqli();
}

/**
 * Obtener conexión PDO
 * Alias para obtener_conexion()
 * 
 * @return PDO|null Conexión PDO o null en caso de error
 */
function getPDOConnection() {
    return obtener_conexion();
}
