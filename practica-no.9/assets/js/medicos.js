(function () {
  try { console.log('medicos.js cargado v20251117.2'); } catch (_) { }
  function escaparHtml(s) { return String(s || '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": "&#39;" }[m])); }
  function renderizar(filas) {
    const tbody = document.querySelector('#medicosTable tbody'); if (!tbody) return;
    tbody.innerHTML = '';
    filas.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escaparHtml(f.nombre)}</td><td>${escaparHtml(f.especialidad)}</td><td>${escaparHtml(f.horario)}</td><td>
        <button class="accion-editar" data-id="${f.medico_id}">Editar</button>
        <button class="accion-eliminar" data-id="${f.medico_id}">Eliminar</button>
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
              location.reload();
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
          document.getElementById('medico_especialidad').value = m.especialidad || '';
          document.getElementById('medico_horario').value = m.horario || '';
          document.getElementById('medico_email').value = m.email || '';
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
        const formData = new FormData(form);

        fetch('../controllers/medicos.php', {
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            if (data.exito) {
              alert('Médico guardado correctamente');
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

