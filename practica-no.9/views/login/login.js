

// Función para mostrar alertas
const mostrarAlerta = (titulo, texto, icono) => {
    if (window.Swal && typeof Swal.fire === 'function') return Swal.fire(titulo, texto, icono);
    alert(`${titulo}: ${texto}`);
};

// Elementos del DOM
const formulario_inicio_sesion = document.getElementById('form_inicio_sesion') || document.getElementById('form-inicio-sesion');
const boton_cerrar_sesion = document.getElementById('logout');

// ============================================
// INICIO DE SESIÓN (Conectado a Base de Datos)
// ============================================
if (formulario_inicio_sesion) {
    formulario_inicio_sesion.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = (document.getElementById('correo_login') || document.getElementById('correo_inicio') || {}).value || '';
        const password = (document.getElementById('contrasena_login') || document.getElementById('contrasena_inicio') || {}).value || '';

        if (!email || !password) {
            return mostrarAlerta('Error', 'Por favor ingresa email y contraseña', 'warning');
        }

        // Datos para enviar
        const formData = new FormData();
        formData.append('accion', 'login');
        formData.append('email', email);
        formData.append('password', password);

        try {
            // Enviar datos al servidor
            const response = await fetch('../../controllers/login.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.exito) {
                // Login correcto

                // Si hay modal de bienvenida, mostrarlo
                const modal = document.querySelector('#modal_bienvenida, #modal-bienvenida');
                if (modal) {
                    const h2 = modal.querySelector('h2');
                    if (h2) h2.textContent = `Bienvenido ${data.usuario.nombre}`;

                    modal.classList.add('show');

                    // Botón para continuar
                    const btnContinuar = modal.querySelector('button') || document.getElementById('boton_ir_tienda');
                    if (btnContinuar) {
                        btnContinuar.onclick = () => window.location.href = data.redirect;
                    }

                    // Cerrar automáticamente después de 2 segundos
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 2000);
                } else {
                    // Si no hay modal, ir directo
                    window.location.href = data.redirect;
                }
            } else {
                // Error (contraseña mal o usuario no existe)
                mostrarAlerta('Error', data.error || 'Datos incorrectos', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error', 'Falló la conexión con el servidor', 'error');
        }
    });
}

// ============================================
// CERRAR SESIÓN
// ============================================
if (boton_cerrar_sesion) {
    boton_cerrar_sesion.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('accion', 'logout');

            await fetch('../../controllers/login.php', {
                method: 'POST',
                body: formData
            });

            // Ir al login
            window.location.href = '../login/login.html';
        } catch (error) {
            console.error('Error al salir:', error);
            window.location.href = '../login/login.html';
        }
    });
}
