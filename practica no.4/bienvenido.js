 const usuarioLogueado = localStorage.getItem("usuarioLogueado");
            const mensajeElemento = document.getElementById("mensaje-bienvenida");
            const botonCerrar = document.getElementById("cerrar-sesion");

            if (usuarioLogueado) {

                // Si hay un usuario, mostramos el mensaje personalizado
                mensajeElemento.textContent = `Bienvenido ${usuarioLogueado}`;
            } else {

                // Si no hay usuario, redirigimos al login
                window.location.href = "index.html";
            }
            botonCerrar.addEventListener("click", function() {

                // Eliminar la clave del usuario de localStorage
                localStorage.removeItem("usuarioLogueado");

                // Redirigir al login
                window.location.href = "index.html";
            });