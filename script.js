let colorStops = [];
const defaultColors = ['#ff0000', '#0000ff'];
let interpolationType = 'linear';

// Aggiungi queste variabili all'inizio del file
let rect = { x: 0, y: 0, width: 0, height: 0 };
let isDrawing = false;
let isDragging = false;
let selectedHandle = null;
let startX, startY;
let imageCanvas, drawingCanvas, imgCtx, drawCtx;

let currentRect = null;
let gridRows = 2;
let gridCols = 2;

document.addEventListener('DOMContentLoaded', () => {
    // Inizializza con due colori predefiniti agli estremi
    defaultColors.forEach((color, index) => {
        addColorStop(color, index === 0 ? 0 : 1);
    });
    updateGradient();

    // Aggiungi l'event listener al color picker
    document.getElementById('colorPicker').addEventListener('input', function(e) {
        const coloreSelezionato = e.target.value;
        const gradientColors = getGradientColors();
        const minValue = parseFloat(document.getElementById('leftValue').value);
        const maxValue = parseFloat(document.getElementById('rightValue').value);
        
        const valore = calcolaValore(coloreSelezionato);
        
        // Aggiorna il display con il valore calcolato
        document.getElementById('valorePosizione').textContent = valore;
    });

    // Gestione caricamento immagine
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    imageInput.addEventListener('change', handleImageUpload);

    // Aggiungi dopo l'inizializzazione degli altri event listener
    document.getElementById('grid-rows').addEventListener('change', function(e) {
        gridRows = parseInt(e.target.value) || 2;
        if (currentRect) {
            drawRect();
        }
    });

    document.getElementById('grid-cols').addEventListener('change', function(e) {
        gridCols = parseInt(e.target.value) || 2;
        if (currentRect) {
            drawRect();
        }
    });
});

// Funzione per ottenere i colori del gradiente
function getGradientColors() {
    const colorStops = document.querySelectorAll('.color-stop input[type="color"]');
    if (colorStops.length < 2) {
        return {
            left: '#ff0000',
            right: '#0000ff'
        };
    }
    return {
        left: colorStops[0].value,
        right: colorStops[colorStops.length - 1].value
    };
}

// Funzione per calcolare la distanza tra due colori esadecimali con maggiore precisione
function colorDistance(hex1, hex2) {
    const r1 = parseInt(hex1.slice(1, 3), 16);
    const g1 = parseInt(hex1.slice(3, 5), 16);
    const b1 = parseInt(hex1.slice(5, 7), 16);
    
    const r2 = parseInt(hex2.slice(1, 3), 16);
    const g2 = parseInt(hex2.slice(3, 5), 16);
    const b2 = parseInt(hex2.slice(5, 7), 16);
    
    // Usiamo una formula più sensibile che considera la percezione umana del colore
    const deltaR = r1 - r2;
    const deltaG = g1 - g2;
    const deltaB = b1 - b2;
    
    // Formula di distanza colore migliorata
    return Math.sqrt(
        (2 + (r1 + r2) / 256) * deltaR * deltaR +
        4 * deltaG * deltaG +
        (2 + (255 - (r1 + r2) / 256)) * deltaB * deltaB
    );
}

// Funzione per calcolare il valore in base al colore selezionato con maggiore sensibilità
function calcolaValore(coloreSelezionato) {
    // Ottieni tutti i colori del gradiente
    const gradientColors = colorStops.map(stop => stop.color);
    
    // Trova l'indice del colore selezionato
    const index = gradientColors.indexOf(coloreSelezionato);
    
    if (index === -1) {
        // Se il colore non è esattamente presente, trova il colore più vicino
        let closestIndex = 0;
        let minDistance = Infinity;
        let secondClosestIndex = 0;
        let secondMinDistance = Infinity;
        
        // Trova i due colori più vicini
        gradientColors.forEach((color, i) => {
            const distance = colorDistance(coloreSelezionato, color);
            if (distance < minDistance) {
                secondMinDistance = minDistance;
                secondClosestIndex = closestIndex;
                minDistance = distance;
                closestIndex = i;
            } else if (distance < secondMinDistance) {
                secondMinDistance = distance;
                secondClosestIndex = i;
            }
        });
        
        // Calcola la posizione interpolata tra i due colori più vicini
        const totalDistance = minDistance + secondMinDistance;
        const weight1 = (totalDistance - minDistance) / totalDistance;
        const weight2 = (totalDistance - secondMinDistance) / totalDistance;
        
        const position1 = closestIndex / (gradientColors.length - 1);
        const position2 = secondClosestIndex / (gradientColors.length - 1);
        
        const interpolatedPosition = (position1 * weight1 + position2 * weight2);
        
        return Math.round(interpolatedPosition * 100);
    }
    
    // Calcola il valore in base alla posizione del colore
    return Math.round((index / (gradientColors.length - 1)) * 100);
}

