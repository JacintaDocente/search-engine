const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';
 
const columns = [0 /* Timestamp */ , 1 /* Titulo */, 2 /* Descripcion */, 3 /* Materia */ , 4 /* Link */, 5 /* Notas */ , 6 /* Autor */, 7 /* Responsable */, 8 /* Tipo */];

const columnsToInlcudeInOrder = [7,4,1,2,3,8,5,6,0];


// Función principal para obtener y convertir los datos
async function fetchSheetAsJson() {
  // Paso 1: Convertir HTML a JSON solo con los datos de la tabla
  function parseHtmlTableToJson(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tableElement = doc.querySelector('table');

    if (!tableElement) {
      console.error('No se encontró la tabla en el HTML.');
      return { table: [] };
    }

    // Extraer los datos (a partir de la cuarta fila)
    const data = Array.from(tableElement.rows)
      .slice(3)  // Omitir encabezados
      .map(row =>
        Array.from(row.cells)
          .slice(1)  // Omitir la primera columna si es necesario
          .map(cell => cell.textContent.trim())
      );

    return { table: data };
  }

  // 🔥 Paso 2: Eliminar enlaces duplicados en la columna 4
  function removeDuplicateLinks(jsonData) {
    const seenLinks = new Set();
    const filteredData = jsonData.table.filter(row => {
      const link = row[4];  // Columna 4 (índice 4)
      if (link && !seenLinks.has(link)) {
        seenLinks.add(link);
        return true;  // Mantener el primer enlace
      }
      return false;  // Omitir duplicados
    });

    return { table: filteredData };
  }

  // Paso 3: Agregar tableInfo con encabezados y total de registros
  function addTableInfo(jsonData, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tableElement = doc.querySelector('table');

    if (!tableElement) {
      console.error('No se pudo obtener los encabezados.');
      jsonData.tableInfo = { headers: [], totalRecords: 0 };
      return jsonData;
    }

    // Extraer encabezados (segunda fila)
    const headers = Array.from(tableElement.rows[1].cells)
      .slice(1)
      .map(cell => cell.textContent.trim());

    jsonData.tableInfo = {
      headers: headers,
      totalRecords: jsonData.table.length
    };

    return jsonData;
  }

  // 🔄 Proceso principal
  try {
    const response = await fetch(sheetUrl);
    const html = await response.text();

    // Paso 1: Obtener los datos
    let jsonData = parseHtmlTableToJson(html);

    // 🔥 Paso 2: Eliminar enlaces duplicados
    jsonData = removeDuplicateLinks(jsonData);

    // Paso 3: Agregar tableInfo
    jsonData = addTableInfo(jsonData, html);

    return jsonData;

  } catch (error) {
    console.error('Error al obtener la hoja de cálculo:', error);
    return { table: [], tableInfo: { headers: [], totalRecords: 0 } };
  }
}

