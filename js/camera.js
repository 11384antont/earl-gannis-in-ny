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
    if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video not ready yet"); return;
    }
    // Get actual video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Set canvas to match video's actual dimensions
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    ctx.save();
    // Mirror horizontally 
    ctx.scale(-1, 1);
    // Apply filter 
    ctx.filter = "saturate(0%) contrast(1.5)";
    // Draw mirrored video 
    ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
    ctx.restore();

    // Show loading screen
    setTimeout(() => showScreen('loading-screen'), 50);

    // Simulate brief loading and then show result
    setTimeout(() => {
        createPolaroid();
        showScreen('result-screen');
    }, 500);
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