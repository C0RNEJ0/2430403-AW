<?php
/**
 * Sistema de Bitácoras y Auditoría
 * Clínica Cornejo
 */

// Prevenir acceso directo
if (!defined('BASE_PATH')) {
    define('BASE_PATH', dirname(__DIR__));
}

require_once BASE_PATH . '/config/database.php';

/**
 * Registrar acceso (login/logout/intento fallido)
 */
function registrarAcceso($usuario_id, $tipo_acceso, $detalles = null) {
    $conn = getConnection();
    
    $stmt = $conn->prepare("
        INSERT INTO bitacora_accesos 
        (usuario_id, tipo_acceso, detalles)
        VALUES (?, ?, ?)
    ");
    
    $stmt->bind_param("iss", $usuario_id, $tipo_acceso, $detalles);
    $resultado = $stmt->execute();
    $stmt->close();
    
    return $resultado;
}

/**
 * Registrar acción (crear/editar/eliminar/consultar)
 */
function registrarAccion($usuario_id, $accion, $modulo, $registro_id = null, $descripcion = null, $datos_anteriores = null, $datos_nuevos = null) {
    $conn = getConnection();
    
    // Convertir arrays a JSON si es necesario
    $datos_ant_json = is_array($datos_anteriores) ? json_encode($datos_anteriores, JSON_UNESCAPED_UNICODE) : $datos_anteriores;
    $datos_nue_json = is_array($datos_nuevos) ? json_encode($datos_nuevos, JSON_UNESCAPED_UNICODE) : $datos_nuevos;
    
    $stmt = $conn->prepare("
        INSERT INTO bitacoras_usuarios 
        (usuario_id, accion, modulo, tabla_afectada, registro_id, detalles, datos_anteriores, datos_nuevos)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        "isssisss", 
        $usuario_id, 
        $accion, 
        $modulo, 
        $modulo, // tabla_afectada = modulo
        $registro_id, 
        $descripcion,
        $datos_ant_json,
        $datos_nue_json
    );
    
    $resultado = $stmt->execute();
    $stmt->close();
    
    return $resultado;
}

/**
 * Obtener bitácora de accesos con filtros
 */
function obtenerBitacoraAccesos($filtros = []) {
    $conn = getConnection();
    
    $where = [];
    $params = [];
    $types = '';
    
    // Filtro por usuario
    if (!empty($filtros['usuario_id'])) {
        $where[] = "ba.usuario_id = ?";
        $params[] = $filtros['usuario_id'];
        $types .= 'i';
    }
    
    // Filtro por tipo de acceso
    if (!empty($filtros['tipo_acceso'])) {
        $where[] = "ba.tipo_acceso = ?";
        $params[] = $filtros['tipo_acceso'];
        $types .= 's';
    }
    
    // Filtro por fecha desde
    if (!empty($filtros['fecha_desde'])) {
        $where[] = "ba.fecha_hora >= ?";
        $params[] = $filtros['fecha_desde'];
        $types .= 's';
    }
    
    // Filtro por fecha hasta
    if (!empty($filtros['fecha_hasta'])) {
        $where[] = "ba.fecha_hora <= ?";
        $params[] = $filtros['fecha_hasta'];
        $types .= 's';
    }
    
    $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $sql = "
        SELECT 
            ba.acceso_id,
            ba.usuario_id,
            u.nombre as usuario_nombre,
            u.email as usuario_email,
            r.nombre as usuario_rol,
            ba.fecha_hora,
            ba.tipo_acceso,
            ba.detalles
        FROM bitacora_accesos ba
        INNER JOIN usuarios u ON ba.usuario_id = u.usuario_id
        INNER JOIN roles r ON u.rol_id = r.rol_id
        {$where_clause}
        ORDER BY ba.fecha_hora DESC
        LIMIT 1000
    ";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $registros = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    return $registros;
}

/**
 * Obtener bitácora de acciones con filtros
 */
function obtenerBitacoraAcciones($filtros = []) {
    $conn = getConnection();
    
    $where = [];
    $params = [];
    $types = '';
    
    // Filtro por usuario
    if (!empty($filtros['usuario_id'])) {
        $where[] = "bu.usuario_id = ?";
        $params[] = $filtros['usuario_id'];
        $types .= 'i';
    }
    
    // Filtro por acción
    if (!empty($filtros['accion'])) {
        $where[] = "bu.accion = ?";
        $params[] = $filtros['accion'];
        $types .= 's';
    }
    
    // Filtro por módulo
    if (!empty($filtros['modulo'])) {
        $where[] = "bu.modulo = ?";
        $params[] = $filtros['modulo'];
        $types .= 's';
    }
    
    // Filtro por fecha desde
    if (!empty($filtros['fecha_desde'])) {
        $where[] = "bu.creado_en >= ?";
        $params[] = $filtros['fecha_desde'];
        $types .= 's';
    }
    
    // Filtro por fecha hasta
    if (!empty($filtros['fecha_hasta'])) {
        $where[] = "bu.creado_en <= ?";
        $params[] = $filtros['fecha_hasta'];
        $types .= 's';
    }
    
    $where_clause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $sql = "
        SELECT 
            bu.bitacora_id,
            bu.usuario_id,
            u.nombre as usuario_nombre,
            u.email as usuario_email,
            r.nombre as usuario_rol,
            bu.accion,
            bu.modulo,
            bu.tabla_afectada,
            bu.registro_id,
            bu.detalles,
            bu.datos_anteriores,
            bu.datos_nuevos,
            bu.creado_en
        FROM bitacoras_usuarios bu
        INNER JOIN usuarios u ON bu.usuario_id = u.usuario_id
        INNER JOIN roles r ON u.rol_id = r.rol_id
        {$where_clause}
        ORDER BY bu.creado_en DESC
        LIMIT 1000
    ";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $registros = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    return $registros;
}

/**
 * Obtener resumen de actividad de un usuario
 */
function obtenerResumenActividad($usuario_id, $dias = 30) {
    $conn = getConnection();
    
    $fecha_desde = date('Y-m-d', strtotime("-{$dias} days"));
    
    // Contar accesos
    $stmt = $conn->prepare("
        SELECT tipo_acceso, COUNT(*) as total
        FROM bitacora_accesos
        WHERE usuario_id = ? AND fecha_hora >= ?
        GROUP BY tipo_acceso
    ");
    $stmt->bind_param("is", $usuario_id, $fecha_desde);
    $stmt->execute();
    $result = $stmt->get_result();
    $accesos = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    // Contar acciones
    $stmt = $conn->prepare("
        SELECT accion, modulo, COUNT(*) as total
        FROM bitacoras_usuarios
        WHERE usuario_id = ? AND creado_en >= ?
        GROUP BY accion, modulo
    ");
    $stmt->bind_param("is", $usuario_id, $fecha_desde);
    $stmt->execute();
    $result = $stmt->get_result();
    $acciones = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    return [
        'accesos' => $accesos,
        'acciones' => $acciones
    ];
}