async function search(...searchIndexes) {
  // Si no se pasan índices, buscar en todas las columnas
  if (searchIndexes.length === 0) {
    searchIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  }

  // Limpiar resultados previos
  clearResults();

  function transformJsonToTable(jsonData, columnsToIncludeInOrder) {
    const { table, tableInfo } = jsonData;
    const headers = tableInfo.headers;
  
    // 🔄 Reorganizar los encabezados según columnsToIncludeInOrder
    const orderedHeaders = columnsToIncludeInOrder.map(index => headers[index]);
  
    // 🔄 Reorganizar los datos según columnsToIncludeInOrder
    const orderedData = table.map(row =>
      columnsToIncludeInOrder.map(index => row[index])
    );
  
    // 🏗️ Construir la tabla HTML
    let html = '<table><thead><tr>';
  
    // Encabezados de la tabla
    orderedHeaders.forEach(header => {
      html += `<th>${header}</th>`;
    });
  
    html += '</tr></thead><tbody>';
  
    // Filas de datos
    orderedData.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
  
    html += '</tbody></table>';
  
    // Mostrar la tabla en el contenedor #results
    document.getElementById('results').innerHTML = html;
  }
  

  // Obtener el término de búsqueda
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

  if (!keyword) {
    document.getElementById('results').innerHTML = '<p>Por favor, ingresa un término de búsqueda.</p>';
    return;
  }

  try {
    // Paso 1: Obtener los datos
    const jsonData = await fetchSheetAsJson();

    // Paso 2: Manejar errores o falta de resultados
    if (!jsonData || jsonData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      return;
    }

    // Paso 3: Filtrar los datos por palabra clave en los índices indicados
    const filteredData = (function filterJsonByKeyword() {
      return {
        table: jsonData.table.filter(row =>
          searchIndexes.some(index =>
            (row[index] || '').toLowerCase().includes(keyword)
          )
        ),
        tableInfo: {
          headers: jsonData.tableInfo.headers,
          totalRecords: jsonData.table.filter(row =>
            searchIndexes.some(index =>
              (row[index] || '').toLowerCase().includes(keyword)
            )
          ).length
        }
      };
    })();

    // Paso 4: Mostrar resultados o mensaje si no hay coincidencias
    if (filteredData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
    } else {
      // 🔥 Aquí trabajamos directamente con el JSON filtrado
      console.log('JSON Filtrado:', filteredData);

      transformJsonToTable(filteredData, columnsToInlcudeInOrder)
    }

  } catch (error) {
    console.error('Error al realizar la búsqueda:', error);
    document.getElementById('results').innerHTML = '<p>Hubo un error al cargar los datos.</p>';
  }
}


function clearResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';  // Limpia el contenido previo
}




// async function search(...searchIndexes) {
//   if (searchIndexes.length === 0) {
//     searchIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
//   }

//   clearResults();
//   const keyword = document.getElementById('searchInput').value.toLowerCase();
//   console.log(`Buscando palabra clave: ${keyword}`);

//   try {
//     const response = await fetch(sheetUrl);
//     const html = await response.text();

//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, 'text/html');
//     const table = doc.querySelector('table');
//     if (!table) {
//       console.error('No se encontró la tabla en el HTML.');
//       document.getElementById('results').innerHTML = '<p>Error al procesar la hoja de cálculo.</p>';
//       return;
//     }

//     const jsonResult = transformSheetToJson(table, columnsToInclude, columnOrder );
//     console.log('JSON total:', jsonResult);
//     const filtredJson = filterJsonByKeyword(jsonResult, keyword, searchIndexes);

//     console.log('JSON Filtrado:', filtredJson);

//     // Mostrar la tabla completa sin afectar las columnas
//     transformJsonToTable(filtredJson, );
//   } catch (error) {
//     console.error('Error al realizar la solicitud:', error);
//     document.getElementById('results').innerHTML = '<p>Ocurrió un error. Por favor, inténtalo nuevamente.</p>';
//   }
// }

// function filterJsonByKeyword(json, keyword, searchIndexes) {
//   const { table, tableInfo } = json;

//   const filteredData = table.filter(row =>
//     searchIndexes.some(index => (row[index] || '').toLowerCase().includes(keyword))
//   );

//   return {
//     table: filteredData,
//     tableInfo: {
//       headers: tableInfo.headers,
//       totalRecords: filteredData.length
//     }
//   };
// }


// function transformSheetToJson(table) {
//   const rows = Array.from(table.rows);
//   const headers = Array.from(rows[1].cells)
//     .slice(1)
//     .map(cell => cell.textContent.trim());

//   const seenLinks = new Set();
//   const data = [];

//   rows.slice(4).forEach(row => {
//     const rowData = Array.from(row.cells)
//       .slice(1)
//       .map(cell => cell.textContent.trim());
//     const link = rowData[4];

//     if (link && !seenLinks.has(link)) {
//       seenLinks.add(link);
//       data.push(rowData); 
//     }
//   });

