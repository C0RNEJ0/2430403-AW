(function(){
  const CLAVES_ALMACEN = { citas: 'citas', pacientes: 'cs_pacientes_v1' };
  const cargar = clave => { try{ return JSON.parse(localStorage.getItem(clave)) || []; }catch(e){ return []; } };

  // mes actual que se muestra (día 1 del mes)
  let mesActual = new Date(); mesActual.setDate(1);

  // renderiza la cuadrícula del mes
  function renderizar(){
    const raiz = document.getElementById('cal_grid'); if(!raiz) return; raiz.innerHTML = '';
    const anio = mesActual.getFullYear(), mes = mesActual.getMonth();
    const titulo = document.getElementById('cal_title'); if(titulo) titulo.textContent = mesActual.toLocaleString('es-ES',{month:'long', year:'numeric'});
          // calcular datos del mes
    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const diasDelMes = new Date(anio, mes+1, 0).getDate();
    const citas = cargar(CLVESafe('citas'));
    const pacientes = cargar(CLVESafe('pacientes'));
            // contenedor de la tabla
    const cont = document.createElement('div'); cont.className = 'table-responsive';
    const tabla = document.createElement('table'); tabla.className = 'table table-bordered mb-0';
    tabla.innerHTML = '<thead><tr><th>Lun</th><th>Mar</th><th>Mie</th><th>Jue</th><th>Vie</th><th>Sab</th><th>Dom</th></tr></thead>';
    const cuerpo = document.createElement('tbody');
    // construir celdas
    const desplaz = (primerDiaSemana + 6) % 7; let celdas = [];
    for(let i=0;i<desplaz;i++) celdas.push(null);
    for(let d=1; d<=diasDelMes; d++) celdas.push(new Date(anio, mes, d));
    while(celdas.length % 7 !== 0) celdas.push(null);
            // construir filas
    for(let fila=0; fila < celdas.length/7; fila++){
      const tr = document.createElement('tr');
      for(let col=0; col<7; col++){
        const cel = celdas[fila*7 + col];
        const td = document.createElement('td'); td.style.verticalAlign='top'; td.style.minWidth='110px'; td.style.height='110px';
        if(cel){
            // llenar celda
          const numero = cel.getDate(); const claveDia = cel.toISOString().slice(0,10);
          td.innerHTML = `<div class="d-flex justify-content-between"><strong>${numero}</strong><small class="text-muted">${cel.toLocaleDateString()}</small></div>`;
          const citasDia = citas.filter(x=>x.fecha===claveDia);
          if(citasDia.length){
            const caja = document.createElement('div'); caja.className='mt-2';
            citasDia.forEach(ci => {
                // buscar paciente para mostrar nombre
              const p = pacientes.find(pp=>pp.id===ci.pacienteId) || {};
              const etiqueta = document.createElement('div');
              etiqueta.className = 'badge bg-info text-dark d-block mb-1';
              etiqueta.style.fontSize='0.85rem';
              etiqueta.textContent = (ci.hora?ci.hora+' - ':'') + (p.nombre||ci.pacienteName||('Paciente #'+ci.pacienteId)) + ' / ' + (ci.medicoName||('Dr.'+ci.medicoId));
              caja.appendChild(etiqueta);
            });
            td.appendChild(caja);
          }
        }
        tr.appendChild(td);
      }
      cuerpo.appendChild(tr);
    }
    tabla.appendChild(cuerpo); cont.appendChild(tabla); raiz.appendChild(cont);
  }

  // helper pequeño para evitar errores si la clave cambia
  function CLVESafe(key){ return key === 'citas' ? CLAVES_ALMACEN.citas : CLAVES_ALMACEN.pacientes; }

  // inicios: botones prev/next
  document.addEventListener('DOMContentLoaded', ()=>{
    const btnSig = document.getElementById('cal_next'); if(btnSig) btnSig.addEventListener('click', ()=>{ mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth()+1, 1); renderizar(); });
    const btnAnt = document.getElementById('cal_prev'); if(btnAnt) btnAnt.addEventListener('click', ()=>{ mesActual = new Date(mesActual.getFullYear(), mesActual.getMonth()-1, 1); renderizar(); });
    renderizar();
  });

})();
