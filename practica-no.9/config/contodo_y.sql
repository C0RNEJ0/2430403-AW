

DROP DATABASE IF EXISTS clinica_cornejo;
CREATE DATABASE clinica_cornejo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clinica_cornejo;

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- ============================================
-- TABLA: roles
-- ============================================
CREATE TABLE roles (
    rol_id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles básicos
INSERT INTO roles (nombre, descripcion) VALUES
('super_admin', 'Administrador del sistema con acceso total'),
('medico', 'Médico con acceso a expedientes y agenda'),
('secretaria', 'Personal administrativo con acceso a citas y pacientes'),
('paciente', 'Paciente con acceso limitado a su información');

-- ============================================
-- TABLA: especialidades
-- ============================================
CREATE TABLE especialidades (
    especialidad_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar especialidades básicas
INSERT INTO especialidades (nombre, descripcion) VALUES
('Medicina General', 'Consulta general'),
('Pediatría', 'Atención a menores'),
('Cardiología', 'Especialista en corazón'),
('Dermatología', 'Especialista en piel'),
('Odontología', 'Salud dental');

-- ============================================
-- TABLA: medicos
-- ============================================
CREATE TABLE medicos (
    medico_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    telefono VARCHAR(30) NULL,
    cedula_profesional VARCHAR(50) NULL,
    especialidad_id INT UNSIGNED NULL,
    horario VARCHAR(120) NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_medico_especialidad
        FOREIGN KEY (especialidad_id) REFERENCES especialidades(especialidad_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: pacientes
-- ============================================
CREATE TABLE pacientes (
    paciente_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(120) NOT NULL,
    apellidos VARCHAR(120) NOT NULL,
    sexo ENUM('F','M','X','Otro') NULL,
    genero ENUM('M', 'F', 'Otro') NULL,
    fecha_nacimiento DATE NULL,
    telefono VARCHAR(30) NULL,
    email VARCHAR(120) NULL,
    direccion VARCHAR(200) NULL,
    ciudad VARCHAR(80) NULL,
    estado VARCHAR(80) NULL,
    cp VARCHAR(10) NULL,
    prioridad ENUM('Baja','Media','Alta','Crítica') DEFAULT 'Baja',
    tipo_sangre VARCHAR(10) NULL,
    alergias VARCHAR(255) NULL,
    notas TEXT NULL,
    contacto_emergencia VARCHAR(100) NULL,
    telefono_emergencia VARCHAR(20) NULL,
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pacientes_nombre (nombres, apellidos),
    INDEX idx_pacientes_prioridad (prioridad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    usuario_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    pass_hash CHAR(64) NOT NULL,
    rol_id INT NOT NULL,
    medico_id INT UNSIGNED NULL,
    paciente_id INT UNSIGNED NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    ultimo_acceso TIMESTAMP NULL,
    creado_por INT UNSIGNED NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuario_rol FOREIGN KEY (rol_id) REFERENCES roles(rol_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_usuario_medico FOREIGN KEY (medico_id) REFERENCES medicos(medico_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_usuario_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_usuario_creador FOREIGN KEY (creado_por) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear usuario administrador por defecto
-- Password: admin123 (hash SHA256)
INSERT INTO usuarios (nombre, email, pass_hash, rol_id) VALUES
('Administrador', 'admin@clinica.com', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 1);

-- ============================================
-- TABLA: tarifas
-- ============================================
CREATE TABLE tarifas (
    tarifa_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    especialidad_id INT UNSIGNED NULL,
    nombre VARCHAR(100) NULL,
    nombre_servicio VARCHAR(120) NULL,
    servicio VARCHAR(120) NULL,
    descripcion TEXT NULL,
    precio DECIMAL(10,2) NOT NULL,
    costo DECIMAL(10,2) NULL,
    duracion_min SMALLINT UNSIGNED DEFAULT 30,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tarifa_especialidad FOREIGN KEY (especialidad_id) REFERENCES especialidades(especialidad_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tarifas básicas
INSERT INTO tarifas (nombre_servicio, servicio, precio, duracion_min) VALUES
('Consulta General', 'Consulta General', 350.00, 30),
('Consulta Especialidad', 'Consulta con especialista', 500.00, 30),
('Revisión', 'Revisión de seguimiento', 200.00, 20);

-- ============================================
-- TABLA: citas
-- ============================================
CREATE TABLE citas (
    cita_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    medico_id INT UNSIGNED NOT NULL,
    tarifa_id INT UNSIGNED NULL,
    motivo VARCHAR(200) NULL,
    notas TEXT NULL,
    fecha_hora DATETIME NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    estado ENUM('pendiente','programada','confirmada','realizada','completada','cancelada','no_asistio') NOT NULL DEFAULT 'pendiente',
    origen ENUM('web','telefono','mostrador') NULL,
    creado_por INT UNSIGNED NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cita_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cita_medico FOREIGN KEY (medico_id) REFERENCES medicos(medico_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_cita_tarifa FOREIGN KEY (tarifa_id) REFERENCES tarifas(tarifa_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cita_usuario FOREIGN KEY (creado_por) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_citas_calendario (fecha_hora_inicio, fecha_hora_fin),
    INDEX idx_citas_medico_fecha (medico_id, fecha_hora_inicio),
    INDEX idx_citas_estado (estado),
    INDEX idx_citas_paciente (paciente_id),
    INDEX idx_citas_fecha (fecha_hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: expedientes
-- ============================================
CREATE TABLE expedientes (
    expediente_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    medico_id INT UNSIGNED NOT NULL,
    fecha_consulta DATE NOT NULL,
    motivo_consulta TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    observaciones TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_expediente_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_expediente_medico FOREIGN KEY (medico_id) REFERENCES medicos(medico_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    INDEX idx_expedientes_paciente (paciente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: pagos
-- ============================================
CREATE TABLE pagos (
    pago_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT UNSIGNED NOT NULL,
    cita_id BIGINT UNSIGNED NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda CHAR(3) DEFAULT 'MXN',
    metodo ENUM('efectivo','tarjeta','transferencia') DEFAULT 'efectivo',
    forma_pago ENUM('efectivo','tarjeta','transferencia') DEFAULT 'efectivo',
    estatus ENUM('pagado','pendiente','reembolsado') DEFAULT 'pagado',
    concepto TEXT NULL,
    referencia VARCHAR(60) NULL,
    fecha_pago DATETIME DEFAULT CURRENT_TIMESTAMP,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pago_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(paciente_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pago_cita FOREIGN KEY (cita_id) REFERENCES citas(cita_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_pagos_fecha (fecha_pago),
    INDEX idx_pagos_estatus (estatus),
    INDEX idx_pagos_paciente (paciente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: bitacoras_usuarios
-- ============================================
CREATE TABLE bitacoras_usuarios (
    bitacora_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    accion VARCHAR(120) NOT NULL,
    tabla_afectada VARCHAR(64) NULL,
    registro_id BIGINT NULL,
    detalles TEXT NULL,
    ip VARCHAR(45) NULL,
    user_agent TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_bitacora_usuario (usuario_id, creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: bitacora (tabla alternativa)
-- ============================================
CREATE TABLE bitacora (
    bitacora_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT NULL,
    detalles TEXT,
    ip VARCHAR(45),
    user_agent TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_alt_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: bitacora_accesos
-- ============================================
CREATE TABLE bitacora_accesos (
    acceso_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NULL,
    email VARCHAR(100),
    tipo_acceso VARCHAR(50) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    exitoso TINYINT(1) DEFAULT 1,
    detalles TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_acceso_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_bitacora_accesos_usuario (usuario_id),
    INDEX idx_bitacora_accesos_fecha (creado_en)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: sesiones
-- ============================================
CREATE TABLE sesiones (
    sesion_id VARCHAR(255) PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    activa TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bitacora (
    bitacora_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    detalles TEXT,
    ip VARCHAR(45),
    user_agent VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- SISTEMA DE PERMISOS
-- ============================================

-- aqui creamos la tabla de permisos para los usuarios
-- esta tabla guarda que modulos puede ver cada usuario
CREATE TABLE IF NOT EXISTS permisos_usuario (
    permiso_id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    modulo VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_permiso_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    UNIQUE KEY unique_permiso (usuario_id, modulo),
    INDEX idx_usuario (usuario_id),
    INDEX idx_modulo (modulo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- aqui creamos una tabla catalogo con todos los modulos disponibles del sistema
CREATE TABLE IF NOT EXISTS catalogo_permisos (
    catalogo_id INT AUTO_INCREMENT PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL UNIQUE,
    nombre_mostrar VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    orden INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- aqui insertamos todos los modulos del sistema en el catalogo
INSERT INTO catalogo_permisos (modulo, nombre_mostrar, descripcion, icono, orden) VALUES
('dashboard', 'Dashboard', 'Panel principal con estadisticas y resumen del sistema', 'bi-speedometer2', 1),
('pacientes', 'Pacientes', 'Gestion de pacientes y sus datos personales', 'bi-people', 2),
('agenda', 'Agenda', 'Calendario de citas y programacion de consultas', 'bi-calendar3', 3),
('medicos', 'Médicos', 'Administracion de medicos y especialidades', 'bi-person-badge', 4),
('expedientes', 'Expedientes', 'Historiales medicos y expedientes clinicos', 'bi-folder2-open', 5),
('pagos', 'Pagos', 'Control de pagos y facturacion', 'bi-cash-coin', 6),
('tarifas', 'Tarifas', 'Configuracion de precios y tarifas de servicios', 'bi-currency-dollar', 7),
('reportes', 'Reportes', 'Generacion de reportes y estadisticas', 'bi-file-earmark-bar-graph', 8),
('admin', 'Administración', 'Panel de administracion general del sistema', 'bi-gear', 9),
('bitacoras', 'Bitácoras', 'Registro de actividades y auditoria del sistema', 'bi-journal-text', 10),
('usuarios', 'Usuarios', 'Gestion de usuarios y roles del sistema', 'bi-person-circle', 11),
('roles', 'Roles', 'Configuracion de roles y permisos', 'bi-shield-lock', 12),
('especialidades', 'Especialidades', 'Catalogo de especialidades medicas', 'bi-bookmark-star', 13)
ON DUPLICATE KEY UPDATE 
    nombre_mostrar = VALUES(nombre_mostrar),
    descripcion = VALUES(descripcion),
    icono = VALUES(icono),
    orden = VALUES(orden);

-- aqui damos todos los permisos al usuario super admin (usuario_id = 1)
INSERT INTO permisos_usuario (usuario_id, modulo) 
SELECT 1, modulo FROM catalogo_permisos WHERE activo = 1
ON DUPLICATE KEY UPDATE permisos_usuario.modulo = catalogo_permisos.modulo;

-- ============================================
-- ÍNDICES ADICIONALES
-- ============================================
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
SELECT 'Base de datos creada exitosamente' AS mensaje;
SHOW TABLES;
