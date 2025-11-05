// carrito.js - Manejo del carrito de compras

const CARRITO_STORAGE_KEY = 'carrito';
const VENTAS_STORAGE_KEY = 'ventas';
const IVA_RATE = 0.16;

// FUNCION DE VENTAS
function obtener_ventas(){
    try{
        const v = localStorage.getItem(VENTAS_STORAGE_KEY);
        return v ? JSON.parse(v) : [];
    } catch{
        return [];
    }
}

function guardarVentas(lista){
    localStorage.setItem(VENTAS_STORAGE_KEY, JSON.stringify(lista));
}


// precio incluido usando la tasa IVA  CORREGIDO 
function calcularTotales(carrito){
    const totalConIva = carrito.reduce((acc, it) => acc + (Number(it.precio) * it.cantidad), 0);
    const factor = 1 + IVA_RATE; 
    // subtotal sin IVA
    const subtotal = totalConIva / factor;
    const iva = totalConIva - subtotal;
    const total = +totalConIva.toFixed(2);
    return { subtotal: +subtotal.toFixed(2), iva: +iva.toFixed(2), total };
}

// Contador id compra
let contadorCompra = parseInt(localStorage.getItem('contadorCompra') || '0', 10);

function nuevoIdCompra() {
  contadorCompra++;
  localStorage.setItem('contadorCompra', contadorCompra);
  return contadorCompra; // ← Devuelve un número consecutivo 1 2 3
}


// Obtener carrito del localStorage
function getCarrito() {
    try {
        const carrito = localStorage.getItem(CARRITO_STORAGE_KEY);
        return carrito ? JSON.parse(carrito) : [];
    } catch (e) {
        return [];
    }
}

// Guardar carrito en localStorage
function saveCarrito(carrito) {
    localStorage.setItem(CARRITO_STORAGE_KEY, JSON.stringify(carrito));
    updateCarritoCount();
}

// Agregar producto al carrito
function agregarAlCarrito(producto) {
    // bloquear si no hay stock
    // Obtener stock actual desde la lista de productos
    const productos = (typeof getProductos === 'function') ? getProductos() : [];
    const prodActual = productos.find(p => String(p.id) === String(producto.id));
    const available = (prodActual && (prodActual.stock ?? 0)) || 0;
    if (available <= 0) {
        alert('Sin stock disponible');
        return;
    }

    let carrito = getCarrito();
    // Verificar si el producto ya existe en el carrito 
    const existingIndex = carrito.findIndex(item => String(item.id) === String(producto.id));

    if (existingIndex !== -1) {
        // Si existe, incrementar cantidad respetando stock actual
        if (carrito[existingIndex].cantidad < available) {
            carrito[existingIndex].cantidad += 1;
        } else {
            alert('No hay más stock disponible');
        }
    } else {
        // Si no existe, agregarlo con cantidad 1
        carrito.push({
            id: String(producto.id),
            nombre: producto.nombre,
            precio: Number(producto.precio),
            imagen: producto.imagen,
            cantidad: 1,
            stock: available
        });
    }
    
    saveCarrito(carrito);
    showConfirmation('¡Agregado!', `${producto.nombre} se agregó al carrito`);
}

// Incrementar cantidad
function incrementarCantidad(productoId) {
    let carrito = getCarrito();
    const item = carrito.find(i => String(i.id) === String(productoId));
    if (!item) return;

    // Verificar stock actual desde productos
    const productos = (typeof getProductos === 'function') ? getProductos() : [];
    const prodActual = productos.find(p => String(p.id) === String(item.id));
    const available = (prodActual && (prodActual.stock ?? 0)) || 0;

    if (item.cantidad < available) {
        item.cantidad += 1;
        saveCarrito(carrito);
        renderCarrito();
    } else {
        alert('No hay más stock disponible');
    }
}

