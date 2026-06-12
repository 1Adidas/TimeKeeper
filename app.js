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
    updatePurchaseUI();
    updateTickUI();

    // Set hourly rate input
    document.getElementById('hourlyRateInput').value = state.settings.hourlyRate;

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
        state.settings = settings ? JSON.parse(settings) : { hourlyRate: 18000 };
        
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

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== CLOCK IN / OUT =====
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
}

function clockOut() {
    if (!state.currentSession) {
        showToast('Bạn chưa vào ca!', 'warning');
        return;
    }

    const now = new Date();
    const start = new Date(state.currentSession.startTime);
    const durationMs = now - start;
    const durationHours = durationMs / (1000 * 60 * 60);
    const earnings = Math.round(durationHours * state.currentSession.hourlyRate);

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
}

// ===== HOME UI =====
function updateHomeUI() {
    const statusCard = document.getElementById('statusCard');
    const statusText = document.getElementById('statusText');
    const currentShiftInfo = document.getElementById('currentShiftInfo');
    const btnClockIn = document.getElementById('btnClockIn');
    const btnClockOut = document.getElementById('btnClockOut');

    if (state.currentSession) {
        statusCard.classList.add('active');
        statusText.textContent = `Đang làm — ${state.currentSession.shiftName}`;
        currentShiftInfo.style.display = 'flex';
        btnClockIn.disabled = true;
        btnClockOut.disabled = false;
    } else {
        statusCard.classList.remove('active');
        statusText.textContent = 'Chưa vào ca';
        currentShiftInfo.style.display = 'none';
        btnClockIn.disabled = false;
        btnClockOut.disabled = true;

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
}

function updateRateDisplay() {
    const rateValue = document.getElementById('rateValue');
    if (rateValue) {
        rateValue.textContent = `${formatNumber(state.settings.hourlyRate)} ₫/giờ`;
    }
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
            // Hide if the shift ended before the current time
            const [eh, em] = shift.end.split(':').map(Number);
            const endTotalMins = eh * 60 + em;
            const [sh, sm] = shift.start.split(':').map(Number);
            const startTotalMins = sh * 60 + sm;
            
            // Only apply hiding logic if the shift doesn't cross midnight
            if (endTotalMins > startTotalMins) {
                if (currentTotalMins > endTotalMins) {
                    isHidden = true; // Shift has ended
                }
            } else {
                // Crosses midnight (e.g. 22:00 -> 06:00)
                // If it's currently > 06:00 and < 22:00, it should be hidden
                if (currentTotalMins > endTotalMins && currentTotalMins < startTotalMins) {
                    isHidden = true;
                }
            }
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

    // Update summary (only records)
    const records = getFilteredRecords();
    const totalShiftsEl = document.getElementById('totalShifts');
    const totalHoursEl = document.getElementById('totalHours');
    const totalEarningsEl = document.getElementById('totalEarnings');

    const totalHours = records.reduce((sum, r) => sum + r.durationHours, 0);
    const totalEarnings = records.reduce((sum, r) => sum + r.earnings, 0);

    if (totalShiftsEl) totalShiftsEl.textContent = records.length;
    if (totalHoursEl) totalHoursEl.textContent = `${totalHours.toFixed(1)}h`;
    if (totalEarningsEl) totalEarningsEl.textContent = formatCurrencyShort(totalEarnings);

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

    list.innerHTML = items.map((item, index) => {
        const d = item.dateObj;
        const day = d.getDate();
        const month = MONTHS_VI[d.getMonth()];
        const timeStr = formatTime(d);

        if (item.itemType === 'shift') {
            const record = item.data;
            const endDate = new Date(record.endTime);
            const endTimeStr = formatTime(endDate);
            const durationStr = formatDurationShort(record.durationMs);
            return `
                <div class="history-item" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
                    <div class="history-date-badge">
                        <span class="history-date-day">${day}</span>
                        <span class="history-date-month">${month}</span>
                    </div>
                    <div class="history-info">
                        <div class="history-shift-name">${record.shiftEmoji || '📋'} ${record.shiftName}</div>
                        <div class="history-time-range">${timeStr} → ${endTimeStr}</div>
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
                <div class="history-item" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
                    <div class="history-date-badge">
                        <span class="history-date-day">${day}</span>
                        <span class="history-date-month">${month}</span>
                    </div>
                    <div class="history-info" style="flex-direction:row; align-items:center; gap:8px;">
                        <div style="font-size:1.2rem;">${bonusType.emoji}</div>
                        <div class="tick-recent-content">
                            <span style="font-weight:600; color:var(--text-primary); font-size:0.8rem;">Thưởng: ${bonusType.name}</span>
                            <span>${timeStr}</span>
                            ${bonus.note ? `<div class="bonus-note">"${bonus.note}"</div>` : ''}
                        </div>
                    </div>
                    <div class="history-right">
                        <div class="history-earnings" style="color:var(--accent-cyan);">+${formatCurrencyShort(bonus.amount)}</div>
                    </div>
                    <button class="history-item-delete" onclick="deletePurchase('${bonus.id}')">✕</button>
                </div>
            `;
        } else if (item.itemType === 'tick') {
            const tick = item.data;
            const isGood = tick.type === 'good';
            
            return `
                <div class="history-item" style="animation-delay: ${Math.min(index * 0.05, 0.5)}s">
                    <div class="history-date-badge">
                        <span class="history-date-day">${day}</span>
                        <span class="history-date-month">${month}</span>
                    </div>
                    <div class="history-info" style="flex-direction:row; align-items:center; gap:8px;">
                        <div style="font-size:1.2rem;">${isGood ? '👍' : '👎'}</div>
                        <div class="tick-recent-content">
                            <span style="font-weight:600; color:${isGood ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size:0.8rem;">Tick ${isGood ? 'Tốt' : 'Xấu'}</span>
                            <span>${timeStr}</span>
                            ${tick.note ? `<div class="tick-note">"${tick.note}"</div>` : ''}
                        </div>
                    </div>
                    <button class="history-item-delete" onclick="deleteTick('${tick.id}')">✕</button>
                </div>
            `;
        }
    }).join('');
}

function filterHistory() {
    state.historyFilter = document.getElementById('historyFilter').value;
    renderHistory();
}

function getFilteredHistoryItems() {
    const now = new Date();
    let startDate, endDate;

    switch (state.historyFilter) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date();
            break;
        case 'last-month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            break;
        case 'all-time':
        default:
            startDate = new Date(0);
            endDate = new Date();
            break;
    }

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
    const purchaseTotal = periodPurchases.reduce((sum, p) => sum + p.amount, 0);
    const tickCalc = calculateTickBonuses(periodTicks);
    const grandTotal = totalEarnings + purchaseTotal + tickCalc.net;

    // Stats values
    document.getElementById('statsTotalEarnings').textContent = formatCurrency(grandTotal);
    document.getElementById('statsTotalHours').textContent = `${totalHours.toFixed(1)}h`;
    document.getElementById('statsTotalShifts').textContent = `${totalShifts} ca`;
    document.getElementById('statsPurchaseTotal').textContent = formatCurrencyShort(purchaseTotal);
    
    const tickNetEl = document.getElementById('statsTickNet');
    if (tickNetEl) {
        tickNetEl.textContent = (tickCalc.net >= 0 ? '+' : '') + formatCurrencyShort(tickCalc.net);
        tickNetEl.style.color = tickCalc.net >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
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
    renderBreakdown(records);
}

function getRecordsForPeriod(period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay() + 1);
            startDate.setHours(0, 0, 0, 0);
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
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);
        startOfWeek.setHours(0, 0, 0, 0);

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

