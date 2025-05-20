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
    return;
  }
  messageEl.textContent = '';
  fetchTeamData(teamName);
});

function fetchTeamData(teamName) {
  const url = `https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=${encodeURIComponent(teamName)}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not OK');
      }
      return response.json();
    })
    .then(data => {
      if (!data.teams) {
        messageEl.textContent = "Team not found. Try a different name.";
        teamInfoSection.style.display = 'none';
        eventsSection.style.display = 'none';
        return;
      }
      const team = data.teams[0];
      displayTeamInfo(team);
      fetchRecentEvents(team.idTeam);
    })
    .catch(error => {
      messageEl.textContent = 'Error fetching team data. Please try again later.';
      console.error('Fetch error:', error);
      teamInfoSection.style.display = 'none';
      eventsSection.style.display = 'none';
    });
}

function displayTeamInfo(team) {
  teamNameEl.textContent = team.strTeam || 'N/A';
  stadiumEl.textContent = team.strStadium || 'N/A';
  descriptionEl.textContent = team.strDescriptionEN ? team.strDescriptionEN.substring(0, 300) + '...' : 'No description available.';
  teamBadgeEl.src = team.strTeamBadge || '';
  teamBadgeEl.alt = team.strTeam || 'Team Badge';

  teamInfoSection.style.display = 'block';
}

function fetchRecentEvents(teamId) {
  const url = `https://www.thesportsdb.com/api/v1/json/1/eventslast.php?id=${teamId}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (!data.results) {
        messageEl.textContent = "No recent event data found.";
        eventsSection.style.display = 'none';
        return;
      }
      displayEventsChart(data.results);
    })
    .catch(error => {
      messageEl.textContent = "Error fetching recent events.";
      console.error('Events fetch error:', error);
      eventsSection.style.display = 'none';
    });
}

function displayEventsChart(events) {
  eventsSection.style.display = 'block';

  // Prepare data: show last 5 match results (win/loss/draw) with scores
  const labels = events.map(ev => {
    const date = new Date(ev.dateEvent);
    return date.toLocaleDateString();
  }).reverse();

  // Map results to points (win=3, draw=1, loss=0) for visualization
  const points = events.map(ev => {
    if (ev.intHomeScore === null || ev.intAwayScore === null) return 0;

    let isHomeTeam = ev.idHomeTeam === ev.idTeam;
    let teamScore = isHomeTeam ? +ev.intHomeScore : +ev.intAwayScore;
    let oppScore = isHomeTeam ? +ev.intAwayScore : +ev.intHomeScore;

    if (teamScore > oppScore) return 3;
    if (teamScore === oppScore) return 1;
    return 0;
  }).reverse();

  if (eventsChart) {
    eventsChart.destroy();
  }

  const ctx = document.getElementById('eventsChart').getContext('2d');
  eventsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Points per Match (Win=3, Draw=1, Loss=0)',
        data: points,
        backgroundColor: points.map(p => p === 3 ? 'green' : p === 1 ? 'orange' : 'red'),
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true, max: 3, ticks: { stepSize: 1 } }
      }
    }
  });
}
