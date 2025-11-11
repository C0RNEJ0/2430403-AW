<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // --- DATOS DE CONEXIÓN (servidor local) ---
  $servidor   = 'localhost';  // forzamos TCP local para evitar socket
  $puerto     = 3306;
  $basedatos  = 'clinica_cornejo';
  $usuario    = 'admin';
  $contrasena = 'e8d0055b61beef5a1681ee280703da98497636b40340afca'; // pon aquí la contraseña real antes de probar

  try {
    // --- CONEXIÓN PDO ---
    $dsn = "mysql:host=$servidor;port=$puerto;dbname=$basedatos;charset=utf8mb4";
    $conexion = new PDO($dsn, $usuario, $contrasena, [
      PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    // insert preparado para la metida de huebos
    $consulta = "INSERT INTO pacientes 
      (nombres, apellidos, sexo, fecha_nacimiento, telefono, email, direccion, 
       ciudad, estado, cp, prioridad, tipo_sangre, alergias, notas)
      VALUES 
      (:nombres, :apellidos, :sexo, :fecha_nacimiento, :telefono, :email, :direccion,
       :ciudad, :estado, :cp, :prioridad, :tipo_sangre, :alergias, :notas)";

    $sentencia = $conexion->prepare($consulta);

    // Valores desde el formulario (usa null si no vienen)
    $sentencia->bindValue(':nombres',           $_POST['nombres']           ?? null);
    $sentencia->bindValue(':apellidos',         $_POST['apellidos']         ?? null);
    $sentencia->bindValue(':sexo',              $_POST['sexo']              ?? null);
    $sentencia->bindValue(':fecha_nacimiento',  $_POST['fecha_nacimiento']  ?? null);
    $sentencia->bindValue(':telefono',          $_POST['telefono']          ?? null);
    $sentencia->bindValue(':email',             $_POST['email']             ?? null);
    $sentencia->bindValue(':direccion',         $_POST['direccion']         ?? null);
    $sentencia->bindValue(':ciudad',            $_POST['ciudad']            ?? null);
    $sentencia->bindValue(':estado',            $_POST['estado']            ?? null);
    $sentencia->bindValue(':cp',                $_POST['cp']                ?? null);
    $sentencia->bindValue(':prioridad',         $_POST['prioridad']         ?? 'Baja');
    $sentencia->bindValue(':tipo_sangre',       $_POST['tipo_sangre']       ?? null);
    $sentencia->bindValue(':alergias',          $_POST['alergias']          ?? null);
    $sentencia->bindValue(':notas',             $_POST['notas']             ?? null);

    $sentencia->execute();
    $mensaje_exito = 'Paciente guardado correctamente.';
  } catch (PDOException $e) {
    $mensaje_error = 'Error al guardar: ' . $e->getMessage();
  }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control de Pacientes</title>
  <link rel="stylesheet" href="styles.css">
  <style>body{padding:20px}</style>
</head>
<body>
  <div class="top-bar">
    La vida es la Prioridad ante todo
  </div>
  <div id="aplicacion">
    <aside class="sidebar" id="barra_lateral">
      <div class="brand">
        <img src="img/CS.png" alt="CS">
        <div>
          <div style="font-weight:800;">Clínica Cornejo</div>
          <small style="opacity:0.9">Panel</small>
        </div>
      </div>
  <nav>
        <a href="dashboard.html"><span class="label">Dashboard</span></a>
  <a href="pacientes.php"><span class="label">Pacientes</span></a>
        <a href="agenda.html"><span class="label">Agenda</span></a>
        <a href="medicos.html"><span class="label">Médicos</span></a>
        <a href="reportes.html"><span class="label">Reportes</span></a>
        <a href="pagos.html"><span class="label">Pagos</span></a>
        <a href="tarifas.html"><span class="label">Tarifas</span></a>
        <a href="bitacoras.html"><span class="label">Bitácoras</span></a>
        <a href="especialidades.html"><span class="label">Especialidades</span></a>
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
                <img src="img/Login.png" alt="Login" class="icon-img">
              </a>
              <span id="usuario_email" style="margin-left:8px; font-size:0.9rem; color:#333;"></span>
            </div>
          </div>
        </div>
      </header>
      <h1>Control de Pacientes</h1>
      <p>Lista de pacientes </p>
      <div style="max-width:900px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <a href="pacientes.php?action=nuevo" class="btn-admin">+ Agregar Paciente</a>
      </div>

      <?php
        // mostrar mensajes si vienen del POST
        if(!empty(
          isset(
            $mensaje_exito
          )
        ) && isset($mensaje_exito)){
          echo '<div class="notice ok" style="margin-bottom:12px; color:green;">'.htmlspecialchars($mensaje_exito).'</div>';
        }
        if(isset($mensaje_error)){
          echo '<div class="notice err" style="margin-bottom:12px; color:red;">'.htmlspecialchars($mensaje_error).'</div>';
        }

        // si la ruta es ?action=nuevo mostramos el  formulario en PHP (sin JS)
        if(isset($_GET['action']) && $_GET['action'] === 'nuevo'){
      ?>
      <section class="form-section" style="max-width:900px;">
        <h2>Registrar nuevo Paciente</h2>
        <form method="post" action="pacientes.php">
          <input type="hidden" name="id" value="">
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
        } else {
      ?>
      <!-- Grid de tarjetas de pacientes -->
      <div id="pacientes_grid" class="products-grid" style="max-width:1000px;">
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
  <script src="sidebar.js"></script>
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