//   return {
//     table: data,
//     tableInfo: {
//       headers: headers,
//       totalRecords: data.length
//     }
//   };
// }

// function transformJsonToTable(json, columnsToInclude, columnOrder) {
//     const { table, tableInfo } = json;
//     const { headers } = tableInfo;
  
//     // Ajustar índices de 1-based a 0-based
//     const filteredHeaders = columnsToInclude.map(position => headers[position]);
//     const filteredData = table.map(row =>
//       columnsToInclude.map(position => row[position])
//     );
  
//     // Construir la tabla HTML
//     let html = '<table><tr>';
  
//     // Agregar encabezados
//     filteredHeaders.forEach((header, index) => {
      
//       if(index === 0){
//         html += `<th class="center" title="fecha de creación"> <span class="material-symbols-outlined">
//                     event
//                   </span> </th>`;
//       } else {
//         html += `<th>${header}</th>`;
//       }
//     });
  
//     html += '</tr>';
  
//     // Agregar filas de datos
//     filteredData.forEach(row => {
//       html += '<tr>';
//       row.forEach((cell, index) => {
//           // Si es la posición 4 (1-based), transforma en enlace
      
//       if (columnsToInclude[index] === 0) {
//         html += `<td>${transformToTimestamp(cell)}</td>`;
//       } else if ([2, 3, 5, 6].includes(columnsToInclude[index])) {
//         html += `<td> <small>${cell ? cell.toLowerCase() : ''}<small></td>`;
//       } else if (columnsToInclude[index] === 4) {
//         html += `<td>${transformToLink(cell)}</td>`;
//       } else if ( columnsToInclude[index] === 7 ) {
//         html += `<td>${transformToEmail(cell)}</td>`;
//       } else {
//         html += `<td>${cell ? cell.toLowerCase() : ''}</td>`;
//       }
//       });
//       html += '</tr>';
//     });
  
//     html += '</table>';
  
//     // Insertar la tabla en el contenedor de resultados
//     document.getElementById('results').innerHTML = html;

//       // Función para transformar un string en un enlace
//         function transformToLink(url) {
//             if (!url) return ''; // Si no hay URL, retorna cadena vacía
            
//             return `<a href="${url}" class="button-link" target="_blank">ver documento</a>`;
//         }

//         function transformToEmail(email) {
//             if (!email) return ''; // Si no hay email, retorna cadena vacía

//             const subject = 'Consulta desde Jacinta web por tu documento';
          
//             // Crear el enlace mailto con encabezados opcionales
//             let mailtoLink = `mailto:${email}`;
//             const params = [];
          
//             if (subject) params.push(`subject=${encodeURIComponent(subject)}`);

//             if (params.length > 0) {
//               mailtoLink += `?${params.join('&')}`;
//             }
          
//             return `<a href="${mailtoLink}" title="${email}" class="icon-link"><span class="material-symbols-outlined">
//             contact_mail
//             </span></a>`;
//         }

//         function transformToTimestamp(datetime) {
//             if (!datetime) return ''; // Si no hay valor, retorna cadena vacía
          
//             // Separar la fecha y la hora
//             const [date, time] = datetime.split(' ');
          
//             // Extraer la hora sin segundos
//             const timeShort = time?.slice(0, 5);
          
//             // Reducir el año a los últimos dos dígitos
//             const [day, month, year] = date.split('/');
//             const shortYear = year?.slice(-2);
          
//             // Construir el HTML
//             return `
//               <div class="timestamp">
//                 <p>
//                  ${day}/${month}/${shortYear}
//                 </p>
//                 <p title="${timeShort}">
//                   <span class="material-symbols-outlined">
//                     schedule
//                   </span>
//                 </p>
//               </div>
//             `;
//           }
          
// }
  

// function displayResults(rows, headers, keyword) {
//     const resultsDiv = document.getElementById('results');
//     resultsDiv.innerHTML = '';
  
