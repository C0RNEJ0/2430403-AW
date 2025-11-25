// Gestión de Roles
document.addEventListener('DOMContentLoaded', function () {
    cargarRoles();
});

// Cargar y mostrar todos los roles
function cargarRoles() {
    fetch('../controllers/roles.php?accion=listar')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                renderizarTablaRoles(data.datos);
            } else {
                mostrarError('Error al cargar roles: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión al cargar roles');
        });
}

// carga la tabla de roles
function renderizarTablaRoles(roles) {
    const tbody = document.querySelector('#tabla_roles tbody');

    if (roles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay roles registrados</td></tr>';
        return;
    }

    tbody.innerHTML = roles.map(rol => `
        <tr>
            <td>${rol.rol_id}</td>
            <td><strong>${escapeHtml(rol.nombre)}</strong></td>
            <td>${escapeHtml(rol.descripcion || '-')}</td>
            <td>
                <span class="badge bg-info">
                    ${rol.total_usuarios} usuario${rol.total_usuarios !== 1 ? 's' : ''}
                </span>
            </td>
            <td class="text-end table-actions">
                <button class="btn btn-sm btn-success" onclick="abrirModalCrearUsuario('${escapeHtml(rol.nombre)}', ${rol.rol_id})" title="Crear Usuario">
                    <i class="bi bi-person-plus"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="abrirModalEditarRol(${rol.rol_id})" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarRol(${rol.rol_id})" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Abrir modal para crear nuevo rol
function abrirModalNuevoRol() {
    document.getElementById('modal_rol_titulo').textContent = 'Nuevo Rol';
    document.getElementById('form_rol').reset();
    document.getElementById('rol_id').value = '';
    abrirModal('modal_rol');
}

// Abrir modal para editar rol
function abrirModalEditarRol(rolId) {
    fetch(`../controllers/roles.php?accion=obtener&rol_id=${rolId}`)
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                const rol = data.datos;
                document.getElementById('modal_rol_titulo').textContent = 'Editar Rol';
                document.getElementById('rol_id').value = rol.rol_id;
                document.getElementById('rol_nombre').value = rol.nombre;
                document.getElementById('rol_descripcion').value = rol.descripcion || '';
                abrirModal('modal_rol');
            } else {
                mostrarError('Error al cargar rol: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión al cargar rol');
        });
}

// Guardar rol (crear o editar)
function guardarRol() {
    const form = document.getElementById('form_rol');
    const formData = new FormData(form);

    const rolId = document.getElementById('rol_id').value;
    const accion = rolId ? 'editar' : 'crear';

    formData.append('accion', accion);
    if (rolId) {
        formData.append('rol_id', rolId);
    }

    // Validar nombre
    const nombre = formData.get('nombre').trim();
    if (!nombre) {
        mostrarError('El nombre del rol es requerido');
        return;
    }

    // Deshabilitar botón mientras se procesa
    const btnGuardar = document.getElementById('btn_guardar_rol');
    const textoOriginal = btnGuardar.innerHTML;
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

    fetch('../controllers/roles.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarExito(data.mensaje || 'Rol guardado exitosamente');
                cerrarModal('modal_rol');
                cargarRoles();
            } else {
                mostrarError(data.error || 'Error al guardar rol');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión al guardar rol');
        })
        .finally(() => {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
        });
}

// Solicitar confirmación para eliminar rol
function eliminarRol(rolId) {
    document.getElementById('eliminar_rol_id').value = rolId;
    abrirModal('modal_eliminar_rol');
}

// Confirmar y ejecutar eliminación de rol
function confirmarEliminarRol() {
    const rolId = document.getElementById('eliminar_rol_id').value;

    const formData = new FormData();
    formData.append('accion', 'eliminar');
    formData.append('rol_id', rolId);

    // Deshabilitar botón
    const btnEliminar = document.getElementById('btn_confirmar_eliminar');
    const textoOriginal = btnEliminar.innerHTML;
    btnEliminar.disabled = true;
    btnEliminar.innerHTML = '<i class="bi bi-hourglass-split"></i> Eliminando...';

    fetch('../controllers/roles.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarExito(data.mensaje || 'Rol eliminado exitosamente');
                cerrarModal('modal_eliminar_rol');
                cargarRoles();
            } else {
                mostrarError(data.error || 'Error al eliminar rol');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión al eliminar rol');
        })
        .finally(() => {
            btnEliminar.disabled = false;
            btnEliminar.innerHTML = textoOriginal;
        });
}

// NUEVO: Abrir modal para crear usuario con un rol específico
function abrirModalCrearUsuario(nombreRol, rolId) {
    // Por ahora mostrar un alert, luego implementaremos el modal completo
    alert(`Funcionalidad para crear usuario con rol "${nombreRol}" en desarrollo.\n\nPróximamente podrás:\n- Crear médicos con email y contraseña\n- Crear secretarias con email y contraseña\n- Asociar automáticamente el rol correcto`);
}

// Mostrar mensaje de éxito
function mostrarExito(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alerta.style.zIndex = '9999';
    alerta.innerHTML = `
        <i class="bi bi-check-circle"></i> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
    alerta.style.zIndex = '9999';
    alerta.innerHTML = `
        <i class="bi bi-exclamation-triangle"></i> ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.remove();
    }, 5000);
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Abrir modal
function abrirModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

// Cerrar modal
function cerrarModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Event listeners para cerrar modales
document.addEventListener('click', function (e) {
    if (e.target.matches('[data-modal-close]') || e.target.closest('[data-modal-close]')) {
        const modal = e.target.closest('.modal-modern');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    if (e.target.matches('.modal-overlay')) {
        const modal = e.target.closest('.modal-modern');
        if (modal) {
            modal.classList.remove('active');
        }
    }
});
