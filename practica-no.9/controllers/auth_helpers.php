<?php
// Helpers  de auth por sesión 
require_once __DIR__ . '/../config/bd_huevos.php';
session_start();

function usuario_actual(){
  if(isset($_SESSION['usuario_id'])){
    $bd = obtener_conexion();
    if(!$bd) return null;
    $stmt = $bd->prepare('SELECT usuario_id, nombre, email, rol_id FROM usuarios WHERE usuario_id = :id LIMIT 1');
    $stmt->bindValue(':id', (int)$_SESSION['usuario_id'], PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetch() ?: null;
  }
  return null;
}

function require_rol($roles){
  // $roles puede ser int o array
  $u = usuario_actual();
  if(!$u) { http_response_code(401); echo json_encode(['exito'=>false,'error'=>'No autenticado']); exit; }
  $r = (array)$roles; if(!in_array((int)$u['rol_id'], $r)) { http_response_code(403); echo json_encode(['exito'=>false,'error'=>'Sin permiso']); exit; }
  return $u;
}

?>
