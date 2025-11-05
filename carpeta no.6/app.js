// Usuarios por defecto (Si no hay usuarios registrados, se usa esta lista)
const USUARIOS_POR_DEFECTO = [
    { correo: "usuario@ejemplo.com", contrasena: "1234" }, // Usuario de prueba
    { correo: "rebanosagrado", contrasena: "123" }, // Usuario ADMIN 
];
let usuariosRegistrados = JSON.parse(localStorage.getItem("users")) || USUARIOS_POR_DEFECTO; // Lista de usuarios registrados


let tareas = JSON.parse(localStorage.getItem("tasks")) || []; // Lista de tareas
let proyectos =  JSON.parse(localStorage.getItem("proyects")) || []; // Lista de proyectos

let notas = JSON.parse(localStorage.getItem("notes")) || []; // Inicialización de notas

// Referencias a Elementos del DOM ---s


const formatologin = document.getElementById("formatologin"); // Formulario de Login
const errorMessageLogin = document.getElementById("error-message"); // Mensaje de error en Login

// Contenedores de vista
const loginContainer = document.getElementById("login-container-box"); // Contenedor del Login
const dashboardContainer = document.getElementById("dashboard-container"); // Contenedor del Dashboard de Tareas


// Referencias del Modal

const cuerpoMensajeModal = document.getElementById("cuerpoMensajeModal"); // Cuerpo del mensaje del Modal
const botonContinuarDashboard = document.getElementById("botonContinuarDashboard"); 

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


// Referencias de Notas 
const noteForm = document.getElementById("note-form");
const noteTitleInput = document.getElementById("note-title"); 
const noteContentInput = document.getElementById("note-content"); 
const noteIdEditInput = document.getElementById("note-id-edit"); 

const noteSubmitButton = document.getElementById("note-submit-button");
const notesListContainer = document.getElementById("notes-list-container"); 
const noteTimeInput = document.getElementById("note-time"); 

const noteDateInput = document.getElementById("note-date"); 



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
    // Expresión regular estándar para validar correos
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return re.test(String(correo).toLowerCase()); 
}

function obtenerUsuarioLogueado() { // Obtiene el usuario logueado
    return localStorage.getItem("usuarioLogueado") || "Desconocido";
}

function guardarTareas() { 
    localStorage.setItem("tasks", JSON.stringify(tareas)); 
}

function guardarProyectos() { 
    localStorage.setItem("proyects", JSON.stringify(proyectos)); 
}


    localStorage.setItem("notes", JSON.stringify(notas)); 
// Funciones de Manipulación de Tareas y Proyectos ---

