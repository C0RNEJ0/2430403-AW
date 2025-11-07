(function(){
  // Manejo de pagos simple en localStorage (clave 'pagos')
  const CLAVE = 'pagos';
  function cargar(){ try{ return JSON.parse(localStorage.getItem(CLAVE)) || []; }catch(e){ return []; } }
  function guardar(data){ try{ localStorage.setItem(CLAVE, JSON.stringify(data)); }catch(e){ console.error('Error guardando pagos', e); } }

  // util
  function q(sel, root=document){ return root.querySelector(sel); }

  // elementos
  const tbody = () => q('#tabla_pagos tbody');
  const btnNuevo = () => q('#btn_nuevo_pago');
  const form = () => q('#form_pago');
  const modalEl = () => document.getElementById('modal_pago');

  // seed
  function seedSiVacio(){ const d = cargar(); if(d.length) return; const hoy = new Date().toISOString().slice(0,10); const inicial = [
    { id:1, fecha:hoy, paciente:'Ana Perez', medico:'Dr. Perez', servicio:'Consulta general', monto:250.00 },
    { id:2, fecha:hoy, paciente:'Luis Gomez', medico:'Dra. Ruiz', servicio:'Consulta pediátrica', monto:300.00 },
    { id:3, fecha:hoy, paciente:'Maria Lopez', medico:'Dr. Perez', servicio:'Consulta dermatológica', monto:400.00 }
  ]; guardar(inicial); }

  function nextId(list){ if(!Array.isArray(list)||!list.length) return 1; const nums = list.map(x=>Number(x.id)).filter(n=>Number.isFinite(n)); return nums.length? Math.max(...nums)+1 : 1; }

  function renderizar(filtro){
    const datos = cargar();
    const tb = tbody();
    if(!tb) return;
    tb.innerHTML = '';
    const qtxt = (filtro||'').toLowerCase().trim();
    datos.forEach(it=>{
      if(qtxt){
        const hay = (it.paciente||'').toLowerCase().includes(qtxt) || (it.servicio||'').toLowerCase().includes(qtxt);
        if(!hay) return;
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${it.fecha}</td><td>${it.paciente}</td><td>${it.medico||''}</td><td>${it.servicio||''}</td><td>$ ${Number(it.monto).toFixed(2)}</td><td><button class="btn-edit" data-id="${it.id}">Editar</button> <button class="btn-delete" data-id="${it.id}">Borrar</button></td>`;
      tb.appendChild(tr);
    });
  }

  function abrirModal(){ try{ const bs = new bootstrap.Modal(modalEl()); bs.show(); }catch(e){ modalEl().style.display='block'; } }
  function cerrarModal(){ try{ const bs = bootstrap.Modal.getInstance(modalEl()); if(bs) bs.hide(); else modalEl().style.display='none'; }catch(e){ try{ modalEl().style.display='none'; }catch(e){} } }

  function prepararNuevo(){ if(q('#pago_id')) q('#pago_id').value=''; if(q('#pago_fecha')) q('#pago_fecha').value = new Date().toISOString().slice(0,10); if(q('#pago_paciente')) q('#pago_paciente').value=''; if(q('#pago_medico')) q('#pago_medico').value=''; if(q('#pago_servicio')) q('#pago_servicio').value=''; if(q('#pago_monto')) q('#pago_monto').value=''; abrirModal(); }
  function prepararEditar(id){ const datos = cargar(); const it = datos.find(x=>Number(x.id)===Number(id)); if(!it) return alert('Pago no encontrado'); if(q('#pago_id')) q('#pago_id').value = it.id; if(q('#pago_fecha')) q('#pago_fecha').value = it.fecha; if(q('#pago_paciente')) q('#pago_paciente').value = it.paciente; if(q('#pago_medico')) q('#pago_medico').value = it.medico||''; if(q('#pago_servicio')) q('#pago_servicio').value = it.servicio||''; if(q('#pago_monto')) q('#pago_monto').value = it.monto; abrirModal(); }

  function borrar(id){ if(!confirm('Confirmar borrar pago')) return; let datos = cargar(); datos = datos.filter(x=>Number(x.id)!==Number(id)); guardar(datos); renderizar(); }

  function handleGuardar(e){ e.preventDefault && e.preventDefault(); const id = q('#pago_id')? q('#pago_id').value : ''; const fecha = q('#pago_fecha')? q('#pago_fecha').value : ''; const paciente = q('#pago_paciente')? q('#pago_paciente').value.trim() : ''; const medico = q('#pago_medico')? q('#pago_medico').value.trim() : ''; const servicio = q('#pago_servicio')? q('#pago_servicio').value.trim() : ''; const monto = q('#pago_monto')? parseFloat(q('#pago_monto').value) || 0 : 0; if(!fecha||!paciente||!monto){ alert('Fecha, paciente y monto son requeridos'); return; } const datos = cargar(); if(id){ const idx = datos.findIndex(x=>Number(x.id)===Number(id)); if(idx>=0){ datos[idx] = { ...datos[idx], fecha, paciente, medico, servicio, monto }; } } else { datos.push({ id: nextId(datos), fecha, paciente, medico, servicio, monto }); } guardar(datos); cerrarModal(); renderizar(); }

  function bind(){ const btn = btnNuevo(); if(btn && !btn._bound){ btn.addEventListener('click', prepararNuevo); btn._bound = true; } const tb = tbody(); if(tb && !tb._bound){ tb.addEventListener('click', (e)=>{ const b = e.target.closest('button'); if(!b) return; const id = b.getAttribute('data-id'); if(b.classList.contains('btn-borrar')) borrar(id); if(b.classList.contains('btn-editar')) prepararEditar(id); }); tb._bound = true; } const f = form(); if(f && !f._bound){ f.addEventListener('submit', handleGuardar); f._bound = true; } const busc = q('#buscar_pagos'); if(busc && !busc._bound){ busc.addEventListener('input', ()=> renderizar(busc.value)); busc._bound = true; } }

  function init(){ seedSiVacio(); bind(); renderizar(); }
  document.addEventListener('DOMContentLoaded', init);

})();
