(function(){
  // Manejo simple de tarifas en localStorage (clave: 'tarifas')
  const CLAVE = 'tarifas';
  function cargar(){ try{ return JSON.parse(localStorage.getItem(CLAVE)) || []; }catch(e){ return []; } }
  function guardar(data){ try{ localStorage.setItem(CLAVE, JSON.stringify(data)); }catch(e){ console.error('Error guardando tarifas', e); } }

  // util
  function q(selector, root=document){ return root.querySelector(selector); }

  // elementos
  const tablaBody = () => q('#tabla_tarifas tbody');
  const btnNuevo = () => q('#btn_nueva_tarifa');
  const modalEl = () => document.getElementById('modal_tarifa');
  const form = () => document.getElementById('form_tarifa');

  // seed inicial (3 entradas)
  function seedSiVacio(){
    const datos = cargar();
    if(datos.length) return;
    const inicial = [
      { id:1, especialidad:'General', servicio:'Consulta general', precio: 250.00 },
      { id:2, especialidad:'Pediatría', servicio:'Consulta pediátrica', precio: 300.00 },
      { id:3, especialidad:'Dermatología', servicio:'Consulta dermatológica', precio: 400.00 }
    ];
    guardar(inicial);
  }

  // siguiente id
  function nextId(list){ if(!Array.isArray(list)||!list.length) return 1; const nums = list.map(x=>Number(x.id)).filter(n=>Number.isFinite(n)); return nums.length? Math.max(...nums)+1 : 1; }

  // render tabla
  function renderizarTabla(filtro){
    const datos = cargar();
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
          <button class="btn-edit" data-id="${item.id}">Editar</button>
          <button class="btn-delete" data-id="${item.id}">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // abrir modal (bootstrap)
  function abrirModal(){ try{ const bs = new bootstrap.Modal(modalEl()); bs.show(); }catch(e){ modalEl().style.display='block'; } }
  function cerrarModal(){ try{ const bs = bootstrap.Modal.getInstance(modalEl()); if(bs) bs.hide(); else modalEl().style.display='none'; }catch(e){ try{ modalEl().style.display='none'; }catch(e){} } }

  // nuevo/editar
  function prepararNuevo(){ if(q('#tarifa_id')) q('#tarifa_id').value = ''; if(q('#tarifa_especialidad')) q('#tarifa_especialidad').value=''; if(q('#tarifa_servicio')) q('#tarifa_servicio').value=''; if(q('#tarifa_precio')) q('#tarifa_precio').value=''; abrirModal(); }
  function prepararEditar(id){ const datos = cargar(); const it = datos.find(x=>Number(x.id)===Number(id)); if(!it) return alert('Tarifa no encontrada'); if(q('#tarifa_id')) q('#tarifa_id').value = it.id; if(q('#tarifa_especialidad')) q('#tarifa_especialidad').value = it.especialidad; if(q('#tarifa_servicio')) q('#tarifa_servicio').value = it.servicio; if(q('#tarifa_precio')) q('#tarifa_precio').value = it.precio; abrirModal(); }

  // borrar
  function borrar(id){ if(!confirm('Confirmar borrar tarifa')) return; let datos = cargar(); datos = datos.filter(x=>Number(x.id)!==Number(id)); guardar(datos); renderizarTabla(); }

  // guardar desde formulario
  function handleGuardar(e){ e.preventDefault && e.preventDefault(); const id = q('#tarifa_id')? q('#tarifa_id').value : ''; const esp = q('#tarifa_especialidad')? q('#tarifa_especialidad').value.trim() : ''; const serv = q('#tarifa_servicio')? q('#tarifa_servicio').value.trim() : ''; const precio = q('#tarifa_precio')? parseFloat(q('#tarifa_precio').value) || 0 : 0; if(!esp||!serv){ alert('Especialidad y servicio requeridos'); return; }
    const datos = cargar(); if(id){ const idx = datos.findIndex(x=>Number(x.id)===Number(id)); if(idx>=0){ datos[idx] = { ...datos[idx], especialidad:esp, servicio:serv, precio }; } } else { datos.push({ id: nextId(datos), especialidad:esp, servicio:serv, precio }); }
    guardar(datos); cerrarModal(); renderizarTabla(); }

  // bind eventos
  function bind(){
    const btn = btnNuevo(); if(btn && !btn._bound){ btn.addEventListener('click', prepararNuevo); btn._bound = true; }
    const tbody = tablaBody(); if(tbody && !tbody._bound){ tbody.addEventListener('click', (e)=>{ const btn = e.target.closest('button'); if(!btn) return; const id = btn.getAttribute('data-id'); if(btn.classList.contains('btn-borrar')) borrar(id); if(btn.classList.contains('btn-editar')) prepararEditar(id); }); tbody._bound = true; }
    const formEl = form(); if(formEl && !formEl._bound){ formEl.addEventListener('submit', handleGuardar); formEl._bound = true; }
    const buscador = q('#buscar_tarifas'); if(buscador && !buscador._bound){ buscador.addEventListener('input', ()=> renderizarTabla(buscador.value)); buscador._bound = true; }
  }

  // init
  function init(){ seedSiVacio(); bind(); renderizarTabla(); }
  document.addEventListener('DOMContentLoaded', init);

})();
