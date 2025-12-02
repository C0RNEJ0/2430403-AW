(function () {
  // cargar datos del servidor
  async function cargar_datos() {
    try {
      let url = '../controllers/reportes.php?tipo=dashboard';

      // Agregar filtro de médico si existe
      const filtro = document.getElementById('filtro_medico');
      if (filtro && filtro.value) {
        url += `&medico_id=${filtro.value}`;
      }

      const respuesta = await fetch(url);
      const datos = await respuesta.json();

      if (datos.exito) {
        renderizar_dashboard(datos.datos);
      } else {
        console.error('Error al cargar reportes:', datos.error);
      }
    } catch (error) {
      console.error('Error en la peticion de reportes:', error);
    }
  }

  // Cargar médicos para el filtro (solo admin)
  async function cargar_medicos_filtro() {
    try {
      const res = await fetch('../controllers/medicos_list.php');
      const datos = await res.json();
      const sel = document.getElementById('filtro_medico');

      if (sel && datos.exito) {
        // Mantener la opción "Todos"
        sel.innerHTML = '<option value="">Todos los médicos</option>';

        datos.datos.forEach(m => {
          sel.appendChild(new Option(m.nombre, m.medico_id));
        });

        // Escuchar cambios
        sel.addEventListener('change', cargar_datos);
      }
    } catch (e) {
      console.error('Error cargando lista de médicos para filtro:', e);
    }
  }

  // Escuchar evento de sesión verificada para mostrar filtro a admins
  document.addEventListener('sesionVerificada', (e) => {
    const usuario = e.detail;
    if (usuario.rol === 'super_admin') {
      const container = document.getElementById('filtro_medico_container');
      if (container) {
        container.style.display = 'block';
        cargar_medicos_filtro();
      }
    }
  });

  // mostrar datos en la pantalla
  function renderizar_dashboard(datos) {
    // KPIs principales
    document.getElementById('kpi_ingresos').textContent = '$' + Number(datos.total).toFixed(2);
    document.getElementById('kpi_citas').textContent = datos.citas;
    document.getElementById('kpi_pacientes').textContent = datos.pacientes_nuevos;

    // tabla de transacciones
    const tabla_cuerpo = document.querySelector('#tabla_reportes tbody');
    if (tabla_cuerpo) {
      tabla_cuerpo.innerHTML = '';
      datos.transacciones.forEach(t => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${t.fecha}</td>
          <td>${t.paciente}</td>
          <td>${t.medico || 'N/A'}</td>
          <td>${t.servicio || 'N/A'}</td>
          <td>$${Number(t.monto).toFixed(2)}</td>
        `;
        tabla_cuerpo.appendChild(fila);
      });
    }

    // ingresos por médico 
  }

  // exportar a Excel
  function exportar_excel() {
    const tabla = document.querySelector('#tabla_reportes tbody');
    const filas = tabla.querySelectorAll('tr');

    if (filas.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let csv = 'REPORTE DE INGRESOS\n\n';
    csv += 'Fecha,Paciente,Médico,Servicio,Monto\n';

    filas.forEach(fila => {
      const celdas = fila.querySelectorAll('td');
      const valores = [];
      celdas.forEach(celda => {
        let texto = celda.textContent.trim();
        if (texto.includes(',')) texto = `"${texto}"`;
        valores.push(texto);
      });
      csv += valores.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_ingresos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  // exportar a PDF


  // imprimir reporte de transacciones
  async function imprimir_reporte() {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Título
      doc.setFontSize(18);
      doc.text('Reporte de Ingresos', 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);

      // Fecha y Filtro
      const fecha = new Date().toLocaleDateString();
      let subtitulo = `Fecha de emisión: ${fecha}`;

      const filtro = document.getElementById('filtro_medico');
      if (filtro && filtro.value) {
        const medicoNombre = filtro.options[filtro.selectedIndex].text;
        subtitulo += `\nMédico: ${medicoNombre}`;
      }

      doc.text(subtitulo, 14, 30);

      // Obtener datos de la tabla actual
      const filas = document.querySelectorAll('#tabla_reportes tbody tr');
      const body = [];

      filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length > 0) {
          body.push([
            celdas[0].textContent, // Fecha
            celdas[1].textContent, // Paciente
            celdas[2].textContent, // Médico
            celdas[3].textContent, // Servicio
            celdas[4].textContent  // Monto
          ]);
        }
      });

      if (body.length === 0) {
        alert('No hay datos para generar el reporte');
        return;
      }

      // Generar tabla
      doc.autoTable({
        head: [['Fecha', 'Paciente', 'Médico', 'Servicio', 'Monto']],
        body: body,
        startY: 45,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          4: { halign: 'right' } // Alinear monto a la derecha
        }
      });

      // Total
      const totalTexto = document.getElementById('kpi_ingresos').textContent;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total Ingresos: ${totalTexto}`, 14, doc.lastAutoTable.finalY + 10);

      // Guardar PDF
      doc.save('reporte_ingresos.pdf');
    } catch (e) {
      console.error('Error generando PDF de reporte:', e);
      alert('Error al generar el reporte PDF.');
    }
  }

  // cargar listas para el formulario
  async function cargar_listas() {
    try {
      // cargar pacientes
      const res_pac = await fetch('../controllers/pacientes.php?api=listar');
      const datos_pac = await res_pac.json();
      const sel_pac = document.getElementById('pago_paciente');
      if (sel_pac && datos_pac.exito) {
        sel_pac.innerHTML = '<option value="">Seleccione...</option>';
        datos_pac.datos.forEach(p => {
          sel_pac.appendChild(new Option(`${p.nombres} ${p.apellidos}`, p.paciente_id));
        });
      }

      // cargar médicos
      const res_med = await fetch('../controllers/medicos_list.php');
      const datos_med = await res_med.json();
      const sel_med = document.getElementById('pago_medico');
      if (sel_med && datos_med.exito) {
        sel_med.innerHTML = '<option value="">Seleccione...</option>';
        datos_med.datos.forEach(m => {
          sel_med.appendChild(new Option(m.nombre, m.medico_id));
        });
      }
    } catch (e) {
      console.error('Error cargando listas:', e);
    }
  }

  // abrir modal de nuevo pago
  function abrir_modal_pago() {
    const form = document.getElementById('form_pago');
    if (form) form.reset();

    const fecha = document.getElementById('pago_fecha');
    if (fecha) fecha.value = new Date().toISOString().split('T')[0];

    const modal = document.getElementById('modal_pago');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  // guardar pago
  async function guardar_pago(e) {
    e.preventDefault();
    const form = new FormData(e.target);

    try {
      const res = await fetch('../controllers/reportes.php', {
        method: 'POST',
        body: form
      });
      const datos = await res.json();

      if (datos.exito) {
        // Mostrar modal de éxito
        const modalExito = document.getElementById('modal_exito_pago');
        const modalBodyP = modalExito.querySelector('.modal-body p');
        if (modalBodyP) modalBodyP.textContent = 'Pago registrado correctamente';

        const bsModalExito = new bootstrap.Modal(modalExito);
        bsModalExito.show();

        // cerrar modal de formulario
        const modal = document.getElementById('modal_pago');
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');

        // recargar datos
        cargar_datos();
      } else {
        // Mostrar modal de error
        const modalError = document.getElementById('modal_error_pago');
        const modalBodyP = modalError.querySelector('.modal-body p');
        if (modalBodyP) modalBodyP.textContent = datos.error || 'Error al guardar el pago';

        const bsModalError = new bootstrap.Modal(modalError);
        bsModalError.show();
      }
    } catch (error) {
      console.error('Error:', error);

      // Mostrar modal de error
      const modalError = document.getElementById('modal_error_pago');
      const modalBodyP = modalError.querySelector('.modal-body p');
      if (modalBodyP) modalBodyP.textContent = 'Error al guardar pago: ' + error.message;

      const bsModalError = new bootstrap.Modal(modalError);
      bsModalError.show();
    }
  }

  // inicializar
  document.addEventListener('DOMContentLoaded', () => {
    cargar_datos();
    cargar_listas();

    // conectar botón de nuevo pago
    const btn_nuevo = document.getElementById('btn_nuevo_pago');
    if (btn_nuevo) {
      btn_nuevo.addEventListener('click', abrir_modal_pago);
    }

    const btn_reporte = document.getElementById('btn_imprimir_reporte');
    if (btn_reporte) {
      btn_reporte.addEventListener('click', imprimir_reporte);
    }

    // conectar formulario
    const form = document.getElementById('form_pago');
    if (form) {
      form.addEventListener('submit', guardar_pago);
    }

    // conectar botón de exportar
    const btn_export = document.getElementById('btn_export');
    if (btn_export) {
      // crear botón Excel
      const btn_excel = document.createElement('button');
      btn_excel.className = 'btn btn-success';
      btn_excel.innerHTML = '<i class="bi bi-file-excel"></i> Excel';
      btn_excel.onclick = exportar_excel;

      // reemplazar botón de exportar
      btn_export.replaceWith(btn_excel);
    }
  });
})();
