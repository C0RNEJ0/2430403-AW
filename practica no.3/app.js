// las variables
const form = document.getElementById("form-alumno");
const lista = document.getElementById("lista-alumnos");
const msg = document.getElementById("msg");

let alumnos = JSON.parse(localStorage.getItem("alumnos")) || [];

form.addEventListener("submit", function (e) {  
  e.preventDefault();
         // Obtiene los valores del formulario
  const matricula = document.getElementById("matricula").value;
  const nombre = document.getElementById("nombre").value;
  const carrera = document.getElementById("carrera").value;
  const correo = document.getElementById("email").value;
  const telefono = document.getElementById("telefono").value;
 // Validación 
  const alumno = {
    matricula,
    nombre,
    carrera,
    correo,
    telefono,
  };

  alumnos.push(alumno);
  localStorage.setItem("alumnos", JSON.stringify(alumnos));
  renderAlumnos();
});

// Inicializador de la tabla
function renderAlumnos() {
  lista.innerHTML = "";
  alumnos.forEach((alumno, index) => {
    // Crea una fila para cada alumno
    const row = `   
    <tr>  
        <td>${alumno.matricula}</td>
        <td>${alumno.nombre}</td>
        <td>${alumno.carrera}</td>
        <td>${alumno.correo}</td>
        <td>${alumno.telefono}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteAlumno(${index})">Eliminar</button></td>
s      </tr>
    `; 
    lista.innerHTML += row; // Agrega la fila a la tabla
  });
 } // Carga inicial
function deleteAlumno(index) {
  alumnos.splice(index, 1);
  localStorage.setItem("alumnos", JSON.stringify(alumnos));
  renderAlumnos();
}
