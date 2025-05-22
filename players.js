function searchPlayers() {
  const teamName = document.getElementById('teamInput').value.trim();
  const playerResults = document.getElementById('playerResults');
  playerResults.innerHTML = '';

  if (!teamName) {
    alert('Please enter a team name!');
    return;
  }

  fetch(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?t=${encodeURIComponent(teamName)}`)
    .then(response => response.json())
    .then(data => {
      if (!data.player) {
        playerResults.innerHTML = '<p>No players found.</p>';
        return;
      }

      data.player.forEach(player => {
        const card = document.createElement('div');
        card.className = 'card';

        card.innerHTML = `
          <img src="${player.strCutout || player.strThumb || 'https://via.placeholder.com/150'}" alt="${player.strPlayer}" />
          <h3>${player.strPlayer}</h3>
          <p>Position: ${player.strPosition || 'N/A'}</p>
          <p>Nationality: ${player.strNationality || 'N/A'}</p>
        `;

        playerResults.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      playerResults.innerHTML = '<p>Error fetching player data.</p>';
    });
}
