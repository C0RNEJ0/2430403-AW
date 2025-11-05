
const USUARIOS_LS = "users";
const USUARIO_LOGUEADO_LS = "loggedUser";
const PRODUCTOS_LS = "productos"; 

const loadArray = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};
const saveArray = (key, arr) => localStorage.setItem(key, JSON.stringify(arr));
const getLogged = () => JSON.parse(localStorage.getItem(USUARIO_LOGUEADO_LS) || "null");
const setLogged = (obj) => localStorage.setItem(USUARIO_LOGUEADO_LS, JSON.stringify(obj));
const clearLogged = () => localStorage.removeItem(USUARIO_LOGUEADO_LS);

const showAlert = (title, text, icon) => {
        if (window.Swal && typeof Swal.fire === 'function') return Swal.fire(title, text, icon);

    // Si  un alert simple o crear un div en la página
    const container = document.getElementById('contenedor_alertas') || document.getElementById('contenedor-alertas');
        if (!container) return alert(`${title}: ${text}`);

        const id = `alert-${Date.now()}`;
        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.innerHTML = `
            <div class="alert alert-${icon === 'error' ? 'danger' : icon === 'warning' ? 'warning' : icon === 'success' ? 'success' : 'info'} alert-dismissible fade show" role="alert">
                <strong>${title}</strong> ${text}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        container.appendChild(wrapper);

        // auto cierre en 3s
        setTimeout(() => {
            try { const el = document.getElementById(id); if (el) el.remove(); } catch(_){}
        }, 3000);
};

// Validaciones simples
const isGmail = (email) => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
const isValidUrl = (u) => /^https?:\/\/.+/i.test(u);
const isPositive = (n) => Number.isFinite(n) && n > 0;
const isNonNegativeInt = (n) => Number.isInteger(n) && n >= 0;

// Estado en memoria
let users = loadArray(USUARIOS_LS);
let products = loadArray(PRODUCTOS_LS);

// Asegurar usuario admin por defecto
if (!users.some(u => u.email && u.email.toLowerCase() === 'admin@gmail.com')) {
    users.push({ email: 'admin@gmail.com', pass: '123456', role: 'admin' });
    saveArray(USUARIOS_LS, users);
}

// Elementos 
const formulario_inicio_sesion = document.getElementById('form_inicio_sesion') || document.getElementById('form-inicio-sesion');
const formulario_registrar = document.getElementById('form_registrar') || document.getElementById('form-registrar');
const boton_cerrar_sesion = document.getElementById('logout');
const vista_login = document.getElementById('login');
const vista_registro = document.getElementById('registro');
const vista_apartado = document.getElementById('apartado');

// Render de los productos ¿si existen?
function renderProducts() {
    const container = document.getElementById('contenedor_productos');
    if (!container) return;
    container.innerHTML = '';
    products = loadArray(PRODUCTOS_LS);
    if (!products.length) {
        container.innerHTML = `<p class="text-muted text-center">No hay productos registrados aún.</p>`;
        return;
    }
    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
        const precio = Number.isFinite(p.precio) ? p.precio : (parseFloat(p.price) || 0);
        card.innerHTML = `
            <div class="card h-100 shadow-sm">
                <img src="${p.imagen || p.imageUrl || ''}" class="card-img-top" alt="${p.nombre || p.name}" style="height:200px;object-fit:cover;">
                <div class="card-body text-center">
                    <h5 class="card-title">${p.nombre || p.name}</h5>
                    <p class="card-text mb-1 text-muted">${p.desc || p.descripcion || ''}</p>
                    <p class="card-text mb-1"><strong>Precio:</strong> $${(precio).toFixed(2)}</p>
                    <p class="card-text"><strong>Stock:</strong> ${p.stock ?? p.cantidad ?? 0}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Registro de usuario
if (formulario_registrar) {
    formulario_registrar.addEventListener('submit', (e) => {
        e.preventDefault();
    const email = (document.getElementById('correo_reg') || document.getElementById('correo_registro') || {}).value || '';
    const password = (document.getElementById('contrasena_reg') || document.getElementById('contrasena_registro') || {}).value || '';
    const confirm = (document.getElementById('confirmar_contrasena') || document.getElementById('confirmar_contrasena_registro') || {}).value || '';

        if (!isGmail(email)) return showAlert('Error', 'Usa un correo @gmail.com válido', 'warning');
        if (password.length < 6) return showAlert('Error', 'Contraseña mínima de 6 caracteres', 'warning');
        if (password !== confirm) return showAlert('Error', 'Las contraseñas no coinciden', 'warning');
        if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return showAlert('Error', 'Ese correo ya está registrado', 'error');

        users.push({ email, pass: password });
        saveArray(USUARIOS_LS, users);

        // mostrar modal de éxito si existe
    const modal = document.getElementById('modal_exito') || document.getElementById('modal-exito');
        if (modal) {
        modal.classList.add('show');
        const boton_ir_login = document.getElementById('boton_ir_login') || document.getElementById('boton-ir-login');
        if (boton_ir_login) {
            boton_ir_login.onclick = () => {
                try { modal.classList.remove('show'); } catch(_){}
                // ir a la página de login para iniciar sesión
                window.location.href = 'login.html';
            };
        }
    }
    (document.getElementById('correo_reg') || {}).value = '';
    (document.getElementById('contrasena_reg') || {}).value = '';
    (document.getElementById('confirmar_contrasena') || {}).value = '';
    });
}

// Si existe el botón del modal de registro, redirigir al login cuando se pulse
const boton_ir_login_global = document.getElementById('boton_ir_login') || document.getElementById('boton-ir-login');
if (boton_ir_login_global) {
    boton_ir_login_global.addEventListener('click', () => {
        // desde registro.html ir a login.html
        window.location.href = 'login.html';
    });
}

// Login
if (formulario_inicio_sesion) {
    formulario_inicio_sesion.addEventListener('submit', (e) => {
        e.preventDefault();
    const email = (document.getElementById('correo_login') || document.getElementById('correo_inicio') || {}).value || '';
    const password = (document.getElementById('contrasena_login') || document.getElementById('contrasena_inicio') || {}).value || '';

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === password);
        if (!user) return showAlert('Error', 'Credenciales incorrectas', 'error');

        setLogged(user);
        if (vista_login) vista_login.classList.add('d-none');
        if (vista_apartado) {
            vista_apartado.classList.remove('d-none');
            renderProducts();
        } else {
            // si no hay área de administrador en esta página, mostrar solo el modal de bienvenida
            try {
                        const modal = document.querySelector('#modal_bienvenida, #modal-bienvenida');
                if (modal) {
                    modal.classList.add('show');
                    // permitir cerrar el modal al hacer clic fuera
                    modal.addEventListener('click', function handler(e) {
                        if (e.target === modal) {
                            modal.classList.remove('show');
                            modal.removeEventListener('click', handler);
                        }
                    });
                    // botón ir a la tienda: cerrar modal y redirigir
                    const boton_ir_tienda = document.getElementById('boton_ir_tienda') || document.getElementById('boton-ir-tienda');
                    if (boton_ir_tienda) {
                        boton_ir_tienda.onclick = () => {
                            try { modal.classList.remove('show'); } catch(_){ }
                            window.location.href = '../index.html';
                        };
                    }
                }
            } catch (e) {
                // fallback: nada
            }
        }
    });
}

