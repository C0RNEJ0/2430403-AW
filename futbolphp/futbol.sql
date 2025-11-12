

CREATE TABLE IF NOT EXISTS futbol (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  edad INT,
  sexo VARCHAR(20),
  telefono VARCHAR(30),
  correo VARCHAR(120),
  equipo VARCHAR(80),
  numero_barsal VARCHAR(50),
  fecha DATE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

