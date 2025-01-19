const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';

const formUrl = 'https://forms.gle/qFUDpgGMCKNJygtd7';  
 
const columns = [0 /* Timestamp */ , 1 /* Titulo */, 2 /* Descripcion */, 3 /* Materia */ , 4 /* Link */, 5 /* Notas */ , 6 /* Autor */, 7 /* Responsable */, 8 /* Tipo */, 9 /* Grado */];

const columnsToInlcudeInOrder = [7,4,1,2,3,8,5,6,0,9];

const searchableColumns = [1, 2, 3, 5, 6, 7, 8,9];

const discordLink ='https://discord.gg/vY2nVwjj';

/* ON PAGE LOAD RUN */
document.addEventListener('DOMContentLoaded', async () => {
  await getFiltersOptions();  // Cargar filtros dinámicos
  await loadSearchFromURL();  // Ejecutar búsqueda si hay parámetros en la URL
});
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

    // 🔎 Obtener valores únicos de la columna 9 (Grado)
    const gradoOptions = [...new Set(
      jsonData.table
        .map(row => row[9]) // Columna 9
        .filter(Boolean)
        .flatMap(value => value.split(',').map(item => item.trim()))
    )];

    // 📝 Leer los parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedMaterias = (urlParams.get('3') || '').split(',').map(item => item.trim().toLowerCase());
    const selectedTipo = (urlParams.get('8') || '').toLowerCase();
    const selectedGrados = (urlParams.get('9') || '').split(',').map(item => item.trim().toLowerCase());

    // 🎯 Generar checkboxes para Materia con estilo segmented
    const materiaFilterDiv = document.getElementById('materiaFilter');

    const segmentedWrapper = document.createElement('div');
    segmentedWrapper.classList.add('segmented-control');

    materiaOptions.forEach(option => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'materiaFilter';
      checkbox.value = option;
      checkbox.id = `materia-${option}`;

      // ✅ Marcar como seleccionado si está en los parámetros de la URL
      if (selectedMaterias.includes(option.toLowerCase())) {
        checkbox.checked = true;
      }

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

      // ✅ Marcar como seleccionado si está en los parámetros de la URL
      if (option.toLowerCase() === selectedTipo) {
        selectOption.selected = true;
      }

      typeSelect.appendChild(selectOption);
    });

    dropdownWrapper.appendChild(typeSelect);
    typeFilterDiv.appendChild(dropdownWrapper);

    // 🎯 Generar checkboxes para Grado con estilo segmented
    const gradoFilterDiv = document.getElementById('gradoFilter');

    const gradoSegmentedWrapper = document.createElement('div');
    gradoSegmentedWrapper.classList.add('segmented-control');

    gradoOptions.forEach(option => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'gradoFilter';
      checkbox.value = option;
      checkbox.id = `grado-${option}`;

      // ✅ Marcar como seleccionado si está en los parámetros de la URL
      if (selectedGrados.includes(option.toLowerCase())) {
        checkbox.checked = true;
      }

      const label = document.createElement('label');
      label.htmlFor = `grado-${option}`;
      label.textContent = option;

      gradoSegmentedWrapper.appendChild(checkbox);
      gradoSegmentedWrapper.appendChild(label);
    });

    gradoFilterDiv.appendChild(gradoSegmentedWrapper);

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

function search() {
  // 🔎 Obtener el valor del input de búsqueda
  let keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  if (!keyword) {
    keyword = '{{ALL}}'; // Si no hay palabra clave, usar {{ALL}}
  }

  // 📚 Obtener materias seleccionadas (Checkboxes)
  const materiaSelected = Array.from(document.querySelectorAll('input[name="materiaFilter"]:checked'))
    .map(checkbox => checkbox.value.toLowerCase());

  // 📂 Obtener el tipo seleccionado (Dropdown)
  const tipoSelected = document.getElementById('typeSelect')?.value.toLowerCase() || '';

  // 📊 Obtener grados seleccionados (Checkboxes)
  const gradoSelected = Array.from(document.querySelectorAll('input[name="gradoFilter"]:checked'))
    .map(checkbox => checkbox.value.toLowerCase());

  // 📝 Actualizar los parámetros de la URL
  const url = new URL(window.location);

  url.searchParams.set('keyword', keyword);
  materiaSelected.length > 0 ? url.searchParams.set('3', materiaSelected.join(',')) : url.searchParams.delete('3');
  tipoSelected ? url.searchParams.set('8', tipoSelected) : url.searchParams.delete('8');
  gradoSelected.length > 0 ? url.searchParams.set('9', gradoSelected.join(',')) : url.searchParams.delete('9');

  // 🔄 Actualizar la URL sin recargar la página
  window.history.replaceState({}, '', url);

  // ✅ Recargar la página para ejecutar la búsqueda
  window.location.reload(); // Esto garantiza que la búsqueda se ejecute correctamente
}


