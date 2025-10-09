
// Usuarios por defecto (Si no hay usuarios registrados, se usa esta lista)
const USUARIOS_POR_DEFECTO = [
    { correo: "chivista@gmail.com", contrasena: "1234" }, // Usuario de prueba
];
let usuariosRegistrados = JSON.parse(localStorage.getItem("users")) || USUARIOS_POR_DEFECTO; // Lista de usuarios registrados

let tareas = JSON.parse(localStorage.getItem("tasks")) || []; // Lista de tareas



//  Referencias a Elementos del DOM ---s

const formatologin = document.getElementById("formatologin"); // Formulario de Login
const errorMessageLogin = document.getElementById("error-message"); // Mensaje de error en Login

// Contenedores de vista
const loginContainer = document.getElementById("login-container-box"); // Contenedor del Login
const dashboardContainer = document.getElementById("dashboard-container"); // Contenedor del Dashboard de Tareas

// Referencias del Modal
const cuerpoMensajeModal = document.getElementById("cuerpoMensajeModal"); // Cuerpo del mensaje del Modal
const botonContinuarDashboard = document.getElementById("botonContinuarDashboard"); // Botón para continuar al Dashboard
const modalBienvenida = new bootstrap.Modal(document.getElementById('modalBienvenida')); // Instancia del Modal

// Referencias del Dashboard de Tareas
const cerrarSesionBtn = document.getElementById("cerrar-sesion"); // Botón de Cerrar Sesión
const taskForm = document.getElementById("task-form"); // Formulario de nueva tarea
const taskNameInput = document.getElementById("task-name"); // Input del nombre de la tarea
const taskDescriptionInput = document.getElementById("task-description"); // Input de la descripción de la tarea
const tasksListContainer = document.getElementById("tasks-list"); // Contenedor de la lista de tareas


// Funciones Auxiliares Globales ---

function validarCorreo(correo) { // Validación básica de formato de correo
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular simple para validar correo puedes iniciar con culaquier tipo de correo ejemplo@qwe.com y funciona
    return re.test(String(correo).toLowerCase()); // Retorna true si el correo es válido 
}

function guardarTareas() { // Guarda las tareas en localStorage
    localStorage.setItem("tasks", JSON.stringify(tareas)); // Convierte el array de tareas a JSON y lo guarda
}


// Funciones de Manipulación de Tareas (CRUD) ---

function displayTasks() {
    tasksListContainer.innerHTML = tareas.map(t => ` 
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div><h5 class="mb-1">${t.nombre}</h5><p class="mb-1 small text-muted">${t.descripcion}</p></div>
            <button class="btn btn-sm btn-outline-danger" onclick="eliminarTarea(${t.id})">Eliminar</button>
        </div>
    `).join(''); // Une los elementos en una sola cadena
}


// Función global para eliminar tarea (usada por los botones)
window.eliminarTarea = function(id) { // Necesita ser global para ser llamada desde el HTML
    tareas = tareas.filter(t => t.id !== id); // Filtra la tarea a eliminar
    guardarTareas(); // Guarda los cambios
    displayTasks(); // Actualiza la visualización de tareas
}


// Lógica del Login y Navegación Principal ---

if (formatologin) { // Verifica que el formulario de login exista
    formatologin.addEventListener("submit", function(event) { // Maneja el evento de envío del formulario
        event.preventDefault(); // Previene el envío por defecto del formulario

        const usuariogmail = document.getElementById("username").value.trim(); // Obtiene y limpia el valor del correo
        const contrasena = document.getElementById("password").value; // Obtiene el valor de la contraseña
 
        if (!validarCorreo(usuariogmail))  { // Valida el formato del correo
             errorMessageLogin.textContent = "favor de ingresar un correo valido"; // Mensaje de error si no es un correo valido
            return;
        }

        const usuarioEncontrado = usuariosRegistrados.find(user =>  // Busca el usuario en la lista
            user.correo === usuariogmail && user.contrasena === contrasena // Verifica correo y contraseña
        );

        if (usuarioEncontrado) { 
            // Inicia sesión y muestra el modal
            localStorage.setItem("usuarioLogueado", usuariogmail); // Guarda el usuario logueado en localStorage
            
            errorMessageLogin.textContent = "Inicio de sesión exitoso"; // Mensaje de éxito
            
            cuerpoMensajeModal.textContent = `Bienvenido, ${usuariogmail}!`; // Mensaje de bienvenido al usuario
            modalBienvenida.show(); 

        } else { // Si no se encuentra el usuario
            // ERROR
            errorMessageLogin.textContent = "Correo o contraseña incorrectos."; //esta mal
            formatologin.reset();
        }
    });
}



botonContinuarDashboard.addEventListener("click", function() { // Muestra el dashboard
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block'; // Muestra el contenedor del dashboard
    
    // Inicia el renderizado de tareas
    displayTasks(); 
    
    const correo = localStorage.getItem("usuarioLogueado"); // Obtiene el correo del usuario logueado
    document.getElementById("dashboard-message").textContent = `Sesión activa para: ${correo}`; // Muestra el correo en el dashboard
});


// Lógica del Formulario de Tareas (Agregar)
if (taskForm) {
    taskForm.addEventListener("submit", function(event) { // Maneja el evento de envío del formulario de tarea
        event.preventDefault(); // Previene el envío por defecto del formulario

        const nuevaTarea = { // Crea un nuevo objeto de tarea
            id: Date.now(), // Usa timestamp como ID único
            nombre: taskNameInput.value.trim(), // Nombre de la tarea
            descripcion: taskDescriptionInput.value.trim(), // Descripción de la tarea
            estado: "Pendiente" // Estado inicial de la tarea
        };

        tareas.push(nuevaTarea); // Agrega la nueva tarea al array
        guardarTareas(); // Guarda las tareas actualizadas

        taskForm.reset(); // Resetea el formulario
        displayTasks(); // Actualiza la visualización de tareas
    });
}


// Lógica de Cierre de Sesión
if (cerrarSesionBtn) { // Verifica que el botón de cerrar sesión exista
    cerrarSesionBtn.addEventListener("click", function() { 
        localStorage.removeItem("usuarioLogueado"); // Elimina el usuario logueado del localStorage
        
        dashboardContainer.style.display = 'none'; // Oculta el contenedor del dashboard
        loginContainer.style.display = 'block'; // Muestra el contenedor del login
        
        formatologin.reset();
    });
}

// Comprobación inicial al cargar la página (mantiene la sesión si existe)
(function checkSessionAndDisplay() { 
    if (localStorage.getItem("usuarioLogueado")) { // Verifica si hay un usuario logueado
        loginContainer.style.display = 'none';  // Oculta el contenedor del login
        dashboardContainer.style.display = 'block'; // Muestra el contenedor del dashboard
        
        displayTasks(); 
        
        const correo = localStorage.getItem("usuarioLogueado"); // Obtiene el correo del usuario logueado
        document.getElementById("dashboard-message").textContent = `Sesión activa para: ${correo}`; // Muestra el correo en el dashboard
    }
})();