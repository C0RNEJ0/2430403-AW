

class ModalHandler {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // si el usuario hace clic en el fondo oscuro, cerramos el modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal-modern');
                if (modal) this.closeModal(modal);
            }
        });

        // si el usuario presiona la tecla Escape, cerramos todos los modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // aqui preparamos todos los botones de cerrar
        this.initCloseButtons();
    }

    initCloseButtons() {
        // aqui buscamos todos los botones que cierran modales
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            // si ya le pusimos el evento antes, no lo hacemos otra vez
            if (btn._modalCloseListenerAdded) return;

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const modal = btn.closest('.modal-modern');
                if (modal) this.closeModal(modal);
            });

            btn._modalCloseListenerAdded = true;
        });

        // aqui buscamos el boton especifico de cerrar sesion del modal
        const botonCerrarSesion = document.getElementById('boton_cerrar_sesion');
        if (botonCerrarSesion && !botonCerrarSesion._logoutListenerAdded) {
            botonCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // aqui llamamos la funcion que cierra la sesion
                cerrar_sesion();
            });
            botonCerrarSesion._logoutListenerAdded = true;
        }
    }

    /**
     * aqui abrimos un modal usando su ID
     * @param {string} modalId - el ID del modal que queremos abrir
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal con ID "${modalId}" no encontrado`);
            return;
        }

        // le ponemos la clase show para que se vea
        modal.classList.add('show');
        this.activeModals.add(modalId);

        // evitamos que la pagina se pueda hacer scroll cuando el modal esta abierto
        if (this.activeModals.size === 1) {
            document.body.style.overflow = 'hidden';
        }

        // despues de que se abra el modal, ponemos el cursor en el primer campo
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput && !firstInput.disabled) {
                firstInput.focus();
            }
        }, 350);

        // volvemos a preparar los botones de cerrar por si el modal es nuevo
        this.initCloseButtons();
    }

    /**
     * aqui cerramos un modal
     * @param {string|HTMLElement} modal - el ID del modal o el modal mismo
     */
    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }

        if (!modal) return;

        // le quitamos la clase show para que se esconda
        modal.classList.remove('show');
        this.activeModals.delete(modal.id);

        // dejamos que la pagina se pueda hacer scroll otra vez si ya no hay modales abiertos
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        // si el modal tiene un formulario, lo limpiamos
        const form = modal.querySelector('form');
        if (form) {
            // esperamos un poquito para que termine la animacion antes de limpiar
            setTimeout(() => {
                form.reset();
            }, 300);
        }
    }

    /**
     * aqui cerramos todos los modales que esten abiertos
     */
    closeAllModals() {
        document.querySelectorAll('.modal-modern.show').forEach(modal => {
            this.closeModal(modal);
        });
    }

    /**
     * aqui verificamos si un modal esta abierto o no
     * @param {string} modalId - el ID del modal que queremos verificar
     * @returns {boolean}
     */
    isOpen(modalId) {
        return this.activeModals.has(modalId);
    }
}

// aqui creamos el manejador de modales
const modalHandler = new ModalHandler();

// estas funciones las usamos en todo el codigo para abrir y cerrar modales
function abrirModal(modalId) {
    modalHandler.openModal(modalId);
}

function cerrarModal(modalId) {
    modalHandler.closeModal(modalId);
}

/**
 * aqui cerramos la sesion del usuario
 * borramos todos los datos guardados y lo mandamos al login
 */
function cerrar_sesion() {
    // le avisamos al servidor que cierre la sesion
    fetch('../controllers/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'accion=logout'
    })
        .then(response => response.json())
        .then(data => {
            console.log('Sesion cerrada en el servidor:', data);
        })
        .catch(error => {
            console.error('Error al cerrar sesion en el servidor:', error);
        })
        .finally(() => {
            // borramos todo lo que guardamos del usuario
            localStorage.removeItem('usuario_actual');
            localStorage.removeItem('usuario_email');
            localStorage.removeItem('usuario_rol');
            sessionStorage.clear();
            // mandamos al usuario a la pagina de login
            window.location.href = '../views/login/login.html';
        });
}

// aqui hacemos que las funciones se puedan usar en toda la pagina
window.modalHandler = modalHandler;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.cerrar_sesion = cerrar_sesion;

// esto es para que funcione si usamos modulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalHandler, modalHandler, abrirModal, cerrarModal, cerrar_sesion };
}
