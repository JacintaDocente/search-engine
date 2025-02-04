const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';

const columns = [0 /* Timestamp */ , 1 /* Titulo */, 2 /* Descripcion */, 3 /* Materia */ , 4 /* Link */, 5 /* Notas */ , 6 /* Autor */, 7 /* Responsable */, 8 /* Tipo */, 9 /* Grado */];

const columnsToInlcudeInOrder = [7,4,1,2,3,9,8,5,6,0];

const searchableColumns = [1, 2, 3, 5, 6, 7, 8,9];


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
    try {
      const response = await fetch(sheetUrl);
      const html = await response.text();
  
      // 📌 Extraer solo la tabla del HTML sin procesar todo el documento
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');
  
      if (!table) {
        console.error("❌ No se encontró la tabla en el HTML.");
        return { table: [], tableInfo: { headers: [], totalRecords: 0 } };
      }
  
      const rows = table.querySelectorAll('tr');
      if (rows.length < 4) { // Evita procesar si hay menos de 4 filas
        return { table: [], tableInfo: { headers: [], totalRecords: 0 } };
      }
  
      // ✅ Extraer encabezados (segunda fila)
      const headers = Array.from(rows[1].querySelectorAll('td')).map(td => td.textContent.trim());
  
      // ✅ Extraer datos de la tabla, evitando la primera fila (encabezado)
      const data = [];
      const seenLinks = new Set();
  
      for (let i = 3; i < rows.length; i++) { // Comienza desde la fila 4
        const cells = Array.from(rows[i].querySelectorAll('td')).map(td => td.textContent.trim());
        
        // 📌 Evita almacenar filas vacías
        if (cells.length === 0 || !cells[4]) continue;
  
        // 🚀 Evita duplicados en la columna de enlaces (índice 4)
        if (!seenLinks.has(cells[4])) {
          seenLinks.add(cells[4]);
          data.push(cells);
        }
      }
  
      return { table: data, tableInfo: { headers, totalRecords: data.length } };
  
    } catch (error) {
      console.error("❌ Error al obtener la hoja de cálculo:", error);
      return { table: [], tableInfo: { headers: [], totalRecords: 0 } };
    }
  }
  
  
  async function search() {
    let keyword = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!keyword) {
      keyword = '{{ALL}}';
    }
  
    const materiaSelected = Array.from(document.querySelectorAll('input[name="materiaFilter"]:checked'))
      .map(checkbox => checkbox.value.toLowerCase());
  
    const tipoSelected = document.getElementById('typeSelect')?.value.toLowerCase() || '';
    const gradoSelected = Array.from(document.querySelectorAll('input[name="gradoFilter"]:checked'))
      .map(checkbox => checkbox.value.toLowerCase());
  
    const url = new URL(window.location);
    url.searchParams.set('keyword', keyword);
    materiaSelected.length > 0 ? url.searchParams.set('3', materiaSelected.join(',')) : url.searchParams.delete('3');
    tipoSelected ? url.searchParams.set('8', tipoSelected) : url.searchParams.delete('8');
    gradoSelected.length > 0 ? url.searchParams.set('9', gradoSelected.join(',')) : url.searchParams.delete('9');
  
    // ✅ ACTUALIZA LA URL SIN RECARGAR
    window.history.replaceState({}, '', url);
  
    console.log("🔄 Haciendo nueva búsqueda en Google Sheets...");
  
    // 🚀 OBTENER DATOS NUEVOS SIEMPRE
    const data = await fetchSheetAsJson();
    performSearch(keyword, materiaSelected, tipoSelected, gradoSelected, data);
  }
  
  // 🔍 Leer los parámetros de la URL y ejecutar la búsqueda
  async function loadSearchFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    if (![...urlParams].length) {
      console.log("🚫 No hay parámetros en la URL. Cargando datos sin filtros.");
      return;
    }
  
    const keyword = urlParams.get('keyword') || '{{ALL}}';
    const materiaParam = urlParams.get('3') || '';
    const tipoParam = urlParams.get('8') || '';
    const gradoParam = urlParams.get('9') || '';
  
    document.getElementById('searchInput').value = keyword !== '{{ALL}}' ? keyword : '';
  
    const materiaSelected = materiaParam ? materiaParam.split(',').map(item => item.trim().toLowerCase()) : [];
    const tipoSelected = tipoParam.toLowerCase();
    const gradoSelected = gradoParam ? gradoParam.split(',').map(item => item.trim().toLowerCase()) : [];
  
    console.log("🔄 Cargando datos desde Google Sheets para la búsqueda inicial...");
  
    // 🚀 SIEMPRE OBTENER DATOS NUEVOS
    const data = await fetchSheetAsJson();
    await performSearch(keyword, materiaSelected, tipoSelected, gradoSelected, data);
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
  
      // Función para normalizar texto (elimina acentos y convierte a minúsculas)
      const normalizeText = (text) => text
        ? text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        : '';
  
      let filteredData = {
        table: jsonData.table.filter(row => {
          // 📚 Filtrar por Materia (columna 3)
          const materiaMatch = materiaSelected.length > 0
            ? materiaSelected.some(selectedMateria =>
                (row[3] || '').split(',')
                  .map(item => normalizeText(item.trim()))
                  .includes(normalizeText(selectedMateria))
              )
            : true;
  
          // 🏷️ Filtrar por Tipo (columna 8)
          const tipoMatch = tipoSelected
            ? normalizeText(row[8] || '') === normalizeText(tipoSelected)
            : true;
  
          // 📊 Filtrar por Grado (columna 9)
          const gradoMatch = gradoSelected.length > 0
            ? gradoSelected.some(selectedGrado =>
                (row[9] || '').split(',')
                  .map(item => normalizeText(item.trim()))
                  .includes(normalizeText(selectedGrado))
              )
            : true;
  
          // 🔍 Filtrar por palabra clave SOLO si pasó los demás filtros
          const keywordMatch = keyword === '{{ALL}}'
            ? true // Si es {{ALL}}, no filtrar por palabra clave
            : searchableColumns.some(index =>
                normalizeText(row[index] || '').includes(normalizeText(keyword))
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
  
    if (table.length === 0) {
      document.getElementById('results').innerHTML = '<p>No hubo resultados para tu búsqueda.</p>';
      document.querySelector('.scroll-top').style.display = 'none';
      return;
    }
  
    document.querySelector('.scroll-top').style.display = 'block';
  
    // 📌 Usamos un `documentFragment` para optimizar el DOM
    const fragment = document.createDocumentFragment();
  
    const tableElement = document.createElement('table');
    tableElement.id = "data-table";
  
    // 📌 Construcción del encabezado
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
  
    columnsToIncludeInOrder.forEach((index, colIndex) => {
      const th = document.createElement('th');
      th.innerHTML = `${headers[index]}<br><input type="text" onkeyup="filterColumn(${colIndex})" placeholder="Filtrar...">`;
      headerRow.appendChild(th);
    });
  
    thead.appendChild(headerRow);
    tableElement.appendChild(thead);
  
    // 📌 Construcción del cuerpo de la tabla
    const tbody = document.createElement('tbody');
    tbody.id = "tableBody";
  
    table.forEach(row => {
      const tr = document.createElement('tr');
  
      columnsToIncludeInOrder.forEach(index => {
        const td = document.createElement('td');
  
        if (index === 0) {
          td.innerHTML = `${row[index]}  
          <button type="button" class="reportButton" title="Denunciar este documento" onclick='openModal(${JSON.stringify(row)})'>
            <span class="material-symbols-outlined">report</span>
          </button>`;
        } else if (index === 4) {
          td.innerHTML = `<a href="${row[index]}" class="button-link" target="_blank" title="Link a documento" rel="noopener noreferrer">
                    <span class="material-symbols-outlined">file_open</span>
                   </a>`;
        } else if (index === 7) {
          const email = row[index] || '';
          if (email) {
            td.classList.add("responsable");
            td.innerHTML = `
              <button title="Enviar correo" onclick="window.location.href='mailto:${email}'">
                <span class="material-symbols-outlined">email</span>
              </button>
              <button title="Copiar correo" onclick="copyToClipboard('${email}')">
                <span class="material-symbols-outlined">content_copy</span>
              </button>`;
          }
        } else {
          td.textContent = row[index];
        }
  
        tr.appendChild(td);
      });
  
      tbody.appendChild(tr);
    });
  
    tableElement.appendChild(tbody);
    fragment.appendChild(tableElement);
  
    // 📌 Reemplaza el contenido de `#results` de forma eficiente
    const resultsContainer = document.getElementById('results');
    resultsContainer.replaceChildren(fragment);
  
    // 📌 Ajusta el ancho de la barra de desplazamiento superior
    document.getElementById('scroll-top-sync').style.width = `${tableElement.offsetWidth}px`;
  
    // 📌 Sincronizar scrolls
    syncScrollbars();
  }

  function filterColumn(columnIndex) {
    const input = document.querySelectorAll("thead input")[columnIndex];
    const filter = input.value.toLowerCase();
    const table = document.getElementById("data-table");
    const rows = table.querySelectorAll("tbody tr");
  
    rows.forEach(row => {
      const cell = row.cells[columnIndex];
      if (cell) {
        const text = cell.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
      }
    });
  }
  