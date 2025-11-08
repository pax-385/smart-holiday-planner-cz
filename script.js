// Fetch Czech public holidays dynamically
async function fetchHolidays(year) {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/CZ`;
  const response = await fetch(url);
  const data = await response.json();
  return data.map(h => h.date); // returns array of YYYY-MM-DD strings
}

// Generate a calendar for a given year
function renderCalendar(year, holidays, vacationDays) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  // For simplicity, we’ll show just one year (12 months)
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
    const dayDiv = document.createElement("div");
    dayDiv.classList.add("day");

    const isoDate = date.toISOString().split("T")[0];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const weekday = date.getDay();

    // Mark weekends
    if (weekday === 0 || weekday === 6) {
      dayDiv.classList.add("weekend");
    }

    // Mark public holidays
    if (holidays.includes(isoDate)) {
      dayDiv.classList.add("holiday");
      dayDiv.title = "Public holiday";
    }

    // Placeholder vacation logic
    if (vacationDays > 0 && holidays.includes(isoDate)) {
      let tempDate = new Date(date);
      let used = 0;
      while (used < vacationDays) {
        tempDate.setDate(tempDate.getDate() + 1);
        if (
          tempDate.getDay() !== 0 &&
          tempDate.getDay() !== 6 &&
          !holidays.includes(tempDate.toISOString().split("T")[0])
        ) {
          const vacationCell = document.querySelector(
            `[data-date="${tempDate.toISOString().split("T")[0]}"]`
          );
          if (vacationCell) vacationCell.classList.add("vacation");
          used++;
        }
      }
    }

    dayDiv.textContent = `${day}.${month}`;
    dayDiv.dataset.date = isoDate;
    calendar.appendChild(dayDiv);
  }
}

// Auto-load the calendar on page load
window.addEventListener("DOMContentLoaded", async () => {
  const year = new Date().getFullYear();
  const defaultDays = parseInt(document.getElementById("daysInput").value);
  const holidays = await fetchHolidays(year);
  renderCalendar(year, holidays, defaultDays);
});

// Recalculate when button is clicked
document.getElementById("planBtn").addEventListener("click", async () => {
  const days = parseInt(document.getElementById("daysInput").value);
  const year = new Date().getFullYear();
  const holidays = await fetchHolidays(year);
  renderCalendar(year, holidays, days);
});