function renderBreakdown(records) {
    const list = document.getElementById('breakdownList');
    if (!list) return;

    // Group by date
    const daily = {};
    records.forEach(r => {
        const d = new Date(r.startTime);
        const key = d.toLocaleDateString('vi-VN');
        if (!daily[key]) {
            daily[key] = {
                date: d,
                earnings: 0,
                hours: 0,
                shifts: 0
            };
        }
        daily[key].earnings += r.earnings;
        daily[key].hours += r.durationHours;
        daily[key].shifts++;
    });

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

    const maxEarnings = Math.max(...entries.map(e => e.earnings), 1);

    list.innerHTML = entries.map(entry => {
        const dayName = WEEKDAYS_VI[entry.date.getDay()];
        const dateStr = `${entry.date.getDate()}/${entry.date.getMonth() + 1}`;
        const barWidth = (entry.earnings / maxEarnings) * 100;

        return `
            <div class="breakdown-item">
                <span class="breakdown-day">${dayName} ${dateStr}</span>
                <div class="breakdown-bar-container">
                    <div class="breakdown-bar" style="width: ${barWidth}%"></div>
                </div>
                <span class="breakdown-amount">${formatCurrencyShort(entry.earnings)}</span>
            </div>
        `;
    }).join('');
}

// ===== SETTINGS =====
function setRate(amount) {
    document.getElementById('hourlyRateInput').value = amount;
}

function saveRate() {
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
    state.purchases = state.purchases.filter(p => p.id !== purchaseId);
    saveData(STORAGE_KEYS.PURCHASES, state.purchases);
    updateBonusUI();
    updateStats();
    if(state.currentPage === 'history') renderHistory();
    showToast('Đã xóa', 'info');
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

    // Render recent bonuses (last 5)
    const recentList = document.getElementById('bonusRecentList');
    if (recentList) {
        const recent = todayBonuses.slice(0, 5);
        if (recent.length === 0) {
            recentList.innerHTML = '';
            return;
        }
        recentList.innerHTML = recent.map(p => {
            const time = formatTime(new Date(p.date));
            const bType = state.settings.bonusTypes?.find(b => b.id === p.typeId) || { emoji: '🎁', name: p.store };
            return `
                <div class="purchase-recent-item">
                    <div class="purchase-recent-left">
                        <div class="purchase-recent-header">
                            <span>${bType.emoji}</span>
                            <span class="purchase-recent-store">${bType.name}</span>
                            <span style="opacity:0.5">•</span>
                            <span>${time}</span>
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
    state.ticks = state.ticks.filter(t => t.id !== tickId);
    saveData(STORAGE_KEYS.TICKS, state.ticks);
    updateTickUI();
    updateStats();
    if (state.currentPage === 'history') renderHistory();
    showToast('Đã xóa tick', 'info');
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
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1);
            startOfWeek.setHours(0, 0, 0, 0);
            return startOfWeek;
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

// Handle resize for chart
window.addEventListener('resize', () => {
    if (state.currentPage === 'stats') {
        updateStats();
    }
});
