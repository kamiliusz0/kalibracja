/******************************************************
 * 1. Elementy DOM i ustawienia
 ******************************************************/
const video = document.getElementById('camera');
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const scanButton = document.getElementById('scanButton');
const colorResults = document.getElementById('colorResults');

// Rozmiar siatki
const gridSize = 3;
const cellSize = canvas.width / gridSize;  // np. 360 / 3 = 120
// Możesz ewentualnie dodać margines (margin), ale tutaj upraszczamy

// Ustawienia kamery = wielkość płótna
const cameraWidth = canvas.width;
const cameraHeight = canvas.height;


/******************************************************
 * 2. Uruchomienie kamery
 ******************************************************/
async function startCamera() {
  try {
    // facingMode: "environment" - tylna kamera (o ile dostępna)
    const constraints = { video: { facingMode: "environment" } };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    // Niektóre przeglądarki mobilne wymagają wywołania play()
    // W teorii autoplay powinien działać, ale w praktyce czasem trzeba:
    // await video.play();
  } catch (error) {
    console.error("Błąd dostępu do kamery:", error);
  }
}


/******************************************************
 * 3. Rysowanie siatki 3x3 na canvas
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
 * 4. Główna pętla (renderFrame)
 *    Wyświetla na canvasie "ruchomy" obraz z kamery + siatkę
 ******************************************************/
function renderFrame() {
  // Wyczyść canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Narysuj aktualny obraz z kamery na canvasie
  ctx.drawImage(video, 0, 0, cameraWidth, cameraHeight);

  // Narysuj siatkę
  drawGrid();

  // Kontynuuj pętlę
  requestAnimationFrame(renderFrame);
}


/******************************************************
 * 5. Funkcja skanująca kolor ze środkowego okienka
 ******************************************************
 * - Środkowe okno w siatce 3x3 znajduje się w wierszu 1, kolumnie 1 (licząc od 0)
 * - Zrobię niewielką próbką np. 20×20 px
 ******************************************************/
function scanCenterColor() {
  // Pozycja środkowego okienka (lewy górny róg)
  const centerCellX = 1 * cellSize; // kolumna 1
  const centerCellY = 1 * cellSize; // wiersz 1
  
  // Środek tego okienka (dla próbki 20×20)
  const sampleSize = 20;
  const startX = centerCellX + cellSize/2 - sampleSize/2;
  const startY = centerCellY + cellSize/2 - sampleSize/2;

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

  // Wyświetl w div#colorResults
  const info = document.createElement('p');
  info.textContent = `HSL = (${h.toFixed(1)}, ${s.toFixed(1)}, ${l.toFixed(1)}) 
    | RGB = (${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`;
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
    s = (l > 0.5) ? d / (2 - max - min) : d / (max + min);
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

  // Przeskaluj do h:0..360, s:0..100, l:0..100
  return [ h * 360, s * 100, l * 100 ];
}


/******************************************************
 * 7. Obsługa przycisku "Skanuj"
 ******************************************************/
scanButton.addEventListener('click', () => {
  scanCenterColor();
});


/******************************************************
 * 8. Start: uruchom kamerę i render
 ******************************************************/
startCamera();
renderFrame();
