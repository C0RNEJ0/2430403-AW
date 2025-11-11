<?php

function obtener_conexion(){
  $servidor   = '165.227.25.15';
  $puerto     = 3306;
  $basedatos  = 'clinica_cornejo';
  $usuario    = 'admin';
  $contrasena = 'e8d0055b61beef5a1681ee280703da98497636b40340afca';

  try{
    $dsn = "mysql:host=$servidor;port=$puerto;dbname=$basedatos;charset=utf8mb4";
    $conexion = new PDO($dsn, $usuario, $contrasena, [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
    ]);
  return $conexion;
  } catch(PDOException $e){
    return null;
  }
}

function procesar_post_pacientes(){
  $bd = obtener_conexion();
  if(!$bd) return ['error' => 'No se pudo conectar a la BD.'];

  if($_SERVER['REQUEST_METHOD'] !== 'POST') return ['ok'=>true];

  $accion = $_POST['accion'] ?? 'crear';
  try{
    if($accion === 'eliminar'){
      $id = (int)($_POST['id'] ?? 0);
      $sentencia = $bd->prepare('DELETE FROM pacientes WHERE paciente_id = :id LIMIT 1');
      $sentencia->bindValue(':id', $id, PDO::PARAM_INT);
      $sentencia->execute();
      return ['ok'=>true, 'mensaje' => 'Paciente eliminado correctamente.'];
    }
    if($accion === 'editar'){
      $id = (int)($_POST['id'] ?? 0);
      $upd = 'UPDATE pacientes SET nombres=:nombres, apellidos=:apellidos, sexo=:sexo, fecha_nacimiento=:fecha_nacimiento, telefono=:telefono, email=:email, direccion=:direccion, ciudad=:ciudad, estado=:estado, cp=:cp, prioridad=:prioridad, tipo_sangre=:tipo_sangre, alergias=:alergias, notas=:notas WHERE paciente_id = :id';
      $sentencia = $bd->prepare($upd);
      $sentencia->bindValue(':nombres', $_POST['nombres'] ?? null);
      $sentencia->bindValue(':apellidos', $_POST['apellidos'] ?? null);
      $sentencia->bindValue(':sexo', $_POST['sexo'] ?? null);
      $sentencia->bindValue(':fecha_nacimiento', $_POST['fecha_nacimiento'] ?? null);
      $sentencia->bindValue(':telefono', $_POST['telefono'] ?? null);
      $sentencia->bindValue(':email', $_POST['email'] ?? null);
      $sentencia->bindValue(':direccion', $_POST['direccion'] ?? null);
      $sentencia->bindValue(':ciudad', $_POST['ciudad'] ?? null);
      $sentencia->bindValue(':estado', $_POST['estado'] ?? null);
      $sentencia->bindValue(':cp', $_POST['cp'] ?? null);
      $sentencia->bindValue(':prioridad', $_POST['prioridad'] ?? 'Baja');
      $sentencia->bindValue(':tipo_sangre', $_POST['tipo_sangre'] ?? null);
      $sentencia->bindValue(':alergias', $_POST['alergias'] ?? null);
      $sentencia->bindValue(':notas', $_POST['notas'] ?? null);
      $sentencia->bindValue(':id', $id, PDO::PARAM_INT);
      $sentencia->execute();
      return ['ok'=>true, 'mensaje' => 'Paciente actualizado correctamente.'];
    }
    // crear
    $ins = 'INSERT INTO pacientes (nombres, apellidos, sexo, fecha_nacimiento, telefono, email, direccion, ciudad, estado, cp, prioridad, tipo_sangre, alergias, notas) VALUES (:nombres, :apellidos, :sexo, :fecha_nacimiento, :telefono, :email, :direccion, :ciudad, :estado, :cp, :prioridad, :tipo_sangre, :alergias, :notas)';
  $sentencia = $bd->prepare($ins);
  $sentencia->bindValue(':nombres', $_POST['nombres'] ?? null);
  $sentencia->bindValue(':apellidos', $_POST['apellidos'] ?? null);
  $sentencia->bindValue(':sexo', $_POST['sexo'] ?? null);
  $sentencia->bindValue(':fecha_nacimiento', $_POST['fecha_nacimiento'] ?? null);
  $sentencia->bindValue(':telefono', $_POST['telefono'] ?? null);
  $sentencia->bindValue(':email', $_POST['email'] ?? null);
  $sentencia->bindValue(':direccion', $_POST['direccion'] ?? null);
  $sentencia->bindValue(':ciudad', $_POST['ciudad'] ?? null);
  $sentencia->bindValue(':estado', $_POST['estado'] ?? null);
  $sentencia->bindValue(':cp', $_POST['cp'] ?? null);
  $sentencia->bindValue(':prioridad', $_POST['prioridad'] ?? 'Baja');
  $sentencia->bindValue(':tipo_sangre', $_POST['tipo_sangre'] ?? null);
  $sentencia->bindValue(':alergias', $_POST['alergias'] ?? null);
  $sentencia->bindValue(':notas', $_POST['notas'] ?? null);
  $sentencia->execute();
  return ['ok'=>true, 'mensaje' => 'Paciente guardado correctamente.'];
  } catch(PDOException $e){
    return ['error' => $e->getMessage()];
  }
}

// devuelve array de pacientes 
function listar_pacientes($limit = 200){
  $bd = obtener_conexion();
  if(!$bd) return ['error' => 'No se pudo conectar a la BD.'];
  try{
    $sql = 'SELECT paciente_id, nombres, apellidos, sexo, fecha_nacimiento, telefono, email, ciudad, prioridad FROM pacientes ORDER BY paciente_id DESC LIMIT :lim';
    $sentencia = $bd->prepare($sql);
    $sentencia->bindValue(':lim', (int)$limit, PDO::PARAM_INT);
    $sentencia->execute();
    $filas = $sentencia->fetchAll();
    return $filas ?: [];
  } catch(PDOException $e){
    return ['error' => $e->getMessage()];
  }
}

// devuelve un paciente por id o null
function obtener_paciente($id){
  $bd = obtener_conexion();
  if(!$bd) return null;
  try{
    $sentencia = $bd->prepare('SELECT * FROM pacientes WHERE paciente_id = :id LIMIT 1');
    $sentencia->bindValue(':id', (int)$id, PDO::PARAM_INT);
    $sentencia->execute();
    $registro = $sentencia->fetch();
    return $registro ?: null;
  } catch(PDOException $e){
    return null;
  }
}
