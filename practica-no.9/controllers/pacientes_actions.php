<?php

require_once __DIR__ . '/../config/bd_huevos.php';

/**
 * Valida y sanitiza los datos de entrada de un paciente
 * @param array $datos Datos del formulario
 * @return array ['valido' => bool, 'errores' => array, 'datos' => array]
 */
function validar_datos_paciente($datos) {
  $errores = [];
  $datos_limpios = [];
  
  // Validar campos obligatorios
  if (empty(trim($datos['nombres'] ?? ''))) {
    $errores[] = 'El campo Nombres es obligatorio.';
  } else {
    $datos_limpios['nombres'] = trim($datos['nombres']);
    if (strlen($datos_limpios['nombres']) > 100) {
      $errores[] = 'El campo Nombres no puede exceder 100 caracteres.';
    }
  }
  
  if (empty(trim($datos['apellidos'] ?? ''))) {
    $errores[] = 'El campo Apellidos es obligatorio.';
  } else {
    $datos_limpios['apellidos'] = trim($datos['apellidos']);
    if (strlen($datos_limpios['apellidos']) > 100) {
      $errores[] = 'El campo Apellidos no puede exceder 100 caracteres.';
    }
  }
  
  // Validar sexo (opcional pero debe ser válido si se proporciona)
  $sexo = trim($datos['sexo'] ?? '');
  if (!empty($sexo) && !in_array($sexo, ['F', 'M', 'O'])) {
    $errores[] = 'El valor de Sexo no es válido.';
  }
  $datos_limpios['sexo'] = $sexo ?: null;
  
  // Validar fecha de nacimiento (opcional pero debe ser válida)
  $fecha_nac = trim($datos['fecha_nacimiento'] ?? '');
  if (!empty($fecha_nac)) {
    $fecha_obj = DateTime::createFromFormat('Y-m-d', $fecha_nac);
    if (!$fecha_obj || $fecha_obj->format('Y-m-d') !== $fecha_nac) {
      $errores[] = 'La fecha de nacimiento no es válida.';
    } else {
      // Verificar que no sea una fecha futura
      if ($fecha_obj > new DateTime()) {
        $errores[] = 'La fecha de nacimiento no puede ser futura.';
      }
    }
  }
  $datos_limpios['fecha_nacimiento'] = $fecha_nac ?: null;
  
  // Validar teléfono (opcional pero debe tener formato válido)
  $telefono = trim($datos['telefono'] ?? '');
  if (!empty($telefono)) {
    // Permitir números, espacios, guiones y paréntesis
    if (!preg_match('/^[\d\s\-\(\)\+]+$/', $telefono)) {
      $errores[] = 'El formato del teléfono no es válido.';
    }
    if (strlen($telefono) > 20) {
      $errores[] = 'El teléfono no puede exceder 20 caracteres.';
    }
  }
  $datos_limpios['telefono'] = $telefono ?: null;
  
  // Validar email (opcional pero debe ser válido)
  $email = trim($datos['email'] ?? '');
  if (!empty($email)) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
      $errores[] = 'El formato del email no es válido.';
    }
    if (strlen($email) > 150) {
      $errores[] = 'El email no puede exceder 150 caracteres.';
    }
  }
  $datos_limpios['email'] = $email ?: null;
  
  // Sanitizar y validar longitud de campos de texto
  $campos_texto = [
    'direccion' => 200,
    'ciudad' => 100,
    'estado' => 100,
    'cp' => 10,
    'tipo_sangre' => 10,
    'alergias' => 500,
    'notas' => 1000
  ];
  
  foreach ($campos_texto as $campo => $max_longitud) {
    $valor = trim($datos[$campo] ?? '');
    if (strlen($valor) > $max_longitud) {
      $errores[] = "El campo " . ucfirst(str_replace('_', ' ', $campo)) . " no puede exceder {$max_longitud} caracteres.";
    }
    $datos_limpios[$campo] = $valor ?: null;
  }
  
  // Validar prioridad
  $prioridad = trim($datos['prioridad'] ?? 'Baja');
  if (!in_array($prioridad, ['Baja', 'Media', 'Alta', 'Crítica'])) {
    $prioridad = 'Baja';
  }
  $datos_limpios['prioridad'] = $prioridad;
  
  return [
    'valido' => empty($errores),
    'errores' => $errores,
    'datos' => $datos_limpios
  ];
}

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
      
      // Validar datos de entrada
      $validacion = validar_datos_paciente($_POST);
      if (!$validacion['valido']) {
        return ['ok' => false, 'error' => implode(' ', $validacion['errores'])];
      }
      
      $datos = $validacion['datos'];
      $upd = 'UPDATE pacientes SET nombres=:nombres, apellidos=:apellidos, sexo=:sexo, fecha_nacimiento=:fecha_nacimiento, telefono=:telefono, email=:email, direccion=:direccion, ciudad=:ciudad, estado=:estado, cp=:cp, prioridad=:prioridad, tipo_sangre=:tipo_sangre, alergias=:alergias, notas=:notas WHERE paciente_id = :id';
      $sentencia = $bd->prepare($upd);
      $sentencia->bindValue(':nombres', $datos['nombres']);
      $sentencia->bindValue(':apellidos', $datos['apellidos']);
      $sentencia->bindValue(':sexo', $datos['sexo']);
      $sentencia->bindValue(':fecha_nacimiento', $datos['fecha_nacimiento']);
      $sentencia->bindValue(':telefono', $datos['telefono']);
      $sentencia->bindValue(':email', $datos['email']);
      $sentencia->bindValue(':direccion', $datos['direccion']);
      $sentencia->bindValue(':ciudad', $datos['ciudad']);
      $sentencia->bindValue(':estado', $datos['estado']);
      $sentencia->bindValue(':cp', $datos['cp']);
      $sentencia->bindValue(':prioridad', $datos['prioridad']);
      $sentencia->bindValue(':tipo_sangre', $datos['tipo_sangre']);
      $sentencia->bindValue(':alergias', $datos['alergias']);
      $sentencia->bindValue(':notas', $datos['notas']);
      $sentencia->bindValue(':id', $id, PDO::PARAM_INT);
  $sentencia->execute();
  // registrar bitacora (usuario_id por ahora null)
  registrar_bitacora_pdo($bd, null, 'UPDATE', 'pacientes', $id, 'Paciente editado');
  return ['ok'=>true, 'mensaje' => 'Paciente actualizado correctamente.'];
    }
    // crear
    // Validar datos de entrada
    $validacion = validar_datos_paciente($_POST);
    if (!$validacion['valido']) {
      return ['ok' => false, 'error' => implode(' ', $validacion['errores'])];
    }
    
    $datos = $validacion['datos'];
  $ins = 'INSERT INTO pacientes (nombres, apellidos, sexo, fecha_nacimiento, telefono, email, direccion, ciudad, estado, cp, prioridad, tipo_sangre, alergias, notas) VALUES (:nombres, :apellidos, :sexo, :fecha_nacimiento, :telefono, :email, :direccion, :ciudad, :estado, :cp, :prioridad, :tipo_sangre, :alergias, :notas)';
  $sentencia = $bd->prepare($ins);
  $sentencia->bindValue(':nombres', $datos['nombres']);
  $sentencia->bindValue(':apellidos', $datos['apellidos']);
  $sentencia->bindValue(':sexo', $datos['sexo']);
  $sentencia->bindValue(':fecha_nacimiento', $datos['fecha_nacimiento']);
  $sentencia->bindValue(':telefono', $datos['telefono']);
  $sentencia->bindValue(':email', $datos['email']);
  $sentencia->bindValue(':direccion', $datos['direccion']);
  $sentencia->bindValue(':ciudad', $datos['ciudad']);
  $sentencia->bindValue(':estado', $datos['estado']);
  $sentencia->bindValue(':cp', $datos['cp']);
  $sentencia->bindValue(':prioridad', $datos['prioridad']);
  $sentencia->bindValue(':tipo_sangre', $datos['tipo_sangre']);
  $sentencia->bindValue(':alergias', $datos['alergias']);
  $sentencia->bindValue(':notas', $datos['notas']);
  $sentencia->execute();
  $id_nuevo = $bd->lastInsertId();
  // registrar bitacora
  registrar_bitacora_pdo($bd, null, 'INSERT', 'pacientes', $id_nuevo, 'Paciente creado');
  return ['ok'=>true, 'mensaje' => 'Paciente guardado correctamente.'];
  } catch(PDOException $e){
    // Mejorar mensaje de error para duplicados
    $mensaje_error = $e->getMessage();
    if (strpos($mensaje_error, 'Duplicate entry') !== false) {
      if (strpos($mensaje_error, 'email') !== false) {
        $mensaje_error = 'El email ingresado ya está registrado en el sistema. Por favor use un email diferente.';
      }
    }
    return ['ok' => false, 'error' => $mensaje_error];
  }
}

