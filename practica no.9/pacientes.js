(function(){
  const CLAVES_ALMACEN = {
    pacientes: 'cs_pacientes_v1',
    medicos: 'medicos',
  citas: 'citas'
  };

  // Cargar listas
  function load(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; }
  }
  function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

  let pacientes = load(CLAVES_ALMACEN.pacientes);
  let medicos = load(CLAVES_ALMACEN.medicos);
  let citas = load(CLAVES_ALMACEN.citas);

  // Prioridades permitidas y su orden 0 mayor
  const PRIORIDADES = ['Emergencia','Urgente','No urgente'];

  // Helpers sencillos
  function q(selector, root=document){ return root.querySelector(selector); }

  // Render de tarjetas de pacientes
  function renderPacientes(filterText){
    const grid = q('#pacientes_grid');
    if(!grid) return;
    grid.innerHTML = '';
  // Ordeno por prioridad para que los mas urgentes salgan primero
    pacientes.sort((a,b)=> PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad));

    const text = (filterText||'').toLowerCase().trim();

    pacientes.forEach(p=>{
  // filtro por nombre curp o medico asignado
      if(text){
        const hay = (p.nombre||'').toLowerCase().includes(text) || (p.curp||'').toLowerCase().includes(text) || (p.medicoAsignado||'').toLowerCase().includes(text);
        if(!hay) return;
      }

      const cita = citas.find(c=>c.pacienteId===p.id);
      const doctorName = cita? (cita.medicoName || p.medicoAsignado || '') : (p.medicoAsignado || '');

      const card = document.createElement('div');
      card.className = 'product-card patient-card';
      card.innerHTML = `
        <div class="product-image" style="background-image: url('${p.imagen||p.image||''}'); background-size:cover; background-position:center;">
        </div>
        <div class="product-info">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <div>
              <div class="name">${p.nombre}</div>
              <div class="size">CURP: <strong>${p.curp||'-'}</strong></div>
            </div>
            <div style="text-align:right;">
              <div class="price">Edad: ${p.edad ?? p.stock ?? '-'}</div>
              <div class="shipping">Prioridad: ${p.prioridad || '-'}</div>
            </div>
          </div>
          <p style="margin:8px 0 4px 0; color:#555">Especialidad: <strong>${p.especialidad||'-'}</strong></p>
          <p style="margin:0 0 8px 0; color:#555">Médico encargado: <strong>${doctorName||'-'}</strong></p>
          <div class="product-controls">
            <button data-id="${p.id}" class="btn-edit editar">Editar</button>
            <button data-id="${p.id}" class="btn-delete eliminar">Eliminar</button>
            <button data-id="${p.id}" class="btn-admin agendar">Agendar</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // helpers para id
  function nextId(list){
    try{
      if(!Array.isArray(list) || list.length===0) return 1;
      const nums = list.map(x=> Number(x.id) ).filter(n=> Number.isFinite(n));
      return nums.length? Math.max(...nums)+1 : 1;
    }catch(e){ return 1; }
  }

  // Mostrar modal de paciente
  function openModal(){
    const modal = document.getElementById('modal_producto');
    if(!modal) return alert('No se encontró modal de paciente');
    modal.classList.add('show');
  }
  function closeModal(){ const m=document.getElementById('modal_producto'); if(m) m.classList.remove('show'); }

  // Guardar desde formulario
  function handleSave(evt){
    evt.preventDefault && evt.preventDefault();
    // recoger campos con proteccion si faltan elementos
    const idRaw = (q('#producto_id') && q('#producto_id').value) || '';
    const id = parseInt(idRaw||'0',10) || 0;
    const nombre = (q('#p_nombre') && String(q('#p_nombre').value).trim()) || '';
    const curp = (q('#p_curp') && String(q('#p_curp').value).trim()) || '';
    const edad = q('#p_edad') ? parseInt(q('#p_edad').value,10) || 0 : 0;
    const prioridad = (q('#categoria') && q('#categoria').value) || 'No urgente';
    const costo = q('#p_precio') ? parseFloat(q('#p_precio').value) || 0 : 0;
    const imagen = (q('#p_imagen') && String(q('#p_imagen').value).trim()) || '';
    const especialidad = q('#p_especialidad') ? q('#p_especialidad').value : '';
    const medicoAsignado = q('#p_medico_asignado') ? String(q('#p_medico_asignado').value).trim() : '';

    console.log('handleSave paciente', { id, nombre, curp, edad, prioridad, costo, especialidad, medicoAsignado });

    if(!nombre){ alert('Nombre requerido'); return; }

    if(id){
      const idx = pacientes.findIndex(x=> Number(x.id) === Number(id));
      if(idx>=0){ pacientes[idx] = { ...pacientes[idx], nombre, curp, edad, prioridad, costo, imagen, especialidad, medicoAsignado }; }
    } else {
      const nuevo = { id: nextId(pacientes), nombre, curp, edad, prioridad, costo, imagen, especialidad, medicoAsignado };
      pacientes.push(nuevo);
    }
    try{ save(CLAVES_ALMACEN.pacientes, pacientes); }catch(e){ console.error('Error guardando pacientes', e); }
    renderPacientes();
    closeModal();
  }

  // Eliminar paciente si no tiene cita
  function handleEliminar(id){
    const tieneCita = citas.some(c=>c.pacienteId===id);
    if(tieneCita){ alert('No se puede eliminar: el paciente tiene una cita'); return; }
    if(!confirm('Confirmar eliminar paciente')) return;
  pacientes = pacientes.filter(p=>p.id!==id);
  save(CLAVES_ALMACEN.pacientes,pacientes);
    renderPacientes();
  }

  // Agendar abrir modal y preparar formulario
  function openAgendarModal(id){
    const paciente = pacientes.find(p=>p.id===id);
    if(!paciente){ alert('Paciente no encontrado'); return; }
    // rellenar campos
    q('#ag_paciente_id').value = paciente.id;
    q('#ag_especialidad').value = paciente.especialidad || '';
    q('#ag_fecha').value = '';
    q('#ag_hora').value = '';
    // cargar medicos disponibles de la especialidad
    const select = q('#ag_medico_select');
    select.innerHTML = '<option value="">Selecciona un médico</option>';
    const candidatos = medicos.filter(m=>m.especialidad=== (paciente.especialidad||''));
    candidatos.forEach(m=>{
  const opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.nombre + ' ('+ (Array.isArray(m.diasDisponibles)?m.diasDisponibles.join(', '):m.diasDisponibles||'') +')';
      select.appendChild(opt);
    });
    // mostrar modal
    const modal = document.getElementById('modal_agendar'); if(modal) modal.classList.add('show');
    // bind fecha/hora change para filtrar medicos
    const fechaInput = q('#ag_fecha');
    const horaInput = q('#ag_hora');
    function filtrarMedicos(){
      const fecha = fechaInput.value; const hora = horaInput.value;
      const options = select.querySelectorAll('option');
      // recargar citas y medicos
  citas = load(CLAVES_ALMACEN.citas);
  medicos = load(CLAVES_ALMACEN.medicos);
      options.forEach(opt=>{
        if(!opt.value) return;
        const mid = parseInt(opt.value,10);
        const medico = medicos.find(m=>m.id===mid);
        // comprobar unavailableSlots
        const unavailable = medico && medico.unavailableSlots ? medico.unavailableSlots.some(s=>s.fecha===fecha && s.hora===hora) : false;
        const hasCita = citas.some(c=>c.medicoId===mid && c.fecha===fecha && c.hora===hora);
  // limpiar texto previo de no disponible
  opt.textContent = opt.textContent.replace(/ ?\(no disponible\)$/, '');
  opt.disabled = (fecha && hora) ? (unavailable || hasCita) : false;
  if(opt.disabled) opt.textContent = opt.textContent + ' (no disponible)';
      });
    }
    if(q('#ag_fecha')) q('#ag_fecha').addEventListener('change', filtrarMedicos);
    if(q('#ag_hora')) q('#ag_hora').addEventListener('change', filtrarMedicos);
  // Si hay una pending agenda en sessionStorage veniente de la pantalla de medicos preseleccionar
    try{
      const pending = sessionStorage.getItem('cs_pending_agenda');
      if(pending){
        const p = JSON.parse(pending);
        if(p.fecha){ q('#ag_fecha').value = p.fecha; }
        if(p.medicoId){
          // si el medico forma parte de los candidatos preseleccionarlo
          const opt = select.querySelector('option[value="'+p.medicoId+'"]');
          if(opt) select.value = p.medicoId;
        }
        // aplicar filtrado con la fecha/hora ya establecida
        filtrarMedicos();
        // limpiar pending
        sessionStorage.removeItem('cs_pending_agenda');
      }
    }catch(e){ /* ignore */ }
  }

  function closeAgendarModal(){ const m=document.getElementById('modal_agendar'); if(m) m.classList.remove('show'); }

  // Submit de agendamiento
  function handleAgendarSubmit(e){
    e.preventDefault();
    const pacienteId = parseInt(q('#ag_paciente_id').value,10);
    const fecha = q('#ag_fecha').value;
    const hora = q('#ag_hora').value;
    const medicoId = parseInt(q('#ag_medico_select').value,10);
    if(!fecha || !hora || !medicoId){ alert('Completa fecha, hora y médico'); return; }
  // Validar colision mismo medico misma fecha y hora
  citas = load(CLAVES_ALMACEN.citas);
    if(citas.some(c=>c.medicoId===medicoId && c.fecha===fecha && c.hora===hora)){
      alert('Ese médico ya tiene una cita a esa fecha/hora'); return;
    }
    // Crear cita
    const medico = medicos.find(m=>m.id===medicoId);
    const nueva = { id: nextId(citas), pacienteId, medicoId, medicoName: medico?medico.nombre:'', fecha, hora };
  citas.push(nueva); save(CLAVES_ALMACEN.citas,citas);
    closeAgendarModal(); renderPacientes(); alert('Cita creada con ' + (medico?medico.nombre:''));
  }

  // Editar
  function handleEditar(id){
    const idNum = Number(id);
    console.log('handleEditar llamado', { id, idNum });
    const p = pacientes.find(x=> Number(x.id) === idNum);
    if(!p){ console.warn('Paciente no encontrado para editar', id); return; }
    // asigno solo si existe el elemento en el DOM
    const setIf = (sel, val) => { const el = q(sel); if(el) el.value = val ?? ''; };
    setIf('#producto_id', p.id);
    setIf('#p_nombre', p.nombre);
    setIf('#p_curp', p.curp || '');
    setIf('#p_edad', p.edad || p.stock || '');
    setIf('#categoria', p.prioridad || 'No urgente');
    setIf('#p_precio', p.costo || 0);
    setIf('#p_imagen', p.imagen || '');
    const espEl = q('#p_especialidad'); if(espEl) espEl.value = p.especialidad || '';
    const docEl = q('#p_medico_asignado'); if(docEl) docEl.value = p.medicoAsignado || '';
    openModal();
  }

  // Listeners
  // Inicializacion se puede llamar ahora 
  function init(){
    // Bind formulario si existe
    const form = document.getElementById('formulario_producto');
    if(form && !form._bound) { form.addEventListener('submit', handleSave); form._bound = true; }

    const btnAdd = document.getElementById('btn_agregar_paciente');
    if(btnAdd && !btnAdd._bound){
      btnAdd.addEventListener('click', ()=>{
        if(q('#producto_id')) q('#producto_id').value = '';
        if(q('#p_nombre')) q('#p_nombre').value = '';
        if(q('#p_curp')) q('#p_curp').value = '';
        if(q('#p_edad')) q('#p_edad').value = '';
        if(q('#categoria')) q('#categoria').value = 'No urgente';
        if(q('#p_precio')) q('#p_precio').value = '';
        if(q('#p_imagen')) q('#p_imagen').value = '';
        if(q('#p_medico_asignado')) q('#p_medico_asignado').value = '';
        if(q('#p_especialidad')) q('#p_especialidad').value = '';
        openModal();
      });
      btnAdd._bound = true;
    }

    // Delegación de botones en el grid de tarjetas
    const grid = document.querySelector('#pacientes_grid');
    if(grid && !grid._bound){
      grid.addEventListener('click', (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const id = parseInt(btn.getAttribute('data-id'),10);
        if(btn.classList.contains('eliminar')) handleEliminar(id);
        if(btn.classList.contains('editar')) handleEditar(id);
        if(btn.classList.contains('agendar')) openAgendarModal(id);
      });
      grid._bound = true;
    }

    // Cargar datos iniciales
    renderPacientes();

    // bind agendar submit
    const formAg = document.getElementById('form_agendar');
    if(formAg && !formAg._bound){ formAg.addEventListener('submit', handleAgendarSubmit); formAg._bound = true; }

  // si existe una pending agenda desde medicos mover a sessionStorage
    const pending = localStorage.getItem('cs_pending_agenda');
    if(pending){
      try{
        const p = JSON.parse(pending);
        sessionStorage.setItem('cs_pending_agenda', JSON.stringify(p));
        localStorage.removeItem('cs_pending_agenda');
        console.info('Pending agenda guardada en sessionStorage');
      }catch(e){ /* ignore */ }
    }
  }

  // Ejecutar init ahora y también al
  try{ init(); }catch(e){ /* ignore */ }
  document.addEventListener('DOMContentLoaded', init);

})();
