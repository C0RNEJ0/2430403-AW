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

  // inicializar
  document.addEventListener('DOMContentLoaded', () => {
    cargar_datos();

    // conectar boton de exportar (si existe, o agregar botones si faltan)
    const btn_export = document.getElementById('btn_export');
    if (btn_export) {
      // Reemplazar el boton unico por dos botones (PDF y Excel)
      const contenedor = btn_export.parentElement;

      const btn_pdf = document.createElement('button');
      btn_pdf.className = 'btn btn-danger me-2';
      btn_pdf.innerHTML = '<i class="bi bi-file-pdf"></i> PDF';
      btn_pdf.onclick = exportar_pdf;

      const btn_excel = document.createElement('button');
      btn_excel.className = 'btn btn-success';
      btn_excel.innerHTML = '<i class="bi bi-file-excel"></i> Excel';
      btn_excel.onclick = exportar_excel;

      contenedor.innerHTML = '';
      contenedor.appendChild(btn_pdf);
      contenedor.appendChild(btn_excel);
    }
  });
})();
