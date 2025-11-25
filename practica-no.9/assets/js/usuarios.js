/**
 * Gestión de Usuarios
 * Maneja el CRUD de usuarios en el panel de administración
 */

document.addEventListener('DOMContentLoaded', function () {
    // Cargar usuarios si estamos en la pestaña de usuarios
    const usuariosTab = document.getElementById('usuarios-tab');
    if (usuariosTab) {
        usuariosTab.addEventListener('shown.bs.tab', function () {
            cargarUsuarios();
        });

        // Si ya está activa, cargar
        if (usuariosTab.classList.contains('active')) {
            cargarUsuarios();
        }
    }

    // Búsqueda
    const inputBuscar = document.getElementById('buscar_usuarios');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', function (e) {
            const termino = e.target.value.toLowerCase();
            filtrarUsuarios(termino);
        });
    }

    // aqui conectamos el formulario de usuario para guardar con permisos
    const formUsuario = document.getElementById('form_usuario');
    if (formUsuario) {
        formUsuario.addEventListener('submit', function (e) {
            e.preventDefault();
            guardarUsuarioConPermisos();
        });
    }
});

// aqui guardamos el usuario junto con sus permisos seleccionados
function guardarUsuarioConPermisos() {
    const form = document.getElementById('form_usuario');
    const formData = new FormData(form);

    // aqui obtenemos todos los permisos que el admin marco
    const permisosSeleccionados = [];
    document.querySelectorAll('input[name="permisos[]"]:checked').forEach(checkbox => {
        if (!checkbox.disabled) {
            permisosSeleccionados.push(checkbox.value);
        }
    });

    // agregamos los permisos al formulario
    formData.append('permisos', JSON.stringify(permisosSeleccionados));
    formData.append('accion', 'crear');

    // enviamos todo al servidor
    fetch('../controllers/usuarios.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                alert('Usuario creado con permisos exitosamente');
                const modal = bootstrap.Modal.getInstance(document.getElementById('modal_usuario'));
                if (modal) modal.hide();
                cargarUsuarios();
            } else {
                alert('Error: ' + (data.error || 'Error desconocido'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al guardar usuario');
        });
}


let usuariosData = [];

// Cargar lista de usuarios
function cargarUsuarios() {
    const tbody = document.querySelector('#tabla_usuarios tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary" role="status"></div> Cargando...</td></tr>';

    fetch('../controllers/usuarios.php?accion=listar')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                usuariosData = data.usuarios;
                renderizarTablaUsuarios(usuariosData);
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${data.error}</td></tr>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error de conexión</td></tr>';
        });
}

