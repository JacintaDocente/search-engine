const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRVyINoIo2LqaAAd8WdVhDRsSev_bu9RxuCoMznsjMd0oZ-AMCNgZ8b-7_bXPyOSVqT0lQU8qpZT6z2/pubhtml';

async function search() {
  const keyword = document.getElementById('searchInput').value.toLowerCase();
  console.log(`Buscando palabra clave: ${keyword}`);

  try {
    const response = await fetch(sheetUrl);
    const html = await response.text();
    console.log('HTML recibido:', html);

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) {
      console.error('No se encontró la tabla en el HTML.');
      document.getElementById('results').innerHTML = '<p>Error al procesar la hoja de cálculo.</p>';
      return;
    }

    const rows = Array.from(table.rows);
    console.log('Filas procesadas:', rows);

    // Encontrar los encabezados (segunda fila, excluyendo la primera columna)
    const headers = Array.from(rows[1].cells)
      .slice(1) // Omitir la primera columna
      .map(cell => cell.textContent.trim());
    console.log('Encabezados:', headers);

    // Filtrar y mostrar resultados
    displayResults(rows.slice(3), headers, keyword); // Empieza en la cuarta fila (datos reales)
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
    document.getElementById('results').innerHTML = '<p>Ocurrió un error. Por favor, inténtalo nuevamente.</p>';
  }
}

function displayResults(rows, headers, keyword) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '';

  if (rows.length === 0) {
    resultsDiv.innerHTML = '<p>No se encontraron datos en la hoja de cálculo.</p>';
    return;
  }

  let html = '<table>';
  html += '<tr>';
  headers.forEach(header => html += `<th>${header}</th>`);
  html += '</tr>';

  let resultsFound = 0;

  rows.forEach(row => {
    const cells = Array.from(row.cells)
      .slice(1) // Omitir la primera columna
      .map(cell => cell.textContent.trim());
    console.log('Celdas procesadas:', cells);

    if (cells.join(' ').toLowerCase().includes(keyword)) {
      resultsFound++;
      html += '<tr>';
      cells.forEach((cell, index) => {
        if (headers[index].toLowerCase() === 'link al documento') {
          html += `<td><a href="${cell}" target="_blank">Ver documento</a></td>`;
        } else {
          html += `<td>${cell}</td>`;
        }
      });
      html += '</tr>';
    }
  });

  if (resultsFound === 0) {
    resultsDiv.innerHTML = '<p>No se encontraron resultados para tu búsqueda.</p>';
    return;
  }

  html += '</table>';
  resultsDiv.innerHTML = html;
  console.log(`Resultados mostrados: ${resultsFound}`);
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
  