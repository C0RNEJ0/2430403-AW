(function(){
  const KEY = 'especialidades';
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
  function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }
 // cargo datos iniciales
  let items = load();
  // seed inicial si no hay datos
  if(!items || items.length===0){
    items = [
      { id: '1', nombre: 'Pediatría', descripcion: 'Atención a niños y adolescentes' },
      { id: '2', nombre: 'Cardiología', descripcion: 'Enfermedades del corazón' },
      { id: '3', nombre: 'Dermatología', descripcion: 'Cuidado de la piel' }
    ];
    save(items);
  }
 //
  function q(sel,root=document){ return root.querySelector(sel); }
    // Escapar valores para HTML
  function escape(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m])); }
   // Renderizar tabla
  function render(){
    const tbody = q('#tabla_especialidades tbody'); if(!tbody) return;
    tbody.innerHTML = '';
    items.forEach(it=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escape(it.nombre)}</td>
        <td>${escape(it.descripcion||'')}</td>
        <td>
          <button class="btn btn-sm btn-primary editar" data-id="${it.id}">Editar</button>
          <button class="btn btn-sm btn-danger eliminar" data-id="${it.id}">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } //

  // modal
  function openModal(editId){
    const modalEl = q('#modalEspecialidad'); if(!modalEl) return alert('Modal no encontrado');
  // reseteo rápido del formulario
    q('#esp_id').value = '';
    q('#esp_nombre').value = '';
    q('#esp_descripcion').value = '';
    q('#modalEspecialidadLabel').textContent = 'Agregar especialidad';
    if(editId){
      const it = items.find(x=> String(x.id)===String(editId));
      if(it){ q('#esp_id').value = it.id; q('#esp_nombre').value = it.nombre; q('#esp_descripcion').value = it.descripcion||''; q('#modalEspecialidadLabel').textContent = 'Editar especialidad'; }
    }
    modalEl.classList.add('show');
  }

  function closeModal(){ const modalEl = q('#modalEspecialidad'); if(modalEl) modalEl.classList.remove('show'); }

  function saveFromForm(){
    const id = q('#esp_id').value || ('esp_' + Date.now());
    const nombre = q('#esp_nombre').value.trim();
    const descripcion = q('#esp_descripcion').value.trim();
    if(!nombre) return alert('Nombre obligatorio');
    const exists = items.find(x=> String(x.id)===String(id));
    const payload = { id, nombre, descripcion };
    if(exists) items = items.map(x=> String(x.id)===String(id)? payload : x);
    else items.push(payload);
    save(items); render(); closeModal();
  }

  document.addEventListener('click', function(e){
    if(e.target && e.target.id==='btn_agregar_especialidad') openModal();
    if(e.target && e.target.classList && e.target.classList.contains('editar')) openModal(e.target.dataset.id);
    if(e.target && e.target.classList && e.target.classList.contains('eliminar')){
      const id = e.target.dataset.id; if(!confirm('Borrar especialidad?')) return; items = items.filter(x=> String(x.id)!==String(id)); save(items); render();
    }
    if(e.target && e.target.id==='esp_cancel'){ closeModal(); }
  });

  // bind submit del formulario
  document.addEventListener('DOMContentLoaded', ()=>{
    const form = q('#formEspecialidad'); if(form) form.addEventListener('submit', function(ev){ ev.preventDefault(); saveFromForm(); });
    render();
  });

  window.especialidades = { get: ()=> items };

})();
