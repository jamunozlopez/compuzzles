const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
let pieces = [];
let pieceSize;
let img = new Image();
let numPieces = 3;
let misplacedCount = 0;
const originalPreview = document.getElementById('original-preview');
let imageLoaded = false;
let showingOriginal = false;
let selectedPiece = null; // Variable to keep track of selected piece

document.getElementById('piece-count').addEventListener('change', function () {
    numPieces = parseInt(this.value);
    if (imageLoaded) resetPuzzle();
});

document.getElementById('load-puzzle').addEventListener('click', loadPuzzle);
document.getElementById('reset-puzzle').addEventListener('click', resetPuzzle);
document.getElementById('show-original').addEventListener('click', toggleOriginalPreview);

canvas.addEventListener('mousedown', onCanvasClick);

function loadPuzzle() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            img.onload = () => {
                imageLoaded = true;
                adjustImageSize();
                divideImage();
                shufflePieces();
                drawPieces();
                createOriginalPreview();
                displayMessage('');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        displayMessage('Por favor, selecciona un archivo de puzzle.');
    }
}

function adjustImageSize() {
    const aspectRatio = img.width / img.height;
    if (canvas.width / aspectRatio <= canvas.height) {
        canvas.height = canvas.width / aspectRatio;
    } else {
        canvas.width = canvas.height * aspectRatio;
    }
}

function divideImage() {
    pieces = [];
    const pieceWidth = canvas.width / numPieces;
    const pieceHeight = canvas.height / numPieces;
    pieceSize = { width: pieceWidth, height: pieceHeight };

    for (let y = 0; y < numPieces; y++) {
        for (let x = 0; x < numPieces; x++) {
            const piece = {
                correctX: x,
                correctY: y,
                currentX: x,
                currentY: y,
            };
            pieces.push(piece);
        }
    }
}

function shufflePieces() {
    if (imageLoaded) {
        do {
            for (let i = pieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pieces[i].currentX, pieces[j].currentX] = [pieces[j].currentX, pieces[i].currentX];
                [pieces[i].currentY, pieces[j].currentY] = [pieces[j].currentY, pieces[i].currentY];
            }
        } while (!isPuzzleSolvable());
        drawPieces();
        updateMisplacedCount();
    }
}

function isPuzzleSolvable() {
    let inversionCount = 0;
    const flattened = pieces.flatMap((piece, index) =>
        pieces.slice(index + 1).map((p) => (piece.currentY * numPieces + piece.currentX > p.currentY * numPieces + p.currentX) ? 1 : 0)
    );
    inversionCount = flattened.reduce((acc, val) => acc + val, 0);

    return inversionCount % 2 === 0;
}

function drawPieces() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(piece => {
        context.drawImage(
            img,
            piece.correctX * pieceSize.width, piece.correctY * pieceSize.height, pieceSize.width, pieceSize.height,
            piece.currentX * pieceSize.width, piece.currentY * pieceSize.height, pieceSize.width, pieceSize.height
        );

        // Highlight selected piece
        if (selectedPiece && selectedPiece.currentX === piece.currentX && selectedPiece.currentY === piece.currentY) {
            context.strokeStyle = 'red';
            context.lineWidth = 3;
            context.strokeRect(
                piece.currentX * pieceSize.width, piece.currentY * pieceSize.height, pieceSize.width, pieceSize.height
            );
        }
    });
}

function onCanvasClick(event) {
    const mouseX = Math.floor(event.offsetX / pieceSize.width);
    const mouseY = Math.floor(event.offsetY / pieceSize.height);
    const clickedPieceIndex = pieces.findIndex(piece => piece.currentX === mouseX && piece.currentY === mouseY);

    if (clickedPieceIndex !== -1) {
        if (selectedPiece === null) {
            selectedPiece = pieces[clickedPieceIndex];
        } else {
            swapPieces(clickedPieceIndex);
        }
    }
}

function swapPieces(clickedPieceIndex) {
    const clickedPiece = pieces[clickedPieceIndex];

    // Swap positions of the selected piece and clicked piece
    [selectedPiece.currentX, clickedPiece.currentX] = [clickedPiece.currentX, selectedPiece.currentX];
    [selectedPiece.currentY, clickedPiece.currentY] = [clickedPiece.currentY, selectedPiece.currentY];

    drawPieces();
    updateMisplacedCount();
    checkCompletion();

    // Deselect piece after swap
    selectedPiece = null;
}

function updateMisplacedCount() {
    misplacedCount = pieces.filter(piece => !isPieceAtCorrectPosition(piece)).length;
    document.getElementById('misplaced-count').textContent = misplacedCount;
}

function isPieceAtCorrectPosition(piece) {
    return piece.correctX === piece.currentX && piece.correctY === piece.currentY;
}

function checkCompletion() {
    if (misplacedCount === 0) {
        displayMessage('¡Puzzle completado!');
    } else {
        displayMessage('');
    }
}

function displayMessage(text) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = text;
}

function toggleOriginalPreview() {
    showingOriginal = !showingOriginal;
    originalPreview.classList.toggle('hidden', !showingOriginal);
}

function createOriginalPreview() {
    originalPreview.innerHTML = '';
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = canvas.width;
    previewCanvas.height = canvas.height;
    const previewContext = previewCanvas.getContext('2d');
    previewContext.drawImage(img, 0, 0, canvas.width, canvas.height);
    originalPreview.appendChild(previewCanvas);
    originalPreview.classList.add('hidden');  // Ensure preview is hidden initially
}

function resetPuzzle() {
    if (imageLoaded) {
        shufflePieces();
        drawPieces();
        displayMessage('');
    }
}
