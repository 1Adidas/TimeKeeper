// ===== DATA STORE =====
const STORAGE_KEYS = {
    SHIFTS: 'tk_shifts',
    RECORDS: 'tk_records',
    SETTINGS: 'tk_settings',
    CURRENT: 'tk_current',
    SELECTED_SHIFT: 'tk_selected_shift',
    PURCHASES: 'tk_purchases',
    TICKS: 'tk_ticks'
};

const TICK_BONUS_AMOUNT = 100000;
const TICKS_PER_BONUS = 3;

const DEFAULT_SHIFTS = [
    { id: 'morning', name: 'Ca sáng', emoji: '🌅', start: '06:00', end: '14:00', isDefault: true },
    { id: 'afternoon', name: 'Ca chiều', emoji: '☀️', start: '14:00', end: '22:00', isDefault: true },
    { id: 'evening', name: 'Ca tối', emoji: '🌙', start: '22:00', end: '06:00', isDefault: true },
    { id: 'fullday', name: 'Cả ngày', emoji: '📋', start: '08:00', end: '17:00', isDefault: true },
    { id: 'parttime-am', name: 'Bán thời gian (sáng)', emoji: '🕘', start: '06:00', end: '12:00', isDefault: true },
    { id: 'parttime-pm', name: 'Bán thời gian (chiều)', emoji: '🕐', start: '12:00', end: '17:00', isDefault: true },
    { id: 'parttime-pmn', name: 'Bán thời gian (tối)', emoji: '🕐', start: '17:00', end: '23:00', isDefault: true },
];

const WEEKDAYS_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VI = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
const FULL_WEEKDAYS_VI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

// ===== STATE =====
let state = {
    shifts: [],
    records: [],
    purchases: [],
    ticks: [],
    settings: { hourlyRate: 18000, bonusTypes: null },
    currentSession: null,
    selectedShift: null,
    currentPage: 'home',
    statsPeriod: 'week',
    historyFilter: 'month',
    historyTab: 'all',
    showAllShifts: false
};

let timerInterval = null;

// ===== INITIALIZATION =====
function init() {
    loadData();
    setupClock();
    renderShifts();
    updateHomeUI();
    updateRateDisplay();
    renderHistory();
    updateStats();
    updateBonusUI();
    updateTickUI();
    renderBonusSettings();

    // Set hourly rate input
    document.getElementById('hourlyRateInput').value = state.settings.hourlyRate;

    // Set notification toggle input
    const notiToggle = document.getElementById('notificationToggle');
    if (notiToggle) {
        notiToggle.checked = state.settings.notificationsEnabled || false;
    }

    // Register Service Worker for PWA / Mobile Notifications
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered successfully:', reg.scope))
            .catch(err => console.error('Service Worker registration failed:', err));
    }

    // Restore current session timer if active
    if (state.currentSession) {
        startTimer();
    }
}

