// Vehicle Drive Logger - Main JavaScript

// State Management
let state = {
    logs: [],
    timerRunning: false,
    timerStartTime: null,
    timerInterval: null,
    currentTripTime: 0,
    totalStats: {
        distance: 0,
        duration: 0,
        avgSpeed: 0,
        trips: 0
    }
};

// DOM Elements
const startTripBtn = document.getElementById('startTripBtn');
const timerDisplay = document.getElementById('timerDisplay');
const timerStatus = document.getElementById('timerStatus');
const formSection = document.getElementById('formSection');
const driveLogForm = document.getElementById('driveLogForm');
const logsContainer = document.getElementById('logsContainer');
const totalDistanceEl = document.getElementById('totalDistance');
const totalDurationEl = document.getElementById('totalDuration');
const avgSpeedEl = document.getElementById('avgSpeed');
const totalTripsEl = document.getElementById('totalTrips');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const emailLogsBtn = document.getElementById('emailLogsBtn');
const emailModal = document.getElementById('emailModal');
const closeModal = document.getElementById('closeModal');
const cancelEmail = document.getElementById('cancelEmail');
const sendEmail = document.getElementById('sendEmail');
const exportNote = document.getElementById('exportNote');

// Initialize App
function init() {
    loadFromStorage();
    updateStats();
    renderLogs();
    setupEventListeners();
    setDefaultDate();
    updateExportButtons();
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dateInput').value = today;
}

// Setup Event Listeners
function setupEventListeners() {
    startTripBtn.addEventListener('click', toggleTimer);
    driveLogForm.addEventListener('submit', handleFormSubmit);
    exportCsvBtn.addEventListener('click', exportToCsv);
    exportJsonBtn.addEventListener('click', exportToJson);
    emailLogsBtn.addEventListener('click', openEmailModal);
    closeModal.addEventListener('click', closeEmailModal);
    cancelEmail.addEventListener('click', closeEmailModal);
    sendEmail.addEventListener('click', handleSendEmail);
    
    // Close modal on outside click
    emailModal.addEventListener('click', (e) => {
        if (e.target === emailModal) {
            closeEmailModal();
        }
    });
}

// Timer Functions
function toggleTimer() {
    if (!state.timerRunning) {
        startTimer();
    } else {
        stopTimer();
    }
}

function startTimer() {
    state.timerRunning = true;
    state.timerStartTime = Date.now() - state.currentTripTime;
    
    state.timerInterval = setInterval(updateTimerDisplay, 100);
    
    startTripBtn.innerHTML = '<span>⏹</span> Finish Trip';
    startTripBtn.classList.add('stop');
    timerStatus.textContent = 'Trip in progress...';
    timerStatus.style.color = '#10b981';
    
    formSection.style.display = 'none';
}

function stopTimer() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    
    // Calculate trip duration in hours
    const durationHours = state.currentTripTime / (1000 * 60 * 60);
    
    // Show form with pre-filled duration
    document.getElementById('totalDurationInput').value = durationHours.toFixed(2);
    
    // Calculate average speed if distance is entered
    const distanceInput = document.getElementById('totalDistanceInput');
    distanceInput.addEventListener('input', calculateAvgSpeed);
    
    startTripBtn.innerHTML = '<span>▶</span> Start Trip';
    startTripBtn.classList.remove('stop');
    timerStatus.textContent = 'Trip finished - Add details below';
    timerStatus.style.color = '#f59e0b';
    
    formSection.style.display = 'block';
    formSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateTimerDisplay() {
    state.currentTripTime = Date.now() - state.timerStartTime;
    const formatted = formatTime(state.currentTripTime);
    timerDisplay.textContent = formatted;
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function resetTimer() {
    state.currentTripTime = 0;
    timerDisplay.textContent = '00:00:00';
    timerStatus.textContent = 'Ready to start';
    timerStatus.style.color = '#6b7280';
}

// Calculate average speed
function calculateAvgSpeed() {
    const distance = parseFloat(document.getElementById('totalDistanceInput').value) || 0;
    const duration = parseFloat(document.getElementById('totalDurationInput').value) || 0;
    
    if (duration > 0) {
        const avgSpeed = distance / duration;
        document.getElementById('avgSpeedInput').value = avgSpeed.toFixed(1);
    }
}

// Form Handling
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        id: Date.now(),
        date: document.getElementById('dateInput').value,
        roadType: document.getElementById('roadType').value,
        dayNight: document.getElementById('dayNight').value,
        vin: document.getElementById('vin').value,
        driverName: document.getElementById('driverName').value,
        driverLicense: document.getElementById('driverLicense').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        totalDistance: parseFloat(document.getElementById('totalDistanceInput').value),
        totalDuration: parseFloat(document.getElementById('totalDurationInput').value),
        avgSpeed: parseFloat(document.getElementById('avgSpeedInput').value)
    };
    
    state.logs.unshift(formData);
    saveToStorage();
    updateStats();
    renderLogs();
    updateExportButtons();
    
    // Reset form and timer
    driveLogForm.reset();
    setDefaultDate();
    resetTimer();
    formSection.style.display = 'none';
    
    // Show success message
    showNotification('Log entry added successfully!', 'success');
    
    // Scroll to logs
    logsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Render Logs