// Disminuir cantidad
function decrementarCantidad(productoId) {
    let carrito = getCarrito();
    const item = carrito.find(i => String(i.id) === String(productoId));
    if (!item) return;

    if (item.cantidad > 1) {
        item.cantidad -= 1;
        saveCarrito(carrito);
        renderCarrito();
    } else {
        eliminarDelCarrito(productoId);
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    
    let carrito = getCarrito();
    carrito = carrito.filter(item => item.id !== productoId);
    saveCarrito(carrito);
    renderCarrito();
}

// Actualizar contador del carrito
function updateCarritoCount() {
    const carrito = getCarrito();
    const count = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const carritoCount = document.getElementById('contador_carrito');
    
    if (carritoCount) {
        carritoCount.textContent = count;
        carritoCount.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Calcular total del carrito (
function calcularTotal() {
    const carrito = getCarrito();
    return carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

// Renderizar carrito
function renderCarrito() {
    const carrito = getCarrito();
    const carritoVacio = document.getElementById('carrito_vacio');
    const carritoContenido = document.getElementById('carrito_contenido');
    const carritoItems = document.getElementById('carrito_items');
    const carritoTotal = document.getElementById('carrito_total');
    
    if (!carritoVacio || !carritoContenido || !carritoItems || !carritoTotal) {
        console.warn('Elementos del carrito no encontrados en DOM');
    }

    if (carrito.length === 0) {
        if (carritoVacio) carritoVacio.style.display = 'block';
        if (carritoContenido) carritoContenido.style.display = 'none';
    } else {
        if (carritoVacio) carritoVacio.style.display = 'none';
        if (carritoContenido) carritoContenido.style.display = 'block';
        
        // Renderizar items
        if (carritoItems) {
            carritoItems.innerHTML = '';
            // Comprobar stock en tiempo real
            const productos = (typeof getProductos === 'function') ? getProductos() : [];
            let hasStockIssues = false;
            carrito.forEach(item => {
                // validar stock actual
                const prodActual = productos.find(p => String(p.id) === String(item.id));
                const stockActual = (prodActual && (prodActual.stock ?? 0)) || 0;
                if (stockActual <= 0) hasStockIssues = true;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="producto-info-carrito">
                            <img src="${item.imagen || ''}" alt="${item.nombre}" class="producto-img-carrito">
                            <span>${item.nombre}</span>
                        </div>
                    </td>
                    <td>$${item.precio.toFixed(2)}</td>
                    <td>
                        <div class="cantidad-controls">
                            <button class="btn-cantidad" onclick="decrementarCantidad('${item.id}')">-</button>
                            <span>${item.cantidad}</span>
                            <button class="btn-cantidad" onclick="incrementarCantidad('${item.id}')" ${stockActual <= item.cantidad ? 'disabled' : ''}>+</button>
                        </div>
                    </td>
                    <td><strong>${(item.precio * item.cantidad).toFixed(2)}</strong></td>
                    <td>
                        <button class="btn-eliminar-item" onclick="eliminarDelCarrito('${item.id}')">Eliminar</button>
                    </td>
                `;
                carritoItems.appendChild(tr);
            });
        }

    // Actualizar total simple 
    const totalSimple = calcularTotal();
    if (carritoTotal) carritoTotal.textContent = `${totalSimple.toFixed(2)}`;
    }

        // Actualizar bloque de resumen precios ya incluyen IVA funciona
    const { subtotal, iva, total } = calcularTotales(carrito);
    const contTotal = document.querySelector('.carrito-total');
        if (contTotal) {
            // comprobar si hay problemas de stock detectados arriba
            const productos = (typeof getProductos === 'function') ? getProductos() : [];
            const anyIssue = carrito.some(item => {
                const prod = productos.find(p => String(p.id) === String(item.id));
                const stockActual = (prod && (prod.stock ?? 0)) || 0;
                return stockActual <= 0 || item.cantidad > stockActual;
            });

            contTotal.innerHTML = `
                <h3>Resumen</h3>
                <p>Subtotal (sin IVA): $${subtotal.toFixed(2)}</p>
                <p>IVA: $${iva.toFixed(2)}</p>
                ${ anyIssue ? '<p style="color:#e74c3c; font-weight:700;">Hay productos sin stock o con cantidad mayor al disponible. Ajusta tu carrito.</p>' : '' }
                <h3>Total: $${total.toFixed(2)}</h3>
                <button id="boton_pagar" class="btn-pagar" ${ anyIssue ? 'disabled' : '' }>Pagar</button>
            `;

            // Rellenar elementos individuales si existen
            const carritoSubtotalEl = document.getElementById('carrito_subtotal');
            const carritoIvaEl = document.getElementById('carrito_iva');
            const carritoTotalEl = document.getElementById('carrito_total');
            if (carritoSubtotalEl) carritoSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
            if (carritoIvaEl) carritoIvaEl.textContent = `$${iva.toFixed(2)}`;
            if (carritoTotalEl) carritoTotalEl.textContent = `$${total.toFixed(2)}`;
        }

    // Reasignar listener del botón pagar cada que se renderiza
    const btnPagar = document.getElementById('boton_pagar');
    if (btnPagar) {
        btnPagar.addEventListener('click', (e) => {
            e.preventDefault();
            // abrir modal resumen del pedido
            if (typeof mostrarResumenPedido === 'function') mostrarResumenPedido();
        });
    }
}

// Generar folio incremental para pedidos
function generarFolio() {
    let folio = parseInt(localStorage.getItem('pedidoFolio') || '0', 10);
    folio = folio + 1;
    localStorage.setItem('pedidoFolio', folio);
    return folio;
}

// Mostrar resumen del pedido en modal
function mostrarResumenPedido() {
    const carrito = getCarrito();
    if (!carrito || carrito.length === 0) return alert('El carrito está vacío');

    const modal = document.getElementById('modal_resumen_pedido');
    const folioEl = document.getElementById('resumen_folio');
    const fechaEl = document.getElementById('resumen_fecha');
    const itemsEl = document.getElementById('resumen_items');
    const totalEl = document.getElementById('resumen_total');
    const btnConfirm = document.getElementById('resumen_confirmar');
    const btnCancel = document.getElementById('resumen_cancelar');
    const close = modal ? modal.querySelector('.close') : null;

    const folio = generarFolio();
    const fecha = new Date().toLocaleString();

    if (folioEl) folioEl.textContent = folio;
    if (fechaEl) fechaEl.textContent = fecha;

    // rellenar items
    if (itemsEl) {
        itemsEl.innerHTML = '';
        carrito.forEach(it => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:6px;">${it.nombre}</td>
                <td style="padding:6px; text-align:right;">${it.cantidad}</td>
                <td style="padding:6px; text-align:right;">$${(it.precio * it.cantidad).toFixed(2)}</td>
            `;
            itemsEl.appendChild(tr);
        });
    }

    // totales subtotal sin IVA, IVA y total con IVA ya lo hice funcionar 
    const { subtotal, iva, total } = calcularTotales(carrito);
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    // mostrar subtotal e iva en el modal resumen si existen los elementos
    const subtotalEl = document.getElementById('resumen_subtotal');
    const ivaEl = document.getElementById('resumen_iva');
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (ivaEl) ivaEl.textContent = `$${iva.toFixed(2)}`;

    // mostrar modal
    if (modal) modal.classList.add('show');

    // confirmar -> procesar pago y cerrar modal
    if (btnConfirm) {
        btnConfirm.onclick = () => {
            // procesarPago ya guarda la venta y descuenta stock 
            procesarPago(folio);
            if (modal) modal.classList.remove('show');
        };
    }

    if (btnCancel) {
        btnCancel.onclick = () => {
            if (modal) modal.classList.remove('show');
        };
    }

    if (close) {
        close.onclick = () => { if (modal) modal.classList.remove('show'); };
    }

    // cerrar al hacer clic fuera
    if (modal) {
        modal.addEventListener('click', function handler(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.removeEventListener('click', handler);
            }
        });
    }
}

// Procesar pago separado renderCarrito o initCarrito
function procesarPago(folioParam){
    const carritoModal = document.getElementById('modal_carrito');

    const carrito = getCarrito();
    if (carrito.length === 0) return;

    const itemsCount = carrito.reduce((sum, item) => sum + item.cantidad, 0);

    // Usuario actual auth.js
    const user = typeof getLoggedUser === 'function' ? getLoggedUser() : null;

    // Totales con IVA
    const carritoActual = getCarrito();
    const { subtotal, iva, total } = calcularTotales(carritoActual);

    // Construir venta monto = total con IVA
    const folio = folioParam || generarFolio();
    const venta = {
        id: nuevoIdCompra(),
        folio: folio,
        cliente: user ? (user.email || user.username || 'desconocido') : 'invitado',
        fecha: new Date().toISOString(),
        monto: total,
        items: carritoActual.map(i => ({
            id: i.id,
            nombre: i.nombre,
            precio: i.precio,
            cantidad: i.cantidad
        }))
    };

    // Guardar en storage de ventas
    const ventas = obtener_ventas();
    ventas.push(venta);
    guardarVentas(ventas);

    // Descontar stock 
    if (typeof getProductos === 'function' && typeof saveProductos === 'function') {
        const productos = getProductos();
        for (const it of carritoActual) {
            const idx = productos.findIndex(p => String(p.id) === String(it.id));
            if (idx !== -1) {
                productos[idx].stock = Math.max(0, (productos[idx].stock || 0) - it.cantidad);
            }
        }
        saveProductos(productos);
        if (typeof renderProducts === 'function') { try { renderProducts(); } catch(_){} }
    }

    // Limpiar carrito
    localStorage.removeItem(CARRITO_STORAGE_KEY);
    updateCarritoCount();

    // Cerrar modal
    if (carritoModal) carritoModal.classList.remove('show');

    // Confirmación
    showConfirmation(
        '¡Compra Exitosa!',
        `Has comprado ${itemsCount} producto(s) por un total de ${total.toFixed(2)} MXN`
    );
}

// Inicializar carrito
function initCarrito() {
    const carritoModal = document.getElementById('modal_carrito');
    const carritoIcon = document.getElementById('icono_carrito');
    const closeButtons = carritoModal ? carritoModal.querySelectorAll('.close') : [];
    
    // Actualizar contador inicial
    updateCarritoCount();
    
    // Abrir modal del carrito
    if (carritoIcon) {
        carritoIcon.addEventListener('click', (e) => {
            e.preventDefault();
            renderCarrito();
            if (carritoModal) carritoModal.classList.add('show');
        });
    } else {
        console.warn('icono-carrito no encontrado');
    }
    
    // Cerrar modal
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (carritoModal) carritoModal.classList.remove('show');
        });
    });
    
    // Cerrar modal al hacer clic fuera
    if (carritoModal) {
        carritoModal.addEventListener('click', (e) => {
            if (e.target === carritoModal) {
                carritoModal.classList.remove('show');
            }
        });
    }

    // Render inicial par el iva y boton pagar
    renderCarrito();
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCarrito);
} else {
    initCarrito();
}
