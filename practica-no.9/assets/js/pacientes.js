

document.addEventListener('DOMContentLoaded', function () {
  // Procesar y mostrar mensajes de estado desde URL query string
  (function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var cont = document.getElementById('mensajes');
      if (!cont) return;
      if (params.get('exito')) {
        var d = document.createElement('div'); d.className = 'alert alert-success'; d.textContent = params.get('exito'); cont.appendChild(d);
      }
      if (params.get('error')) {
        var d = document.createElement('div'); d.className = 'alert alert-danger'; d.textContent = params.get('error'); cont.appendChild(d);
      }
    } catch (e) { /* silencioso */ }
  })();

  // Validar confirmación de eliminación antes de enviar formulario
  document.querySelectorAll('form').forEach(function (formulario) {
    var inAcc = formulario.querySelector('input[name="accion"]');
    if (inAcc && inAcc.value === 'eliminar') {
      formulario.addEventListener('submit', function (e) {
        if (!confirm('¿Eliminar paciente?')) {
          e.preventDefault();
        }
      });
    }
  });



  /**
   * Carga el listado de especialidades desde el controlador
   * @async
   * @returns {Promise<void>}
   */
  async function cargarEspecialidades() {
    try {
      var respuesta = await fetch('/practica-no.9/controllers/especialidades_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_especialidad');
      if (!select) return;
      var valorPrevio = select.value;
      select.innerHTML = '';
      if (json.exito && Array.isArray(json.datos)) {
        select.appendChild(new Option('Seleccione', ''));
        json.datos.forEach(function (e) {
          var texto = e.nombre_especialidad || e.nombre || '';
          var valor = e.especialidad_id || e.id || '';
          select.appendChild(new Option(texto, valor));
        });
        if (valorPrevio) select.value = valorPrevio;
      } else {
        select.appendChild(new Option('No hay especialidades', ''));
      }
    } catch (err) { console.error('especialidades:', err); }
  }

  /**
   * Carga el listado de médicos desde el controlador
   * @async
   * @returns {Promise<void>}
   */
  async function cargarMedicos() {
    try {
      var respuesta = await fetch('/practica-no.9/controllers/medicos_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_medico_asignado');
      if (!select) return;
      var valorPrevio = select.value;
      select.innerHTML = '';
      if (json.exito && Array.isArray(json.datos)) {
        select.appendChild(new Option('Seleccione', ''));
        json.datos.forEach(function (m) {
          var texto = m.nombre || '';
          var valor = m.medico_id || m.id || '';
          select.appendChild(new Option(texto, valor));
        });
        if (valorPrevio) select.value = valorPrevio;
      } else {
        select.appendChild(new Option('No hay médicos', ''));
      }
    } catch (err) { console.error('medicos:', err); }
  }

  // Cargar datos iniciales y configurar recarga periódica cada 10 segundos
  cargarEspecialidades(); cargarMedicos();
  setInterval(function () { cargarEspecialidades(); cargarMedicos(); }, 10000);

  // Configurar modal para creación de nuevo paciente
  var botonAgregar = document.getElementById('btn_agregar_paciente');
  if (botonAgregar) {
    botonAgregar.addEventListener('click', function () {
      var acc = document.getElementById('accion_form'); if (acc) acc.value = 'crear';
      var pid = document.getElementById('paciente_id'); if (pid) pid.value = '';
      var form = document.getElementById('formulario_paciente'); if (form) form.reset();

      // Ocultar sección de cobro en modo creación
      var btnCobro = document.getElementById('btn_registrar_cobro');
      if (btnCobro) btnCobro.style.display = 'none';

      // Invocar función global de apertura de modal con inicialización de eventos
      if (typeof abrirModal === 'function') {
        abrirModal('modal_paciente');
      } else {
        // Alternativa de apertura manual si no existe la función global
        var modal = document.getElementById('modal_paciente');
        if (modal) {
          modal.classList.add('show');
          modal.style.display = 'flex';
        }
      }

      // Garantizar funcionalidad del botón de cierre del modal
      setTimeout(() => {
        const btnCerrar = document.querySelector('#modal_paciente .modal-close');
        if (btnCerrar) {
          btnCerrar.onclick = function () {
            if (typeof cerrarModal === 'function') {
              cerrarModal('modal_paciente');
            } else {
              const modal = document.getElementById('modal_paciente');
              if (modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
              }
            }
          };
        }
      }, 100);
    });
  }

  // Procesar envío del formulario de paciente
  var formPaciente = document.getElementById('formulario_paciente');
  console.log('Form paciente encontrado:', formPaciente);
  if (formPaciente) {
    formPaciente.addEventListener('submit', async function (e) {
      console.log('Submit event triggered!');
      e.preventDefault();
      e.stopPropagation();

      // Validación de campos obligatorios y formatos
      var nombre = formPaciente.querySelector('[name="nombres"]');
      var apellidos = formPaciente.querySelector('[name="apellidos"]');
      var email = formPaciente.querySelector('[name="email"]');
      var telefono = formPaciente.querySelector('[name="telefono"]');
      var fechaNac = formPaciente.querySelector('[name="fecha_nacimiento"]');

      if (nombre && nombre.value.trim() === '') {
        alert('El campo Nombres es obligatorio.');
        nombre.focus();
        return false;
      }

      if (nombre && nombre.value.trim().length > 100) {
        alert('El campo Nombres no puede exceder 100 caracteres.');
        nombre.focus();
        return false;
      }

      if (apellidos && apellidos.value.trim() === '') {
        alert('El campo Apellidos es obligatorio.');
        apellidos.focus();
        return false;
      }

      if (apellidos && apellidos.value.trim().length > 100) {
        alert('El campo Apellidos no puede exceder 100 caracteres.');
        apellidos.focus();
        return false;
      }

      // Validación de formato de email si se proporciona
      if (email && email.value.trim() !== '') {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
          alert('El formato del email no es válido.');
          email.focus();
          return false;
        }
        if (email.value.trim().length > 150) {
          alert('El email no puede exceder 150 caracteres.');
          email.focus();
          return false;
        }
      }

      // Validación de formato de teléfono si se proporciona
      if (telefono && telefono.value.trim() !== '') {
        var telefonoRegex = /^[\d\s\-\(\)\+]+$/;
        if (!telefonoRegex.test(telefono.value.trim())) {
          alert('El formato del teléfono no es válido. Solo se permiten números, espacios, guiones, paréntesis y el signo +.');
          telefono.focus();
          return false;
        }
        if (telefono.value.trim().length > 20) {
          alert('El teléfono no puede exceder 20 caracteres.');
          telefono.focus();
          return false;
        }
      }

      // Validación de fecha de nacimiento si se proporciona
      if (fechaNac && fechaNac.value.trim() !== '') {
        var fechaObj = new Date(fechaNac.value);
        var hoy = new Date();
        if (fechaObj > hoy) {
          alert('La fecha de nacimiento no puede ser futura.');
          fechaNac.focus();
          return false;
        }
      }

      // Enviar datos del formulario mediante AJAX
      try {
        console.log('Sending AJAX request...');
        var formData = new FormData(formPaciente);
        var response = await fetch('/practica-no.9/controllers/pacientes.php', {
          method: 'POST',
          body: formData
        });

        console.log('Response received:', response);

        // Procesar respuesta JSON del servidor
        var contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          var data = await response.json();
          console.log('JSON data:', data);
          if (data.exito) {
            // Mostrar modal de éxito Bootstrap
            const modalEl = document.getElementById('modal_exito_bootstrap');
            const modalBodyP = modalEl.querySelector('.modal-body p');
            if (modalBodyP) modalBodyP.textContent = 'Paciente guardado correctamente';

            const modalExito = new bootstrap.Modal(modalEl);
            modalExito.show();

            cerrarModal('modal_paciente');
            formPaciente.reset();
            cargarPacientes(); // Recargar tabla
          } else {
            alert('Error: ' + (data.error || 'Error desconocido'));
          }
        } else {
          // Manejo de respuestas no JSON con recarga de página
          console.log('Response is not JSON, content-type:', contentType);
          alert('Paciente guardado. Recargando página...');
          window.location.reload();
        }
      } catch (error) {
        console.error('Error guardando paciente:', error);
        alert('Error al guardar paciente: ' + error.message);
      }

      return false;
    });
    console.log('Event listener registered successfully');
  } else {
    console.error('Formulario paciente NO encontrado!');
  }

});

