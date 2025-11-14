(function(){
  const CL_PAC = 'cs_pacientes_v1';
  const CL_MED = 'medicos';
  const CL_CITAS = 'citas';
  const CL_PAGOS = 'pagos';

  function cargar(cl){ try{ return JSON.parse(localStorage.getItem(cl)) || []; }catch(e){ return []; } }
  function guardar(cl, data){ try{ localStorage.setItem(cl, JSON.stringify(data)); }catch(e){} }

  // seed de ejemplo
  function seed(){
    const pacs = cargar(CL_PAC);
    const meds = cargar(CL_MED);
    const citas = cargar(CL_CITAS);
    const pagos = cargar(CL_PAGOS);
    if(!pacs.length){ pacs.push({ id:1, nombre:'Ana Perez', edad:28, prioridad:'No urgente' }); pacs.push({ id:2, nombre:'Luis Gomez', edad:35, prioridad:'Urgente' }); pacs.push({ id:3, nombre:'Maria Lopez', edad:42, prioridad:'No urgente' }); guardar(CL_PAC, pacs); }
    if(!meds.length){ meds.push({ id:10, nombre:'Dr. Perez', especialidad:'General' }); meds.push({ id:11, nombre:'Dra. Ruiz', especialidad:'Pediatría' }); guardar(CL_MED, meds); }
    if(!citas.length){ const hoy = new Date(); const d1 = hoy.toISOString().slice(0,10); const d2 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()+1).toISOString().slice(0,10); citas.push({ id:1, pacienteId:1, medicoId:10, medicoName:'Dr. Perez', fecha:d1, hora:'09:00' }); citas.push({ id:2, pacienteId:2, medicoId:11, medicoName:'Dra. Ruiz', fecha:d1, hora:'11:00' }); citas.push({ id:3, pacienteId:3, medicoId:10, medicoName:'Dr. Perez', fecha:d2, hora:'14:00' }); guardar(CL_CITAS, citas); }
    if(!pagos.length){ const hoy = new Date().toISOString().slice(0,10); pagos.push({ id:1, citaId:1, pacienteId:1, fecha:hoy, monto:250, servicio:'Consulta general' }); pagos.push({ id:2, citaId:2, pacienteId:2, fecha:hoy, monto:300, servicio:'Consulta pediátrica' }); pagos.push({ id:3, citaId:3, pacienteId:3, fecha:hoy, monto:400, servicio:'Consulta dermatológica' }); guardar(CL_PAGOS, pagos); }
  }

  // util
  function q(s){ return document.querySelector(s); }

  function calcularKpis(){
    const pacs = cargar(CL_PAC); const citas = cargar(CL_CITAS); const pagos = cargar(CL_PAGOS); const meds = cargar(CL_MED);
    q('#kpi_pacientes').textContent = pacs.length;
    q('#kpi_consultas').textContent = citas.length;
    const total = pagos.reduce((sum,p)=> sum + (Number(p.monto)||0), 0); q('#kpi_dinero').textContent = '$' + total.toFixed(2);
    q('#kpi_medicos').textContent = meds.length;
  }

  function renderPacientes(){ const pacs = cargar(CL_PAC); const tbody = q('#tabla_pacientes tbody'); if(!tbody) return; tbody.innerHTML=''; pacs.slice(0,10).forEach(p=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${p.nombre}</td><td>${p.edad||''}</td><td>${p.prioridad||''}</td>`; tbody.appendChild(tr); }); }

  function renderMedicos(){ const meds = cargar(CL_MED); const div = q('#lista_medicos'); if(!div) return; div.innerHTML=''; meds.forEach(m=>{ const card = document.createElement('div'); card.className='d-flex align-items-center gap-2 mb-2'; card.innerHTML = `<div style="width:44px; height:44px; background:#e9ecef; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:700">${(m.nombre||'M').charAt(0)}</div><div><div style="font-weight:700">${m.nombre}</div><div style="font-size:12px;color:#666">${m.especialidad||''}</div></div>`; div.appendChild(card); }); }

  // graficas con Chart.js
  let chartLine=null, chartPie=null;
  function renderGraficas(){
    const pagos = cargar(CL_PAGOS); const citas = cargar(CL_CITAS);
    // linea: ingresos por dia ultimos 7 dias
    const dias = [];
    for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); dias.push(d.toISOString().slice(0,10)); }
    const ingresos = dias.map(d => pagos.filter(p=>p.fecha===d).reduce((s,p)=>s+Number(p.monto||0),0));

    const ctx = document.getElementById('chart_line').getContext('2d');
    if(chartLine) chartLine.destroy();
    chartLine = new Chart(ctx, { type:'line', data: { labels: dias, datasets:[ { label:'Ingresos', data: ingresos, borderColor:'#2b8a67', backgroundColor:'rgba(43,138,103,0.15)', tension:0.3 } ] }, options:{ responsive:true } });

    // pie: por servicio (pagos)
    const servicios = {};
    pagos.forEach(p=>{ const s = p.servicio||'Otros'; servicios[s] = (servicios[s]||0) + (Number(p.monto)||0); });
    const labels = Object.keys(servicios); const values = labels.map(l=>servicios[l]);
    const ctx2 = document.getElementById('chart_pie').getContext('2d'); if(chartPie) chartPie.destroy();
    chartPie = new Chart(ctx2, { type:'pie', data:{ labels, datasets:[{ data: values, backgroundColor: ['#4a9a6a','#72c08f','#f6c85f','#f97c6a'] }] }, options:{ responsive:true } });
  }

  document.addEventListener('DOMContentLoaded', ()=>{ seed(); calcularKpis(); renderPacientes(); renderMedicos(); renderGraficas(); });

})();
