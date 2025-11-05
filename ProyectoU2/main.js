
// Función de búsqueda de productos
function initSearch() {
    const searchInput = document.getElementById('buscador');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const productos = getProductos();
    const productsGrid = document.getElementById('lista_productos') || document.getElementById('products_container');
        
        if (!productsGrid) return;
        
        if (!query) {
            renderProducts();
            return;
        }
        
        // Filtrar productos
        const filtrados = productos.filter(p => 
            p.nombre.toLowerCase().includes(query) ||
            p.categoria.toLowerCase().includes(query)
        );
        
        // Renderizar productos filtrados
        productsGrid.innerHTML = '';
        
        if (filtrados.length === 0) {
            productsGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No se encontraron productos</p>';
            return;
        }
        
        const isAdmin = isLoggedIn();
        
        filtrados.forEach(producto => {
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
    });
}

// Cerrar modales con la tecla Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});

// Inicializar búsqueda cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
} else {
    initSearch();
}

// Log para confirmar que todos los scripts están cargados
console.log('Sistema de tienda cargado correctamente');
console.log('Autenticación inicializada');
console.log('Carrito inicializado');
console.log('Productos inicializados');
console.log('Búsqueda inicializada');
