(function () {
  'use strict'

  // Elementos del DOM
  const sidebar = document.getElementById('sidebar_restored');
  const toggleBtn = document.getElementById('btn_toggle_sidebar');
  const openBtn = document.getElementById('btn_hamburger');
  const overlay = document.getElementById('sidebar_overlay');
  const body = document.body;

  const CLAVE_BARRA_COLAPSADA = 'sidebar_collapsed_state';

  // Verificar estado colapsado
  function estaColapsado() {
    return localStorage.getItem(CLAVE_BARRA_COLAPSADA) === 'true';
  }

  // Aplicar estado colapsado
  function aplicarEstado() {
    const isCollapsed = estaColapsado();
    if (isCollapsed) {
      body.classList.add('sidebar-collapsed');
    } else {
      body.classList.remove('sidebar-collapsed');
    }
  }

  // Marcar página activa
  function marcarPaginaActiva() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    navLinks.forEach(link => {
      link.classList.remove('active');

      const href = link.getAttribute('href');
      if (!href || href === '#' || href.startsWith('javascript:')) return;

      // Normalizar paths para comparación
      const linkPath = href.split('/').pop();
      const currentPage = currentPath.split('/').pop();

      if (currentPage === linkPath) {
        link.classList.add('active');
      }
    });
  }

  // Cargar info del usuario
  function cargarInfoUsuario() {
    const userName = document.getElementById('sidebar_user_name');
    const userRole = document.getElementById('sidebar_user_role');

    const usuarioEmail = localStorage.getItem('usuario_email') || 'Usuario';
    const usuarioRol = localStorage.getItem('usuario_rol') || 'Administrador';

    if (userName) {
      // Si es email, tomar la parte antes del @
      const nombre = usuarioEmail.includes('@') ? usuarioEmail.split('@')[0] : usuarioEmail;
      userName.textContent = nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }

    if (userRole) {
      userRole.textContent = usuarioRol.charAt(0).toUpperCase() + usuarioRol.slice(1);
    }
  }

  // Event Listeners
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      const nuevoEstado = !estaColapsado();
      localStorage.setItem(CLAVE_BARRA_COLAPSADA, nuevoEstado);
      aplicarEstado();
    });
  }

  // Móvil: Abrir sidebar
  if (openBtn) {
    openBtn.addEventListener('click', function () {
      if (sidebar) sidebar.classList.add('show');
      if (overlay) overlay.classList.add('show');
    });
  }

  // Móvil: Cerrar sidebar
  function cerrarSidebarMovil() {
    if (sidebar) sidebar.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }

  if (overlay) overlay.addEventListener('click', cerrarSidebarMovil);

  // Manejar botón de cerrar sesión con delegación de eventos
  document.addEventListener('click', function (e) {
    // Buscar si el clic fue en el botón de logout o dentro de él
    const logoutLink = e.target.closest('a[onclick*="modal_logout"]');

    if (logoutLink) {
      e.preventDefault();
      console.log('Click en logout detectado via delegación');

      // Intentar abrir el modal
      if (typeof abrirModal === 'function') {
        abrirModal('modal_logout');
      } else if (window.modalHandler) {
        window.modalHandler.openModal('modal_logout');
      } else {
        // Fallback manual
        const modal = document.getElementById('modal_logout');
        if (modal) {
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
        } else {
          console.error('Modal logout no encontrado');
          // Último recurso: cerrar sesión directo si no hay modal
          if (confirm('¿Cerrar sesión?')) {
            if (typeof cerrar_sesion === 'function') cerrar_sesion();
            else window.location.href = '../views/login/login.html';
          }
        }
      }
    }
  });

  // Inicialización
  aplicarEstado();
  marcarPaginaActiva();
  cargarInfoUsuario();

})();
