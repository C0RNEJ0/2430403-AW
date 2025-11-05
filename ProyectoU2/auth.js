
const AUTH_STORAGE_KEY = 'loggedUser';
const USERS_STORAGE_KEY = 'users';

// Obtener usuario logueado
function getLoggedUser() {
    try {
        const user = localStorage.getItem(AUTH_STORAGE_KEY);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

// Guardar usuario logueado
function setLoggedUser(user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// Cerrar sesión
function clearLoggedUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Obtener usuarios registrados
function getUsers() {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    } catch (e) {
        return [];
    }
}

// Asegurar existencia de usuario admin que es mario.dev
function ensureAdminUser() {
    try {
        const users = getUsers();
        const exists = users.some(u => u.email && u.email.toLowerCase() === 'admin@gmail.com');
        if (!exists) {
            users.push({ email: 'admin@gmail.com', pass: '123456', role: 'admin' });
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
    } catch (e) {
        // ignore
    }
}

// Comprobar si el usuario logueado es admin
function isAdminUser() {
    const u = getLoggedUser();
    if (!u) return false;
    if (u.role && u.role === 'admin') return true;
    return (u.email && u.email.toLowerCase() === 'admin@gmail.com');
}

// Crear admin por defecto si no existe 
ensureAdminUser();

// Validar credenciales
function validateLogin(email, password) {
    const users = getUsers();
    return users.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.pass === password
    );
}

// Verificar si hay usuario logueado
function isLoggedIn() {
    return getLoggedUser() !== null;
}

// Inicializar autenticación al cargar la página
function initAuth() {
    const loginModal = document.getElementById('modal_inicio_sesion');
    const loginIcon = document.getElementById('icono_usuario');
    const loginForm = document.getElementById('form_inicio_sesion');
    const loginView = document.getElementById('vista_inicio_sesion');
    const logoutView = document.getElementById('vista_cerrar_sesion');
    const btnCerrarSesion = document.getElementById('boton_cerrar_sesion');
    const btnCancelarLogout = document.getElementById('boton_cancelar_cerrar_sesion');
    const adminControls = document.getElementById('controles_administrador');
    const closeButtons = loginModal ? loginModal.querySelectorAll('.close') : [];

    // Actualizar UI según estado de sesión
    function updateAuthUI() {
        const user = getLoggedUser();

        if (user) {
            // Usuario logueado  se habilita poder editar
            if (adminControls) adminControls.style.display = 'block';
            if (loginIcon) {
                // imagen de login 
                loginIcon.innerHTML = '<img src="img/Login.png" alt="Login" class="icon-img">';
                loginIcon.title = 'Cerrar Sesión';
            }
            // Mostrar email del usuario junto al carrito si el elemento existe
            try {
                const emailEl = document.getElementById('usuario_email');
                if (emailEl) {
                    const uemail = user.email || user.username || '';
                    emailEl.textContent = uemail;
                    emailEl.style.display = '';
                }
            } catch(_){}
        } else {
            // Usuario no logueado
            if (adminControls) adminControls.style.display = 'none';
            if (loginIcon) {
                loginIcon.innerHTML = '<img src="img/Login.png" alt="Login" class="icon-img">';
                loginIcon.title = 'Iniciar Sesión';
            }
            // Ocultar email si no hay sesión
            try { const emailEl = document.getElementById('usuario_email'); if (emailEl) emailEl.style.display = 'none'; } catch(_){ }
        }
    }
    
    // Abrir modal de login/logout
    if (loginIcon) {
        loginIcon.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getLoggedUser();

            // Si no hay modal en esta página, intentar usar un modal de logout local
            if (!loginModal) {
                const localLogoutModal = document.getElementById('modal_logout');
                if (user && localLogoutModal) {
                    // mostrar modal de confirmación local
                    localLogoutModal.classList.add('show');
                    // enlazar botones locales
                    const btnYes = document.getElementById('boton_cerrar_sesion');
                    const btnNo = document.getElementById('boton_cancelar_cerrar_sesion');
                    if (btnYes) {
                        btnYes.onclick = () => {
                            clearLoggedUser();
                            localLogoutModal.classList.remove('show');
                            updateAuthUI();
                            if (typeof renderProducts === 'function') renderProducts();
                            window.location.href = 'login/login.html';
                        };
                    }
                    if (btnNo) {
                        btnNo.onclick = () => {
                            localLogoutModal.classList.remove('show');
                        };
                    }
                    return;
                }

                // si no hay modal y  si no hay usuario dirije al  login
                window.location.href = 'login/login.html';
                return;
            }

            if (user) {
                // Mostrar vista de logout
                if (loginView) loginView.style.display = 'none';
                if (logoutView) logoutView.style.display = 'block';
                const titleEl = document.getElementById('titulo_modal_inicio_sesion');
                if (titleEl) titleEl.textContent = 'Cerrar Sesion';
            } else {
                // Mostrar vista de login
                if (loginView) loginView.style.display = 'block';
                if (logoutView) logoutView.style.display = 'none';
                const titleEl = document.getElementById('titulo_modal_inicio_sesion');
                if (titleEl) titleEl.textContent = 'Iniciar Sesion';
            }

            if (loginModal) loginModal.classList.add('show');
        });
    }

    // Cerrar modal
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (loginModal) loginModal.classList.remove('show');
            if (loginForm) loginForm.reset();
        });
    });

    // Cerrar modal al hacer clic fuera
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                loginModal.classList.remove('show');
                loginForm.reset();
            }
        });
    }

    // Manejar login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
    const email = document.getElementById('correo_login').value.trim();
    const password = document.getElementById('contrasena_login').value;

        const user = validateLogin(email, password);
        
        if (user) {
            setLoggedUser(user);
            loginModal.classList.remove('show');
            loginForm.reset();
            updateAuthUI();
            showConfirmation('¡Bienvenido!', 'Has iniciado sesión correctamente');
        } else {
            alert('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
        }
    });
}