// 🔍 Leer los parámetros de la URL y ejecutar la búsqueda
async function loadSearchFromURL() {
  const urlParams = new URLSearchParams(window.location.search);

  if (![...urlParams].length) {
    return; // No ejecutar búsqueda si no hay parámetros
  }

  const keyword = urlParams.get('keyword') || '{{ALL}}';
  const materiaParam = urlParams.get('3') || '';
  const tipoParam = urlParams.get('8') || '';
  const gradoParam = urlParams.get('9') || ''; // Nuevo parámetro para grado

  document.getElementById('searchInput').value = keyword !== '{{ALL}}' ? keyword : '';

  // 📚 Materias seleccionadas (pueden ser varias, separadas por coma)
  const materiaSelected = materiaParam ? materiaParam.split(',').map(item => item.trim().toLowerCase()) : [];

  // 📂 Tipo seleccionado
  const tipoSelected = tipoParam.toLowerCase();

  // 📊 Grados seleccionados (pueden ser varios, separados por coma)
  const gradoSelected = gradoParam ? gradoParam.split(',').map(item => item.trim().toLowerCase()) : [];

  // 🔍 Ejecutar la búsqueda con los parámetros
  await performSearch(keyword, materiaSelected, tipoSelected, gradoSelected);
}

async function performSearch(keyword, materiaSelected = [], tipoSelected = '', gradoSelected = []) {
  clearResults(); // Limpia los resultados anteriores

  // ⛔ No ejecutar búsqueda si no hay keyword
  if (!keyword) {
    console.log('🚫 No hay keyword en la URL. No se ejecuta búsqueda.');
    return;
  }

  try {
    const jsonData = await fetchSheetAsJson();

    if (!jsonData || jsonData.table.length === 0) {
      console.warn('⚠️ No se encontraron datos en la hoja.');
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      return;
    }

    console.log(`🔍 Keyword recibido: ${keyword}`);
    console.log(`📚 Materias seleccionadas: ${materiaSelected}`);
    console.log(`📂 Tipo seleccionado: ${tipoSelected}`);
    console.log(`📊 Grados seleccionados: ${gradoSelected}`);

    let filteredData;

    filteredData = {
      table: jsonData.table.filter(row => {
        // 📚 Filtrar por Materia (columna 3)
        const materiaMatch = materiaSelected.length > 0
          ? materiaSelected.some(selectedMateria =>
              (row[3] || '').toLowerCase().split(',').map(item => item.trim()).includes(selectedMateria.toLowerCase())
            )
          : true;

        // 🏷️ Filtrar por Tipo (columna 8)
        const tipoMatch = tipoSelected
          ? (row[8] || '').toLowerCase() === tipoSelected.toLowerCase()
          : true;

        // 📊 Filtrar por Grado (columna 9)
        const gradoMatch = gradoSelected.length > 0
          ? gradoSelected.some(selectedGrado =>
              (row[9] || '').toLowerCase().split(',').map(item => item.trim()).includes(selectedGrado.toLowerCase())
            )
          : true;

        // 🔍 Filtrar por palabra clave SOLO si pasó los demás filtros
        const keywordMatch = keyword === '{{ALL}}'
          ? true // Si es {{ALL}}, no filtrar por palabra clave
          : searchableColumns.some(index =>
              (row[index] || '').toLowerCase().includes(keyword.toLowerCase())
            );

        // ✅ El registro debe cumplir TODOS los filtros aplicados
        return materiaMatch && tipoMatch && gradoMatch && keywordMatch;
      }),
      tableInfo: jsonData.tableInfo
    };

    // ✅ Mostrar resultados o mensaje si no hay coincidencias
    if (filteredData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
    } else {
      console.log('✅ Resultados encontrados:', filteredData.table);
      transformJsonToTable(filteredData, columnsToInlcudeInOrder);
      syncScrollbars(); // Sincronizar scrolls
    }

  } catch (error) {
    console.error('❌ Error al realizar la búsqueda:', error);
    document.getElementById('results').innerHTML = '<p>Hubo un error al cargar los datos.</p>';
  }
}


