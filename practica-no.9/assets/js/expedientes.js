(function () {
  function q(sel) { return document.querySelector(sel); }

  async function buscar(idore) {
    try {
      const res = await fetch('../controllers/expedientes.php?buscar=' + encodeURIComponent(idore));
      const j = await res.json();
      return j;
    } catch (e) { return { exito: false, error: e.message }; }
  }

  async function mostrar(valor) {
    const cont = q('#resultado_expediente'); if (!cont) return;
    cont.innerHTML = 'Cargando...';
    const r = await buscar(valor);
    if (!r.exito) {
      cont.innerHTML = '<div class="alert alert-danger">' + (r.error || 'Error al buscar expediente') + '</div>';
      return;
    }
    if (!r.datos || r.datos.length === 0) {
      cont.innerHTML = '<div class="alert alert-info">No se encontraron expedientes para este paciente</div>';
      return;
    }

    // renderizar expedientes encontrados
    let html = '<div class="row g-3">';
    r.datos.forEach(it => {
      html += '<div class="col-12"><div class="card">';
      html += '<div class="card-body">';
      html += '<h5 class="card-title">Paciente: ' + (it.nombres + ' ' + (it.apellidos || '')) + '</h5>';
      html += '<p class="mb-1"><strong>Fecha:</strong> ' + (it.fecha || '') + '</p>';
      html += '<p class="mb-1"><strong>Motivo:</strong> ' + (it.motivo || 'Sin motivo') + '</p>';
      html += '<p class="mb-1"><strong>Notas:</strong> ' + (it.notas || 'Sin notas') + '</p>';
      html += '</div></div></div>';
    });
    html += '</div>';
    cont.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const b = q('#buscar_expediente'); if (!b) return;
    const btnBuscar = q('#btn_buscar');

    // buscar al presionar Enter
    b.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        mostrar(b.value);
      }
    });

    // buscar al hacer clic en el botón
    if (btnBuscar) {
      btnBuscar.addEventListener('click', () => {
        mostrar(b.value);
      });
    }
  });
})();
