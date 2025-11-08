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
            
            if (!isWe
