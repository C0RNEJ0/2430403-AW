// Usuarios por defecto (Si no hay usuarios registrados, se usa esta lista)
const USUARIOS_POR_DEFECTO = [
    { correo: "chivista@gmail.com", contrasena: "1234" }, // Usuario de prueba
];
let usuariosRegistrados = JSON.parse(localStorage.getItem("users")) || USUARIOS_POR_DEFECTO; // Lista de usuarios registrados

let tareas = JSON.parse(localStorage.getItem("tasks")) || []; // Lista de tareas
let proyectos =  JSON.parse(localStorage.getItem("proyects")) || []; // Lista de proyectos


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
const taskVencimientoInput = document.getElementById("task-vencimiento"); // Input de la fecha de vencimiento de la tarea
const taskPrioridadInput = document.getElementById("task-prioridad"); // Input de la prioridad de la tarea
const taskAsignadoInput = document.getElementById("task-asignado"); // Input de la persona asignada a la tarea

// Referencias de Proyectos 
const proyectsListContainer = document.getElementById("proyects-list-container"); // Contenedor de la lista de proyectos
const proyectForm = document.getElementById("proyect-formulario");
const projectNameInput = document.getElementById("proyect-nombre"); 
const projectDescriptionInput = document.getElementById("proyect-descripcion"); 
const proyectInicioInput = document.getElementById("proyect-inicio"); 
const proyectFinInput = document.getElementById("proyect-fin"); 
const proyectEstadoInput = document.getElementById("proyect-estado"); 


// Funciones Drag & Drop
// Permite soltar el elemento (requerido para ondragover)
window.allowDrop = function(event) {
    event.preventDefault(); // Esta línea es fundamental
}

// Maneja el evento de soltar el elemento
window.drop = function(event) {
    event.preventDefault();

    // Obtiene el ID de la tarea que se está arrastrando
    const taskId = event.dataTransfer.getData("text/plain");

    // Lógica para determinar la columna de destino
    let targetElement = event.target;
    // Si soltamos sobre un hijo (como un texto), subimos al padre list-group
    while (targetElement && !targetElement.id.startsWith('status-')) {
        targetElement = targetElement.parentElement;
    }

    // Mueve visualmente y actualiza el estado
    if (targetElement && targetElement.classList.contains('list-group')) {
        const draggedElement = document.querySelector(`[data-task-id="${taskId}"]`);
        targetElement.appendChild(draggedElement);
        // Actualiza el array de tareas
        updateTaskStatus(taskId, targetElement.id);
    }
}

// Actualiza el estado de la tarea en el array y refresca la vista
function updateTaskStatus(taskId, newStatusId) {
    // newStatusId será como 'status-Pendiente', 'status-En Proceso', 'status-Hecha'
    const estado = newStatusId.replace('status-', '');
    const tarea = tareas.find(t => t.id == taskId);
    if (tarea) {
        tarea.estado = estado;
        guardarTareas();
        displayTasks(); // Refresca la vista
    }
}

// Funciones Auxiliares Globales ---

function validarCorreo(correo) { 
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return re.test(String(correo).toLowerCase()); 
}

function guardarTareas() { 
    localStorage.setItem("tasks", JSON.stringify(tareas)); 
}

function guardarProyectos() { 
    localStorage.setItem("proyects", JSON.stringify(proyectos)); 
}

// Funciones de Manipulación de Tareas y Proyectos ---

function displayTasks() {
    // 1. Limpiar el contenido de las 3 columnas
    document.getElementById('status-Pendiente').innerHTML = '';
    document.getElementById('status-En Proceso').innerHTML = '';
    document.getElementById('status-Hecha').innerHTML = '';

    // 2. Iterar sobre todas las tareas y distribuirlas
    tareas.forEach(t => {
        // Determinar el ID del contenedor (columna) de destino
        let estadoKey = t.estado.replace(/\s/g, ''); 
        const targetId = 'status-' + estadoKey;
        const targetContainer = document.getElementById(targetId);

        if (targetContainer) {
            
            const taskHTML = `
                <div class="list-group-item d-flex justify-content-between align-items-center"
                    draggable="true" 
                    data-task-id="${t.id}"
                    ondragstart="event.dataTransfer.setData('text/plain', '${t.id}')">
                    <div>
                        <h5 class="mb-1">${t.nombre}</h5>
                        <p class="mb-1 small text-muted">Asignado a: ${t.asignado_a} | Prioridad: ${t.prioridad}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="eliminarTarea(${t.id})">Eliminar</button>
                </div>
            `;
            // Insertar la tarea en la columna correcta
            targetContainer.innerHTML += taskHTML;
        }
    });
}

