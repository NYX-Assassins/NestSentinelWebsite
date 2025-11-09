// ESP32 Configuration
const ESP32_DEVICES = [
    { id: 1, ip: '192.168.1.100', name: 'Nest 1' }, // Replace with actual ESP32 IPs
    { id: 2, ip: '192.168.1.101', name: 'Nest 2' },
    { id: 3, ip: '192.168.1.102', name: 'Nest 3' }
];

const UPDATE_INTERVAL = 3000; // Update every 3 seconds
let connectedDevices = 0;

// Update connection status indicator
function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    const indicator = statusElement.querySelector('.connection-indicator');
    
    if (connectedDevices > 0) {
        statusElement.className = 'sensor-status status-online';
        indicator.className = 'connection-indicator connected';
        statusElement.innerHTML = `<span class="connection-indicator connected"></span>Connected to ${connectedDevices} of ${ESP32_DEVICES.length} nests`;
    } else {
        statusElement.className = 'sensor-status status-offline';
        indicator.className = 'connection-indicator disconnected';
        statusElement.innerHTML = `<span class="connection-indicator disconnected"></span>Connecting to nest sensors...`;
    }
}

// Fetch data from a single ESP32 device
async function fetchNestData(device) {
    try {
        const response = await fetch(`http://${device.ip}/data`, {
            method: 'GET',
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        updateNestDisplay(device.id, data, true);
        return true;
        
    } catch (error) {
        console.error(`Error fetching data from ${device.name}:`, error);
        updateNestDisplay(device.id, null, false);
        return false;
    }
}

// Update the display for a specific nest
function updateNestDisplay(nestId, data, isConnected) {
    const tempElement = document.getElementById(`temp${nestId}`);
    const humidityElement = document.getElementById(`humidity${nestId}`);
    const vibrationElement = document.getElementById(`vibration${nestId}`);
    const statusElement = document.getElementById(`status${nestId}`);
    const lastUpdateElement = document.getElementById(`lastUpdate${nestId}`);
    const rowElement = document.getElementById(`nest${nestId}Row`);
    
    if (isConnected && data) {
        // Update sensor values
        tempElement.textContent = data.temperature ? data.temperature.toFixed(1) : '--';
        humidityElement.textContent = data.humidity ? data.humidity.toFixed(1) : '--';
        
        // Handle vibration detection
        const hasVibration = data.vibration || data.motion || false;
        vibrationElement.textContent = hasVibration ? 'DETECTED' : 'None';
        
        // Highlight row if vibration detected
        if (hasVibration) {
            rowElement.classList.add('vibration-alert');
            vibrationElement.style.fontWeight = 'bold';
            vibrationElement.style.color = '#856404';
        } else {
            rowElement.classList.remove('vibration-alert');
            vibrationElement.style.fontWeight = 'normal';
            vibrationElement.style.color = 'inherit';
        }
        
        // Update status and timestamp
        statusElement.textContent = '✅ Active';
        statusElement.style.color = '#28a745';
        lastUpdateElement.textContent = new Date().toLocaleTimeString();
        
    } else {
        // Handle disconnected state
        tempElement.textContent = '--';
        humidityElement.textContent = '--';
        vibrationElement.textContent = '--';
        statusElement.textContent = '❌ Offline';
        statusElement.style.color = '#dc3545';
        lastUpdateElement.textContent = 'Connection lost';
        rowElement.classList.remove('vibration-alert');
    }
}

// Fetch data from all ESP32 devices
async function fetchAllNestData() {
    connectedDevices = 0;
    
    const promises = ESP32_DEVICES.map(async (device) => {
        const success = await fetchNestData(device);
        if (success) connectedDevices++;
        return success;
    });
    
    await Promise.all(promises);
    updateConnectionStatus();
}

// Simulate demo data (remove this when connecting to real ESP32s)
function generateDemoData() {
    return {
        temperature: 28 + Math.random() * 6, // 28-34°C range
        humidity: 25 + Math.random() * 15,   // 25-40% range
        vibration: Math.random() < 0.1       // 10% chance of vibration
    };
}

// Demo mode function (for testing without ESP32)
function runDemoMode() {
    ESP32_DEVICES.forEach(device => {
        const demoData = generateDemoData();
        updateNestDisplay(device.id, demoData, true);
    });
    connectedDevices = ESP32_DEVICES.length;
    updateConnectionStatus();
}

// Initialize the monitoring system
function initializeMonitoring() {
    console.log('Initializing turtle nest monitoring system...');
    
    // Try to fetch real data first
    fetchAllNestData();
    
    // Set up regular updates
    setInterval(() => {
        fetchAllNestData();
    }, UPDATE_INTERVAL);
    
    // Uncomment the line below to run in demo mode for testing
    // setInterval(runDemoMode, UPDATE_INTERVAL);
}

// Start monitoring when page loads
document.addEventListener('DOMContentLoaded', initializeMonitoring);

// Handle page visibility changes (pause updates when hidden)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        // Page became visible, fetch fresh data
        fetchAllNestData();
    }
});