function addColorStop(color = '#ff0000', position = null) {
    const colorStop = {
        color: color,
        position: position
    };
    colorStops.push(colorStop);
    
    // Ricalcola le posizioni per mantenere i colori equidistanti
    updateColorPositions();
    
    // Crea il color picker
    const colorStopsContainer = document.querySelector('.color-stops');
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = color;
    colorPicker.className = 'color-stop';
    
    // Aggiorna solo il colore, non la posizione
    colorPicker.addEventListener('input', (e) => {
        colorStop.color = e.target.value;
        updateGradient();
    });
    
    colorStopsContainer.appendChild(colorPicker);
    updateColorPickersPosition();
    updateGradient();
}

function removeColorStop() {
    if (colorStops.length > 2) {
        // Rimuovi solo i colori intermedi, mai il primo o l'ultimo
        colorStops.splice(colorStops.length - 2, 1);
        const colorStopsContainer = document.querySelector('.color-stops');
        colorStopsContainer.removeChild(colorStopsContainer.children[colorStops.length - 1]);
        
        updateColorPositions();
        updateColorPickersPosition();
        updateGradient();
    }
}

function updateColorPositions() {
    // Mantieni il primo e l'ultimo colore fissi a 0 e 1
    colorStops.forEach((stop, index) => {
        if (index === 0) {
            stop.position = 0;
        } else if (index === colorStops.length - 1) {
            stop.position = 1;
        } else {
            // Distribuisci uniformemente i colori intermedi
            stop.position = index / (colorStops.length - 1);
        }
    });
}

function updateColorPickersPosition() {
    const colorStopsContainer = document.querySelector('.color-stops');
    const colorPickers = colorStopsContainer.querySelectorAll('.color-stop');
    
    colorPickers.forEach((picker, index) => {
        picker.style.left = `${colorStops[index].position * 100}%`;
    });
}

function updateGradient() {
    const gradientBar = document.querySelector('.color-bar');
    const colors = colorStops.map(stop => stop.color);
    const positions = colorStops.map(stop => stop.position);
    
    let gradientString;
    if (interpolationType === 'smooth') {
        // Creiamo più punti di interpolazione tra tutti i colori
        const steps = 100;
        const colorPoints = [];
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const smoothT = easeInOutQuad(t);
            
            // Troviamo i due colori più vicini per l'interpolazione
            let leftIndex = 0;
            for (let j = 1; j < positions.length; j++) {
                if (positions[j] > t) break;
                leftIndex = j;
            }
            const rightIndex = Math.min(leftIndex + 1, positions.length - 1);
            
            // Calcola il fattore di interpolazione tra i due colori
            const segmentSize = positions[rightIndex] - positions[leftIndex];
            const segmentT = segmentSize === 0 ? 0 : (t - positions[leftIndex]) / segmentSize;
            const adjustedT = easeInOutQuad(segmentT);
            
            // Interpola tra i due colori più vicini
            const color = interpolateColor(colors[leftIndex], colors[rightIndex], adjustedT);
            colorPoints.push(`${color} ${t * 100}%`);
        }
        
        gradientString = `linear-gradient(to right, ${colorPoints.join(', ')})`;
    } else {
        // Interpolazione lineare standard
        gradientString = `linear-gradient(to right, ${
            colorStops.map(stop => `${stop.color} ${stop.position * 100}%`).join(', ')
        })`;
    }
    
    gradientBar.style.background = gradientString;
}

const leftInput = document.getElementById('leftValue');
const rightInput = document.getElementById('rightValue');

leftInput.addEventListener('input', updateColors);
rightInput.addEventListener('input', updateColors);

function updateColors() {
    const leftVal = parseFloat(leftInput.value);
    const rightVal = parseFloat(rightInput.value);
    
    // Usa questi valori per aggiornare i colori
    // ... la tua logica esistente per generare i gradienti ...
}

function getColorAtPosition(e) {
    const rect = gradientContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Calcola la percentuale in base alla posizione e al numero di colori
    const colorCount = colors.length;
    const segmentWidth = width / (colorCount - 1);
    const segmentIndex = Math.floor(x / segmentWidth);
    const segmentStart = segmentIndex * segmentWidth;
    const segmentProgress = (x - segmentStart) / segmentWidth;
    
    // Calcola la percentuale finale
    const percentage = Math.round((segmentIndex + segmentProgress) * (100 / (colorCount - 1)));
    
    // Limita la percentuale tra 0 e 100
    return Math.min(Math.max(percentage, 0), 100);
}

