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
          // que son los kpis son indicadores clave de rendimiento
  function renderKpis(){
    const pagos = cargar(CL_PAGOS);
    const citas = cargar(CL_CITAS);
    const pacs = cargar(CL_PAC);
    const total = pagos.reduce((sum,p)=> sum + (Number(p.monto)||0), 0);
    q('#kpi_ingresos').textContent = '$' + total.toFixed(2);
    q('#kpi_citas').textContent = citas.length;
    q('#kpi_pacientes').textContent = pacs.length;
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
      tbody.appendChild(tr);
    });
  }

  function bind(){
    const btn = q('#btn_export'); if(btn) btn.addEventListener('click', ()=> alert('Export no implementado por ahora'));
  }

  document.addEventListener('DOMContentLoaded', ()=>{ seed(); renderKpis(); renderTabla(); bind(); });

})();