function displayProyects() {
    // Si no hay proyectos, muestra el mensaje por defecto
    if (proyectos.length === 0) {
        // Usamos el ID del nuevo contenedor en index.html
        document.getElementById("proyects-list-container").innerHTML = '<p class="text-muted">No hay proyectos creados.</p>';
        return;
    }

    // Mapea el array de proyectos para crear el código HTML
    document.getElementById("proyects-list-container").innerHTML = proyectos.map(p => `
        <div class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
            <div>
                <h5 class="mb-1">${p.nombre}</h5>
                <p class="mb-1 small text-muted">${p.descripcion}</p>
                <small class="text-info">
                    Estado: ${p.estado} | Inicio: ${p.fecha_inicio} | Fin: ${p.fecha_fin || 'N/A'}
                </small>
            </div>
            <span class="badge rounded-pill bg-primary">${p.estado}</span>
        </div>
    `).join('');
}

// Función global para eliminar tarea esta la usan los botones 
window.eliminarTarea = function(id) { 
    tareas = tareas.filter(t => t.id !== id); 
    guardarTareas(); 
    displayTasks(); 
}


// Lógica del Login y Navegación Principal ---

if (formatologin) { 
    formatologin.addEventListener("submit", function(event) { 
        event.preventDefault(); 

        const usuariogmail = document.getElementById("username").value.trim(); 
        const contrasena = document.getElementById("password").value; 
 
        if (!validarCorreo(usuariogmail))  { 
             errorMessageLogin.textContent = "favor de ingresar un correo valido"; 
            return;
        }

        const usuarioEncontrado = usuariosRegistrados.find(user =>  
            user.correo === usuariogmail && user.contrasena === contrasena 
        );

        if (usuarioEncontrado) { 
            localStorage.setItem("usuarioLogueado", usuariogmail); 
            
            errorMessageLogin.textContent = "Inicio de sesión exitoso"; 
            
            cuerpoMensajeModal.textContent = `Bienvenido, ${usuariogmail}!`; 
            modalBienvenida.show(); 

        } else { 
            errorMessageLogin.textContent = "Correo o contraseña incorrectos."; 
            formatologin.reset();
        }
    });
}



botonContinuarDashboard.addEventListener("click", function() { 
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block'; 
    
    // Inicia el renderizado de tareas y proyectos
    displayTasks(); 
    displayProyects();
    
    const correo = localStorage.getItem("usuarioLogueado"); 
    document.getElementById("dashboard-message").textContent = `Sesión activa para: ${correo}`; 
});


// Lógica del Formulario de Tareas (Agregar)
if (taskForm) {
    taskForm.addEventListener("submit", function(event) { 
        event.preventDefault(); 

        const nuevaTarea = { 
            id: Date.now(), 
            nombre: taskNameInput.value.trim(), 
            descripcion: taskDescriptionInput.value.trim(), 
            estado: "Pendiente", 
            proyecto_id: null,
            prioridad: taskPrioridadInput.value,
            fecha_vencimiento: taskVencimientoInput.value,
            asignado_a: taskAsignadoInput.value.trim()
        };

        tareas.push(nuevaTarea); 
        guardarTareas(); 

        taskForm.reset(); 
        displayTasks(); 
    });
}

if (proyectForm) {
    proyectForm.addEventListener("submit", function(event) { 
        event.preventDefault(); 

        const nuevoProyecto = { 
            id: Date.now(), 
            nombre: projectNameInput.value.trim(), 
            descripcion: projectDescriptionInput.value.trim(), 
            estado: proyectEstadoInput.value,
            fecha_inicio: proyectInicioInput.value,
            fecha_fin: proyectFinInput.value,
        };

        proyectos.push(nuevoProyecto);
        guardarProyectos(); 
        
        displayProyects(); 

        proyectForm.reset();
        alert('proyecto "' + nuevoProyecto.nombre + '" fue creado');
    });
}


// Lógica de Cierre de Sesión
if (cerrarSesionBtn) { 
    cerrarSesionBtn.addEventListener("click", function() { 
        localStorage.removeItem("usuarioLogueado"); 
        
        dashboardContainer.style.display = 'none'; 
        loginContainer.style.display = 'block'; 
        
        formatologin.reset();
    });
}

// Comprobación inicial al cargar la página (mantiene la sesión si existe)
(function checkSessionAndDisplay() { 
    if (localStorage.getItem("usuarioLogueado")) { 
        loginContainer.style.display = 'none';  
        dashboardContainer.style.display = 'block'; 
        
        displayTasks(); 
        displayProyects();
        
        const correo = localStorage.getItem("usuarioLogueado"); 
        document.getElementById("dashboard-message").textContent = `Sesión activa para: ${correo}`; 
    }
})();