/**
 * Carga el listado de pacientes desde el controlador y renderiza la tabla
 * @async
  // Cargar médicos para el filtro (solo admin)
  async function cargarMedicosFiltro() {
    try {
      const res = await fetch('/practica-no.9/controllers/medicos_list.php');
      const datos = await res.json();
      const sel = document.getElementById('filtro_medico');
      
      if (sel && datos.exito) {
        sel.innerHTML = '<option value="">Todos los médicos</option>';
        datos.datos.forEach(m => {
          sel.appendChild(new Option(m.nombre, m.medico_id));
        });
        sel.addEventListener('change', cargarPacientes);
      }
    } catch (e) {
      console.error('Error cargando lista de médicos para filtro:', e);
    }
  }

  document.addEventListener('sesionVerificada', (e) => {
    const usuario = e.detail;
    if (usuario.rol === 'super_admin') {
      const container = document.getElementById('filtro_medico_container');
      if (container) {
        container.style.display = 'block';
        cargarMedicosFiltro();
      }
    }
  });

  /**
   * Carga el listado de pacientes desde el controlador
   * @async
   * @returns {Promise<void>}
   */
async function cargarPacientes() {
  try {
    let url = '/practica-no.9/controllers/pacientes.php?api=listar';
    const filtro = document.getElementById('filtro_medico');
    if (filtro && filtro.value) {
      url += `&medico_id=${filtro.value}`;
    }
    var respuesta = await fetch(url);
    var json = await respuesta.json();
    var tabla = document.getElementById('tabla_pacientes');
    if (!tabla) return;
    var tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    if (json.exito && Array.isArray(json.datos)) {
      if (json.datos.length === 0) { tbody.innerHTML = '<tr><td colspan="8">No hay pacientes registrados.</td></tr>'; return; }
      json.datos.forEach(function (paciente) {
        var tr = document.createElement('tr');
        var nombreCompleto = (paciente.nombres || '') + ' ' + (paciente.apellidos || '');
        tr.innerHTML = '<td>' + escaparHtml(nombreCompleto) + '</td>' +
          '<td>' + escaparHtml(paciente.sexo || '') + '</td>' +
          '<td>' + escaparHtml(paciente.fecha_nacimiento || '') + '</td>' +
          '<td>' + escaparHtml(paciente.telefono || '') + '</td>' +
          '<td>' + escaparHtml(paciente.email || '') + '</td>' +
          '<td>' + escaparHtml(paciente.ciudad || '') + '</td>' +
          '<td>' + escaparHtml(paciente.prioridad || '') + '</td>' +
          '<td>' + escaparHtml(paciente.medico_nombre || 'Sin asignar') + '</td>';
        var tdAcc = document.createElement('td');

        // Botón para editar paciente
        var btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-primary me-1';
        btnEditar.title = 'Editar';
        btnEditar.innerHTML = '<i class="bi bi-pencil"></i>';
        btnEditar.onclick = function () { abrirModalEditar(paciente); };
        tdAcc.appendChild(btnEditar);

        // Botón para eliminar paciente
        var btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-sm btn-danger';
        btnEliminar.title = 'Eliminar';
        btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
        btnEliminar.onclick = function () { abrirModalEliminar(paciente.paciente_id); };
        tdAcc.appendChild(btnEliminar);
        tr.appendChild(tdAcc);
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="8" class="text-danger">Error cargando pacientes</td></tr>';
    }
  } catch (err) { console.error('cargarPacientes', err); }
}

/**
 * Abre el modal de edición y carga los datos del paciente seleccionado
 * @param {Object} paciente - Objeto con los datos del paciente
 */
function abrirModalEditar(paciente) {
  // Configurar formulario en modo edición
  var acc = document.getElementById('accion_form');
  if (acc) acc.value = 'editar';

  // Establecer ID del paciente a editar
  var pid = document.getElementById('paciente_id');
  if (pid) pid.value = paciente.paciente_id;

  // Poblar campos del formulario con datos del paciente
  var form = document.getElementById('formulario_paciente');
  if (form) {
    // Datos personales básicos
    form.querySelector('[name="nombres"]').value = paciente.nombres || '';
    form.querySelector('[name="apellidos"]').value = paciente.apellidos || '';

    // Datos demográficos y fecha de nacimiento
    form.querySelector('[name="sexo"]').value = paciente.sexo || '';
    form.querySelector('[name="fecha_nacimiento"]').value = paciente.fecha_nacimiento || '';

    // Información de contacto
    form.querySelector('[name="telefono"]').value = paciente.telefono || '';
    form.querySelector('[name="email"]').value = paciente.email || '';

    // Datos de ubicación completos
    form.querySelector('[name="direccion"]').value = paciente.direccion || '';
    form.querySelector('[name="ciudad"]').value = paciente.ciudad || '';
    form.querySelector('[name="estado"]').value = paciente.estado || '';
    form.querySelector('[name="cp"]').value = paciente.cp || '';

    // Clasificación de prioridad y datos médicos
    form.querySelector('[name="prioridad"]').value = paciente.prioridad || 'Baja';
    form.querySelector('[name="tipo_sangre"]').value = paciente.tipo_sangre || '';
    form.querySelector('[name="alergias"]').value = paciente.alergias || '';
    form.querySelector('[name="notas"]').value = paciente.notas || '';

    // Seleccionar especialidad asignada si existe
    var espSelect = document.getElementById('p_especialidad');
    if (espSelect && paciente.especialidad) {
      espSelect.value = paciente.especialidad;
    }

    // Seleccionar médico asignado si existe
    var medSelect = document.getElementById('p_medico_asignado');
    if (medSelect && paciente.medico_asignado) {
      medSelect.value = paciente.medico_asignado;
    }
  }

  // Mostrar botón de cobro en modo edición
  var btnCobro = document.getElementById('btn_registrar_cobro');
  if (btnCobro) {
    btnCobro.style.display = 'inline-flex';
    btnCobro.onclick = function () {
      abrirModalCobro(paciente.paciente_id);
    };
  }

  // Abrir modal con datos cargados
  if (typeof abrirModal === 'function') {
    abrirModal('modal_paciente');
  } else {
    // Apertura manual del modal si la función global no existe
    var modal = document.getElementById('modal_paciente');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }
}

/**
 * Abre el modal de registro de cobro para un paciente específico
 * @param {number} pacienteId - ID del paciente
 */
function abrirModalCobro(pacienteId) {
  // Opción: cerrar modal de paciente antes de abrir el de cobro
  // cerrarModal('modal_paciente'); 

  document.getElementById('formulario_cobro').reset();
  document.getElementById('cobro_paciente_id').value = pacienteId;

  if (typeof abrirModal === 'function') {
    abrirModal('modal_cobro');
  }
}

/**
 * Abre el modal de confirmación para eliminar un paciente
 * @param {number} id - ID del paciente a eliminar
 */
function abrirModalEliminar(id) {
  document.getElementById('eliminar_paciente_id').value = id;
  if (typeof abrirModal === 'function') {
    abrirModal('modal_eliminar_paciente');
  }
}

/**
 * Ejecuta la eliminación del paciente mediante AJAX
 */
function ejecutarEliminacionPaciente() {
  const id = document.getElementById('eliminar_paciente_id').value;
  if (!id) return;

  const formData = new FormData();
  formData.append('accion', 'eliminar');
  formData.append('id', id);

  fetch('/practica-no.9/controllers/pacientes.php', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.exito) {
        // Mostrar modal de éxito Bootstrap
        const modalEl = document.getElementById('modal_exito_bootstrap');
        const modalBodyP = modalEl.querySelector('.modal-body p');
        if (modalBodyP) modalBodyP.textContent = 'Paciente eliminado correctamente';

        const modalExito = new bootstrap.Modal(modalEl);
        modalExito.show();

        if (typeof cerrarModal === 'function') cerrarModal('modal_eliminar_paciente');
        cargarPacientes();
      } else {
        const modalEl = document.getElementById('modal_error_paciente');
        const modalBodyP = modalEl.querySelector('.modal-body p');
        if (modalBodyP) modalBodyP.textContent = data.error || 'Error al eliminar';

        const modalError = new bootstrap.Modal(modalEl);
        modalError.show();
      }
    })
    .catch(err => {
      const modalEl = document.getElementById('modal_error_paciente');
      const modalBodyP = modalEl.querySelector('.modal-body p');
      if (modalBodyP) modalBodyP.textContent = 'Error de red: ' + err;

      const modalError = new bootstrap.Modal(modalEl);
      modalError.show();
    });
}