// Manejar cerrar sesión limpiar sesión y redirigir a la página de login
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            clearLoggedUser();
            // Asegurar que no quede modal abierto
            if (loginModal) loginModal.classList.remove('show');
            updateAuthUI();
            // Recargar productos para ocultar botones de admin si aplica
            if (typeof renderProducts === 'function') {
                renderProducts();
            }
            // Redirigir al archivo de login
            window.location.href = 'login/login.html';
        });
    }

    // Cancelar logout
    if (btnCancelarLogout) {
        btnCancelarLogout.addEventListener('click', () => {
            if (loginModal) loginModal.classList.remove('show');
        });
    }

    // Inicializar
    updateAuthUI();
}

    // Mostrar confirmacion
function showConfirmation(title, message) {
    const confirmModal = document.getElementById('modal_confirmacion');
    const confirmTitle = document.getElementById('titulo_confirmacion');
    const confirmMessage = document.getElementById('mensaje_confirmacion');
    const btnConfirmOk = document.getElementById('boton_confirmar_aceptar');

    if (confirmTitle) confirmTitle.textContent = title;
    if (confirmMessage) confirmMessage.textContent = message;
    if (confirmModal) confirmModal.classList.add('show');

    if (btnConfirmOk) {
        btnConfirmOk.onclick = () => {
            if (confirmModal) confirmModal.classList.remove('show');
        };
    }

    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) {
                confirmModal.classList.remove('show');
            }
        });
    }
}


// Intenta obtener arreglo de usuarios del storage
function _getUsersInternal() {

  try {
    if (typeof USERS_STORAGE_KEY !== 'undefined') {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } else {
      const raw = localStorage.getItem('users');
      return raw ? JSON.parse(raw) : [];
    }
  } catch { return []; }
}

// Verifica contraseña del usuario actual
function verifyCurrentPassword(pass) {
  const u = (typeof getLoggedUser==='function') ? getLoggedUser() : null;
  if (!u) return false;
  const users = _getUsersInternal();
  const real = users.find(x =>
    (x.email && u.email && x.email===u.email) ||
    (x.username && u.username && x.username===u.username)
  );
  if (!real) return false;
 
  // Ajusta el nombre del campo si guarda como 'pwd' o 'pass'
  const saved = (real.password ?? real.pass ?? real.pwd);
  return saved === pass;
}


// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}


// Detectar admin
function isAdminUser() {
  const u = (typeof getLoggedUser==='function') ? getLoggedUser() : null;
  return !!(u && (u.role==='admin' || u.isAdmin===true));
}

// Aplicar reglas por rol 
function aplicarReglasPorRol() {
  const esAdmin = isAdminUser();

    // Muestra icono del carrito para todos los roles
    const iconCarrito = document.getElementById('icono_carrito');
    if (iconCarrito) iconCarrito.style.display = '';

    // Asegura que los botones "Agregar al carrito" estén visibles para todos
    document.querySelectorAll('.btn-agregar-carrito').forEach(btn=>{
        btn.style.display = '';
    });

  //  Controles admin mostrar si es admin / ocultar si no es usuario
  const adminElems = document.querySelectorAll('.admin-controls, .btn-edit, .btn-delete, .btn-admin, #btnAbrirModalProducto');
  adminElems.forEach(el=>{
    el.style.display = esAdmin ? '' : 'none';
  });

    // Ocultar la sección VENTAS para usuarios que no son admin
    try {
        const navVentas = document.getElementById('nav_ventas');
        if (navVentas) navVentas.style.display = esAdmin ? '' : 'none';
    } catch (_) {}
}


document.addEventListener('DOMContentLoaded', ()=> {
  try { aplicarReglasPorRol(); } catch(_) {}
});
