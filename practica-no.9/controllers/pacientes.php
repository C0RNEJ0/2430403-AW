<?php
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/pacientes_actions.php';

// Inicializar mensajes
$mensaje_exito = '';
$mensaje_error = '';

// crear, editar, eliminar
if($_SERVER['REQUEST_METHOD'] === 'POST'){
  $accion = $_POST['accion'] ?? '';
  if(in_array($accion, ['crear','editar','eliminar'])){
    $resultado = procesar_post_pacientes(); 
    // la función devuelve a ok que indica ganaste y error que indica perdiste
    if(isset($resultado['ok']) && $resultado['ok']){
  $mensaje = $resultado['mensaje'] ?? 'Operación completada.';
  header('Location: /practica-no.9/controllers/pacientes.php?exito='.urlencode($mensaje));
      exit;
    } else {
      $mensaje_error = $resultado['error'] ?? 'Error procesando paciente.';
  header('Location: /practica-no.9/controllers/pacientes.php?error='.urlencode($mensaje_error));
      exit;
    }
  }
}

 
if($_SERVER['REQUEST_METHOD'] === 'GET'){
  if(isset($_GET['api']) && $_GET['api'] === 'listar'){
    $lista = listar_pacientes(1000);
    header('Content-Type: application/json; charset=utf-8');
    if(isset($lista['error'])){
      echo json_encode(['exito' => false, 'error' => $lista['error']]);
    } else {
      echo json_encode(['exito' => true, 'datos' => $lista]);
    }
    exit;
  }

  //pacientes por id 

  if(isset($_GET['api']) && $_GET['api'] === 'obtener' && isset($_GET['id'])){
    $id = (int)$_GET['id'];
    $registro = obtener_paciente($id); 
    header('Content-Type: application/json; charset=utf-8'); // establecer encabezado JSON
    if($registro){
      echo json_encode(['exito' => true, 'datos' => $registro]);
    } else {
      echo json_encode(['exito' => false, 'error' => 'Paciente no encontrado']);
    }
    exit;
  }

  readfile(__DIR__ . '/../views/pacientes.html');
  exit;
}

