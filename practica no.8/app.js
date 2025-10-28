(function () { //
  const alumno = document.getElementById('alumno'); // Nombre del alumno
  const numMaterias = document.getElementById('numMaterias'); // Número de materias
  const crear = document.getElementById('crear'); // Botón crear materias
  const calcular = document.getElementById('calcular'); // Botón calcular
  const contenedor = document.getElementById('contenedorMaterias'); // Contenedor de materias
  const resultado = document.getElementById('resultado'); // Contenedor de resultados
  const titulo = document.getElementById('tituloResultados');
 
  // Crear los bloques de materias
  crear.addEventListener('click', function () {
    const n = parseInt(numMaterias.value, 10);
    if (!Number.isFinite(n) || n < 1) {
      alert('Indica un número válido de materias.');
      return;
    } // limpiar contenedor
    contenedor.innerHTML = '';
    for (let i = 1; i <= n; i++) {
      const div = document.createElement('div');
      div.style.border = '1px solid #ccc';
      div.style.padding = '8px';
      div.style.margin = '8px 0';
 // Título de la materia
      const titulo = document.createElement('p');
      titulo.textContent = 'Materia ' + i;
      div.appendChild(titulo);

      // Nombre de la materia
      const mLbl = document.createElement('label');
      mLbl.textContent = 'Nombre de la materia: ';
      const mInp = document.createElement('input');
      mInp.id = 'materia_' + i;
      mLbl.appendChild(mInp);
      div.appendChild(mLbl);
      div.appendChild(document.createElement('br'));

      // las 4 unidades
      for (let u = 1; u <= 4; u++) {
        const labelUnidad = document.createElement('label');
        labelUnidad.textContent = 'Unidad ' + u + ': ';

        const uInp = document.createElement('input');
        uInp.type = 'number';
        uInp.min = '0';
        uInp.max = '100';
        uInp.id = 'u' + u + '_' + i;

        labelUnidad.appendChild(uInp); // Añadir input a la etiqueta
        div.appendChild(labelUnidad);
        div.appendChild(document.createTextNode(' ')); // Añadir espacio entre inputs
      }
 // Título de la materia 
      contenedor.appendChild(div);
    }
    resultado.innerHTML = '';
    titulo.style.display = 'none';
  });

  // Calcular resultados
  calcular.addEventListener('click', function () {
    const nombre = (alumno.value || '').trim();
    if (!nombre) {
      alert('Escribe el nombre del alumno.');
      return;
    }

    const bloques = contenedor.querySelectorAll('div');
    if (bloques.length === 0) {
      alert('Primero crea las materias.');
      return;
    }
  // Generar tabla de resultados
    let html = '<table border="1" cellpadding="6"><thead><tr>' +
      '<th>Materia</th><th>U1</th><th>U2</th><th>U3</th><th>U4</th>' +
      '<th>Mínima</th><th>Promedio</th><th>Estado</th></tr></thead><tbody>';

      // Procesar cada materia
    for (let i = 1; i <= bloques.length; i++) {
      const mat = document.getElementById('materia_' + i).value.trim();
      const u1 = parseInt(document.getElementById('u1_' + i).value, 10);
      const u2 = parseInt(document.getElementById('u2_' + i).value, 10);
      const u3 = parseInt(document.getElementById('u3_' + i).value, 10);
      const u4 = parseInt(document.getElementById('u4_' + i).value, 10);
             // Validar datos
      if (!mat || [u1, u2, u3, u4].some(v => !Number.isFinite(v) || v < 0 || v > 100)) {
        alert('Verifica que todos los campos estén completos y entre 0 y 100.');
        return;
      }
       // Calcular mínima, promedio y estado
      const minima = Math.min(u1, u2, u3, u4);
      let promedio, estado;
      if (minima < 70) {
        promedio = 60;
        estado = 'No aprobado';
      } else {
        promedio = Math.round(((u1 + u2 + u3 + u4) / 4) * 100) / 100;
        estado = promedio >= 70 ? 'Aprobado' : 'No aprobado';
      }
         // Añadir fila a la tabla
      html += '<tr>' +
        '<td>' + mat + '</td>' +
        '<td>' + u1 + '</td>' +
        '<td>' + u2 + '</td>' +
        '<td>' + u3 + '</td>' +
        '<td>' + u4 + '</td>' +
        '<td>' + minima + '</td>' +
        '<td>' + promedio + '</td>' +
        '<td>' + estado + '</td>' +
      '</tr>';
    }
      // Cerrar tabla
    html += '</tbody></table>';
    titulo.textContent = 'Resultados — ' + nombre;
    titulo.style.display = '';
    resultado.innerHTML = html;
  });
})();
