(function () {
  // cargar datos del servidor
  async function cargar_datos() {
    try {
      const respuesta = await fetch('../controllers/reportes.php?tipo=dashboard');
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

  // mostrar datos en la pantalla
  function renderizar_dashboard(datos) {
    // KPIs
    document.getElementById('kpi_ingresos').textContent = '$' + Number(datos.total).toFixed(2);
    document.getElementById('kpi_citas').textContent = datos.citas;
    document.getElementById('kpi_pacientes').textContent = datos.pacientes_nuevos;

    // Tabla de transacciones
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

    // Ingresos por medico (opcional, si queremos mostrarlo en algun lado)
    // Por ahora solo lo dejamos disponible en memoria por si se necesita
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

  // exportar a PDF (HTML simple)
  function exportar_pdf() {
    const tabla = document.querySelector('#tabla_reportes tbody');
    const filas = tabla.querySelectorAll('tr');

    if (filas.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    let html = '<html><head><style>';
    html += 'body { font-family: Arial; margin: 30px; }';
    html += 'h1 { text-align: center; }';
    html += 'table { width: 100%; border-collapse: collapse; margin-top: 20px; }';
    html += 'th, td { border: 1px solid black; padding: 5px; font-size: 12px; }';
    html += 'th { background-color: #ddd; }';
    html += '</style></head><body>';
    html += '<h1>REPORTE DE INGRESOS</h1>';
    html += `<p>Fecha: ${new Date().toLocaleDateString()}</p>`;
    html += '<table>';
    html += '<tr><th>Fecha</th><th>Paciente</th><th>Médico</th><th>Servicio</th><th>Monto</th></tr>';

    filas.forEach(fila => {
      const celdas = fila.querySelectorAll('td');
      html += '<tr>';
      celdas.forEach(celda => {
        html += `<td>${celda.textContent.trim()}</td>`;
      });
      html += '</tr>';
    });

    html += '</table></body></html>';

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_ingresos_${new Date().toISOString().split('T')[0]}.html`;
    link.click();

    alert('Archivo HTML descargado. Ábrelo y guárdalo como PDF (Ctrl+P)');
  }

  // cargar listas para el formulario
  async function cargar_listas() {
    try {
      // Cargar pacientes
      const res_pac = await fetch('../controllers/pacientes.php?api=listar');
      const datos_pac = await res_pac.json();
      const sel_pac = document.getElementById('pago_paciente');
      if (sel_pac && datos_pac.exito) {
        sel_pac.innerHTML = '<option value="">Seleccione...</option>';
        datos_pac.datos.forEach(p => {
          sel_pac.appendChild(new Option(`${p.nombres} ${p.apellidos}`, p.paciente_id));
        });
      }

      // Cargar medicos
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
        alert('Pago registrado correctamente');
        // cerrar modal (usando bootstrap o estilo directo)
        const modal = document.getElementById('modal_pago');
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');

        // recargar datos
        cargar_datos();
      } else {
        alert('Error al guardar: ' + datos.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar pago');
    }
  }

  // inicializar
  document.addEventListener('DOMContentLoaded', () => {
    cargar_datos();
    cargar_listas();

    // conectar boton de nuevo pago
    const btn_nuevo = document.getElementById('btn_nuevo_pago');
    if (btn_nuevo) {
      btn_nuevo.addEventListener('click', abrir_modal_pago);
    }

    // conectar formulario
    const form = document.getElementById('form_pago');
    if (form) {
      form.addEventListener('submit', guardar_pago);
    }

    // conectar boton de exportar (si existe, o agregar botones si faltan)
    const btn_export = document.getElementById('btn_export');
    if (btn_export) {
      // Crear botones PDF y Excel
      const btn_pdf = document.createElement('button');
      btn_pdf.className = 'btn btn-danger me-2';
      btn_pdf.innerHTML = '<i class="bi bi-file-pdf"></i> PDF';
      btn_pdf.onclick = exportar_pdf;

      const btn_excel = document.createElement('button');
      btn_excel.className = 'btn btn-success';
      btn_excel.innerHTML = '<i class="bi bi-file-excel"></i> Excel';
      btn_excel.onclick = exportar_excel;

      // Reemplazar solo el botón de exportar, no todo el contenedor
      btn_export.replaceWith(btn_pdf, btn_excel);
    }
  });
})();