?>

  <?php
  ?>
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Control de Pacientes</title>
    <link rel="stylesheet" href="/practica-no.9/assets/css/styles.css">
    <style>body{padding:20px}</style>
  </head>
  <body>
    <div class="top-bar">La vida es la Prioridad ante todo</div>
    <div id="aplicacion">
      <aside class="sidebar" id="barra_lateral">
        <div class="brand">
          <div style="font-weight:800;">Clínica Cornejo</div>
          <small style="opacity:0.9">Panel</small>
        </div>
        <nav>
          <a href="/practica-no.9/views/dashboard.html"><span class="label">Dashboard</span></a>
    <a href="/practica-no.9/controllers/pacientes.php"><span class="label">Pacientes</span></a>
          <a href="/practica-no.9/views/agenda.html"><span class="label">Agenda</span></a>
          <a href="/practica-no.9/views/medicos.html"><span class="label">Médicos</span></a>
          <a href="/practica-no.9/views/reportes.html"><span class="label">Reportes</span></a>
          <a href="/practica-no.9/views/pagos.html"><span class="label">Pagos</span></a>
          <a href="/practica-no.9/views/tarifas.html"><span class="label">Tarifas</span></a>
          <a href="/practica-no.9/views/bitacoras.html"><span class="label">Bitácoras</span></a>
          <a href="/practica-no.9/views/especialidades.html"><span class="label">Especialidades</span></a>
        </nav>
      </aside>

      <div class="page-content" id="contenido_pagina">
        <header>
          <div class="container">
            <div style="flex:1"></div>
            <div class="header-right">
              <div class="search-box"><input type="text" id="buscador" placeholder="Buscar"></div>
              <div class="icons"><span id="usuario_email" style="margin-left:8px; font-size:0.9rem; color:#333;"></span></div>
            </div>
          </div>
        </header>

        <h1>Control de Pacientes</h1>
        <?php if(!empty($mensaje_exito)): ?><div class="alert alert-success"><?php echo htmlspecialchars($mensaje_exito); ?></div><?php endif; ?>
        <?php if(!empty($mensaje_error)): ?><div class="alert alert-danger"><?php echo htmlspecialchars($mensaje_error); ?></div><?php endif; ?>

        <div style="max-width:900px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
          <a class="btn-admin" href="/practica-no.9/controllers/pacientes.php?action=nuevo">+ Agregar Paciente</a>
        </div>

        <?php
        // Si se pide el formulario nuevo
        if(isset($_GET['action']) && $_GET['action']==='nuevo'){
        ?>
        <section class="form-section" style="max-width:900px;">
          <h2>Nuevo Paciente</h2>
          <form method="post" action="/practica-no.9/controllers/pacientes.php">
            <input type="hidden" name="accion" value="crear">
            <div class="row">
              <div class="col-md-6"><label>Nombres</label><input class="form-control" type="text" name="nombres" required></div>
              <div class="col-md-6"><label>Apellidos</label><input class="form-control" type="text" name="apellidos" required></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-3"><label>Sexo</label><select class="form-control" name="sexo"><option value="">--</option><option value="F">Femenino</option><option value="M">Masculino</option><option value="O">Otro</option></select></div>
              <div class="col-md-3"><label>Fecha de nacimiento</label><input class="form-control" type="date" name="fecha_nacimiento"></div>
              <div class="col-md-6"><label>Teléfono</label><input class="form-control" type="tel" name="telefono"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6"><label>Email</label><input class="form-control" type="email" name="email"></div>
              <div class="col-md-6"><label>Dirección</label><input class="form-control" type="text" name="direccion"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-4"><label>Ciudad</label><input class="form-control" type="text" name="ciudad"></div>
              <div class="col-md-4"><label>Estado</label><input class="form-control" type="text" name="estado"></div>
              <div class="col-md-4"><label>Código Postal</label><input class="form-control" type="text" name="cp"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-4"><label>Prioridad</label><select class="form-control" name="prioridad"><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></div>
              <div class="col-md-4"><label>Tipo de sangre</label><input class="form-control" type="text" name="tipo_sangre"></div>
              <div class="col-md-4"><label>Alergias</label><input class="form-control" type="text" name="alergias"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6"><label>Especialidad requerida</label>
                <select name="especialidad" class="form-control">
                  <option value="">Seleccione</option>
                  <?php foreach($especialidades as $e): ?>
                    <option value="<?php echo (int)$e['especialidad_id']; ?>"><?php echo htmlspecialchars($e['nombre_especialidad'] ?? $e['nombre'] ?? ''); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <div class="col-md-6"><label>Médico asignado</label>
                <select name="medico_asignado" class="form-control">
                  <option value="">Seleccione</option>
                  <?php foreach($medicos as $m): ?>
                    <option value="<?php echo (int)$m['medico_id']; ?>"><?php echo htmlspecialchars(trim(($m['nombres'] ?? '') . ' ' . ($m['apellidos'] ?? ''))); ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
            </div>
            <div class="row mt-2"><div class="col-12"><label>Notas</label><textarea class="form-control" name="notas" rows="3"></textarea></div></div>
            <div style="margin-top:10px; text-align:center;"><button type="submit" class="btn btn-primary">Guardar paciente</button> <a href="/practica-no.9/controllers/pacientes.php" class="btn btn-secondary">Cancelar</a></div>
          </form>
        </section>
        <?php
        } elseif(isset($_GET['action']) && $_GET['action']==='editar' && !empty($_GET['id'])){
          $id_ed = (int)$_GET['id'];
          $registro = obtener_paciente($id_ed);
          if($registro){
        ?>
        <section class="form-section" style="max-width:900px;">
          <h2>Editar Paciente</h2>
          <form method="post" action="/practica-no.9/controllers/pacientes.php">
            <input type="hidden" name="accion" value="editar">
            <input type="hidden" name="id" value="<?php echo (int)$registro['paciente_id']; ?>">
            <div class="row">
              <div class="col-md-6"><label>Nombres</label><input class="form-control" type="text" name="nombres" required value="<?php echo htmlspecialchars($registro['nombres']); ?>"></div>
              <div class="col-md-6"><label>Apellidos</label><input class="form-control" type="text" name="apellidos" required value="<?php echo htmlspecialchars($registro['apellidos']); ?>"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-3"><label>Sexo</label><select class="form-control" name="sexo"><option value="">--</option><option value="F" <?php if($registro['sexo']==='F') echo 'selected'; ?>>Femenino</option><option value="M" <?php if($registro['sexo']==='M') echo 'selected'; ?>>Masculino</option><option value="O" <?php if($registro['sexo']==='O') echo 'selected'; ?>>Otro</option></select></div>
              <div class="col-md-3"><label>Fecha de nacimiento</label><input class="form-control" type="date" name="fecha_nacimiento" value="<?php echo htmlspecialchars($registro['fecha_nacimiento']); ?>"></div>
              <div class="col-md-6"><label>Teléfono</label><input class="form-control" type="tel" name="telefono" value="<?php echo htmlspecialchars($registro['telefono']); ?>"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6"><label>Email</label><input class="form-control" type="email" name="email" value="<?php echo htmlspecialchars($registro['email']); ?>"></div>
              <div class="col-md-6"><label>Dirección</label><input class="form-control" type="text" name="direccion" value="<?php echo htmlspecialchars($registro['direccion']); ?>"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-4"><label>Ciudad</label><input class="form-control" type="text" name="ciudad" value="<?php echo htmlspecialchars($registro['ciudad']); ?>"></div>
              <div class="col-md-4"><label>Estado</label><input class="form-control" type="text" name="estado" value="<?php echo htmlspecialchars($registro['estado']); ?>"></div>
              <div class="col-md-4"><label>Código Postal</label><input class="form-control" type="text" name="cp" value="<?php echo htmlspecialchars($registro['cp']); ?>"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-4"><label>Prioridad</label><select class="form-control" name="prioridad"><option value="Baja" <?php if($registro['prioridad']==='Baja') echo 'selected'; ?>>Baja</option><option value="Media" <?php if($registro['prioridad']==='Media') echo 'selected'; ?>>Media</option><option value="Alta" <?php if($registro['prioridad']==='Alta') echo 'selected'; ?>>Alta</option><option value="Crítica" <?php if($registro['prioridad']==='Crítica') echo 'selected'; ?>>Crítica</option></select></div>
              <div class="col-md-4"><label>Tipo de sangre</label><input class="form-control" type="text" name="tipo_sangre" value="<?php echo htmlspecialchars($registro['tipo_sangre']); ?>"></div>
              <div class="col-md-4"><label>Alergias</label><input class="form-control" type="text" name="alergias" value="<?php echo htmlspecialchars($registro['alergias']); ?>"></div>
            </div>
            <div class="row mt-2">
              <div class="col-md-6"><label>Especialidad requerida</label><select name="especialidad" class="form-control"><option value="">Seleccione</option><?php foreach($especialidades as $e): ?><option value="<?php echo (int)$e['especialidad_id']; ?>" <?php if(isset($registro['especialidad']) && $registro['especialidad']==$e['especialidad_id']) echo 'selected'; ?>><?php echo htmlspecialchars($e['nombre_especialidad'] ?? $e['nombre'] ?? ''); ?></option><?php endforeach; ?></select></div>
              <div class="col-md-6"><label>Médico asignado</label><select name="medico_asignado" class="form-control"><option value="">Seleccione</option><?php foreach($medicos as $m): ?><option value="<?php echo (int)$m['medico_id']; ?>" <?php if(isset($registro['medico_asignado']) && $registro['medico_asignado']==$m['medico_id']) echo 'selected'; ?>><?php echo htmlspecialchars(trim(($m['nombres'] ?? '') . ' ' . ($m['apellidos'] ?? ''))); ?></option><?php endforeach; ?></select></div>
            </div>
            <div class="row mt-2"><div class="col-12"><label>Notas</label><textarea class="form-control" name="notas" rows="3"><?php echo htmlspecialchars($registro['notas']); ?></textarea></div></div>
            <div style="margin-top:10px; text-align:center;"><button type="submit" class="btn btn-primary">Guardar cambios</button> <a href="/practica-no.9/controllers/pacientes.php" class="btn btn-secondary">Cancelar</a></div>
          </form>
        </section>
        <?php
          } else {
            echo '<div class="alert alert-warning">Paciente no encontrado.</div>';
          }
        } else {
          // listar pacientes
          $lista = listar_pacientes(200);
          if(isset($lista['error'])){
            echo '<div class="alert alert-danger">Error al leer pacientes: '.htmlspecialchars($lista['error']).'</div>';
          } else {
            $rows = $lista;
            if(!$rows){
              echo '<div class="alert alert-info">No hay pacientes registrados.</div>';
            } else {
              echo '<div class="table-responsive" style="max-width:1000px;">';
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
                echo '<td>';
                echo '<a class="btn btn-sm btn-outline-primary me-1" href="/practica-no.9/controllers/pacientes.php?action=editar&id='.$id.'">Editar</a>';
                echo '<form method="post" action="/practica-no.9/controllers/pacientes.php" style="display:inline-block; margin:0;" onsubmit="return confirm(\'Eliminar paciente?\');">';
                echo '<input type="hidden" name="accion" value="eliminar">';
                echo '<input type="hidden" name="id" value="'.$id.'">';
                echo '<button type="submit" class="btn btn-sm btn-outline-danger">Eliminar</button>';
                echo '</form>';
                echo '</td>';
                echo '</tr>';
              }
              echo '</tbody></table></div>';
            }
          }
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
    <script src="/practica-no.9/assets/js/sidebar.js"></script>
  </body>
  </html>