//     if (rows.length === 0) {
//       resultsDiv.innerHTML = '<p>No se encontraron datos en la hoja de cálculo.</p>';
//       return;
//     }
  
//     // Inicializar los datos procesados para permitir el reordenamiento
//     const processedData = rows.map(row => {
//       return Array.from(row.cells)
//         .slice(1) // Omitir la primera columna
//         .map(cell => cell.textContent.trim());
//     });
  
//     let resultsFound = 0;
//     let sortDirection = {}; // Guardar el estado de ordenamiento por columna
  
//     function renderTable(data) {
//       let html = '<table>';
//       html += '<tr>';
  
//       headers.forEach((header, index) => {
//         const direction = sortDirection[index] === 'asc' ? '↓' : sortDirection[index] === 'desc' ? '↑' : '';
//         html += `<th data-index="${index}">${header} ${direction}</th>`;
//       });
  
//       html += '</tr>';
  
//       data.forEach(cells => {
//         html += '<tr>';
//         cells.forEach((cell, index) => {
//           if (headers[index].toLowerCase() === 'link al documento') {
//             html += `<td><a href="${cell}" target="_blank">Ver documento</a></td>`;
//           } else {
//             html += `<td>${cell}</td>`;
//           }
//         });
//         html += '</tr>';
//       });
  
//       html += '</table>';
//       resultsDiv.innerHTML = html;
//     }
  
//     // Ordenar los datos según la columna seleccionada
//     function sortData(columnIndex) {
//       const direction = sortDirection[columnIndex] === 'asc' ? 'desc' : 'asc';
//       sortDirection[columnIndex] = direction;
  
//       processedData.sort((a, b) => {
//         const valueA = a[columnIndex] || '';
//         const valueB = b[columnIndex] || '';
//         if (direction === 'asc') {
//           return valueA.localeCompare(valueB);
//         } else {
//           return valueB.localeCompare(valueA);
//         }
//       });
  
//       renderTable(processedData);
//     }
  
//     // Filtrar las filas que coinciden con el keyword
//     const filteredData = processedData.filter(cells => cells.join(' ').toLowerCase().includes(keyword));
//     resultsFound = filteredData.length;
  
//     if (resultsFound === 0) {
//       resultsDiv.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
//       return;
//     }
  
//     renderTable(filteredData);
  
//     // Agregar evento de clic a los encabezados para ordenar
//     const table = resultsDiv.querySelector('table');
//     const headersElements = table.querySelectorAll('th');
  
//     headersElements.forEach(th => {
//       th.addEventListener('click', () => {
//         const columnIndex = parseInt(th.getAttribute('data-index'));
//         sortData(columnIndex);
//       });
//     });
  
//     console.log(`Resultados mostrados: ${resultsFound}`);
//   }

//   function filterJsonByKeyword(json, keyword) {
//     const { table, tableInfo } = json;
  
//     // Filtrar las filas que contienen la palabra clave (insensible a mayúsculas)
//     const filteredData = table.filter(row =>
//       row.some(cell => cell.toLowerCase().includes(keyword))
//     );
  
//     // Retornar el JSON filtrado manteniendo los encabezados originales
//     return {
//       table: filteredData,
//       tableInfo: {
//         headers: tableInfo.headers,
//         totalRecords: filteredData.length
//       }
//     };
//   }
  

//   function clearResults() {
//     const resultsDiv = document.getElementById('results');
//     if (resultsDiv) {
//       resultsDiv.innerHTML = ''; // Limpia el contenido del contenedor
//     }
//     console.log('Resultados limpiados.');
//   }


// document.getElementById('searchInput').addEventListener('keydown', (event) => {
//     if (event.key === 'Enter') {
//       search(); // Llama a la función de búsqueda
//     }
//   });

// function openForm() {
// // Abre el formulario en una nueva pestaña
// window.open('https://forms.gle/X386RJgcZksgE6rx6', '_blank');
// }



document.getElementById('currentYear').textContent = new Date().getFullYear();