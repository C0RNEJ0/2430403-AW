(function () {
  try { console.log('medicos.js cargado v20251117.2'); } catch (_) { }
  function escaparHtml(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[m])); }
  function renderizar(filas) {
    const tbody = document.querySelector('#medicosTable tbody'); if (!tbody) return;
    tbody.innerHTML = '';
    filas.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escaparHtml(f.nombre)}</td><td>${escaparHtml(f.especialidad)}</td><td>${escaparHtml(f.horario)}</td><td>
        <button class="btn btn-sm btn-primary accion-editar" data-id="${f.medico_id}" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-danger accion-eliminar" data-id="${f.medico_id}" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </td>`;
      tbody.appendChild(tr);
    });
    adjuntarManejadoresFilas();
    try { if (window.jQuery && $.fn.dataTable) { $("#medicosTable").DataTable(); } } catch (e) { }
  }

  // Cargar especialidades para el formulario de médicos (select)
  async function cargarEspecialidadesSelect() {
    try {
      const resp = await fetch('../controllers/especialidades_list.php');
      const js = await resp.json();
      const sel = document.getElementById('medico_especialidad');
      if (!sel) return;
      sel.innerHTML = '';
      if (js && js.exito && Array.isArray(js.datos) && js.datos.length) {
        sel.appendChild(new Option('Seleccione', ''));
        js.datos.forEach(e => sel.appendChild(new Option(e.nombre || e.nombre_especialidad || '', e.especialidad_id || e.id || '')));
      } else {
        // opciones de respaldo
        sel.appendChild(new Option('Cardiología', 'Cardiología'));
        sel.appendChild(new Option('Pediatría', 'Pediatría'));
        sel.appendChild(new Option('Traumatología', 'Traumatología'));
      }
    } catch (err) { console.error('No se pudieron cargar especialidades para medicos', err); }
  }
  // elementos de editar y eliminar
  function adjuntarManejadoresFilas() {
    document.querySelectorAll('.accion-eliminar').forEach(btn => {
      btn.addEventListener('click', function () {
        if (!confirm('Eliminar médico?')) return;
        const id = this.dataset.id;
        const f = new FormData(); f.append('accion', 'eliminar'); f.append('id', id);
        fetch('../controllers/medicos.php', { method: 'POST', body: f })
          .then(r => r.json())
          .then(res => {
            if (res.exito) {
              const modalEl = document.getElementById('modal_exito_medico');
              const modalBodyP = modalEl.querySelector('.modal-body p');
              if (modalBodyP) modalBodyP.textContent = 'Médico eliminado correctamente';

              const modalExito = new bootstrap.Modal(modalEl);
              modalEl.addEventListener('hidden.bs.modal', function () {
                location.reload();
              });
              modalExito.show();
            } else {
              alert('Error: ' + (res.error || 'No se pudo eliminar'));
            }
          })
          .catch(err => { console.error(err); alert('Error de conexión'); });
      });
    });
    // Editar médico
    document.querySelectorAll('.accion-editar').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        fetch('../controllers/medicos_list.php?id=' + encodeURIComponent(id)).then(r => r.json()).then(res => {
          if (!res || !res.exito) return alert('No se pudo obtener datos del médico');
          const m = Array.isArray(res.datos) && res.datos.length ? res.datos[0] : res.datos;
          if (!m) return alert('No se encontró el médico');
          document.getElementById('medico_accion').value = 'editar';
          document.getElementById('medico_id').value = m.medico_id || '';
          document.getElementById('medico_nombre').value = m.nombre || '';
          document.getElementById('medico_especialidad').value = m.especialidad_id || '';

          // Parsear horario si existe (formato: "HH:MM-HH:MM")
          if (m.horario && m.horario.includes('-')) {
            const partes = m.horario.split('-');
            document.getElementById('medico_hora_inicio').value = partes[0].trim() || '';
            document.getElementById('medico_hora_fin').value = partes[1].trim() || '';
          } else {
            document.getElementById('medico_hora_inicio').value = '';
            document.getElementById('medico_hora_fin').value = '';
          }

          document.getElementById('medico_email').value = m.email || '';
          document.getElementById('medico_telefono').value = m.telefono || '';
          document.getElementById('medico_cedula_profesional').value = m.cedula_profesional || '';
        }).catch(err => { console.error(err); alert('Error al obtener datos'); });
      });
    });
  }
  // carga inicial de médicos y opciones de especialidad
  document.addEventListener('DOMContentLoaded', function () {
    fetch('../controllers/medicos_list.php')
      .then(resp => resp.json())
      .then(respuesta => {
        if (respuesta && respuesta.exito && Array.isArray(respuesta.datos) && respuesta.datos.length) {
          renderizar(respuesta.datos);
        } else {
          console.error('Error al cargar médicos', respuesta && respuesta.error);
          // datos de ejemplo
          const ejemplos = [
            { medico_id: '1', nombre: 'Dr. Juan Perez', especialidad: 'Cardiología', horario: 'Lun-Vie 09:00-14:00' },
            { medico_id: '2', nombre: 'Dra. Ana Gómez', especialidad: 'Pediatría', horario: 'Mar-Jue 10:00-16:00' }
          ];
          renderizar(ejemplos);
        }
      }).catch(err => { console.error('Error al cargar médicos:', err); renderizar([{ medico_id: '1', nombre: 'Dr. Ejemplo', especialidad: 'Cardiología', horario: '-' }]); });

    // cargar opciones de especialidad en el formulario
    cargarEspecialidadesSelect();

    // Manejar envío del formulario con AJAX
    const form = document.getElementById('form_fallback_medico');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Validar horarios si se proporcionaron
        const horaInicio = document.getElementById('medico_hora_inicio').value;
        const horaFin = document.getElementById('medico_hora_fin').value;

        if (horaInicio || horaFin) {
          // Si se proporciona una, ambas son requeridas
          if (!horaInicio || !horaFin) {
            alert('Debe especificar tanto la hora de inicio como la hora de fin');
            return;
          }

          // Validar rango de horario (7:00 AM - 5:00 PM)
          if (horaInicio < '07:00' || horaInicio > '17:00') {
            alert('La hora de inicio debe estar entre 7:00 AM y 5:00 PM');
            return;
          }

          if (horaFin < '07:00' || horaFin > '17:00') {
            alert('La hora de fin debe estar entre 7:00 AM y 5:00 PM');
            return;
          }

          // Validar que hora fin sea mayor que hora inicio
          if (horaFin <= horaInicio) {
            alert('La hora de fin debe ser posterior a la hora de inicio');
            return;
          }
        }

        const formData = new FormData(form);

        fetch('../controllers/medicos.php', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            if (data.exito) {
              const accion = document.getElementById('medico_accion').value;
              const mensaje = accion === 'editar' ? 'Médico editado correctamente' : 'Médico guardado correctamente';

              const modalEl = document.getElementById('modal_exito_medico');
              const modalBodyP = modalEl.querySelector('.modal-body p');
              if (modalBodyP) modalBodyP.textContent = mensaje;

              const modalExito = new bootstrap.Modal(modalEl);
              modalExito.show();
              form.reset();
              document.getElementById('medico_accion').value = 'crear';
              document.getElementById('medico_id').value = '';
              // Recargar la tabla
              fetch('../controllers/medicos_list.php')
                .then(r => r.json())
                .then(res => {
                  if (res && res.exito && res.datos) {
                    renderizar(res.datos);
                  }
                });
            } else {
              alert('Error: ' + (data.error || 'No se pudo guardar'));
            }
          })
          .catch(err => {
            console.error(err);
            alert('Error de conexión al guardar médico');
          });
      });
    }
  });
})();

