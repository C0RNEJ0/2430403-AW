// Selección de elementos del DOM
const formatologin = document.getElementById("formatologin");
const errorMessageLogin = document.getElementById("error-message");

// la unica cuenta que hay para ingresar
const USUARIO_VALIDO = "chivista@gmail.com";
const CONTRASENA_VALIDA = "1234";

// Función para validar si el texto tiene formato de gmail
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}




//  la logica del login 
formatologin.addEventListener("submit", function(event) { // escucha el evento submit del formulario
    event.preventDefault(); // Previene el envío del formulario

    // Obtener los valores ingresados
    const usuarioEmail = document.getElementById("username").value.trim();
    const contrasena = document.getElementById("password").value;

    //  Validar formato de gmail
    if (!validarEmail(usuarioEmail)) {
        errorMessageLogin.style.color = "red";
        errorMessageLogin.textContent = "Por favor, ingresa un correo electrónico válido.";
        formatologin.reset(); 
        return;
    }

    //  Validación Simple (comparación directa)
    if (usuarioEmail === USUARIO_VALIDO && contrasena === CONTRASENA_VALIDA) { // si los datos son correctos

        //  Guardar la sesión con localStorage (esto se mantiene)
        localStorage.setItem("usuarioLogueado", usuarioEmail); // Guardar el gmail del usuario
        
        errorMessageLogin.style.color = "green";
        errorMessageLogin.textContent = "¡Inicio de sesión exitoso! nos vemos";

        setTimeout(() => {
            window.location.href = "bienvenido.html";
        }, 1000);

    } else {
        //  mensaje de error si los datos son incorrectos
        errorMessageLogin.style.color = "red";
        errorMessageLogin.textContent = "Correo o contraseña incorrectos.";
        formatologin.reset(); // limpia el formulario
    }
});