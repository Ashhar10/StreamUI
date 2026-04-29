import { StreamPixelApplication } from 'streampixelsdk';

// =====================================================
// StreamPixel SDK Integration
// =====================================================

const APP_ID = '69f2028e255ee58fa3942925';

let appStream = null;
let pixelStreaming = null;

async function init() {
    // AUTO-FIX: Create elements that the SDK expects if they are missing
    if (!document.getElementById('infoOverlay')) {
        const dummy = document.createElement('div');
        dummy.id = 'infoOverlay';
        dummy.style.display = 'none';
        document.body.appendChild(dummy);
    }
    if (!document.getElementById('root')) {
        const root = document.createElement('div');
        root.id = 'root';
        document.body.appendChild(root);
    }

    const statusText = document.getElementById('statusText');
    const statusDot = document.getElementById('statusDot');
    const loader = document.getElementById('loader');
    const uiPanel = document.getElementById('uiPanel');
    const videoContainer = document.getElementById('videoContainer');

    try {
        console.log('Initializing StreamPixel SDK...');

        const result = await StreamPixelApplication({
            appId: APP_ID,
            AutoConnect: true,
            hoverMouse: true,
            mouseInput: true,
            keyBoardInput: true,
            touchInput: true,
        });

        appStream = result.appStream;
        pixelStreaming = result.pixelStreaming;
        const UIControl = result.UIControl;

        if (statusText) statusText.textContent = 'SDK READY';

        // Enable hovering mouse
        if (UIControl && typeof UIControl.toggleHoveringMouse === 'function') {
            try { UIControl.toggleHoveringMouse(true); } catch(e) {}
        }

        // Hide default Pixel Streaming UI features
        const uiFeaturesEl = appStream.uiFeaturesElement
            || appStream.rootElement?.querySelector('#uiFeatures');
        if (uiFeaturesEl) uiFeaturesEl.style.display = 'none';

        // ===== THIS IS THE KEY PART =====
        // The SDK creates the video inside appStream.rootElement.
        // We MUST append it to our page when the video is ready.
        appStream.onVideoInitialized = () => {
            console.log('onVideoInitialized fired! Appending stream to page.');

            // Append the SDK's root element (contains the video) to our container
            if (videoContainer && appStream.rootElement) {
                videoContainer.appendChild(appStream.rootElement);
            }

            // Hide the SDK's built-in UI overlay
            const uiEl = appStream.rootElement?.querySelector('#uiFeatures');
            if (uiEl) uiEl.style.display = 'none';

            // Configure the video element
            const videoElement = appStream.stream.videoElementParent?.querySelector('video');
            if (videoElement) {
                videoElement.muted = true;
                videoElement.autoplay = true;
                videoElement.focus();
                videoElement.tabIndex = 0;
                console.log('Video element found and configured!');
            }

            // Mute the separate audio element
            const audioEl = appStream.stream._webRtcController?.streamController?.audioElement;
            if (audioEl) audioEl.muted = true;

            // Update UI state
            if (statusText) {
                statusText.textContent = 'STREAM LIVE';
                statusText.style.color = '#4ade80';
            }
            if (statusDot) statusDot.classList.add('live');
            if (loader) loader.classList.add('hidden');
            if (uiPanel) uiPanel.classList.add('active');
        };

        // ===== Event Listeners (for status updates) =====
        pixelStreaming.addEventListener('webRtcConnecting', () => {
            if (statusText) statusText.textContent = 'CONNECTING';
        });

        pixelStreaming.addEventListener('webRtcConnected', () => {
            if (statusText) statusText.textContent = 'CONNECTED';
        });

        pixelStreaming.addEventListener('webRtcDisconnected', () => {
            if (statusText) statusText.textContent = 'OFFLINE';
            if (statusDot) statusDot.classList.remove('live');
            if (uiPanel) uiPanel.classList.remove('active');
        });

        pixelStreaming.addEventListener('webRtcFailed', () => {
            if (statusText) statusText.textContent = 'FAILED';
        });

        // Listen for responses from Unreal
        pixelStreaming.addResponseEventListener('handle_responses', (response) => {
            console.log('Response from Unreal:', response);
        });

    } catch (error) {
        console.error('StreamPixel init failed:', error);
        if (statusText) statusText.textContent = 'ERROR';
        if (loader) {
            const loaderText = loader.querySelector('.loader-text');
            if (loaderText) loaderText.textContent = 'CONNECTION FAILED - RETRYING...';
        }
        setTimeout(init, 3000);
    }
}

// =====================================================
// Material Selection Logic
// =====================================================

function applyMaterial(materialPath, label) {
    if (!appStream || !appStream.stream) {
        console.warn('Stream not ready yet');
        showToast('Stream not ready yet...');
        return;
    }

    const payload = {
        Command: 'SetMaterial',
        Value: materialPath
    };

    console.log('Sending to Unreal:', payload);
    appStream.stream.emitUIInteraction(payload);
    showToast('Applied: ' + label);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// =====================================================
// Wire up button clicks
// =====================================================

document.querySelectorAll('.option-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');

        const materialPath = item.dataset.material;
        const label = item.dataset.label;
        applyMaterial(materialPath, label);
    });
});

// Start!
init();
