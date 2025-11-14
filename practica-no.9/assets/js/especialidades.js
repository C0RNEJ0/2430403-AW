// Script mínimo: obtiene la lista desde el servidor y renderiza la tabla de especialidades
(function(){
  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
  function render(rows){
    const tbody = document.querySelector('#tabla_especialidades tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(r.nombre)}</td><td>${escapeHtml(r.descripcion)}</td><td></td>`;
      tbody.appendChild(tr);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    fetch('../controllers/especialidades_list.php')
      .then(resp => resp.json())
      .then(respuesta => {
        if(respuesta && respuesta.exito && Array.isArray(respuesta.datos)) render(respuesta.datos);
        else console.error('Error al cargar especialidades', respuesta && respuesta.error);
      })
      .catch(err => console.error('Error al cargar especialidades:', err));
  });
})();
