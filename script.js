const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';

async function search() {
    clearResults();
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    console.log(`Buscando palabra clave: ${keyword}`);
  
    try {
      const response = await fetch(sheetUrl);
      const html = await response.text();
  
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');
      if (!table) {
        console.error('No se encontró la tabla en el HTML.');
        document.getElementById('results').innerHTML = '<p>Error al procesar la hoja de cálculo.</p>';
        return;
      }
  
      const jsonResult = transformSheetToJson(table);
      console.log('JSON total:', jsonResult);
      const filtredJson = filterJsonByKeyword(jsonResult, keyword)

      console.log('JSON Filtrado:', filtredJson);
  
      // Mostrar la tabla en la página web
      transformJsonToTable(filtredJson, [0,1, 2, 3, 4, 5, 6, 7]); // Aquí defines las columnas a mostrar
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      document.getElementById('results').innerHTML = '<p>Ocurrió un error. Por favor, inténtalo nuevamente.</p>';
    }
}
  
function transformSheetToJson(table) {
  const rows = Array.from(table.rows);

  // Encontrar los encabezados (segunda fila, excluyendo la primera columna)
  const headers = Array.from(rows[1].cells)
    .slice(1) // Omitir la primera columna
    .map(cell => cell.textContent.trim());

  // Procesar datos de las filas (excluyendo las primeras tres filas)
  const data = rows.slice(3).map(row => {
    return Array.from(row.cells)
      .slice(1) // Omitir la primera columna
      .map(cell => cell.textContent.trim());
  });

  // Crear el JSON
  return {
    table: data,
    tableInfo: {
      headers: headers,
      totalRecords: data.length
    }
  };
}

function transformJsonToTable(json, columnsToInclude) {
    const { table, tableInfo } = json;
    const { headers } = tableInfo;
  
    // Ajustar índices de 1-based a 0-based
    const filteredHeaders = columnsToInclude.map(position => headers[position]);
    const filteredData = table.map(row =>
      columnsToInclude.map(position => row[position])
    );
  
    // Construir la tabla HTML
    let html = '<table><tr>';
  
    // Agregar encabezados
    filteredHeaders.forEach((header, index) => {
      
      if(index === 0){
        html += `<th class="center" title="fecha de creación"> <span class="material-symbols-outlined">
                    event
                  </span> </th>`;
      } else if(index === 5) {
        html += `<th class="center"> Palabras claves </th>`;
      } else {
        html += `<th>${header}</th>`;
      }
    });
  
    html += '</tr>';
  
    // Agregar filas de datos
    filteredData.forEach(row => {
      html += '<tr>';
      row.forEach((cell, index) => {
          // Si es la posición 4 (1-based), transforma en enlace
      
      if (columnsToInclude[index] === 0) {
        html += `<td>${transformToTimestamp(cell)}</td>`;
      } else if ([2, 3, 5, 6].includes(columnsToInclude[index])) {
        html += `<td> <small>${cell ? cell.toLowerCase() : ''}<small></td>`;
      } else if (columnsToInclude[index] === 4) {
        html += `<td>${transformToLink(cell)}</td>`;
      } else if ( columnsToInclude[index] === 7 ) {
        html += `<td>${transformToEmail(cell)}</td>`;
      } else {
        html += `<td>${cell ? cell.toLowerCase() : ''}</td>`;
      }
      });
      html += '</tr>';
    });
  
    html += '</table>';
  
    // Insertar la tabla en el contenedor de resultados
    document.getElementById('results').innerHTML = html;

      // Función para transformar un string en un enlace
        function transformToLink(url) {
            if (!url) return ''; // Si no hay URL, retorna cadena vacía
            return `<a href="${url}" class="button-link" target="_blank">ver documento</a>`;
        }

        function transformToEmail(email) {
            if (!email) return ''; // Si no hay email, retorna cadena vacía

            const subject = 'Consulta desde Jacinta web por tu documento';
          
            // Crear el enlace mailto con encabezados opcionales
            let mailtoLink = `mailto:${email}`;
            const params = [];
          
            if (subject) params.push(`subject=${encodeURIComponent(subject)}`);

            if (params.length > 0) {
              mailtoLink += `?${params.join('&')}`;
            }
          
            return `<a href="${mailtoLink}" title="${email}" class="icon-link"><span class="material-symbols-outlined">
            contact_mail
            </span></a>`;
        }

        function transformToTimestamp(datetime) {
            if (!datetime) return ''; // Si no hay valor, retorna cadena vacía
          
            // Separar la fecha y la hora
            const [date, time] = datetime.split(' ');
          
            // Extraer la hora sin segundos
            const timeShort = time?.slice(0, 5);
          
            // Reducir el año a los últimos dos dígitos
            const [day, month, year] = date.split('/');
            const shortYear = year?.slice(-2);
          
            // Construir el HTML
            return `
              <div class="timestamp">
                <p>
                 ${day}/${month}/${shortYear}
                </p>
                <p title="${timeShort}">
                  <span class="material-symbols-outlined">
                    schedule
                  </span>
                </p>
              </div>
            `;
          }
          
}
  