async function performSearch(keyword, materiaSelected = [], tipoSelected = '', gradoSelected = []) {
  clearResults(); // Limpia los resultados anteriores

  // ⛔ No ejecutar búsqueda si no hay keyword
  if (!keyword) {
    console.log('🚫 No hay keyword en la URL. No se ejecuta búsqueda.');
    return;
  }

  try {
    const jsonData = await fetchSheetAsJson();

    if (!jsonData || jsonData.table.length === 0) {
      console.warn('⚠️ No se encontraron datos en la hoja.');
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      return;
    }

    console.log(`🔍 Keyword recibido: ${keyword}`);
    console.log(`📚 Materias seleccionadas: ${materiaSelected}`);
    console.log(`📂 Tipo seleccionado: ${tipoSelected}`);
    console.log(`📊 Grados seleccionados: ${gradoSelected}`);

    let filteredData;

    filteredData = {
      table: jsonData.table.filter(row => {
        // 📚 Filtrar por Materia (columna 3)
        const materiaMatch = materiaSelected.length > 0
          ? materiaSelected.some(selectedMateria =>
              (row[3] || '').toLowerCase().split(',').map(item => item.trim()).includes(selectedMateria.toLowerCase())
            )
          : true;

        // 🏷️ Filtrar por Tipo (columna 8)
        const tipoMatch = tipoSelected
          ? (row[8] || '').toLowerCase() === tipoSelected.toLowerCase()
          : true;

        // 📊 Filtrar por Grado (columna 9)
        const gradoMatch = gradoSelected.length > 0
          ? gradoSelected.some(selectedGrado =>
              (row[9] || '').toLowerCase().split(',').map(item => item.trim()).includes(selectedGrado.toLowerCase())
            )
          : true;

        // 🔍 Filtrar por palabra clave SOLO si pasó los demás filtros
        const keywordMatch = keyword === '{{ALL}}'
          ? true // Si es {{ALL}}, no filtrar por palabra clave
          : searchableColumns.some(index =>
              (row[index] || '').toLowerCase().includes(keyword.toLowerCase())
            );

        // ✅ El registro debe cumplir TODOS los filtros aplicados
        return materiaMatch && tipoMatch && gradoMatch && keywordMatch;
      }),
      tableInfo: jsonData.tableInfo
    };

    // ✅ Mostrar resultados o mensaje si no hay coincidencias
    if (filteredData.table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
    } else {
      console.log('✅ Resultados encontrados:', filteredData.table);
      transformJsonToTable(filteredData, columnsToInlcudeInOrder);
      syncScrollbars(); // Sincronizar scrolls
    }

  } catch (error) {
    console.error('❌ Error al realizar la búsqueda:', error);
    document.getElementById('results').innerHTML = '<p>Hubo un error al cargar los datos.</p>';
  }
}


