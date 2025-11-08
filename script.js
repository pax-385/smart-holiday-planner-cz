const year = 2025;
let holidays = [];
let vacationDates = [];

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Add event listener for button when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    const btn = document.getElementById('calculateBtn');
    if (btn) {
        btn.addEventListener('click', calculateVacation);
    }
    fetchHolidays();
}

async function fetchHolidays() {
    try {
        console.log('Fetching holidays for CZ in', year);
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CZ`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        holidays = await response.json();
        console.log('Holidays loaded:', holidays);
        renderCalendars();
    } catch (error) {
        console.error('Error fetching holidays:', error);
        document.getElementById('calendars').innerHTML = 
            `<div class="loading">Error loading holidays: ${error.message}<br>Please refresh the page.</div>`;
    }
}

function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

function isHoliday(date) {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.some(h => h.date === dateStr);
}

function isVacation(date) {
    const dateStr = date.toISOString().split('T')[0];
    return vacationDates.includes(dateStr);
}

function calculateVacation() {
    const days = parseInt(document.getElementById('vacationDays').value);
    vacationDates = findBestVacationDates(days);
    renderCalendars();
    showStats(days);
}

function findBestVacationDates(totalDays) {
    const periods = [];
    
    // Find all periods around holidays
    holidays.forEach(holiday => {
        const holidayDate = new Date(holiday.date);
        const before = new Date(holidayDate);
        const after = new Date(holidayDate);
        
        before.setDate(before.getDate() - 7);
        after.setDate(after.getDate() + 7);
        
        // Count working days and total days in this period
        let current = new Date(before);
        let workingDays = 0;
        let totalPeriodDays = 0;
        
        while (current <= after) {
            if (!isWeekend(current) && !isHoliday(current)) {
                workingDays++;
            }
            totalPeriodDays++;
            current.setDate(current.getDate() + 1);
        }
        
        const efficiency = totalPeriodDays / Math.max(workingDays, 1);
        
        periods.push({
            start: new Date(before),
            end: new Date(after),
            holidayDate: new Date(holidayDate),
            workingDays,
            totalDays: totalPeriodDays,
            efficiency
        });
    });
    
    // Sort by efficiency
    periods.sort((a, b) => b.efficiency - a.efficiency);
    
    const selectedDates = [];
    let remainingDays = totalDays;
    
    // Select most efficient periods
    for (const period of periods) {
        if (remainingDays <= 0) break;
        
        const daysNeeded = Math.min(period.workingDays, remainingDays);
        
        // Add days around the holiday
        let added = 0;
        let offset = 0;
        
        while (added < daysNeeded && offset < 10) {
            const before = new Date(period.holidayDate);
            before.setDate(before.getDate() - offset - 1);
            
            const after = new Date(period.holidayDate);
            after.setDate(after.getDate() + offset + 1);
            
            if (!isWeekend(before) && !isHoliday(before) && !selectedDates.includes(before.toISOString().split('T')[0])) {
                selectedDates.push(before.toISOString().split('T')[0]);
                added++;
            }
            
            if (added >= daysNeeded) break;
            
            if (!isWeekend(after) && !isHoliday(after) && !selectedDates.includes(after.toISOString().split('T')[0])) {
                selectedDates.push(after.toISOString().split('T')[0]);
                added++;
            }
            
            offset++;
        }
        
        remainingDays -= added;
    }
    
    return selectedDates;
}

function showStats(requestedDays) {
    const statsDiv = document.getElementById('stats');
    
    // Count consecutive days off
    const allDatesOff = [];
    
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (isWeekend(date) || isHoliday(date) || isVacation(date)) {
                allDatesOff.push(date);
            }
        }
    }
    
    // Sort dates
    allDatesOff.sort((a, b) => a - b);
    
    // Find consecutive periods
    let totalDaysOff = allDatesOff.length;
    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < allDatesOff.length; i++) {
        const diff = (allDatesOff[i] - allDatesOff[i-1]) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }
    
    statsDiv.style.display = 'block';
    statsDiv.innerHTML = `
        <h3>Vacation Stats</h3>
        <p><strong>${requestedDays}</strong> vacation days used</p>
        <p><strong>${totalDaysOff}</strong> total days off (including weekends & holidays)</p>
        <p><strong>${longestStreak}</strong> days is your longest consecutive break</p>
    `;
}

function renderCalendars() {
    const calendarsDiv = document.getElementById('calendars');
    calendarsDiv.innerHTML = '';
    
    for (let month = 0; month < 12; month++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month';
        
        // Month header
        const header = document.createElement('div');
        header.className = 'month-header';
        header.textContent = monthNames[month];
        monthDiv.appendChild(header);
        
        // Weekday headers
        const weekdaysDiv = document.createElement('div');
        weekdaysDiv.className = 'weekdays';
        weekdayNames.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'weekday';
            dayDiv.textContent = day;
            weekdaysDiv.appendChild(dayDiv);
        });
        monthDiv.appendChild(weekdaysDiv);
        
        // Days grid
        const daysDiv = document.createElement('div');
        daysDiv.className = 'days';
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get first day of week (0 = Sunday, 1 = Monday, etc.)
        let startDay = firstDay.getDay();
        // Convert to Monday = 0
        startDay = startDay === 0 ? 6 : startDay - 1;
        
        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'day empty';
            daysDiv.appendChild(emptyDiv);
        }
        
        // Days of month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day';
            dayDiv.textContent = day;
            
            // Check if today
            if (date.getTime() === today.getTime()) {
                dayDiv.classList.add('today');
            }
            
            // Priority: vacation > holiday > weekend
            if (isVacation(date)) {
                dayDiv.classList.add('vacation');
            } else if (isHoliday(date)) {
                dayDiv.classList.add('holiday');
            } else if (isWeekend(date)) {
                dayDiv.classList.add('weekend');
            }
            
            daysDiv.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(daysDiv);
        calendarsDiv.appendChild(monthDiv);
    }
}
