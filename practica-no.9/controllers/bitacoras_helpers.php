<?php
// Helpers simples para registrar bitácoras usando PDO o mysqli
require_once __DIR__ . '/../config/bd_huevos.php';

function registrar_bitacora_pdo($bd, $usuario_id, $accion, $tabla, $registro_id = null, $detalles = null){
  if(!$bd) return false;
  try{
    $sql = 'INSERT INTO bitacoras_usuarios (usuario_id, accion, tabla_afectada, registro_id, detalles) VALUES (:usuario_id, :accion, :tabla, :registro_id, :detalles)';
    $stmt = $bd->prepare($sql);
    $stmt->bindValue(':usuario_id', $usuario_id ?: null, PDO::PARAM_INT);
    $stmt->bindValue(':accion', $accion);
    $stmt->bindValue(':tabla', $tabla);
    $stmt->bindValue(':registro_id', $registro_id ?: null, PDO::PARAM_INT);
    $stmt->bindValue(':detalles', $detalles ?: null);
    $stmt->execute();
    return true;
  } catch(Exception $e){
    return false;
  }
}

function registrar_bitacora_mysqli($conexion, $usuario_id, $accion, $tabla, $registro_id = null, $detalles = null){
  if(!$conexion) return false;
  try{
    $stmt = $conexion->prepare('INSERT INTO bitacoras_usuarios (usuario_id, accion, tabla_afectada, registro_id, detalles) VALUES (?, ?, ?, ?, ?)');
    $registro_id_val = $registro_id ? $registro_id : null;
    $stmt->bind_param('issis', $usuario_id, $accion, $tabla, $registro_id_val, $detalles);
    $stmt->execute();
    $stmt->close();
    return true;
  } catch(Exception $e){
    return false;
  }
}

?>
