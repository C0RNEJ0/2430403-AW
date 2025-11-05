//  - Mostrar pedidos del usuario logueado
(function(){
  if (typeof getLoggedUser !== 'function') {
    console.error('Función getLoggedUser no encontrada (auth.js)');
  }
   // Usuario actual 
  const user = (typeof getLoggedUser === 'function') ? getLoggedUser() : null;
  const container = document.getElementById('mis_pedidos_container'); // Contenedor principal
  const mensajeNoLogin = document.getElementById('mensaje_no_login'); // Mensaje para no logueados

  if (!user) {
    if (mensajeNoLogin) mensajeNoLogin.style.display = 'block'; // Mostrar mensaje de no login
    if (container) container.style.display = 'none'; // Ocultar contenedor principal
    return;
  }

  if (mensajeNoLogin) mensajeNoLogin.style.display = 'none'; // Ocultar mensaje de no login
  if (container) container.style.display = 'block';

  // Cargar ventas y filtrar por usuario
  let ventas = [];
  try { const raw = localStorage.getItem('ventas'); ventas = raw ? JSON.parse(raw) : []; } catch(e){ ventas = []; }

  // Filtrar por cliente intentar usar email o username
  const userKey = user.email || user.username || null;
  const misVentas = ventas.filter(v => {
    if (!userKey) return false;
    return (v.cliente && String(v.cliente).toLowerCase() === String(userKey).toLowerCase());
  });


  // Rellenar tabla de mis pedidos
  const body = document.getElementById('mis_pedidos_cuerpo'); // Cuerpo de la tabla
  const counter = document.querySelector('#mis_pedidos_contador'); // Contador de pedidos
  if (body) body.innerHTML = '';
  let total = 0;
  misVentas.forEach(v => { // Calcular total 
    total += Number(v.monto || 0);  // Suma del monto
    const tr = document.createElement('tr');  // Crear fila
    const fecha = v.fecha ? new Date(v.fecha).toLocaleString() : '';
    tr.innerHTML = ` 
      <td>${v.id || ''}</td>
      <td>${v.folio || ''}</td>
      <td>${fecha}</td>
      <td>$${(Number(v.monto)||0).toFixed(2)}</td>
      <td><button class="btn-modal" onclick="window.mostrarDetalleMiPedido && window.mostrarDetalleMiPedido(${v.id})">Ver</button></td>
    `;
    body.appendChild(tr);
  }); 
  if (counter) counter.textContent = misVentas.length;
  
  // Exportar mis pedidos a CSV
  const btnCsv = document.getElementById('exportar_mis_pedidos_csv');
  if (btnCsv) btnCsv.addEventListener('click', ()=>{
  const rows = [['id','folio','fecha','monto']];
    misVentas.forEach(v => rows.push([v.id || '', v.folio || '', v.fecha || '', v.monto || 0])); // Agregar filas
    const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n'); // Generar CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); // Crear blob
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mis_pedidos.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); // Clic automático para descargar
  }); 

  // Mostrar detalle 
  window.mostrarDetalleMiPedido = function(id){
    const venta = misVentas.find(v=> String(v.id) === String(id));
    if(!venta) return alert('Pedido no encontrado');
    const modal = document.getElementById('modal_detalle_mi_pedido');
    document.getElementById('mp_folio').textContent = venta.folio || ''; // Folio
    document.getElementById('mp_fecha').textContent = venta.fecha ? new Date(venta.fecha).toLocaleString() : '';
    const itemsEl = document.getElementById('mp_items'); if(itemsEl) itemsEl.innerHTML = '';
    let totalLocal = 0;

    // Detalles de los items
    (venta.items||[]).forEach(it=>{ 
      if(itemsEl){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${it.nombre}</td><td style="text-align:right">${it.cantidad}</td><td style="text-align:right">$${(Number(it.precio)*Number(it.cantidad)).toFixed(2)}</td>`;
        itemsEl.appendChild(tr);
      }
      totalLocal += Number(it.precio) * Number(it.cantidad);
    }); 
    // Calcular subtotal e IVA
    const factor = 1 + (typeof IVA_RATE !== 'undefined' ? IVA_RATE : 0.16);
    const subtotal = totalLocal / factor;
    const iva = totalLocal - subtotal;
    // Mostrar totales
    document.getElementById('mp_subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('mp_iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('mp_total').textContent = `$${totalLocal.toFixed(2)}`;
    if(modal) modal.classList.add('show');
    const close = modal ? modal.querySelector('.close') : null; if(close) close.onclick = ()=> modal.classList.remove('show');
    if(modal) modal.addEventListener('click', function handler(e){ if(e.target===modal){ modal.classList.remove('show'); modal.removeEventListener('click', handler); } });
  };

})();
