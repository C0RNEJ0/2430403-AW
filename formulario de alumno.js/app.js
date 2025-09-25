// Seleccionar elementos del DOM
const form = document.getElementById('form-alumno');
const lista = document.getElementById('lista-alumnos');

// Manejador del evento submit del formulario
form.addEventListener('submit', function(e) {
  e.preventDefault(); // Evita que la página se recargue

  // Validación del formulario
  if (!form.checkValidity()) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  // Obtener valores de los campos
  const matricula = document.getElementById('matricula').value;
  const nombre    = document.getElementById('nombre').value;
  const carrera   = document.getElementById('carrera').value;
  const email     = document.getElementById('email').value;
  const telefono  = document.getElementById('telefono').value;

  // Crear una nueva fila en la tabla
  const fila = document.createElement('tr');
  fila.innerHTML = `
    <td>${matricula}</td>
    <td>${nombre}</td>
    <td>${carrera}</td>
    <td>${email}</td>
    <td>${telefono}</td>
  `;

  // Agregar la fila al tbody de la tabla
  lista.appendChild(fila);

  // Limpiar el formulario
  form.reset();
});
