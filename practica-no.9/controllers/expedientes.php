<?php
// Controlador de expedientes
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/pacientes_actions.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();
if(!$bd){ echo json_encode(['exito'=>false,'error'=>'Sin conexion BD']); exit; }

// verificamos si la sesion ya esta iniciada antes de llamar session_start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$usuario_rol = $_SESSION['usuario_rol'] ?? null;
$usuario_id = $_SESSION['usuario_id'] ?? null;

// si es medico obtenemos su medico_id
$medico_id = null;
if ($usuario_rol === 'medico' && $usuario_id) {
  $stmt_medico = $bd->prepare('SELECT medico_id FROM usuarios WHERE usuario_id = :uid LIMIT 1');
  $stmt_medico->bindValue(':uid', $usuario_id, PDO::PARAM_INT);
  $stmt_medico->execute();
  $medico_data = $stmt_medico->fetch();
  if ($medico_data) {
    $medico_id = $medico_data['medico_id'];
  }
}

// Obtenemos lo que vamos a buscar
$buscar = trim($_GET['buscar'] ?? '');
if($buscar === ''){ echo json_encode(['exito'=>false,'error'=>'No se indico paciente']); exit; }

try{
  // Si viene un numero buscamos por id
  if(ctype_digit($buscar)){
    // Preparamos la consulta por id
    if ($usuario_rol === 'medico' && $medico_id) {
      // el medico solo ve expedientes de sus pacientes
      $sql = 'SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE p.paciente_id = :id AND c.medico_id = :medico_id ORDER BY c.creado_en DESC';
      $stmt = $bd->prepare($sql);
      $stmt->bindValue(':id', (int)$buscar, PDO::PARAM_INT);
      $stmt->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
    } else {
      // admin o secretaria ven todos los expedientes
      $sql = 'SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE p.paciente_id = :id ORDER BY c.creado_en DESC';
      $stmt = $bd->prepare($sql);
      $stmt->bindValue(':id', (int)$buscar, PDO::PARAM_INT);
    }
    $stmt->execute();
    $datos = $stmt->fetchAll();
    // Devolvemos los datos
    echo json_encode(['exito'=>true,'datos'=>$datos]); exit;
  } else {
    // Si no es numero buscamos por nombre
    if ($usuario_rol === 'medico' && $medico_id) {
      // el medico solo ve expedientes de sus pacientes
      $sql = "SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE CONCAT(p.nombres,' ',p.apellidos) LIKE :q AND c.medico_id = :medico_id ORDER BY c.creado_en DESC";
      $stmt = $bd->prepare($sql);
      $stmt->bindValue(':q', '%'.$buscar.'%');
      $stmt->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
    } else {
      // admin o secretaria ven todos los expedientes
      $sql = "SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE CONCAT(p.nombres,' ',p.apellidos) LIKE :q ORDER BY c.creado_en DESC";
      $stmt = $bd->prepare($sql);
      $stmt->bindValue(':q', '%'.$buscar.'%');
    }
    $stmt->execute();
    $datos = $stmt->fetchAll();
    // Devolvemos los datos encontrados
    echo json_encode(['exito'=>true,'datos'=>$datos]); exit;
  }
} catch(Exception $e){ echo json_encode(['exito'=>false,'error'=>$e->getMessage()]); }

?>
