

const formUrl = 'https://forms.gle/qFUDpgGMCKNJygtd7';  
 

const discordLink ='https://discord.gg/QVfAYgUuFY';

// const encryptedWebhook = btoa("https://discord.com/api/webhooks/1330562664245760051/5wrLTdDLncPo83bRCiCGo-kKIa7laxh40VB6isQqDemclZ_esxHBv2tRjCNEgtdEDSMA");

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
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    return emailRegex.test(email);
  }

  document.getElementById("denunciaForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const nombre = sanitizeInput(document.getElementById("nombre").value) || "Anónimo";
    const email = sanitizeInput(document.getElementById("email").value.trim());
    const motivo = sanitizeInput(document.getElementById("motivo").value.trim());
    const detalles = sanitizeInput(document.getElementById("detalles").value);
    const data = JSON.parse(document.getElementById("dataField").value); 
    let link = data[4];

    const captcha = document.getElementById("captcha").value.trim();

    if (!email || !validateEmail(email)) {
      alert("Por favor, ingresa un correo electrónico válido.");
      return;
    }

    if (!motivo || !detalles || !link) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    if (captcha !== "7") {
      alert("Respuesta incorrecta en el CAPTCHA.");
      return;
    }

    const denuncias = JSON.parse(localStorage.getItem("denuncias")) || [];
    const now = Date.now();
    const denunciasValidas = denuncias.filter(d => now - d.timestamp < 7 * 24 * 60 * 60 * 1000);

    if (denunciasValidas.some(d => d.motivo === motivo && d.detalles === detalles)) {
      alert("Ya has enviado esta denuncia anteriormente.");
      return;
    }

    if (denunciasValidas.some(d => d.link === link)) {
      alert("Ya has denunciado ese link, estamos trabajando en ello.");
      return;
    }

    if (denunciasValidas.length >= 5) {
      alert("Has enviado más de 5 denuncias. Por favor, contáctanos directamente por correo.");
      return;
    }

    denunciasValidas.push({ motivo, detalles, link, timestamp: now });
    localStorage.setItem("denuncias", JSON.stringify(denunciasValidas));

    // 🚀 Enviar la denuncia con el link corregido
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

  // Seleccionar una pregunta al azar
  const captchaSeleccionado = preguntasCaptcha[Math.floor(Math.random() * preguntasCaptcha.length)];

  // Mostrar la pregunta en el formulario
  document.getElementById("captchaLabel").textContent = captchaSeleccionado.pregunta;

  // Guardar la respuesta correcta en el dataset del input
  document.getElementById("captcha").dataset.respuesta = captchaSeleccionado.respuesta.toLowerCase();
}