function loadData() {
    try {
        const shifts = localStorage.getItem(STORAGE_KEYS.SHIFTS);
        state.shifts = shifts ? JSON.parse(shifts) : [...DEFAULT_SHIFTS];

        const records = localStorage.getItem(STORAGE_KEYS.RECORDS);
        state.records = records ? JSON.parse(records) : [];

        const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        state.settings = settings ? JSON.parse(settings) : { hourlyRate: 18000, notificationsEnabled: false };
        
        if (state.settings.notificationsEnabled === undefined) {
            state.settings.notificationsEnabled = false;
        }

        if (!state.settings.bonusTypes) {
            state.settings.bonusTypes = [
                { id: 'go', name: 'GO', amount: 12000, emoji: '🏬' },
                { id: 'chb', name: 'CHB', amount: 8000, emoji: '🍞' }
            ];
        }

        const current = localStorage.getItem(STORAGE_KEYS.CURRENT);
        state.currentSession = current ? JSON.parse(current) : null;

        const selectedShift = localStorage.getItem(STORAGE_KEYS.SELECTED_SHIFT);
        state.selectedShift = selectedShift ? JSON.parse(selectedShift) : null;

        const purchases = localStorage.getItem(STORAGE_KEYS.PURCHASES);
        state.purchases = purchases ? JSON.parse(purchases) : [];

        const ticks = localStorage.getItem(STORAGE_KEYS.TICKS);
        state.ticks = ticks ? JSON.parse(ticks) : [];
    } catch (e) {
        console.error('Error loading data:', e);
        state.shifts = [...DEFAULT_SHIFTS];
        state.records = [];
        state.purchases = [];
        state.ticks = [];
        state.settings = { 
            hourlyRate: 18000,
            bonusTypes: [
                { id: 'go', name: 'GO', amount: 12000, emoji: '🏬' },
                { id: 'chb', name: 'CHB', amount: 8000, emoji: '🍞' }
            ]
        };
        state.currentSession = null;
        state.selectedShift = null;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// ===== CLOCK =====
function setupClock() {
    updateClock();
    setInterval(updateClock, 1000);
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const clockTime = document.getElementById('clockTime');
    const clockSeconds = document.getElementById('clockSeconds');
    const clockDate = document.getElementById('clockDate');
    const headerClock = document.getElementById('headerClock');

    if (clockTime) clockTime.textContent = `${hours}:${minutes}`;
    if (clockSeconds) clockSeconds.textContent = seconds;
    if (headerClock) headerClock.textContent = `${hours}:${minutes}:${seconds}`;

    if (clockDate) {
        const dayName = FULL_WEEKDAYS_VI[now.getDay()];
        const day = now.getDate();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        clockDate.textContent = `${dayName}, ${day} tháng ${month}, ${year}`;
    }
}

// ===== NAVIGATION =====
function navigateTo(pageName) {
    state.currentPage = pageName;

    // Update pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        const title = targetPage.dataset.title || 'Chấm Công';
        document.getElementById('headerTitle').textContent = title;
    }

    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) navItem.classList.add('active');

    // Refresh page data
    if (pageName === 'history') renderHistory();
    if (pageName === 'stats') updateStats();
    if (pageName === 'shifts') renderShifts();
    if (pageName === 'settings') renderBonusSettings();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== CLOCK IN / OUT =====
function isTimeWithinShift(startStr, endStr) {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [sh, sm] = startStr.split(':').map(Number);
    const [eh, em] = endStr.split(':').map(Number);
    
    let startMins = sh * 60 + sm;
    let endMins = eh * 60 + em;
    
    // Cho phép vào ca sớm tối đa 30 phút
    let allowedStartMins = (startMins - 30 + 1440) % 1440;
    
    if (endMins > startMins) {
        // Ca không qua đêm (ví dụ: 08:00 -> 17:00)
        return currentMins >= allowedStartMins && currentMins <= endMins;
    } else {
        // Ca qua đêm (ví dụ: 22:00 -> 06:00)
        return currentMins >= allowedStartMins || currentMins <= endMins;
    }
}

function clockIn() {
    if (state.currentSession) {
        showToast('Bạn đang trong ca làm rồi!', 'warning');
        return;
    }

    if (!state.selectedShift) {
        showToast('Vui lòng chọn khung giờ làm việc trước!', 'warning');
        navigateTo('shifts');
        return;
    }

    if (!state.settings.hourlyRate || state.settings.hourlyRate <= 0) {
        showToast('Vui lòng cài đặt lương theo giờ trước!', 'warning');
        navigateTo('settings');
        return;
    }

    // Kiểm tra tính hợp lệ về mặt thời gian (chỉ áp dụng ca cố định, không áp dụng ca tự do)
    if (!state.selectedShift.isFreestyle && !isTimeWithinShift(state.selectedShift.start, state.selectedShift.end)) {
        showToast(`Giờ hiện tại không khớp với ${state.selectedShift.name} (${state.selectedShift.start} — ${state.selectedShift.end})!`, 'warning');
        return;
    }

    const now = new Date();
    state.currentSession = {
        shiftId: state.selectedShift.id,
        shiftName: state.selectedShift.name,
        shiftEmoji: state.selectedShift.emoji,
        startTime: now.toISOString(),
        hourlyRate: state.settings.hourlyRate
    };

    saveData(STORAGE_KEYS.CURRENT, state.currentSession);
    startTimer();
    updateHomeUI();
    showToast('Đã vào ca thành công!', 'success');

    if (state.settings.notificationsEnabled) {
        sendBrowserNotification(
            `🌅 TimeKeeper - Vào ca vui vẻ!`,
            `Chúc bạn một ca làm việc thật thuận lợi và tràn đầy năng lượng nhé! Cùng nỗ lực nào! 💪`
        );
    }
}

function getRecordMealAllowance(record) {
    if (record.mealAllowance !== undefined) return record.mealAllowance;
    const hours = record.durationHours;
    if (hours >= 16) return 40000;
    if (hours >= 8) return 20000;
    return 0;
}

function getRecordBaseEarnings(record) {
    if (record.baseEarnings !== undefined) return record.baseEarnings;
    return record.earnings - getRecordMealAllowance(record);
}

function clockOut() {
    if (!state.currentSession) {
        showToast('Bạn chưa vào ca!', 'warning');
        return;
    }

    const now = new Date();
    const start = new Date(state.currentSession.startTime);
    const durationMs = now - start;

    if (durationMs <= 0) {
        showToast('Thời gian ra ca không hợp lệ! Vui lòng kiểm tra lại giờ hệ thống.', 'warning');
        return;
    }

    const durationHours = durationMs / (1000 * 60 * 60);
    
    // Meal allowance calculation
    let mealAllowance = 0;
    if (durationHours >= 16) {
        mealAllowance = 40000;
    } else if (durationHours >= 8) {
        mealAllowance = 20000;
    }
    
    const baseEarnings = Math.round(durationHours * state.currentSession.hourlyRate);
    const earnings = baseEarnings + mealAllowance;

    const record = {
        id: Date.now().toString(),
        shiftId: state.currentSession.shiftId,
        shiftName: state.currentSession.shiftName,
        shiftEmoji: state.currentSession.shiftEmoji,
        startTime: state.currentSession.startTime,
        endTime: now.toISOString(),
        durationMs: durationMs,
        durationHours: parseFloat(durationHours.toFixed(2)),
        hourlyRate: state.currentSession.hourlyRate,
        mealAllowance: mealAllowance,
        baseEarnings: baseEarnings,
        earnings: earnings
    };

    state.records.unshift(record);
    saveData(STORAGE_KEYS.RECORDS, state.records);

    state.currentSession = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT);

    stopTimer();
    updateHomeUI();

    const formattedEarnings = formatCurrency(earnings);
    const formattedDuration = formatDurationFull(durationMs);
    showToast(`🏁 Đã ra ca! ${formattedDuration} — ${formattedEarnings}`, 'success');

    if (state.settings.notificationsEnabled) {
        sendBrowserNotification(
            `🏁 Hết ca rồi, về nghỉ ngơi thôi! 🎉`,
            `Hôm nay bạn đã làm việc cực kỳ vất vả và chăm chỉ rồi. Cảm ơn bạn rất nhiều vì sự nỗ lực tuyệt vời này! Hãy về nhà ăn một bữa thật ngon, tắm rửa và nghỉ ngơi sớm nhé. Bạn xứng đáng được thư giãn! 🥰💤`
        );
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerDisplay() {
    if (!state.currentSession) return;

    const now = new Date();
    const start = new Date(state.currentSession.startTime);
    const elapsed = now - start;

    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    const timerEl = document.getElementById('workTimer');
    if (timerEl) {
        timerEl.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }

    const earningsEl = document.getElementById('currentEarnings');
    if (earningsEl) {
        const durationHours = elapsed / 3600000;
        const earnings = Math.round(durationHours * state.currentSession.hourlyRate);
        earningsEl.textContent = formatCurrency(earnings);
    }

    // Update progress bar
    let percent = 0;
    let progressLabelText = 'Ca làm tự do';
    const shift = state.shifts.find(s => s.id === state.currentSession.shiftId);
    
    if (shift && !shift.isFreestyle && shift.end) {
        const endDate = getShiftEndDate(state.currentSession);
        if (endDate) {
            const totalDuration = endDate - start;
            if (totalDuration > 0) {
                percent = (elapsed / totalDuration) * 100;
                percent = Math.max(0, Math.min(100, percent));
                
                const timeLeftMs = endDate - now;
                if (timeLeftMs > 0) {
                    const leftHours = Math.floor(timeLeftMs / 3600000);
                    const leftMinutes = Math.floor((timeLeftMs % 3600000) / 60000);
                    progressLabelText = `Còn ${leftHours > 0 ? leftHours + 'h ' : ''}${leftMinutes}m nữa hết ca`;
                } else {
                    progressLabelText = 'Đã hết ca (tăng ca)';
                }
            }
        }
    } else {
        // Freestyle shift: progress towards 8 hours
        const targetMs = 8 * 60 * 60 * 1000;
        percent = (elapsed / targetMs) * 100;
        percent = Math.max(0, Math.min(100, percent));
        
        if (elapsed < targetMs) {
            const leftMs = targetMs - elapsed;
            const leftHours = Math.floor(leftMs / 3600000);
            const leftMinutes = Math.floor((leftMs % 3600000) / 60000);
            progressLabelText = `Mục tiêu 8h: còn ${leftHours > 0 ? leftHours + 'h ' : ''}${leftMinutes}m`;
        } else {
            progressLabelText = 'Đã đạt mục tiêu 8h';
        }
    }
    
    const progressBar = document.getElementById('shiftProgressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressText = document.getElementById('progressText');
    
    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
    if (progressText) progressText.textContent = progressLabelText;

    // 30-minute reminder before shift ends (only for fixed shifts)
    const endDate = getShiftEndDate(state.currentSession);
    if (endDate && state.settings.notificationsEnabled && !state.currentSession.notified30Mins) {
        const timeLeftMs = endDate - now;
        if (timeLeftMs > 0 && timeLeftMs <= 30 * 60 * 1000) {
            state.currentSession.notified30Mins = true;
            saveData(STORAGE_KEYS.CURRENT, state.currentSession);
            sendBrowserNotification(
                `⚠️ Sắp hoàn thành ca rồi, cố lên! 😭`,
                `Chỉ còn 30 phút nữa là hết ca thôi! Chân tay mỏi nhừ rồi đúng không? Cố gắng nốt một chút nữa thôi nhé, sắp được nghỉ ngơi rồi! 💪❤️`
            );
        }
    }
}

// ===== HOME UI =====
function updateHomeUI() {
    const statusCard = document.getElementById('statusCard');
    const statusText = document.getElementById('statusText');
    const currentShiftInfo = document.getElementById('currentShiftInfo');
    const btnClockIn = document.getElementById('btnClockIn');
    const btnClockOut = document.getElementById('btnClockOut');

    const btnChangeShift = document.querySelector('.btn-change-shift');
    const btnChangeRate = document.querySelector('.btn-change-rate');
    const progressContainer = document.getElementById('shiftProgressContainer');

    if (state.currentSession) {
        statusCard.classList.add('active');
        statusText.textContent = `Đang làm — ${state.currentSession.shiftName}`;
        currentShiftInfo.style.display = 'flex';
        if (progressContainer) progressContainer.style.display = 'block';
        
        btnClockIn.disabled = true;
        btnClockOut.disabled = false;
        if (btnChangeShift) btnChangeShift.style.display = 'none';
        if (btnChangeRate) btnChangeRate.style.display = 'none';
    } else {
        statusCard.classList.remove('active');
        statusText.textContent = 'Chưa vào ca';
        currentShiftInfo.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'none';
        
        btnClockIn.disabled = false;
        btnClockOut.disabled = true;
        if (btnChangeShift) btnChangeShift.style.display = 'block';
        if (btnChangeRate) btnChangeRate.style.display = 'block';

        const timerEl = document.getElementById('workTimer');
        const earningsEl = document.getElementById('currentEarnings');
        if (timerEl) timerEl.textContent = '00:00:00';
        if (earningsEl) earningsEl.textContent = '0 ₫';
    }

    // Update selected shift display
    const shiftName = document.getElementById('selectedShiftName');
    const shiftTime = document.getElementById('selectedShiftTime');

    if (state.selectedShift) {
        shiftName.textContent = `${state.selectedShift.emoji} ${state.selectedShift.name}`;
        if (state.selectedShift.isFreestyle) {
            shiftTime.textContent = 'Thời gian tự do';
        } else {
            shiftTime.textContent = `${state.selectedShift.start} — ${state.selectedShift.end}`;
        }
    } else {
        shiftName.textContent = 'Chưa chọn ca';
        shiftTime.textContent = 'Vui lòng chọn khung giờ';
    }

    // Call updateSettingsUI helper to enable/disable settings controls dynamically
    updateSettingsUI();
}

function updateRateDisplay() {
    const rateValue = document.getElementById('rateValue');
    if (rateValue) {
        rateValue.textContent = `${formatNumber(state.settings.hourlyRate)} ₫/giờ`;
    }
}

function updateSettingsUI() {
    const input = document.getElementById('hourlyRateInput');
    const saveBtn = document.querySelector('#page-settings button[onclick="saveRate()"]');
    const presets = document.querySelectorAll('#page-settings .preset-btn');
    
    const isDisabled = state.currentSession !== null;
    
    if (input) input.disabled = isDisabled;
    if (saveBtn) saveBtn.disabled = isDisabled;
    presets.forEach(btn => btn.disabled = isDisabled);
}

// ===== SHIFTS =====
function toggleAllShifts() {
    state.showAllShifts = !state.showAllShifts;
    const btn = document.getElementById('btnToggleAllShifts');
    if (btn) btn.textContent = state.showAllShifts ? 'Thu gọn' : 'Xem tất cả';
    renderShifts();
}

function renderShifts() {
    const grid = document.getElementById('shiftsGrid');
    if (!grid) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMins = currentHours * 60 + currentMinutes;

    let displayShifts = [...state.shifts];
    
    // Always add Freestyle Shift at the beginning
    const freestyleShift = { id: 'freestyle', name: 'Ca Tự Do', emoji: '⏱️', isFreestyle: true };
    displayShifts.unshift(freestyleShift);

    grid.innerHTML = displayShifts.map(shift => {
        let isHidden = false;
        if (!state.showAllShifts && !shift.isFreestyle) {
            isHidden = !isTimeWithinShift(shift.start, shift.end);
        }

        if (isHidden) return '';

        const isSelected = state.selectedShift && state.selectedShift.id === shift.id;
        const duration = shift.isFreestyle ? '---' : calculateShiftDuration(shift.start, shift.end) + ' giờ';
        const showDelete = !shift.isDefault && !shift.isFreestyle;
        const timeDisplay = shift.isFreestyle ? 'Tự do' : `${shift.start} — ${shift.end}`;

        return `
            <div class="shift-card ${isSelected ? 'selected' : ''}" onclick="selectShift('${shift.id}', ${shift.isFreestyle})">
                <div class="shift-card-emoji" style="background: ${getShiftBg(shift.id)}">${shift.emoji}</div>
                <div class="shift-card-info">
                    <div class="shift-card-name">${shift.name}</div>
                    <div class="shift-card-time">${timeDisplay}</div>
                    <div class="shift-card-duration">${duration}</div>
                </div>
                ${showDelete ? `<button class="shift-card-delete visible" onclick="event.stopPropagation(); deleteShift('${shift.id}')">✕</button>` : ''}
            </div>
        `;
    }).join('');
}

function selectShift(shiftId, isFreestyle = false) {
    if (state.currentSession) {
        showToast('Bạn không thể đổi ca khi đang làm việc!', 'warning');
        return;
    }

    let shift;
    if (isFreestyle) {
        shift = { id: 'freestyle', name: 'Ca Tự Do', emoji: '⏱️', isFreestyle: true };
    } else {
        shift = state.shifts.find(s => s.id === shiftId);
    }
    
    if (!shift) return;

    state.selectedShift = shift;
    saveData(STORAGE_KEYS.SELECTED_SHIFT, state.selectedShift);

    renderShifts();
    updateHomeUI();
    showToast(`✓ Đã chọn ${shift.name}`, 'info');
}

function addCustomShift() {
    const nameInput = document.getElementById('customShiftName');
    const startInput = document.getElementById('customStartTime');
    const endInput = document.getElementById('customEndTime');

    const name = nameInput.value.trim();
    const start = startInput.value;
    const end = endInput.value;

    if (!name) {
        showToast('Vui lòng nhập tên ca', 'warning');
        return;
    }
    if (!start || !end) {
        showToast('Vui lòng chọn giờ bắt đầu và kết thúc', 'warning');
        return;
    }

    const newShift = {
        id: 'custom-' + Date.now(),
        name: name,
        emoji: '⚙️',
        start: start,
        end: end,
        isDefault: false
    };

    state.shifts.push(newShift);
    saveData(STORAGE_KEYS.SHIFTS, state.shifts);

    nameInput.value = '';
    startInput.value = '';
    endInput.value = '';

    renderShifts();
    showToast(`✅ Đã thêm ca "${name}"`, 'success');
}

function deleteShift(shiftId) {
    const shift = state.shifts.find(s => s.id === shiftId);
    if (!shift || shift.isDefault) return;

    showModal(
        'Xóa ca làm',
        `Bạn có chắc muốn xóa ca "${shift.name}"?`,
        [
            { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
            {
                text: 'Xóa', class: 'modal-btn-danger', action: () => {
                    state.shifts = state.shifts.filter(s => s.id !== shiftId);
                    saveData(STORAGE_KEYS.SHIFTS, state.shifts);

                    if (state.selectedShift && state.selectedShift.id === shiftId) {
                        state.selectedShift = null;
                        localStorage.removeItem(STORAGE_KEYS.SELECTED_SHIFT);
                        updateHomeUI();
                    }

                    renderShifts();
                    closeModal();
                    showToast('Đã xóa ca', 'info');
                }
            }
        ]
    );
}

function getShiftBg(id) {
    const bgs = {
        'morning': 'rgba(251, 191, 36, 0.12)',
        'afternoon': 'rgba(251, 146, 60, 0.12)',
        'evening': 'rgba(139, 92, 246, 0.12)',
        'fullday': 'rgba(6, 182, 212, 0.12)',
        'parttime-am': 'rgba(52, 211, 153, 0.12)',
        'parttime-pm': 'rgba(244, 114, 182, 0.12)'
    };
    return bgs[id] || 'rgba(167, 139, 250, 0.1)';
}

function calculateShiftDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin <= startMin) endMin += 24 * 60;
    return ((endMin - startMin) / 60).toFixed(1);
}

// ===== HISTORY =====
function setHistoryTab(tabId) {
    state.historyTab = tabId;
    document.querySelectorAll('.history-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return;

    // Filter combined items
    const items = getFilteredHistoryItems();

    // Update summary cards dynamically based on active tab
    const card1 = document.querySelector('.history-summary .summary-card:nth-child(1)');
    const card2 = document.querySelector('.history-summary .summary-card:nth-child(2)');
    const card3 = document.querySelector('.history-summary .summary-card:nth-child(3)');
    
    const { startDate, endDate } = getHistoryFilterDates();
    const periodRecords = state.records.filter(r => {
        const d = new Date(r.startTime);
        return d >= startDate && d <= endDate;
    });
    
    const totalHours = periodRecords.reduce((sum, r) => sum + r.durationHours, 0);
    const shiftEarnings = periodRecords.reduce((sum, r) => sum + r.earnings, 0);
    
    const periodPurchases = state.purchases.filter(p => {
        const d = new Date(p.date);
        return d >= startDate && d <= endDate;
    });
    const purchaseTotal = periodPurchases.reduce((sum, p) => sum + p.amount, 0);
    
    const milestones = getTickMilestones();
    const periodMilestones = milestones.filter(m => {
        const d = new Date(m.date);
        return d >= startDate && d <= endDate;
    });
    const milestoneTotal = periodMilestones.reduce((sum, m) => sum + m.amount, 0);
    
    const periodTicks = state.ticks.filter(t => {
        const d = new Date(t.date);
        return d >= startDate && d <= endDate;
    });

    if (card1 && card2 && card3) {
        const icon1 = card1.querySelector('.summary-icon');
        const val1 = card1.querySelector('.summary-value');
        const lbl1 = card1.querySelector('.summary-label');
        
        const icon2 = card2.querySelector('.summary-icon');
        const val2 = card2.querySelector('.summary-value');
        const lbl2 = card2.querySelector('.summary-label');
        
        const icon3 = card3.querySelector('.summary-icon');
        const val3 = card3.querySelector('.summary-value');
        const lbl3 = card3.querySelector('.summary-label');

        if (state.historyTab === 'all') {
            icon1.textContent = '📅';
            lbl1.textContent = 'Số ca';
            val1.textContent = periodRecords.length;
            
            icon2.textContent = '⏱️';
            lbl2.textContent = 'Tổng giờ';
            val2.textContent = `${totalHours.toFixed(1)}h`;
            
            icon3.textContent = '💵';
            lbl3.textContent = 'Thu nhập';
            val3.textContent = formatCurrencyShort(shiftEarnings + purchaseTotal + milestoneTotal);
        } else if (state.historyTab === 'shift') {
            icon1.textContent = '📅';
            lbl1.textContent = 'Số ca';
            val1.textContent = periodRecords.length;
            
            icon2.textContent = '⏱️';
            lbl2.textContent = 'Tổng giờ';
            val2.textContent = `${totalHours.toFixed(1)}h`;
            
            icon3.textContent = '💵';
            lbl3.textContent = 'Lương ca';
            val3.textContent = formatCurrencyShort(shiftEarnings);
        } else if (state.historyTab === 'bonus') {
            icon1.textContent = '🎁';
            lbl1.textContent = 'Lần nhận';
            val1.textContent = periodPurchases.length + periodMilestones.length;
            
            icon2.textContent = '⭐';
            lbl2.textContent = 'Thưởng tick';
            val2.textContent = formatCurrencyShort(milestoneTotal);
            
            icon3.textContent = '💵';
            lbl3.textContent = 'Tiền thưởng';
            val3.textContent = formatCurrencyShort(purchaseTotal + milestoneTotal);
        } else if (state.historyTab === 'tick') {
            icon1.textContent = '👍';
            lbl1.textContent = 'Tick Tốt';
            val1.textContent = periodTicks.filter(t => t.type === 'good').length;
            
            icon2.textContent = '👎';
            lbl2.textContent = 'Tick Xấu';
            val2.textContent = periodTicks.filter(t => t.type === 'bad').length;
            
            icon3.textContent = '📊';
            lbl3.textContent = 'Tổng thưởng';
            val3.textContent = (milestoneTotal >= 0 ? '+' : '') + formatCurrencyShort(milestoneTotal);
        }
    }

    if (items.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Chưa có lịch sử</p>
                <span>Chưa có dữ liệu cho mục này!</span>
            </div>
        `;
        return;
    }

    // Group items by date string
    const grouped = [];
    let currentDate = '';
    
    items.forEach(item => {
        const d = item.dateObj;
        const dateKey = `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
        
        if (currentDate !== dateKey) {
            grouped.push({
                dateKey: dateKey,
                dateObj: d,
                items: []
            });
            currentDate = dateKey;
        }
        grouped[grouped.length - 1].items.push(item);
    });

    list.innerHTML = grouped.map((group, gIndex) => {
        const day = group.dateObj.getDate();
        const month = MONTHS_VI[group.dateObj.getMonth()];
        const dayName = FULL_WEEKDAYS_VI[group.dateObj.getDay()];

        const itemsHtml = group.items.map((item, index) => {
            const d = item.dateObj;
            const timeStr = formatTime(d);

            if (item.itemType === 'shift') {
                const record = item.data;
                const endDate = new Date(record.endTime);
                const endTimeStr = formatTime(endDate);
                const durationStr = formatDurationShort(record.durationMs);
                const mealAllowance = getRecordMealAllowance(record);
                const mealBadge = mealAllowance > 0 ? `<span class="history-meal-badge" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.65rem; background: rgba(34, 197, 94, 0.12); color: var(--accent-green); border: 1px solid rgba(34, 197, 94, 0.2); padding: 2px 6px; border-radius: 6px;">🍴 +${formatCurrencyShort(mealAllowance)} ăn</span>` : '';
                
                let manualBadge = '';
                if (record.isManual) {
                    const isFuture = new Date(record.startTime) > new Date(record.createdAt || Number(record.id.replace('manual-', '')) || Date.now());
                    if (isFuture) {
                        manualBadge = `<span class="history-manual-badge" style="display: inline-flex; align-items: center; background: rgba(139, 92, 246, 0.12); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.2); padding: 2px 6px; border-radius: 6px;">🔮 Chấm công trước</span>`;
                    } else {
                        manualBadge = `<span class="history-manual-badge" style="display: inline-flex; align-items: center; background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); padding: 2px 6px; border-radius: 6px;">✍️ Chấm công bù</span>`;
                    }
                }

                const hasBadges = mealBadge || manualBadge;
                const badgesRow = hasBadges ? `
                    <div class="history-badges" style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px;">
                        ${mealBadge}${manualBadge}
                    </div>
                ` : '';

                return `
                    <div class="history-item" style="animation-delay: ${Math.min((gIndex*0.1) + index * 0.05, 0.5)}s; margin-bottom: 8px;">
                        <div class="history-info" style="margin-left: 0; display: flex; gap: 10px; align-items: flex-start; flex: 1; min-width: 0;">
                            <div style="font-size: 1.2rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; flex-shrink: 0; margin-top: 1px;">
                                ${record.shiftEmoji || '📋'}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
                                <div class="history-shift-name" style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0; display: block; white-space: normal; overflow: visible; text-overflow: clip;">
                                    ${record.shiftName}
                                </div>
                                ${badgesRow}
                                <div class="history-time-range" style="margin-top: 2px;">
                                    ${timeStr} → ${endTimeStr}
                                </div>
                            </div>
                        </div>
                        <div class="history-right">
                            <div class="history-duration">${durationStr}</div>
                            <div class="history-earnings">${formatCurrencyShort(record.earnings)}</div>
                        </div>
                        <button class="history-item-delete" onclick="deleteRecord('${record.id}')">✕</button>
                    </div>
                `;
            } else if (item.itemType === 'bonus') {
                const bonus = item.data;
                const bonusType = state.settings.bonusTypes.find(b => b.id === bonus.typeId) || { name: bonus.store, emoji: bonus.store === 'GO' ? '🏬' : '🍞' };
                return `
                    <div class="history-item" style="animation-delay: ${Math.min((gIndex*0.1) + index * 0.05, 0.5)}s; margin-bottom: 8px;">
                        <div class="history-info" style="margin-left: 0; display: flex; gap: 10px; align-items: flex-start; flex: 1; min-width: 0;">
                            <div style="font-size: 1.2rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; flex-shrink: 0; margin-top: 1px;">
                                ${bonusType.emoji}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
                                <div style="font-size: 0.82rem; font-weight: 600; color: var(--text-primary);">
                                    Thưởng: ${bonusType.name}
                                </div>
                                <div style="font-size: 0.73rem; color: var(--text-secondary);">
                                    ${timeStr}
                                </div>
                                ${bonus.note ? `<div class="bonus-note" style="margin-top: 2px;">"${bonus.note}"</div>` : ''}
                            </div>
                        </div>
                        <div class="history-right">
                            <div class="history-earnings" style="color:var(--accent-cyan);">+${formatCurrencyShort(bonus.amount)}</div>
                        </div>
                        <button class="history-item-delete" onclick="deletePurchase('${bonus.id}')">✕</button>
                    </div>
                `;
            } else if (item.itemType === 'milestone') {
                const milestone = item.data;
                const isPositive = milestone.amount >= 0;
                return `
                    <div class="history-item" style="animation-delay: ${Math.min((gIndex*0.1) + index * 0.05, 0.5)}s; margin-bottom: 8px;">
                        <div class="history-info" style="margin-left: 0; display: flex; gap: 10px; align-items: flex-start; flex: 1; min-width: 0;">
                            <div style="font-size: 1.2rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; flex-shrink: 0; margin-top: 1px;">
                                ${milestone.emoji}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
                                <div style="font-size: 0.82rem; font-weight: 600; color: ${isPositive ? 'var(--accent-green)' : 'var(--accent-red)'};">
                                    ${milestone.name}
                                </div>
                                <div style="font-size: 0.73rem; color: var(--text-secondary);">
                                    ${timeStr}
                                </div>
                            </div>
                        </div>
                        <div class="history-right">
                            <div class="history-earnings" style="color:${isPositive ? 'var(--accent-green)' : 'var(--accent-red)'};">${isPositive ? '+' : ''}${formatCurrencyShort(milestone.amount)}</div>
                        </div>
                    </div>
                `;
            } else if (item.itemType === 'tick') {
                const tick = item.data;
                const isGood = tick.type === 'good';
                return `
                    <div class="history-item" style="animation-delay: ${Math.min((gIndex*0.1) + index * 0.05, 0.5)}s; margin-bottom: 8px;">
                        <div class="history-info" style="margin-left: 0; display: flex; gap: 10px; align-items: flex-start; flex: 1; min-width: 0;">
                            <div style="font-size: 1.2rem; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; flex-shrink: 0; margin-top: 1px;">
                                ${isGood ? '👍' : '👎'}
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1;">
                                <div style="font-weight: 600; color: ${isGood ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 0.82rem;">
                                    Tick ${isGood ? 'Tốt' : 'Xấu'}
                                </div>
                                <div style="font-size: 0.73rem; color: var(--text-secondary);">
                                    ${timeStr}
                                </div>
                                ${tick.note ? `<div class="tick-note" style="margin-top: 2px;">"${tick.note}"</div>` : ''}
                            </div>
                        </div>
                        <button class="history-item-delete" onclick="deleteTick('${tick.id}')">✕</button>
                    </div>
                `;
            }
        }).join('');

        return `
            <div class="history-day-group" style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-glass); border-radius: 16px; padding: 15px; margin-bottom: 16px; animation: slideUp 0.3s ease forwards;">
                <div class="history-day-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 12px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <div style="background:var(--accent-purple); color:#fff; font-weight:700; width:40px; height:40px; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; line-height:1;">
                            <span style="font-size:1.1rem;">${day}</span>
                            <span style="font-size:0.6rem; opacity:0.8; text-transform:uppercase;">${month}</span>
                        </div>
                        <span style="font-weight:600; color:var(--text-primary); font-size: 0.95rem;">${dayName}</span>
                    </div>
                </div>
                <div class="history-day-items">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function filterHistory() {
    state.historyFilter = document.getElementById('historyFilter').value;
    renderHistory();
}

function getFilteredHistoryItems() {
    const { startDate, endDate } = getHistoryFilterDates();
    let items = [];

    if (state.historyTab === 'all' || state.historyTab === 'shift') {
        state.records.forEach(r => {
            const d = new Date(r.startTime);
            if (d >= startDate && d <= endDate) {
                items.push({ itemType: 'shift', dateObj: d, data: r });
            }
        });
    }

    if (state.historyTab === 'all' || state.historyTab === 'bonus') {
        state.purchases.forEach(p => {
            const d = new Date(p.date);
            if (d >= startDate && d <= endDate) {
                items.push({ itemType: 'bonus', dateObj: d, data: p });
            }
        });
        
        // Add tick milestones to history under bonus/all
        const milestones = getTickMilestones();
        milestones.forEach(m => {
            const d = new Date(m.date);
            if (d >= startDate && d <= endDate) {
                items.push({ itemType: 'milestone', dateObj: d, data: m });
            }
        });
    }

    if (state.historyTab === 'all' || state.historyTab === 'tick') {
        state.ticks.forEach(t => {
            const d = new Date(t.date);
            if (d >= startDate && d <= endDate) {
                items.push({ itemType: 'tick', dateObj: d, data: t });
            }
        });
    }

    // Sort descending by date
    items.sort((a, b) => b.dateObj - a.dateObj);
    return items;
}

function getFilteredRecords() {
    return getFilteredHistoryItems()
        .filter(i => i.itemType === 'shift')
        .map(i => i.data);
}

function deleteRecord(recordId) {
    showModal(
        'Xóa bản ghi',
        'Bạn có chắc muốn xóa bản ghi chấm công này?',
        [
            { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
            {
                text: 'Xóa', class: 'modal-btn-danger', action: () => {
                    state.records = state.records.filter(r => r.id !== recordId);
                    saveData(STORAGE_KEYS.RECORDS, state.records);
                    renderHistory();
                    updateStats();
                    closeModal();
                    showToast('Đã xóa bản ghi', 'info');
                }
            }
        ]
    );
}

// ===== STATS =====
function changePeriod(period) {
    state.statsPeriod = period;

    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.period-btn[data-period="${period}"]`).classList.add('active');

    updateStats();
}

function updateStats() {
    const records = getRecordsForPeriod(state.statsPeriod);

    const totalEarnings = records.reduce((sum, r) => sum + r.earnings, 0);
    const totalHours = records.reduce((sum, r) => sum + r.durationHours, 0);
    const totalShifts = records.length;

    // Period label
    const labels = { week: 'Tuần này', month: 'Tháng này', year: 'Năm nay' };
    document.getElementById('statsPeriodLabel').textContent = labels[state.statsPeriod] || 'Tuần này';

    // Purchase & tick stats for this period
    const periodStart = getPeriodStartDate(state.statsPeriod);
    const periodPurchases = state.purchases.filter(p => new Date(p.date) >= periodStart);
    const periodTicks = state.ticks.filter(t => new Date(t.date) >= periodStart);
    
    const tickMilestones = getTickMilestones();
    const periodMilestones = tickMilestones.filter(m => new Date(m.date) >= periodStart);
    
    const purchaseTotal = periodPurchases.reduce((sum, p) => sum + p.amount, 0);
    const tickNet = periodMilestones.reduce((sum, m) => sum + m.amount, 0);
    const grandTotal = totalEarnings + purchaseTotal + tickNet;

    // Stats values
    document.getElementById('statsTotalEarnings').textContent = formatCurrency(grandTotal);
    document.getElementById('statsTotalHours').textContent = `${totalHours.toFixed(1)}h`;
    document.getElementById('statsTotalShifts').textContent = `${totalShifts} ca`;
    document.getElementById('statsPurchaseTotal').textContent = formatCurrencyShort(purchaseTotal);
    
    const tickNetEl = document.getElementById('statsTickNet');
    if (tickNetEl) {
        tickNetEl.textContent = (tickNet >= 0 ? '+' : '') + formatCurrencyShort(tickNet);
        tickNetEl.style.color = tickNet >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    // Calculate averages
    const daysInPeriod = getDaysInPeriod(state.statsPeriod);
    const avgDaily = daysInPeriod > 0 ? Math.round(grandTotal / daysInPeriod) : 0;
    const avgShift = totalShifts > 0 ? Math.round(grandTotal / totalShifts) : 0;

    document.getElementById('statsAvgDaily').textContent = formatCurrencyShort(avgDaily);
    document.getElementById('statsAvgShift').textContent = formatCurrencyShort(avgShift);

    // Chart
    renderChart(records);

    // Breakdown
    renderBreakdown(records, periodPurchases, periodTicks, periodMilestones);
}

function getRecordsForPeriod(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = getStartOfWeek(now);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(0);
    }

    return state.records.filter(r => new Date(r.startTime) >= startDate);
}

function getDaysInPeriod(period) {
    const now = new Date();
    switch (period) {
        case 'week': return now.getDay() || 7;
        case 'month': return now.getDate();
        case 'year': {
            const start = new Date(now.getFullYear(), 0, 1);
            return Math.ceil((now - start) / 86400000) + 1;
        }
        default: return 1;
    }
}

function renderChart(records) {
    const canvas = document.getElementById('earningsChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = wrapper.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Group by date
    const dailyData = {};
    records.forEach(r => {
        const dateKey = new Date(r.startTime).toLocaleDateString('vi-VN');
        if (!dailyData[dateKey]) dailyData[dateKey] = 0;
        dailyData[dateKey] += r.earnings;
    });

    // Get labels based on period
    let labels = [];
    let values = [];

    if (state.statsPeriod === 'week') {
        const now = new Date();
        const startOfWeek = getStartOfWeek(now);

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            const key = d.toLocaleDateString('vi-VN');
            labels.push(WEEKDAYS_VI[(d.getDay()) % 7]);
            values.push(dailyData[key] || 0);
        }
    } else if (state.statsPeriod === 'month') {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const step = daysInMonth > 15 ? 3 : 1;

        for (let i = 1; i <= daysInMonth; i += step) {
            const d = new Date(now.getFullYear(), now.getMonth(), i);
            const endD = new Date(now.getFullYear(), now.getMonth(), Math.min(i + step - 1, daysInMonth));
            let sum = 0;
            for (let j = i; j <= Math.min(i + step - 1, daysInMonth); j++) {
                const dd = new Date(now.getFullYear(), now.getMonth(), j);
                const key = dd.toLocaleDateString('vi-VN');
                sum += dailyData[key] || 0;
            }
            labels.push(`${i}`);
            values.push(sum);
        }
    } else {
        for (let m = 0; m < 12; m++) {
            labels.push(MONTHS_VI[m]);
            let sum = 0;
            records.forEach(r => {
                const d = new Date(r.startTime);
                if (d.getMonth() === m) sum += r.earnings;
            });
            values.push(sum);
        }
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (values.length === 0 || values.every(v => v === 0)) {
        ctx.fillStyle = 'rgba(240, 240, 255, 0.3)';
        ctx.font = '13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Chưa có dữ liệu', width / 2, height / 2);
        return;
    }

    const padding = { top: 20, right: 10, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const maxVal = Math.max(...values, 1);
    const barWidth = Math.min(chartWidth / labels.length * 0.6, 28);
    const gap = chartWidth / labels.length;

    // Draw bars
    labels.forEach((label, i) => {
        const x = padding.left + i * gap + gap / 2 - barWidth / 2;
        const barHeight = (values[i] / maxVal) * chartHeight;
        const y = padding.top + chartHeight - barHeight;

        // Bar gradient
        const grad = ctx.createLinearGradient(x, y, x, y + barHeight);
        grad.addColorStop(0, 'rgba(167, 139, 250, 0.9)');
        grad.addColorStop(1, 'rgba(6, 182, 212, 0.6)');

        ctx.beginPath();
        const radius = Math.min(4, barWidth / 2);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight);
        ctx.lineTo(x, y + barHeight);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fillStyle = grad;
        ctx.fill();

        // Glow
        ctx.shadowColor = 'rgba(167, 139, 250, 0.3)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = 'rgba(240, 240, 255, 0.5)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, padding.left + i * gap + gap / 2, height - 8);

        // Value on top (if nonzero)
        if (values[i] > 0) {
            ctx.fillStyle = 'rgba(240, 240, 255, 0.7)';
            ctx.font = '9px Inter';
            ctx.fillText(formatCurrencyShort(values[i]), padding.left + i * gap + gap / 2, y - 6);
        }
    });
}

function renderBreakdown(records, purchases, ticks, tickMilestones) {
    const list = document.getElementById('breakdownList');
    if (!list) return;

    // Group by date
    const daily = {};

    function initDay(key, date) {
        if (!daily[key]) {
            daily[key] = {
                date: date,
                shiftEarnings: 0,
                bonusEarnings: 0,
                mealAllowance: 0,
                hours: 0,
                shifts: 0,
                bonuses: [],
                ticks: [],
                shiftDetails: []
            };
        }
    }

    // 1. Group shift records
    records.forEach(r => {
        const d = new Date(r.startTime);
        const key = d.toLocaleDateString('vi-VN');
        initDay(key, d);
        daily[key].shiftEarnings += r.earnings;
        daily[key].hours += r.durationHours;
        daily[key].shifts++;
        daily[key].mealAllowance += getRecordMealAllowance(r);
        
        // Save shift details (times & badges)
        const startStr = formatTime(new Date(r.startTime));
        const endStr = formatTime(new Date(r.endTime));
        let typeText = '';
        if (r.isManual) {
            const isFuture = new Date(r.startTime) > new Date(r.createdAt || Number(r.id.replace('manual-', '')) || Date.now());
            typeText = isFuture ? 'Chấm công trước' : 'Chấm công bù';
        }
        daily[key].shiftDetails.push({
            name: r.shiftName,
            emoji: r.shiftEmoji || '📋',
            start: startStr,
            end: endStr,
            typeText: typeText
        });
    });

    // 2. Group purchases (bonuses)
    if (purchases) {
        purchases.forEach(p => {
            const d = new Date(p.date);
            const key = d.toLocaleDateString('vi-VN');
            initDay(key, d);
            daily[key].bonusEarnings += p.amount;
            
            // Find bonus type name/emoji
            const bType = state.settings.bonusTypes?.find(b => b.id === p.typeId) || { emoji: '🎁', name: p.store };
            daily[key].bonuses.push({
                name: bType.name,
                emoji: bType.emoji,
                amount: p.amount
            });
        });
    }

    // 3. Group tick milestones
    if (tickMilestones) {
        tickMilestones.forEach(m => {
            const d = new Date(m.date);
            const key = d.toLocaleDateString('vi-VN');
            initDay(key, d);
            daily[key].bonusEarnings += m.amount;
            daily[key].bonuses.push({
                name: m.name,
                emoji: m.emoji,
                amount: m.amount
            });
        });
    }

    // 4. Group ticks
    if (ticks) {
        ticks.forEach(t => {
            const d = new Date(t.date);
            const key = d.toLocaleDateString('vi-VN');
            initDay(key, d);
            daily[key].ticks.push({
                type: t.type,
                note: t.note,
                time: formatTime(d)
            });
        });
    }

    const entries = Object.values(daily).sort((a, b) => b.date - a.date);

    if (entries.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📊</div>
                <p>Chưa có dữ liệu</p>
            </div>
        `;
        return;
    }

    // Max daily total (shift + bonus) for the bar scale
    const maxTotal = Math.max(...entries.map(e => e.shiftEarnings + e.bonusEarnings), 1);

    list.innerHTML = entries.map(entry => {
        const dayName = WEEKDAYS_VI[entry.date.getDay()];
        const dateStr = `${entry.date.getDate()}/${entry.date.getMonth() + 1}`;
        const totalDayEarnings = entry.shiftEarnings + entry.bonusEarnings;
        const barWidth = Math.max(0, (totalDayEarnings / maxTotal) * 100);

        // Render bonus tags/badges for this day
        let tagsHtml = '';
        if (entry.mealAllowance > 0) {
            tagsHtml += `<span class="breakdown-bonus-badge" style="padding: 2px 6px; border-radius: 6px; font-size: 0.65rem; background: rgba(34, 197, 94, 0.12); color: var(--accent-green); border: 1px solid rgba(34, 197, 94, 0.2); display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; margin-bottom: 4px;">🍴 Trợ cấp ăn (+${formatCurrencyShort(entry.mealAllowance)})</span>`;
        }
        if (entry.bonuses.length > 0 || entry.ticks.length > 0) {
            tagsHtml += entry.bonuses.map(b => 
                `<span class="breakdown-bonus-badge" style="padding: 2px 6px; border-radius: 6px; font-size: 0.65rem; background: ${b.amount >= 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${b.amount >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)'}; border: 1px solid ${b.amount >= 0 ? 'rgba(6, 182, 212, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; margin-bottom: 4px;">${b.emoji} ${b.name} (${b.amount >= 0 ? '+' : ''}${formatCurrencyShort(b.amount)})</span>`
            ).join('');
            
            tagsHtml += entry.ticks.map(t =>
                `<span class="breakdown-tick-badge" style="padding: 2px 6px; border-radius: 6px; font-size: 0.65rem; background: ${t.type === 'good' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)'}; color: ${t.type === 'good' ? 'var(--accent-green)' : 'var(--accent-red)'}; border: 1px solid ${t.type === 'good' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; margin-bottom: 4px;">${t.type === 'good' ? '👍' : '👎'} Tick ${t.type === 'good' ? 'tốt' : 'xấu'}${t.note ? `: ${t.note}` : ''}</span>`
            ).join('');
        } else if (entry.mealAllowance === 0) {
            tagsHtml += `<span class="breakdown-bonus-badge none" style="padding: 2px 6px; border-radius: 6px; font-size: 0.65rem; background: rgba(255, 255, 255, 0.04); color: var(--text-muted); border: 1px solid rgba(255, 255, 255, 0.08); display: inline-flex; align-items: center; gap: 4px; margin-right: 4px; margin-bottom: 4px;">Không có hoạt động khác</span>`;
        }

        let shiftTimesHtml = '';
        if (entry.shiftDetails && entry.shiftDetails.length > 0) {
            shiftTimesHtml = `
                <div class="breakdown-shifts-list" style="display:flex; flex-direction:column; gap:4px; margin-bottom:4px; padding-left:2px; font-size:0.75rem; color:var(--text-secondary);">
                    ${entry.shiftDetails.map(sd => {
                        let badgeHtml = '';
                        if (sd.typeText) {
                            const isFuture = sd.typeText.includes('trước');
                            const badgeStyle = isFuture 
                                ? 'background: rgba(139, 92, 246, 0.12); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.2);'
                                : 'background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);';
                            badgeHtml = `<span style="padding: 1px 4px; border-radius: 4px; font-size: 0.6rem; margin-left: 4px; ${badgeStyle}">${sd.typeText}</span>`;
                        }
                        return `
                            <div style="display:flex; align-items:center; gap:6px;">
                                <span>${sd.emoji}</span>
                                <span style="font-weight:500; color:var(--text-primary);">${sd.name}</span>
                                <span style="opacity:0.6;">(${sd.start} - ${sd.end})</span>
                                ${badgeHtml}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        return `
            <div class="breakdown-item-v2" style="display:flex; flex-direction:column; gap:6px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px solid var(--border-glass); margin-bottom: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="breakdown-day" style="font-weight:600; color:var(--text-primary); font-size:0.85rem;">${dayName} ${dateStr}</span>
                    <span class="breakdown-amount" style="font-weight:700; color:${totalDayEarnings >= 0 ? 'var(--accent-cyan)' : 'var(--accent-red)'}; font-size:0.85rem;">${formatCurrencyShort(totalDayEarnings)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:var(--text-secondary);">
                    <span>Ca làm: ${formatCurrencyShort(entry.shiftEarnings)} (${entry.hours.toFixed(1)}h)</span>
                    <span>Thưởng/Phạt: ${(entry.bonusEarnings >= 0 && entry.bonusEarnings !== 0 ? '+' : '')}${formatCurrencyShort(entry.bonusEarnings)}</span>
                </div>
                ${shiftTimesHtml}
                <div class="breakdown-bar-container" style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
                    <div class="breakdown-bar" style="width: ${barWidth}%; height:100%; background:linear-gradient(90deg, var(--accent-purple), var(--accent-cyan)); border-radius:2px;"></div>
                </div>
                <div class="breakdown-bonuses-list" style="display:flex; flex-wrap:wrap; margin-top:2px;">
                    ${tagsHtml}
                </div>
            </div>
        `;
    }).join('');
}

// ===== SETTINGS =====
function setRate(amount) {
    document.getElementById('hourlyRateInput').value = amount;
}

function saveRate() {
    if (state.currentSession) {
        showToast('Bạn không thể thay đổi mức lương khi đang làm việc!', 'warning');
        return;
    }

    const input = document.getElementById('hourlyRateInput');
    const rate = parseInt(input.value);

    if (isNaN(rate) || rate <= 0) {
        showToast('Vui lòng nhập mức lương hợp lệ!', 'warning');
        return;
    }

    state.settings.hourlyRate = rate;
    saveData(STORAGE_KEYS.SETTINGS, state.settings);
    updateRateDisplay();
    showToast(`Đã lưu: ${formatNumber(rate)} ₫/giờ`, 'success');
}

// --- Bonus Settings ---
function renderBonusSettings() {
    const list = document.getElementById('bonusSettingsList');
    if (!list) return;

    if (!state.settings.bonusTypes || state.settings.bonusTypes.length === 0) {
        list.innerHTML = `<div style="text-align:center; padding:10px; color:var(--text-muted); font-size:0.8rem;">Chưa có mục thưởng nào</div>`;
        return;
    }

    list.innerHTML = state.settings.bonusTypes.map((bonus, idx) => `
        <div class="bonus-setting-item">
            <div class="bonus-setting-info">
                <span class="bonus-setting-emoji">${bonus.emoji}</span>
                <div class="bonus-setting-text">
                    <span class="bonus-setting-name">${bonus.name}</span>
                    <span class="bonus-setting-price">+${formatCurrencyShort(bonus.amount)}</span>
                </div>
            </div>
            <button class="history-item-delete" style="opacity:1; width:24px; height:24px; font-size:0.6rem;" onclick="deleteBonusType(${idx})">✕</button>
        </div>
    `).join('');
}

function openAddBonusModal() {
    showModal('Thêm Mục Thưởng', `
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
            <input type="text" id="newBonusEmoji" class="form-input" placeholder="Emoji (vd: 🎁)" maxlength="2">
            <input type="text" id="newBonusName" class="form-input" placeholder="Tên (vd: Phụ cấp xăng)">
            <input type="number" id="newBonusAmount" class="form-input" placeholder="Số tiền (vd: 15000)">
        </div>
    `, [
        { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
        {
            text: 'Thêm', class: 'modal-btn-confirm', action: () => {
                const emoji = document.getElementById('newBonusEmoji').value.trim() || '🎁';
                const name = document.getElementById('newBonusName').value.trim();
                const amount = parseInt(document.getElementById('newBonusAmount').value);

                if (!name || isNaN(amount) || amount <= 0) {
                    showToast('Vui lòng nhập tên và số tiền hợp lệ', 'warning');
                    return;
                }

                if (!state.settings.bonusTypes) state.settings.bonusTypes = [];
                state.settings.bonusTypes.push({
                    id: 'bonus-' + Date.now(),
                    name, amount, emoji
                });
                
                saveData(STORAGE_KEYS.SETTINGS, state.settings);
                renderBonusSettings();
                updateBonusUI(); // Update home page buttons
                closeModal();
                showToast('Đã thêm mục thưởng', 'success');
            }
        }
    ]);
}

function deleteBonusType(index) {
    if (confirm('Bạn có chắc muốn xóa mục thưởng này?')) {
        state.settings.bonusTypes.splice(index, 1);
        saveData(STORAGE_KEYS.SETTINGS, state.settings);
        renderBonusSettings();
        updateBonusUI();
        showToast('Đã xóa mục thưởng', 'info');
    }
}

function confirmClearData() {
    showModal(
        '⚠️ Xóa dữ liệu',
        'Hành động này sẽ xóa TOÀN BỘ dữ liệu chấm công, bao gồm lịch sử và cài đặt. Không thể hoàn tác!',
        [
            { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
            {
                text: 'Xóa tất cả', class: 'modal-btn-danger', action: () => {
                    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
                    state.shifts = [...DEFAULT_SHIFTS];
                    state.records = [];
                    state.purchases = [];
                    state.ticks = [];
                    state.settings = { 
                        hourlyRate: 18000,
                        bonusTypes: [
                            { id: 'go', name: 'GO', amount: 12000, emoji: '🏬' },
                            { id: 'chb', name: 'CHB', amount: 8000, emoji: '🍞' }
                        ] 
                    };
                    state.currentSession = null;
                    state.selectedShift = null;

                    stopTimer();
                    document.getElementById('hourlyRateInput').value = 18000;
                    updateHomeUI();
                    updateRateDisplay();
                    renderShifts();
                    renderHistory();
                    updateStats();
                    updateBonusUI();
                    updateTickUI();
                    renderBonusSettings();

                    closeModal();
                    showToast('Đã xóa toàn bộ dữ liệu', 'info');
                }
            }
        ]
    );
}

// ===== MODAL =====
function showModal(title, bodyHTML, buttons) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML; // Use innerHTML to support inputs

    const footer = document.getElementById('modalFooter');
    footer.innerHTML = buttons.map(btn =>
        `<button class="${btn.class}" id="modal-btn-${btn.text.replace(/\s/g, '')}">${btn.text}</button>`
    ).join('');

    buttons.forEach(btn => {
        const el = document.getElementById(`modal-btn-${btn.text.replace(/\s/g, '')}`);
        if (el) el.addEventListener('click', btn.action);
    });

    document.getElementById('modalOverlay').classList.add('active');
}

function showInputModal(title, placeholder, onConfirm) {
    showModal(title, `
        <div style="margin-top:10px;">
            <input type="text" id="genericInputModal" class="form-input" placeholder="${placeholder}" autofocus>
        </div>
    `, [
        { text: 'Bỏ qua', class: 'modal-btn-cancel', action: () => {
            onConfirm('');
            closeModal();
        }},
        { text: 'Xác nhận', class: 'modal-btn-confirm', action: () => {
            const val = document.getElementById('genericInputModal').value.trim();
            onConfirm(val);
            closeModal();
        }}
    ]);
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== FORMATTERS =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function formatCurrencyShort(amount) {
    if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'tr';
    }
    if (amount >= 1000) {
        return Math.round(amount / 1000) + 'k';
    }
    return amount + '₫';
}

function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatRelativeDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const timeStr = formatTime(d);

    if (d.toDateString() === today.toDateString()) {
        return `Hôm nay lúc ${timeStr}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
        return `Hôm qua lúc ${timeStr}`;
    } else {
        const day = d.getDate();
        const month = d.getMonth() + 1;
        return `${day}/${month} lúc ${timeStr}`;
    }
}

function formatDurationShort(ms) {
    const totalMin = Math.floor(ms / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours > 0) {
        return `${hours}h${minutes > 0 ? minutes + 'm' : ''}`;
    }
    return `${minutes}m`;
}

function formatDurationFull(ms) {
    const totalMin = Math.floor(ms / 60000);
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours > 0) {
        return `${hours} giờ ${minutes} phút`;
    }
    return `${minutes} phút`;
}

function pad(n) {
    return String(n).padStart(2, '0');
}

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getHistoryFilterDates() {
    const now = new Date();
    let startDate, endDate;

    switch (state.historyFilter) {
        case 'week':
            startDate = getStartOfWeek(now);
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            break;
        case 'all-time':
        default:
            startDate = new Date(0);
            endDate = new Date(8640000000000000); // Tương lai xa để hiện toàn bộ dữ liệu
            break;
    }
    return { startDate, endDate };
}

// ===== BONUS TRACKING =====
function addBonus(typeId) {
    const bonusType = state.settings.bonusTypes.find(b => b.id === typeId);
    if (!bonusType) return;

    showInputModal(`Ghi chú thưởng ${bonusType.name}`, 'Ví dụ: Mua bánh cho khách...', (note) => {
        const bonus = {
            id: Date.now().toString(),
            typeId: typeId,
            store: bonusType.name, // Keep for backward compatibility with purchases
            amount: bonusType.amount,
            note: note,
            date: new Date().toISOString()
        };

        state.purchases.unshift(bonus); // using state.purchases for bonuses
        saveData(STORAGE_KEYS.PURCHASES, state.purchases);
        updateBonusUI();
        updateStats();
        showToast(`🎁 Đã thêm ${bonusType.name} — ${formatCurrency(bonusType.amount)}`, 'success');
    });
}

function deletePurchase(purchaseId) {
    const purchase = state.purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    showModal(
        'Xóa khoản thưởng',
        `Bạn có chắc muốn xóa khoản thưởng "${purchase.store}" trị giá ${formatCurrency(purchase.amount)}?`,
        [
            { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
            {
                text: 'Xóa', class: 'modal-btn-danger', action: () => {
                    state.purchases = state.purchases.filter(p => p.id !== purchaseId);
                    saveData(STORAGE_KEYS.PURCHASES, state.purchases);
                    updateBonusUI();
                    updateStats();
                    if (state.currentPage === 'history') renderHistory();
                    closeModal();
                    showToast('Đã xóa khoản thưởng', 'info');
                }
            }
        ]
    );
}

function updateBonusUI() {
    // 1. Render buttons dynamically
    const container = document.getElementById('bonusButtonsContainer');
    if (container && state.settings.bonusTypes) {
        container.innerHTML = state.settings.bonusTypes.map(bonus => `
            <button class="purchase-btn" onclick="addBonus('${bonus.id}')" style="border-color:var(--border-glass-strong)">
                <div class="purchase-btn-emoji">${bonus.emoji}</div>
                <div class="purchase-btn-info">
                    <span class="purchase-btn-name">${bonus.name}</span>
                    <span class="purchase-btn-price">${formatCurrencyShort(bonus.amount)}</span>
                </div>
            </button>
        `).join('');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBonuses = state.purchases.filter(p => {
        const d = new Date(p.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    const totalToday = todayBonuses.reduce((sum, p) => sum + p.amount, 0);

    const todayCountEl = document.getElementById('bonusTodayCount');
    if (todayCountEl) todayCountEl.textContent = `Hôm nay: ${todayBonuses.length} lần`;

    const totalEl = document.getElementById('bonusTodayTotal');
    if (totalEl) totalEl.textContent = formatCurrency(totalToday);

    // Render recent bonuses (last 5 overall, displaying dates clearly)
    const recentList = document.getElementById('bonusRecentList');
    if (recentList) {
        const recent = state.purchases.slice(0, 5);
        if (recent.length === 0) {
            recentList.innerHTML = '';
            return;
        }
        recentList.innerHTML = recent.map(p => {
            const dateText = formatRelativeDate(p.date);
            const bType = state.settings.bonusTypes?.find(b => b.id === p.typeId) || { emoji: '🎁', name: p.store };
            return `
                <div class="purchase-recent-item">
                    <div class="purchase-recent-left">
                        <div class="purchase-recent-header">
                            <span>${bType.emoji}</span>
                            <span class="purchase-recent-store">${bType.name}</span>
                            <span style="opacity:0.5">•</span>
                            <span>${dateText}</span>
                        </div>
                        ${p.note ? `<div class="bonus-note">"${p.note}"</div>` : ''}
                    </div>
                    <span class="purchase-recent-amount">+${formatCurrencyShort(p.amount)}</span>
                    <button class="purchase-recent-delete" onclick="deletePurchase('${p.id}')">✕</button>
                </div>
            `;
        }).join('');
    }
}

// ===== TICK SYSTEM =====
function addTick(type) {
    showInputModal(`Ghi chú Tick ${type === 'good' ? 'Tốt' : 'Xấu'}`, 'Lý do nhận tick...', (note) => {
        const tick = {
            id: Date.now().toString(),
            type: type, // 'good' or 'bad'
            note: note,
            date: new Date().toISOString()
        };

        state.ticks.push(tick);
        saveData(STORAGE_KEYS.TICKS, state.ticks);

        // Check if bonus/penalty triggered
        const allOfType = state.ticks.filter(t => t.type === type);
        const currentCount = allOfType.length % TICKS_PER_BONUS;

        if (currentCount === 0 && allOfType.length > 0) {
            // Just completed a set of 3
            if (type === 'good') {
                showToast(`🎉 Đạt 3 Tick Tốt! +${formatCurrency(TICK_BONUS_AMOUNT)} thưởng!`, 'success');
            } else {
                showToast(`😔 Đạt 3 Tick Xấu! -${formatCurrency(TICK_BONUS_AMOUNT)} phạt!`, 'error');
            }
        } else {
            if (type === 'good') {
                showToast(`👍 +1 Tick Tốt (${currentCount}/3)`, 'info');
            } else {
                showToast(`👎 +1 Tick Xấu (${currentCount}/3)`, 'warning');
            }
        }

        updateTickUI();
        updateStats();
    });
}

function deleteTick(tickId) {
    const tick = state.ticks.find(t => t.id === tickId);
    if (!tick) return;
    const typeLabel = tick.type === 'good' ? 'Tốt' : 'Xấu';

    showModal(
        'Xóa Tick',
        `Bạn có chắc muốn xóa Tick ${typeLabel} này? Việc này có thể ảnh hưởng đến các cột mốc thưởng/phạt của bạn.`,
        [
            { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
            {
                text: 'Xóa', class: 'modal-btn-danger', action: () => {
                    state.ticks = state.ticks.filter(t => t.id !== tickId);
                    saveData(STORAGE_KEYS.TICKS, state.ticks);
                    updateTickUI();
                    updateStats();
                    if (state.currentPage === 'history') renderHistory();
                    closeModal();
                    showToast('Đã xóa tick', 'info');
                }
            }
        ]
    );
}

function getTickMilestones() {
    const sorted = [...state.ticks].sort((a, b) => new Date(a.date) - new Date(b.date));
    let goodCount = 0;
    let badCount = 0;
    const milestones = [];
    
    sorted.forEach(t => {
        if (t.type === 'good') {
            goodCount++;
            if (goodCount % TICKS_PER_BONUS === 0) {
                milestones.push({
                    id: `tick-bonus-${t.id}`,
                    date: t.date,
                    amount: TICK_BONUS_AMOUNT,
                    name: `Thưởng ${TICKS_PER_BONUS} Tick Tốt`,
                    emoji: '🎉'
                });
            }
        } else if (t.type === 'bad') {
            badCount++;
            if (badCount % TICKS_PER_BONUS === 0) {
                milestones.push({
                    id: `tick-penalty-${t.id}`,
                    date: t.date,
                    amount: -TICK_BONUS_AMOUNT,
                    name: `Phạt ${TICKS_PER_BONUS} Tick Xấu`,
                    emoji: '😔'
                });
            }
        }
    });
    return milestones;
}

function calculateTickBonuses(ticks) {
    if (!ticks) ticks = state.ticks;
    const goodTicks = ticks.filter(t => t.type === 'good').length;
    const badTicks = ticks.filter(t => t.type === 'bad').length;
    const bonusSets = Math.floor(goodTicks / TICKS_PER_BONUS);
    const penaltySets = Math.floor(badTicks / TICKS_PER_BONUS);
    const totalBonus = bonusSets * TICK_BONUS_AMOUNT;
    const totalPenalty = penaltySets * TICK_BONUS_AMOUNT;
    return {
        goodTotal: goodTicks,
        badTotal: badTicks,
        goodCurrent: goodTicks % TICKS_PER_BONUS,
        badCurrent: badTicks % TICKS_PER_BONUS,
        bonus: totalBonus,
        penalty: totalPenalty,
        net: totalBonus - totalPenalty
    };
}

function updateTickUI() {
    const calc = calculateTickBonuses();

    // Update dot indicators
    const goodDots = document.querySelectorAll('#tickDotsGood .tick-dot');
    const badDots = document.querySelectorAll('#tickDotsBad .tick-dot');

    goodDots.forEach((dot, i) => {
        if (i < calc.goodCurrent) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });

    badDots.forEach((dot, i) => {
        if (i < calc.badCurrent) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    });

    // Update counters
    const goodCountEl = document.getElementById('tickGoodCount');
    const badCountEl = document.getElementById('tickBadCount');
    if (goodCountEl) goodCountEl.textContent = calc.goodCurrent;
    if (badCountEl) badCountEl.textContent = calc.badCurrent;

    // Update bonus summary
    const bonusTotalEl = document.getElementById('tickBonusTotal');
    const penaltyTotalEl = document.getElementById('tickPenaltyTotal');
    const netTotalEl = document.getElementById('tickNetTotal');

    if (bonusTotalEl) bonusTotalEl.textContent = '+' + formatCurrency(calc.bonus);
    if (penaltyTotalEl) penaltyTotalEl.textContent = '-' + formatCurrency(calc.penalty);
    if (netTotalEl) {
        const prefix = calc.net >= 0 ? '+' : '';
        netTotalEl.textContent = prefix + formatCurrency(calc.net);
        netTotalEl.style.color = calc.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    // Render recent ticks (last 5)
    const recentList = document.getElementById('tickRecentList');
    if (recentList) {
        const recent = state.ticks.slice(-5).reverse();
        if (recent.length === 0) {
            recentList.innerHTML = '';
            return;
        }
        recentList.innerHTML = recent.map(t => {
            const time = formatTime(new Date(t.date));
            const dateStr = new Date(t.date).toLocaleDateString('vi-VN');
            const isGood = t.type === 'good';
            return `
                <div class="tick-recent-item">
                    <div class="tick-recent-left" style="align-items:flex-start;">
                        <div class="tick-recent-header">
                            <span class="tick-recent-type ${t.type}">${isGood ? '👍 Tốt' : '👎 Xấu'}</span>
                            <span>${dateStr} ${time}</span>
                        </div>
                        ${t.note ? `<div class="tick-note" style="text-align:left;">"${t.note}"</div>` : ''}
                    </div>
                    <button class="tick-recent-delete" onclick="deleteTick('${t.id}')">✕</button>
                </div>
            `;
        }).join('');
    }
}

function getPeriodStartDate(period) {
    const now = new Date();
    switch (period) {
        case 'week':
            return getStartOfWeek(now);
        case 'month':
            return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'year':
            return new Date(now.getFullYear(), 0, 1);
        default:
            return new Date(0);
    }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    init();
    renderBonusSettings();
});

// ===== MANUAL TIMEKEEPING =====
function openManualClockModal() {
    const shiftsOptions = state.shifts.map(s => `<option value="${s.id}">${s.emoji} ${s.name} (${s.start} - ${s.end})</option>`).join('');
    const freestyleOption = `<option value="freestyle">⏱ Ca Tự Do</option>`;
    const today = new Date().toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time zone

    const bodyHTML = `
        <div class="manual-clock-form" style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px; text-align: left;">
            <div class="form-group">
                <label for="manualShiftSelect" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; font-weight: 500;">Chọn Ca làm việc</label>
                <select id="manualShiftSelect" class="form-select" onchange="onManualShiftChange()" style="width:100%; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); border: 1px solid var(--border-glass); color: var(--text-primary); outline: none;">
                    <option value="" disabled selected>-- Chọn ca làm --</option>
                    ${freestyleOption}
                    ${shiftsOptions}
                </select>
            </div>
            <div class="form-group">
                <label for="manualDate" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; font-weight: 500;">Ngày làm việc</label>
                <input type="date" id="manualDate" value="${today}" class="form-input" style="width:100%; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); border: 1px solid var(--border-glass); color: var(--text-primary); outline: none;">
            </div>
            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="form-group">
                    <label for="manualStartTime" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; font-weight: 500;">Giờ vào ca</label>
                    <input type="time" id="manualStartTime" class="form-input" style="width:100%; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); border: 1px solid var(--border-glass); color: var(--text-primary); outline: none;">
                </div>
                <div class="form-group">
                    <label for="manualEndTime" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; font-weight: 500;">Giờ ra ca</label>
                    <input type="time" id="manualEndTime" class="form-input" style="width:100%; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); border: 1px solid var(--border-glass); color: var(--text-primary); outline: none;">
                </div>
            </div>
            <div class="form-group">
                <label for="manualRate" style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 4px; font-weight: 500;">Lương theo giờ (₫/giờ)</label>
                <input type="number" id="manualRate" value="${state.settings.hourlyRate}" class="form-input" style="width:100%; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); border: 1px solid var(--border-glass); color: var(--text-primary); outline: none;" min="0">
            </div>
        </div>
    `;

    showModal('Chấm Công Thủ Công', bodyHTML, [
        { text: 'Hủy', class: 'modal-btn-cancel', action: closeModal },
        { text: 'Lưu', class: 'modal-btn-confirm', action: saveManualClock }
    ]);
}

function onManualShiftChange() {
    const shiftSelect = document.getElementById('manualShiftSelect');
    const startInput = document.getElementById('manualStartTime');
    const endInput = document.getElementById('manualEndTime');
    const selectedId = shiftSelect.value;

    if (selectedId === 'freestyle') {
        startInput.value = '';
        endInput.value = '';
    } else {
        const shift = state.shifts.find(s => s.id === selectedId);
        if (shift) {
            startInput.value = shift.start;
            endInput.value = shift.end;
        }
    }
}

function saveManualClock() {
    const shiftSelect = document.getElementById('manualShiftSelect');
    const dateInput = document.getElementById('manualDate');
    const startTimeInput = document.getElementById('manualStartTime');
    const endTimeInput = document.getElementById('manualEndTime');
    const rateInput = document.getElementById('manualRate');

    const shiftId = shiftSelect.value;
    const dateStr = dateInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const hourlyRate = parseInt(rateInput.value);

    if (!shiftId) {
        showToast('Vui lòng chọn ca làm việc!', 'warning');
        return;
    }
    if (!dateStr || !startTime || !endTime) {
        showToast('Vui lòng điền đầy đủ ngày và giờ!', 'warning');
        return;
    }
    if (isNaN(hourlyRate) || hourlyRate <= 0) {
        showToast('Mức lương không hợp lệ!', 'warning');
        return;
    }

    // Parse times
    let startD = new Date(`${dateStr}T${startTime}`);
    let endD = new Date(`${dateStr}T${endTime}`);

    if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
        showToast('Ngày hoặc giờ không hợp lệ!', 'warning');
        return;
    }

    if (endD <= startD) {
        // Overnight shift
        endD.setDate(endD.getDate() + 1);
    }

    const durationMs = endD - startD;
    const durationHours = durationMs / (1000 * 60 * 60);

    // Calculate meal allowance
    let mealAllowance = 0;
    if (durationHours >= 16) {
        mealAllowance = 40000;
    } else if (durationHours >= 8) {
        mealAllowance = 20000;
    }

    const baseEarnings = Math.round(durationHours * hourlyRate);
    const earnings = baseEarnings + mealAllowance;

    let shiftName, shiftEmoji;
    if (shiftId === 'freestyle') {
        shiftName = 'Ca Tự Do (Thủ công)';
        shiftEmoji = '⏱️';
    } else {
        const foundShift = state.shifts.find(s => s.id === shiftId);
        shiftName = foundShift ? `${foundShift.name} (Thủ công)` : 'Ca làm (Thủ công)';
        shiftEmoji = foundShift ? foundShift.emoji : '📋';
    }

    const record = {
        id: 'manual-' + Date.now(),
        shiftId: shiftId,
        shiftName: shiftName,
        shiftEmoji: shiftEmoji,
        startTime: startD.toISOString(),
        endTime: endD.toISOString(),
        durationMs: durationMs,
        durationHours: parseFloat(durationHours.toFixed(2)),
        hourlyRate: hourlyRate,
        mealAllowance: mealAllowance,
        baseEarnings: baseEarnings,
        earnings: earnings,
        isManual: true,
        createdAt: new Date().toISOString()
    };

    state.records.unshift(record);
    saveData(STORAGE_KEYS.RECORDS, state.records);

    renderHistory();
    updateStats();
    closeModal();
    
    const isFuture = startD > new Date();
    const typeLabel = isFuture ? 'Chấm công trước' : 'Chấm công bù';
    showToast(`✓ Đã thêm ca (${typeLabel}): ${formatCurrency(earnings)}`, 'success');
}

// Handle resize for chart
window.addEventListener('resize', () => {
    if (state.currentPage === 'stats') {
        updateStats();
    }
});

// ===== NOTIFICATIONS =====
function toggleNotifications() {
    const notiToggle = document.getElementById('notificationToggle');
    if (!notiToggle) return;

    if (notiToggle.checked) {
        if (!("Notification" in window)) {
            showToast('🚨 Trình duyệt của bạn không hỗ trợ thông báo đẩy!', 'error');
            notiToggle.checked = false;
            return;
        }

        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                state.settings.notificationsEnabled = true;
                saveData(STORAGE_KEYS.SETTINGS, state.settings);
                showToast('🔔 Đã bật thông báo đẩy thành công!', 'success');
                
                sendBrowserNotification(
                    "TimeKeeper",
                    "Ứng dụng sẽ gửi thông báo nhắc nhở và tiến trình ca làm việc cho bạn khi bạn vào ca."
                );
            } else {
                state.settings.notificationsEnabled = false;
                notiToggle.checked = false;
                saveData(STORAGE_KEYS.SETTINGS, state.settings);
                showToast('⚠️ Bạn đã từ chối quyền gửi thông báo!', 'warning');
            }
        });
    } else {
        state.settings.notificationsEnabled = false;
        saveData(STORAGE_KEYS.SETTINGS, state.settings);
        showToast('🔕 Đã tắt thông báo đẩy.', 'info');
    }
}

function sendBrowserNotification(title, body) {
    if (!state.settings.notificationsEnabled) return;
    if (!("Notification" in window)) return;
    
    const options = {
        body: body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [100, 50, 100]
    };

    if (Notification.permission === "granted") {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, options)
                    .catch(e => {
                        console.warn("Service Worker notification failed, falling back:", e);
                        new Notification(title, options);
                    });
            });
        } else {
            new Notification(title, options);
        }
    }
}

function getShiftEndDate(session) {
    const shift = state.shifts.find(s => s.id === session.shiftId);
    if (!shift || shift.isFreestyle || !shift.end) return null;
    
    const startDate = new Date(session.startTime);
    const [endH, endM] = shift.end.split(':').map(Number);
    const [startH, startM] = shift.start.split(':').map(Number);
    
    const endDate = new Date(startDate);
    endDate.setHours(endH, endM, 0, 0);
    
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;
    
    if (endMins < startMins) {
        // Crosses midnight
        if (startDate.getHours() >= startH - 1) {
            endDate.setDate(endDate.getDate() + 1);
        }
    }
    return endDate;
}
