

(function () {
    'use strict';

    /**
     * Carga el sidebar desde el archivo partial
     */
    function loadSidebar() {
        // Determinar la ruta correcta al sidebar
        const sidebarPath = getSidebarPath();

        fetch(sidebarPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error('No se pudo cargar el sidebar');
                }
                return response.text();
            })
            .then(html => {
                // Crear un contenedor temporal
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                // Insertar el sidebar al inicio del body
                document.body.insertBefore(tempDiv.firstElementChild, document.body.firstChild);

                // Insertar el overlay
                const overlay = tempDiv.querySelector('.sidebar-overlay');
                if (overlay) {
                    document.body.insertBefore(overlay, document.body.children[1]);
                }

                // Insertar el botón hamburguesa
                const hamburger = tempDiv.querySelector('.btn-hamburger');
                if (hamburger) {
                    document.body.insertBefore(hamburger, document.body.children[2]);
                }

                // Cargar el script del sidebar si no está cargado
                loadSidebarScript();
            })
            .catch(error => {
                console.error('Error cargando sidebar:', error);
            });
    }

    /**
     * Determina la ruta correcta al sidebar basándose en la ubicación actual
     */
    function getSidebarPath() {
        const currentPath = window.location.pathname;

        // Si estamos en /views/, usar ruta relativa
        if (currentPath.includes('/views/')) {
            return 'partials/sidebar.html';
        }
        // Si estamos en /controllers/, subir un nivel
        else if (currentPath.includes('/controllers/')) {
            return '../views/partials/sidebar.html';
        }
        // Por defecto, asumir que estamos en la raíz
        else {
            return 'views/partials/sidebar.html';
        }
    }

    /**
     * Carga el script del sidebar si no está ya cargado
     */
    function loadSidebarScript() {
        // Verificar si el script ya está cargado
        const existingScript = document.querySelector('script[src*="sidebar.js"]');
        if (existingScript) {
            return;
        }

        // Crear y cargar el script
        const script = document.createElement('script');
        script.src = getSidebarScriptPath('sidebar.js');
        script.async = false; // Cargar de forma síncrona para asegurar inicialización
        document.body.appendChild(script);
    }

    /**
     * Determina la ruta correcta al script del sidebar
     */
    function getSidebarScriptPath() {
        const currentPath = window.location.pathname;

        if (currentPath.includes('/views/')) {
            return '../assets/js/sidebar.js';
        } else if (currentPath.includes('/controllers/')) {
            return '../assets/js/sidebar.js';
        } else {
            return 'assets/js/sidebar.js';
        }
    }

    /**
     * Carga el CSS del sidebar si no está ya cargado
     */
    function loadSidebarCSS() {
        // Verificar si el CSS ya está cargado
        const existingLink = document.querySelector('link[href*="sidebar-modern.css"]');
        if (existingLink) {
            return;
        }

        // Crear y cargar el CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = getSidebarCSSPath();
        document.head.appendChild(link);
    }

    /**
     * Determina la ruta correcta al CSS del sidebar
     */
    function getSidebarCSSPath() {
        const currentPath = window.location.pathname;

        if (currentPath.includes('/views/')) {
            return '../assets/css/sidebar-modern.css';
        } else if (currentPath.includes('/controllers/')) {
            return '../assets/css/sidebar-modern.css';
        } else {
            return 'assets/css/sidebar-modern.css';
        }
    }

    /**
     * Inicialización
     */
    function init() {
        // Cargar CSS primero
        loadSidebarCSS();

        // Cargar sidebar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadSidebar);
        } else {
            loadSidebar();
        }
    }

    // Ejecutar inicialización
    init();

})();
