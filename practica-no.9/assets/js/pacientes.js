// Script mínimo para pacientes
// - Confirmación antes de eliminar
// - Validación ligera antes de enviar formulario (campos básicos)
// - Carga de especialidades y médicos (antes inline en la vista)
// - Mostrar mensajes desde querystring y controlar apertura del modal

document.addEventListener('DOMContentLoaded', function(){
  // Mostrar mensajes desde querystring
  (function(){
    try{
      var params = new URLSearchParams(window.location.search);
      var cont = document.getElementById('mensajes');
      if(!cont) return;
      if(params.get('exito')){
        var d = document.createElement('div'); d.className='alert alert-success'; d.textContent = params.get('exito'); cont.appendChild(d);
      }
      if(params.get('error')){
        var d = document.createElement('div'); d.className='alert alert-danger'; d.textContent = params.get('error'); cont.appendChild(d);
      }
    } catch(e){ /* silencioso */ }
  })();

  // Confirmar eliminación: intercepta formularios con input[name="accion"] == 'eliminar'
  document.querySelectorAll('form').forEach(function(f){
    var inAcc = f.querySelector('input[name="accion"]');
    if(inAcc && inAcc.value === 'eliminar'){
      f.addEventListener('submit', function(e){
        if(!confirm('¿Eliminar paciente?')){
          e.preventDefault();
        }
      });
    }
  });

  // Validación ligera de formularios de paciente (si existen)
  var forms = document.querySelectorAll('form');
  forms.forEach(function(f){
    var inAcc = f.querySelector('input[name="accion"]');
    if(!inAcc) return;
    var accion = inAcc.value;
    if(accion === 'crear' || accion === 'editar'){
      f.addEventListener('submit', function(e){
        var nombre = f.querySelector('[name="nombres"]');
        var apellidos = f.querySelector('[name="apellidos"]');
        if(nombre && nombre.value.trim() === ''){
          alert('El campo Nombres es obligatorio.');
          nombre.focus();
          e.preventDefault();
          return false;
        }
        if(apellidos && apellidos.value.trim() === ''){
          alert('El campo Apellidos es obligatorio.');
          apellidos.focus();
          e.preventDefault();
          return false;
        }
        // validación rápida de email si existe
        var email = f.querySelector('[name="email"]');
        if(email && email.value.trim() !== ''){
          var re = /^(([^<>()[\\]\\.,;:\s@\"]+(\\.[^<>()[\\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\\]\\.,;:\s@\"]+\.)+[^<>()[\\]\\.,;:\s@\"]{2,})$/i;
          if(!re.test(email.value.trim())){
            alert('Email inválido.');
            email.focus();
            e.preventDefault();
            return false;
          }
        }
        return true;
      });
    }
  });

  // Funciones para cargar especialidades y medicos
  async function cargarEspecialidades(){
    try{
      var r = await fetch('/practica-no.9/controllers/especialidades_list.php');
      var j = await r.json();
      var sel = document.getElementById('p_especialidad');
      if(!sel) return;
      sel.innerHTML='';
      if(j.exito && Array.isArray(j.datos)){
        sel.appendChild(new Option('Seleccione',''));
        j.datos.forEach(function(e){
          var text = e.nombre_especialidad || e.nombre || '';
          var val = e.especialidad_id || e.id || '';
          sel.appendChild(new Option(text, val));
        });
      } else {
        sel.appendChild(new Option('No hay especialidades',''));
      }
    }catch(err){ console.error('especialidades:', err); }
  }

  async function cargarMedicos(){
    try{
      var r = await fetch('/practica-no.9/controllers/medicos_list.php');
      var j = await r.json();
      var sel = document.getElementById('p_medico_asignado');
      if(!sel) return;
      sel.innerHTML='';
      if(j.exito && Array.isArray(j.datos)){
        sel.appendChild(new Option('Seleccione',''));
        j.datos.forEach(function(m){
          var text = (m.nombres||'') + ' ' + (m.apellidos||'');
          var val = m.medico_id || m.id || '';
          sel.appendChild(new Option(text, val));
        });
      } else {
        sel.appendChild(new Option('No hay médicos',''));
      }
    }catch(err){ console.error('medicos:', err); }
  }

  // iniciar y refrescar cada 10s
  cargarEspecialidades(); cargarMedicos();
  setInterval(function(){ cargarEspecialidades(); cargarMedicos(); }, 10000);

  // manejar abrir modal en Agregar paciente
  var btnAgregar = document.getElementById('btn_agregar_paciente');
  if(btnAgregar){
    btnAgregar.addEventListener('click', function(){
      var acc = document.getElementById('accion_form'); if(acc) acc.value='crear';
      var pid = document.getElementById('producto_id'); if(pid) pid.value='';
      var form = document.getElementById('formulario_producto'); if(form) form.reset();
      var modal = document.getElementById('modal_producto'); if(modal) modal.style.display='block';
    });
  }

});

// Cargar pacientes via API y renderizar en #pacientes_grid
async function cargarPacientes(){
  try{
    var r = await fetch('/practica-no.9/controllers/pacientes.php?api=listar');
    var j = await r.json();
    var cont = document.getElementById('pacientes_grid');
    if(!cont) return;
    cont.innerHTML = '';
    if(j.exito && Array.isArray(j.datos)){
      if(j.datos.length === 0){ cont.innerHTML = '<div class="alert alert-info">No hay pacientes registrados.</div>'; return; }
      var table = document.createElement('table'); table.className = 'table table-sm table-striped';
      var thead = document.createElement('thead'); thead.innerHTML = '<tr><th>Nombre</th><th>Sexo</th><th>Fecha Nac.</th><th>Teléfono</th><th>Email</th><th>Ciudad</th><th>Prioridad</th><th>Acciones</th></tr>';
      table.appendChild(thead);
      var tbody = document.createElement('tbody');
      j.datos.forEach(function(r){
        var tr = document.createElement('tr');
        var nombre = (r.nombres||'') + ' ' + (r.apellidos||'');
        tr.innerHTML = '<td>'+escapeHtml(nombre)+'</td>'+
                       '<td>'+escapeHtml(r.sexo||'')+'</td>'+
                       '<td>'+escapeHtml(r.fecha_nacimiento||'')+'</td>'+
                       '<td>'+escapeHtml(r.telefono||'')+'</td>'+
                       '<td>'+escapeHtml(r.email||'')+'</td>'+
                       '<td>'+escapeHtml(r.ciudad||'')+'</td>'+
                       '<td>'+escapeHtml(r.prioridad||'')+'</td>';
        var tdAcc = document.createElement('td');
        // Editar enlace
        var a = document.createElement('a'); a.className='btn btn-sm btn-outline-primary me-1'; a.href='/practica-no.9/views/pacientes.html?action=editar&id='+encodeURIComponent(r.paciente_id); a.textContent='Editar';
        tdAcc.appendChild(a);
        // Form eliminar
        var f = document.createElement('form'); f.method='post'; f.action='/practica-no.9/controllers/pacientes.php'; f.style.display='inline-block'; f.style.margin='0';
        var inpAcc = document.createElement('input'); inpAcc.type='hidden'; inpAcc.name='accion'; inpAcc.value='eliminar';
        var inpId = document.createElement('input'); inpId.type='hidden'; inpId.name='id'; inpId.value = r.paciente_id;
        var btn = document.createElement('button'); btn.type='submit'; btn.className='btn btn-sm btn-outline-danger'; btn.textContent='Eliminar';
        f.appendChild(inpAcc); f.appendChild(inpId); f.appendChild(btn);
        tdAcc.appendChild(f);
        tr.appendChild(tdAcc);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      cont.appendChild(table);
    } else {
      cont.innerHTML = '<div class="alert alert-danger">Error cargando pacientes</div>';
    }
  }catch(err){ console.error('cargarPacientes', err); }
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

// iniciar carga de pacientes
document.addEventListener('DOMContentLoaded', function(){ cargarPacientes(); });
