// Fetch holidays from Nager API
async function fetchHolidays(countryCode, year) {
  try {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const holidayMap = {};
    data.forEach(h => {
      holidayMap[h.date] = h.localName || h.name;
    });
    return holidayMap;
  } catch {
    // fallback: empty object if API fails
    return {};
  }
}

// Return array of Date objects for a month
function getMonthDays(year, month) {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// Render full year calendar
function renderCalendar(year, holidays, vacationDays) {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Collect all blocked dates (weekends + holidays)
  const blocked = new Set(Object.keys(holidays));

  for (let month = 0; month < 12; month++) {
    const monthDiv = document.createElement("div");
    monthDiv.classList.add("month");

    const title = document.createElement("h2");
    title.textContent = monthNames[month];
    monthDiv.appendChild(title);

    const weekdaysRow = document.createElement("div");
    weekdaysRow.classList.add("weekdays");
    ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d => {
      const dayEl = document.createElement("div");
      dayEl.textContent = d;
      weekdaysRow.appendChild(dayEl);
    });
    monthDiv.appendChild(weekdaysRow);

    const daysGrid = document.createElement("div");
    daysGrid.classList.add("days");

    const days = getMonthDays(year, month);
    const firstDay = (days[0].getDay() + 6) % 7; // Monday=0

    // Empty boxes
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("empty");
      daysGrid.appendChild(empty);
    }

    days.forEach(date => {
      const iso = date.toISOString().split("T")[0];
      const dayEl = document.createElement("div");
      dayEl.textContent = date.getDate();

      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) dayEl.classList.add("weekend");

      if (holidays[iso]) {
        dayEl.classList.add("holiday");
        dayEl.setAttribute("data-holiday", holidays[iso]);
      }

      daysGrid.appendChild(dayEl);
    });

    monthDiv.appendChild(daysGrid);
    container.appendChild(monthDiv);
  }

  // Vacation planning
  let daysUsed = 0;
  const allDays = Array.from(document.querySelectorAll(".month .days div"))
    .filter(d => !d.classList.contains("weekend") && !d.classList.contains("holiday"));

  // Simple greedy: pick first N available weekdays
  for (let i = 0; i < allDays.length && daysUsed < vacationDays; i++) {
    allDays[i].classList.add("vacation");
    daysUsed++;
  }
}

// Init
async function initPlanner() {
  const input = document.getElementById("daysInput");
  const select = document.getElementById("countrySelect");
  const year = new Date().getFullYear();
  const country = select.value;
  const days = parseInt(input.value) || 20;

  const holidays = await fetchHolidays(country, year);
  renderCalendar(year, holidays, days);
}

window.addEventListener("DOMContentLoaded", initPlanner);
document.getElementById("planBtn").addEventListener("click", initPlanner);