// aqui listamos los pacientes pero filtramos segun el rol del usuario
// si es medico solo ve sus pacientes, si es admin ve todos
function listar_pacientes($limit = 200){
  $bd = obtener_conexion();
  if(!$bd) return ['error' => 'No se pudo conectar a la BD.'];
  
  try{
    // aqui obtenemos el usuario actual de la sesion
    // verificamos si la sesion ya esta iniciada antes de llamar session_start
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $usuario_rol = $_SESSION['usuario_rol'] ?? null;
    $usuario_id = $_SESSION['usuario_id'] ?? null;
    
    // si es medico necesitamos su medico_id para filtrar
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
    
    // aqui armamos la consulta segun el rol
    if ($usuario_rol === 'medico' && $medico_id) {
      // el medico solo ve pacientes que tiene asignados
      $sql = 'SELECT DISTINCT p.paciente_id, p.nombres, p.apellidos, p.sexo, p.fecha_nacimiento, p.telefono, p.email, p.ciudad, p.prioridad 
              FROM pacientes p
              LEFT JOIN citas c ON p.paciente_id = c.paciente_id
              WHERE c.medico_id = :medico_id OR p.paciente_id IN (
                SELECT paciente_id FROM citas WHERE medico_id = :medico_id
              )
              ORDER BY p.paciente_id DESC LIMIT :lim';
      $sentencia = $bd->prepare($sql);
      $sentencia->bindValue(':medico_id', $medico_id, PDO::PARAM_INT);
      $sentencia->bindValue(':lim', (int)$limit, PDO::PARAM_INT);
    } else {
      // el admin o secretaria ven todos los pacientes
      $sql = 'SELECT paciente_id, nombres, apellidos, sexo, fecha_nacimiento, telefono, email, ciudad, prioridad FROM pacientes ORDER BY paciente_id DESC LIMIT :lim';
      $sentencia = $bd->prepare($sql);
      $sentencia->bindValue(':lim', (int)$limit, PDO::PARAM_INT);
    }
    
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
