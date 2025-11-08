// Fetch holidays with names for a given country and year
async function fetchHolidays(countryCode, year) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const response = await fetch(url);
  const data = await response.json();
  // Return an object mapping date -> holiday name
  const holidayMap = {};
  data.forEach(h => {
    holidayMap[h.date] = h.localName || h.name;
  });
  return holidayMap;
}

// Render monthly calendars
function renderCalendar(year, holidays, vacationDays) {
  const container = document.getElementById("calendarContainer");
  container.innerHTML = "";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  for (let month = 0; month < 12; month++) {
    const monthDiv = document.createElement("div");
    monthDiv.classList.add("month");

    const title = document.createElement("h2");
    title.textContent = monthNames[month];
    monthDiv.appendChild(title);

    const weekdaysRow = document.createElement("div");
    weekdaysRow.classList.add("weekdays");
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
      const dayEl = document.createElement("div");
      dayEl.textContent = d;
      weekdaysRow.appendChild(dayEl);
    });
    monthDiv.appendChild(weekdaysRow);

    const daysGrid = document.createElement("div");
    daysGrid.classList.add("days");

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7; // Monday = 0

    // Fill in blank spaces before the first day
    for (let i = 0; i < startDay; i++) {
      const empty = document.createElement("div");
      empty.classList.add("empty");
      daysGrid.appendChild(empty);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isoDate = date.toISOString().split("T")[0];

      const dayEl = document.createElement("div");
      dayEl.textContent = day;

      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) dayEl.classList.add("weekend");

      // Mark holidays with tooltips
      if (holidays[isoDate]) {
        dayEl.classList.add("holiday");
        dayEl.title = holidays[isoDate];
      }

      daysGrid.appendChild(dayEl);
    }

    monthDiv.appendChild(daysGrid);
    container.appendChild(monthDiv);
  }

  // Suggest simple vacation placement logic (optional future step)
}

async function initPlanner() {
  const input = document.getElementById("daysInput");
  const select = document.getElementById("countrySelect");
  const year = new Date().getFullYear();
  const countryCode = select.value;
  const days = parseInt(input.getAttribute("value")) || 20;

  const holidays = await fetchHolidays(countryCode, year);
  renderCalendar(year, holidays, days);
}

window.addEventListener("DOMContentLoaded", initPlanner);

document.getElementById("planBtn").addEventListener("click", async () => {
  const days = parseInt(document.getElementById("daysInput").value);
  const countryCode = document.getElementById("countrySelect").value;
  const year = new Date().getFullYear();

  const holidays = await fetchHolidays(countryCode, year);
  renderCalendar(year, holidays, days);
});
