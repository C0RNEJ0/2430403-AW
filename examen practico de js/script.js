function registrar() {
  let nombre = document.getElementById("nombre").value;
  let correo = document.getElementById("correo").value;
  let contrasena = document.getElementById("contrasena").value;
  let confirmar = document.getElementById("confirmar-contrasena").value;
  let mensaje = document.getElementById("mensaje");
  let validarCorreo = document.getElementById("validarCorreo")
  //let =  numero_totaldecaracteres = "correo@1gmail.com";


  

  if (nombre === "" || correo === "" || contrasena === ""|| confirmar ==="") {
    
    
    
    mensaje.textContent = "Por favor completa los campos verifica si la contraseña tiene mas 6 caracteres.";
  } else {
    mensaje.textContent = "ingresaste con exito, " + nombre + "!";
  }
}