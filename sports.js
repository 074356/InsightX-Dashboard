// DOM references
const searchBtn       = document.getElementById('searchBtn');
const teamInput       = document.getElementById('teamInput');
const messageEl       = document.getElementById('message');
const teamInfoSection = document.getElementById('teamInfo');
const eventsSection   = document.getElementById('eventsSection');

const teamNameEl      = document.getElementById('teamName');
const stadiumEl       = document.getElementById('stadium');
const descriptionEl   = document.getElementById('description');
const teamBadgeEl     = document.getElementById('teamBadge');

let eventsChart = null;

// 1️⃣ Handle Search button click
searchBtn.addEventListener('click', () => {
  const team = teamInput.value.trim();
  if (!team) {
    messageEl.textContent = 'Please enter a team name.';
    teamInfoSection.style.display = 'none';
    eventsSection.style.display = 'none';
    return;
  }
  messageEl.textContent = '';
  fetchTeamData(team);
});

// 2️⃣ Fetch team info using API key “3”
function fetchTeamData(teamName) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Team lookup failed (HTTP ${res.status})`);
      return res.json();
    })
    .then(data => {
      if (!data.teams) throw new Error('Team not found. Try another name.');
      const team = data.teams[0];
      displayTeamInfo(team);
      fetchUpcomingEvents(team.idTeam);
    })
    .catch(err => {
      messageEl.textContent = err.message;
      teamInfoSection.style.display = 'none';
      eventsSection.style.display = 'none';
    });
}

// 3️⃣ Render the basic team info
function displayTeamInfo(team) {
  teamNameEl.textContent    = team.strTeam;
  stadiumEl.textContent     = team.strStadium;
  descriptionEl.textContent = team.strDescriptionEN
    ? `${team.strDescriptionEN.substring(0, 300)}…`
    : 'No description available.';
  teamBadgeEl.src           = team.strTeamBadge;
  teamBadgeEl.alt           = team.strTeam;

  teamInfoSection.style.display = 'block';
}

// 4️⃣ Fetch the next 5 upcoming events (API key “3”)
function fetchUpcomingEvents(teamId) {
  const url = `https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Events lookup failed (HTTP ${res.status})`);
      return res.json();
    })
    .then(data => {
      if (!data.events || data.events.length === 0) {
        throw new Error('No upcoming events found.');
      }
      displayEventsChart(data.events, teamId);
    })
    .catch(err => {
      messageEl.textContent = err.message;
      eventsSection.style.display = 'none';
    });
}

// 5️⃣ Draw the bar chart of upcoming events
function displayEventsChart(events, teamId) {
  eventsSection.style.display = 'block';

  // Prepare labels (event dates)
  const labels = events.map(e =>
    new Date(e.dateEvent).toLocaleDateString()
  );

  // Compute points: Win=3, Draw=1, Loss=0
  const points = events.map(e => {
    if (e.intHomeScore == null || e.intAwayScore == null) return 0;
    const isHome = e.idHomeTeam === teamId;
    const teamScore = isHome ? +e.intHomeScore : +e.intAwayScore;
    const oppScore  = isHome ? +e.intAwayScore : +e.intHomeScore;
    if (teamScore > oppScore) return 3;
    if (teamScore === oppScore) return 1;
    return 0;
  });

  // Remove any existing chart
  if (eventsChart) eventsChart.destroy();

  const ctx = document.getElementById('eventsChart').getContext('2d');
  eventsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Points per Upcoming Match',
        data: points,
        backgroundColor: points.map(p =>
          p === 3 ? 'green' :
          p === 1 ? 'orange' :
          'red'
        )
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 3,
          ticks: { stepSize: 1 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}
