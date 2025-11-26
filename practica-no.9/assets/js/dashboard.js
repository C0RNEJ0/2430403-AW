(function () {
  // aqui cargamos los datos reales de la base de datos
  async function cargarDatos() {
    try {
      const respuesta = await fetch('../controllers/dashboard.php');
      const json = await respuesta.json();

      if (json.exito && json.datos) {
        mostrarKpis(json.datos);
        mostrarTransacciones(json.datos.transacciones);
        mostrarGraficas(json.datos);
      } else {
        console.error('Error cargando datos del dashboard:', json.error);
        mostrarDatosEjemplo();
      }
    } catch (error) {
      console.error('Error de conexion:', error);
      mostrarDatosEjemplo();
    }
  }

  function mostrarKpis(datos) {
    const kpiPacientes = document.getElementById('kpi_pacientes');
    const kpiConsultas = document.getElementById('kpi_consultas');
    const kpiDinero = document.getElementById('kpi_dinero');
    const kpiMedicos = document.getElementById('kpi_medicos');

    if (kpiPacientes) kpiPacientes.textContent = datos.pacientes_nuevos || 0;
    if (kpiConsultas) kpiConsultas.textContent = datos.citas || 0;
    if (kpiDinero) kpiDinero.textContent = '$' + (parseFloat(datos.total) || 0).toFixed(2);
    if (kpiMedicos) kpiMedicos.textContent = datos.por_medico ? datos.por_medico.length : 0;
  }

  function mostrarTransacciones(transacciones) {
    const tbody = document.querySelector('#tabla_pacientes tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!transacciones || transacciones.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay transacciones registradas</td></tr>';
      return;
    }

    transacciones.slice(0, 10).forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escaparHtml(t.fecha || '')}</td>
        <td>${escaparHtml(t.paciente || '')}</td>
        <td>${escaparHtml(t.medico || '')}</td>
        <td>${escaparHtml(t.servicio || '')}</td>
        <td>$${parseFloat(t.monto || 0).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  let chartLine = null;
  let chartPie = null;

  function mostrarGraficas(datos) {
    if (!datos.transacciones) return;

    // aqui agrupamos los ingresos por dia de los ultimos 7 dias
    const dias = [];
    const ingresosPorDia = {};

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const diaStr = fecha.toISOString().slice(0, 10);
      dias.push(diaStr);
      ingresosPorDia[diaStr] = 0;
    }

    datos.transacciones.forEach(t => {
      const fecha = t.fecha ? t.fecha.slice(0, 10) : '';
      if (ingresosPorDia.hasOwnProperty(fecha)) {
        ingresosPorDia[fecha] += parseFloat(t.monto || 0);
      }
    });

    const ingresos = dias.map(d => ingresosPorDia[d]);

    // grafica de linea de ingresos
    const ctxLine = document.getElementById('chart_line');
    if (ctxLine && typeof Chart !== 'undefined') {
      if (chartLine) chartLine.destroy();
      chartLine = new Chart(ctxLine.getContext('2d'), {
        type: 'line',
        data: {
          labels: dias.map(d => {
            const fecha = new Date(d + 'T00:00:00');
            return fecha.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
          }),
          datasets: [{
            label: 'Ingresos',
            data: ingresos,
            borderColor: '#2b8a67',
            backgroundColor: 'rgba(43,138,103,0.15)',
            tension: 0.3
          }]
        },
        options: { responsive: true }
      });
    }

    // grafica de pie por medico
    if (datos.por_medico && datos.por_medico.length > 0) {
      const labels = datos.por_medico.map(m => m.medico);
      const values = datos.por_medico.map(m => parseFloat(m.total_medico || 0));

      const ctxPie = document.getElementById('chart_pie');
      if (ctxPie && typeof Chart !== 'undefined') {
        if (chartPie) chartPie.destroy();
        chartPie = new Chart(ctxPie.getContext('2d'), {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: ['#4a9a6a', '#72c08f', '#f6c85f', '#f97c6a', '#9b59b6', '#3498db']
            }]
          },
          options: { responsive: true }
        });
      }
    }
  }

  function mostrarDatosEjemplo() {
    // datos de respaldo si falla la conexion
    const kpiPacientes = document.getElementById('kpi_pacientes');
    const kpiConsultas = document.getElementById('kpi_consultas');
    const kpiDinero = document.getElementById('kpi_dinero');
    const kpiMedicos = document.getElementById('kpi_medicos');

    if (kpiPacientes) kpiPacientes.textContent = '0';
    if (kpiConsultas) kpiConsultas.textContent = '0';
    if (kpiDinero) kpiDinero.textContent = '$0.00';
    if (kpiMedicos) kpiMedicos.textContent = '0';
  }

  function escaparHtml(texto) {
    if (!texto) return '';
    return String(texto).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    // recargar cada 30 segundos
    setInterval(cargarDatos, 30000);
  });

})();
