let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let imageInput = document.getElementById('imageInput');
let minColor = document.getElementById('minColor');
let minValue = document.getElementById('minValue');
let maxColor = document.getElementById('maxColor');
let maxValue = document.getElementById('maxValue');
let selectionInfo = document.getElementById('selectionInfo');
let img = new Image();
let isDragging = false;
let startX, startY, endX, endY;
let colorInputs = document.getElementById('colorInputs');
let addIntermediateColorBtn = document.getElementById('addIntermediateColor');
let colorPreview = document.getElementById('selectedColor');
let colorValueText = document.getElementById('colorValue');
let originalImageData = null;
let activeColorInput = null;
let createMatrixBtn = document.getElementById('createMatrixBtn');

imageInput.addEventListener('change', function(e) {
    let file = e.target.files[0];
    let reader = new FileReader();
    reader.onload = function(event) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            // Save the original image data
            originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.offsetX;
    startY = e.offsetY;
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        endX = e.offsetX;
        endY = e.offsetY;
        drawSelection();
    }
    updateColorPreview(e);
});

canvas.addEventListener('click', function(e) {
    updateColorPreview(e);
});

canvas.addEventListener('mouseup', function() {
    isDragging = false;
    analyzeSelection();
});

function getPixelColor(x, y) {
    if (originalImageData) {
        let index = (y * originalImageData.width + x) * 4;
        return [
            originalImageData.data[index],
            originalImageData.data[index + 1],
            originalImageData.data[index + 2]
        ];
    }
    return [0, 0, 0];
}

function drawSelection() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, endX - startX, endY - startY);
}

function updateColorPreview(e) {
    if (img.complete && img.naturalWidth !== 0) {
        let rect = canvas.getBoundingClientRect();
        let x = Math.floor(e.clientX - rect.left);
        let y = Math.floor(e.clientY - rect.top);

        if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            let pixel = getPixelColor(x, y);
            let color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            let hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
            
            colorPreview.style.backgroundColor = color;
            colorValueText.textContent = color;

            // Se c'è un input colore attivo, assegna il colore
            if (activeColorInput) {
                activeColorInput.value = hexColor;
            }
        } else {
            colorPreview.style.backgroundColor = 'transparent';
            colorValueText.textContent = '';
        }
    }
}

// Funzione di utilità per convertire RGB in HEX
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

addIntermediateColorBtn.addEventListener('click', function() {
    let newInput = document.createElement('div');
    newInput.className = 'colorInput';
    newInput.innerHTML = `
        <input type="color" class="colorPicker">
        <button class="removeColor">×</button>
    `;
    colorInputs.appendChild(newInput);
});

colorInputs.addEventListener('click', function(e) {
    if (e.target.classList.contains('removeColor')) {
        e.target.parentElement.remove();
    }
});

function analyzeSelection() {
    let imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
    let data = imageData.data;

    // Get min and max values
    let min = parseFloat(minValue.value);
    let max = parseFloat(maxValue.value);
    if (isNaN(min) || isNaN(max)) {
        selectionInfo.innerHTML = "Inserisci valori minimo e massimo validi.";
        createMatrixBtn.style.display = 'none'; // Nascondi il pulsante se i valori non sono validi
        return;
    }

    // Get all colors
    let colors = [minColor.value];
    document.querySelectorAll('.colorInput .colorPicker').forEach(input => {
        colors.push(input.value);
    });
    colors.push(maxColor.value);

    // Mostra il pulsante dopo la selezione valida
    createMatrixBtn.style.display = 'block';
}

function getCellAverageValue(imageData, startX, startY, width, height, colorLegend) {
    let values = [];
    for (let y = startY; y < startY + height && y < imageData.height; y++) {
        for (let x = startX; x < startX + width && x < imageData.width; x++) {
            let index = (y * imageData.width + x) * 4;
            let r = imageData.data[index];
            let g = imageData.data[index + 1];
            let b = imageData.data[index + 2];
            let value = findClosestColorValue([r, g, b], colorLegend);
            values.push(value);
        }
    }
    
    // Calcola la media dei valori
    let sum = values.reduce((a, b) => a + b, 0);
    return values.length > 0 ? sum / values.length : 0;
}

