// archivo para cargar y mostrar logs de usuarios
(function () {
    let logs = [];

    // cargar logs desde el servidor
    async function cargarLogs() {
        try {
            const respuesta = await fetch('../controllers/logs.php');
            const datos = await respuesta.json();

            if (datos.exito) {
                logs = datos.datos || [];
                mostrarLogs();
            } else {
                console.error('Error al cargar logs:', datos.error);
                mostrarError('Error al cargar logs: ' + datos.error);
            }
        } catch (error) {
            console.error('Error en la petición de logs:', error);
            mostrarError('Error al cargar logs');
        }
    }

    // mostrar logs en la tabla
    function mostrarLogs() {
        const tablaCuerpo = document.querySelector('#tabla_logs tbody');
        if (!tablaCuerpo) return;

        tablaCuerpo.innerHTML = '';

        if (logs.length === 0) {
            tablaCuerpo.innerHTML = '<tr><td colspan="7" class="text-center">No hay logs registrados</td></tr>';
            return;
        }

        logs.forEach(log => {
            const fila = document.createElement('tr');

            // formatear fecha
            const fecha = new Date(log.creado_en);
            const fechaFormateada = fecha.toLocaleString('es-MX');

            fila.innerHTML = `
        <td>${log.bitacora_id}</td>
        <td>${log.usuario_email || 'Sistema'}</td>
        <td><span class="badge bg-${obtenerColorAccion(log.accion)}">${log.accion}</span></td>
        <td>${log.tabla_afectada || 'N/A'}</td>
        <td>${log.detalles || 'Sin detalles'}</td>
        <td>${log.ip || 'N/A'}</td>
        <td>${fechaFormateada}</td>
      `;

            tablaCuerpo.appendChild(fila);
        });
    }

    // obtener color para el badge según la acción
    function obtenerColorAccion(accion) {
        const colores = {
            'login': 'success',
            'logout': 'secondary',
            'crear': 'primary',
            'editar': 'warning',
            'eliminar': 'danger',
            'consultar': 'info'
        };

        return colores[accion.toLowerCase()] || 'secondary';
    }

    // mostrar mensaje de error
    function mostrarError(mensaje) {
        const tablaCuerpo = document.querySelector('#tabla_logs tbody');
        if (tablaCuerpo) {
            tablaCuerpo.innerHTML = `<tr><td colspan="7" class="text-danger text-center">${mensaje}</td></tr>`;
        }
    }

    // filtrar logs por texto
    function filtrarLogs(texto) {
        const textoLower = texto.toLowerCase();
        const logsFiltrados = logs.filter(log => {
            return (log.usuario_email && log.usuario_email.toLowerCase().includes(textoLower)) ||
                (log.accion && log.accion.toLowerCase().includes(textoLower)) ||
                (log.tabla_afectada && log.tabla_afectada.toLowerCase().includes(textoLower)) ||
                (log.detalles && log.detalles.toLowerCase().includes(textoLower));
        });

        mostrarLogsFiltrados(logsFiltrados);
    }

    // mostrar logs filtrados
    function mostrarLogsFiltrados(logsFiltrados) {
        const tablaCuerpo = document.querySelector('#tabla_logs tbody');
        if (!tablaCuerpo) return;

        tablaCuerpo.innerHTML = '';

        if (logsFiltrados.length === 0) {
            tablaCuerpo.innerHTML = '<tr><td colspan="7" class="text-center">No se encontraron logs</td></tr>';
            return;
        }

        logsFiltrados.forEach(log => {
            const fila = document.createElement('tr');
            const fecha = new Date(log.creado_en);
            const fechaFormateada = fecha.toLocaleString('es-MX');

            fila.innerHTML = `
        <td>${log.bitacora_id}</td>
        <td>${log.usuario_email || 'Sistema'}</td>
        <td><span class="badge bg-${obtenerColorAccion(log.accion)}">${log.accion}</span></td>
        <td>${log.tabla_afectada || 'N/A'}</td>
        <td>${log.detalles || 'Sin detalles'}</td>
        <td>${log.ip || 'N/A'}</td>
        <td>${fechaFormateada}</td>
      `;

            tablaCuerpo.appendChild(fila);
        });
    }

    // inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function () {
        cargarLogs();

        // agregar evento al buscador
        const buscador = document.getElementById('buscar_logs');
        if (buscador) {
            buscador.addEventListener('input', function () {
                filtrarLogs(this.value);
            });
        }

        // botón de recargar
        const btnRecargar = document.getElementById('btn_recargar_logs');
        if (btnRecargar) {
            btnRecargar.addEventListener('click', cargarLogs);
        }
    });
})();