// Logout
if (boton_cerrar_sesion) {
    boton_cerrar_sesion.addEventListener('click', () => {
        clearLogged();
        if (vista_apartado) vista_apartado.classList.add('d-none');
        if (vista_login) vista_login.classList.remove('d-none');
    });
}

// Formulario de producto 
const formulario_producto = document.getElementById('productForm') || document.getElementById('formulario_producto');
if (formulario_producto) {
    formulario_producto.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (document.getElementById('pName') || document.getElementById('p_nombre') || {}).value.trim();
        const desc = (document.getElementById('pDesc') || document.getElementById('p_descripcion') || {}).value.trim();
        const price = parseFloat((document.getElementById('pPrice') || document.getElementById('p_precio') || {}).value) || 0;
        const stock = parseInt((document.getElementById('pStock') || document.getElementById('p_stock') || {}).value, 10) || 0;
        const imageUrl = (document.getElementById('pImageUrl') || document.getElementById('p_imagen') || {}).value.trim();

        if (!name) return showAlert('Error', 'Nombre requerido', 'warning');
        if (!desc) return showAlert('Error', 'Descripción requerida', 'warning');
        if (!isPositive(price)) return showAlert('Error', 'Precio debe ser > 0', 'warning');
        if (!isNonNegativeInt(stock)) return showAlert('Error', 'Stock debe ser entero ≥ 0', 'warning');
        if (!isValidUrl(imageUrl)) return showAlert('Error', 'URL de imagen inválida (use http/https)', 'warning');

        const newProduct = {
            id: Date.now(),
            nombre: name,
            desc,
            precio: price,
            stock,
            imagen: imageUrl
        };
    products = loadArray(PRODUCTOS_LS);
        products.push(newProduct);
    saveArray(PRODUCTOS_LS, products);
    formulario_producto.reset();
        renderProducts();
        showAlert('Guardado', 'Producto registrado correctamente', 'success');
    });
}

// Restaurar sesión si existía
window.addEventListener('DOMContentLoaded', () => {
    users = loadArray(USUARIOS_LS);
    products = loadArray(PRODUCTOS_LS);
    const logged = getLogged();
    if (logged) {
        if (vista_login) vista_login.classList.add('d-none');
        if (vista_apartado) {
            vista_apartado.classList.remove('d-none');
            renderProducts();
        }
    }
});

