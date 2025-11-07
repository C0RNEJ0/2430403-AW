(function(){

  const STORAGE_KEY = 'medicos';
  const ESPECIALIDADES_KEY = 'especialidades';
  const FALLBACK_ESPECIALIDADES = ['Urgencias','Pediatria','Dermatologia'];

  // estado interno
  let medicos = [];
  const tableSelector = '#medicosTable';

  // util simple
  const log = (...args) => { try{ console.log('[medicos]', ...args); }catch(_){} };
  const uid = () => 'm_' + Date.now() + '_' + Math.floor(Math.random()*9000);
  const safe = v => (v === null || v === undefined) ? '' : String(v);
  const escapeHtml = str => String(str||'').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"})[m]);

  // storage
  function load(){
    try{ medicos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }catch(e){ medicos = []; }
  }
  function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(medicos)); }

  // helpers de UI
  function obtenerEspecialidades(){
    try{
      const stored = JSON.parse(localStorage.getItem(ESPECIALIDADES_KEY)) || [];
      const nombres = stored.map(x=> safe(x && x.nombre).trim()).filter(Boolean);
      return Array.from(new Set([...nombres, ...FALLBACK_ESPECIALIDADES]));
    }catch(e){ return FALLBACK_ESPECIALIDADES.slice(); }
  }

  function poblarSelectEspecialidad(){
    const sel = document.getElementById('m_especialidad');
    if(!sel) return;
    const cur = sel.value;
    sel.innerHTML = '';
    const add = (v, text) => { const o = document.createElement('option'); o.value = v; o.textContent = text || v; sel.appendChild(o); };
    add('', '-- Selecciona --');
    obtenerEspecialidades().forEach(n => add(n, n));
    add('Otra', 'Otra...');
    if(cur && Array.from(sel.options).some(o => o.value === cur)) sel.value = cur; else sel.value = '';
  }

  function toggleEspecialidadOtraSetup(){
    const sel = document.getElementById('m_especialidad');
    const wrap = document.getElementById('especialidad-otra-wrap');
    const other = document.getElementById('m_especialidad_other');
    if(!sel || !wrap || !other) return;
    if(sel.dataset._toggleInit) return;
    sel.addEventListener('change', () => {
      const show = sel.value === 'Otra';
      wrap.style.display = show ? 'block' : 'none';
      other.required = show;
      if(!show) other.value = '';
    });
    sel.dataset._toggleInit = '1';
  }

  // render tabla
  function renderTable(){
    const tbody = document.querySelector(tableSelector + ' tbody');
    if(!tbody) return;
    // destruir datatable si esta inicializada
    try{ if(window.jQuery && $.fn.dataTable && $.fn.dataTable.isDataTable && $.fn.dataTable.isDataTable(tableSelector)){ $(tableSelector).DataTable().destroy(); } }catch(e){}
    tbody.innerHTML = '';
    medicos.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(m.nombre)}</td>
        <td>${escapeHtml(m.especialidad)}</td>
        <td>${escapeHtml(m.horario)}</td>
        <td class="actions-row">
          <button class="btn-edit" data-id="${m.id}">Editar</button>
          <button class="btn-delete" data-id="${m.id}">Eliminar</button>
        </td>`;
      tbody.appendChild(tr);
    });
    // inicializar plugin de tabla si esta disponible
    try{ if(window.jQuery && $.fn.dataTable){ $(tableSelector).DataTable(); } }catch(e){ /* no pasa nada */ }
  }

  // apertura/cierre de modal 
  // manejo de modal con Bootstrap si esta disponible
  let bsModal = null;
  function initBootstrapModal(){
    const el = document.getElementById('modal_medico');
    if(!el) return;
    try{ bsModal = new bootstrap.Modal(el, { keyboard: true }); }catch(e){ bsModal = null; }
  }
  function mostrarModalElement(modalEl){ if(bsModal && typeof bsModal.show === 'function'){ bsModal.show(); return; } try{ if(window && window.csModals && typeof window.csModals.abrirModal === 'function'){ window.csModals.abrirModal(modalEl); return; } }catch(_){ } if(modalEl) modalEl.style.display = 'flex'; }
  function ocultarModalElement(modalEl){ if(bsModal && typeof bsModal.hide === 'function'){ bsModal.hide(); return; } try{ if(window && window.csModals && typeof window.csModals.cerrarModal === 'function'){ window.csModals.cerrarModal(modalEl); return; } }catch(_){ } if(modalEl) modalEl.style.display = 'none'; }

  // abrir modal de editar/registrar
  function abrirModalMedico(id){
    const modal = document.getElementById('modal_medico');
    const title = document.getElementById('modal_title');
    const form = document.getElementById('form_modal_medico');
    if(!modal || !title || !form){ log('elementos modal no encontrados'); return; }
    // reset y preparar
    form.reset();
    poblarSelectEspecialidad();
    toggleEspecialidadOtraSetup();
    const hid = document.getElementById('m_id'); if(hid) hid.value = '';
    if(id){
      const m = medicos.find(x=> String(x.id) === String(id));
      if(!m){ log('medico no encontrado', id); return; }
      title.textContent = 'Editar medico';
      document.getElementById('m_nombre').value = m.nombre || '';
      document.getElementById('m_horario').value = m.horario || '';
      // set especialidad con logica que coloca "Otra" si no coincide
      const sel = document.getElementById('m_especialidad');
      const other = document.getElementById('m_especialidad_other');
      if(sel){
        const norm = s => String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim();
        const opt = Array.from(sel.options).find(o => norm(o.value) === norm(m.especialidad));
        if(opt){ sel.value = opt.value; if(other) { other.value=''; other.required=false; } }
        else { sel.value='Otra'; if(other){ other.value = m.especialidad || ''; other.required = true; } }
      }
      if(hid) hid.value = m.id;
    } else {
      title.textContent = 'Registrar medico';
    }
    // focus
    try{ const inp = document.getElementById('m_nombre'); if(inp && typeof inp.focus === 'function') inp.focus(); }catch(_){ }
    mostrarModalElement(modal);
  }

  function cerrarModalMedico(){ const modal = document.getElementById('modal_medico'); ocultarModalElement(modal); }

  // validacion y guardar
  function guardarDesdeForm(e){
    if(e && e.preventDefault) e.preventDefault();
    const nombreEl = document.getElementById('m_nombre');
    const sel = document.getElementById('m_especialidad');
    const other = document.getElementById('m_especialidad_other');
    const idEl = document.getElementById('m_id');
    const horarioEl = document.getElementById('m_horario');
    if(!nombreEl){ alert('campo nombre no encontrado'); return; }
    const nombre = safe(nombreEl.value).trim();
    if(!nombre){ alert('Ponle nombre al medico'); nombreEl.focus(); return; }
    const espSel = sel ? (sel.value || '') : '';
    const espOther = other ? safe(other.value).trim() : '';
    const especialidad = (espSel === 'Otra') ? espOther : espSel;
    if(!especialidad){ alert('Selecciona o escribe la especialidad'); if(espSel === 'Otra' && other) other.focus(); else if(sel) sel.focus(); return; }
    const horario = horarioEl ? safe(horarioEl.value).trim() : '';
    if(!horario){ alert('Ingresa horario'); if(horarioEl) horarioEl.focus(); return; }
    const id = (idEl && idEl.value) ? idEl.value : uid();
    const payload = { id, nombre, especialidad, horario };
    const exists = medicos.find(x=> String(x.id) === String(id));
    if(exists){ medicos = medicos.map(x=> String(x.id) === String(id) ? payload : x); }
    else { medicos.push(payload); }
    persist(); renderTable(); cerrarModalMedico();
  }

  // eliminar
  function eliminarMedico(id){ if(!confirm('Eliminar medico?')) return; medicos = medicos.filter(x=> String(x.id) !== String(id)); persist(); renderTable(); }

  // event binding
  function bindEvents(){
    // submit form
    const f = document.getElementById('form_modal_medico'); if(f && !f._bound){ f.addEventListener('submit', guardarDesdeForm); f._bound = true; }
    // boton nuevo
    const btn = document.getElementById('btn_nuevo_medico'); if(btn && !btn._bound){ btn.addEventListener('click', ()=> abrirModalMedico()); btn._bound = true; }
    // delegacion tabla
    const tbody = document.querySelector(tableSelector + ' tbody'); if(tbody && !tbody._bound){
      tbody.addEventListener('click', function(e){ const b = e.target.closest && e.target.closest('button'); if(!b) return; if(b.classList.contains('btn-edit')) abrirModalMedico(b.dataset.id); if(b.classList.contains('btn-delete')) eliminarMedico(b.dataset.id); }); tbody._bound = true;
    }
    // cerrar modal por boton cancelar
    const cancel = document.getElementById('modal_cancel'); if(cancel && !cancel._bound){ cancel.addEventListener('click', cerrarModalMedico); cancel._bound = true; }
    // tambien permitir que sidebar abra modales 
  }

  // API publica
  function init(){ load(); initBootstrapModal(); bindEvents(); poblarSelectEspecialidad(); toggleEspecialidadOtraSetup(); renderTable(); log('iniciado, medicos count', medicos.length); }
  function list(){ return medicos.slice(); }
  function add(m){ if(!m || !m.nombre) throw new Error('payload invalido'); m.id = m.id || uid(); medicos.push(m); persist(); renderTable(); return m; }
  function update(id, data){ medicos = medicos.map(x=> String(x.id) === String(id) ? Object.assign({}, x, data, { id }) : x); persist(); renderTable(); }
  function remove(id){ eliminarMedico(id); }
  function seedTest(){ const ejemplo = { id: uid(), nombre: 'Dr Test', especialidad: 'Urgencias', horario: 'Lun-Vie 09:00-14:00' }; medicos.push(ejemplo); persist(); renderTable(); return ejemplo; }

  // expose
  window.medicosApp = window.medicosApp || {};
  Object.assign(window.medicosApp, { init, list, add, update, remove, seedTest });

  // auto init DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function(){ try{ init(); }catch(e){ console.error(e); } });

})();

