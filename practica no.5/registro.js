
// Usuarios por defecto (solo si el navegador está vacío)
const USUARIOS_POR_DEFECTO = [
    { correo: "chivista@gmail.com", contrasena: "1234" }, // Usuario de prueba
];
let usuariosRegistrados = JSON.parse(localStorage.getItem("users")) || USUARIOS_POR_DEFECTO; // Lista de usuarios registrados

//Id a Elementos HTML 

const formularioRegistro = document.getElementById("formularioRegistro"); // Formulario de registro
const inputCorreo = document.getElementById("inputCorreoRegistro"); // Campo de correo
const inputContrasena = document.getElementById("inputContrasenaRegistro"); // Campo de contraseña
const mensajeError = document.getElementById("mensajeErrorRegistro"); //mo  strar mensajes d e error



// Función para validar el formato de correo
function validarCorreo(correo) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(correo).toLowerCase());
}

// Función que guarda el array completo de vuelta en localStorage
function guardarUsuarios() {
    localStorage.setItem("users", JSON.stringify(usuariosRegistrados));
}

// Lógica de Registro Principal ---

if (formularioRegistro) {
    formularioRegistro.addEventListener("submit", function(event) {
        event.preventDefault(); // Evita que la página se recargue

        const correo = inputCorreo.value.trim();
        const contrasena = inputContrasena.value;

        //  Validar formato
        if (!validarCorreo(correo)) {
            mensajeError.textContent = "Por favor, ingresa un formato de correo electrónico válido.";
            return;
        }

        // Comprobar si el usuario ya existe (usamos .find() para ser eficientes)
        const usuarioExistente = usuariosRegistrados.find(user => user.correo === correo);

        if (usuarioExistente) {
            mensajeError.textContent = "¡Ese correo ya está registrado! Intenta iniciar sesión.";
            return;
        }

        // Creación y Adición del Nuevo Usuario
        const nuevoUsuario = { 
            correo: correo, 
            contrasena: contrasena 
        };
        
        usuariosRegistrados.push(nuevoUsuario); // 1. Añade a la memoria temporal de JavaScript
        guardarUsuarios();                     // 2. Guarda la lista completa en localStorage

        //  Éxito y Redirección
        mensajeError.style.color = "green";
        mensajeError.textContent = "¡Registro exitoso! Serás redirigido al inicio de sesión.";
        formularioRegistro.reset();

        setTimeout(() => {
            window.location.href = "index.html"; // Redirige al login
        }, 1500); 
    });
}