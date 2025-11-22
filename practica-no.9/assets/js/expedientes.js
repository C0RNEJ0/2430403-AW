(function(){
  function q(sel){ return document.querySelector(sel); }
  async function buscar(idore){
    try{
      const res = await fetch('../controllers/expedientes.php?buscar=' + encodeURIComponent(idore));
      const j = await res.json();
      return j;
    }catch(e){ return {exito:false, error: e.message}; }
  }
  async function mostrar(valor){
    const cont = q('#resultado_expediente'); if(!cont) return;
    cont.innerHTML = 'Cargando...';
    const r = await buscar(valor);
    if(!r.exito){ cont.innerHTML = '<div class="alert alert-danger">'+(r.error||'Error')+'</div>'; return; }
    if(!r.datos || r.datos.length===0){ cont.innerHTML = '<div class="alert alert-info">No hay expediente</div>'; return; }
    // render simple
    let html = '';
    r.datos.forEach(it=>{
      html += '<div class="card" style="margin-bottom:8px; padding:8px">';
      html += '<div><strong>Paciente:</strong> '+(it.nombres+' '+(it.apellidos||''))+'</div>';
      html += '<div><strong>Fecha:</strong> '+(it.fecha||'')+'</div>';
      html += '<div><strong>Motivo:</strong> '+(it.motivo||'')+'</div>';
      html += '<div><strong>Notas:</strong> '+(it.notas||'')+'</div>';
      html += '</div>';
    });
    cont.innerHTML = html;
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    const b = q('#buscar_expediente'); if(!b) return;
    b.addEventListener('keypress', (e)=>{ if(e.key==='Enter'){ mostrar(b.value); } });
  });
})();
