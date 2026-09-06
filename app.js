/**
 * ============================================================================
 * HandWrite Canvas - Logica Aplicatiei
 * Tehnologii: Vanilla JS (ES6+), HTML5 Canvas, MediaPipe Hands & Camera Utils
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- Elemente DOM ---
    const videoElement = document.getElementById('webcam');
    const outputCanvas = document.getElementById('output_canvas');
    const ctx = outputCanvas.getContext('2d');

    // Controale si Interfata Flotanta (UI)

    const btnClear = document.getElementById('btn-clear');
    const colorButtons = document.querySelectorAll('.color-btn');
    const customColorPicker = document.getElementById('custom-color-picker');
    const brushSizeSlider = document.getElementById('brush-size');
    const brushSizeVal = document.getElementById('brush-size-val');
    const toggleSkeleton = document.getElementById('toggle-skeleton');
    const toggleVideoBg = document.getElementById('toggle-video-bg');
    
    // Insigna de Stare si Fereastra Modala
    const statusBadge = document.getElementById('gesture-status');
    const statusText = document.getElementById('status-text');
    const cameraErrorModal = document.getElementById('camera-error-modal');
    const btnRetryCamera = document.getElementById('btn-retry-camera');

    // --- Stratul Persistent de Desenare (Canvas Offscreen) ---
    // Canvas-ul offscreen pastreaza urmele desenate permanent de utilizator.
    const drawingCanvas = document.createElement('canvas');
    const drawingCtx = drawingCanvas.getContext('2d');

    // --- Variabile de Stare ---

    let currentColor = '#FF2A55';  // Culoarea implicita a liniei: rosu vibrant
    let currentBrushSize = 5;       // Grosimea implicita: 5px
    let isDrawing = false;          // Indicator activitate gest pointing (aratator extins)
    
    // Coordonatele netezite ale liniei (interpolare liniara / lerp)
    let lastX = null;
    let lastY = null;

    // --- Redimensionarea si Scalarea Canvas-ului ---
    function resizeCanvases() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Seteaza rezolutia canvas-ului de iesire
        outputCanvas.width = width;
        outputCanvas.height = height;

        // Salveaza continutul desenat inainte de redimensionarea canvas-ului offscreen
        if (drawingCanvas.width > 0 && drawingCanvas.height > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = drawingCanvas.width;
            tempCanvas.height = drawingCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(drawingCanvas, 0, 0);

            drawingCanvas.width = width;
            drawingCanvas.height = height;
            drawingCtx.drawImage(tempCanvas, 0, 0, width, height);
        } else {
            drawingCanvas.width = width;
            drawingCanvas.height = height;
        }

        // Reconfigureaza proprietatile contextului de desenare dupa redimensionare
        configureDrawingContext();
    }

    function configureDrawingContext() {
        drawingCtx.lineCap = 'round';
        drawingCtx.lineJoin = 'round';
        drawingCtx.strokeStyle = currentColor;
        drawingCtx.lineWidth = currentBrushSize;
    }

    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();



    // --- Actiunea de Stergere Ecran ---
    function clearCanvas() {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    }

    btnClear.addEventListener('click', () => {
        clearCanvas();
    });

    // --- Selectarea Culorilor din Paleta ---
    colorButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            colorButtons.forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            
            currentColor = target.getAttribute('data-color');
            drawingCtx.strokeStyle = currentColor;
        });
    });

    customColorPicker.addEventListener('input', (e) => {
        colorButtons.forEach(b => b.classList.remove('active'));
        currentColor = e.target.value;
        drawingCtx.strokeStyle = currentColor;
    });

    // --- Controlul Slider pentru Grosimea Liniei ---
    brushSizeSlider.addEventListener('input', (e) => {
        currentBrushSize = parseInt(e.target.value, 10);
        brushSizeVal.textContent = `${currentBrushSize}px`;
        drawingCtx.lineWidth = currentBrushSize;
    });

    // --- Comutator pentru Fundalul Video ---
    toggleVideoBg.addEventListener('change', (e) => {
        if (e.target.checked) {
            videoElement.classList.remove('hidden-bg');
        } else {
            videoElement.classList.add('hidden-bg');
        }
    });

    // --- Actualizarea Insignei de Stare UI ---
    function updateStatus(state, text) {
        statusBadge.className = 'status-badge ' + state;
        statusText.textContent = text;
    }

    // --- Helper Gest Pointing (Aratator Extins) ---
    /**
     * Verifica daca gestul de aratare (Pointing) este activ.
     * Returneaza true doar cand:
     * - Aratatorul (Landmark 8) este extins: landmarks[8].y < landmarks[6].y
     * - Mijlociul (Landmark 12) este strans: landmarks[12].y > landmarks[10].y
     * - Inelarul (Landmark 16) este strans: landmarks[16].y > landmarks[14].y
     * - Degetul mic (Landmark 20) este strans: landmarks[20].y > landmarks[18].y
     */
    function isPointingGesture(landmarks, currentlyDrawing = false) {
        // Toleranta / Histerezis pentru stabilizare in lumina slaba
        const hysteresis = currentlyDrawing ? 0.015 : -0.005;

        const isIndexExtended = landmarks[8].y < (landmarks[6].y + hysteresis);
        const isMiddleFolded  = landmarks[12].y > (landmarks[10].y - hysteresis);
        const isRingFolded    = landmarks[16].y > (landmarks[14].y - hysteresis);
        const isPinkyFolded   = landmarks[20].y > (landmarks[18].y - hysteresis);

        return isIndexExtended && isMiddleFolded && isRingFolded && isPinkyFolded;
    }

    // --- Procesarea Cadrelor din MediaPipe Hands ---
    function onResults(results) {
        const width = outputCanvas.width;
        const height = outputCanvas.height;

        // 1. Curatam canvas-ul vizibil pentru noul cadru
        ctx.clearRect(0, 0, width, height);

        // 2. Afisam stratul persistent de desen pe canvas-ul vizibil
        ctx.drawImage(drawingCanvas, 0, 0);

        // 3. Procesam landmark-urile manii daca sunt detectate
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            
            // Mana principala (prima detectata)
            const landmarks = results.multiHandLandmarks[0];

            // Desenam conexiunile scheletului manii daca optiunea este activa
            if (toggleSkeleton.checked && window.drawConnectors && window.drawLandmarks) {
                window.drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                    color: 'rgba(0, 229, 255, 0.4)',
                    lineWidth: 2
                });
                window.drawLandmarks(ctx, landmarks, {
                    color: 'rgba(255, 42, 85, 0.8)',
                    lineWidth: 1,
                    radius: 3
                });
            }

            // Varful Aratatorului (Landmark 8)
            const indexTip = landmarks[8];

            // Conversia Landmark 8 (Aratator) in pixeli reali pe canvas
            const currentRawX = indexTip.x * width;
            const currentRawY = indexTip.y * height;

            // Evaluarea gestului Pointing (Aratator Extins + celelalte degete stranse)
            isDrawing = isPointingGesture(landmarks, isDrawing);

            // Actualizam starea UI si gestionam desenarea
            if (isDrawing) {
                updateStatus('status-drawing', '🖊️ Scriere in curs (Aratator extins)...');

                // Interpolare Liniara (Lerp) pentru linii netede fara tremurici
                if (lastX === null || lastY === null) {
                    lastX = currentRawX;
                    lastY = currentRawY;
                } else {
                    const lerpFactor = 0.5;
                    const smoothX = lastX + (currentRawX - lastX) * lerpFactor;
                    const smoothY = lastY + (currentRawY - lastY) * lerpFactor;

                    // Trasam segmentul de linie pe canvas-ul offscreen persistent
                    drawingCtx.beginPath();
                    drawingCtx.moveTo(lastX, lastY);
                    drawingCtx.lineTo(smoothX, smoothY);
                    drawingCtx.stroke();

                    lastX = smoothX;
                    lastY = smoothY;
                }

                // Desenam inelul/cursorul vizual pe canvas-ul de iesire
                drawPointerCursor(ctx, currentRawX, currentRawY, true);

            } else {
                updateStatus('status-hover', 'Mana detectata (Arata cu aratatorul pentru a scrie)');
                
                // Resetam punctele de pornire ale liniei cand gestul se opreste
                lastX = null;
                lastY = null;

                // Desenam cursorul de navigare (hover) pe canvas-ul de iesire
                drawPointerCursor(ctx, currentRawX, currentRawY, false);
            }

        } else {
            // Nicio mana detectata
            isDrawing = false;
            lastX = null;
            lastY = null;
            updateStatus('status-no-hand', 'Nicio mana detectata');
        }
    }

    // --- Inel / Cursor Vizual Personalizat ---
    function drawPointerCursor(context, x, y, active) {
        context.save();
        
        const radius = active ? Math.max(currentBrushSize / 2 + 4, 8) : 16;

        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        
        if (active) {
            context.fillStyle = currentColor;
            context.shadowColor = currentColor;
            context.shadowBlur = 12;
            context.fill();
            context.strokeStyle = '#FFFFFF';
            context.lineWidth = 2;
            context.stroke();
        } else {
            context.strokeStyle = 'rgba(0, 229, 255, 0.8)';
            context.lineWidth = 2;
            context.setLineDash([4, 4]);
            context.stroke();
            
            // Desenam punctul din centru
            context.beginPath();
            context.arc(x, y, 3, 0, 2 * Math.PI);
            context.fillStyle = 'rgba(0, 229, 255, 0.9)';
            context.fill();
        }
        
        context.restore();
    }

    // --- Initializare MediaPipe Hands si Camera Webcam ---
    function initMediaPipe() {
        if (typeof Hands === 'undefined' || typeof Camera === 'undefined') {
            updateStatus('status-waiting', 'Eroare la incarcarea MediaPipe CDN.');
            console.error('Librariile MediaPipe nu au putut fi incarcate din CDN.');
            return;
        }

        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        // Configuram optiunile modelului conform cerintelor tehnice
        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onResults);

        // Configuram Utilitarul de Camera
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({ image: videoElement });
            },
            width: 1280,
            height: 720
        });

        camera.start()
            .then(() => {
                cameraErrorModal.classList.add('hidden');
                updateStatus('status-no-hand', 'Camera activa. Arata mana.');
            })
            .catch(err => {
                console.error('Eroare acces webcam:', err);
                updateStatus('status-waiting', 'Acces camera refuzat.');
                cameraErrorModal.classList.remove('hidden');
            });
    }

    btnRetryCamera.addEventListener('click', () => {
        initMediaPipe();
    });

    // Pornirea initializarii aplicatiei
    initMediaPipe();
});
