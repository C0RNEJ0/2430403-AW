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
      $stmt = $conexion->prepare('DELETE FROM medicos WHERE medico_id = ? LIMIT 1');
      $stmt->bind_param('i', $id);
      $stmt->execute();
      $stmt->close();
      $mensaje_exito = 'Médico eliminado.';
    } else {
      $id = (int)($_POST['id'] ?? 0);
      $nombre = trim($_POST['nombre'] ?? '');
      $especialidad_text = trim($_POST['especialidad'] ?? '');
      $horario = trim($_POST['horario'] ?? '');
      $email = trim($_POST['email'] ?? '');

      // validaciones servidor
      if ($nombre === '') {
        $mensaje_error = 'El nombre del médico no puede estar vacío.';
        header('Location: ../views/medicos.html?err=' . urlencode($mensaje_error));
        exit;
      }
      if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mensaje_error = 'El email del médico no es válido.';
        header('Location: ../views/medicos.html?err=' . urlencode($mensaje_error));
        exit;
      }

      // buscar id de especialidad por nombre 
      $especialidad_id = null;
      if ($especialidad_text !== '') {
        $s = $conexion->prepare('SELECT especialidad_id FROM especialidades WHERE nombre = ? LIMIT 1');
        $s->bind_param('s', $especialidad_text);
        $s->execute();
        $res = $s->get_result();
        if ($row = $res->fetch_assoc()) {
          $especialidad_id = (int)$row['especialidad_id'];
        }
        $s->close();
      }

      if ($id > 0) {
        // usamos NULLIF para que una cadena vacía se convierta en NULL y no viole UNIQUE
        $stmt = $conexion->prepare('UPDATE medicos SET nombre = ?, email = NULLIF(?, \'\'), telefono = NULL, cedula_profesional = NULL, especialidad_id = ?, horario = ? WHERE medico_id = ?');
        $stmt->bind_param('ssisi', $nombre, $email, $especialidad_id, $horario, $id);
      } else {
        // INSERT con NULLIF para email
        $stmt = $conexion->prepare('INSERT INTO medicos (nombre, email, telefono, cedula_profesional, especialidad_id, horario, activo) VALUES (?, NULLIF(?, \'\'), NULL, NULL, ?, ?, 1)');
        $stmt->bind_param('ssis', $nombre, $email, $especialidad_id, $horario);
      }
      $stmt->execute();
      // manejar clave duplicada (errno 1062)
      if ($stmt->errno === 1062) {
        // Si es duplicado en email, dar mensaje claro
        $mensaje_error = 'Error al procesar la petición: email duplicado.';
        $stmt->close();
        header('Location: ../views/medicos.html?error=' . urlencode($mensaje_error));
        exit;
      }
      if ($id > 0) $stmt->close(); else $last = $conexion->insert_id;
      $mensaje_exito = $id>0 ? 'Médico actualizado.' : 'Médico guardado.';
    }
  } catch (Exception $e) {
    $mensaje_error = 'Error al procesar la petición: ' . $e->getMessage();
  }
}

if (!empty($mensaje_exito)) {
  header('Location: ../views/medicos.html?exito=' . urlencode($mensaje_exito));
  exit;
}
if (!empty($mensaje_error)) {
  header('Location: ../views/medicos.html?error=' . urlencode($mensaje_error));
  exit;
}
?>