function displayTasks() {
    //  Limpiar el contenido de las 3 columnas
    document.getElementById('status-Pendiente').innerHTML = '';
    document.getElementById('status-En Proceso').innerHTML = '';
    document.getElementById('status-Hecha').innerHTML = '';

    //  Iterar sobre todas las tareas y distribuirlas
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

function displayNotes() { // Función que renderiza todas las notas (con campos de creador y fecha)

    if (notas.length === 0) {
        notesListContainer.innerHTML = '<p class="text-muted">No tienes notas creadas.</p>';
        return;
    }

    notesListContainer.innerHTML = notas.map(n => `

        <div class="col-md-4">
            <div class="card shadow-sm h-100">
                <div class="card-body">
                    <h5 class="card-title">${n.titulo}</h5>
                    <p class="card-text small">${n.contenido}</p>
                </div>
                <div class="card-footer d-flex justify-content-between flex-column small text-muted">
                    <div class="mb-1">Creada por: <b>${n.creada_por || 'N/A'}</b></div>
                    <div class="mb-2">Fecha: ${n.fecha_creacion || 'N/A'}</div>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarNota(${n.id})">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarNota(${n.id})">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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

window.eliminarNota = function(id) { // Función para eliminar una nota
    if (confirm("¿Estás seguro de que quieres eliminar esta nota?")) {

        notas = notas.filter(n => n.id !== id); 
        guardarNotas(); 
        displayNotes(); 
    }
}

window.editarNota = function(id) { // Función para cargar la nota en el formulario y editarla
    const nota = notas.find(n => n.id == id);
    if (nota) {
        // Cargar datos
        noteTitleInput.value = nota.titulo;
        noteContentInput.value = nota.contenido;
        
        // Cargar fecha y hora
        if (nota.fecha_creacion) {
            const partes = nota.fecha_creacion.split(' ');
            if (partes.length >= 2) {
                noteDateInput.value = partes[0]; // Cargar la fecha

                noteTimeInput.value = partes[1]; // Cargar la hora
            } else {
                 noteDateInput.value = nota.fecha_creacion; // Si no tiene espacio, es solo la fecha
                 noteTimeInput.value = '';
            }
        }
        
        // Establecer modo edición
        noteIdEditInput.value = id;
        noteSubmitButton.textContent = "Actualizar Nota";
        // Mover la vista al formulario
        noteForm.scrollIntoView({ behavior: 'smooth' });
    }
}


// Lógica del Login y Navegación Principal ---

if (formatologin) { 
    formatologin.addEventListener("submit", function(event) { 
        event.preventDefault(); 

        const usuariogmail = document.getElementById("username").value.trim().toLowerCase(); // CONVERTIR A MINÚSCULAS AQUÍ
        const contrasena = document.getElementById("password").value; 
 
        // Solo validar formato de correo si el input contiene '@'
        if (usuariogmail.includes('@') && !validarCorreo(usuariogmail))  { 

             errorMessageLogin.textContent = "Favor de ingresar un correo válido (o el nombre de usuario Admin)."; 
            return;
        }

        const usuarioEncontrado = usuariosRegistrados.find(user =>  
            user.correo.toLowerCase() === usuariogmail && user.contrasena === contrasena // COMPARAR CONTRA MINÚSCULAS
        );

        if (usuarioEncontrado) { 
            localStorage.setItem("usuarioLogueado", usuarioEncontrado.correo); // Guardar el correo original o el username
            
            errorMessageLogin.textContent = "Inicio de sesión exitoso"; 
            
            cuerpoMensajeModal.textContent = `Bienvenido, ${usuarioEncontrado.correo}!`; 
            modalBienvenida.show(); 

        } else { 
            errorMessageLogin.textContent = "Usuario o contraseña incorrectos."; 
            formatologin.reset();
        }
    });
}



botonContinuarDashboard.addEventListener("click", function() { 
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'block'; 
    
    // Inicia el renderizado de tareas, proyectos y notas
    displayTasks(); 
    displayProyects();
    displayNotes(); // Se cargan las notas
    
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


if (noteForm) { // Lógica principal de creación y edición de notas
    noteForm.addEventListener("submit", function(event) { 
        event.preventDefault(); 

        const titulo = noteTitleInput.value.trim();
        const contenido = noteContentInput.value.trim();
        const hora = noteTimeInput.value.trim(); // Se obtiene la hora manualmente

        const fecha = noteDateInput.value.trim(); // Se obtiene la fecha manualmente
        const idAEditar = noteIdEditInput.value;
        const usuarioActual = obtenerUsuarioLogueado(); // Se obtiene el usuario para el registro
        
        // Combina fecha y hora para el registro
        const fechaCreacionManual = `${fecha} ${hora}`; 

        if (idAEditar) {
            // Lógica de EDICIÓN
            const notaAEditar = notas.find(n => n.id == idAEditar);
            if (notaAEditar) {
                notaAEditar.titulo = titulo;
                notaAEditar.contenido = contenido;

                notaAEditar.fecha_creacion = fechaCreacionManual; 
                
                
                noteIdEditInput.value = "";
                noteSubmitButton.textContent = "Guardar Nota";
                alert('Nota actualizada con éxito.');
            }
        } else {

            // Lógica de CREACIÓN
            const nuevaNota = { 
                id: Date.now(), 
                titulo: titulo, 
                contenido: contenido,
                creada_por: usuarioActual, // Se registra el usuario
                fecha_creacion: fechaCreacionManual, // Se registra la fecha y hora manual
            };
            notas.push(nuevaNota); 
            alert('Nota creada con éxito.');
        }

        guardarNotas(); 
        displayNotes(); 
        noteForm.reset(); 
        
        // CORRECCIÓN: Fuerza a que la pestaña de Notas se mantenga activa
        const notesTab = document.getElementById('notes-tab');
        if (notesTab && bootstrap.Tab) {
             bootstrap.Tab.getInstance(notesTab).show(); 
        }
    });
}


// Lógica de Cierre de Sesión y Comprobación Inicial ------------------------

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

    // Comprobación normal de sesión
    if (localStorage.getItem("usuarioLogueado")) { 
        loginContainer.style.display = 'none';  
        dashboardContainer.style.display = 'block'; 
        
        // Carga tareas, proyectos y notas 
        displayTasks(); 
        displayProyects();

        displayNotes(); 
        
        const correo = localStorage.getItem("usuarioLogueado"); 

        document.getElementById("dashboard-message").textContent = `Sesión activa para: ${correo}`; 
    }
})();
