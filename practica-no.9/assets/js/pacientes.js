

document.addEventListener('DOMContentLoaded', function () {
  // Mostrar mensajes desde querystring
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

  // Confirmar eliminación
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



  // Funciones para cargar especialidades y medicos
  async function cargarEspecialidades() {
    try {
      var respuesta = await fetch('/practica-no.9/controllers/especialidades_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_especialidad');
      if (!select) return;
      select.innerHTML = '';
      if (json.exito && Array.isArray(json.datos)) {
        select.appendChild(new Option('Seleccione', ''));
        json.datos.forEach(function (e) {
          var texto = e.nombre_especialidad || e.nombre || '';
          var valor = e.especialidad_id || e.id || '';
          select.appendChild(new Option(texto, valor));
        });
      } else {
        select.appendChild(new Option('No hay especialidades', ''));
      }
    } catch (err) { console.error('especialidades:', err); }
  }

  async function cargarMedicos() {
    try {
      var respuesta = await fetch('/practica-no.9/controllers/medicos_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_medico_asignado');
      if (!select) return;
      select.innerHTML = '';
      if (json.exito && Array.isArray(json.datos)) {
        select.appendChild(new Option('Seleccione', ''));
        json.datos.forEach(function (m) {
          var texto = m.nombre || '';
          var valor = m.medico_id || m.id || '';
          select.appendChild(new Option(texto, valor));
        });
      } else {
        select.appendChild(new Option('No hay médicos', ''));
      }
    } catch (err) { console.error('medicos:', err); }
  }

  // iniciar y refrescar cada 10s
  cargarEspecialidades(); cargarMedicos();
  setInterval(function () { cargarEspecialidades(); cargarMedicos(); }, 10000);

  // manejar abrir modal en Agregar paciente
  var botonAgregar = document.getElementById('btn_agregar_paciente');
  if (botonAgregar) {
    botonAgregar.addEventListener('click', function () {
      var acc = document.getElementById('accion_form'); if (acc) acc.value = 'crear';
      var pid = document.getElementById('paciente_id'); if (pid) pid.value = '';
      var form = document.getElementById('formulario_paciente'); if (form) form.reset();

      // Ocultar botón de cobro
      var btnCobro = document.getElementById('btn_registrar_cobro');
      if (btnCobro) btnCobro.style.display = 'none';

      // aqui usamos la funcion abrirModal para que se inicialicen los event listeners
      if (typeof abrirModal === 'function') {
        abrirModal('modal_paciente');
      } else {
        // fallback por si no existe la funcion
        var modal = document.getElementById('modal_paciente');
        if (modal) {
          modal.classList.add('show');
          modal.style.display = 'flex';
        }
      }

      // aqui nos aseguramos que el boton X funcione
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

  // Manejar submit del formulario de paciente
  var formPaciente = document.getElementById('formulario_paciente');
  console.log('Form paciente encontrado:', formPaciente);
  if (formPaciente) {
    formPaciente.addEventListener('submit', async function (e) {
      console.log('Submit event triggered!');
      e.preventDefault();
      e.stopPropagation();

      // Validar campos requeridos
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

      // Validar email si se proporciona
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

      // Validar teléfono si se proporciona
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

      // Validar fecha de nacimiento si se proporciona
      if (fechaNac && fechaNac.value.trim() !== '') {
        var fechaObj = new Date(fechaNac.value);
        var hoy = new Date();
        if (fechaObj > hoy) {
          alert('La fecha de nacimiento no puede ser futura.');
          fechaNac.focus();
          return false;
        }
      }

      // Enviar formulario
      try {
        console.log('Sending AJAX request...');
        var formData = new FormData(formPaciente);
        var response = await fetch('/practica-no.9/controllers/pacientes.php', {
          method: 'POST',
          body: formData
        });

        console.log('Response received:', response);

        // Verificar si la respuesta es JSON
        var contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          var data = await response.json();
          console.log('JSON data:', data);
          if (data.exito) {
            alert(data.mensaje || 'Paciente guardado exitosamente');
            cerrarModal('modal_paciente');
            formPaciente.reset();
            cargarPacientes(); // Recargar tabla
          } else {
            alert('Error: ' + (data.error || 'Error desconocido'));
          }
        } else {
          // Si no es JSON, mostrar mensaje
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

// Cargar pacientes via API y renderizar en #pacientes_grid
async function cargarPacientes() {
  try {
    var respuesta = await fetch('/practica-no.9/controllers/pacientes.php?api=listar');
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
          '<td>' + escaparHtml(paciente.prioridad || '') + '</td>';
        var tdAcc = document.createElement('td');

        // Botón editar que abre el modal
        var btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-sm btn-outline-primary me-1';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = function () { abrirModalEditar(paciente); };
        tdAcc.appendChild(btnEditar);

        // Botón eliminar
        var btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-sm btn-outline-danger';
        btnEliminar.textContent = 'Eliminar';
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

// aqui abrimos el modal para editar un paciente que ya existe
function abrirModalEditar(paciente) {
  // primero cambiamos la accion del formulario a editar
  var acc = document.getElementById('accion_form');
  if (acc) acc.value = 'editar';

  // guardamos el id del paciente que vamos a editar
  var pid = document.getElementById('paciente_id');
  if (pid) pid.value = paciente.paciente_id;

  // ahora llenamos todos los campos del formulario con los datos del paciente
  var form = document.getElementById('formulario_paciente');
  if (form) {
    // aqui ponemos el nombre y apellidos
    form.querySelector('[name="nombres"]').value = paciente.nombres || '';
    form.querySelector('[name="apellidos"]').value = paciente.apellidos || '';

    // datos basicos como sexo y fecha de nacimiento
    form.querySelector('[name="sexo"]').value = paciente.sexo || '';
    form.querySelector('[name="fecha_nacimiento"]').value = paciente.fecha_nacimiento || '';

    // informacion de contacto
    form.querySelector('[name="telefono"]').value = paciente.telefono || '';
    form.querySelector('[name="email"]').value = paciente.email || '';

    // direccion completa del paciente
    form.querySelector('[name="direccion"]').value = paciente.direccion || '';
    form.querySelector('[name="ciudad"]').value = paciente.ciudad || '';
    form.querySelector('[name="estado"]').value = paciente.estado || '';
    form.querySelector('[name="cp"]').value = paciente.cp || '';

    // prioridad y datos medicos
    form.querySelector('[name="prioridad"]').value = paciente.prioridad || 'Baja';
    form.querySelector('[name="tipo_sangre"]').value = paciente.tipo_sangre || '';
    form.querySelector('[name="alergias"]').value = paciente.alergias || '';
    form.querySelector('[name="notas"]').value = paciente.notas || '';

    // si tiene especialidad asignada la seleccionamos
    var espSelect = document.getElementById('p_especialidad');
    if (espSelect && paciente.especialidad) {
      espSelect.value = paciente.especialidad;
    }

    // lo mismo con el medico asignado
    var medSelect = document.getElementById('p_medico_asignado');
    if (medSelect && paciente.medico_asignado) {
      medSelect.value = paciente.medico_asignado;
    }
  }

  // mostramos el boton de cobro porque estamos editando un paciente existente
  var btnCobro = document.getElementById('btn_registrar_cobro');
  if (btnCobro) {
    btnCobro.style.display = 'inline-flex';
    btnCobro.onclick = function () {
      abrirModalCobro(paciente.paciente_id);
    };
  }

  // finalmente abrimos el modal con toda la info cargada
  if (typeof abrirModal === 'function') {
    abrirModal('modal_paciente');
  } else {
    // por si acaso no existe la funcion abrirModal
    var modal = document.getElementById('modal_paciente');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }
}

// Función para abrir modal de cobro
function abrirModalCobro(pacienteId) {
  // Cerrar modal de paciente primero (opcional, o mantener ambos)
  // cerrarModal('modal_paciente'); 

  document.getElementById('formulario_cobro').reset();
  document.getElementById('cobro_paciente_id').value = pacienteId;

  if (typeof abrirModal === 'function') {
    abrirModal('modal_cobro');
  }
}

// Funciones para eliminar
function abrirModalEliminar(id) {
  document.getElementById('eliminar_paciente_id').value = id;
  if (typeof abrirModal === 'function') {
    abrirModal('modal_eliminar_paciente');
  }
}

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
        alert('Paciente eliminado correctamente');
        if (typeof cerrarModal === 'function') cerrarModal('modal_eliminar_paciente');
        cargarPacientes();
      } else {
        alert('Error al eliminar: ' + data.error);
      }
    })
    .catch(err => alert('Error de red: ' + err));
}

function escaparHtml(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

// iniciar carga de pacientes
document.addEventListener('DOMContentLoaded', function () {
  cargarPacientes();

  // aqui nos aseguramos que los botones de cerrar funcionen
  setTimeout(() => {
    // boton de cerrar modal de paciente
    const btnCerrarPaciente = document.querySelector('#modal_paciente .modal-close');
    if (btnCerrarPaciente) {
      btnCerrarPaciente.addEventListener('click', () => cerrarModal('modal_paciente'));
    }

    // boton de cerrar modal de cobro
    const btnCerrarCobro = document.querySelector('#modal_cobro .modal-close');
    if (btnCerrarCobro) {
      btnCerrarCobro.addEventListener('click', () => cerrarModal('modal_cobro'));
    }

    // boton de cerrar modal de eliminar
    const btnCerrarEliminar = document.querySelector('#modal_eliminar_paciente .modal-close');
    if (btnCerrarEliminar) {
      btnCerrarEliminar.addEventListener('click', () => cerrarModal('modal_eliminar_paciente'));
    }
  }, 500);
});
