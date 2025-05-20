const form = document.getElementById('team-form');
const teamInput = document.getElementById('team-input');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const teamInfo = document.getElementById('team-info');
const teamNameEl = document.getElementById('team-name');
const formedYearEl = document.getElementById('formed-year');
const stadiumEl = document.getElementById('stadium');
const locationEl = document.getElementById('location');
const ctx = document.getElementById('resultsChart').getContext('2d');

let resultsChart;

form.addEventListener('submit', e => {
  e.preventDefault();
  const teamName = teamInput.value.trim();
  if (teamName) {
    fetchTeamData(teamName);
  }
});

async function fetchTeamData(teamName) {
  errorDiv.textContent = '';
  teamInfo.style.display = 'none';
  if(resultsChart) resultsChart.destroy();
  loading.style.display = 'block';

  try {
    // Search for the team
    const teamRes = await fetch(`https://www.thesportsdb.com/api/v1/json/1/searchteams.php?t=${encodeURIComponent(teamName)}`);
    const teamData = await teamRes.json();

    if(!teamData.teams) throw new Error('Team not found. Please try another.');

    const team = teamData.teams[0];

    displayTeamInfo(team);

    // Fetch last 10 events for the team
    const eventsRes = await fetch(`https://www.thesportsdb.com/api/v1/json/1/eventslast.php?id=${team.idTeam}`);
    const eventsData = await eventsRes.json();

    if(!eventsData.results) throw new Error('No recent events found.');

    displayResultsChart(eventsData.results);

  } catch(err) {
    errorDiv.textContent = err.message;
  } finally {
    loading.style.display = 'none';
  }
}

function displayTeamInfo(team) {
  teamNameEl.textContent = team.strTeam;
  formedYearEl.textContent = team.intFormedYear;
  stadiumEl.textContent = team.strStadium;
  locationEl.textContent = team.strStadiumLocation;

  teamInfo.style.display = 'block';
}

function displayResultsChart(events) {
  // We'll show a bar chart of last 10 match results: Win, Draw, Loss counts

  let winCount = 0, drawCount = 0, lossCount = 0;

  events.forEach(event => {
    if(event.intHomeScore !== null && event.intAwayScore !== null) {
      const isHome = (event.strHomeTeam === event.strTeam);
      const teamScore = isHome ? parseInt(event.intHomeScore) : parseInt(event.intAwayScore);
      const oppScore = isHome ? parseInt(event.intAwayScore) : parseInt(event.intHomeScore);

      if(teamScore > oppScore) winCount++;
      else if(teamScore === oppScore) drawCount++;
      else lossCount++;
    }
  });

  if(resultsChart) resultsChart.destroy();

  resultsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Wins', 'Draws', 'Losses'],
      datasets: [{
        label: 'Last 10 Match Results',
        data: [winCount, drawCount, lossCount],
        backgroundColor: ['#4caf50', '#ffc107', '#f44336']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          title: { display: true, text: 'Number of Matches' }
        }
      }
    }
  });
}
