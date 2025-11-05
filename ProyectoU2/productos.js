const PRODUCTOS_STORAGE_KEY = 'productos';
const ALLOWED_CATEGORIES = ['Calzado', 'Playeras'];

// Obtener productos del localStorage
function getProductos() {
    try {
        const productos = localStorage.getItem(PRODUCTOS_STORAGE_KEY);
        return productos ? JSON.parse(productos) : [];
    } catch (e) {
        return [];
    }
}

// Guardar productos en localStorage
function saveProductos(productos) {
    localStorage.setItem(PRODUCTOS_STORAGE_KEY, JSON.stringify(productos));
    // Notificar a esta página (handlers locales) y a otras pestañas mediante storage
    try {
        // Evento personalizado para la misma pestaña
        window.dispatchEvent(new CustomEvent('productos:changed'));
    } catch (e) {
        // ignore
    }
}

// 
window.addEventListener('storage', (e) => {
    if (!e) return;
    if (e.key === PRODUCTOS_STORAGE_KEY) {
        try { renderProducts(); } catch (_){ }
    }
});

// Escuchar evento local para actualizar en la misma pestaña cuando se usan las funciones
window.addEventListener('productos:changed', () => {
    try { renderProducts(); } catch (_){ }
});

// Agregar producto
function agregarProducto(producto) {
    const productos = getProductos();
    productos.push(producto);
    saveProductos(productos);
}

// Actualizar producto
function actualizarProducto(productoActualizado) {
    let productos = getProductos();
    const index = productos.findIndex(p => p.id === productoActualizado.id);
    
    if (index !== -1) {
        productos[index] = productoActualizado;
        saveProductos(productos);
        return true;
    }
    return false;
}

// Eliminar producto solo es para admins 
function eliminarProducto(productoId) {
    if (typeof isAdminUser === 'function' && !isAdminUser()) {
        alert('Solo administradores pueden eliminar productos.');
        return;
    }

    // Pedir contraseña fija del admin
    const REQUIRED_ADMIN_PASS = '123456';
    const pass = prompt('Ingresa la contraseña de administrador para eliminar el producto:');
    if (!pass) return;

    if (pass !== REQUIRED_ADMIN_PASS) {
        alert('Contraseña incorrecta.');
        return;
    }

    // Si se logra poner la contraseña correcta mostrar confirmación
    showDeleteConfirm(productoId);
}

function showDeleteConfirm(productoId) {
    const modal = document.getElementById('modal_confirmar_eliminar');
    const btnYes = document.getElementById('boton_eliminar_si');
    const btnNo = document.getElementById('boton_eliminar_no');

    if (!modal) {
        // fallback a confirm si el modal no existe
        if (!confirm('¿Eliminar este producto?')) return;
        let productos = getProductos();
        productos = productos.filter(p => p.id !== productoId);
        saveProductos(productos);
        renderProducts();
        showConfirmation('Producto Eliminado', 'El producto se eliminó correctamente');
        return;
    }

    // mostrar modal
    modal.classList.add('show');

    // limpiar handlers previos
    btnYes.onclick = () => {
        let productos = getProductos();
        productos = productos.filter(p => p.id !== productoId);
        saveProductos(productos);
        renderProducts();
        showConfirmation('Producto Eliminado', 'El producto se eliminó correctamente');
        modal.classList.remove('show');
    };

    btnNo.onclick = () => {
        modal.classList.remove('show');
    };

    // cerrar al hacer clic fuera
    modal.addEventListener('click', function handler(e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            modal.removeEventListener('click', handler);
        }
    });
}

// Validar URL de imagen
function isValidImageUrl(url) {
    try {
        const parsed = new URL(url);
        return /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(parsed.pathname);
    } catch (e) {
        return false;
    }
}

