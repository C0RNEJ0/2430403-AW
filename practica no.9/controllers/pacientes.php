<?php
$servidor   = '127.0.0.1';
$puerto     = 3306;
$basedatos  = 'clinica_cornejo';
$usuario    = 'admin';
$contrasena = 'e8d0055b61beef5a1681ee280703da98497636b40340afca';

$conexion = null;
try {
  $dsn = "mysql:host=$servidor;port=$puerto;dbname=$basedatos;charset=utf8mb4";
  $conexion = new PDO($dsn, $usuario, $contrasena, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ]);
} catch (PDOException $e) {
  $mensaje_error = 'Error de conexión: ' . $e->getMessage();
}

// manejo de formularios crear editar eliminar 
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $conexion) {
  $accion = $_POST['accion'] ?? 'crear'; // usando este campo
  try {
    if ($accion === 'eliminar') {
      // borrar paciente
      $id = (int)($_POST['id'] ?? 0);
      $s = $conexion->prepare('DELETE FROM pacientes WHERE paciente_id = :id LIMIT 1');
      $s->bindValue(':id', $id, PDO::PARAM_INT);
      $s->execute();
      $mensaje_exito = 'Paciente eliminado correctamente.';
    } elseif ($accion === 'editar') {
      // actualizar paciente
      $id = (int)($_POST['id'] ?? 0);
      $upd = 'UPDATE pacientes SET nombres=:nombres, apellidos=:apellidos, sexo=:sexo, fecha_nacimiento=:fecha_nacimiento, telefono=:telefono, email=:email, direccion=:direccion, ciudad=:ciudad, estado=:estado, cp=:cp, prioridad=:prioridad, tipo_sangre=:tipo_sangre, alergias=:alergias, notas=:notas WHERE paciente_id = :id';
      $s = $conexion->prepare($upd);
      $s->bindValue(':nombres', $_POST['nombres'] ?? null);
      $s->bindValue(':apellidos', $_POST['apellidos'] ?? null);
      $s->bindValue(':sexo', $_POST['sexo'] ?? null);
      $s->bindValue(':fecha_nacimiento', $_POST['fecha_nacimiento'] ?? null);
      $s->bindValue(':telefono', $_POST['telefono'] ?? null);
      $s->bindValue(':email', $_POST['email'] ?? null);
      $s->bindValue(':direccion', $_POST['direccion'] ?? null);
      $s->bindValue(':ciudad', $_POST['ciudad'] ?? null);
      $s->bindValue(':estado', $_POST['estado'] ?? null);
      $s->bindValue(':cp', $_POST['cp'] ?? null);
      $s->bindValue(':prioridad', $_POST['prioridad'] ?? 'Baja');
      $s->bindValue(':tipo_sangre', $_POST['tipo_sangre'] ?? null);
      $s->bindValue(':alergias', $_POST['alergias'] ?? null);
      $s->bindValue(':notas', $_POST['notas'] ?? null);
      $s->bindValue(':id', $id, PDO::PARAM_INT);
      $s->execute();
      $mensaje_exito = 'Paciente actualizado correctamente.';
    } else {
      // crear nuevo paciente
      $ins = 'INSERT INTO pacientes (nombres, apellidos, sexo, fecha_nacimiento, telefono, email, direccion, ciudad, estado, cp, prioridad, tipo_sangre, alergias, notas) VALUES (:nombres, :apellidos, :sexo, :fecha_nacimiento, :telefono, :email, :direccion, :ciudad, :estado, :cp, :prioridad, :tipo_sangre, :alergias, :notas)';
      $s = $conexion->prepare($ins);
      $s->bindValue(':nombres', $_POST['nombres'] ?? null);
      $s->bindValue(':apellidos', $_POST['apellidos'] ?? null);
      $s->bindValue(':sexo', $_POST['sexo'] ?? null);
      $s->bindValue(':fecha_nacimiento', $_POST['fecha_nacimiento'] ?? null);
      $s->bindValue(':telefono', $_POST['telefono'] ?? null);
      $s->bindValue(':email', $_POST['email'] ?? null);
      $s->bindValue(':direccion', $_POST['direccion'] ?? null);
      $s->bindValue(':ciudad', $_POST['ciudad'] ?? null);
      $s->bindValue(':estado', $_POST['estado'] ?? null);
      $s->bindValue(':cp', $_POST['cp'] ?? null);
      $s->bindValue(':prioridad', $_POST['prioridad'] ?? 'Baja');
      $s->bindValue(':tipo_sangre', $_POST['tipo_sangre'] ?? null);
      $s->bindValue(':alergias', $_POST['alergias'] ?? null);
      $s->bindValue(':notas', $_POST['notas'] ?? null);
      $s->execute();
      $mensaje_exito = 'Paciente guardado correctamente.';
    }
  } catch (PDOException $e) {
    $mensaje_error = 'Error al procesar la petición: ' . $e->getMessage();
  }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control de Pacientes</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUa6zY1hY6Y+g2bJk6QZ6Y5E6bQ2K5r5Q5Z6e9q1Q9Q" crossorigin="anonymous">
  <link rel="stylesheet" href="../assets/css/styles.css">
  <style>body{padding:20px}</style>
</head>
<body>
  <div class="top-bar">
    La vida es la Prioridad ante todo
  </div>
  <div id="aplicacion">
    <aside class="sidebar" id="barra_lateral">
      <div class="brand">
        <img src="../assets/images/CS.png" alt="CS">
        <div>
          <div style="font-weight:800;">Clínica Cornejo</div>
          <small style="opacity:0.9">Panel</small>
        </div>
      </div>
  <nav>
        <a href="../views/dashboard.html"><span class="label">Dashboard</span></a>
  <a href="pacientes.php"><span class="label">Pacientes</span></a>
        <a href="../views/agenda.html"><span class="label">Agenda</span></a>
        <a href="../views/medicos.html"><span class="label">Médicos</span></a>
        <a href="../views/reportes.html"><span class="label">Reportes</span></a>
        <a href="../views/pagos.html"><span class="label">Pagos</span></a>
        <a href="../views/tarifas.html"><span class="label">Tarifas</span></a>
        <a href="../views/bitacoras.html"><span class="label">Bitácoras</span></a>
        <a href="../views/especialidades.html"><span class="label">Especialidades</span></a>
  <a href="#" data-modal-target="#modal_logout"><span class="label">Cerrar Sesión</span></a>
      </nav>
      <div class="spacer"></div>
  <button class="toggle-btn" id="boton_colapsar">Esconder</button>
    </aside>

    <!-- Header superior con buscador y iconos -->
  <div class="page-content" id="contenido_pagina">
      <header>
        <div class="container">
          <div style="flex:1"></div>
          <div class="header-right">
            <div class="search-box">
              <input type="text" id="buscador" placeholder="Buscar">
            </div>
            <div class="icons">
            
              <a href="#" id="icono_usuario" class="icon" title="Iniciar Sesion">
                <img src="../assets/images/Login.png" alt="Login" class="icon-img">
              </a>
              <span id="usuario_email" style="margin-left:8px; font-size:0.9rem; color:#333;"></span>
            </div>
          </div>
        </div>
      </header>
      <?php
      include_once __DIR__ . '/pacientes_actions.php';

      // procesar POST usando el módulo externo
      $resultado_post = procesar_post_pacientes();
      if(isset($resultado_post['mensaje'])) $mensaje_exito = $resultado_post['mensaje'];
      if(isset($resultado_post['error'])) $mensaje_error = $resultado_post['error'];

  // usamos funciones del módulo externo para listar obtener pacientes
  ?>
      <?php if(isset($_GET['action']) && $_GET['action'] === 'nuevo') { ?>
      <section class="form-section" style="max-width:900px;">
        <h2>Nuevo Paciente</h2>
        <form method="post" action="pacientes.php">
          <input type="hidden" name="accion" value="crear">
          <h4>Información personal</h4>
          <label>Nombres</label>
          <input type="text" name="nombres" required>
          <label>Apellidos</label>
          <input type="text" name="apellidos" required>
          <label>Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento">
          <label>Género</label>
          <select name="sexo">
            <option value="">--</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
          <h4>Datos de contacto</h4>
          <label>Teléfono</label>
          <input type="tel" name="telefono">
          <label>Email</label>
          <input type="email" name="email">
          <label>Contacto de emergencia</label>
          <input type="text" name="contacto_emergencia">
          <label>Teléfono de emergencia</label>
          <input type="tel" name="telefono_emergencia">
          <h4>Información adicional</h4>
          <label>Dirección</label>
          <input type="text" name="direccion">
          <label>Ciudad</label>
          <input type="text" name="ciudad">
          <label>Estado/Provincia</label>
          <input type="text" name="estado">
          <label>Código Postal</label>
          <input type="text" name="cp">
          <label>Prioridad</label>
          <select name="prioridad">
            <option value="Baja">Baja</option>
            <option value="Media">Media</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica</option>
          </select>
          <label>Tipo de sangre</label>
          <input type="text" name="tipo_sangre">
          <label>Alergias</label>
          <textarea name="alergias" rows="2"></textarea>
          <label>Especialidad requerida</label>
          <select name="especialidad">
            <option value="">Seleccione</option>
            <option value="Urgencias">Urgencias</option>
            <option value="Cardiologia">Cardiología</option>
            <option value="Pediatria">Pediatría</option>
          </select>
          <label>Médico asignado</label>
          <input type="text" name="medico_asignado">
          <label>Notas</label>
          <textarea name="notas" rows="3"></textarea>
          <div style="margin-top:10px; text-align:center;">
            <button type="submit" class="btn-modal">Guardar paciente</button>
            <a href="pacientes.php" class="btn-modal btn-secondary" style="margin-left:8px;">Cancelar</a>
          </div>
        </form>
      </section>
      <?php
        } elseif(isset($_GET['action']) && $_GET['action'] === 'editar' && !empty($_GET['id']) && $conexion){
          // cargo el paciente para editar
          $id_ed = (int)$_GET['id'];
          $registro = obtener_paciente($id_ed);
          if($registro){
      ?>
      <section class="form-section" style="max-width:900px;">
        <h2>Editar Paciente</h2>
        <form method="post" action="pacientes.php">
          <input type="hidden" name="accion" value="editar">
          <input type="hidden" name="id" value="<?php echo (int)$registro['paciente_id']; ?>">
          <h4>Información personal</h4>
          <label>Nombres</label>
          <input type="text" name="nombres" value="<?php echo htmlspecialchars($registro['nombres']); ?>" required>
          <label>Apellidos</label>
          <input type="text" name="apellidos" value="<?php echo htmlspecialchars($registro['apellidos']); ?>" required>
          <label>Fecha de Nacimiento</label>
          <input type="date" name="fecha_nacimiento" value="<?php echo htmlspecialchars($registro['fecha_nacimiento']); ?>">
          <label>Género</label>
          <select name="sexo">
            <option value="">--</option>
            <option value="F" <?php if($registro['sexo']==='F') echo 'selected'; ?>>Femenino</option>
            <option value="M" <?php if($registro['sexo']==='M') echo 'selected'; ?>>Masculino</option>
            <option value="O" <?php if($registro['sexo']==='O') echo 'selected'; ?>>Otro</option>
          </select>
          <h4>Datos de contacto</h4>
          <label>Teléfono</label>
          <input type="tel" name="telefono" value="<?php echo htmlspecialchars($registro['telefono']); ?>">
          <label>Email</label>
          <input type="email" name="email" value="<?php echo htmlspecialchars($registro['email']); ?>">
          <label>Contacto de emergencia</label>
          <input type="text" name="contacto_emergencia" value="<?php echo htmlspecialchars($registro['contacto_emergencia'] ?? ''); ?>">
          <label>Teléfono de emergencia</label>
          <input type="tel" name="telefono_emergencia" value="<?php echo htmlspecialchars($registro['telefono_emergencia'] ?? ''); ?>">
          <h4>Información adicional</h4>
          <label>Dirección</label>
          <input type="text" name="direccion" value="<?php echo htmlspecialchars($registro['direccion']); ?>">
          <label>Ciudad</label>
          <input type="text" name="ciudad" value="<?php echo htmlspecialchars($registro['ciudad']); ?>">
          <label>Estado/Provincia</label>
          <input type="text" name="estado" value="<?php echo htmlspecialchars($registro['estado']); ?>">
          <label>Código Postal</label>
          <input type="text" name="cp" value="<?php echo htmlspecialchars($registro['cp']); ?>">
          <label>Prioridad</label>
          <select name="prioridad">
            <option value="Baja" <?php if($registro['prioridad']==='Baja') echo 'selected'; ?>>Baja</option>
            <option value="Media" <?php if($registro['prioridad']==='Media') echo 'selected'; ?>>Media</option>
            <option value="Alta" <?php if($registro['prioridad']==='Alta') echo 'selected'; ?>>Alta</option>
            <option value="Crítica" <?php if($registro['prioridad']==='Crítica') echo 'selected'; ?>>Crítica</option>
          </select>
          <label>Tipo de sangre</label>
          <input type="text" name="tipo_sangre" value="<?php echo htmlspecialchars($registro['tipo_sangre']); ?>">
          <label>Alergias</label>
          <textarea name="alergias" rows="2"><?php echo htmlspecialchars($registro['alergias']); ?></textarea>
          <label>Especialidad requerida</label>
          <select name="especialidad">
            <option value="">Seleccione</option>
            <option value="Urgencias" <?php if($registro['especialidad']==='Urgencias') echo 'selected'; ?>>Urgencias</option>
            <option value="Cardiologia" <?php if($registro['especialidad']==='Cardiologia') echo 'selected'; ?>>Cardiología</option>
            <option value="Pediatria" <?php if($registro['especialidad']==='Pediatria') echo 'selected'; ?>>Pediatría</option>
          </select>
          <label>Médico asignado</label>
          <input type="text" name="medico_asignado" value="<?php echo htmlspecialchars($registro['medico_asignado'] ?? ''); ?>">
          <label>Notas</label>
          <textarea name="notas" rows="3"><?php echo htmlspecialchars($registro['notas']); ?></textarea>
          <div style="margin-top:10px; text-align:center;">
            <button type="submit" class="btn-modal">Guardar cambios</button>
            <a href="pacientes.php" class="btn-modal btn-secondary" style="margin-left:8px;">Cancelar</a>
          </div>
        </form>
      </section>
      <?php
          } else {
            echo '<div class="alert alert-warning">Paciente no encontrado.</div>';
          }
        } else {
      ?>
      <!-- Tabla de pacientes servidor -->
      <div class="table-responsive" style="max-width:1000px;">
        <?php
        $lista = listar_pacientes(200);
        if(isset($lista['error'])){
          echo '<div class="alert alert-danger">Error al leer pacientes: '.htmlspecialchars($lista['error']).'</div>';
        } else {
          $rows = $lista;
          if(!$rows){
              echo '<div class="alert alert-info">No hay pacientes registrados.</div>';
            } else {
              echo '<table class="table table-sm table-striped">';
              echo '<thead><tr><th>Nombre</th><th>Sexo</th><th>Fecha Nac.</th><th>Teléfono</th><th>Email</th><th>Ciudad</th><th>Prioridad</th><th>Acciones</th></tr></thead>';
              echo '<tbody>';
              foreach($rows as $r){
                $nombreCompleto = htmlspecialchars($r['nombres'].' '.$r['apellidos']);
                $id = (int)$r['paciente_id'];
                echo '<tr>';
                echo '<td>'.$nombreCompleto.'</td>';
                echo '<td>'.htmlspecialchars($r['sexo']).'</td>';
                echo '<td>'.htmlspecialchars($r['fecha_nacimiento']).'</td>';
                echo '<td>'.htmlspecialchars($r['telefono']).'</td>';
                echo '<td>'.htmlspecialchars($r['email']).'</td>';
                echo '<td>'.htmlspecialchars($r['ciudad']).'</td>';
                echo '<td>'.htmlspecialchars($r['prioridad']).'</td>';
                // acciones: editar y eliminar
                echo '<td>';
                echo '<a class="btn btn-sm btn-outline-primary me-1" href="pacientes.php?action=editar&id='.$id.'">Editar</a>';
                echo '<form method="post" action="pacientes.php" style="display:inline-block; margin:0;" onsubmit="return confirm(\'Eliminar paciente?\');">';
                echo '<input type="hidden" name="accion" value="eliminar">';
                echo '<input type="hidden" name="id" value="'.$id.'">';
                echo '<button type="submit" class="btn btn-sm btn-outline-danger">Eliminar</button>';
                echo '</form>';
                echo '</td>';
                echo '</tr>';
              }
              echo '</tbody></table>';
            }
        }
        ?>
      </div>
      <?php
        }
      ?>
      
    </div>
  </div>
  <!-- Modal Confirmación Cerrar Sesión -->
  <div id="modal_logout" class="modal">
    <div class="modal-content modal-small">
      <h2>¿Cerrar sesión?</h2>
      <p>¿Estás seguro que quieres cerrar sesión?</p>
      <div class="modal-buttons">
        <button id="boton_cerrar_sesion" class="btn-modal">Si, cerrar</button>
        <button id="boton_cancelar_cerrar_sesion" class="btn-modal btn-secondary" data-modal-close>No</button>
      </div>
    </div>
  </div>
  <script src="../assets/js/sidebar.js"></script>
  <!-- Modal Agendamiento -->
  <div id="modal_agendar" class="modal">
    <div class="modal-content modal-small">
      <h2>Agendar Cita</h2>
      <form id="form_agendar">
        <input type="hidden" id="ag_paciente_id">
        <label>Especialidad</label>
        <input id="ag_especialidad" type="text" readonly>
        <label>Fecha</label>
        <input id="ag_fecha" type="date" required>
        <label>Hora</label>
        <input id="ag_hora" type="time" required>
        <label>Médico disponible</label>
        <select id="ag_medico_select" required>
          <option value="">Selecciona un médico</option>
        </select>
        <div style="margin-top:12px; text-align:center;">
          <button type="submit" class="btn-modal">Reservar</button>
          <button type="button" class="btn-modal btn-secondary" data-modal-close>Cancelar</button>
        </div>
      </form>
    </div>
  </div>
</body>
</html>
