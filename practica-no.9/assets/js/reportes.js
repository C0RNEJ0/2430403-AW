(function(){
  function q(sel,root=document){ return root.querySelector(sel); }
  async function cargar(desde, hasta){ try{ const url = `../controllers/reportes.php?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`; const r = await fetch(url); return await r.json(); }catch(e){ console.error(e); return { exito:false }; } }
  function renderTransacciones(lista){ const tbody = q('#tabla_reportes tbody'); if(!tbody) return; tbody.innerHTML=''; lista.forEach(t=>{ const tr = document.createElement('tr'); tr.innerHTML = `<td>${t.fecha}</td><td>${t.paciente}</td><td>${t.medico||''}</td><td>${t.servicio||''}</td><td>$ ${Number(t.monto).toFixed(2)}</td>`; tbody.appendChild(tr); }); }
  function renderKPIs(obj){ if(q('#kpi_ingresos')) q('#kpi_ingresos').textContent = '$' + Number(obj.total||0).toFixed(2); if(q('#kpi_citas')) q('#kpi_citas').textContent = obj.citas || 0; if(q('#kpi_pacientes')) q('#kpi_pacientes').textContent = obj.pacientes_nuevos || 0; }
  async function init(){
    // Cargar todos los reportes sin pedir rango (sin modal)
    const desde = '0000-01-01';
    const hasta = '9999-12-31';

    // mostrar etiqueta indicando que se están mostrando todos los reportes
    try{
      const encabezado = document.querySelector('.page-content h1') || document.querySelector('h1');
      if(encabezado){
        let etiqueta = document.getElementById('reportes_rango');
        if(!etiqueta){
          etiqueta = document.createElement('div');
          etiqueta.id = 'reportes_rango';
          etiqueta.style.fontSize = '0.95rem';
          etiqueta.style.opacity = '0.85';
          etiqueta.style.marginTop = '6px';
          encabezado.insertAdjacentElement('afterend', etiqueta);
        }
        etiqueta.textContent = 'Rango: Todos los reportes';
      }
    }catch(e){ /* no bloquear si falla */ }

    const data = await cargar(desde,hasta);
    if(!data.exito){ console.error('Error cargando reportes', data); return; }
    renderTransacciones(data.datos.transacciones);
    renderKPIs(data.datos);
    // render por medico
    const cont = document.createElement('div'); cont.style.marginTop='16px';
    data.datos.por_medico.forEach(m=>{ const card = document.createElement('div'); card.className='p-2 bg-light rounded mb-2'; card.innerHTML = `<strong>${m.medico||'Sin médico'}</strong>: $ ${Number(m.total_medico||0).toFixed(2)}`; cont.appendChild(card); });
    const targetCard = document.querySelector('.page-content .card:last-of-type');
    if(targetCard) targetCard.appendChild(cont);
  }
  document.addEventListener('DOMContentLoaded', init);
})();
(function(){
  // reportes de citas, pagos y pacientes 
  const CL_CITAS = 'citas';
  const CL_PAGOS = 'pagos';
  const CL_PAC = 'cs_pacientes_v1';

  function cargar(cl){ try{ return JSON.parse(localStorage.getItem(cl)) || []; }catch(e){ return []; } }
  function guardar(cl, data){ try{ localStorage.setItem(cl, JSON.stringify(data)); }catch(e){} }

  // seed ejemplo de datos pre cargados
  function seed(){
    const citas = cargar(CL_CITAS);
    const pagos = cargar(CL_PAGOS);
    const pacs = cargar(CL_PAC);
    if(!citas.length){
      const hoy = new Date(); const a = hoy.toISOString().slice(0,10);
      citas.push({ id:1, pacienteId:1, medicoId:10, medicoName:'Dr. Perez', fecha: a, hora:'09:00' });
      citas.push({ id:2, pacienteId:2, medicoId:11, medicoName:'Dra. Ruiz', fecha: a, hora:'11:00' });
      const m2 = new Date(); m2.setDate(hoy.getDate()+1);
      citas.push({ id:3, pacienteId:3, medicoId:10, medicoName:'Dr. Perez', fecha: m2.toISOString().slice(0,10), hora:'14:00' });
      guardar(CL_CITAS, citas);
    }
    if(!pagos.length){
      pagos.push({ id:1, citaId:1, pacienteId:1, fecha: new Date().toISOString().slice(0,10), monto:250.00, servicio:'Consulta general' });
      pagos.push({ id:2, citaId:2, pacienteId:2, fecha: new Date().toISOString().slice(0,10), monto:300.00, servicio:'Consulta pediátrica' });
      pagos.push({ id:3, citaId:3, pacienteId:3, fecha: new Date().toISOString().slice(0,10), monto:400.00, servicio:'Consulta dermatológica' });
      guardar(CL_PAGOS, pagos);
    }
    if(!pacs.length){
      pacs.push({ id:1, nombre:'Ana Perez' }); pacs.push({ id:2, nombre:'Luis Gomez' }); pacs.push({ id:3, nombre:'Maria Lopez' }); guardar(CL_PAC, pacs);
    }
  }

  function q(s){ return document.querySelector(s); }
          //  indicadores clave de rendimiento
  function renderKpis(){ 
    const pagos = cargar(CL_PAGOS); // pagos
    const citas = cargar(CL_CITAS); // citas
    const pacs = cargar(CL_PAC); // pacientes
    const total = pagos.reduce((sum,p)=> sum + (Number(p.monto)||0), 0);
    q('#kpi_ingresos').textContent = '$' + total.toFixed(2); // ingresos
    q('#kpi_citas').textContent = citas.length; // citas
    q('#kpi_pacientes').textContent = pacs.length; // pacientes
  }

  function renderTabla(){
    const pagos = cargar(CL_PAGOS); 
    const pacs = cargar(CL_PAC);
    const citas = cargar(CL_CITAS);
    const tbody = q('#tabla_reportes tbody'); if(!tbody) return; tbody.innerHTML = '';
    pagos.forEach(p=>{
      const pac = pacs.find(x=> Number(x.id) === Number(p.pacienteId)) || {};
      const cita = citas.find(x=> Number(x.id)===Number(p.citaId)) || {};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.fecha}</td><td>${pac.nombre||('Paciente '+p.pacienteId)}</td><td>${cita.medicoName||('Dr.'+p.medicoId||'')}</td><td>${p.servicio||''}</td><td>$ ${Number(p.monto).toFixed(2)}</td>`;
      tbody.appendChild(tr); // fin forEach
    });
  }

  function bind(){
    const btn = q('#btn_export'); if(btn) btn.addEventListener('click', ()=> alert('Export no implementado por ahora'));
  }

  document.addEventListener('DOMContentLoaded', ()=>{ seed(); renderKpis(); renderTabla(); bind(); });

})();
