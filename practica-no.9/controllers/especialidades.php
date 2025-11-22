<?php
require_once __DIR__ . '/../config/bd_huevos.php';

$bd = obtener_conexion();
$accion = $_POST['accion'] ?? '';
$mensaje_error = '';
$mensaje_exito = '';

try {
    if ($accion === 'eliminar') {
        $id = $_POST['id'] ?? 0;
        $stmt = $bd->prepare("DELETE FROM especialidades WHERE especialidad_id = ?");
        $stmt->execute([$id]);
        header('Location: ../views/especialidades.html?exito=' . urlencode('Especialidad eliminada'));
        exit;
    }

    // Crear o Actualizar
    $id = $_POST['id'] ?? 0;
    $nombre = $_POST['nombre'] ?? '';
    $descripcion = $_POST['descripcion'] ?? '';

    if (empty($nombre)) {
        throw new Exception("El nombre es obligatorio");
    }

    // Verificar duplicados
    $stmt = $bd->prepare("SELECT COUNT(*) as c FROM especialidades WHERE nombre = ? AND especialidad_id != ?");
    $stmt->execute([$nombre, $id]);
    $row = $stmt->fetch();
    
    if ($row['c'] > 0) {
        throw new Exception("Especialidad duplicada");
    }

    if ($id > 0) {
        // Actualizar
        $stmt = $bd->prepare("UPDATE especialidades SET nombre = ?, descripcion = ? WHERE especialidad_id = ?");
        $stmt->execute([$nombre, $descripcion, $id]);
        $mensaje_exito = 'Especialidad actualizada.';
    } else {
        // Insertar
        $stmt = $bd->prepare("INSERT INTO especialidades (nombre, descripcion) VALUES (?, ?)");
        $stmt->execute([$nombre, $descripcion]);
        $mensaje_exito = 'Especialidad guardada.';
    }

} catch (Exception $e) {
    $mensaje_error = 'Error: ' . $e->getMessage();
}

if (!empty($mensaje_error)) {
    header('Location: ../views/especialidades.html?error=' . urlencode($mensaje_error));
} else {
    header('Location: ../views/especialidades.html?exito=' . urlencode($mensaje_exito));
}
exit;
?>