function renderLogs() {
    if (state.logs.length === 0) {
        logsContainer.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>No drive logs yet. Add your first entry above.</p>
            </div>
        `;
        return;
    }
    
    logsContainer.innerHTML = state.logs.map(log => `
        <div class="log-item">
            <div class="log-header">
                <div class="log-title">${log.driverName}</div>
                <div class="log-date">${formatDate(log.date)}</div>
            </div>
            <div class="log-details">
                <div class="log-detail">
                    <span class="log-detail-label">Distance</span>
                    <span class="log-detail-value">${log.totalDistance.toFixed(1)} mi</span>
                </div>
                <div class="log-detail">
                    <span class="log-detail-label">Duration</span>
                    <span class="log-detail-value">${log.totalDuration.toFixed(2)} hrs</span>
                </div>
                <div class="log-detail">
                    <span class="log-detail-label">Avg Speed</span>
                    <span class="log-detail-value">${log.avgSpeed.toFixed(1)} mph</span>
                </div>
                <div class="log-detail">
                    <span class="log-detail-label">Road Type</span>
                    <span class="log-detail-value">${capitalizeFirst(log.roadType)}</span>
                </div>
                <div class="log-detail">
                    <span class="log-detail-label">Time</span>
                    <span class="log-detail-value">${capitalizeFirst(log.dayNight)}</span>
                </div>
                <div class="log-detail">
                    <span class="log-detail-label">Location</span>
                    <span class="log-detail-value">${log.city || 'N/A'}, ${log.country || 'N/A'}</span>
                </div>
                ${log.vin ? `
                <div class="log-detail">
                    <span class="log-detail-label">VIN</span>
                    <span class="log-detail-value">${log.vin}</span>
                </div>
                ` : ''}
                ${log.driverLicense ? `
                <div class="log-detail">
                    <span class="log-detail-label">License</span>
                    <span class="log-detail-value">${log.driverLicense}</span>
                </div>
                ` : ''}
            </div>
            <button class="delete-btn" onclick="deleteLog(${log.id})">🗑️ Delete</button>
        </div>
    `).join('');
}

// Delete Log
function deleteLog(id) {
    if (confirm('Are you sure you want to delete this log entry?')) {
        state.logs = state.logs.filter(log => log.id !== id);
        saveToStorage();
        updateStats();
        renderLogs();
        updateExportButtons();
        showNotification('Log entry deleted', 'success');
    }
}

// Update Statistics
function updateStats() {
    const stats = state.logs.reduce((acc, log) => {
        acc.distance += log.totalDistance;
        acc.duration += log.totalDuration;
        return acc;
    }, { distance: 0, duration: 0 });
    
    state.totalStats = {
        distance: stats.distance,
        duration: stats.duration,
        avgSpeed: stats.duration > 0 ? stats.distance / stats.duration : 0,
        trips: state.logs.length
    };
    
    totalDistanceEl.textContent = `${state.totalStats.distance.toFixed(1)} mi`;
    totalDurationEl.textContent = `${state.totalStats.duration.toFixed(1)} hrs`;
    avgSpeedEl.textContent = `${state.totalStats.avgSpeed.toFixed(1)} mph`;
    totalTripsEl.textContent = state.totalStats.trips;
}

// --------- Export Functions Updated -----------

function exportToCsv() {
    if (state.logs.length === 0) {
        showNotification('No logs to export', 'error');
        return;
    }
    
    const headers = ['Date', 'Driver Name', 'Driver License', 'Distance (mi)', 'Duration (hrs)', 
                     'Avg Speed (mph)', 'Road Type', 'Day/Night', 'City', 'Country', 'VIN'];
    
    const rows = state.logs.map(log => [
        log.date,
        log.driverName,
        log.driverLicense || '',
        log.totalDistance.toFixed(1),
        log.totalDuration.toFixed(2),
        log.avgSpeed.toFixed(1),
        log.roadType,
        log.dayNight,
        log.city || '',
        log.country || '',
        log.vin || ''
    ]);
    
    const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    downloadFile(csv, 'vehicle-logs.csv', 'text/csv');
}

function exportToJson() {
    if (state.logs.length === 0) {
        showNotification('No logs to export', 'error');
        return;
    }
    
    const json = JSON.stringify(state.logs, null, 2);
    downloadFile(json, 'vehicle-logs.json', 'application/json');
}

// ⭐ UPDATED download function (Mobile + Browser support)
async function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    // Use Web Share API for mobile
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: filename,
                files: [file]
            });
            showNotification('Saved / Shared successfully!', 'success');
            return;
        } catch (err) {
            console.warn("Share cancelled or failed", err);
        }
    }

    // fallback browser download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Downloaded successfully!', 'success');
}

// -------- Email + UI + Storage remain same ---------

function openEmailModal() {
    if (state.logs.length === 0) {
        showNotification('No logs to email', 'error');
        return;
    }
    emailModal.classList.add('show');
}

function closeEmailModal() {
    emailModal.classList.remove('show');
}

function handleSendEmail() {
    const recipientEmail = document.getElementById('recipientEmail').value;
    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;
    
    if (!recipientEmail) {
        showNotification('Please enter recipient email', 'error');
        return;
    }
    
    const logsSummary = state.logs.map((log, index) => `
Log ${index + 1}:
Date: ${log.date}
Driver: ${log.driverName}
Distance: ${log.totalDistance.toFixed(1)} mi
Duration: ${log.totalDuration.toFixed(2)} hrs
Avg Speed: ${log.avgSpeed.toFixed(1)} mph
Road Type: ${log.roadType}
Time: ${log.dayNight}
Location: ${log.city || 'N/A'}, ${log.country || 'N/A'}
${log.vin ? `VIN: ${log.vin}` : ''}
-------------------
    `).join('\n');
    
    const emailBody = `${message ? message + '\n\n' : ''}Vehicle Drive Logs Summary:\n\nTotal Trips: ${state.totalStats.trips}\nTotal Distance: ${state.totalStats.distance.toFixed(1)} mi\nTotal Duration: ${state.totalStats.duration.toFixed(1)} hrs\nAverage Speed: ${state.totalStats.avgSpeed.toFixed(1)} mph\n\n${logsSummary}`;
    
    const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoLink;
    
    showNotification('Opening email client...', 'success');
    closeEmailModal();
    
    document.getElementById('recipientEmail').value = '';
    document.getElementById('emailMessage').value = '';
}

function updateExportButtons() {
    const hasLogs = state.logs.length > 0;
    exportCsvBtn.disabled = !hasLogs;
    exportJsonBtn.disabled = !hasLogs;
    emailLogsBtn.disabled = !hasLogs;
    
    if (hasLogs) {
        exportNote.style.display = 'none';
    } else {
        exportNote.style.display = 'block';
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('vehicleLogs', JSON.stringify(state.logs));
    } catch (e) {
        console.error('Error saving to storage:', e);
        showNotification('Error saving data', 'error');
    }
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem('vehicleLogs');
        if (stored) {
            state.logs = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
        state.logs = [];
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
            document.head.removeChild(style);
        }, 300);
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