/**
 * Escapa caracteres HTML para prevenir inyección de código
 * @param {string} s - Cadena a escapar
 * @returns {string} Cadena escapada
 */
function escaparHtml(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

// Cargar datos iniciales de pacientes al cargar el DOM
document.addEventListener('DOMContentLoaded', function () {
  cargarPacientes();

  // Vincular eventos de cierre de modales con timeout
  setTimeout(() => {
    // Evento de cierre del modal de paciente
    const btnCerrarPaciente = document.querySelector('#modal_paciente .modal-close');
    if (btnCerrarPaciente) {
      btnCerrarPaciente.addEventListener('click', () => cerrarModal('modal_paciente'));
    }

    // Evento de cierre del modal de cobro
    const btnCerrarCobro = document.querySelector('#modal_cobro .modal-close');
    if (btnCerrarCobro) {
      btnCerrarCobro.addEventListener('click', () => cerrarModal('modal_cobro'));
    }

    // Evento de cierre del modal de eliminación
    const btnCerrarEliminar = document.querySelector('#modal_eliminar_paciente .modal-close');
    if (btnCerrarEliminar) {
      btnCerrarEliminar.addEventListener('click', () => cerrarModal('modal_eliminar_paciente'));
    }
  }, 500);

  // Manejar envío del formulario de cobro
  const formCobro = document.getElementById('formulario_cobro');
  if (formCobro) {
    formCobro.addEventListener('submit', async function (e) {
      e.preventDefault();

      const formData = new FormData(formCobro);

      try {
        const response = await fetch('/practica-no.9/controllers/reportes.php', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.exito) {
          // Mostrar modal de éxito Bootstrap
          const modalEl = document.getElementById('modal_exito_bootstrap');
          const modalBodyP = modalEl.querySelector('.modal-body p');
          if (modalBodyP) modalBodyP.textContent = 'Pago registrado correctamente';

          const modalExito = new bootstrap.Modal(modalEl);
          modalExito.show();

          cerrarModal('modal_cobro');
          formCobro.reset();
        } else {
          alert('Error al registrar pago: ' + (data.error || 'Error desconocido'));
        }
      } catch (error) {
        console.error('Error registrando pago:', error);
        alert('Error de conexión al registrar pago');
      }
    });
  }
});
