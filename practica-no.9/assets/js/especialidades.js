(function(){
  function escaparHtml(s){ return String(s||'').replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
  function renderizar(filas){
    const tbody = document.querySelector('#tabla_especialidades tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    filas.forEach(f=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escaparHtml(f.nombre)}</td><td>${escaparHtml(f.descripcion)}</td><td>
        <button class="accion-editar-especialidad" data-id="${f.especialidad_id}">Editar</button>
        <button class="accion-eliminar-especialidad" data-id="${f.especialidad_id}">Eliminar</button>
      </td>`;
      tbody.appendChild(tr);
    });
    adjuntarManejadoresEspecialidad();
  }
  // los eventos de editar y eliminar
  function adjuntarManejadoresEspecialidad(){
    document.querySelectorAll('.accion-eliminar-especialidad').forEach(btn=>{
      btn.addEventListener('click', function(){
        if(!confirm('Eliminar especialidad?')) return;
        const id = this.dataset.id;
        const f = new FormData(); f.append('accion','eliminar'); f.append('id', id);
        fetch('../controllers/especialidades.php', { method: 'POST', body: f }).then(()=> location.reload());
      });
    });
    // Editar especialidad
    document.querySelectorAll('.accion-editar-especialidad').forEach(btn=>{
      btn.addEventListener('click', function(){
        const id = this.dataset.id;
        fetch('../controllers/especialidades_list.php?id=' + encodeURIComponent(id)).then(r=>r.json()).then(res=>{
          if(!res || !res.exito) return alert('No se pudo obtener especialidad');
          const e = Array.isArray(res.datos) && res.datos.length ? res.datos[0] : res.datos;
          if(!e) return alert('Especialidad no encontrada');
          document.getElementById('especialidad_accion').value = 'editar';
          document.getElementById('especialidad_id').value = e.especialidad_id || '';
          document.getElementById('especialidad_nombre').value = e.nombre || '';
          document.getElementById('especialidad_descripcion').value = e.descripcion || '';
        }).catch(err=>{ console.error(err); alert('Error al obtener especialidad'); });
      });
    });
  }
      // carga inicial de especialidades
  document.addEventListener('DOMContentLoaded', function(){
    fetch('../controllers/especialidades_list.php')
      .then(resp => resp.json())
      .then(respuesta => {
        if(respuesta && respuesta.exito && Array.isArray(respuesta.datos) && respuesta.datos.length) {
          renderizar(respuesta.datos);
        } else {
          console.error('Error al cargar especialidades', respuesta && respuesta.error);
          // datos de ejemplo 
          const ejemplos = [
            { especialidad_id: '1', nombre: 'Cardiología', descripcion: 'Enfermedades del corazón' },
            { especialidad_id: '2', nombre: 'Pediatría', descripcion: 'Atención a niños' }
          ];
          renderizar(ejemplos);
        }
      })
      .catch(err => console.error('Error al cargar especialidades:', err));
  });
})();