// Normalizar categoría
function normalizeCategory(raw) {
    if (!raw) return '';
    const s = raw.trim();
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Escapar HTML
function escapeHtml(str) {
    return (str || '').toString().replace(/[&<>"']/g, function(tag) {
        const charsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return charsToReplace[tag] || tag;
    });
}

// Render productos
function renderProducts() {
    const productsGrid = document.getElementById('lista_productos') || document.getElementById('products_container');
    if (!productsGrid) return;
    
    const productos = getProductos();
    const isAdmin = typeof isAdminUser === 'function' ? isAdminUser() : isLoggedIn();
    
    productsGrid.innerHTML = '';
    
    if (productos.length === 0) {
        productsGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No hay productos disponibles</p>';
        return;
    }
    
    productos.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Imagen
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'product-image';
        const img = document.createElement('img');
        img.src = producto.imagen || '';
        img.alt = producto.nombre;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.onerror = () => { img.style.display = 'none'; };
        imgWrapper.appendChild(img);
        
        // Información
        const info = document.createElement('div');
        info.className = 'product-info';
        info.innerHTML = `
            <p class="name">${escapeHtml(producto.nombre)}</p>
            <p class="price">$${producto.precio.toFixed(2)} MXN</p>
            <p class="category">${escapeHtml(producto.categoria)}</p>
            <p class="stock">Stock: ${producto.stock}</p>
        `;
        
        card.appendChild(imgWrapper);
        card.appendChild(info);
        
        // Botón agregar al carrito
        if (producto.stock > 0) {
            const btnAgregar = document.createElement('button');
            btnAgregar.className = 'btn-agregar-carrito';
            btnAgregar.textContent = 'Agregar al Carrito';
            btnAgregar.addEventListener('click', () => agregarAlCarrito(producto));
            card.appendChild(btnAgregar);
        } else {
            const sinStock = document.createElement('p');
            sinStock.style.textAlign = 'center';
            sinStock.style.color = '#e74c3c';
            sinStock.style.fontWeight = 'bold';
            sinStock.style.marginTop = '10px';
            sinStock.textContent = 'Sin stock';
            card.appendChild(sinStock);
        }
        
        // Controles de administrador
        if (isAdmin) {
            const controls = document.createElement('div');
            controls.className = 'product-controls';
            
            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-edit';
            btnEdit.textContent = 'Editar';
            btnEdit.addEventListener('click', () => abrirModalEditar(producto));
            
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-delete';
            btnDelete.textContent = 'Eliminar';
            btnDelete.addEventListener('click', () => eliminarProducto(producto.id));
            
            controls.appendChild(btnEdit);
            controls.appendChild(btnDelete);
            card.appendChild(controls);
        }
        
        productsGrid.appendChild(card);
    });
}



// Abrir modal para agregar producto
function abrirModalAgregar() {
    const productoModal = document.getElementById('modal_producto');
    const productoForm = document.getElementById('form_producto') || document.getElementById('formulario_producto');
    const productoModalTitle = document.getElementById('titulo_modal_producto');
    const previewImage = document.getElementById('imagen_preview');
    const placeholderText = document.getElementById('texto_placeholder');
    
    if (!productoModal) {
        console.error('Modal no encontrado');
        return;
    }
    
    console.log('Configurando modal para agregar producto');
    
    productoModalTitle.textContent = 'Agregar Producto';
    productoForm.reset();
    const productoIdInput = document.getElementById('producto_id');
    if (productoIdInput) productoIdInput.value = '';
    
    // Limpiar preview
    if (previewImage) { previewImage.style.display = 'none'; previewImage.src = ''; }
    if (placeholderText) { placeholderText.style.display = 'block'; placeholderText.textContent = 'No hay imagen seleccionada'; }
    
    // Mostrar modal
    productoModal.classList.add('show');
    console.log('Modal abierto');
}

// Abrir modal para editar producto
function abrirModalEditar(producto) {
    const productoModal = document.getElementById('modal_producto');
    const productoModalTitle = document.getElementById('titulo_modal_producto');
    const previewImage = document.getElementById('imagen_preview');
    const placeholderText = document.getElementById('texto_placeholder');
    
    productoModalTitle.textContent = 'Editar Producto';
    
    // Llenar formulario
    const productoIdInput = document.getElementById('producto_id');
    if (productoIdInput) productoIdInput.value = producto.id;
    const nombre = document.getElementById('nombre') || document.getElementById('p_nombre'); if (nombre) nombre.value = producto.nombre;
    const categoria = document.getElementById('categoria'); if (categoria) categoria.value = producto.categoria;
    const precio = document.getElementById('precio') || document.getElementById('p_precio'); if (precio) precio.value = producto.precio;
    const stock = document.getElementById('stock') || document.getElementById('p_stock'); if (stock) stock.value = producto.stock;
    const imageUrl = document.getElementById('imagen_url') || document.getElementById('p_imagen'); if (imageUrl) imageUrl.value = producto.imagen || '';
    
    // Mostrar preview
    if (producto.imagen && previewImage) {
        previewImage.src = producto.imagen;
        previewImage.style.display = 'block';
        if (placeholderText) placeholderText.style.display = 'none';
    }
    
    if (productoModal) productoModal.classList.add('show');
}

