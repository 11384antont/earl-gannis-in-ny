const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const polaroidCanvas = document.getElementById('polaroid-canvas');
const polaroidCtx = polaroidCanvas.getContext('2d');

canvas.width = 362;
canvas.height = 480;
polaroidCanvas.width = 410;
polaroidCanvas.height = 600;

let stream = null;
const frameImage = new Image();
frameImage.src = 'img/polaroidFrame.png';

// Start camera
async function startCamera() {
    video.onloadedmetadata = () => {
        video.play();
    };

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                aspectRatio: 362 / 480
            }
        });
        video.srcObject = stream;
    } catch (err) {
        const cameraContainer = document.querySelector('.camera-container');
        cameraContainer.innerHTML = `
                    <div class="error-message">
                        <h2>Camera Access Required</h2>
                        <p>Please allow camera access to use this photo booth.</p>
                        <p style="margin-top: 10px; font-size: 14px;">Click the camera icon in your browser's address bar to enable camera permissions.</p>
                    </div>
                `;
        console.error('Camera error:', err);
    }
}

// Load frame image
async function loadFrameImage() {
    return new Promise((resolve, reject) => {
        frameImage.onload = () => resolve();
        frameImage.onerror = () => reject(new Error('Frame image failed to load'));
    });
}

function capturePhoto() {
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (!vw || !vh) return;

    // First canvas: draw with filter, no transforms
    canvas.width = 362;
    canvas.height = 480;

    // Apply filter (works because no transforms yet)
    ctx.filter = "saturate(0%) contrast(1.2)";

    // Crop to portrait
    const videoRatio = vw / vh;
    const canvasRatio = canvas.width / canvas.height;

    let sx, sy, sw, sh;

    if (videoRatio > canvasRatio) {
        sh = vh;
        sw = vh * canvasRatio;
        sx = (vw - sw) / 2;
        sy = 0;
    } else {
        sw = vw;
        sh = vw / canvasRatio;
        sx = 0;
        sy = (vh - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // SECOND CANVAS: mirror the filtered image
    const mirrorCanvas = document.createElement("canvas");
    const mirrorCtx = mirrorCanvas.getContext("2d");

    mirrorCanvas.width = canvas.width;
    mirrorCanvas.height = canvas.height;

    mirrorCtx.translate(mirrorCanvas.width, 0);
    mirrorCtx.scale(-1, 1);

    mirrorCtx.drawImage(canvas, 0, 0);

    // Copy mirrored result back into main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mirrorCanvas, 0, 0);

    showScreen('loading-screen');
    setTimeout(() => {
        createPolaroid();
        showScreen('result-screen');
    }, 300);
}

function createPolaroid() {
    // Wait for frame image to load before drawing
    if (!frameImage.complete) {
        frameImage.onload = () => createPolaroid();
        return;
    }

    // Draw white background
    polaroidCtx.fillStyle = 'white';
    polaroidCtx.fillRect(0, 0, 410, 600);

    // Calculate scaling to fit captured photo into 362x480 space
    const targetWidth = 362;
    const targetHeight = 480;
    const scale = Math.min(targetWidth / canvas.width, targetHeight / canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;

    // Center the photo
    const photoX = (410 - scaledWidth) / 2;
    const photoY = 24 + (targetHeight - scaledHeight) / 2;

    polaroidCtx.drawImage(canvas, photoX, photoY, scaledWidth, scaledHeight);

    // Draw the frame on top
    polaroidCtx.drawImage(frameImage, 0, 0, 410, 600);
}

function retakePhoto() {
    showScreen('camera-screen');
}

function downloadPhoto() {
    // Get current date in EST
    const now = new Date();
    const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    // Format as YYMMDD
    const yy = String(estDate.getFullYear()).slice(-2);
    const mm = String(estDate.getMonth() + 1).padStart(2, '0');
    const dd = String(estDate.getDate()).padStart(2, '0');
    const dateString = `${yy}${mm}${dd}`;

    const link = document.createElement('a');
    link.download = `Earl-Gannis-NYC-${dateString}.png`;
    link.href = polaroidCanvas.toDataURL('image/png');
    link.click();
}

function showScreen(screenId) {
    document.getElementById('camera-screen').classList.remove('active');
    document.getElementById('loading-screen').classList.remove('active');
    document.getElementById('result-screen').classList.remove('active');
    document.getElementById(screenId).classList.add('active');
}

// Initialize camera and load frame on page load
Promise.all([startCamera(), loadFrameImage()]).catch(err => {
    console.error('Initialization error:', err);
});