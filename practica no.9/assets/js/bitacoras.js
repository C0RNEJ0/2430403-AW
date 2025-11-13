(function(){
  const KEY = 'bitacoras';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
  function save(arr){ try{ localStorage.setItem(KEY, JSON.stringify(arr)); }catch(e){ console.error('no se pudo guardar bitacoras', e); } }

  let items = load();

  // ya cargados iniciales
  if(!items || !items.length){
    items = [
      { usuario: 'admin', rol: 'administrador', fecha: new Date().toISOString(), accion: 'login', modulo: 'login' },
      { usuario: 'juan', rol: 'medico', fecha: new Date().toISOString(), accion: 'crear cita', modulo: 'agenda' },
      { usuario: 'maria', rol: 'recepcion', fecha: new Date().toISOString(), accion: 'registro paciente', modulo: 'pacientes' }
    ];
    save(items);
  }
  // Helper para seleccionar elementos
  function q(sel, root=document){ return root.querySelector(sel); }

  function render(filter){
    const tbody = q('#tabla_bitacoras tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    const f = (filter||'').toLowerCase().trim();
    items.forEach(it=>{
      if(f){
        const hay = (it.usuario||'').toLowerCase().includes(f) || (it.accion||'').toLowerCase().includes(f) || (it.modulo||'').toLowerCase().includes(f);
        if(!hay) return;
      }
      // Render fila
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(it.usuario||'')}</td>
        <td>${escapeHtml(it.rol||'')}</td>
        <td>${escapeHtml(new Date(it.fecha||'').toLocaleString()||'')}</td>
        <td>${escapeHtml(it.accion||'')}</td>
        <td>${escapeHtml(it.modulo||'')}</td>
      `;
      tbody.appendChild(tr);
    });
  }
          
  function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
        // Inicializacion
  function init(){
    render();
    const buscador = q('#buscador');
    if(buscador && !buscador._bound){ buscador.addEventListener('input', ()=> render(buscador.value)); buscador._bound = true; }

    // boton para limpiar logs si existe
    const btnClear = document.createElement('button');
    btnClear.className = 'btn btn-sm btn-danger ms-2';
    btnClear.textContent = 'Limpiar bitacoras';
    btnClear.addEventListener('click', ()=>{
      if(!confirm('Borrar todas las bitacoras?')) return;
      items = []; save(items); render();
    });
    const header = document.querySelector('.page-content h1');
    if(header && !header._hasClear){ header.insertAdjacentElement('afterend', btnClear); header._hasClear = true; }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