function transformJsonToTable(jsonData, columnsToIncludeInOrder) {
  const { table, tableInfo } = jsonData;
  const headers = tableInfo.headers;

  // ✅ Verificar si hay datos para mostrar
  if (table.length === 0) {
    document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
    document.querySelector('.scroll-top').style.display = 'none';
    return;
  }

  // ✅ Mostrar la barra de scroll superior si hay resultados
  document.querySelector('.scroll-top').style.display = 'block';

  // 🏗️ Construir la tabla HTML
  let html = '<table id="data-table"><thead><tr>';

  // 🔍 Encabezados con inputs para filtrar
  columnsToIncludeInOrder.forEach((index, colIndex) => {
    html += `<th>
               ${headers[index]}<br>
               <input type="text" onkeyup="filterColumn(${colIndex})" placeholder="Filtrar...">
             </th>`;
  });

  html += '</tr></thead><tbody id="tableBody">';

  // 📝 Llenar las filas con los datos filtrados
  table.forEach(row => {
    html += '<tr>';
    columnsToIncludeInOrder.forEach(index => {
      if (index === 4) {
        // 🔗 Si es la columna 4, agregar link clicable
        html += `<td><a href="${row[index]}" class="button-link" target="_blank" title="Link a documento" rel="noopener noreferrer">
                  <span class="material-symbols-outlined">file_open</span>
                 </a></td>`;
          } else if (index === 7) {
            // ✉️ Si es la columna 7 (Responsable), agregar botones de correo y copiar
            const email = row[index] || '';
    
            if (email) {
              html += `<td class="responsable">
                        <button title="Enviar correo" onclick="window.location.href='mailto:${email}'">
                          <span class="material-symbols-outlined">email</span>
                        </button>
                        <button title="Copiar correo" onclick="copyToClipboard('${email}')">
                          <span class="material-symbols-outlined">content_copy</span>
                        </button>
                      </td>`;
            } else {
              html += `<td></td>`;  // Si no hay email, mostrar guion
            }
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

  // 🔍 Función para filtrar columnas
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

// 🧹 Limpia los resultados y el campo de búsqueda
function clearResultsAndInput() {
  document.getElementById('searchInput').value = '';  // Limpia el input de búsqueda
  clearResults();  // Limpia los resultados
}

// ✅ Inicializar el botón de limpiar búsqueda
function initializeClearButton() {
  const searchInput = document.getElementById('searchInput');
  const clearButton = document.getElementById('clearButton');

  if (!searchInput || !clearButton) {
    console.warn('🔍 searchInput o clearButton no encontrados en el DOM.');
    return;
  }

  // 🔍 Mostrar u ocultar el botón al escribir en el input
  searchInput.addEventListener('input', function () {
    toggleClearButton();
  });

  // ❌ Limpiar el input al hacer clic en el botón
  clearButton.addEventListener('click', function () {
    searchInput.value = '';             // Limpiar input
    toggleClearButton();                // Ocultar botón
    clearResults();                     // Limpiar resultados
  });

  // 📌 Mostrar el botón si hay parámetro 'keyword' en la URL
  toggleClearButton();
}

// 🔄 Mostrar u ocultar el botón de limpiar según el estado del input o la URL
function toggleClearButton() {
  const searchInput = document.getElementById('searchInput');
  const clearButton = document.getElementById('clearButton');
  const urlParams = new URLSearchParams(window.location.search);
  const hasKeyword = urlParams.get('keyword');

  if (searchInput.value.trim() || hasKeyword) {
    clearButton.style.display = 'inline-block';
  } else {
    clearButton.style.display = 'none';
  }
}


// 🔗 Función para abrir el formulario en una nueva pestaña
function openForm() {
  window.open(formUrl, '_blank');  // Abre el formulario en una nueva pestaña
}

function goToSearch() {
  const urlWithAnchor = window.location.href.split('#')[0] + '#buscador';
  window.open(urlWithAnchor);  // Abre el formulario en una nueva pestaña
}

function goToCommunity() {
  window.open(discordLink, '_blank');  // Abre el formulario en una nueva pestaña
}

// ✅ Inicializar el botón de compartir
function initializeShareButton() {
  const shareButton = document.getElementById('shareButton');

  if (!shareButton) {
    console.warn('🔗 shareButton no encontrado en el DOM.');
    return;
  }

  // 🔄 Mostrar u ocultar el botón según los parámetros de la URL
  toggleShareButton();

  // 📋 Copiar la URL al hacer clic en el botón
  shareButton.addEventListener('click', function () {
    const url = window.location.href;

    // 📋 Copiar la URL al portapapeles
    navigator.clipboard.writeText(url).then(() => {
      // ✅ Confirmación visual (puedes personalizar este mensaje)
      alert('🔗 ¡URL copiada al portapapeles!');
    }).catch(err => {
      console.error('❌ Error al copiar la URL:', err);
      alert('⚠️ Ocurrió un error al copiar la URL.');
    });
  });
}

// 📋 Copiar texto al portapapeles
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`📋 Correo copiado: ${text}`);
  }).catch(err => {
    console.error('❌ Error al copiar:', err);
    alert('⚠️ Ocurrió un error al copiar el correo.');
  });
}


// 🔄 Mostrar u ocultar el botón de compartir según la URL
function toggleShareButton() {
  const shareButton = document.getElementById('shareButton');
  const urlParams = new URLSearchParams(window.location.search);
  const hasKeyword = urlParams.get('keyword');

  // 🔎 Mostrar solo si hay 'keyword' en la URL
  if (hasKeyword && hasKeyword.trim() !== '') {
    shareButton.style.display = 'inline-block';
  } else {
    shareButton.style.display = 'none';
  }
}

// 🟢 Llamar la función al cargar la página
document.addEventListener('DOMContentLoaded', initializeShareButton);


// 🔎 Ejecutar búsqueda al presionar Enter en el input de búsqueda
document.getElementById('searchInput').addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    search(...searchableColumns);  // Ejecuta la búsqueda
  }
});

// 🔎 Ejecutar búsqueda solo al hacer clic en el botón de búsqueda
document.getElementById('searchButton').addEventListener('click', function() {
  search();  // Ejecuta la búsqueda
});

// ❌ Limpiar búsqueda solo al hacer clic en el botón de limpiar
document.getElementById('clearButton').addEventListener('click', function() {
  clearResultsAndInput();  // Limpia input y resultados
});

document.getElementById('currentYear').textContent = new Date().getFullYear();


document.addEventListener('DOMContentLoaded', initializeClearButton);