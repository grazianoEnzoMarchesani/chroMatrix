let colorStops = [];
const defaultColors = [
    'rgb(234,38,0)',    // Red
    'rgb(234,118,0)',   // Orange
    'rgb(247,203,55)',  // Yellow
    'rgb(226,230,141)', // Light Green
    'rgb(164,194,241)', // Light Blue
    'rgb(75,107,169)'   // Blue
];
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
    // Initialize with all colors evenly distributed
    defaultColors.forEach((color, index) => {
        const position = index / (defaultColors.length - 1);
        addColorStop(color, position);
    });
    updateGradient();

    // Image upload handling
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    imageInput.addEventListener('change', handleImageUpload);

    // Add after other event listeners initialization
    document.getElementById('grid-rows').addEventListener('change', function(e) {
        gridRows = parseInt(e.target.value) || 2;
        if (currentRect) {
            redrawAll();
        }
    });

    document.getElementById('grid-cols').addEventListener('change', function(e) {
        gridCols = parseInt(e.target.value) || 2;
        if (currentRect) {
            redrawAll();
        }
    });

    // Aggiungiamo l'event listener per il pulsante di download
    document.getElementById('downloadCSV').addEventListener('click', downloadCSV);
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
    
    // Converti il colore RGB in formato esadecimale
    if (color.startsWith('rgb')) {
        const rgb = color.match(/\d+/g);
        const hex = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        colorPicker.value = hex;
    } else {
        colorPicker.value = color;
    }
    
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

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) * (canvas.width / rect.width),
        y: (evt.clientY - rect.top) * (canvas.height / rect.height)
    };
}

function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(drawingCanvas, e);
    startX = pos.x;
    startY = pos.y;
    
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
    
    const pos = getMousePos(drawingCanvas, e);
    const currentX = pos.x;
    const currentY = pos.y;
    
    // Ridisegna l'immagine originale per pulire il canvas
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawCtx.drawImage(imageCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height);
    
    if (isDrawing) {
        // Disegna un nuovo rettangolo
        drawCtx.beginPath();
        drawCtx.strokeStyle = '#4CAF50';
        drawCtx.lineWidth = 2;
        drawCtx.rect(startX, startY, currentX - startX, currentY - startY);
        drawCtx.stroke();
        
        // Aggiorna currentRect
        currentRect = {
            x: startX,
            y: startY,
            width: currentX - startX,
            height: currentY - startY
        };
    } else if (isDragging && selectedHandle) {
        // Ridimensiona il rettangolo
        const newRect = calculateNewRectDimensions(currentX, currentY);
        currentRect = newRect;
        
        // Disegna il rettangolo corrente
        drawCtx.beginPath();
        drawCtx.strokeStyle = '#4CAF50';
        drawCtx.lineWidth = 2;
        drawCtx.rect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
        drawCtx.stroke();
    }
    
    // Disegna solo la griglia e le maniglie durante il trascinamento
    drawGridLinesOnly();
    drawHandles();
}

function calculateNewRectDimensions(currentX, currentY) {
    const newRect = { ...currentRect };
    
    switch (selectedHandle) {
        case 'tl': // Top-left
            newRect.width = newRect.x + newRect.width - currentX;
            newRect.height = newRect.y + newRect.height - currentY;
            newRect.x = currentX;
            newRect.y = currentY;
            break;
        case 'tr': // Top-right
            newRect.width = currentX - newRect.x;
            newRect.height = newRect.y + newRect.height - currentY;
            newRect.y = currentY;
            break;
        case 'bl': // Bottom-left
            newRect.width = newRect.x + newRect.width - currentX;
            newRect.height = currentY - newRect.y;
            newRect.x = currentX;
            break;
        case 'br': // Bottom-right
            newRect.width = currentX - newRect.x;
            newRect.height = currentY - newRect.y;
            break;
    }
    
    // Impedisci dimensioni negative
    if (newRect.width < 10) {
        newRect.width = 10;
        if (selectedHandle.includes('l')) {
            newRect.x = currentRect.x + currentRect.width - 10;
        }
    }
    if (newRect.height < 10) {
        newRect.height = 10;
        if (selectedHandle.includes('t')) {
            newRect.y = currentRect.y + currentRect.height - 10;
        }
    }
    
    return newRect;
}

function drawHandles() {
    if (!currentRect) return;
    
    const handles = [
        { pos: 'tl', x: currentRect.x, y: currentRect.y },
        { pos: 'tr', x: currentRect.x + currentRect.width, y: currentRect.y },
        { pos: 'bl', x: currentRect.x, y: currentRect.y + currentRect.height },
        { pos: 'br', x: currentRect.x + currentRect.width, y: currentRect.y + currentRect.height }
    ];
    
    handles.forEach(handle => {
        drawCtx.beginPath();
        drawCtx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
        drawCtx.fillStyle = 'white';
        drawCtx.fill();
        drawCtx.strokeStyle = '#4CAF50';
        drawCtx.lineWidth = 2;
        drawCtx.stroke();
    });
}

