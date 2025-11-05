// Gestión mínima de médicos y disponibilidad en localStorage
(function(){
  const CLAVES_ALMACEN = { medicos: 'cs_medicos_v1', citas: 'cs_citas_v1' };
  function load(key){ try { return JSON.parse(localStorage.getItem(key))||[] } catch(e){ return [] } }
  function save(key, data){ localStorage.setItem(key, JSON.stringify(data)); }

  let medicos = load(CLAVES_ALMACEN.medicos);
  let citas = load(CLAVES_ALMACEN.citas);

  function nextId(list){ return list.length? Math.max(...list.map(x=>x.id))+1 : 1; }

  function renderMedicos(){
    const container = document.getElementById('lista_medicos');
    if(!container) return;
    container.innerHTML = '';
    medicos.forEach(m=>{
      const diasText = Array.isArray(m.diasDisponibles) ? m.diasDisponibles.join(', ') : (m.diasDisponibles||'');
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.id}</td><td>${m.nombre}</td><td>${m.especialidad}</td><td>${diasText} <button data-id="${m.id}" class="ver-calendario">Calendario</button></td><td><button data-id="${m.id}" class="eliminar">Eliminar</button></td>`;
      container.appendChild(tr);
    });
    // también rellenar select de calendario
    const calSelect = document.getElementById('cal_medico');
    if(calSelect){
      calSelect.innerHTML = '<option value="">-- selecciona --</option>';
      medicos.forEach(m=>{ const opt = document.createElement('option'); opt.value = m.id; opt.textContent = m.nombre + ' ('+m.especialidad+')'; calSelect.appendChild(opt); });
    }
  }

  // Generar franjas horarias para un médico y fecha (reutilizable)
  function generarHorasPara(medicoId, fecha){
    const calHoras = document.getElementById('cal_horas');
    const calMed = document.getElementById('cal_medico');
    const calFecha = document.getElementById('cal_fecha');
    if(!calHoras || !calMed) return;
    calHoras.innerHTML = '';
    if(!medicoId) return;
    // generar franjas de 08:00 a 16:30 cada 30 minutos
    const slots = [];
    for(let h=8; h<17; h++){
      slots.push((h<10? '0'+h : h)+':00');
      slots.push((h<10? '0'+h : h)+':30');
    }
  citas = load(CLAVES_ALMACEN.citas);
    const ocupadoSet = new Set(citas.filter(c=>c.medicoId===medicoId && c.fecha===fecha).map(c=>c.hora));
    const medico = medicos.find(m=>m.id===medicoId);
    // comprobar si el médico trabaja ese día de la semana según diasDisponibles
    if(medico && Array.isArray(medico.diasDisponibles) && medico.diasDisponibles.length){
      const dow = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' });
      const dowNormalized = dow.charAt(0).toUpperCase() + dow.slice(1);
      if(!medico.diasDisponibles.includes(dowNormalized)){
        calHoras.innerHTML = '<div style="color:#a00">El médico no trabaja ese día de la semana.</div>';
        return;
      }
    }
    const unavailable = medico && medico.unavailableSlots ? medico.unavailableSlots.filter(s=>s.fecha===fecha).map(s=>s.hora) : [];
    slots.forEach(hora=>{
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'hora-slot'; btn.dataset.hora = hora; btn.textContent = hora;
      if(ocupadoSet.has(hora)) { btn.disabled = true; btn.style.opacity=0.5; btn.title='Ocupado por cita'; }
      else if(unavailable.includes(hora)){ btn.classList.add('unavailable'); }
      btn.addEventListener('click', ()=>{
        if(ocupadoSet.has(hora)) return;
        btn.classList.toggle('unavailable');
        const m = medicos.find(x=>x.id===medicoId);
        if(!m) return;
        m.unavailableSlots = m.unavailableSlots || [];
        const exists = m.unavailableSlots.find(s=>s.fecha===fecha && s.hora===hora);
        if(exists){ m.unavailableSlots = m.unavailableSlots.filter(s=>!(s.fecha===fecha && s.hora===hora)); }
        else { m.unavailableSlots.push({ fecha, hora }); }
  save(CLAVES_ALMACEN.medicos, medicos);
      });
      calHoras.appendChild(btn);
    });
  }

  function addMedico(nombre, especialidad, diasDisponibles){
    if(!nombre || !especialidad) return alert('Nombre y especialidad requeridos');
    // No permitir crear medico con mismo nombre y especialidad (simple check)
    if(medicos.some(x=>x.nombre===nombre && x.especialidad===especialidad)) return alert('Ya existe ese médico');
  const nuevo = { id: nextId(medicos), nombre, especialidad, diasDisponibles };
  medicos.push(nuevo); save(CLAVES_ALMACEN.medicos, medicos); renderMedicos();
  }

  function eliminar(id){
    // No permitir eliminar si tiene cita
  citas = load(CLAVES_ALMACEN.citas);
    if(citas.some(c=>c.medicoId===id)) return alert('No se puede eliminar: el médico tiene citas asignadas');
  medicos = medicos.filter(m=>m.id!==id); save(CLAVES_ALMACEN.medicos, medicos); renderMedicos();
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const form = document.getElementById('form_medico');
    if(form){
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const nombre = document.getElementById('m_nombre').value.trim();
        const especialidad = document.getElementById('m_especialidad').value.trim();
        // recoger checkboxes name="m_dia" como array de días
        const checked = Array.from(document.querySelectorAll('input[name="m_dia"]:checked')).map(n=>n.value);
        const dias = checked; // ej. ['Lunes','Martes']
        addMedico(nombre, especialidad, dias);
        form.reset();
      });
    }

    const lista = document.getElementById('lista_medicos');
    if(lista){
      lista.addEventListener('click', (e)=>{
        const btn = e.target.closest('button'); if(!btn) return;
        const id = parseInt(btn.getAttribute('data-id'),10);
        if(btn.classList.contains('eliminar')) eliminar(id);
        if(btn.classList.contains('ver-calendario')){
          // seleccionar en el calendario y generar horas
          const calMed = document.getElementById('cal_medico');
          const calFecha = document.getElementById('cal_fecha');
          if(calMed) calMed.value = id;
          // si no hay fecha, usar hoy
          if(calFecha && !calFecha.value){ const hoy = new Date().toISOString().slice(0,10); calFecha.value = hoy; }
          generarHorasPara(id, calFecha.value || new Date().toISOString().slice(0,10));
          // scroll a la sección del calendario
          const el = document.getElementById('cal_horas'); if(el) el.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    renderMedicos();
    // Calendar bindings
    const calMed = document.getElementById('cal_medico');
    const calFecha = document.getElementById('cal_fecha');
    const calHoras = document.getElementById('cal_horas');
    function generarHoras(){
      calHoras.innerHTML = '';
      const medicoId = parseInt(calMed.value,10);
      if(!medicoId) return;
      const fecha = calFecha.value; // YYYY-MM-DD
      // generar franjas de 08:00 a 17:00 cada 30 minutos
      const slots = [];
      for(let h=8; h<17; h++){
        slots.push((h<10? '0'+h : h)+':00');
        slots.push((h<10? '0'+h : h)+':30');
      }
      // cargar citas para ese medico y fecha
  citas = load(CLAVES_ALMACEN.citas);
      const ocupadoSet = new Set(citas.filter(c=>c.medicoId===medicoId && c.fecha===fecha).map(c=>c.hora));
      // obtener medico
      const medico = medicos.find(m=>m.id===medicoId);
      // validar día de la semana según diasDisponibles
      if(medico && Array.isArray(medico.diasDisponibles) && medico.diasDisponibles.length){
        const dow = new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long' });
        const dowNormalized = dow.charAt(0).toUpperCase() + dow.slice(1);
        if(!medico.diasDisponibles.includes(dowNormalized)){
          calHoras.innerHTML = '<div style="color:#a00">El médico no trabaja ese día de la semana.</div>';
          return;
        }
      }
      const unavailable = medico && medico.unavailableSlots ? medico.unavailableSlots.filter(s=>s.fecha===fecha).map(s=>s.hora) : [];
      slots.forEach(hora=>{
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'hora-slot'; btn.dataset.hora = hora; btn.textContent = hora;
        if(ocupadoSet.has(hora)) { btn.disabled = true; btn.style.opacity=0.5; btn.title='Ocupado por cita'; }
        else if(unavailable.includes(hora)){ btn.classList.add('unavailable'); }
        btn.addEventListener('click', ()=>{
          // toggle unavailable (si no está ocupado)
          if(ocupadoSet.has(hora)) return;
          btn.classList.toggle('unavailable');
          // guardar en medicos
          const m = medicos.find(x=>x.id===medicoId);
          if(!m) return;
          m.unavailableSlots = m.unavailableSlots || [];
          const exists = m.unavailableSlots.find(s=>s.fecha===fecha && s.hora===hora);
          if(exists){ m.unavailableSlots = m.unavailableSlots.filter(s=>!(s.fecha===fecha && s.hora===hora)); }
          else { m.unavailableSlots.push({ fecha, hora }); }
          save(CLAVES_ALMACEN.medicos, medicos);
        });
        calHoras.appendChild(btn);
      });
    }
    if(calMed) calMed.addEventListener('change', generarHoras);
    if(calFecha) calFecha.addEventListener('change', generarHoras);
    const btnConfirm = document.getElementById('btn_confirmar_medico');
    if(btnConfirm){
      btnConfirm.addEventListener('click', ()=>{
        const medicoId = parseInt(calMed.value,10);
        const fecha = calFecha.value;
        if(!medicoId || !fecha){ return alert('Selecciona médico y fecha antes de confirmar'); }
        localStorage.setItem('cs_pending_agenda', JSON.stringify({ medicoId, fecha }));
        // llevar al formulario de pacientes para completar la agenda
        window.location.href = 'pacientes.html';
      });
    }
  });

})();
