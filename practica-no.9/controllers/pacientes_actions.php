<?php

require_once __DIR__ . '/../config/bd_huevos.php';
function procesar_post_pacientes(){
  require_once __DIR__ . '/bitacoras_helpers.php';
  $bd = obtener_conexion();
  if(!$bd) return ['error' => 'No se pudo conectar a la BD.'];

  if($_SERVER['REQUEST_METHOD'] !== 'POST') return ['ok'=>true];

  $accion = $_POST['accion'] ?? 'crear';
  try{
    if($accion === 'eliminar'){
      $id = (int)($_POST['id'] ?? 0);
      // comprobar si el paciente tiene citas asociadas
      $check = $bd->prepare('SELECT COUNT(*) AS cnt FROM citas WHERE paciente_id = :id');
      $check->bindValue(':id', $id, PDO::PARAM_INT);
      $check->execute();
      $fila = $check->fetch();
      if($fila && isset($fila['cnt']) && (int)$fila['cnt'] > 0){
        return ['ok'=>false, 'error' => 'No se puede eliminar el paciente: tiene citas registradas.'];
      }
      $sentencia = $bd->prepare('DELETE FROM pacientes WHERE paciente_id = :id LIMIT 1');
      $sentencia->bindValue(':id', $id, PDO::PARAM_INT);
      $sentencia->execute();
      return ['ok'=>true, 'mensaje' => 'Paciente eliminado correctamente.'];
    }
    // editar
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
  // registrar bitacora (usuario_id por ahora null)
  registrar_bitacora_pdo($bd, null, 'UPDATE', 'pacientes', $id, 'Paciente editado');
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
  $id_nuevo = $bd->lastInsertId();
  // registrar bitacora
  registrar_bitacora_pdo($bd, null, 'INSERT', 'pacientes', $id_nuevo, 'Paciente creado');
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

// Lista de especialidades para la vista de pacientes
function listar_especialidades(){
  $bd = obtener_conexion();
  if(!$bd) return [];
  try{
    $sql = 'SELECT especialidad_id, nombre as nombre_especialidad FROM especialidades ORDER BY nombre';
    $stmt = $bd->query($sql);
    $filas = $stmt->fetchAll();
    return $filas ?: [];
  } catch(PDOException $e){
    return [];
  }
}

// Lista de médicos para la vista de pacientes
function listar_medicos(){
  $bd = obtener_conexion();
  if(!$bd) return [];
  try{
    $sql = 'SELECT medico_id, nombres, apellidos FROM medicos WHERE activo = 1 ORDER BY apellidos, nombres';
    $stmt = $bd->query($sql);
    $filas = $stmt->fetchAll();
    return $filas ?: [];
  } catch(PDOException $e){
    return [];
  }
}