function createGradient(colors) {
    const canvas = document.getElementById('gradientCanvas');
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    
    colors.forEach((color, index) => {
        const position = index / (colors.length - 1);
        if (interpolationType === 'smooth') {
            // Usa una funzione di easing per un effetto più morbido
            const smoothPosition = easeInOutQuad(position);
            gradient.addColorStop(smoothPosition, color);
        } else {
            gradient.addColorStop(position, color);
        }
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function easeInOutQuad(t) {
    // Cubic easing per una transizione più fluida
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function interpolateColor(color1, color2, t) {
    return chroma.mix(color1, color2, t, 'lab').hex();
}

document.getElementById('interpolation').addEventListener('change', (e) => {
    interpolationType = e.target.value;
    updateGradient();
});

function setupDrawingEvents() {
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseleave', stopDrawing);
}

function startDrawing(e) {
    const bounds = drawingCanvas.getBoundingClientRect();
    startX = e.clientX - bounds.left;
    startY = e.clientY - bounds.top;
    
    // Controlla se si sta cliccando su una maniglia
    const handle = getHandle(startX, startY);
    if (handle) {
        selectedHandle = handle;
        isDragging = true;
        isDrawing = false;  // Importante: non stiamo disegnando un nuovo rettangolo
    } else if (isInsideRect(startX, startY)) {
        isDragging = true;
        isDrawing = false;  // Importante: non stiamo disegnando un nuovo rettangolo
        // Salva l'offset del mouse rispetto all'angolo del rettangolo
        startX = startX - rect.x;
        startY = startY - rect.y;
    } else {
        isDrawing = true;
        isDragging = false;
        rect.x = startX;
        rect.y = startY;
        rect.width = 0;
        rect.height = 0;
    }
}

function draw(e) {
    if (!isDrawing && !isDragging) return;
    
    const bounds = drawingCanvas.getBoundingClientRect();
    const currentX = e.clientX - bounds.left;
    const currentY = e.clientY - bounds.top;
    
    if (isDrawing) {
        // Disegna un nuovo rettangolo
        rect.width = currentX - rect.x;
        rect.height = currentY - rect.y;
    } else if (isDragging) {
        if (selectedHandle) {
            // Ridimensiona il rettangolo esistente
            resizeRect(currentX, currentY);
        } else {
            // Sposta il rettangolo esistente
            rect.x = currentX - startX;
            rect.y = currentY - startY;
        }
    }
    
    drawRect();
}

function stopDrawing() {
    isDrawing = false;
    isDragging = false;
    selectedHandle = null;
    
    // Aggiorna currentRect e ridisegna la griglia
    if (rect.width !== 0 && rect.height !== 0) {
        currentRect = {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        };
        drawGridOnRectangle();
    }
}

function drawRect() {
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    
    // Disegna il rettangolo
    drawCtx.strokeStyle = '#4CAF50';
    drawCtx.lineWidth = 2;
    drawCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    
    // Aggiorna currentRect e disegna la griglia
    currentRect = {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
    };
    drawGridOnRectangle();
    
    // Disegna le maniglie
    drawHandles();
    
    // Campiona i colori
    sampleColors();
}

function drawHandles() {
    const handles = [
        { x: rect.x, y: rect.y }, // Top-left
        { x: rect.x + rect.width, y: rect.y }, // Top-right
        { x: rect.x, y: rect.y + rect.height }, // Bottom-left
        { x: rect.x + rect.width, y: rect.y + rect.height } // Bottom-right
    ];
    
    handles.forEach(handle => {
        drawCtx.beginPath();
        drawCtx.arc(handle.x, handle.y, 5, 0, Math.PI * 2);
        drawCtx.fillStyle = 'white';
        drawCtx.fill();
        drawCtx.strokeStyle = '#4CAF50';
        drawCtx.stroke();
    });
}

function getHandle(x, y) {
    const handles = [
        { pos: 'tl', x: rect.x, y: rect.y },
        { pos: 'tr', x: rect.x + rect.width, y: rect.y },
        { pos: 'bl', x: rect.x, y: rect.y + rect.height },
        { pos: 'br', x: rect.x + rect.width, y: rect.y + rect.height }
    ];
    
    for (const handle of handles) {
        if (Math.abs(handle.x - x) < 10 && Math.abs(handle.y - y) < 10) {
            return handle.pos;
        }
    }
    return null;
}

function isInsideRect(x, y) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height &&
           rect.width !== 0 && rect.height !== 0; // Assicurati che il rettangolo esista
}

function resizeRect(currentX, currentY) {
    const originalWidth = rect.width;
    const originalHeight = rect.height;
    
    switch (selectedHandle) {
        case 'tl': // Top-left
            const newWidth = rect.x + rect.width - currentX;
            const newHeight = rect.y + rect.height - currentY;
            if (newWidth > 10 && newHeight > 10) { // Impedisce dimensioni troppo piccole
                rect.x = currentX;
                rect.y = currentY;
                rect.width = newWidth;
                rect.height = newHeight;
            }
            break;
        case 'tr': // Top-right
            const trWidth = currentX - rect.x;
            if (trWidth > 10) {
                rect.width = trWidth;
            }
            if (rect.y + rect.height - currentY > 10) {
                rect.y = currentY;
                rect.height = originalHeight + (originalHeight > 0 ? (rect.y - currentY) : (currentY - rect.y));
            }
            break;
        case 'bl': // Bottom-left
            const blWidth = rect.x + rect.width - currentX;
            if (blWidth > 10) {
                rect.x = currentX;
                rect.width = blWidth;
            }
            if (currentY - rect.y > 10) {
                rect.height = currentY - rect.y;
            }
            break;
        case 'br': // Bottom-right
            const brWidth = currentX - rect.x;
            const brHeight = currentY - rect.y;
            if (brWidth > 10) rect.width = brWidth;
            if (brHeight > 10) rect.height = brHeight;
            break;
    }
}

function drawGridOnRectangle() {
    if (!currentRect) return;
    
    const ctx = drawingCanvas.getContext('2d');
    const { x, y, width, height } = currentRect;
    
    ctx.lineWidth = 1;
    
    // Disegna le linee verticali della griglia
    for (let i = 1; i < gridCols; i++) {
        const xPos = x + (width * i / gridCols);
        ctx.beginPath();
        ctx.moveTo(xPos, y);
        ctx.lineTo(xPos, y + height);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
    
    // Disegna le linee orizzontali della griglia
    for (let i = 1; i < gridRows; i++) {
        const yPos = y + (height * i / gridRows);
        ctx.beginPath();
        ctx.moveTo(x, yPos);
        ctx.lineTo(x + width, yPos);
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
    
    // Disegna i punti centrali di ogni cella
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;
    
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            // Calcola il centro della cella
            const centerX = x + (col * cellWidth) + (cellWidth / 2);
            const centerY = y + (row * cellHeight) + (cellHeight / 2);
            
            // Disegna il punto
            ctx.beginPath();
            ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.strokeStyle = '#4CAF50';
            ctx.stroke();
        }
    }
}

function sampleColors() {
    if (!currentRect) return;
    
    const { x, y, width, height } = currentRect;
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;
    const sampledColors = [];
    
    // Ottieni il contesto del canvas dell'immagine
    const imgCtx = imageCanvas.getContext('2d');
    
    for (let row = 0; row < gridRows; row++) {
        const rowColors = [];
        for (let col = 0; col < gridCols; col++) {
            // Calcola il centro della cella
            const centerX = Math.round(x + (col * cellWidth) + (cellWidth / 2));
            const centerY = Math.round(y + (row * cellHeight) + (cellHeight / 2));
            
            // Campiona il colore
            const pixel = imgCtx.getImageData(centerX, centerY, 1, 1).data;
            const color = `#${[pixel[0], pixel[1], pixel[2]].map(x => x.toString(16).padStart(2, '0')).join('')}`;
            rowColors.push(color);
        }
        sampledColors.push(rowColors);
    }
    
    updateColorGrid(sampledColors);
}

function updateColorGrid(sampledColors) {
    // Passa direttamente la matrice dei colori
    updateSampledColors(sampledColors);
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Inizializza i canvas
                if (!imageCanvas) {
                    imageCanvas = document.getElementById('imageCanvas');
                    drawingCanvas = document.getElementById('drawingCanvas');
                    imgCtx = imageCanvas.getContext('2d', { willReadFrequently: true });
                    drawCtx = drawingCanvas.getContext('2d');
                    
                    // Aggiungi gli event listener per il disegno
                    setupDrawingEvents();
                }
                
                // Imposta le dimensioni dei canvas
                const maxWidth = 800;
                const maxHeight = 600;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (maxWidth * height) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (maxHeight * width) / height;
                    height = maxHeight;
                }
                
                imageCanvas.width = drawingCanvas.width = width;
                imageCanvas.height = drawingCanvas.height = height;
                
                // Disegna l'immagine
                imgCtx.drawImage(img, 0, 0, width, height);
                
                // Resetta il rettangolo
                rect = { x: 0, y: 0, width: 0, height: 0 };
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function initDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    element.addEventListener("mousedown", dragStart);
    document.addEventListener("mousemove", drag);
    document.addEventListener("mouseup", dragEnd);

    function dragStart(e) {
        // Calcola l'offset iniziale rispetto all'angolo superiore sinistro dell'elemento
        const rect = element.getBoundingClientRect();
        xOffset = e.clientX - rect.left;
        yOffset = e.clientY - rect.top;
        
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            
            currentX = e.clientX - xOffset;
            currentY = e.clientY - yOffset;

            // Aggiorna la posizione dell'elemento
            element.style.left = currentX + "px";
            element.style.top = currentY + "px";
        }
    }

    function dragEnd(e) {
        isDragging = false;
    }
}

function updateSampledColors(colors) {
    const container = document.getElementById('samples-container');
    const resultsContainer = document.getElementById('samples-results');
    container.innerHTML = '';
    resultsContainer.innerHTML = '';

    // Crea la griglia dei punti colorati
    const dotsGrid = document.createElement('div');
    dotsGrid.style.display = 'grid';
    dotsGrid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    dotsGrid.style.gap = '10px';
    container.appendChild(dotsGrid);

    // Crea la griglia dei risultati
    const resultsGrid = document.createElement('div');
    resultsGrid.style.display = 'grid';
    resultsGrid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    resultsGrid.style.gap = '10px';
    resultsGrid.style.marginTop = '20px';
    resultsContainer.appendChild(resultsGrid);

    colors.forEach((row, rowIndex) => {
        row.forEach((color, colIndex) => {
            // Crea il punto colorato
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = color;
            dotsGrid.appendChild(dot);

            // Calcola e crea il risultato
            const result = document.createElement('div');
            result.className = 'sample-result';
            
            const distances = calculateDistances(color);
            const minDistance = Math.min(...distances);
            const position = distances.indexOf(minDistance);
            const percentage = ((position / (distances.length - 1)) * 100).toFixed(1);
            
            result.innerHTML = `
                <div class="sample-color" style="background-color: ${color}"></div>
                <div class="sample-info">
                    <strong>R${rowIndex+1}C${colIndex+1}</strong><br>
                    ${percentage}%<br>
                    d=${minDistance.toFixed(1)}
                </div>
            `;
            
            resultsGrid.appendChild(result);
        });
    });
}

function updateColorGrid(sampledColors) {
    // Passa direttamente la matrice dei colori
    updateSampledColors(sampledColors);
}

// Modifichiamo la funzione calculateDistances per accettare un colore come parametro
function calculateDistances(inputColor) {
    const distances = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
        const gradientColor = getGradientColorAt(i / steps);
        const distance = calculateColorDistance(inputColor, gradientColor);
        distances.push(distance);
    }
    
    return distances;
}

