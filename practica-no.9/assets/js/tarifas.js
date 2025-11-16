(function(){
  // persistimos en servidor
  async function cargar(){ try{ const r = await fetch('../controllers/tarifas.php'); const j = await r.json(); return j.datos || []; }catch(e){ console.error('Error cargando tarifas', e); return []; } }
  async function guardarServidor(formData){ try{ const r = await fetch('../controllers/tarifas.php', { method:'POST', body: formData }); return await r.json(); }catch(e){ console.error('Error guardando tarifa', e); return { exito:false, error:e.message }; } }

  // util
  function q(selector, root=document){ return root.querySelector(selector); }

  // elementos
  const tablaBody = () => q('#tabla_tarifas tbody');
  const btnNuevo = () => q('#btn_nueva_tarifa');
  const modalEl = () => document.getElementById('modal_tarifa');
  const form = () => document.getElementById('form_tarifa');

  // seed inicial si no hay datos
  function seedSiVacio(){ return; }

  // siguiente id
  function nextId(list){ return 0; }

  // render tabla
  async function renderizarTabla(filtro){
    const datos = await cargar();
    const tbody = tablaBody(); if(!tbody) return;
    tbody.innerHTML = '';
    const qtxt = (filtro||'').toLowerCase().trim();
    datos.forEach(item=>{
      if(qtxt){ const hay = (item.especialidad||'').toLowerCase().includes(qtxt) || (item.servicio||'').toLowerCase().includes(qtxt); if(!hay) return; }
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.especialidad}</td>
        <td>${item.servicio}</td>
        <td>$ ${Number(item.precio).toFixed(2)}</td>
        <td>
          <button class="btn-edit" data-id="${item.tarifa_id}">Editar</button>
          <button class="btn-delete" data-id="${item.tarifa_id}">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // abrir modal 
  function abrirModal(){ try{ const bs = new bootstrap.Modal(modalEl()); bs.show(); }catch(e){ modalEl().style.display='block'; } }
  function cerrarModal(){ try{ const bs = bootstrap.Modal.getInstance(modalEl()); if(bs) bs.hide(); else modalEl().style.display='none'; }catch(e){ try{ modalEl().style.display='none'; }catch(e){} } }

  // nuevo/editar
  function prepararNuevo(){ if(q('#tarifa_id')) q('#tarifa_id').value = ''; if(q('#tarifa_especialidad')) q('#tarifa_especialidad').value=''; if(q('#tarifa_servicio')) q('#tarifa_servicio').value=''; if(q('#tarifa_precio')) q('#tarifa_precio').value=''; abrirModal(); }
  async function prepararEditar(id){ const r = await fetch('../controllers/tarifas.php?id=' + encodeURIComponent(id)); const j = await r.json(); const it = Array.isArray(j.datos) && j.datos.length ? j.datos[0] : null; if(!it) return alert('Tarifa no encontrada'); if(q('#tarifa_id')) q('#tarifa_id').value = it.tarifa_id; if(q('#tarifa_especialidad')) q('#tarifa_especialidad').value = it.especialidad; if(q('#tarifa_servicio')) q('#tarifa_servicio').value = it.servicio; if(q('#tarifa_precio')) q('#tarifa_precio').value = it.precio; abrirModal(); }

  // borrar
  async function borrar(id){ if(!confirm('Confirmar borrar tarifa')) return; const fd = new FormData(); fd.append('accion','eliminar'); fd.append('id', id); const res = await guardarServidor(fd); if(res && res.exito) renderizarTabla(); else alert('Error borrando tarifa'); }

  // guardar desde formulario
  async function handleGuardar(e){ e.preventDefault && e.preventDefault(); const id = q('#tarifa_id')? q('#tarifa_id').value : ''; const esp = q('#tarifa_especialidad')? q('#tarifa_especialidad').value.trim() : ''; const serv = q('#tarifa_servicio')? q('#tarifa_servicio').value.trim() : ''; const precio = q('#tarifa_precio')? parseFloat(q('#tarifa_precio').value) || 0 : 0; if(!esp||!serv){ alert('Especialidad y servicio requeridos'); return; }
    const fd = new FormData(); if(id) fd.append('id', id); fd.append('especialidad', esp); fd.append('servicio', serv); fd.append('precio', precio);
    const res = await guardarServidor(fd); if(res && res.exito){ cerrarModal(); renderizarTabla(); } else alert('Error guardando tarifa'); }

  // bind eventos
  function bind(){
    const btn = btnNuevo(); if(btn && !btn._bound){ btn.addEventListener('click', prepararNuevo); btn._bound = true; }
    const tbody = tablaBody(); if(tbody && !tbody._bound){ tbody.addEventListener('click', (e)=>{ const btn = e.target.closest('button'); if(!btn) return; const id = btn.getAttribute('data-id'); if(btn.classList.contains('btn-delete')) borrar(id); if(btn.classList.contains('btn-edit')) prepararEditar(id); }); tbody._bound = true; }
    const formEl = form(); if(formEl && !formEl._bound){ formEl.addEventListener('submit', handleGuardar); formEl._bound = true; }
    const buscador = q('#buscar_tarifas'); if(buscador && !buscador._bound){ buscador.addEventListener('input', ()=> renderizarTabla(buscador.value)); buscador._bound = true; }
  }

  // init
  async function init(){ seedSiVacio(); bind(); await renderizarTabla(); }
  document.addEventListener('DOMContentLoaded', init);

})();