// Renderizar tabla
function renderizarTablaUsuarios(usuarios) {
    const tbody = document.querySelector('#tabla_usuarios tbody');
    if (!tbody) return;

    if (usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
        return;
    }

    let html = '';
    usuarios.forEach(u => {
        const estadoClass = u.activo == 1 ? 'bg-success' : 'bg-danger';
        const estadoTexto = u.activo == 1 ? 'Activo' : 'Inactivo';
        const medicoAsociado = u.medico_nombre ? `<span class="badge bg-info text-dark">${escapeHtml(u.medico_nombre)}</span>` : '-';

        html += `
            <tr>
                <td>${u.usuario_id}</td>
                <td>
                    <div class="fw-bold">${escapeHtml(u.nombre)}</div>
                    <small class="text-muted">Creado: ${formatearFecha(u.creado_en)}</small>
                </td>
                <td>${escapeHtml(u.email)}</td>
                <td><span class="badge bg-secondary">${escapeHtml(u.rol)}</span></td>
                <td>${medicoAsociado}</td>
                <td><span class="badge ${estadoClass}">${estadoTexto}</span></td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="abrirModalEditarUsuario(${u.usuario_id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${u.activo == 1 ? 'warning' : 'success'}" 
                                onclick="cambiarEstadoUsuario(${u.usuario_id}, ${u.activo == 1 ? 0 : 1})" 
                                title="${u.activo == 1 ? 'Desactivar' : 'Activar'}">
                            <i class="bi bi-${u.activo == 1 ? 'slash-circle' : 'check-circle'}"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="eliminarUsuario(${u.usuario_id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Filtrar usuarios
function filtrarUsuarios(termino) {
    if (!termino) {
        renderizarTablaUsuarios(usuariosData);
        return;
    }

    const filtrados = usuariosData.filter(u =>
        u.nombre.toLowerCase().includes(termino) ||
        u.email.toLowerCase().includes(termino) ||
        u.rol.toLowerCase().includes(termino)
    );

    renderizarTablaUsuarios(filtrados);
}

// aqui abrimos el modal para crear un nuevo usuario
function abrirModalUsuario() {
    // limpiamos el formulario
    const form = document.getElementById('form_usuario');
    if (form) form.reset();

    // limpiamos todos los checkboxes de permisos
    document.querySelectorAll('input[name="permisos[]"]').forEach(checkbox => {
        if (!checkbox.disabled) {
            checkbox.checked = false;
        }
    });

    // cambiamos el titulo del modal
    const titulo = document.getElementById('modal_usuario_titulo');
    if (titulo) titulo.textContent = 'Nuevo Usuario';

    // abrimos el modal usando Bootstrap
    const modalElement = document.getElementById('modal_usuario');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

// Abrir modal de edición
function abrirModalEditarUsuario(usuarioId) {
    // Obtener datos del usuario
    fetch(`../controllers/usuarios.php?accion=obtener&usuario_id=${usuarioId}`)
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                const u = data.usuario;

                document.getElementById('edit_usuario_id').value = u.usuario_id;
                document.getElementById('edit_usuario_nombre').value = u.nombre;
                document.getElementById('edit_usuario_email').value = u.email;

                // Cargar roles y seleccionar el actual
                cargarRolesSelect(u.rol);

                // Cargar médicos para asociar (si es secretaria)
                cargarMedicosSelect(u.medico_id);

                abrirModal('modal_editar_usuario');
            } else {
                mostrarError(data.error || 'Error al cargar usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión');
        });
}

// Cargar roles en el select
function cargarRolesSelect(rolActual) {
    fetch('../controllers/roles.php?accion=listar')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                const select = document.getElementById('edit_usuario_rol');
                let html = '<option value="">Seleccionar rol...</option>';

                data.roles.forEach(r => {
                    const selected = r.nombre === rolActual ? 'selected' : '';
                    html += `<option value="${r.nombre}" ${selected}>${r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}</option>`;
                });

                select.innerHTML = html;
                toggleCamposEditarUsuario();
            }
        });
}

// Cargar médicos en el select
function cargarMedicosSelect(medicoIdActual) {
    fetch('../controllers/medicos_list.php')
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                const select = document.getElementById('edit_usuario_medico_asociado');
                let html = '<option value="">Sin médico asociado</option>';

                data.datos.forEach(m => {
                    const selected = m.medico_id == medicoIdActual ? 'selected' : '';
                    html += `<option value="${m.medico_id}" ${selected}>${escapeHtml(m.nombre)}</option>`;
                });

                select.innerHTML = html;
            }
        });
}

// Mostrar/ocultar campos según rol seleccionado
function toggleCamposEditarUsuario() {
    const rol = document.getElementById('edit_usuario_rol').value;
    const camposMedico = document.getElementById('edit_campos_medico');
    const camposSecretaria = document.getElementById('edit_campos_secretaria');

    camposMedico.style.display = 'none';
    camposSecretaria.style.display = 'none';

    if (rol === 'medico') {
        camposMedico.style.display = 'block';
    } else if (rol === 'secretaria') {
        camposSecretaria.style.display = 'block';
    }
}

// Guardar cambios
function actualizarUsuario() {
    const form = document.getElementById('form_editar_usuario');
    const formData = new FormData(form);
    formData.append('accion', 'editar');

    const btn = document.getElementById('btn_actualizar_usuario');
    const textoOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';

    fetch('../controllers/usuarios.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarExito('Usuario actualizado exitosamente');
                cerrarModal('modal_editar_usuario');
                cargarUsuarios();
            } else {
                mostrarError(data.error || 'Error al actualizar usuario');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarError('Error de conexión');
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = textoOriginal;
        });
}

// Cambiar estado (activar/desactivar)
function cambiarEstadoUsuario(usuarioId, nuevoEstado) {
    const accion = nuevoEstado == 1 ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro que deseas ${accion} este usuario?`)) return;

    const formData = new FormData();
    formData.append('accion', 'cambiar_estado');
    formData.append('usuario_id', usuarioId);
    formData.append('activo', nuevoEstado);

    fetch('../controllers/usuarios.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarExito(`Usuario ${accion}do exitosamente`);
                cargarUsuarios();
            } else {
                mostrarError(data.error);
            }
        })
        .catch(error => {
            mostrarError('Error de conexión');
        });
}

// Eliminar usuario
function eliminarUsuario(usuarioId) {
    if (!confirm('¿Estás seguro que deseas eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return;

    const formData = new FormData();
    formData.append('accion', 'eliminar');
    formData.append('usuario_id', usuarioId);

    fetch('../controllers/usuarios.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.exito) {
                mostrarExito('Usuario eliminado exitosamente');
                cargarUsuarios();
            } else {
                mostrarError(data.error);
            }
        })
        .catch(error => {
            mostrarError('Error de conexión');
        });
}

// Utilidades
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// Helpers para mostrar mensajes (si no existen globalmente)
if (typeof mostrarExito !== 'function') {
    window.mostrarExito = function (mensaje) {
        alert('bien ' + mensaje);
    };
}

if (typeof mostrarError !== 'function') {
    window.mostrarError = function (mensaje) {
        alert('mal ' + mensaje);
    };
}
