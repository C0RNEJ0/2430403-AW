//  Lógica del dashboard 
(function(){
  // Usamos funciones globales de auth.js para checar admin
  const user = (typeof getLoggedUser==='function') ? getLoggedUser() : null;
  const isAdmin = !!(user && (user.role==='admin' || user.isAdmin===true));

  const noAdmin = document.getElementById('bloque_no_admin');
  const cont = document.getElementById('bloque_ventas');

  if(!isAdmin){
    if(noAdmin) noAdmin.style.display = 'block';
    return;
  }
  if(cont) cont.style.display = 'block';

  // Cargar ventas y productos desde localStorage
  const ventas = (()=>{ try{ const raw = localStorage.getItem('ventas'); return raw? JSON.parse(raw): []; }catch{return [];} })();
  const productos = (()=>{ try{ const raw = localStorage.getItem('productos'); return raw? JSON.parse(raw): []; }catch{return [];} })();

  // Rellenar tabla de ventas
  const ventasBody = document.getElementById('ventas_body');
  const ventasCount = document.getElementById('ventas_contador');
  if(ventasBody) ventasBody.innerHTML = '';
  let totalIngresos = 0;
  ventas.forEach(v => {
    totalIngresos += Number(v.monto || 0);
    const fechaLocal = v.fecha ? new Date(v.fecha).toLocaleString() : ''; // Formatear fecha
    const tr = document.createElement('tr'); // Crear fila
    tr.innerHTML = ` 
      <td>${v.id || ''}</td>
      <td>${v.folio || ''}</td>
      <td>${v.cliente || ''}</td>
      <td>${fechaLocal}</td>
      <td>$${(Number(v.monto)||0).toFixed(2)}</td>
      <td><button class="btn-modal" data-id="${v.id}" onclick="window.mostrarDetallesVenta && window.mostrarDetallesVenta(${v.id})">Detalles</button></td>
    `;
    ventasBody.appendChild(tr);
  });
  if(ventasCount) ventasCount.textContent = ventas.length;
  const ventasTotalesEl = document.getElementById('ventas_totales');
  if(ventasTotalesEl) ventasTotalesEl.innerHTML = `<h3>Total de ganancias: $${totalIngresos.toFixed(2)}</h3>`;

  // Helper: productos vendidos agregados por nombre y cantidad
  function calcProductosVendidos(){
    const map = new Map();
    ventas.forEach(v => {
      (v.items || []).forEach(it => {
        const key = `${it.id || ''}`;
        const prev = map.get(key) || { id: it.id, nombre: it.nombre || '', cantidad:0, monto:0 }; // Inicializar si no existe
        prev.cantidad += Number(it.cantidad || 0);
        prev.monto += Number(it.precio || 0) * Number(it.cantidad || 0); // Monto total por ese producto
        map.set(key, prev);
      });
    });
    return Array.from(map.values()).sort((a,b)=>b.cantidad - a.cantidad);
  }

  // Graficas con el chart.js alvarado 
  const ctxProd = document.getElementById('grafica_productos') ? document.getElementById('grafica_productos').getContext('2d') : null;
  const ctxIng = document.getElementById('grafica_ingresos') ? document.getElementById('grafica_ingresos').getContext('2d') : null;
  let chartProd=null, chartIng=null;
 // Renderizar gráfica de productos vendidos
  function renderProductosChart(){
    if(!ctxProd) return; // Verificar contexto
    const data = calcProductosVendidos().slice(0,10);
    const labels = data.map(d=>d.nombre || `ID:${d.id}`);
    const values = data.map(d=>d.cantidad);
    if(chartProd) chartProd.destroy(); // Destruir gráfica previa
    chartProd = new Chart(ctxProd, { // Nueva gráfica
      type: 'bar', // Tipo barra
      data: { labels, datasets: [{ label: 'Cantidad vendida', data: values, backgroundColor: 'rgba(54,162,235,0.6)' }] }, // Datos
      options: { responsive:true } // Opciones
    });
  }
     
  
  function renderIngresosChart(modo='dia'){ // 'dia' o 'categoria'
    if(!ctxIng) return; 
    const map = new Map(); 
    ventas.forEach(v => { 
      const fecha = new Date(v.fecha || Date.now()); // Fecha de la venta
      const claveDia = fecha.toLocaleDateString(); // Clave por día
      if(modo==='dia'){                         
        const prev = map.get(claveDia) || 0; 
        map.set(claveDia, prev + Number(v.monto || 0)); // Sumar monto al día
      } else {
        (v.items||[]).forEach(it=>{ 
          const prod = productos.find(p=>String(p.id)===String(it.id));
          const cat = (prod && prod.categoria) || 'Sin categoria';
          const prev = map.get(cat) || 0;
          map.set(cat, prev + (Number(it.precio||0) * Number(it.cantidad||0)));
        });
      }
    });
    const entries = Array.from(map.entries()).sort((a,b)=> b[1]-a[1]);
    const labels = entries.map(e=>e[0]);
    const values = entries.map(e=>e[1]);
    if(chartIng) chartIng.destroy();

    // Generar colores HSL dinámicos
    const bg = values.map((_,i) => `hsl(${(i*360/Math.max(1,values.length))},70%,60%)`);
    const border = values.map(() => '#00ff0000');

    // Usamos un chart tipo 'pie' para mostrar la distribución de ingresos
    chartIng = new Chart(ctxIng, {
      type: 'pie',
      data: {
        labels, // Etiquetas
        datasets: [{ data: values, backgroundColor: bg, borderColor: border, borderWidth: 1 }]
      },
      options: { responsive:true, plugins: { legend: { position: 'bottom' } } } // Opciones
    });
  }
 
  renderProductosChart(); // Renderizar gráfica de productos vendidos
  renderIngresosChart('dia'); // Renderizar gráfica de ingresos por día

  const btnActualizar = document.getElementById('btn_actualizar_grafica'); // Botón actualizar gráfica
  if(btnActualizar) btnActualizar.addEventListener('click', ()=>{
    const modo = document.getElementById('modo_ingresos').value;
    renderIngresosChart(modo);
  });

  // Exportar CSV
  const btnCsv = document.getElementById('exportar_csv');
  if(btnCsv) btnCsv.addEventListener('click', ()=>{
    const rows = [['id','folio','cliente','fecha','monto']];
    ventas.forEach(v=> rows.push([v.id || '', v.folio || '', v.cliente || '', v.fecha || '', v.monto || 0]));
    const csv = rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'ventas.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Exportar excel
  const btnXlsx = document.getElementById('exportar_xlsx'); // Botón exportar XLSX
  if(btnXlsx) btnXlsx.addEventListener('click', ()=>{
    const wb = XLSX.utils.book_new(); // Nuevo libro
    const ventasSheet = ventas.map(v=>({ id: v.id, folio: v.folio, cliente: v.cliente, fecha: v.fecha, monto: v.monto }));
    const ws1 = XLSX.utils.json_to_sheet(ventasSheet); // Hoja de ventas
    XLSX.utils.book_append_sheet(wb, ws1, 'ventas'); // Agregar hoja ventas

    const prodVend = calcProductosVendidos().map(p=>({ id: p.id, nombre: p.nombre, cantidad: p.cantidad, monto: p.monto }));
    const ws2 = XLSX.utils.json_to_sheet(prodVend);
    XLSX.utils.book_append_sheet(wb, ws2, 'productos_vendidos');

    XLSX.writeFile(wb, 'reporte_ventas.xlsx');
  });

  // Mostrar detalles de venta 
  window.mostrarDetallesVenta = function(id){
    const venta = ventas.find(v=> String(v.id) === String(id));
    if(!venta) return alert('Venta no encontrada');
    const modal = document.getElementById('modal_detalles_venta'); //
    const detallesFolio = document.getElementById('detalles_folio');
    const detallesCliente = document.getElementById('detalles_cliente');
    const detallesFecha = document.getElementById('detalles_fecha'); //
    const itemsEl = document.getElementById('detalles_items'); if(itemsEl) itemsEl.innerHTML='';
    let total = 0; let subtotal=0; let iva=0;
    (venta.items||[]).forEach(it=>{
      if(itemsEl){
        // Detalles de los items
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${it.nombre}</td><td style="text-align:right">${it.cantidad}</td><td style="text-align:right">$${(Number(it.precio)*Number(it.cantidad)).toFixed(2)}</td>`;
        itemsEl.appendChild(tr);
      }
      total += Number(it.precio) * Number(it.cantidad);
    });
    // Mostrar totales
    const factor = 1 + (typeof IVA_RATE !== 'undefined' ? IVA_RATE : 0.16);
    subtotal = total / factor; iva = total - subtotal;
    const detallesSubtotalEl = document.getElementById('detalles_subtotal'); // Subtotal
    const detallesIvaEl = document.getElementById('detalles_iva'); // IVA
    const detallesTotalEl = document.getElementById('detalles_total'); // Total
    if(detallesFolio) detallesFolio.textContent = venta.folio || '';
    // Cliente
    if(detallesCliente) detallesCliente.textContent = venta.cliente || '';
    if(detallesFecha) detallesFecha.textContent = venta.fecha ? new Date(venta.fecha).toLocaleString() : '';
    if(detallesSubtotalEl) detallesSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if(detallesIvaEl) detallesIvaEl.textContent = `$${iva.toFixed(2)}`;
    if(detallesTotalEl) detallesTotalEl.textContent = `$${total.toFixed(2)}`;
    if(modal) modal.classList.add('show');
    const close = modal ? modal.querySelector('.close') : null; if(close) close.onclick = ()=> modal.classList.remove('show');
    if(modal) modal.addEventListener('click', function handler(e){ if(e.target===modal){ modal.classList.remove('show'); modal.removeEventListener('click', handler); } });
  };

})();
