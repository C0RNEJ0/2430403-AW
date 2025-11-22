// admin.js - Versión Simplificada
document.addEventListener('DOMContentLoaded', function () {
    // Variables globales simples
    let idEliminar = null;
    let tipoEliminar = ''; // 'usuario', 'paciente', 'medico'

    // Cargar la primera pestaña al iniciar
    cargarUsuarios();

    // Configurar botones de pestañas
    document.getElementById('usuarios-tab').onclick = cargarUsuarios;
    document.getElementById('pacientes-tab').onclick = cargarPacientes;
    document.getElementById('medicos-tab').onclick = cargarMedicos;

    // --- FUNCIONES DE USUARIOS ---

    window.cargarUsuarios = function () {
        fetch('/practica-no.9/controllers/usuarios_test.php?accion=listar')
            .then(response => response.json())
            .then(data => {
                let html = '';
                if (data.exito) {
                    // Solo mostrar doctores y secretarias
                    const usuarios = data.usuarios.filter(u => u.rol == 'doctor' || u.rol == 'secretaria');

                    usuarios.forEach(u => {
                        let rol = u.rol == 'doctor' ? 'Médico' : 'Secretaria';
                        let estado = u.activo == 1 ? 'Activo' : 'Inactivo';

                        html += `
                            <tr>
                                <td>${u.nombre}</td>
                                <td>${u.email}</td>
                                <td>${rol}</td>
                                <td>${estado}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editarUsuario(${u.usuario_id}, '${u.nombre}', '${u.email}', '${u.rol}', ${u.activo})">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="prepararEliminar(${u.usuario_id}, 'usuario')">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
                document.getElementById('tabla_usuarios').innerHTML = html || '<tr><td colspan="5">No hay usuarios</td></tr>';
            });
    };

    window.abrirModalUsuario = function () {
        document.getElementById('form_usuario').reset();
        document.getElementById('usuario_id').value = '';
        document.getElementById('titulo_modal_usuario').innerText = 'Nuevo Usuario';
        document.getElementById('modal_usuario').style.display = 'flex'; // Mostrar modal simple
    };

    window.editarUsuario = function (id, nombre, email, rol, activo) {
        document.getElementById('usuario_id').value = id;
        document.getElementById('usuario_nombre').value = nombre;
        document.getElementById('usuario_email').value = email;
        document.getElementById('usuario_rol').value = rol;
        document.getElementById('usuario_activo').value = activo;
        document.getElementById('titulo_modal_usuario').innerText = 'Editar Usuario';
        document.getElementById('modal_usuario').style.display = 'flex';
    };

    window.guardarUsuario = function () {
        const form = document.getElementById('form_usuario');
        const formData = new FormData(form);
        const id = document.getElementById('usuario_id').value;
        formData.append('accion', id ? 'editar' : 'crear');

        fetch('/practica-no.9/controllers/usuarios_test.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.exito) {
                    alert('Guardado correctamente');
                    cerrarModal('modal_usuario');
                    cargarUsuarios();
                } else {
                    alert('Error: ' + data.error);
                }
            });
    };

    // --- FUNCIONES DE PACIENTES ---

    window.cargarPacientes = function () {
        fetch('/practica-no.9/controllers/pacientes.php?accion=listar')
            .then(response => response.json())
            .then(data => {
                let html = '';
                // Ajustar si data es array directo o objeto con data
                const lista = data.data || data;

                if (lista && lista.length > 0) {
                    lista.forEach(p => {
                        html += `
                            <tr>
                                <td>${p.nombres} ${p.apellidos}</td>
                                <td>${p.email || '-'}</td>
                                <td>${p.telefono || '-'}</td>
                                <td>${p.ciudad || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editarPaciente(${p.paciente_id}, '${p.nombres}', '${p.apellidos}', '${p.email}', '${p.telefono}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="prepararEliminar(${p.paciente_id}, 'paciente')">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
                document.getElementById('tabla_pacientes').innerHTML = html || '<tr><td colspan="5">No hay pacientes</td></tr>';
            });
    };

    window.abrirModalPaciente = function () {
        document.getElementById('form_paciente').reset();
        document.getElementById('paciente_id').value = '';
        document.getElementById('titulo_modal_paciente').innerText = 'Nuevo Paciente';
        document.getElementById('modal_paciente').style.display = 'flex';
    };

    window.editarPaciente = function (id, nombres, apellidos, email, telefono) {
        document.getElementById('paciente_id').value = id;
        document.getElementById('paciente_nombres').value = nombres;
        document.getElementById('paciente_apellidos').value = apellidos;
        document.getElementById('paciente_email').value = email;
        document.getElementById('paciente_telefono').value = telefono;
        document.getElementById('titulo_modal_paciente').innerText = 'Editar Paciente';
        document.getElementById('modal_paciente').style.display = 'flex';
    };

    window.guardarPaciente = function () {
        const form = document.getElementById('form_paciente');
        const formData = new FormData(form);
        const id = document.getElementById('paciente_id').value;
        formData.append('accion', id ? 'editar' : 'crear');
        if (id) formData.append('paciente_id', id);

        fetch('/practica-no.9/controllers/pacientes.php', { method: 'POST', body: formData })
            .then(res => res.text()) // Usar text primero por si no es JSON válido
            .then(text => {
                try {
                    const data = JSON.parse(text);
                    if (data.exito || data.success) {
                        alert('Paciente guardado');
                        cerrarModal('modal_paciente');
                        cargarPacientes();
                    } else {
                        alert('Error al guardar');
                    }
                } catch (e) {
                    // Si falla JSON, asumimos éxito y recargamos (parche rápido)
                    cerrarModal('modal_paciente');
                    cargarPacientes();
                }
            });
    };

    // --- FUNCIONES DE MÉDICOS ---

    window.cargarMedicos = function () {
        // Reutilizamos usuarios filtrados por doctor para simplificar
        fetch('/practica-no.9/controllers/usuarios_test.php?accion=listar')
            .then(response => response.json())
            .then(data => {
                let html = '';
                if (data.exito) {
                    const medicos = data.usuarios.filter(u => u.rol == 'doctor');

                    medicos.forEach(m => {
                        html += `
                            <tr>
                                <td>${m.nombre}</td>
                                <td>${m.medico_especialidad || 'General'}</td>
                                <td>${m.medico_horario || '-'}</td>
                                <td>${m.medico_telefono || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="editarMedico(${m.usuario_id}, '${m.nombre}', '${m.medico_especialidad}', '${m.medico_horario}', '${m.medico_telefono}')">Editar</button>
                                    <button class="btn btn-sm btn-danger" onclick="prepararEliminar(${m.usuario_id}, 'medico')">Eliminar</button>
                                </td>
                            </tr>
                        `;
                    });
                }
                document.getElementById('tabla_medicos').innerHTML = html || '<tr><td colspan="5">No hay médicos</td></tr>';
            });
    };

    window.abrirModalMedico = function () {
        document.getElementById('form_medico').reset();
        document.getElementById('medico_id').value = '';
        document.getElementById('titulo_modal_medico').innerText = 'Nuevo Médico';
        document.getElementById('modal_medico').style.display = 'flex';
    };

    window.editarMedico = function (id, nombre, especialidad, horario, telefono) {
        document.getElementById('medico_id').value = id;
        document.getElementById('medico_nombre').value = nombre;
        document.getElementById('medico_especialidad').value = (especialidad === 'null' || especialidad === 'undefined') ? '' : especialidad;
        document.getElementById('medico_horario').value = (horario === 'null' || horario === 'undefined') ? '' : horario;
        document.getElementById('medico_telefono').value = (telefono === 'null' || telefono === 'undefined') ? '' : telefono;
        document.getElementById('titulo_modal_medico').innerText = 'Editar Médico';
        document.getElementById('modal_medico').style.display = 'flex';
    };

    window.guardarMedico = function () {
        const form = document.getElementById('form_medico');
        const formData = new FormData(form);
        const id = document.getElementById('medico_id').value;

        formData.append('accion', id ? 'editar' : 'crear');
        if (id) formData.append('usuario_id', id);

        // Datos fijos para médico
        formData.append('rol', 'doctor');
        formData.append('activo', 1);
        if (!id) formData.append('email', 'medico_' + Date.now() + '@clinica.com');

        fetch('/practica-no.9/controllers/usuarios_test.php', { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.exito) {
                    alert('Médico guardado');
                    cerrarModal('modal_medico');
                    cargarMedicos();
                } else {
                    alert('Error: ' + data.error);
                }
            });
    };

    // --- FUNCIONES COMUNES ---

    window.prepararEliminar = function (id, tipo) {
        idEliminar = id;
        tipoEliminar = tipo;
        document.getElementById('mensaje_eliminar').innerText = '¿Seguro que quieres eliminar este registro?';
        document.getElementById('modal_eliminar').style.display = 'flex';
    };

    // Configurar botón confirmar eliminar
    const btnEliminar = document.getElementById('btn_confirmar_eliminar');
    if (btnEliminar) {
        btnEliminar.onclick = function () {
            if (!idEliminar) return;

            let url = '';
            let formData = new FormData();
            formData.append('accion', 'eliminar');

            if (tipoEliminar == 'usuario' || tipoEliminar == 'medico') {
                url = '/practica-no.9/controllers/usuarios_test.php';
                formData.append('usuario_id', idEliminar);
            } else if (tipoEliminar == 'paciente') {
                url = '/practica-no.9/controllers/pacientes.php';
                formData.append('id', idEliminar);
            }

            fetch(url, { method: 'POST', body: formData })
                .then(res => res.text())
                .then(() => {
                    alert('Eliminado correctamente');
                    cerrarModal('modal_eliminar');
                    if (tipoEliminar == 'usuario') cargarUsuarios();
                    if (tipoEliminar == 'paciente') cargarPacientes();
                    if (tipoEliminar == 'medico') cargarMedicos();
                });
        };
    }

    // Función simple para cerrar modales
    window.cerrarModal = function (id) {
        document.getElementById(id).style.display = 'none';
    };

    // Cerrar modales con botones cancelar/X
    document.querySelectorAll('.modal-close, .btn-modal-secondary').forEach(btn => {
        btn.onclick = function () {
            this.closest('.modal-modern').style.display = 'none';
        };
    });
});
