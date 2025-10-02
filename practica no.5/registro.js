// --- 1. Inicialización de Datos ---

// Usuarios por defecto (solo si el navegador está vacío)
const USUARIOS_POR_DEFECTO = [
    { correo: "ejemplo@dominio.com", contrasena: "secreta123" },
];

// Carga el array de usuarios desde localStorage o usa los por defecto.
// Usamos 'let' porque vamos a modificar este array.
let usuariosRegistrados = JSON.parse(localStorage.getItem("users")) || USUARIOS_POR_DEFECTO;

// --- 2. Referencias a Elementos HTML ---

const formularioRegistro = document.getElementById("formularioRegistro");
const inputCorreo = document.getElementById("inputCorreoRegistro");
const inputContrasena = document.getElementById("inputContrasenaRegistro");
const mensajeError = document.getElementById("mensajeErrorRegistro");

// --- 3. Funciones Auxiliares ---

// Función para validar el formato de correo
function validarCorreo(correo) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(correo).toLowerCase());
}

// Función que guarda el array completo de vuelta en localStorage
function guardarUsuarios() {
    // 🚨 CLAVE: JSON.stringify convierte el array de JavaScript a texto antes de guardar.
    localStorage.setItem("users", JSON.stringify(usuariosRegistrados));
}

// --- 4. Lógica de Registro Principal ---

if (formularioRegistro) {
    formularioRegistro.addEventListener("submit", function(event) {
        event.preventDefault(); // Evita que la página se recargue

        const correo = inputCorreo.value.trim();
        const contrasena = inputContrasena.value;

        // A. Validar formato
        if (!validarCorreo(correo)) {
            mensajeError.textContent = "Por favor, ingresa un formato de correo electrónico válido.";
            return;
        }

        // B. Comprobar si el usuario ya existe (usamos .find() para ser eficientes)
        const usuarioExistente = usuariosRegistrados.find(user => user.correo === correo);

        if (usuarioExistente) {
            mensajeError.textContent = "¡Ese correo ya está registrado! Intenta iniciar sesión.";
            return;
        }

        // C. Creación y Adición del Nuevo Usuario
        const nuevoUsuario = { 
            correo: correo, 
            contrasena: contrasena 
        };
        
        usuariosRegistrados.push(nuevoUsuario); // 1. Añade a la memoria temporal de JavaScript
        guardarUsuarios();                     // 2. Guarda la lista completa en localStorage

        // D. Éxito y Redirección
        mensajeError.style.color = "green";
        mensajeError.textContent = "¡Registro exitoso! Serás redirigido al inicio de sesión.";
        formularioRegistro.reset();

        setTimeout(() => {
            window.location.href = "index.html"; // Redirige al login
        }, 1500); 
    });
}