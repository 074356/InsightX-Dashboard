const searchBtn = document.getElementById('searchBtn');
const teamInput = document.getElementById('teamInput');
const teamInfoSection = document.getElementById('teamInfo');
const eventsSection = document.getElementById('eventsSection');
const messageEl = document.getElementById('message');

const teamNameEl = document.getElementById('teamName');
const stadiumEl = document.getElementById('stadium');
const descriptionEl = document.getElementById('description');
const teamBadgeEl = document.getElementById('teamBadge');

let eventsChart = null;

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

function fetchTeamData(teamName) {
  fetch(`https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=${encodeURIComponent(teamName)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.teams) throw new Error('Team not found');
      const team = data.teams[0];
      displayTeamInfo(team);
      fetchUpcomingEvents(team.idTeam);    // Pass the real team ID
    })
    .catch(err => {
      messageEl.textContent = err.message;
      teamInfoSection.style.display = 'none';
      eventsSection.style.display = 'none';
    });
}

function displayTeamInfo(team) {
  teamNameEl.textContent = team.strTeam;
  stadiumEl.textContent = team.strStadium;
  descriptionEl.textContent = team.strDescriptionEN
    ? team.strDescriptionEN.substring(0, 300) + '…'
    : 'No description available.';
  teamBadgeEl.src = team.strTeamBadge;
  teamBadgeEl.alt = team.strTeam;
  teamInfoSection.style.display = 'block';
}

// **Updated** to use eventsnext.php and pass teamId into chart logic
function fetchUpcomingEvents(teamId) {
  fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=${teamId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.events) throw new Error('No upcoming event data found');
      displayEventsChart(data.events, teamId);
    })
    .catch(err => {
      messageEl.textContent = err.message;
      eventsSection.style.display = 'none';
    });
}

function displayEventsChart(events, teamId) {
  eventsSection.style.display = 'block';

  // Dates for labels
  const labels = events.map(e => 
    new Date(e.dateEvent).toLocaleDateString()
  );

  // Map to points using the real teamId
  const points = events.map(e => {
    if (e.intHomeScore == null || e.intAwayScore == null) return 0;
    const isHome = e.idHomeTeam === teamId;
    const teamScore = isHome ? +e.intHomeScore : +e.intAwayScore;
    const oppScore  = isHome ? +e.intAwayScore : +e.intHomeScore;
    if (teamScore > oppScore) return 3;
    if (teamScore === oppScore) return 1;
    return 0;
  });

  if (eventsChart) eventsChart.destroy();
  const ctx = document.getElementById('eventsChart').getContext('2d');
  eventsChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data: points,
      backgroundColor: points.map(p => p===3?'green':p===1?'orange':'red')
    }]},
    options: {
      scales: {
        y: { beginAtZero: true, max: 3, ticks: { stepSize: 1 } }
      }
    }
  });
}
