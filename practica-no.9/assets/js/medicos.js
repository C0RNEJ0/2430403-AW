(function(){
  function escaparHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
  function renderizar(filas){
    const tbody = document.querySelector('#medicosTable tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    filas.forEach(f=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escaparHtml(f.nombre)}</td><td>${escaparHtml(f.especialidad)}</td><td>${escaparHtml(f.horario)}</td><td>
        <button class="accion-editar" data-id="${f.medico_id}">Editar</button>
        <button class="accion-eliminar" data-id="${f.medico_id}">Eliminar</button>
      </td>`;
      tbody.appendChild(tr);
    });
    adjuntarManejadoresFilas();
    try{ if(window.jQuery && $.fn.dataTable){ $("#medicosTable").DataTable(); } }catch(e){}
  }
         // elementos de editar y eliminar
  function adjuntarManejadoresFilas(){
    document.querySelectorAll('.accion-eliminar').forEach(btn=>{
      btn.addEventListener('click', function(){
        if(!confirm('Eliminar médico?')) return;
        const id = this.dataset.id;
        const f = new FormData(); f.append('accion','eliminar'); f.append('id', id);
        fetch('../controllers/medicos.php', { method: 'POST', body: f }).then(()=> location.reload());
      });
    });
    
    document.querySelectorAll('.accion-editar').forEach(btn=>{
      btn.addEventListener('click', function(){
        const id = this.dataset.id;
        fetch('../controllers/medicos_list.php?id=' + encodeURIComponent(id)).then(r=>r.json()).then(res=>{
          if(!res || !res.exito) return alert('No se pudo obtener datos del médico');
          const m = Array.isArray(res.datos) && res.datos.length ? res.datos[0] : res.datos;
          if(!m) return alert('No se encontró el médico');
          document.getElementById('medico_accion').value = 'editar';
          document.getElementById('medico_id').value = m.medico_id || '';
          document.getElementById('medico_nombre').value = m.nombre || '';
          document.getElementById('medico_especialidad').value = m.especialidad || '';
          document.getElementById('medico_horario').value = m.horario || '';
          document.getElementById('medico_email').value = m.email || '';
        }).catch(err=>{ console.error(err); alert('Error al obtener datos'); });
      });
    });
  }
  // carga inicial de médicos
  document.addEventListener('DOMContentLoaded', function(){
    fetch('../controllers/medicos_list.php')
      .then(resp => resp.json())
      .then(respuesta => {
        if(respuesta && respuesta.exito && Array.isArray(respuesta.datos)) render(respuesta.datos);
        else console.error('Error al cargar médicos', respuesta && respuesta.error);
      }).catch(err => console.error('Error al cargar médicos:', err));
  });
})();

