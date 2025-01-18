const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';
 
const columns = [0 /* Timestamp */ , 1 /* Titulo */, 2 /* Descripcion */, 3 /* Materia */ , 4 /* Link */, 5 /* Notas */ , 6 /* Autor */, 7 /* Responsable */, 8 /* Tipo */];

const columnsToInlcudeInOrder = [7,4,1,2,3,8,5,6,0];

const searchableColumns = [1, 2, 3, 5, 6, 7, 8]

/* ON PAGE LOAD RUN */
getFiltersOptions();
/////////////////////

async function getFiltersOptions() {
  try {
    const jsonData = await fetchSheetAsJson();

    // 🔎 Obtener valores únicos de la columna 3 (Materia)
    const materiaOptions = [...new Set(
      jsonData.table
        .map(row => row[3]) // Columna 3
        .filter(Boolean)
        .flatMap(value => value.split(',').map(item => item.trim())) // Separar por comas
    )];

    // 🔎 Obtener valores únicos de la columna 8 (Tipo)
    const typeOptions = [...new Set(
      jsonData.table
        .map(row => row[8]) // Columna 8
        .filter(Boolean)
        .flatMap(value => value.split(',').map(item => item.trim()))
    )];

    // 🎯 Generar checkboxes para Materia con estilo segmented
    const materiaFilterDiv = document.getElementById('materiaFilter');
    materiaFilterDiv.innerHTML = '';

    const segmentedWrapper = document.createElement('div');
    segmentedWrapper.classList.add('segmented-control');

    materiaOptions.forEach(option => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'materiaFilter';
      checkbox.value = option;
      checkbox.id = `materia-${option}`;

      const label = document.createElement('label');
      label.htmlFor = `materia-${option}`;
      label.textContent = option;

      segmentedWrapper.appendChild(checkbox);
      segmentedWrapper.appendChild(label);
    });

    materiaFilterDiv.appendChild(segmentedWrapper);

    // 🎯 Generar dropdown estilizado para Tipo
    const typeFilterDiv = document.getElementById('typeFilter');
    typeFilterDiv.innerHTML = '';

    const dropdownWrapper = document.createElement('div');
    dropdownWrapper.classList.add('dropdown');

    const typeSelect = document.createElement('select');
    typeSelect.id = 'typeSelect';

    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Todos los tipos';
    typeSelect.appendChild(defaultOption);

    // Opciones dinámicas
    typeOptions.forEach(option => {
      const selectOption = document.createElement('option');
      selectOption.value = option;
      selectOption.textContent = option;
      typeSelect.appendChild(selectOption);
    });

    dropdownWrapper.appendChild(typeSelect);
    typeFilterDiv.appendChild(dropdownWrapper);

  } catch (error) {
    console.error('Error al generar los filtros:', error);
  }
}


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
  if (searchIndexes.length === 0) {
    searchIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  }

  clearResults();

  function transformJsonToTable(jsonData, columnsToIncludeInOrder) {
    const { table, tableInfo } = jsonData;
    const headers = tableInfo.headers;
  
    // Verificar si hay datos para mostrar
    if (table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      
      // 🔥 Ocultar la barra de scroll superior si no hay resultados
      document.querySelector('.scroll-top').style.display = 'none';
      return;
    }
  
    // 🔥 Mostrar la barra de scroll superior si hay resultados
    document.querySelector('.scroll-top').style.display = 'block';
  
    // 🏗️ Construir la tabla HTML
    let html = '<table id="data-table"><thead><tr>';
  
    // ✅ Encabezados con inputs para filtrar
    columnsToIncludeInOrder.forEach((index, colIndex) => {
      html += `<th>
                 ${headers[index]}<br>
                 <input type="text" onkeyup="filterColumn(${colIndex})" placeholder="Filtrar...">
               </th>`;
    });
  
    html += '</tr></thead><tbody id="tableBody">';
  
    // ✅ Filas de datos
    table.forEach(row => {
      html += '<tr>';
      columnsToIncludeInOrder.forEach(index => {
        if (index === 4) {
          html += `<td><a href="${row[index]}" class="button-link" target="_blank" title="Link a documento" rel="noopener noreferrer">
                    <span class="material-symbols-outlined">file_open</span>
                   </a></td>`;
        } else {
          html += `<td>${row[index]}</td>`;
        }
      });
      html += '</tr>';
    });
  
    html += '</tbody></table>';
  
    // ✅ Mostrar la tabla en el contenedor #results
    document.getElementById('results').innerHTML = html;
  
    // 📏 Ajustar ancho del scroll superior al de la tabla
    const tableWidth = document.getElementById('data-table').offsetWidth;
    document.getElementById('scroll-top-sync').style.width = `${tableWidth}px`;
  
    // 🔍 Función para filtrar datos por columna
    window.filterColumn = function (colIndex) {
      const input = document.querySelectorAll('thead input')[colIndex];
      const filter = input.value.toLowerCase();
      const rows = document.querySelectorAll('#tableBody tr');
  
      rows.forEach(row => {
        const cell = row.cells[colIndex];
        if (cell) {
          const cellText = cell.textContent.toLowerCase();
          row.style.display = cellText.includes(filter) ? '' : 'none';
        }
      });
    };
  }
  

  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

  // 🔎 Obtener todas las materias seleccionadas
  const materiaSelected = Array.from(document.querySelectorAll('input[name="materiaFilter"]:checked'))
    .map(checkbox => checkbox.value.toLowerCase());

  // 🔎 Obtener el filtro seleccionado en Tipo (index 8)
  const tipoSelected = document.getElementById('typeSelect')?.value.toLowerCase() || '';

  try {
    const jsonData = await fetchSheetAsJson();

    if (!jsonData || jsonData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      return;
    }

    const filteredData = {
      table: jsonData.table.filter(row => {
        // ✅ Filtrar por múltiples Materias (index 3)
        const materiaMatch = materiaSelected.length > 0
          ? materiaSelected.some(selectedMateria =>
              row[3].toLowerCase().split(',').map(item => item.trim()).includes(selectedMateria)
            )
          : true;

        // ✅ Filtrar por Tipo (index 8)
        const tipoMatch = tipoSelected ? row[8].toLowerCase() === tipoSelected : true;

        // ✅ Filtrar por palabra clave
        const searchInIndexes = (materiaSelected.length || tipoSelected) ? [...searchableColumns] : searchIndexes;

        const keywordMatch = keyword
          ? searchInIndexes.some(index => (row[index] || '').toLowerCase().includes(keyword))
          : true;

        return materiaMatch && tipoMatch && keywordMatch;
      }),
      tableInfo: {
        headers: jsonData.tableInfo.headers,
        totalRecords: jsonData.table.length
      }
    };

    if (filteredData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
    } else {
      // ✅ Aplicar el orden de columnas deseado
      transformJsonToTable(filteredData, columnsToInlcudeInOrder);
      syncScrollbars();
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

function syncScrollbars() {
  const topScroll = document.querySelector('.scroll-top');
  const bottomScroll = document.querySelector('.results');
  if (!topScroll || !bottomScroll) return;

  topScroll.onscroll = () => bottomScroll.scrollLeft = topScroll.scrollLeft;
  bottomScroll.onscroll = () => topScroll.scrollLeft = bottomScroll.scrollLeft;
}

// 🔎 Ejecutar búsqueda al presionar Enter en el input de búsqueda
document.getElementById('searchInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    search(...searchableColumns);  // Ejecuta la búsqueda
  }
});

// 🔎 Ejecutar búsqueda al hacer clic en el botón de búsqueda
document.querySelector('.searchbar button').addEventListener('click', function() {
  search(...searchableColumns);  // Ejecuta la búsqueda
});

document.getElementById('currentYear').textContent = new Date().getFullYear();