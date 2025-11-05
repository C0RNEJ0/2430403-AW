// Manejo del estado de la barra lateral y modales
(function(){
  // soy un dev junior, aqui manejo la barra y guardo en localStorage
  const aplicacion = document.getElementById('aplicacion');
  const barra_lateral = document.getElementById('barra_lateral');
  const body = document.body;

  const CLAVE_BARRA_COLAPSADA = 'cs_sidebar_collapsed';

  function estaColapsado(){
    return localStorage.getItem(CLAVE_BARRA_COLAPSADA) === '1';
  }

  function aplicarEstado(){
    if(estaColapsado()){
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }
  }

  function alternarBarra(){
    const col = !estaColapsado();
    localStorage.setItem(CLAVE_BARRA_COLAPSADA, col ? '1' : '0');
    aplicarEstado();
  }

  // cuando el DOM esté listo hago cosas
  document.addEventListener('DOMContentLoaded', function(){
    aplicarEstado();
    // delego clicks para botones dinamicos
    document.addEventListener('click', function(e){
      const target = e.target;
      // toggle, acepto click en boton o en elementos dentro
      if(target.closest && target.closest('#boton_colapsar')){ e.preventDefault(); alternarBarra(); return; }
      // si tocan la brand en movil, abro/cierro
      if(target.closest && target.closest('.sidebar .brand')){
        if(window.innerWidth <= 800){ barra_lateral && barra_lateral.classList.toggle('open'); }
      }
      // abrir modales por atributos data-modal-target / data-modal-open
      const openBtn = target.closest && (target.closest('[data-modal-target]') || target.closest('[data-modal-open]'));
      if(openBtn){ e.preventDefault(); const targetId = (openBtn.getAttribute('data-modal-target') || openBtn.getAttribute('data-modal-open') || '').replace(/^#/, ''); if(targetId) abrirModalPorId(targetId); }
      // cerrar modal si clic en overlay
      if(target.classList && target.classList.contains('modal')){ cerrarModal(target); }
      const closeBtn = target.closest && (target.closest('[data-modal-close]') || target.closest('.close'));
      if(closeBtn){ e.preventDefault(); const modal = closeBtn.closest('.modal'); modal && cerrarModal(modal); }
      // boton cerrar sesion
      const cerrarBtn = target.closest && target.closest('#boton_cerrar_sesion');
      if(cerrarBtn){ e.preventDefault(); try{ sessionStorage.clear(); }catch(_){}; try{ localStorage.removeItem(CLAVE_BARRA_COLAPSADA); }catch(_){}; try{ localStorage.removeItem('auth_token'); localStorage.removeItem('user'); }catch(_){}; window.location.href = 'Login/login.html'; }
    });
  });
})();

// Gestión ligera y accesible de modales usada por varias páginas
(function(){
  // no quiero chocar con otro script
  if (window.__cs_modals_initialized) return;
  window.__cs_modals_initialized = true;

  // helpers simples
  function qs(selector, root=document){ return root.querySelector(selector); }
  function qsa(selector, root=document){ return Array.from(root.querySelectorAll(selector)); }

  // abrir modal (control de accesibilidad basico)
  function abrirModal(modal){
    if(!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    const previouslyFocused = document.activeElement; modal.__previouslyFocused = previouslyFocused;
    const focusable = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter(el => !el.hasAttribute('disabled'));
    if(focusable.length) focusable[0].focus();
    document.body.style.overflow = 'hidden';
  }

  function cerrarModal(modal){
    if(!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    try{ const prev = modal.__previouslyFocused; if(prev && typeof prev.focus === 'function') prev.focus(); } catch(_){ }
    document.body.style.overflow = '';
  }

  function abrirModalPorId(id){ const modal = document.getElementById(id) || document.querySelector('#'+CSS.escape(id)); abrirModal(modal); }

  function inicializarTriggersModal(root=document){
    qsa('[data-modal-target], [data-modal-open]', root).forEach(btn => {
      const target = btn.getAttribute('data-modal-target') || btn.getAttribute('data-modal-open');
      if(!target) return; btn.addEventListener('click', function(e){ e.preventDefault(); const id = target.replace(/^#/, ''); abrirModalPorId(id); });
    });
  }

  function inicializarClosersModal(root=document){
    qsa('.modal').forEach(modal => {
      modal.addEventListener('click', function(e){ if(e.target === modal){ cerrarModal(modal); } });
      qsa('[data-modal-close], .close', modal).forEach(btn => { btn.addEventListener('click', function(e){ e.preventDefault(); cerrarModal(modal); }); });
    });
  }

  // cerrar con Escape
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' || e.key === 'Esc'){ const open = qs('.modal.show'); if(open) cerrarModal(open); } });

  document.addEventListener('DOMContentLoaded', function(){
    qsa('.modal').forEach(modal => {
      if(!modal.hasAttribute('role')) modal.setAttribute('role','dialog');
      if(!modal.hasAttribute('aria-hidden')) modal.setAttribute('aria-hidden','true');
      const content = qs('.modal-content', modal); if(content && !content.hasAttribute('tabindex')) content.setAttribute('tabindex', '-1');
    });

    inicializarTriggersModal();
    inicializarClosersModal();

    qsa('a[href^="#modal_"]').forEach(a => { a.addEventListener('click', function(e){ e.preventDefault(); const id = (a.getAttribute('href')||'').replace('#',''); abrirModalPorId(id); }); });
  });

})();
