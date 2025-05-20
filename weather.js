const apiKey = '06bba629fa20cb6ecda05a946534f60a'; // <-- Replace with your actual API key

const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const weatherInfo = document.getElementById('weather-info');
const cityNameSpan = document.getElementById('city-name');
const tempSpan = document.getElementById('temp');
const conditionSpan = document.getElementById('condition');
const humiditySpan = document.getElementById('humidity');
const windSpan = document.getElementById('wind');
const ctx = document.getElementById('forecastChart').getContext('2d');

let forecastChart;

form.addEventListener('submit', e => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if(city) {
    fetchWeather(city);
  }
});

async function fetchWeather(city) {
  errorDiv.textContent = '';
  weatherInfo.style.display = 'none';
  loading.style.display = 'block';

  try {
    // Fetch current weather
    const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
    if(!weatherRes.ok) throw new Error('City not found');
    const weatherData = await weatherRes.json();

    // Fetch 5-day forecast (3-hour intervals)
    const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
    if(!forecastRes.ok) throw new Error('Forecast data not found');
    const forecastData = await forecastRes.json();

    displayCurrentWeather(weatherData);
    displayForecastChart(forecastData);

  } catch(err) {
    errorDiv.textContent = err.message;
    if(forecastChart) {
      forecastChart.destroy();
    }
  } finally {
    loading.style.display = 'none';
  }
}

function displayCurrentWeather(data) {
  cityNameSpan.textContent = data.name + ', ' + data.sys.country;
  tempSpan.textContent = data.main.temp.toFixed(1);
  conditionSpan.textContent = data.weather[0].description;
  humiditySpan.textContent = data.main.humidity;
  windSpan.textContent = data.wind.speed;

  weatherInfo.style.display = 'block';
}

function displayForecastChart(data) {
  // Prepare data for next 5 days (take one data point per day around 12:00)
  const dailyData = data.list.filter(item => item.dt_txt.includes('12:00:00'));
  const labels = dailyData.map(item => new Date(item.dt_txt).toLocaleDateString());
  const temps = dailyData.map(item => item.main.temp);

  if(forecastChart) {
    forecastChart.destroy();
  }

  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Daily Temperature (°C)',
        data: temps,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: '#333', font: { size: 14 } }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Temperature (°C)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date'
          }
        }
      }
    }
  });
}