// Aggiorniamo la funzione che gestisce il color picker
function updateSelectedColor(color) {
    const distances = calculateDistances(color);
    const minDistance = Math.min(...distances);
    const position = distances.indexOf(minDistance);
    const percentage = ((position / (distances.length - 1)) * 100).toFixed(1);
    
    // Aggiorna il display con il valore calcolato
    document.getElementById('valorePosizione').textContent = `${percentage}%`;
}

// Aggiungi questa funzione per calcolare il colore nel gradiente
function getGradientColorAt(position) {
    // Trova i due color stop più vicini
    let leftStop = colorStops[0];
    let rightStop = colorStops[colorStops.length - 1];
    
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (position >= colorStops[i].position && position <= colorStops[i + 1].position) {
            leftStop = colorStops[i];
            rightStop = colorStops[i + 1];
            break;
        }
    }
    
    // Calcola la posizione relativa tra i due color stop
    const range = rightStop.position - leftStop.position;
    const relativePosition = range === 0 ? 0 : (position - leftStop.position) / range;
    
    // Interpola il colore usando chroma.js
    return chroma.mix(leftStop.color, rightStop.color, relativePosition, interpolationType === 'smooth' ? 'lab' : 'rgb').hex();
}

// Aggiungi anche questa funzione per calcolare la distanza tra due colori
function calculateColorDistance(color1, color2) {
    // Usa chroma.js per calcolare la distanza nel spazio LAB
    const lab1 = chroma(color1).lab();
    const lab2 = chroma(color2).lab();
    
    // Calcola la distanza euclidea nello spazio LAB
    return Math.sqrt(
        Math.pow(lab1[0] - lab2[0], 2) +
        Math.pow(lab1[1] - lab2[1], 2) +
        Math.pow(lab1[2] - lab2[2], 2)
    );
}
