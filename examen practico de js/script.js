function registrar() {
  let nombre = document.getElementById("nombre").value;
  let correo = document.getElementById("correo").value;
  let contrasena = document.getElementById("contrasena").value;
  let confirmar = document.getElementById("confirmar").value;
  let mensaje = document.getElementById("mensaje");

  if (!nombre || !correo || !contrasena || !confirmar) {
    mensaje.textContent = "Completa los campos.";
  } else if (!correo.includes("@") || !correo.includes(".")) {
    mensaje.textContent = "Correo no válido.";
  } else if (contrasena.length < 6) {
    mensaje.textContent = "La contraseña debe tener 6 de algo.";
  } else if (contrasena !== confirmar) {
    mensaje.textContent = "verfica las contra.";
  } else {
    mensaje.textContent = "Bienvenido, " + nombre + "!";
  }
}
