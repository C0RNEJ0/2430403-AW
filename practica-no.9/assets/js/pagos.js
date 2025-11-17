(function(){
  //  gestion de pagos con los datos precargados para que se mire fregon
  // ahora persistimos en el servidor usando controllers/pagos.php
  async function cargar(){ try{ const r = await fetch('../controllers/pagos.php'); return (await r.json()).datos || []; }catch(e){ console.error('Error cargando pagos', e); return []; } }
  async function guardarServidor(formData){ try{ const r = await fetch('../controllers/pagos.php', { method: 'POST', body: formData }); return await r.json(); }catch(e){ console.error('Error guardando pago', e); return { exito:false, error: e.message }; } }

  // util
  function q(sel, root=document){ return root.querySelector(sel); }

  // elementos
  const tbody = () => q('#tabla_pagos tbody');
  const btnNuevo = () => q('#btn_nuevo_pago');
  const form = () => q('#form_pago');
  const modalEl = () => document.getElementById('modal_pago');

  // seed inicial si no hay datos
  // seed queda al servidor; no hacemos seed local
  function seedSiVacio(){ return; }

  // render tabla de pagos (desde servidor)
  async function renderizar(filtro){
    const datos = await cargar();
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
      tr.innerHTML = `<td>${it.fecha}</td><td>${it.paciente}</td><td>${it.medico||''}</td><td>${it.servicio||''}</td><td>$ ${Number(it.monto).toFixed(2)}</td><td><button class="btn-edit" data-id="${it.pago_id}">Editar</button> <button class="btn-delete" data-id="${it.pago_id}">Borrar</button></td>`;
      tb.appendChild(tr);
    });
  }
             // abrir/cerrar modal
  function abrirModal(){ try{ const bs = new bootstrap.Modal(modalEl()); bs.show(); }catch(e){ modalEl().style.display='block'; } }
  function cerrarModal(){ try{ const bs = bootstrap.Modal.getInstance(modalEl()); if(bs) bs.hide(); else modalEl().style.display='none'; }catch(e){ try{ modalEl().style.display='none'; }catch(e){} } }
     // nuevo/editar
  function prepararNuevo(){ if(q('#pago_id')) q('#pago_id').value=''; if(q('#pago_fecha')) q('#pago_fecha').value = new Date().toISOString().slice(0,10); if(q('#pago_paciente')) q('#pago_paciente').value=''; if(q('#pago_medico')) q('#pago_medico').value=''; if(q('#pago_servicio')) q('#pago_servicio').value=''; if(q('#pago_monto')) q('#pago_monto').value=''; abrirModal(); }
  async function prepararEditar(id){ const r = await fetch('../controllers/pagos.php?id=' + encodeURIComponent(id)); const j = await r.json(); const it = Array.isArray(j.datos) && j.datos.length? j.datos[0] : null; if(!it) return alert('Pago no encontrado'); if(q('#pago_id')) q('#pago_id').value = it.pago_id; if(q('#pago_fecha')) q('#pago_fecha').value = it.fecha; if(q('#pago_paciente')) q('#pago_paciente').value = it.paciente; if(q('#pago_medico')) q('#pago_medico').value = it.medico||''; if(q('#pago_servicio')) q('#pago_servicio').value = it.servicio||''; if(q('#pago_monto')) q('#pago_monto').value = it.monto; abrirModal(); }
      async function poblarSelects(){
        try{
          const r1 = await fetch('../controllers/pacientes.php?api=listar'); const jp = await r1.json(); const selP = q('#pago_paciente'); if(selP){ selP.innerHTML=''; selP.appendChild(new Option('Seleccione','')); if(jp.exito && Array.isArray(jp.datos)) jp.datos.forEach(p=> selP.appendChild(new Option((p.nombres||'')+' '+(p.apellidos||''), p.paciente_id)) ); }
          const r2 = await fetch('../controllers/medicos_list.php'); const jm = await r2.json(); const selM = q('#pago_medico'); if(selM){ selM.innerHTML=''; selM.appendChild(new Option('Seleccione','')); if(jm.exito && Array.isArray(jm.datos)) jm.datos.forEach(m=> selM.appendChild(new Option(m.nombre||'', m.medico_id)) ); }
        }catch(e){ console.error('Error poblando selects pagos', e); }
      }
  // borrar via servidor
  async function borrar(id){ if(!confirm('Confirmar borrar pago')) return; const f = new FormData(); f.append('accion','eliminar'); f.append('id', id); const res = await guardarServidor(f); if(res && res.exito){ renderizar(); } else alert('Error borrando pago'); }
 // guardar (nuevo y editar)
  async function handleGuardar(e){ e.preventDefault && e.preventDefault(); const id = q('#pago_id')? q('#pago_id').value : ''; const fecha = q('#pago_fecha')? q('#pago_fecha').value : ''; const paciente_id = q('#pago_paciente')? q('#pago_paciente').value : ''; const paciente = q('#pago_paciente')? q('#pago_paciente').selectedOptions[0].text : ''; const medico = q('#pago_medico')? q('#pago_medico').value : ''; const servicio = q('#pago_servicio')? q('#pago_servicio').value.trim() : ''; const monto = q('#pago_monto')? parseFloat(q('#pago_monto').value) || 0 : 0; const cita_id = q('#pago_cita_id')? q('#pago_cita_id').value : ''; const metodo = q('#pago_metodo')? q('#pago_metodo').value : ''; const referencia = q('#pago_referencia')? q('#pago_referencia').value : ''; const nota = q('#pago_nota')? q('#pago_nota').value : '';
    if(!fecha||!paciente||!monto){ alert('Fecha, paciente y monto son requeridos'); return; }
    const fd = new FormData(); if(id) fd.append('id', id); fd.append('fecha', fecha); fd.append('paciente', paciente); fd.append('paciente_id', paciente_id); fd.append('medico', medico); fd.append('servicio', servicio); fd.append('monto', monto); fd.append('cita_id', cita_id); fd.append('metodo_pago', metodo); fd.append('referencia', referencia); fd.append('nota', nota);
    const res = await guardarServidor(fd); if(res && res.exito){ cerrarModal(); renderizar(); } else alert('Error guardando pago: '+(res && res.error)); }
 //
  function bind(){ const btn = btnNuevo(); if(btn && !btn._bound){ btn.addEventListener('click', prepararNuevo); btn._bound = true; } const tb = tbody(); if(tb && !tb._bound){ tb.addEventListener('click', (e)=>{ const b = e.target.closest('button'); if(!b) return; const id = b.getAttribute('data-id'); if(b.classList.contains('btn-delete')) borrar(id); if(b.classList.contains('btn-edit')) prepararEditar(id); }); tb._bound = true; } const f = form(); if(f && !f._bound){ f.addEventListener('submit', handleGuardar); f._bound = true; } const busc = q('#buscar_pagos'); if(busc && !busc._bound){ busc.addEventListener('input', ()=> renderizar(busc.value)); busc._bound = true; } }
 // inicializacion de todo
  async function init(){ seedSiVacio(); bind(); await renderizar(); }
  // poblar selects al inicio (si el elemento existe)
  (async function(){ await poblarSelects(); })();
  document.addEventListener('DOMContentLoaded', init);

})();
