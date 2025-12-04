<?php
//conexion a base  de datos
require __DIR__ . '/config.php';

$mensaje = '';
$vista = $_GET['v'] ?? 'clientes';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accion = $_POST['accion'] ?? '';
    
    if ($accion === 'crear_institucion') {
        $nombre = trim($_POST['nombre'] ?? '');
        if ($nombre) {
            $consulta = $pdo->prepare('INSERT INTO instituciones_bancarias (nombre) VALUES (:nombre)');
            $consulta->execute(['nombre' => $nombre]);
            $mensaje = 'Institución creada';
        }
    }
    //secion de crear cliente
    
    if ($accion === 'crear_cliente') {
        $rfc = trim($_POST['rfc'] ?? '');
        $nombre = trim($_POST['nombre'] ?? '');
        $direccion = trim($_POST['direccion'] ?? '');
        $clabe = trim($_POST['clabe'] ?? '');
        $idInstitucion = (int)($_POST['id_institucion'] ?? 0);
        $saldo = (float)($_POST['saldo'] ?? 0);
        
        if ($saldo < 0) {
            $mensaje = 'Error: El saldo no puede ser negativo';
        } elseif (strlen($rfc) === 13 && strlen($clabe) === 18 && $idInstitucion > 0) {
            $consulta = $pdo->prepare('INSERT INTO clientes (rfc, nombre, direccion, clabe, institucion_id, saldo) VALUES (:rfc, :nombre, :direccion, :clabe, :institucion_id, :saldo)');
            $consulta->execute([
                'rfc' => $rfc,
                'nombre' => $nombre,
                'direccion' => $direccion,
                'clabe' => $clabe,
                'institucion_id' => $idInstitucion,
                'saldo' => $saldo
            ]);
            $mensaje = 'Cliente creado';
        }
    }
    
    if ($accion === 'eliminar_cliente') {
        $id = (int)($_POST['id'] ?? 0);
        if ($id > 0) {
            $consulta = $pdo->prepare('DELETE FROM clientes WHERE id = :id');
            $consulta->execute(['id' => $id]);
            $mensaje = 'Cliente eliminado';
        }
    }
}

$instituciones = $pdo->query('SELECT * FROM instituciones_bancarias ORDER BY id DESC')->fetchAll();
$clientes = $pdo->query('SELECT c.*, i.nombre as institucion FROM clientes c LEFT JOIN instituciones_bancarias i ON c.institucion_id = i.id ORDER BY c.id DESC')->fetchAll();
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Sistema Bancario</title>
</head>
<body>
    <h1>Sistema Bancario</h1>
    <?php if ($mensaje): ?>
        <p><strong><?= htmlspecialchars($mensaje) ?></strong></p>
    <?php endif; ?>
    
    <p>
        <a href="?v=clientes">Clientes</a> | 
        <a href="?v=instituciones">Instituciones</a>
    </p>
    
    
    
    <?php if ($vista === 'instituciones'): ?>
        
        <h2>Registrar Institución Bancaria</h2>
        <form method="post">
            <input type="hidden" name="accion" value="crear_institucion">
            <p>Nombre: <input name="nombre" required></p>
            <button type="submit">Crear</button>
        </form>
        
        <h3>Listado de Instituciones</h3>
        <table border="1">
            <tr>
                <th>ID</th>
                <th>Nombre</th>
            </tr>
            <?php foreach ($instituciones as $institucion): ?>
            <tr>
                <td><?= $institucion['id'] ?></td>
                <td><?= htmlspecialchars($institucion['nombre']) ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
        
    <?php else: ?>
        <h2>Registrar Cliente</h2>
        <form method="post">
            <input type="hidden" name="accion" value="crear_cliente">
            <p>RFC (13 caracteres): <input name="rfc" maxlength="13" required></p>
            <p>Nombre: <input name="nombre" required></p>
            <p>Dirección: <input name="direccion" required></p>
            <p>CLABE (18 dígitos): <input name="clabe" maxlength="18" required></p>
            <p>Institución Bancaria: 
                <select name="id_institucion" required>
                    <option value="">Seleccione</option>
                    <?php foreach ($instituciones as $institucion): ?>
                        <option value="<?= $institucion['id'] ?>"><?= htmlspecialchars($institucion['nombre']) ?></option>
                    <?php endforeach; ?>
                </select>
            </p>
            <p>Saldo: <input type="number" step="0.01" min="0" name="saldo" value="0" required></p>
            <button type="submit">Crear</button>
        </form>
        
        <h3>Listado de Clientes</h3>
        <table border="1">
            <tr>
                <th>ID</th>
                <th>RFC</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>CLABE</th>
                <th>Institución</th>
                <th>Saldo</th>
                <th>Acciones</th>
            </tr>
            <?php foreach ($clientes as $cliente): ?>
            <tr>
                <td><?= $cliente['id'] ?></td>
                <td><?= htmlspecialchars($cliente['rfc']) ?></td>
                <td><?= htmlspecialchars($cliente['nombre']) ?></td>
                <td><?= htmlspecialchars($cliente['direccion']) ?></td>
                <td><?= htmlspecialchars($cliente['clabe']) ?></td>
                <td><?= htmlspecialchars($cliente['institucion']) ?></td>
                <td>$<?= number_format($cliente['saldo'], 2) ?></td>
                <td>
                    <form method="post" style="display:inline;" onsubmit="return confirm('¿Eliminar este cliente?');">
                        <input type="hidden" name="accion" value="eliminar_cliente">
                        <input type="hidden" name="id" value="<?= $cliente['id'] ?>">
                        <button type="submit">Eliminar</button>
                    </form>
                </td>
            </tr>
            <?php endforeach; ?>
        </table>
    <?php endif; ?>
</body>
</html>

