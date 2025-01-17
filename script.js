const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';
 
const columns = [0 /* Timestamp */ , 1 /* Titulo */, 2 /* Descripcion */, 3 /* Materia */ , 4 /* Link */, 5 /* Notas */ , 6 /* Autor */, 7 /* Responsable */, 8 /* Tipo */];

const columnsToInlcudeInOrder = [7,4,1,2,3,8,5,6,0];

/* ON PAGE LOAD RUN */
getFiltersOptions();
/////////////////////

async function getFiltersOptions() {
  try {
    const jsonData = await fetchSheetAsJson();

    // 🔎 Obtener valores únicos de la columna 8 (Tipo)
    const typeOptions = [...new Set(jsonData.table.map(row => row[8]).filter(Boolean))];

    // 🔎 Obtener y separar términos únicos de la columna 3(Materia separada por comas)
    const materiaOptions = [...new Set(
      jsonData.table
        .map(row => row[3])  // Extraer columna 3 (Materia)
        .filter(Boolean)     // Eliminar vacíos
        .flatMap(value => value.split(',').map(item => item.trim())) // Separar por comas y limpiar espacios
    )];

    // 🎯 Generar <select> para Tipo (índice 8)
    const typeSelect = document.getElementById('typeSelect');
    typeSelect.innerHTML = '<option value="">Todos</option>';  // Opción por defecto

    typeOptions.forEach(option => {
      const selectOption = document.createElement('option');
      selectOption.value = option;
      selectOption.textContent = option;
      typeSelect.appendChild(selectOption);
    });

    // 🎯 Generar radios para Materia (índice 4)
    const materiaFilterDiv = document.getElementById('materiaFilter');
    materiaFilterDiv.innerHTML = '';  // Limpiar contenido previo

    // Radio "Todos"
    const allRadio = document.createElement('input');
    allRadio.type = 'radio';
    allRadio.name = 'materiaFilter';
    allRadio.value = '';
    allRadio.id = 'materia-all';
    allRadio.checked = true;

    const allLabel = document.createElement('label');
    allLabel.htmlFor = 'materia-all';
    allLabel.textContent = 'Todos';

    materiaFilterDiv.appendChild(allRadio);
    materiaFilterDiv.appendChild(allLabel);
    materiaFilterDiv.appendChild(document.createElement('br'));

    // Radios dinámicos para Materia
    materiaOptions.forEach(option => {
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'materiaFilter';
      radio.value = option;
      radio.id = `materia-${option}`;

      const label = document.createElement('label');
      label.htmlFor = `materia-${option}`;
      label.textContent = option;

      materiaFilterDiv.appendChild(radio);
      materiaFilterDiv.appendChild(label);
      materiaFilterDiv.appendChild(document.createElement('br'));
    });

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

  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const materiaSelected = document.querySelector('input[name="materiaFilter"]:checked')?.value.toLowerCase() || '';
  const tipoSelected = document.getElementById('typeSelect')?.value.toLowerCase() || '';

  try {
    const jsonData = await fetchSheetAsJson();

    if (!jsonData || jsonData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      return;
    }

    const filteredData = {
      table: jsonData.table.filter(row => {
        const materiaMatch = materiaSelected
          ? row[3].toLowerCase().split(',').map(item => item.trim()).includes(materiaSelected)
          : true;

        const tipoMatch = tipoSelected ? row[8].toLowerCase() === tipoSelected : true;

        const searchInIndexes = (materiaSelected || tipoSelected) ? [1, 2, 3, 5, 6, 7, 8] : searchIndexes;

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
      transformJsonToTable(filteredData, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }

  } catch (error) {
    console.error('Error al realizar la búsqueda:', error);
    document.getElementById('results').innerHTML = '<p>Hubo un error al cargar los datos.</p>';
  }

  // Definir transformJsonToTable DENTRO de search
  function transformJsonToTable(jsonData, columnsToIncludeInOrder) {
    const { table, tableInfo } = jsonData;
    const headers = tableInfo.headers;

    const orderedHeaders = columnsToIncludeInOrder.map(index => headers[index]);
    let orderedData = table.map(row =>
      columnsToIncludeInOrder.map(index => row[index])
    );

    let html = '<table><thead><tr>';

    orderedHeaders.forEach((header, colIndex) => {
      html += `<th>
                 ${header}<br>
                 <input type="text" onkeyup="filterColumn(${colIndex})" placeholder="Filtrar...">
               </th>`;
    });

    html += '</tr></thead><tbody id="tableBody">';

    orderedData.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';

    document.getElementById('results').innerHTML = html;

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
}


function clearResults() {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';  // Limpia el contenido previo
}






document.getElementById('currentYear').textContent = new Date().getFullYear();