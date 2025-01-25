let colorStops = [];
const defaultColors = ['#ff0000', '#0000ff'];

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
    const gradientString = `linear-gradient(to right, ${
        colorStops.map(stop => `${stop.color} ${stop.position * 100}%`).join(', ')
    })`;
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
