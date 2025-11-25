// agenda.js 
document.addEventListener('DOMContentLoaded', function () {
  // Variables globales
  let fechaActual = new Date();
  fechaActual.setDate(1); // Siempre empezar en día 1 del mes

  let citas = [];
  let pacientes = [];
  let medicos = [];

  // Iniciar
  cargarTodo();

  // Botones de navegación del calendario
  document.getElementById('cal_prev').onclick = function () {
    fechaActual.setMonth(fechaActual.getMonth() - 1);
    renderizarCalendario();
  };

  document.getElementById('cal_next').onclick = function () {
    fechaActual.setMonth(fechaActual.getMonth() + 1);
    renderizarCalendario();
  };

  // --- FUNCIONES PARA MODALES ---

  window.abrirModalNuevaCita = function () {
    document.getElementById('formulario_cita').reset();
    document.getElementById('cita_id').value = '';
    document.getElementById('accion_cita').value = 'crear';
    document.getElementById('titulo_modal_cita').innerText = 'Nueva Cita';
    document.getElementById('modal_cita').style.display = 'flex';
  };

  window.editarCita = function (id) {
    const cita = citas.find(c => c.cita_id == id);
    if (!cita) return;

    document.getElementById('cita_id').value = cita.cita_id;
    document.getElementById('accion_cita').value = 'editar';
    document.getElementById('cita_paciente').value = cita.paciente_id;
    document.getElementById('cita_medico').value = cita.medico_id;

    let partes = cita.fecha_hora_inicio.split(' ');
    document.getElementById('cita_fecha').value = partes[0];
    document.getElementById('cita_hora').value = partes[1].substring(0, 5);

    document.getElementById('cita_motivo').value = cita.motivo || '';
    document.getElementById('cita_estado').value = cita.estado;
    document.getElementById('cita_notas').value = cita.notas || '';

    document.getElementById('titulo_modal_cita').innerText = 'Editar Cita';
    document.getElementById('modal_cita').style.display = 'flex';
  };

  // Botón nueva cita
  const btnNueva = document.getElementById('btn_nueva_cita');
  if (btnNueva) {
    btnNueva.onclick = window.abrirModalNuevaCita;
  }

  // --- CARGA DE DATOS ---

  function cargarTodo() {
    // Cargar pacientes
    fetch('/practica-no.9/controllers/pacientes.php?api=listar')
      .then(res => res.json())
      .then(data => {
        pacientes = data.datos || [];
        llenarSelect('cita_paciente', pacientes, 'paciente_id', 'nombres', 'apellidos');
      });

    // Cargar médicos
    fetch('/practica-no.9/controllers/medicos_list.php')
      .then(res => res.json())
      .then(data => {
        medicos = data.datos || [];
        llenarSelectMedicos('cita_medico', medicos);
      });

    // Cargar citas y mostrar calendario
    cargarCitas();
  }

  function cargarCitas() {
    fetch('/practica-no.9/controllers/citas.php?accion=listar')
      .then(res => res.json())
      .then(data => {
        if (data.exito) {
          citas = data.datos || [];
          renderizarCalendario();
        }
      });
  }

  function llenarSelect(idSelect, datos, idField, nombreField, apellidoField) {
    const select = document.getElementById(idSelect);
    if (!select) return;

    let html = '<option value="">Seleccionar...</option>';
    datos.forEach(item => {
      html += `<option value="${item[idField]}">${item[nombreField]} ${item[apellidoField] || ''}</option>`;
    });
    select.innerHTML = html;
  }

  function llenarSelectMedicos(idSelect, datos) {
    const select = document.getElementById(idSelect);
    if (!select) return;

    let html = '<option value="">Seleccionar médico...</option>';
    datos.forEach(item => {
      html += `<option value="${item.medico_id}">${item.nombre}</option>`;
    });
    select.innerHTML = html;
  }

  // --- CALENDARIO ---

  function renderizarCalendario() {
    const grid = document.getElementById('cal_grid');
    if (!grid) return;

    // Actualizar título
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('cal_title').innerText = meses[fechaActual.getMonth()] + ' ' + fechaActual.getFullYear();

    // Calcular días
    const anio = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();

    const primerDiaSemana = new Date(anio, mes, 1).getDay(); // 0 = Domingo
    // Ajustar para que lunes sea 0
    // Aquí usaremos domingo como inicio estándar de JS 

    const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();

    let html = '<div class="table-responsive"><table class="table table-bordered">';
    html += '<thead><tr><th>Dom</th><th>Lun</th><th>Mar</th><th>Mie</th><th>Jue</th><th>Vie</th><th>Sab</th></tr></thead>';
    html += '<tbody><tr>';

    // Celdas vacías antes del primer día
    for (let i = 0; i < primerDiaSemana; i++) {
      html += '<td></td>';
    }

    // Días del mes
    let diaSemana = primerDiaSemana;
    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
      if (diaSemana > 6) {
        html += '</tr><tr>'; // Nueva fila
        diaSemana = 0;
      }

      // Buscar citas de este día
      // Formato fecha: YYYY-MM-DD
      let mesStr = (mes + 1).toString().padStart(2, '0');
      let diaStr = dia.toString().padStart(2, '0');
      let fechaStr = `${anio}-${mesStr}-${diaStr}`;

      let citasDia = citas.filter(c => c.fecha_hora_inicio.startsWith(fechaStr));

      html += `<td style="height: 100px; vertical-align: top;">
                        <div class="d-flex justify-content-between">
                            <strong>${dia}</strong>
                        </div>`;

      // Mostrar citas
      citasDia.forEach(c => {
        let hora = c.fecha_hora_inicio.split(' ')[1].substring(0, 5);
        html += `<div class="badge bg-info text-dark d-block mb-1" style="cursor:pointer; font-size:0.75rem" 
                              onclick="editarCita(${c.cita_id})">
                            ${hora} - ${c.paciente_nombre}
                         </div>`;
      });

      html += '</td>';
      diaSemana++;
    }

    // Completar última fila
    while (diaSemana <= 6) {
      html += '<td></td>';
      diaSemana++;
    }

    html += '</tr></tbody></table></div>';
    grid.innerHTML = html;
  }

  // --- FORMULARIO DE CITA ---

  // Guardar cita (submit del formulario)
  const form = document.getElementById('formulario_cita');
  if (form) {
    form.onsubmit = function (e) {
      e.preventDefault();

      const formData = new FormData(form);

      fetch('/practica-no.9/controllers/citas.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.exito) {
            alert('Guardado correctamente');
            document.getElementById('modal_cita').style.display = 'none';
            cargarCitas(); // Recargar calendario
          } else {
            alert('Error: ' + data.error);
          }
        });
    };
  }



  // Cerrar modales
  document.querySelectorAll('.modal-close, .btn-modal-secondary').forEach(btn => {
    btn.onclick = function () {
      this.closest('.modal-modern').style.display = 'none';
    };
  });
});
