<?php
require_once __DIR__ . '/../config/bd_huevos.php';

$mensaje_exito = '';
$mensaje_error = '';

$conexion = null;
try {
  $conexion = obtenerConexion(); // mysqli
} catch (Exception $e) {
  $mensaje_error = 'Error de conexión: ' . $e->getMessage();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $conexion) {
  $accion = $_POST['accion'] ?? 'crear';
  try {
    if ($accion === 'eliminar') {
      $id = (int)($_POST['id'] ?? 0);
      $stmt = $conexion->prepare('DELETE FROM especialidades WHERE especialidad_id = ? LIMIT 1');
      $stmt->bind_param('i', $id);
      $stmt->execute();
      $stmt->close();
      $mensaje_exito = 'Especialidad eliminada.';
    } else {
      $id = (int)($_POST['id'] ?? 0);
      $nombre = trim($_POST['nombre'] ?? '');
      $descripcion = trim($_POST['descripcion'] ?? '');

      // validaciones servidor
      if ($nombre === '') {
        $mensaje_error = 'El nombre de la especialidad no puede estar vacío.';
        // redirigir con error
        header('Location: ../views/especialidades.html?err=' . urlencode($mensaje_error));
        exit;
      }
      if ($id > 0) {
        $stmt = $conexion->prepare('UPDATE especialidades SET nombre = ?, descripcion = ? WHERE especialidad_id = ?');
        $stmt->bind_param('ssi', $nombre, $descripcion, $id);
      } else {
        $stmt = $conexion->prepare('INSERT INTO especialidades (nombre, descripcion) VALUES (?, ?)');
        $stmt->bind_param('ss', $nombre, $descripcion);
      }
      $stmt->execute();
      if ($id > 0) $stmt->close(); else $last = $conexion->insert_id;
      $mensaje_exito = $id>0 ? 'Especialidad actualizada.' : 'Especialidad guardada.';
    }
  } catch (Exception $e) {
    $mensaje_error = 'Error al procesar la petición: ' . $e->getMessage();
  }
}

if (!empty($mensaje_exito)) {
  header('Location: ../views/especialidades.html?exito=' . urlencode($mensaje_exito));
  exit;
}
if (!empty($mensaje_error)) {
  header('Location: ../views/especialidades.html?error=' . urlencode($mensaje_error));
  exit;
}
?>
