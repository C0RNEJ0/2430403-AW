// archivo: assets/js/pagos.js
// manejo de pagos con filtros por fecha y corte de caja
// todas las variables y comentarios en español junior

(function () {
  // variables globales para manejar los pagos
  let lista_pagos = [];
  let filtro_actual = {
    fecha_inicio: '',
    fecha_fin: '',
    metodo: '',
    texto_busqueda: ''
  };

  // cargar pagos desde el servidor
  async function cargar_pagos() {
    try {
      const respuesta = await fetch('../controllers/pagos.php');
      const datos = await respuesta.json();

      if (datos.exito) {
        lista_pagos = datos.datos || [];
        mostrar_pagos();
      } else {
        console.error('Error al cargar pagos:', datos.error);
      }
    } catch (error) {
      console.error('Error en la peticion de pagos:', error);
    }
  }

  // mostrar pagos en la tabla
  function mostrar_pagos() {
    const tabla_cuerpo = document.querySelector('#tabla_pagos tbody');
    if (!tabla_cuerpo) return;

    tabla_cuerpo.innerHTML = '';

    // filtrar pagos segun los criterios actuales
    const pagos_filtrados = lista_pagos.filter(pago => {
      // filtro por texto de busqueda (paciente o servicio)
      if (filtro_actual.texto_busqueda) {
        const texto = filtro_actual.texto_busqueda.toLowerCase();
        const coincide_paciente = (pago.paciente || '').toLowerCase().includes(texto);
        const coincide_servicio = (pago.servicio || '').toLowerCase().includes(texto);
        if (!coincide_paciente && !coincide_servicio) return false;
      }

      // filtro por metodo de pago
      if (filtro_actual.metodo && pago.metodo !== filtro_actual.metodo) {
        return false;
      }

      return true;
    });

    // crear filas de la tabla con los pagos filtrados
    pagos_filtrados.forEach(pago => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
                <td>${pago.fecha}</td>
                <td>${pago.paciente}</td>
                <td>${pago.medico || 'N/A'}</td>
                <td>${pago.servicio || 'N/A'}</td>
                <td>${pago.metodo || 'N/A'}</td>
                <td>$${Number(pago.monto).toFixed(2)}</td>
                <td>
                    <button class="btn-edit" data-id="${pago.pago_id}">Editar</button>
                    <button class="btn-delete" data-id="${pago.pago_id}">Borrar</button>
                </td>
            `;
      tabla_cuerpo.appendChild(fila);
    });
  }

  // filtrar pagos por rango de fechas
  async function filtrar_por_fecha() {
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const fecha_fin = document.getElementById('fecha_fin').value;
    const metodo = document.getElementById('filtro_metodo').value;

    if (!fecha_inicio || !fecha_fin) {
      alert('Por favor selecciona ambas fechas para filtrar');
      return;
    }

    try {
      let url = `../controllers/pagos.php?accion=consultar_por_fecha&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
      if (metodo) {
        url += `&metodo=${metodo}`;
      }

      const respuesta = await fetch(url);
      const datos = await respuesta.json();

      if (datos.exito) {
        lista_pagos = datos.datos || [];
        filtro_actual.metodo = metodo;
        filtro_actual.fecha_inicio = fecha_inicio;
        filtro_actual.fecha_fin = fecha_fin;
        mostrar_pagos();
      } else {
        alert('Error al filtrar pagos: ' + datos.error);
      }
    } catch (error) {
      console.error('Error al filtrar por fecha:', error);
      alert('Error al filtrar pagos');
    }
  }

  // generar corte de caja
  async function generar_corte_caja() {
    const fecha_inicio = document.getElementById('fecha_inicio').value;
    const fecha_fin = document.getElementById('fecha_fin').value;

    if (!fecha_inicio || !fecha_fin) {
      alert('Por favor selecciona el rango de fechas primero');
      return;
    }

    try {
      const url = `../controllers/pagos.php?accion=corte_caja&fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
      const respuesta = await fetch(url);
      const datos = await respuesta.json();

      if (datos.exito) {
        mostrar_modal_corte(datos.datos);
      } else {
        alert('Error al generar corte de caja: ' + datos.error);
      }
    } catch (error) {
      console.error('Error al generar corte:', error);
      alert('Error al generar corte de caja');
    }
  }

  // mostrar modal de corte de caja con los datos
  function mostrar_modal_corte(datos_corte) {
    // actualizar periodo del corte
    const periodo_texto = `${datos_corte.fecha_inicio} al ${datos_corte.fecha_fin}`;
    document.getElementById('corte_periodo').textContent = periodo_texto;

    // actualizar totales por metodo de pago
    document.getElementById('total_efectivo').textContent =
      '$' + Number(datos_corte.total_efectivo).toFixed(2);
    document.getElementById('total_tarjeta').textContent =
      '$' + Number(datos_corte.total_tarjeta).toFixed(2);
    document.getElementById('total_general').textContent =
      '$' + Number(datos_corte.total_general).toFixed(2);

    // llenar tabla de desglose con todos los pagos
    const tabla_desglose = document.getElementById('tabla_corte_desglose');
    tabla_desglose.innerHTML = '';

    datos_corte.desglose.forEach(pago => {
      const fila = document.createElement('tr');
      fila.innerHTML = `
                <td>${pago.fecha}</td>
                <td>${pago.paciente_paga}</td>
                <td>${pago.medico_recibe || 'N/A'}</td>
                <td>${pago.servicio || 'N/A'}</td>
                <td><span class="badge bg-${pago.metodo === 'efectivo' ? 'success' : 'primary'}">${pago.metodo}</span></td>
                <td>$${Number(pago.monto).toFixed(2)}</td>
            `;
      tabla_desglose.appendChild(fila);
    });

    // abrir modal de corte de caja
    abrirModal('modal_corte_caja');
  }

  // imprimir corte de caja
  function imprimir_corte() {
    window.print();
  }

  // abrir modal de nuevo pago
  function preparar_nuevo_pago() {
    // limpiar campos del formulario
    if (document.getElementById('pago_id')) {
      document.getElementById('pago_id').value = '';
    }
    if (document.getElementById('pago_fecha')) {
      document.getElementById('pago_fecha').value = new Date().toISOString().slice(0, 10);
    }
    if (document.getElementById('pago_paciente')) {
      document.getElementById('pago_paciente').value = '';
    }
    if (document.getElementById('pago_medico')) {
      document.getElementById('pago_medico').value = '';
    }
    if (document.getElementById('pago_servicio')) {
      document.getElementById('pago_servicio').value = '';
    }
    if (document.getElementById('pago_monto')) {
      document.getElementById('pago_monto').value = '';
    }
    if (document.getElementById('pago_metodo')) {
      document.getElementById('pago_metodo').value = '';
    }

    // abrir modal de pago
    const modal_elemento = document.getElementById('modal_pago');
    if (modal_elemento) {
      try {
        const modal_bootstrap = new bootstrap.Modal(modal_elemento);
        modal_bootstrap.show();
      } catch (error) {
        modal_elemento.style.display = 'block';
      }
    }
  }

  // preparar edicion de pago
  async function preparar_editar_pago(id_pago) {
    try {
      const respuesta = await fetch('../controllers/pagos.php?id=' + encodeURIComponent(id_pago));
      const datos = await respuesta.json();
      const pago = Array.isArray(datos.datos) && datos.datos.length ? datos.datos[0] : null;

      if (!pago) {
        alert('Pago no encontrado');
        return;
      }

      // llenar campos del formulario con los datos del pago
      if (document.getElementById('pago_id')) {
        document.getElementById('pago_id').value = pago.pago_id;
      }
      if (document.getElementById('pago_fecha')) {
        document.getElementById('pago_fecha').value = pago.fecha;
      }
      if (document.getElementById('pago_paciente')) {
        document.getElementById('pago_paciente').value = pago.paciente;
      }
      if (document.getElementById('pago_medico')) {
        document.getElementById('pago_medico').value = pago.medico || '';
      }
      if (document.getElementById('pago_servicio')) {
        document.getElementById('pago_servicio').value = pago.servicio || '';
      }
      if (document.getElementById('pago_monto')) {
        document.getElementById('pago_monto').value = pago.monto;
      }

      // abrir modal de pago
      const modal_elemento = document.getElementById('modal_pago');
      if (modal_elemento) {
        try {
          const modal_bootstrap = new bootstrap.Modal(modal_elemento);
          modal_bootstrap.show();
        } catch (error) {
          modal_elemento.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error al cargar pago para editar:', error);
      alert('Error al cargar el pago');
    }
  }

  // poblar selects de pacientes y medicos
  async function poblar_selects() {
    try {
      // cargar lista de pacientes
      const respuesta_pacientes = await fetch('../controllers/pacientes.php?api=listar');
      const datos_pacientes = await respuesta_pacientes.json();
      const select_paciente = document.getElementById('pago_paciente');

      if (select_paciente) {
        select_paciente.innerHTML = '';
        select_paciente.appendChild(new Option('Seleccione', ''));

        if (datos_pacientes.exito && Array.isArray(datos_pacientes.datos)) {
          datos_pacientes.datos.forEach(paciente => {
            const nombre_completo = (paciente.nombres || '') + ' ' + (paciente.apellidos || '');
            select_paciente.appendChild(new Option(nombre_completo, paciente.paciente_id));
          });
        }
      }

      // cargar lista de medicos
      const respuesta_medicos = await fetch('../controllers/medicos_list.php');
      const datos_medicos = await respuesta_medicos.json();
      const select_medico = document.getElementById('pago_medico');

      if (select_medico) {
        select_medico.innerHTML = '';
        select_medico.appendChild(new Option('Seleccione', ''));

        if (datos_medicos.exito && Array.isArray(datos_medicos.datos)) {
          datos_medicos.datos.forEach(medico => {
            select_medico.appendChild(new Option(medico.nombre || '', medico.medico_id));
          });
        }
      }
    } catch (error) {
      console.error('Error al poblar selects:', error);
    }
  }

  // borrar pago
  async function borrar_pago(id_pago) {
    if (!confirm('¿Confirmar borrar este pago?')) return;

    try {
      const datos_formulario = new FormData();
      datos_formulario.append('accion', 'eliminar');
      datos_formulario.append('id', id_pago);

      const respuesta = await fetch('../controllers/pagos.php', {
        method: 'POST',
        body: datos_formulario
      });
      const resultado = await respuesta.json();

      if (resultado && resultado.exito) {
        cargar_pagos();
      } else {
        alert('Error al borrar pago');
      }
    } catch (error) {
      console.error('Error al borrar pago:', error);
      alert('Error al borrar pago');
    }
  }

  // guardar pago (nuevo o editar)
  async function guardar_pago(evento) {
    if (evento.preventDefault) {
      evento.preventDefault();
    }

    // obtener datos del formulario
    const id_pago = document.getElementById('pago_id') ? document.getElementById('pago_id').value : '';
    const fecha = document.getElementById('pago_fecha') ? document.getElementById('pago_fecha').value : '';
    const paciente_id = document.getElementById('pago_paciente') ? document.getElementById('pago_paciente').value : '';
    const paciente_nombre = document.getElementById('pago_paciente') ? document.getElementById('pago_paciente').selectedOptions[0].text : '';
    const medico = document.getElementById('pago_medico') ? document.getElementById('pago_medico').value : '';
    const servicio = document.getElementById('pago_servicio') ? document.getElementById('pago_servicio').value.trim() : '';
    const monto = document.getElementById('pago_monto') ? parseFloat(document.getElementById('pago_monto').value) || 0 : 0;
    const cita_id = document.getElementById('pago_cita_id') ? document.getElementById('pago_cita_id').value : '';
    const metodo = document.getElementById('pago_metodo') ? document.getElementById('pago_metodo').value : '';
    const referencia = document.getElementById('pago_referencia') ? document.getElementById('pago_referencia').value : '';
    const nota = document.getElementById('pago_nota') ? document.getElementById('pago_nota').value : '';

    // validar campos requeridos
    if (!fecha || !paciente_nombre || !monto) {
      alert('Fecha, paciente y monto son requeridos');
      return;
    }

    // crear formulario para enviar
    const datos_formulario = new FormData();
    if (id_pago) {
      datos_formulario.append('id', id_pago);
    }
    datos_formulario.append('fecha', fecha);
    datos_formulario.append('paciente', paciente_nombre);
    datos_formulario.append('paciente_id', paciente_id);
    datos_formulario.append('medico', medico);
    datos_formulario.append('servicio', servicio);
    datos_formulario.append('monto', monto);
    datos_formulario.append('cita_id', cita_id);
    datos_formulario.append('metodo_pago', metodo);
    datos_formulario.append('referencia', referencia);
    datos_formulario.append('nota', nota);

    try {
      const respuesta = await fetch('../controllers/pagos.php', {
        method: 'POST',
        body: datos_formulario
      });
      const resultado = await respuesta.json();

      if (resultado && resultado.exito) {
        // cerrar modal
        const modal_elemento = document.getElementById('modal_pago');
        if (modal_elemento) {
          try {
            const modal_bootstrap = bootstrap.Modal.getInstance(modal_elemento);
            if (modal_bootstrap) {
              modal_bootstrap.hide();
            } else {
              modal_elemento.style.display = 'none';
            }
          } catch (error) {
            modal_elemento.style.display = 'none';
          }
        }

        // recargar lista de pagos
        cargar_pagos();
      } else {
        alert('Error al guardar pago: ' + (resultado && resultado.error));
      }
    } catch (error) {
      console.error('Error al guardar pago:', error);
      alert('Error al guardar pago');
    }
  }

  // conectar eventos a los botones y campos
  function conectar_eventos() {
    // boton de filtrar por fecha
    const boton_filtrar = document.getElementById('btn_filtrar');
    if (boton_filtrar && !boton_filtrar._conectado) {
      boton_filtrar.addEventListener('click', filtrar_por_fecha);
      boton_filtrar._conectado = true;
    }

    // boton de corte de caja
    const boton_corte = document.getElementById('btn_corte_caja');
    if (boton_corte && !boton_corte._conectado) {
      boton_corte.addEventListener('click', generar_corte_caja);
      boton_corte._conectado = true;
    }

    // boton de nuevo pago
    const boton_nuevo = document.getElementById('btn_nuevo_pago');
    if (boton_nuevo && !boton_nuevo._conectado) {
      boton_nuevo.addEventListener('click', preparar_nuevo_pago);
      boton_nuevo._conectado = true;
    }

    // boton de imprimir corte
    const boton_imprimir = document.getElementById('btn_imprimir_corte');
    if (boton_imprimir && !boton_imprimir._conectado) {
      boton_imprimir.addEventListener('click', imprimir_corte);
      boton_imprimir._conectado = true;
    }

    // buscador de pagos
    const buscador = document.getElementById('buscar_pagos');
    if (buscador && !buscador._conectado) {
      buscador.addEventListener('input', function () {
        filtro_actual.texto_busqueda = this.value;
        mostrar_pagos();
      });
      buscador._conectado = true;
    }

    // eventos de la tabla (editar y borrar)
    const tabla_cuerpo = document.querySelector('#tabla_pagos tbody');
    if (tabla_cuerpo && !tabla_cuerpo._conectado) {
      tabla_cuerpo.addEventListener('click', function (evento) {
        const boton = evento.target.closest('button');
        if (!boton) return;

        const id_pago = boton.getAttribute('data-id');

        if (boton.classList.contains('btn-delete')) {
          borrar_pago(id_pago);
        }
        if (boton.classList.contains('btn-edit')) {
          preparar_editar_pago(id_pago);
        }
      });
      tabla_cuerpo._conectado = true;
    }

    // formulario de pago
    const formulario = document.getElementById('form_pago');
    if (formulario && !formulario._conectado) {
      formulario.addEventListener('submit', guardar_pago);
      formulario._conectado = true;
    }
  }

  // inicializar todo cuando el DOM este listo
  async function inicializar() {
    conectar_eventos();
    await poblar_selects();
    await cargar_pagos();

    // establecer fechas por defecto (mes actual)
    const hoy = new Date();
    const primer_dia_mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const campo_fecha_inicio = document.getElementById('fecha_inicio');
    const campo_fecha_fin = document.getElementById('fecha_fin');

    if (campo_fecha_inicio) {
      campo_fecha_inicio.value = primer_dia_mes.toISOString().split('T')[0];
    }
    if (campo_fecha_fin) {
      campo_fecha_fin.value = hoy.toISOString().split('T')[0];
    }
  }

  // esperar a que el DOM este listo
  document.addEventListener('DOMContentLoaded', inicializar);
})();
