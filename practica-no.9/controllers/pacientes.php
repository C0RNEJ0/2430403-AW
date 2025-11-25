<?php
require_once __DIR__ . '/../config/bd_huevos.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/pacientes_actions.php';
require_once __DIR__ . '/../config/bitacoras_helpers.php';

// Requerir autenticación
requerirAutenticacion();

// Manejo de API listar (GET)
if (isset($_GET['api']) && $_GET['api'] === 'listar') {
    header('Content-Type: application/json; charset=utf-8');
    $lista = listar_pacientes(200);
    if (isset($lista['error'])) {
        echo json_encode(['exito' => false, 'error' => $lista['error']]);
    } else {
        echo json_encode(['exito' => true, 'datos' => $lista]);
    }
    exit;
}

// Inicializar mensajes
$mensaje_exito = '';
$mensaje_error = '';

// Manejo de POST (Crear, Editar, Eliminar)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = $_POST['accion'] ?? '';
    if (in_array($accion, ['crear', 'editar', 'eliminar'])) {
        $resultado = procesar_post_pacientes();
        
        // Si es una petición AJAX (o se espera JSON), devolver JSON
        $isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
        
        // En este caso, como el JS usa fetch y espera JSON, forzamos JSON para POST
        header('Content-Type: application/json; charset=utf-8');
        if ($resultado['ok']) {
            if ($accion === 'eliminar' && isset($_POST['id'])) {
                $id = $_POST['id'];
                registrar_log('eliminar', 'pacientes', $id, "Eliminación de paciente ID: $id");
            }
            echo json_encode(['exito' => true, 'mensaje' => $resultado['mensaje'] ?? 'Operación exitosa']);
        } else {
            echo json_encode(['exito' => false, 'error' => $resultado['error'] ?? 'Error desconocido']);
        }
        exit;
    }
}

// Si no es API ni POST, renderizar HTML
$especialidades = listar_especialidades();
$medicos = listar_medicos();
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Control de Pacientes</title>
  <link rel="stylesheet" href="../assets/css/styles.css">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <link rel="stylesheet" href="../assets/css/sidebar-modern.css">
  <style>body{padding:20px}</style>