function displayResults(rows, headers, keyword) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
  
    if (rows.length === 0) {
      resultsDiv.innerHTML = '<p>No se encontraron datos en la hoja de cálculo.</p>';
      return;
    }
  
    // Inicializar los datos procesados para permitir el reordenamiento
    const processedData = rows.map(row => {
      return Array.from(row.cells)
        .slice(1) // Omitir la primera columna
        .map(cell => cell.textContent.trim());
    });
  
    let resultsFound = 0;
    let sortDirection = {}; // Guardar el estado de ordenamiento por columna
  
    function renderTable(data) {
      let html = '<table>';
      html += '<tr>';
  
      headers.forEach((header, index) => {
        const direction = sortDirection[index] === 'asc' ? '↓' : sortDirection[index] === 'desc' ? '↑' : '';
        html += `<th data-index="${index}">${header} ${direction}</th>`;
      });
  
      html += '</tr>';
  
      data.forEach(cells => {
        html += '<tr>';
        cells.forEach((cell, index) => {
          if (headers[index].toLowerCase() === 'link al documento') {
            html += `<td><a href="${cell}" target="_blank">Ver documento</a></td>`;
          } else {
            html += `<td>${cell}</td>`;
          }
        });
        html += '</tr>';
      });
  
      html += '</table>';
      resultsDiv.innerHTML = html;
    }
  
    // Ordenar los datos según la columna seleccionada
    function sortData(columnIndex) {
      const direction = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
      sortDirection[columnIndex] = direction;
  
      processedData.sort((a, b) => {
        const valueA = a[columnIndex] || '';
        const valueB = b[columnIndex] || '';
        if (direction === 'asc') {
          return valueA.localeCompare(valueB);
        } else {
          return valueB.localeCompare(valueA);
        }
      });
  
      renderTable(processedData);
    }
  
    // Filtrar las filas que coinciden con el keyword
    const filteredData = processedData.filter(cells => cells.join(' ').toLowerCase().includes(keyword));
    resultsFound = filteredData.length;
  
    if (resultsFound === 0) {
      resultsDiv.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
      return;
    }
  
    renderTable(filteredData);
  
    // Agregar evento de clic a los encabezados para ordenar
    const table = resultsDiv.querySelector('table');
    const headersElements = table.querySelectorAll('th');
  
    headersElements.forEach(th => {
      th.addEventListener('click', () => {
        const columnIndex = parseInt(th.getAttribute('data-index'));
        sortData(columnIndex);
      });
    });
  
    console.log(`Resultados mostrados: ${resultsFound}`);
  }

  function filterJsonByKeyword(json, keyword) {
    const { table, tableInfo } = json;
  
    // Filtrar las filas que contienen la palabra clave (insensible a mayúsculas)
    const filteredData = table.filter(row =>
      row.some(cell => cell.toLowerCase().includes(keyword))
    );
  
    // Retornar el JSON filtrado manteniendo los encabezados originales
    return {
      table: filteredData,
      tableInfo: {
        headers: tableInfo.headers,
        totalRecords: filteredData.length
      }
    };
  }
  

  function clearResults() {
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
      resultsDiv.innerHTML = ''; // Limpia el contenido del contenedor
    }
    console.log('Resultados limpiados.');
  }

document.getElementById('searchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      search(); // Llama a la función de búsqueda
    }
  });

function openForm() {
// Abre el formulario en una nueva pestaña
window.open('https://forms.gle/X386RJgcZksgE6rx6', '_blank');
}
  

  document.getElementById('currentYear').textContent = new Date().getFullYear();