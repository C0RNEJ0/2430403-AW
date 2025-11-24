
(function () {
    'use strict';

    // Estado global
    let usuarios = [];
    let usuarioActual = null;

    // Elementos del DOM
    const tablaUsuarios = document.getElementById('tabla_usuarios').querySelector('tbody');
    const modalUsuario = new bootstrap.Modal(document.getElementById('modal_usuario'));
    const formUsuario = document.getElementById('form_usuario');
    const selectRol = document.getElementById('rol');
    const divMedico = document.getElementById('div_medico');
    const divPaciente = document.getElementById('div_paciente');
    const selectMedico = document.getElementById('medico_id');
    const selectPaciente = document.getElementById('paciente_id');

    // Inicialización
    document.addEventListener('DOMContentLoaded', () => {
        cargarUsuarios();
        cargarCatalogos();
        actualizarStats();
    });

    // Exponer funciones globales
    window.abrirModalUsuario = abrirModalUsuario;
    window.editarUsuario = editarUsuario;
    window.eliminarUsuario = eliminarUsuario;
    window.cambiarEstado = cambiarEstado;
    window.togglePassword = togglePassword;
    window.toggleCamposRol = toggleCamposRol;

    /**
     * Cargar lista de usuarios
     */
    async function cargarUsuarios() {
        try {
            const respuesta = await fetch('../controllers/usuarios.php?accion=listar', {
                method: 'POST' // El controlador espera POST para algunas acciones, aunque listar suele ser GET
            });

            const datos = await respuesta.json();

            if (datos.exito) {
                usuarios = datos.usuarios;
                renderizarTabla();
                actualizarStats();
            } else {
                console.error('Error al cargar usuarios:', datos.error);
                mostrarNotificacion('Error al cargar usuarios', 'error');
            }
        } catch (error) {
            console.error('Error de red:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    }

    /**
     * Renderizar tabla de usuarios
     */
    function renderizarTabla() {
        tablaUsuarios.innerHTML = '';

        usuarios.forEach(usuario => {
            const tr = document.createElement('tr');

            // Estado (badge)
            const estadoBadge = usuario.activo == 1
                ? '<span class="badge bg-success">Activo</span>'
                : '<span class="badge bg-secondary">Inactivo</span>';

            // Botón de estado
            const btnEstado = usuario.activo == 1
                ? `<button class="btn btn-sm btn-outline-warning" onclick="cambiarEstado(${usuario.usuario_id}, 0)" title="Desactivar"><i class="bi bi-pause-circle"></i></button>`
                : `<button class="btn btn-sm btn-outline-success" onclick="cambiarEstado(${usuario.usuario_id}, 1)" title="Activar"><i class="bi bi-play-circle"></i></button>`;

            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle bg-primary bg-opacity-10 text-primary me-3 d-flex align-items-center justify-content-center rounded-circle" style="width: 35px; height: 35px;">
                            <span class="fw-bold">${usuario.nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <div class="fw-bold">${usuario.nombre}</div>
                            <div class="small text-muted">${usuario.email}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge bg-light text-dark border">${usuario.rol}</span></td>
                <td>${estadoBadge}</td>
                <td><small class="text-muted">${new Date(usuario.creado_en).toLocaleDateString()}</small></td>
                <td><small class="text-muted">${usuario.ultimo_acceso ? new Date(usuario.ultimo_acceso).toLocaleString() : 'Nunca'}</small></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarUsuario(${usuario.usuario_id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${btnEstado}
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${usuario.usuario_id})" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tablaUsuarios.appendChild(tr);
        });
    }

    /**
     * Cargar catálogos (médicos y pacientes) para los selects
     */
    async function cargarCatalogos() {
        try {
            // Cargar Médicos
            const respMedicos = await fetch('../controllers/medicos_list.php');
            const datosMedicos = await respMedicos.json();
            if (datosMedicos.exito) {
                datosMedicos.datos.forEach(medico => {
                    const option = new Option(medico.nombre, medico.medico_id);
                    selectMedico.add(option);
                });
            }

            // Cargar Pacientes (usando el endpoint existente)
            const respPacientes = await fetch('../controllers/pacientes.php?api=listar');
            const datosPacientes = await respPacientes.json();
            if (datosPacientes.exito) {
                datosPacientes.datos.forEach(paciente => {
                    const nombre = `${paciente.nombres} ${paciente.apellidos}`;
                    const option = new Option(nombre, paciente.paciente_id);
                    selectPaciente.add(option);
                });
            }
        } catch (error) {
            console.error('Error cargando catálogos:', error);
        }
    }

    /**
     * Abrir modal para nuevo usuario
     */
    function abrirModalUsuario() {
        usuarioActual = null;
        formUsuario.reset();
        document.getElementById('usuario_id').value = '';
        document.getElementById('modal_usuario_titulo').textContent = 'Nuevo Usuario';
        document.getElementById('password').required = true;
        document.getElementById('password_help').textContent = 'Requerida para nuevos usuarios';
        toggleCamposRol();
        modalUsuario.show();
    }

    /**
     * Abrir modal para editar usuario
     */
    function editarUsuario(id) {
        const usuario = usuarios.find(u => u.usuario_id == id);
        if (!usuario) return;

        usuarioActual = usuario;
        document.getElementById('usuario_id').value = usuario.usuario_id;
        document.getElementById('nombre').value = usuario.nombre;
        document.getElementById('email').value = usuario.email;
        document.getElementById('password').value = ''; // No mostrar password
        document.getElementById('password').required = false;
        document.getElementById('password_help').textContent = 'Dejar en blanco para mantener la actual';

        // Seleccionar rol (mapeo simple, ajustar si los nombres difieren)
        // El backend devuelve el nombre del rol, necesitamos el value del select
        const rolValue = mapRolToValue(usuario.rol);
        selectRol.value = rolValue;

        toggleCamposRol();

        // Asignar médico o paciente si aplica
        if (usuario.medico_id) selectMedico.value = usuario.medico_id;
        if (usuario.paciente_id) selectPaciente.value = usuario.paciente_id;

        document.getElementById('modal_usuario_titulo').textContent = 'Editar Usuario';
        modalUsuario.show();
    }

    /**
     * Guardar usuario (Submit)
     */
    formUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(formUsuario);
        const accion = usuarioActual ? 'editar' : 'crear';
        formData.append('accion', accion);

        try {
            const respuesta = await fetch('../controllers/usuarios.php', {
                method: 'POST',
                body: formData
            });

            const datos = await respuesta.json();

            if (datos.exito) {
                modalUsuario.hide();
                cargarUsuarios();
                mostrarNotificacion(datos.mensaje, 'success');
            } else {
                mostrarNotificacion(datos.error || 'Error al guardar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    });

    /**
     * Eliminar usuario
     */
    async function eliminarUsuario(id) {
        if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;

        const formData = new FormData();
        formData.append('accion', 'eliminar');
        formData.append('usuario_id', id);

        try {
            const respuesta = await fetch('../controllers/usuarios.php', {
                method: 'POST',
                body: formData
            });

            const datos = await respuesta.json();

            if (datos.exito) {
                cargarUsuarios();
                mostrarNotificacion(datos.mensaje, 'success');
            } else {
                mostrarNotificacion(datos.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Cambiar estado Activaro Desactivar
     */
    async function cambiarEstado(id, nuevoEstado) {
        const formData = new FormData();
        formData.append('accion', 'cambiar_estado');
        formData.append('usuario_id', id);
        formData.append('activo', nuevoEstado);

        try {
            const respuesta = await fetch('../controllers/usuarios.php', {
                method: 'POST',
                body: formData
            });

            const datos = await respuesta.json();

            if (datos.exito) {
                cargarUsuarios();
                mostrarNotificacion(datos.mensaje, 'success');
            } else {
                mostrarNotificacion(datos.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    /**
     * Utilidades de UI
     */
    function togglePassword() {
        const input = document.getElementById('password');
        const icon = document.querySelector('#div_password i.bi-eye, #div_password i.bi-eye-slash');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('bi-eye', 'bi-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('bi-eye-slash', 'bi-eye');
        }
    }

    function toggleCamposRol() {
        const rol = selectRol.value;
        divMedico.classList.add('d-none');
        divPaciente.classList.add('d-none');

        if (rol === 'doctor') {
            divMedico.classList.remove('d-none');
        } else if (rol === 'paciente') {
            divPaciente.classList.remove('d-none');
        }
    }

    function mapRolToValue(rolNombre) {
        // Ajustar según los nombres exactos en BD vs values en HTML
        const map = {
            'Super Admin': 'super_admin',
            'Doctor': 'doctor',
            'Secretaria': 'secretaria',
            'Paciente': 'paciente'
        };
        return map[rolNombre] || rolNombre.toLowerCase();
    }

    function actualizarStats() {
        document.getElementById('total_usuarios').textContent = usuarios.length;
        document.getElementById('total_activos').textContent = usuarios.filter(u => u.activo == 1).length;
        // Roles es estático por ahora, o se puede calcular dinámicamente
    }

    function mostrarNotificacion(mensaje, tipo) {
        // Implementación simple de alerta, idealmente usar un toast
        alert(mensaje);
    }

})();
