/******************************************************
 * 1. Elementy DOM i podstawowe zmienne
 ******************************************************/
const video = document.getElementById('camera');
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const scanButton = document.getElementById('scanButton');
const colorResults = document.getElementById('colorResults');

// Ustalmy parametry rysowania siatki 3x3
const gridSize = 3;
const cellSize = canvas.width / gridSize;  // np. 360 / 3 = 120
// Ewentualnie margin, jeżeli chcesz używać innego systemu

// Ustawienia kamery
const cameraWidth = canvas.width;
const cameraHeight = canvas.height;


/******************************************************
 * 2. Uruchomienie kamery
 ******************************************************/
async function startCamera() {
  try {
    // Używamy domyślnie tylnej kamery, jeśli dostępna
    const constraints = { video: { facingMode: "environment" } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
  } catch (error) {
    console.error("Błąd dostępu do kamery:", error);
  }
}


/******************************************************
 * 3. Rysowanie siatki na canvas
 ******************************************************/
function drawGrid() {
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  for (let i = 1; i < gridSize; i++) {
    // Linie pionowe
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, canvas.height);
    ctx.stroke();
    // Linie poziome
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(canvas.width, i * cellSize);
    ctx.stroke();
  }
}


/******************************************************
 * 4. Pętla rysowania (render) - przekopiowuje obraz z <video> na <canvas>
 ******************************************************/
function renderFrame() {
  // Wyczyszczenie canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Narysowanie obrazu z kamery
  ctx.drawImage(video, 0, 0, cameraWidth, cameraHeight);

  // Narysowanie siatki
  drawGrid();

  // Kontynuacja pętli
  requestAnimationFrame(renderFrame);
}


/******************************************************
 * 5. Skanowanie koloru z "środkowego okienka"
 ******************************************************
 * W siatce 3x3 środkowe okno to:
 * - x: 1 * cellSize
 * - y: 1 * cellSize
 * Zrobimy np. próbkę 20x20 pikseli z jego środka.
 ******************************************************/
function scanCenterColor() {
  // Środek środkowego okienka
  const centerX = cellSize + cellSize / 2; // to jest środek kolumny 2
  const centerY = cellSize + cellSize / 2; // to jest środek wiersza 2

  // Zaznacz, ile pikseli wyciągamy w poziomie/pionie
  const sampleSize = 20;
  // Oblicz górny-lewy róg próbki 20x20
  const startX = centerX - sampleSize / 2;
  const startY = centerY - sampleSize / 2;

  // Pobierz dane pikseli
  const imageData = ctx.getImageData(startX, startY, sampleSize, sampleSize).data;

  // Uśrednij R, G, B
  let totalR = 0, totalG = 0, totalB = 0;
  const numPixels = sampleSize * sampleSize;
  for (let i = 0; i < imageData.length; i += 4) {
    totalR += imageData[i];
    totalG += imageData[i + 1];
    totalB += imageData[i + 2];
  }
  const avgR = totalR / numPixels;
  const avgG = totalG / numPixels;
  const avgB = totalB / numPixels;

  // Konwertuj na HSL
  const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

  // Wyświetl w colorResults
  const info = document.createElement('p');
  info.textContent = `HSL: (${h.toFixed(1)}, ${s.toFixed(1)}, ${l.toFixed(1)}) 
    / RGB: (${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`;
  colorResults.appendChild(info);
}


/******************************************************
 * 6. Konwersja RGB -> HSL
 ******************************************************/
function rgbToHsl(r, g, b) {
  r /= 255; 
  g /= 255; 
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    // Odcień i nasycenie = 0 (szarość)
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  
  // Skala: h: 0..360, s: 0..100, l: 0..100
  return [ h * 360, s * 100, l * 100 ];
}


/******************************************************
 * 7. Obsługa przycisku "Skanuj środkowy kolor"
 ******************************************************/
scanButton.addEventListener('click', () => {
  scanCenterColor();
});


/******************************************************
 * 8. Start - uruchom kamerę i zacznij renderowanie
 ******************************************************/
startCamera();
renderFrame();