// Inicializar gestión de productos
function initProductos() {
    const productoModal = document.getElementById('modal_producto');
    const productoForm = document.getElementById('form_producto') || document.getElementById('formulario_producto');
    const btnAgregarProducto = document.getElementById('boton_agregar_producto');
    const imageUrlInput = document.getElementById('imagen_url') || document.getElementById('p_imagen');
    const previewImage = document.getElementById('imagen_preview');
    const placeholderText = document.getElementById('texto_placeholder');
    
    if (!productoModal || !productoForm) {
        console.error('Modal de producto no encontrado');
        return;
    }
    
    const closeButtons = productoModal.querySelectorAll('.close');
    
    // Renderizar productos iniciales
    renderProducts();
    
    // Abrir modal agregar (solo admin)
    if (btnAgregarProducto) {
        console.log('Registrando handler en boton_agregar_producto');
        btnAgregarProducto.addEventListener('click', (e) => {
            e.preventDefault();
            // comprobar privilegios
            if (typeof isAdminUser === 'function' && !isAdminUser()) {
                alert('Solo usuarios administradores pueden agregar productos');
                return;
            }
            console.log('Abriendo modal de agregar producto (handler directo)');
            abrirModalAgregar();
        });
    } else {
        console.warn('boton_agregar_producto NO encontrado. Registrando delegacion en document.');
        document.addEventListener('click', function delegated(e) {
            const target = e.target.closest && e.target.closest('#boton_agregar_producto');
            if (target) {
                e.preventDefault();
                if (typeof isAdminUser === 'function' && !isAdminUser()) {
                    alert('Solo usuarios administradores pueden agregar productos');
                    return;
                }
                console.log('Abriendo modal de agregar producto (delegado)');
                abrirModalAgregar();
            }
        });
    }
    
    // Preview de imagen
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', () => {
            const url = imageUrlInput.value.trim();
            if (url) {
                if (isValidImageUrl(url)) {
                    if (previewImage) { previewImage.src = url; previewImage.style.display = 'block'; }
                    if (placeholderText) placeholderText.style.display = 'none';
                } else {
                    if (previewImage) previewImage.style.display = 'none';
                    if (placeholderText) { placeholderText.textContent = 'URL no válida o no es imagen'; placeholderText.style.display = 'block'; }
                }
            } else {
                if (previewImage) previewImage.style.display = 'none';
                if (placeholderText) { placeholderText.textContent = 'No hay imagen seleccionada'; placeholderText.style.display = 'block'; }
            }
        });

        // Error al cargar imagen
        if (previewImage) {
            previewImage.addEventListener('error', () => {
                previewImage.style.display = 'none';
                if (placeholderText) { placeholderText.textContent = 'No se pudo cargar la imagen'; placeholderText.style.display = 'block'; }
            });
        }
    }
    
    // Guardar producto
    productoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productoId = (document.getElementById('producto_id') || {}).value;
    const nombre = (document.getElementById('nombre') || document.getElementById('p_nombre') || {}).value.trim();
        const categoriaRaw = (document.getElementById('categoria') || {}).value;
        const categoria = normalizeCategory(categoriaRaw);
    const precio = parseFloat((document.getElementById('precio') || document.getElementById('p_precio') || {}).value);
    const stock = parseInt((document.getElementById('stock') || document.getElementById('p_stock') || {}).value, 10);
    const imagen = ((document.getElementById('imagen_url') || document.getElementById('p_imagen') || {}).value || '').trim();
        
        // Validaciones
        if (!nombre || !categoria || isNaN(precio) || isNaN(stock)) {
            alert('Por favor completa todos los campos correctamente');
            return;
        }
        
        if (!ALLOWED_CATEGORIES.includes(categoria)) {
            alert('Categoría no válida. Selecciona Calzado o Playeras.');
            return;
        }
        
        if (productoId) {
            // Actualizar producto existente
            const producto = {
                id: parseInt(productoId, 10),
                nombre,
                categoria,
                precio: Number(precio),
                stock: Number(stock),
                imagen
            };
            actualizarProducto(producto);
            showConfirmation('Producto Actualizado', 'El producto se actualizó correctamente');
        } else {
            // Crear nuevo producto
            const producto = {
                id: Date.now(),
                nombre,
                categoria,
                precio: Number(precio),
                stock: Number(stock),
                imagen
            };
            agregarProducto(producto);
            showConfirmation('Producto Guardado', 'El producto se registró correctamente');
        }
        
        // Cerrar modal y renderizar
        productoModal.classList.remove('show');
        productoForm.reset();
        renderProducts();
    });
    
    // Cerrar modal
    if (closeButtons && closeButtons.length > 0) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Cerrando modal');
                productoModal.classList.remove('show');
                productoForm.reset();
            });
        });
    }
    
    // Cerrar modal al hacer clic fuera
    productoModal.addEventListener('click', (e) => {
        if (e.target === productoModal) {
            console.log('Cerrando modal (click fuera)');
            productoModal.classList.remove('show');
            productoForm.reset();
        }
    });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductos);
} else {
    initProductos();
}
    
