<?php
$servidor = "localhost";
$usuario = "root";
$contrasena = "";
$bd = "futb1";

$conexion = mysqli_connect($servidor, $usuario, $contrasena, $bd);
if (!$conexion) { die("error al conectar: " . mysqli_connect_error()); }

if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $nombre         = $_POST['nombre'] ?? '';
  $apellidos      = $_POST['apellidos'] ?? '';
  $edad           = $_POST['edad'] ?? '';
  $sexo           = $_POST['sexo'] ?? '';
  $telefono       = $_POST['telefono'] ?? '';
  $correo         = $_POST['correo'] ?? '';
  $equipo         = $_POST['equipo'] ?? '';
  $numero_barsal  = $_POST['numero_barsal'] ?? '';
  $fecha_registro = $_POST['fecha_registro'] ?? '';

  if ($sexo === 'Femenino') {
    echo "las mujeres no  juegan fut.";
  } else {
    $sql = "INSERT INTO pacientes (nombre, apellidos, edad, sexo, telefono, correo, equipo, numero_barsal, fecha)
            VALUES ('$nombre','$apellidos','$edad','$sexo','$telefono','$correo','$equipo','$numero_barsal','$fecha_registro')";
    if (mysqli_query($conexion, $sql)) {
      echo "registro guardado.";
    } else {
      echo "error: " . mysqli_error($conexion);
    }
  }
}
?>
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Registro de fútbol</title></head>
<body>
<h2>Formulario de registro de fútbol</h2>
<form method="post" action="">
  Nombre: <input type="text" name="nombre"><br><br>
  Apellidos: <input type="text" name="apellidos"><br><br>
  Edad: <input type="number" name="edad"><br><br>
  Sexo:
  <select name="sexo">
    <option value="Masculino">Masculino</option>
    <option value="Femenino">Femenino</option>
    <option value="Otro">Otro</option>
  </select><br><br>
  Teléfono: <input type="text" name="telefono"><br><br>
  Correo electrónico: <input type="email" name="correo"><br><br>
  Equipo:
  <select name="equipo">
    <option value="cruzazul">Cruz Azul</option>
    <option value="pumas">Pumas</option>
    <option value="AtleticodeSLP">Atlético de SLP</option>
    <option value="elcorre">Caminos</option>
    <option value="madrid">Real Madrid</option>
  </select><br><br>
  Numero_barsal: <input type="text" name="numero_barsal"><br><br>
  Fecha de juego: <input type="date" name="fecha_registro"><br><br>
  <input type="submit" value="Registrar jugador">
</form>
</body>
</html>

