async function fetchHolidays(countryCode, year) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.map(h => h.date); // returns array of YYYY-MM-DD strings
}

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
    const startDay = (firstDay.getDay() + 6) % 7; // shift so Monday = 0

    // Empty cells before the first day
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

      if (holidays.includes(isoDate)) {
        dayEl.classList.add("holiday");
      }

      // Simple suggestion: mark 1 vacation day after each holiday
      const nextDate = new Date(date);
      nextDate.setDate(day + 1);
      const nextIso = nextDate.toISOString().split("T")[0];
      if (holidays.includes(isoDate) && vacationDays > 0 && weekday < 5) {
        dayEl.classList.add("holiday");
        const vacationEl = document.createElement("div");
        vacationEl.classList.add("vacation");
      }

      daysGrid.appendChild(dayEl);
    }

    monthDiv.appendChild(daysGrid);
    container.appendChild(monthDiv);
  }
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
