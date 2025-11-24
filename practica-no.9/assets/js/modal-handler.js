

class ModalHandler {
    constructor() {
        this.activeModals = new Set();
        this.init();
    }

    init() {
        // Cerrar modales al hacer clic en overlay
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal-modern');
                if (modal) this.closeModal(modal);
            }
        });

        // Cerrar modales con tecla Esc
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Inicializar botones de cerrar cuando el DOM esté listo
        this.initCloseButtons();
    }

    initCloseButtons() {
        // Botones de cerrar con atributo data-modal-close
        document.querySelectorAll('[data-modal-close]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const modal = btn.closest('.modal-modern');
                if (modal) this.closeModal(modal);
            });
        });
    }

    /**
     * Abrir un modal por ID
     * @param {string} modalId - ID del modal a abrir
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal con ID "${modalId}" no encontrado`);
            return;
        }

        // Agregar clase show
        modal.classList.add('show');
        this.activeModals.add(modalId);

        // Prevenir scroll del body
        if (this.activeModals.size === 1) {
            document.body.style.overflow = 'hidden';
        }

        // Focus en primer input después de la animación
        setTimeout(() => {
            const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
            if (firstInput && !firstInput.disabled) {
                firstInput.focus();
            }
        }, 350);

        // Re-inicializar botones de cerrar por si el modal fue creado dinámicamente
        this.initCloseButtons();
    }

    /**
     * Cerrar un modal
     * @param {string|HTMLElement} modal - ID del modal o elemento del modal
     */
    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }

        if (!modal) return;

        // Remover clase show
        modal.classList.remove('show');
        this.activeModals.delete(modal.id);

        // Restaurar scroll del body si no hay más modales abiertos
        if (this.activeModals.size === 0) {
            document.body.style.overflow = '';
        }

        // Limpiar formularios si existen
        const form = modal.querySelector('form');
        if (form) {
            // Esperar a que termine la animación antes de limpiar
            setTimeout(() => {
                form.reset();
            }, 300);
        }
    }

    /**
     * Cerrar todos los modales abiertos
     */
    closeAllModals() {
        document.querySelectorAll('.modal-modern.show').forEach(modal => {
            this.closeModal(modal);
        });
    }

    /**
     * Verificar si un modal está abierto
     * @param {string} modalId - ID del modal
     * @returns {boolean}
     */
    isOpen(modalId) {
        return this.activeModals.has(modalId);
    }
}

// Inicializar el manejador de modales
const modalHandler = new ModalHandler();

// Funciones globales para compatibilidad con código existente
function abrirModal(modalId) {
    modalHandler.openModal(modalId);
}

function cerrarModal(modalId) {
    modalHandler.closeModal(modalId);
}

/**
 * Cerrar sesión del usuario
 * Limpia los datos de sesión y redirige al login
 */
function cerrar_sesion() {
    // Enviar petición al backend para destruir sesión PHP
    fetch('../controllers/login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'accion=logout'
    })
        .then(response => response.json())
        .then(data => {
            console.log('Sesión cerrada en servidor:', data);
        })
        .catch(error => {
            console.error('Error al cerrar sesión en servidor:', error);
        })
        .finally(() => {
            // Limpiar datos locales y redirigir siempre
            localStorage.removeItem('usuario_actual');
            localStorage.removeItem('usuario_email');
            localStorage.removeItem('usuario_rol');
            sessionStorage.clear();
            window.location.href = '../views/login/login.html';
        });
}

// Exponer funciones y objetos globalmente
window.modalHandler = modalHandler;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;
window.cerrar_sesion = cerrar_sesion;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModalHandler, modalHandler, abrirModal, cerrarModal, cerrar_sesion };
}