function displayMatrix(matrix) {
    let table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '20px 0';

    for (let i = 0; i < matrix.length; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < matrix[i].length; j++) {
            let cell = document.createElement('td');
            cell.textContent = matrix[i][j].toFixed(3);
            cell.style.border = '1px solid black';
            cell.style.padding = '5px';
            row.appendChild(cell);
        }
        table.appendChild(row);
    }

    // Aggiungi la tabella dopo le informazioni esistenti
    selectionInfo.innerHTML = '<h3>Matrice dei valori:</h3>';
    selectionInfo.appendChild(table);

    // Aggiungi anche la possibilità di copiare i dati come CSV
    let csvData = matrix.map(row => row.map(val => val.toFixed(3)).join(',')).join('\n');
    let csvButton = document.createElement('button');
    csvButton.textContent = 'Copia come CSV';
    csvButton.onclick = () => {
        navigator.clipboard.writeText(csvData);
        alert('Dati copiati negli appunti!');
    };
    selectionInfo.appendChild(csvButton);
}

function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    return [r, g, b];
}

function findClosestColorValue(targetRgb, colorLegend) {
    let minDistance = Infinity;
    let closestValue = null;

    for (let legendEntry of colorLegend) {
        let distance = colorDistance(targetRgb, legendEntry.rgb);
        if (distance < minDistance) {
            minDistance = distance;
            closestValue = legendEntry.value;
        }
    }

    return closestValue;
}

function colorDistance(rgb1, rgb2) {
    // Using Euclidean distance in RGB space
    return Math.sqrt(
        Math.pow(rgb1[0] - rgb2[0], 2) +
        Math.pow(rgb1[1] - rgb2[1], 2) +
        Math.pow(rgb1[2] - rgb2[2], 2)
    );
}

// Event listeners per i controlli colore
minColor.addEventListener('focus', function() {
    activeColorInput = this;
});

maxColor.addEventListener('focus', function() {
    activeColorInput = this;
});

// Delegazione eventi per i color picker intermedi
colorInputs.addEventListener('focus', function(e) {
    if (e.target.classList.contains('colorPicker')) {
        activeColorInput = e.target;
    }
}, true);

// Reset dell'input attivo quando si perde il focus
document.addEventListener('click', function(e) {
    if (!e.target.matches('input[type="color"]')) {
        activeColorInput = null;
    }
});

// Aggiungi l'event listener per il pulsante
createMatrixBtn.addEventListener('click', function() {
    let rows = parseInt(prompt("Inserisci il numero di righe della matrice:"));
    let cols = parseInt(prompt("Inserisci il numero di colonne della matrice:"));

    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
        selectionInfo.innerHTML = "Dimensioni della matrice non valide.";
        return;
    }

    createMatrix(rows, cols);
});

// Nuova funzione per creare la matrice
function createMatrix(rows, cols) {
    let imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
    let width = endX - startX;
    let height = endY - startY;

    // Get min and max values
    let min = parseFloat(minValue.value);
    let max = parseFloat(maxValue.value);

    // Get all colors from the legend
    let colors = [minColor.value];
    document.querySelectorAll('.colorInput .colorPicker').forEach(input => {
        colors.push(input.value);
    });
    colors.push(maxColor.value);

    // Create color legend with proper mapping
    let colorLegend = colors.map((color, index) => {
        let rgb = hexToRgb(color);
        return {
            rgb: rgb,
            value: min + ((max - min) / (colors.length - 1)) * index
        };
    });

    // Calcola le dimensioni di ogni cella della matrice
    let cellWidth = Math.floor(width / cols);
    let cellHeight = Math.floor(height / rows);

    // Crea la matrice dei valori
    let matrix = [];
    for (let i = 0; i < rows; i++) {
        let row = [];
        for (let j = 0; j < cols; j++) {
            // Calcola il valore medio per ogni cella
            let cellValue = getCellAverageValue(
                imageData,
                j * cellWidth,
                i * cellHeight,
                cellWidth,
                cellHeight,
                colorLegend
            );
            row.push(cellValue);
        }
        matrix.push(row);
    }

    // Visualizza la matrice
    displayMatrix(matrix);
}
