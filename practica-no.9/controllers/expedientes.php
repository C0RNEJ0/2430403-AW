<?php
// Controlador simple de expedientes
// Esto llama a la conexion
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/pacientes_actions.php';

// Esto configura el json
header('Content-Type: application/json; charset=utf-8');

// Aqui conectamos a la base
$bd = obtener_conexion();
if(!$bd){ echo json_encode(['exito'=>false,'error'=>'Sin conexion BD']); exit; }

// Obtenemos lo que vamos a buscar
$buscar = trim($_GET['buscar'] ?? '');
if($buscar === ''){ echo json_encode(['exito'=>false,'error'=>'No se indico paciente']); exit; }

try{
  // Si viene un numero buscamos por id
  if(ctype_digit($buscar)){
    // Preparamos la consulta por id
    $sql = 'SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE p.paciente_id = :id ORDER BY c.creado_en DESC';
    $stmt = $bd->prepare($sql);
    $stmt->bindValue(':id', (int)$buscar, PDO::PARAM_INT);
    $stmt->execute();
    $datos = $stmt->fetchAll();
    // Devolvemos los datos
    echo json_encode(['exito'=>true,'datos'=>$datos]); exit;
  } else {
    // Si no es numero buscamos por nombre
    $sql = "SELECT c.cita_id, p.nombres, p.apellidos, c.motivo, c.creado_en AS fecha, c.notas FROM citas c JOIN pacientes p ON p.paciente_id = c.paciente_id WHERE CONCAT(p.nombres,' ',p.apellidos) LIKE :q ORDER BY c.creado_en DESC";
    $stmt = $bd->prepare($sql);
    $stmt->bindValue(':q', '%'.$buscar.'%');
    $stmt->execute();
    $datos = $stmt->fetchAll();
    // Devolvemos los datos encontrados
    echo json_encode(['exito'=>true,'datos'=>$datos]); exit;
  }
} catch(Exception $e){ echo json_encode(['exito'=>false,'error'=>$e->getMessage()]); }

?>
