const year = 2025;
let holidays = [];
let vacationDates = [];
let currentCountry = 'CZ';
let allCountries = [];
let selectedCountryName = 'Czech Republic';
let selectedYear = 2025;

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
    
    setupYearStepper();
    setupCountrySearch();
    fetchCountries();
}

function setupYearStepper() {
    const yearInput = document.getElementById('year');
    const yearDown = document.getElementById('yearDown');
    const yearUp = document.getElementById('yearUp');
    
    yearDown.addEventListener('click', function() {
        const currentVal = parseInt(yearInput.value);
        const minVal = parseInt(yearInput.min);
        if (currentVal > minVal) {
            yearInput.value = currentVal - 1;
            selectedYear = currentVal - 1;
            onYearChange();
        }
    });
    
    yearUp.addEventListener('click', function() {
        const currentVal = parseInt(yearInput.value);
        const maxVal = parseInt(yearInput.max);
        if (currentVal < maxVal) {
            yearInput.value = currentVal + 1;
            selectedYear = currentVal + 1;
            onYearChange();
        }
    });
}

function onYearChange() {
    vacationDates = [];
    document.getElementById('stats').style.display = 'none';
    fetchHolidays();
}

async function fetchCountries() {
    try {
        const response = await fetch('https://date.nager.at/api/v3/AvailableCountries');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allCountries = await response.json();
        console.log('Available countries loaded:', allCountries.length);
        
        // Set Czech Republic as default
        const czCountry = allCountries.find(c => c.countryCode === 'CZ');
        if (czCountry) {
            selectedCountryName = czCountry.name;
            document.getElementById('countrySearch').value = selectedCountryName;
        }
        
        fetchHolidays();
    } catch (error) {
        console.error('Error fetching countries:', error);
        document.getElementById('calendars').innerHTML = 
            `<div class="loading">Error loading countries: ${error.message}</div>`;
    }
}

function setupCountrySearch() {
    const searchInput = document.getElementById('countrySearch');
    const dropdown = document.getElementById('countryDropdown');
    
    searchInput.addEventListener('focus', function() {
        showCountryDropdown('');
    });
    
    searchInput.addEventListener('input', function() {
        showCountryDropdown(this.value);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-group')) {
            dropdown.classList.remove('show');
        }
    });
}

function showCountryDropdown(searchTerm) {
    const dropdown = document.getElementById('countryDropdown');
    const filtered = allCountries.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="country-option">No countries found</div>';
    } else {
        dropdown.innerHTML = filtered.map(country => 
            `<div class="country-option" data-code="${country.countryCode}" data-name="${country.name}">
                ${country.name}
            </div>`
        ).join('');
        
        // Add click handlers to options
        dropdown.querySelectorAll('.country-option').forEach(option => {
            option.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                const name = this.getAttribute('data-name');
                if (code) {
                    selectCountry(code, name);
                }
            });
        });
    }
    
    dropdown.classList.add('show');
}

function selectCountry(code, name) {
    currentCountry = code;
    selectedCountryName = name;
    document.getElementById('countrySearch').value = name;
    document.getElementById('countryDropdown').classList.remove('show');
    vacationDates = [];
    document.getElementById('stats').style.display = 'none';
    fetchHolidays();
}

async function fetchHolidays() {
    try {
        console.log('Fetching holidays for', currentCountry, 'in', selectedYear);
        document.getElementById('calendars').innerHTML = '<div class="loading">Loading holidays...</div>';
        
        const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${currentCountry}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        holidays = await response.json();
        console.log('Holidays loaded:', holidays);
        renderCalendars();
    } catch (error) {
        console.error('Error fetching holidays:', error);
        document.getElementById('calendars').innerHTML = 
            `<div class="loading">Error loading holidays: ${error.message}<br>Please refresh the page or try another country/year.</div>`;
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

function getHolidayName(date) {
    const dateStr = date.toISOString().split('T')[0];
    const holiday = holidays.find(h => h.date === dateStr);
    return holiday ? holiday.localName || holiday.name : '';
}

function isVacation(date) {
    const dateStr = date.toISOString().split('T')[0];
    return vacationDates.includes(dateStr);
}

function calculateVacation() {
    const days = parseInt(document.getElementById('vacationDays').value);
    const strategy = document.getElementById('strategy').value;
    vacationDates = findBestVacationDates(days, strategy);
    renderCalendars();
    showStats(days);
}

function findBestVacationDates(totalDays, strategy = 'balanced') {
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
    
    // Sort based on strategy
    if (strategy === 'long') {
        // Prioritize periods with more working days (bigger breaks)
        periods.sort((a, b) => {
            const scoreDiff = (b.workingDays * 2 + b.efficiency) - (a.workingDays * 2 + a.efficiency);
            return scoreDiff;
        });
    } else if (strategy === 'short') {
        // Prioritize efficiency (better return on investment)
        periods.sort((a, b) => {
            const scoreDiff = (b.efficiency * 3 - b.workingDays * 0.5) - (a.efficiency * 3 - a.workingDays * 0.5);
            return scoreDiff;
        });
    } else {
        // Balanced: standard efficiency sort
        periods.sort((a, b) => b.efficiency - a.efficiency);
    }
    
    const selectedDates = [];
    let remainingDays = totalDays;
    
    // For "long" strategy, try to use more days per period
    const maxDaysPerPeriod = strategy === 'long' ? 999 : (strategy === 'short' ? 5 : 999);
    
    // Select most efficient periods
    for (const period of periods) {
        if (remainingDays <= 0) break;
        
        const daysToUse = Math.min(period.workingDays, remainingDays, maxDaysPerPeriod);
        
        // Add days around the holiday
        let added = 0;
        let offset = 0;
        
        while (added < daysToUse && offset < 10) {
            const before = new Date(period.holidayDate);
            before.setDate(before.getDate() - offset - 1);
            
            const after = new Date(period.holidayDate);
            after.setDate(after.getDate() + offset + 1);
            
            if (!isWeekend(before) && !isHoliday(before) && !selectedDates.includes(before.toISOString().split('T')[0])) {
                selectedDates.push(before.toISOString().split('T')[0]);
                added++;
            }
            
            if (added >= daysToUse) break;
            
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
    
    // Count consecutive days off and non-weekend days off
    const allDatesOff = [];
    let nonWeekendDaysOff = 0;
    
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(selectedYear, month + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(selectedYear, month, day);
            if (isWeekend(date) || isHoliday(date) || isVacation(date)) {
                allDatesOff.push(date);
                // Count only non-weekend days
                if (!isWeekend(date)) {
                    nonWeekendDaysOff++;
                }
            }
        }
    }
    
    // Sort dates
    allDatesOff.sort((a, b) => a - b);
    
    // Find consecutive periods
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
        <p><strong>${nonWeekendDaysOff}</strong> total days off (excluding weekends)</p>
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
        
        const firstDay = new Date(selectedYear, month, 1);
        const lastDay = new Date(selectedYear, month + 1, 0);
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
            const date = new Date(selectedYear, month, day);
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
                const holidayName = getHolidayName(date);
                dayDiv.title = holidayName;
            } else if (isWeekend(date)) {
                dayDiv.classList.add('weekend');
            }
            
            daysDiv.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(daysDiv);
        calendarsDiv.appendChild(monthDiv);
    }
}
