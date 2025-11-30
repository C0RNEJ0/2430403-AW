

class SistemaNotificaciones {
    constructor() {
        this.callbackConfirmar = null;
        this.inicializar();
    }

    inicializar() {
        // los modales se crean la primera vez que se usa el sistema
        this.crearModales();
        this.vincularEventos();
    }

    crearModales() {
        if (document.getElementById('modal_notificacion')) return;

        const htmlModales = `
            <!-- Modal de Notificacion (exito, error, advertencia) -->
            <div id="modal_notificacion" class="modal-modern">
                <div class="modal-overlay"></div>
                <div class="modal-container modal-small">
                    <div class="modal-header" id="notif_header">
                        <i id="notif_icono" class="bi bi-check-circle"></i>
                        <h3 id="notif_titulo">Notificación</h3>
                        <button class="modal-close" data-modal-close>
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p id="notif_mensaje">Mensaje de notificación</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-modal-primary" data-modal-close>Aceptar</button>
                    </div>
                </div>
            </div>

            <!-- Modal de Confirmacion -->
            <div id="modal_confirmacion" class="modal-modern">
                <div class="modal-overlay"></div>
                <div class="modal-container modal-small">
                    <div class="modal-header">
                        <i class="bi bi-question-circle"></i>
                        <h3 id="confirm_titulo">Confirmar Acción</h3>
                        <button class="modal-close" data-modal-close>
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p id="confirm_mensaje">¿Está seguro que desea realizar esta acción?</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-modal-secondary" id="btn_confirm_cancelar" data-modal-close>Cancelar</button>
                        <button class="btn-modal-danger" id="btn_confirm_aceptar">Confirmar</button>
                    </div>
                </div>
            </div>
        `;

        // agregamos los modales al body
        const div = document.createElement('div');
        div.innerHTML = htmlModales;
        document.body.appendChild(div);
    }

    vincularEventos() {
        // esperamos un poco para que los modales se creen
        setTimeout(() => {
            const btnConfirmarAceptar = document.getElementById('btn_confirm_aceptar');
            const btnConfirmarCancelar = document.getElementById('btn_confirm_cancelar');

            if (btnConfirmarAceptar) {
                btnConfirmarAceptar.addEventListener('click', () => {
                    if (this.callbackConfirmar) {
                        this.callbackConfirmar(true);
                        this.callbackConfirmar = null;
                    }
                    cerrarModal('modal_confirmacion');
                });
            }

            if (btnConfirmarCancelar) {
                btnConfirmarCancelar.addEventListener('click', () => {
                    if (this.callbackConfirmar) {
                        this.callbackConfirmar(false);
                        this.callbackConfirmar = null;
                    }
                    cerrarModal('modal_confirmacion');
                });
            }
        }, 100);
    }

    /**
     * muestra una notificacion de exito
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo opcional
     */
    exito(mensaje, titulo = 'Éxito') {
        this.mostrarNotificacion(mensaje, titulo, 'exito');
    }

    /**
     * muestra una notificacion de error
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo opcional
     */
    error(mensaje, titulo = 'Error') {
        this.mostrarNotificacion(mensaje, titulo, 'error');
    }

    /**
     * muestra una notificacion de advertencia
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo opcional
     */
    advertencia(mensaje, titulo = 'Advertencia') {
        this.mostrarNotificacion(mensaje, titulo, 'advertencia');
    }

    /**
     * muestra una notificacion de informacion
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo opcional
     */
    info(mensaje, titulo = 'Información') {
        this.mostrarNotificacion(mensaje, titulo, 'info');
    }

    /**
     * muestra un modal de notificacion
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo del modal
     * @param {string} tipo - tipo de notificacion (exito, error, advertencia, info)
     */
    mostrarNotificacion(mensaje, titulo, tipo = 'info') {
        const encabezado = document.getElementById('notif_header');
        const icono = document.getElementById('notif_icono');
        const tituloEl = document.getElementById('notif_titulo');
        const mensajeEl = document.getElementById('notif_mensaje');

        if (!encabezado || !icono || !tituloEl || !mensajeEl) {
            console.error('elementos del modal de notificacion no encontrados');
            return;
        }

        // configuramos el icono y color segun el tipo
        const configuraciones = {
            exito: {
                icono: 'bi-check-circle',
                clase: 'header-success'
            },
            error: {
                icono: 'bi-x-circle',
                clase: 'header-danger'
            },
            advertencia: {
                icono: 'bi-exclamation-triangle',
                clase: 'header-warning'
            },
            info: {
                icono: 'bi-info-circle',
                clase: 'header-info'
            }
        };

        const config = configuraciones[tipo] || configuraciones.info;

        // limpiamos clases anteriores
        encabezado.className = 'modal-header';
        icono.className = `bi ${config.icono}`;

        // agregamos la nueva clase
        if (config.clase) {
            encabezado.classList.add(config.clase);
        }

        // configuramos el contenido
        tituloEl.textContent = titulo;
        mensajeEl.textContent = mensaje;

        // mostramos el modal
        abrirModal('modal_notificacion');
    }

    /**
     * muestra un modal de confirmacion
     * @param {string} mensaje - mensaje a mostrar
     * @param {string} titulo - titulo opcional
     * @returns {Promise<boolean>} - promesa que se resuelve con true si confirma, false si cancela
     */
    confirmar(mensaje, titulo = 'Confirmar Acción') {
        return new Promise((resolver) => {
            const tituloEl = document.getElementById('confirm_titulo');
            const mensajeEl = document.getElementById('confirm_mensaje');

            if (!tituloEl || !mensajeEl) {
                console.error('elementos del modal de confirmacion no encontrados');
                resolver(false);
                return;
            }

            // configuramos el contenido
            tituloEl.textContent = titulo;
            mensajeEl.textContent = mensaje;

            // guardamos el callback
            this.callbackConfirmar = resolver;

            // mostramos el modal
            abrirModal('modal_confirmacion');
        });
    }

    /**
     * muestra un modal de confirmacion para eliminacion
     * @param {string} nombreElemento - nombre del elemento a eliminar
     * @returns {Promise<boolean>}
     */
    confirmarEliminar(nombreElemento) {
        return this.confirmar(
            `¿Está seguro que desea eliminar ${nombreElemento}? Esta acción no se puede deshacer.`,
            'Confirmar Eliminación'
        );
    }
}

// creamos la instancia global
const sistemaNotificaciones = new SistemaNotificaciones();

// exponemos las funciones globalmente para que sean faciles de usar
window.mostrarExito = (mensaje, titulo) => sistemaNotificaciones.exito(mensaje, titulo);
window.mostrarError = (mensaje, titulo) => sistemaNotificaciones.error(mensaje, titulo);
window.mostrarAdvertencia = (mensaje, titulo) => sistemaNotificaciones.advertencia(mensaje, titulo);
window.mostrarInfo = (mensaje, titulo) => sistemaNotificaciones.info(mensaje, titulo);
window.confirmarAccion = (mensaje, titulo) => sistemaNotificaciones.confirmar(mensaje, titulo);
window.confirmarEliminar = (nombreElemento) => sistemaNotificaciones.confirmarEliminar(nombreElemento);

// exportamos para uso con modulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SistemaNotificaciones, sistemaNotificaciones };
}
