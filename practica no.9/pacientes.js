// Gestión mínima de pacientes, citas y prioridades en localStorage
(function(){
  const CLAVES_ALMACEN = {
    pacientes: 'cs_pacientes_v1',
    medicos: 'cs_medicos_v1',
    citas: 'cs_citas_v1'
  };

  // Cargar arrays
  function load(key){
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch(e){ return []; }
  }
  function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

  let pacientes = load(CLAVES_ALMACEN.pacientes);
  let medicos = load(CLAVES_ALMACEN.medicos);
  let citas = load(CLAVES_ALMACEN.citas);

  // Prioridades permitidas y su orden de prioridad (0 mayor)
  const PRIORIDADES = ['Emergencia','Urgente','No urgente'];

  // Helpers
  function q(selector, root=document){ return root.querySelector(selector); }

  // Render tabla
  function renderPacientes(){
    const tbody = q('#tabla_pacientes tbody');
    tbody.innerHTML = '';
    // Ordenar por prioridad definida
    pacientes.sort((a,b)=> PRIORIDADES.indexOf(a.prioridad) - PRIORIDADES.indexOf(b.prioridad));
    pacientes.forEach(p=>{
      const tr = document.createElement('tr');
      const doctor = citas.find(c=>c.pacienteId===p.id)?.medicoName || '';
      const cita = citas.find(c=>c.pacienteId===p.id);
      tr.innerHTML = `
        <td>${p.id}</td>
        <td>${p.nombre}</td>
        <td>${p.prioridad}</td>
        <td>${p.especialidad||''}</td>
        <td>${cita? (cita.fecha+' '+cita.hora):''}</td>
        <td>${doctor||''}</td>
        <td>
          <button data-id="${p.id}" class="editar">Editar</button>
          <button data-id="${p.id}" class="eliminar">Eliminar</button>
          <button data-id="${p.id}" class="agendar">Agendar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ID helpers
  function nextId(list){ return list.length? Math.max(...list.map(x=>x.id))+1 : 1; }

  // Mostrar modal de paciente 
  function openModal(){
    const modal = document.getElementById('modal_producto');
    if(!modal) return alert('No se encontró modal de paciente');
    modal.classList.add('show');
  }
  function closeModal(){ const m=document.getElementById('modal_producto'); if(m) m.classList.remove('show'); }

  // Form submit
  function handleSave(evt){
    evt.preventDefault();
    const id = parseInt(q('#producto_id').value || '0',10);
    const nombre = q('#p_nombre').value.trim();
    const prioridad = q('#categoria').value || 'No urgente';
    const costo = parseFloat(q('#p_precio').value)||0;
    const stock = parseInt(q('#p_stock').value)||0; // reinterpretado como edad u otro
    const imagen = q('#p_imagen').value.trim();
    const especialidad = q('#p_especialidad') ? q('#p_especialidad').value : '';

    if(!nombre){ alert('Nombre requerido'); return; }

    if(id){
      const idx = pacientes.findIndex(x=>x.id===id);
      if(idx>=0){ pacientes[idx] = { ...pacientes[idx], nombre, prioridad, costo, stock, imagen, especialidad }; }
    } else {
      const nuevo = { id: nextId(pacientes), nombre, prioridad, costo, stock, imagen, especialidad };
      pacientes.push(nuevo);
    }
  save(CLAVES_ALMACEN.pacientes, pacientes);
    renderPacientes();
    closeModal();
  }

  // Eliminar paciente (si tiene cita no se puede)
  function handleEliminar(id){
    const tieneCita = citas.some(c=>c.pacienteId===id);
    if(tieneCita){ alert('No se puede eliminar: el paciente tiene una cita'); return; }
    if(!confirm('Confirmar eliminar paciente')) return;
  pacientes = pacientes.filter(p=>p.id!==id);
  save(CLAVES_ALMACEN.pacientes,pacientes);
    renderPacientes();
  }

  // Agendar: abrir modal y preparar formulario
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
  // limpiar texto previo de '(no disponible)'
  opt.textContent = opt.textContent.replace(/ ?\(no disponible\)$/, '');
  opt.disabled = (fecha && hora) ? (unavailable || hasCita) : false;
  if(opt.disabled) opt.textContent = opt.textContent + ' (no disponible)';
      });
    }
    if(q('#ag_fecha')) q('#ag_fecha').addEventListener('change', filtrarMedicos);
    if(q('#ag_hora')) q('#ag_hora').addEventListener('change', filtrarMedicos);
    // Si hay una pending agenda en sessionStorage (veniente de la pantalla de médicos), preseleccionar
    try{
      const pending = sessionStorage.getItem('cs_pending_agenda');
      if(pending){
        const p = JSON.parse(pending);
        if(p.fecha){ q('#ag_fecha').value = p.fecha; }
        if(p.medicoId){
          // si el médico forma parte de los candidatos, preseleccionarlo
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
    // Validar colisión: mismo médico, misma fecha y hora
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
    const p = pacientes.find(x=>x.id===id);
    if(!p) return;
    q('#producto_id').value = p.id;
    q('#p_nombre').value = p.nombre;
    q('#categoria').value = p.prioridad;
    q('#p_precio').value = p.costo || 0;
    q('#p_stock').value = p.stock || 0;
    q('#p_imagen').value = p.imagen || '';
    if(q('#p_especialidad')) q('#p_especialidad').value = p.especialidad||'';
    openModal();
  }

  // Listeners
  document.addEventListener('DOMContentLoaded', ()=>{
    // Bind formulario si existe
    const form = document.getElementById('formulario_producto');
    if(form) form.addEventListener('submit', handleSave);

    document.getElementById('btn_agregar_paciente').addEventListener('click', ()=>{
      q('#producto_id').value = '';
      q('#p_nombre').value = '';
      q('#categoria').value = 'No urgente';
      q('#p_precio').value = '';
      q('#p_stock').value = '';
      q('#p_imagen').value = '';
      if(q('#p_especialidad')) q('#p_especialidad').value = '';
      openModal();
    });

    // Delegación de botones en la tabla
    document.querySelector('#tabla_pacientes tbody').addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      const id = parseInt(btn.getAttribute('data-id'),10);
      if(btn.classList.contains('eliminar')) handleEliminar(id);
      if(btn.classList.contains('editar')) handleEditar(id);
      if(btn.classList.contains('agendar')) openAgendarModal(id);
    });

    // Cargar datos iniciales
    renderPacientes();
  // bind agendar submit
  const formAg = document.getElementById('form_agendar');
  if(formAg) formAg.addEventListener('submit', handleAgendarSubmit);
  // si existe una pending agenda desde medicos, abrir modal preseleccionado
  const pending = localStorage.getItem('cs_pending_agenda');
  if(pending){
    try{
      const p = JSON.parse(pending);
      // si hay paciente seleccionado previamente no abrimos; en su lugar llenamos select cuando se abra
      // Guardarlo en sessionStorage para que openAgendarModal lo use cuando se abra para un paciente
      sessionStorage.setItem('cs_pending_agenda', JSON.stringify(p));
      // limpiar clave global
      localStorage.removeItem('cs_pending_agenda');
      // navegar al listado y mostrar aviso pequeño: el usuario debe pulsar Agendar en el paciente y el modal se prellenará
      console.info('Pending agenda guardada en sessionStorage');
    }catch(e){ }
  }
  });

})();
