// DOM elements
const searchBtn        = document.getElementById('searchBtn');
const teamInput        = document.getElementById('teamInput');
const messageEl        = document.getElementById('message');
const teamInfoSection  = document.getElementById('teamInfo');
const eventsSection    = document.getElementById('eventsSection');

const teamNameEl       = document.getElementById('teamName');
const stadiumEl        = document.getElementById('stadium');
const descriptionEl    = document.getElementById('description');
const teamBadgeEl      = document.getElementById('teamBadge');

let eventsChart = null;

// On click Search
searchBtn.addEventListener('click', () => {
  const teamName = teamInput.value.trim();
  if (!teamName) {
    messageEl.textContent = "Please enter a team name.";
    teamInfoSection.style.display = 'none';
    eventsSection.style.display = 'none';
    return;
  }
  messageEl.textContent = '';
  fetchTeamData(teamName);
});

// 1) Fetch basic team info
function fetchTeamData(teamName) {
  const url = `https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=${encodeURIComponent(teamName)}`;
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

// 2) Display team info in the DOM
function displayTeamInfo(team) {
  teamNameEl.textContent    = team.strTeam;
  stadiumEl.textContent     = team.strStadium;
  descriptionEl.textContent = team.strDescriptionEN
    ? team.strDescriptionEN.substring(0, 300) + '…'
    : 'No description available.';
  teamBadgeEl.src           = team.strTeamBadge;
  teamBadgeEl.alt           = team.strTeam;

  teamInfoSection.style.display = 'block';
}

// 3) Fetch next 5 upcoming events
function fetchUpcomingEvents(teamId) {
  const url = `https://www.thesportsdb.com/api/v1/json/1/eventsnext.php?id=${teamId}`;
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Events lookup failed (HTTP ${res.status})`);
      return res.json();
    })
    .then(data => {
      console.log('Events response:', data);
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

// 4) Render the bar chart
function displayEventsChart(events, teamId) {
  eventsSection.style.display = 'block';

  // Labels = event dates
  const labels = events.map(e =>
    new Date(e.dateEvent).toLocaleDateString()
  );

  // Points: Win=3, Draw=1, Loss=0
  const points = events.map(e => {
    if (e.intHomeScore == null || e.intAwayScore == null) return 0;
    const isHome = e.idHomeTeam === teamId;
    const teamScore = isHome ? +e.intHomeScore : +e.intAwayScore;
    const oppScore  = isHome ? +e.intAwayScore  : +e.intHomeScore;
    if (teamScore > oppScore) return 3;
    if (teamScore === oppScore) return 1;
    return 0;
  });

  // Destroy old chart if exists
  if (eventsChart) eventsChart.destroy();

  // Create new Chart.js bar chart
  const ctx = document.getElementById('eventsChart').getContext('2d');
  eventsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Points per Match',
        data: points,
        backgroundColor: points.map(p =>
          p === 3 ? 'green' :
          p === 1 ? 'orange' : 'red'
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