</head>
<body>
  <div class="top-bar">La vida es la Prioridad ante todo</div>
  <div id="aplicacion">
    
    <!-- Sidebar -->
    <?php include __DIR__ . '/../views/partials/sidebar.html'; ?>

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
      
      <div id="mensajes"></div>

      <div style="max-width:900px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
        <button id="btn_agregar_paciente" class="btn-admin">+ Agregar Paciente</button>
      </div>

      <!-- Tabla de pacientes -->
      <div class="card">
        <div class="card-body">
          <table id="tabla_pacientes" class="table table-striped table-bordered" style="width:100%">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Sexo</th>
                <th>Fecha Nac.</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Ciudad</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
                <!-- Se llena con JS -->
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal Agregar/Editar Paciente -->
  <div id="modal_paciente" class="modal-modern">
    <div class="modal-overlay"></div>
    <div class="modal-container modal-large">
      <div class="modal-header">
        <i class="bi bi-person-plus"></i>
        <h3>Datos del Paciente</h3>
        <button class="modal-close" onclick="cerrarModal('modal_paciente')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="formulario_paciente">
            <input type="hidden" name="accion" id="accion_form" value="crear">
            <input type="hidden" name="id" id="paciente_id" value="">
            
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label">Nombres *</label>
                    <input type="text" class="form-control" name="nombres" required>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Apellidos *</label>
                    <input type="text" class="form-control" name="apellidos" required>
                </div>
                
                <div class="col-md-4">
                    <label class="form-label">Sexo</label>
                    <select class="form-select" name="sexo">
                        <option value="">Seleccione</option>
                        <option value="F">Femenino</option>
                        <option value="M">Masculino</option>
                        <option value="O">Otro</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Fecha Nacimiento</label>
                    <input type="date" class="form-control" name="fecha_nacimiento">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Teléfono</label>
                    <input type="tel" class="form-control" name="telefono">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" name="email">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Dirección</label>
                    <input type="text" class="form-control" name="direccion">
                </div>

                <div class="col-md-4">
                    <label class="form-label">Ciudad</label>
                    <input type="text" class="form-control" name="ciudad">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Estado</label>
                    <input type="text" class="form-control" name="estado">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Código Postal</label>
                    <input type="text" class="form-control" name="cp">
                </div>

                <div class="col-md-4">
                    <label class="form-label">Prioridad</label>
                    <select class="form-select" name="prioridad">
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Crítica">Crítica</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label">Tipo Sangre</label>
                    <input type="text" class="form-control" name="tipo_sangre">
                </div>
                <div class="col-md-4">
                    <label class="form-label">Alergias</label>
                    <input type="text" class="form-control" name="alergias">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Especialidad Requerida</label>
                    <select class="form-select" name="especialidad" id="p_especialidad">
                        <option value="">Cargando...</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Médico Asignado</label>
                    <select class="form-select" name="medico_asignado" id="p_medico_asignado">
                        <option value="">Cargando...</option>
                    </select>
                </div>

                <div class="col-12">
                    <label class="form-label">Notas</label>
                    <textarea class="form-control" name="notas" rows="2"></textarea>
                </div>
            </div>
        </form>
      </div>
      <div class="modal-footer justify-content-between">
        <button type="button" id="btn_registrar_cobro" class="btn-modal-primary" style="display: none; background: linear-gradient(135deg, #28a745 0%, #218838 100%); box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);">
          <i class="bi bi-cash-coin"></i> Registrar Cobro
        </button>
        <div>
            <button class="btn-modal-secondary" onclick="cerrarModal('modal_paciente')">Cancelar</button>
            <button type="submit" form="formulario_paciente" class="btn-modal-primary">Guardar</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Registrar Cobro -->
  <div id="modal_cobro" class="modal-modern">
    <div class="modal-overlay"></div>
    <div class="modal-container modal-small">
      <div class="modal-header">
        <i class="bi bi-cash-coin"></i>
        <h3>Registrar Cobro</h3>
        <button class="modal-close" onclick="cerrarModal('modal_cobro')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="modal-body">
        <form id="formulario_cobro">
          <input type="hidden" name="accion" value="guardar_pago">
          <input type="hidden" id="cobro_paciente_id" name="paciente_id">
          
          <div class="mb-3">
            <label class="form-label">Monto *</label>
            <div class="input-group">
                <span class="input-group-text">$</span>
                <input type="number" class="form-control" id="cobro_monto" name="monto" step="0.01" min="0" required>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label">Método de Pago</label>
            <select class="form-control" id="cobro_metodo" name="metodo_pago">
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label">Referencia (Opcional)</label>
            <input type="text" class="form-control" id="cobro_referencia" name="referencia" placeholder="Folio, autorización, etc.">
          </div>
          
          <div class="alert alert-info" style="font-size: 0.85rem;">
            <i class="bi bi-info-circle"></i> El pago se asociará a la última cita del paciente si no se especifica otra.
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-modal-secondary" onclick="cerrarModal('modal_cobro')">Cancelar</button>
        <button type="submit" form="formulario_cobro" class="btn-modal-primary">
          <i class="bi bi-check-lg"></i> Registrar Pago
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Confirmación Cerrar Sesión -->
  <div id="modal_logout" class="modal-modern">
    <div class="modal-overlay"></div>
    <div class="modal-container modal-small">
      <div class="modal-header">
        <i class="bi bi-box-arrow-right"></i>
        <h3>Cerrar Sesión</h3>
        <button class="modal-close" onclick="cerrarModal('modal_logout')">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="modal-body">
        <p>¿Estás seguro que deseas cerrar sesión?</p>
        <p style="font-size: 13px; color: #888;">Tendrás que volver a iniciar sesión para acceder al sistema.</p>
      </div>
      <div class="modal-footer">
        <button class="btn-modal-secondary" onclick="cerrarModal('modal_logout')">Cancelar</button>
        <button id="boton_cerrar_sesion" class="btn-modal-danger">
          <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
        </button>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="../assets/js/modal-handler.js"></script>
  <script src="../assets/js/load-sidebar.js"></script>
  <script src="../assets/js/pacientes.js"></script>
  <script src="../assets/js/auth-guard.js"></script>
</body>
</html>

