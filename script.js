

const formUrl = 'https://forms.gle/qFUDpgGMCKNJygtd7';  

const discordLink ='https://discord.gg/QVfAYgUuFY';

const webhookProxy = 'https://lingering-thunder-7aaa.jacintadocentedb.workers.dev/'

/* ON PAGE LOAD RUN */
document.addEventListener('DOMContentLoaded', async () => {
  await getFiltersOptions();  // Cargar filtros dinámicos
  await loadSearchFromURL();  // Ejecutar búsqueda si hay parámetros en la URL
  await initializeForm();
});
/////////////////////



// 🔗 Función para abrir el formulario en una nueva pestaña
function openForm() {
  window.open(formUrl, '_blank');  // Abre el formulario en una nueva pestaña
}

function goToSearch() {
  const urlWithAnchor = window.location.href.split('#')[0] + '#buscador';
  window.location.href = urlWithAnchor; // Redirige al ancla en la misma pestaña
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
      alert('🔗 ¡URL con los filtros de busqueda copiada al portapapeles!');
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

function openModal(data) {
  // Mostrar el modal
  const modal = document.getElementById("modal");
  modal.classList.add("active");

  // Actualizar el campo de solo lectura con una representación legible
  const detallesField = document.getElementById("detalles");
  detallesField.value = `
    Fecha y Hora: ${data[0]}
    Título: ${data[1]}
    Descripción: ${data[2]}
    Materia: ${data[3]}
    Link: ${data[4]}
    Notas: ${data[5]}
    Autor: ${data[6]}
    Responsable: ${data[7]}
    Tipo: ${data[8]}
    Grado: ${data[9]}
  `.trim();

  // Guardar los datos originales en el campo oculto
  const dataField = document.getElementById("dataField");
  dataField.value = JSON.stringify(data);

  // ✅ Generar CAPTCHA cada vez que se abre el modal
  generateCaptcha();
}


document.getElementById("closeModalButton").addEventListener("click", () => {
  const modal = document.getElementById("modal");
  modal.classList.remove("active");
});


function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}


// 🟢 Llamar la función al cargar la página
document.addEventListener('DOMContentLoaded', initializeShareButton);

document.getElementById('currentYear').textContent = new Date().getFullYear();


function initializeForm() {
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  generateCaptcha(); // ✅ Generar el CAPTCHA al inicializar el formulario

  document.getElementById("denunciaForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = sanitizeInput(document.getElementById("nombre").value) || "Anónimo";
    const email = sanitizeInput(document.getElementById("email").value.trim());
    const motivo = sanitizeInput(document.getElementById("motivo").value.trim());
    const detalles = sanitizeInput(document.getElementById("detalles").value);
    const data = JSON.parse(document.getElementById("dataField").value); 
    let link = data[4];

    const captchaInput = document.getElementById("captcha").value.trim().toLowerCase();
    const captchaCorrecto = document.getElementById("captcha").dataset.respuesta.trim().toLowerCase();

    if (!email || !validateEmail(email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (!motivo || !detalles || !link) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    if (captchaInput !== captchaCorrecto) {
      alert("Respuesta incorrecta en el CAPTCHA. Inténtalo de nuevo.");
      generateCaptcha(); // ✅ Generar una nueva pregunta si la respuesta es incorrecta
      return;
    }

    sendReport(nombre, email, motivo, detalles, link);
  });
}


async function sendReport(nombre, email, motivo, detalles, link) {
  try {
    const payload = {
      content: "📢 **Nueva denuncia recibida**",
      embeds: [
        {
          title: "Detalles de la Denuncia",
          fields: [
            { name: "👤 Nombre", value: nombre || "Anónimo", inline: true },
            { name: "📧 Correo", value: email, inline: true },
            { name: "✍️ Motivo", value: motivo, inline: false },
            { name: "📄 Detalles del Documento", value: `\`\`\`${detalles}\`\`\``, inline: false },
            { name: "🗂️ Link del Documento", value: `[Abrir Documento](${link})`, inline: false }
          ],
          color: 16711680
        }
      ]
    };

    const response = await fetch(webhookProxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert("Denuncia enviada con éxito.");
      document.getElementById("modal").classList.remove("active");
      document.getElementById("denunciaForm").reset();
    } else {
      alert("Error al enviar la denuncia. Código de estado: " + response.status);
    }
  } catch (error) {
    console.error("Error al enviar la denuncia:", error);
    alert("Ocurrió un error inesperado. Inténtalo nuevamente.");
  }
}


function sanitizeInput(input) {
  return input.replace(/[<>\/]/g, '').trim(); // Elimina caracteres peligrosos y espacios extra
}

function generateCaptcha() {
  const preguntasCaptcha = [
    { pregunta: "¿Cuánto es 3 + 4?", respuesta: "7" },
    { pregunta: "¿Cuánto es 5 - 2?", respuesta: "3" },
    { pregunta: "Escribe la primera letra de 'Hola'", respuesta: "h" },
    { pregunta: "¿Cuál es el último número de '12345'?", respuesta: "5" },
    { pregunta: "¿Cuántas vocales tiene la palabra 'auto'?", respuesta: "3" }
  ];

  const captchaSeleccionado = preguntasCaptcha[Math.floor(Math.random() * preguntasCaptcha.length)];
  const captchaLabel = document.getElementById("captchaLabel");

  if (captchaLabel) {
    captchaLabel.textContent = captchaSeleccionado.pregunta; // ✅ Actualizar la pregunta en el label
    document.getElementById("captcha").dataset.respuesta = captchaSeleccionado.respuesta.toLowerCase();
  } else {
    console.error("❌ No se encontró captchaLabel en el DOM.");
  }
}


document.getElementById("suggestionForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("suggestionEmail").value.trim();
  const suggestion = document.getElementById("suggestionText").value.trim();

  if (!suggestion) {
    alert("Por favor, ingresa una sugerencia.");
    return;
  }

  const payload = {
    content: "📩 **Nueva sugerencia recibida**",
    embeds: [
      {
        title: "Sugerencia",
        fields: [
          { name: "📧 Correo", value: email || "Anónimo", inline: true },
          { name: "💡 Sugerencia", value: suggestion, inline: false }
        ],
        color: 3447003
      }
    ]
  };

  const webhookURL = "https://black-king-ae02.jacintadocentedb.workers.dev/";

  try {
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert("Sugerencia enviada con éxito.");
      document.getElementById("suggestionForm").reset();
      document.getElementById("suggestionModal").classList.remove("active");
    } else {
      alert("Error al enviar la sugerencia. Código de estado: " + response.status);
    }
  } catch (error) {
    console.error("Error al enviar la sugerencia:", error);
    alert("Ocurrió un error inesperado. Inténtalo nuevamente.");
  }
});