function getHandle(x, y) {
    if (!currentRect) return null;
    
    const handles = [
        { pos: 'tl', x: currentRect.x, y: currentRect.y },
        { pos: 'tr', x: currentRect.x + currentRect.width, y: currentRect.y },
        { pos: 'bl', x: currentRect.x, y: currentRect.y + currentRect.height },
        { pos: 'br', x: currentRect.x + currentRect.width, y: currentRect.y + currentRect.height }
    ];
    
    for (const handle of handles) {
        const dx = handle.x - x;
        const dy = handle.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
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

function drawGridLinesOnly() {
    if (!currentRect) return;
    
    const { x, y, width, height } = currentRect;
    
    drawCtx.lineWidth = 1;
    
    // Disegna le linee verticali della griglia
    for (let i = 1; i < gridCols; i++) {
        const xPos = x + (width * i / gridCols);
        drawCtx.beginPath();
        drawCtx.moveTo(xPos, y);
        drawCtx.lineTo(xPos, y + height);
        drawCtx.strokeStyle = 'white';
        drawCtx.stroke();
    }
    
    // Disegna le linee orizzontali della griglia
    for (let i = 1; i < gridRows; i++) {
        const yPos = y + (height * i / gridRows);
        drawCtx.beginPath();
        drawCtx.moveTo(x, yPos);
        drawCtx.lineTo(x + width, yPos);
        drawCtx.strokeStyle = 'white';
        drawCtx.stroke();
    }
}

function drawGridOnRectangle() {
    if (!currentRect) return;
    
    const { x, y, width, height } = currentRect;
    
    // Disegna le linee della griglia
    drawGridLinesOnly();
    
    // Disegna i punti di intersezione
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;
    
    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            // Calcola il centro della cella
            const centerX = x + (col * cellWidth) + (cellWidth / 2);
            const centerY = y + (row * cellHeight) + (cellHeight / 2);
            
            // Disegna il punto
            drawCtx.beginPath();
            drawCtx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            drawCtx.fillStyle = 'white';
            drawCtx.fill();
            drawCtx.strokeStyle = '#4CAF50';
            drawCtx.stroke();
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

                // Create "Update Sampling" button if it doesn't exist
                let updateButton = document.getElementById('updateSampling');
                if (!updateButton) {
                    updateButton = document.createElement('button');
                    updateButton.id = 'updateSampling';
                    updateButton.textContent = 'Update Sampling';
                    updateButton.className = 'add-button';
                    updateButton.addEventListener('click', function() {
                        if (currentRect) {
                            redrawAll();
                        }
                    });
                    
                    const imageInput = document.getElementById('imageInput');
                    imageInput.parentNode.insertBefore(updateButton, imageInput.nextSibling);
                }
                
                updateButton.style.display = 'inline-block';
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

    const dotsGrid = document.createElement('div');
    dotsGrid.style.display = 'grid';
    dotsGrid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    dotsGrid.style.gap = '10px';
    container.appendChild(dotsGrid);

    const resultsGrid = document.createElement('div');
    resultsGrid.style.display = 'grid';
    resultsGrid.style.gridTemplateColumns = `repeat(${gridCols}, auto)`;
    resultsGrid.style.gap = '10px';
    resultsGrid.style.marginTop = '20px';
    resultsContainer.appendChild(resultsGrid);

    // Ottieni i valori del range
    const minValue = parseFloat(document.getElementById('leftValue').value) || 0;
    const maxValue = parseFloat(document.getElementById('rightValue').value) || 100;
    const range = maxValue - minValue;

    colors.forEach((row, rowIndex) => {
        row.forEach((color, colIndex) => {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            dot.style.backgroundColor = color;
            dotsGrid.appendChild(dot);

            const result = document.createElement('div');
            result.className = 'sample-result';
            
            const position = findColorPosition(color);
            const percentage = position / 100;
            // Calcola il valore numerico basato sul range
            const actualValue = minValue + (range * percentage);
            
            const colorLab = chroma(color).lab();
            const gradientColorLab = chroma(getGradientColorAt(position/100)).lab();
            const distance = Math.sqrt(
                Math.pow(colorLab[0] - gradientColorLab[0], 2) +
                Math.pow(colorLab[1] - gradientColorLab[1], 2) +
                Math.pow(colorLab[2] - gradientColorLab[2], 2)
            );
            
            result.innerHTML = `
                <div class="sample-color" style="background-color: ${color}"></div>
                <div class="sample-info">
                    <strong>R${rowIndex+1}C${colIndex+1}</strong><br>
                    ${position}%<br>
                    Value: ${actualValue.toFixed(2)}<br>
                    d=${distance.toFixed(1)}
                </div>
            `;
            
            resultsGrid.appendChild(result);
        });
    });
}

function findColorPosition(targetColor) {
    const targetLab = chroma(targetColor).lab();
    let minDistance = Infinity;
    let bestPosition = 0;
    
    // Campiona il gradiente in più punti per una maggiore precisione
    const samples = 1000;
    
    for (let i = 0; i < samples; i++) {
        const position = i / (samples - 1);
        const gradientColor = getGradientColorAt(position);
        const gradientLab = chroma(gradientColor).lab();
        
        // Calcola la distanza euclidea nello spazio LAB
        const distance = Math.sqrt(
            Math.pow(targetLab[0] - gradientLab[0], 2) +
            Math.pow(targetLab[1] - gradientLab[1], 2) +
            Math.pow(targetLab[2] - gradientLab[2], 2)
        );
        
        if (distance < minDistance) {
            minDistance = distance;
            bestPosition = position;
        }
    }
    
    return Math.round(bestPosition * 100);
}

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

function updateRange() {
    const leftVal = parseFloat(document.getElementById('leftValue').value) || 0;
    const rightVal = parseFloat(document.getElementById('rightValue').value) || 0;
    
    const min = Math.min(leftVal, rightVal);
    const max = Math.max(leftVal, rightVal);
    
    console.log(`Il range è: ${min} - ${max}`);
}

// Aggiungi gli event listener per i due campi
document.getElementById('leftValue').addEventListener('input', updateRange);
document.getElementById('rightValue').addEventListener('input', updateRange);

// Aggiungi questa funzione di utilità per ridisegnare tutto
function redrawAll() {
    if (!currentRect) return;
    
    drawCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawCtx.drawImage(imageCanvas, 0, 0, drawingCanvas.width, drawingCanvas.height);
    
    drawCtx.beginPath();
    drawCtx.strokeStyle = '#4CAF50';
    drawCtx.lineWidth = 2;
    drawCtx.rect(currentRect.x, currentRect.y, currentRect.width, currentRect.height);
    drawCtx.stroke();
    
    drawGridOnRectangle();
    drawHandles();
    sampleColors();
}

function stopDrawing() {
    if (isDrawing || isDragging) {
        // Normalizza le dimensioni del rettangolo
        if (currentRect) {
            currentRect = {
                x: Math.min(currentRect.x, currentRect.x + currentRect.width),
                y: Math.min(currentRect.y, currentRect.y + currentRect.height),
                width: Math.abs(currentRect.width),
                height: Math.abs(currentRect.height)
            };
        }
        
        // Esegui il ridisegno completo e il campionamento
        redrawAll();
    }
    
    isDrawing = false;
    isDragging = false;
    selectedHandle = null;
}

function updateSample(percentage) {
    const sampleContainer = document.createElement('div');
    sampleContainer.className = 'sample-container';
    
    const colorSample = document.createElement('div');
    colorSample.className = 'color-sample';
    colorSample.style.backgroundColor = getColorAtPosition(percentage);
    
    const sampleInfo = document.createElement('div');
    sampleInfo.className = 'sample-info';
    
    const percentageSpan = document.createElement('span');
    percentageSpan.className = 'percentage';
    percentageSpan.textContent = `${Math.round(percentage * 100)}%`;
    
    const actualValue = document.createElement('span');
    actualValue.className = 'actual-value';
    
    // Calcolo del valore effettivo basato sul range
    const minValue = parseFloat(document.getElementById('minRange').value);
    const maxValue = parseFloat(document.getElementById('maxRange').value);
    const range = maxValue - minValue;
    const actualNumericValue = minValue + (range * percentage);
    actualValue.textContent = `Valore: ${actualNumericValue.toFixed(2)}`;
    
    sampleInfo.appendChild(percentageSpan);
    sampleInfo.appendChild(actualValue);
    
    sampleContainer.appendChild(colorSample);
    sampleContainer.appendChild(sampleInfo);
    
    document.getElementById('samples').appendChild(sampleContainer);
}

function downloadCSV() {
    const resultsContainer = document.getElementById('samples-results');
    const resultsGrid = resultsContainer.firstChild;
    if (!resultsGrid) return;
    
    const rows = gridRows;
    const cols = gridCols;
    
    // Create CSV header
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Add column headers
    let headers = [];
    for (let j = 0; j < cols; j++) {
        headers.push(`Column_${j + 1}`);
    }
    csvContent += headers.join(',') + '\n';
    
    // Add sampled values
    const results = resultsGrid.children;
    for (let i = 0; i < rows; i++) {
        let rowValues = [];
        for (let j = 0; j < cols; j++) {
            const index = i * cols + j;
            const resultDiv = results[index];
            if (resultDiv) {
                // Extract numeric value from text
                const sampleInfo = resultDiv.querySelector('.sample-info');
                const valueText = sampleInfo.innerHTML.split('<br>')[2]; // Gets the line with "Value: X.XX"
                const value = valueText.split(': ')[1]; // Extracts only the number
                rowValues.push(value);
            } else {
                rowValues.push('');
            }
        }
        csvContent += rowValues.join(',') + '\n';
    }
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'sampled_values.csv');
    
    // Add link to document and click
    document.body.appendChild(link);
    link.click();
    
    // Remove link
    document.body.removeChild(link);
}
