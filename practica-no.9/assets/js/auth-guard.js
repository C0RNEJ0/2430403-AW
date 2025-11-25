
(function () {
    'use strict';

    // Obtener datos del usuario
    const usuarioRol = localStorage.getItem('usuario_rol');
    const usuarioEmail = localStorage.getItem('usuario_email');

    // Si no hay sesión, redirigir al login
    // Excluir página de login y registro
    const path = window.location.pathname;
    if (!path.includes('login.html') && !path.includes('registro.html') && !usuarioRol) {
        window.location.href = '../views/login/login.html';
        return;
    }

    // Definir permisos por página
    const permisosPaginas = {
        'dashboard.html': ['super_admin', 'medico', 'secretaria', 'paciente'],
        'admin.html': ['super_admin'],
        'medicos.html': ['super_admin'],
        'roles.html': ['super_admin'],
        'bitacoras.html': ['super_admin'],
        'reportes.html': ['super_admin', 'medico'],
        'tarifas.html': ['super_admin', 'medico'],
        'expedientes.html': ['super_admin', 'medico'],
        'pacientes.html': ['super_admin', 'medico', 'secretaria'],
        'agenda.html': ['super_admin', 'medico', 'secretaria'],
        'pagos.html': ['super_admin', 'medico', 'secretaria'],
        'especialidades.html': ['super_admin']
    };

    // Obtener nombre de la página actual
    const paginaActual = path.split('/').pop();

    // Verificar permisos
    if (permisosPaginas[paginaActual]) {
        const rolesPermitidos = permisosPaginas[paginaActual];

        if (!rolesPermitidos.includes(usuarioRol)) {
            // Acceso denegado
            document.body.innerHTML = ''; // Limpiar contenido

            // Mostrar mensaje de error
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'display:flex;justify-content:center;align-items:center;height:100vh;background:#f8f9fa;flex-direction:column;font-family:sans-serif;';
            errorDiv.innerHTML = `
                <div style="text-align:center;padding:40px;background:white;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
                    <h1 style="color:#dc3545;margin-bottom:20px;">Acceso Denegado</h1>
                    <p style="color:#6c757d;margin-bottom:30px;">No tienes permisos para acceder a esta página.</p>
                    <a href="dashboard.html" style="padding:10px 20px;background:#0d6efd;color:white;text-decoration:none;border-radius:5px;">Volver al Dashboard</a>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    }

})();
