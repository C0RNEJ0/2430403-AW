/**
 * Script global para conectar funciones de modales
 * Se incluye en todas las páginas para manejar cerrar sesión
 */

// esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // conectar boton de cerrar sesion
    const boton_cerrar = document.getElementById('boton_cerrar_sesion');
    if (boton_cerrar) {
        boton_cerrar.addEventListener('click', function () {
            cerrar_sesion();
        });
    }

    // conectar botones de cancelar en modales
    const botones_cancelar = document.querySelectorAll('[data-modal-close]');
    botones_cancelar.forEach(boton => {
        if (!boton._conectado) {
            boton.addEventListener('click', function () {
                const modal = this.closest('.modal-modern');
                if (modal) {
                    cerrarModal(modal.id);
                }
            });
            boton._conectado = true;
        }
    });
});
