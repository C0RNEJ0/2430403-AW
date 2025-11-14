

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
  document.querySelectorAll('form').forEach(function(formulario){
    var inAcc = formulario.querySelector('input[name="accion"]');
    if(inAcc && inAcc.value === 'eliminar'){
      formulario.addEventListener('submit', function(e){
        if(!confirm('¿Eliminar paciente?')){
          e.preventDefault();
        }
      });
    }
  });

  // Validación ligera de formularios de paciente (si existen)
  var forms = document.querySelectorAll('form');
  forms.forEach(function(formulario){
    var inAcc = formulario.querySelector('input[name="accion"]');
    if(!inAcc) return;
    var accion = inAcc.value;
    if(accion === 'crear' || accion === 'editar'){
      formulario.addEventListener('submit', function(e){
        var nombre = formulario.querySelector('[name="nombres"]');
        var apellidos = formulario.querySelector('[name="apellidos"]');
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
        var email = formulario.querySelector('[name="email"]');
        if(email && email.value.trim() !== ''){
          if(email.value.indexOf('@') === -1){
            // si el usuario escribió solo el usuario, añadimos dominio por defecto
            email.value = email.value.trim() + '@gmail.com';
          }
          var re = /^(([^<>()[\\]\\.,;:\s@\"]+(\\.[^<>()[\\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\\]\\.,;:\s@\"]+\.)+[^<>()[\\]\\.,;:\s@\"]{2,})$/i;
          if(!re.test(email.value.trim())){
            alert('Email inválido. (por ejemplo usuario@gmail.com).');
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
      var respuesta = await fetch('/practica-no.9/controllers/especialidades_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_especialidad');
      if(!select) return;
      select.innerHTML='';
      if(json.exito && Array.isArray(json.datos)){
        select.appendChild(new Option('Seleccione',''));
        json.datos.forEach(function(e){
          var texto = e.nombre_especialidad || e.nombre || '';
          var valor = e.especialidad_id || e.id || '';
          select.appendChild(new Option(texto, valor));
        });
      } else {
        select.appendChild(new Option('No hay especialidades',''));
      }
    }catch(err){ console.error('especialidades:', err); }
  }

  async function cargarMedicos(){
    try{
      var respuesta = await fetch('/practica-no.9/controllers/medicos_list.php');
      var json = await respuesta.json();
      var select = document.getElementById('p_medico_asignado');
      if(!select) return;
      select.innerHTML='';
      if(json.exito && Array.isArray(json.datos)){
        select.appendChild(new Option('Seleccione',''));
        json.datos.forEach(function(m){
          var texto = (m.nombres||'') + ' ' + (m.apellidos||'');
          var valor = m.medico_id || m.id || '';
          select.appendChild(new Option(texto, valor));
        });
      } else {
        select.appendChild(new Option('No hay médicos',''));
      }
    }catch(err){ console.error('medicos:', err); }
  }

  // iniciar y refrescar cada 10s
  cargarEspecialidades(); cargarMedicos();
  setInterval(function(){ cargarEspecialidades(); cargarMedicos(); }, 10000);

  // manejar abrir modal en Agregar paciente
  var botonAgregar = document.getElementById('btn_agregar_paciente');
  if(botonAgregar){
    botonAgregar.addEventListener('click', function(){
      var acc = document.getElementById('accion_form'); if(acc) acc.value='crear';
      var pid = document.getElementById('paciente_id'); if(pid) pid.value='';
      var form = document.getElementById('formulario_paciente'); if(form) form.reset();
      var modal = document.getElementById('modal_paciente'); if(modal) modal.style.display='block';
    });
  }

});

// Cargar pacientes via API y renderizar en #pacientes_grid
async function cargarPacientes(){
  try{
    var respuesta = await fetch('/practica-no.9/controllers/pacientes.php?api=listar');
    var json = await respuesta.json();
    var contenedor = document.getElementById('pacientes_grid');
    if(!contenedor) return;
    contenedor.innerHTML = '';
    if(json.exito && Array.isArray(json.datos)){
      if(json.datos.length === 0){ contenedor.innerHTML = '<div class="info">No hay pacientes registrados.</div>'; return; }
      var tabla = document.createElement('table'); tabla.className = 'pacientes-table';
      var thead = document.createElement('thead'); thead.innerHTML = '<tr><th>Nombre</th><th>Sexo</th><th>Fecha Nac.</th><th>Teléfono</th><th>Email</th><th>Ciudad</th><th>Prioridad</th><th>Acciones</th></tr>';
      tabla.appendChild(thead);
      var tbody = document.createElement('tbody');
      json.datos.forEach(function(paciente){
        var tr = document.createElement('tr');
        var nombreCompleto = (paciente.nombres||'') + ' ' + (paciente.apellidos||'');
        tr.innerHTML = '<td>'+escaparHtml(nombreCompleto)+'</td>'+
                       '<td>'+escaparHtml(paciente.sexo||'')+'</td>'+
                       '<td>'+escaparHtml(paciente.fecha_nacimiento||'')+'</td>'+
                       '<td>'+escaparHtml(paciente.telefono||'')+'</td>'+
                       '<td>'+escaparHtml(paciente.email||'')+'</td>'+
                       '<td>'+escaparHtml(paciente.ciudad||'')+'</td>'+
                       '<td>'+escaparHtml(paciente.prioridad||'')+'</td>';
        var tdAcc = document.createElement('td');
        // Editar enlace
        var a = document.createElement('a'); a.className='accion-editar'; a.href='/practica-no.9/views/pacientes.html?action=editar&id='+encodeURIComponent(paciente.paciente_id); a.textContent='Editar';
        tdAcc.appendChild(a);
        // Form eliminar
        var f = document.createElement('form'); f.method='post'; f.action='/practica-no.9/controllers/pacientes.php'; f.style.display='inline-block'; f.style.margin='0';
        var inpAcc = document.createElement('input'); inpAcc.type='hidden'; inpAcc.name='accion'; inpAcc.value='eliminar';
        var inpId = document.createElement('input'); inpId.type='hidden'; inpId.name='id'; inpId.value = paciente.paciente_id;
        var btn = document.createElement('button'); btn.type='submit'; btn.className='accion-eliminar'; btn.textContent='Eliminar';
        f.appendChild(inpAcc); f.appendChild(inpId); f.appendChild(btn);
        tdAcc.appendChild(f);
        tr.appendChild(tdAcc);
        tbody.appendChild(tr);
      });
      tabla.appendChild(tbody);
      contenedor.appendChild(tabla);
    } else {
      contenedor.innerHTML = '<div class="alert alert-danger">Error cargando pacientes</div>';
    }
  }catch(err){ console.error('cargarPacientes', err); }
}

function escaparHtml(s){ return String(s||'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

// iniciar carga de pacientes
document.addEventListener('DOMContentLoaded', function(){ cargarPacientes(); });
