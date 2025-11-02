// Chart functionality
const ctx = document.getElementById('combinedChart').getContext('2d');

// Fungsi untuk mendapatkan warna berdasarkan tema
function getChartColors() {
  const isLightTheme = document.body.getAttribute('data-theme') === 'light';
  return {
    textColor: isLightTheme ? '#1e293b' : '#e2e8f0',
    gridColor: isLightTheme ? 'rgba(100, 116, 139, 0.2)' : 'rgba(255, 255, 255, 0.06)',
    legendColor: isLightTheme ? '#1e293b' : '#e2e8f0'
  };
}

// Inisialisasi chart dengan pengaturan warna yang dinamis
const chartColors = getChartColors();
const chart = new Chart(ctx, {
  type: 'line',
  data: { 
    labels: [], 
    datasets: [
      { 
        label: 'Kelembaban (%)', 
        data: [], 
        borderColor: '#10b981', 
        backgroundColor: 'rgba(16,185,129,0.08)', 
        fill: false, 
        tension: 0.3, 
        pointRadius: 3,
        pointBackgroundColor: '#10b981',
        yAxisID: 'y'
      },
      { 
        label: 'Suhu (°C)', 
        data: [], 
        borderColor: '#3b82f6', 
        backgroundColor: 'rgba(59,130,246,0.08)', 
        fill: false, 
        tension: 0.3, 
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
        yAxisID: 'y1'
      }
    ] 
  },
  options: {
    responsive: true, 
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: { 
        ticks: { 
          color: chartColors.textColor,
          maxTicksLimit: 7
        }, 
        grid: { 
          color: chartColors.gridColor 
        } 
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 100,
        ticks: { 
          color: chartColors.textColor,
          stepSize: 20
        },
        grid: { 
          color: chartColors.gridColor 
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 10,
        max: 40,
        ticks: { 
          color: chartColors.textColor,
          stepSize: 5
        },
        grid: { 
          drawOnChartArea: false 
        }
      }
    },
    plugins: { 
      legend: { 
        labels: { 
          color: chartColors.legendColor 
        } 
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  }
});

// Fungsi untuk memperbarui tema chart
function updateChartTheme() {
  const colors = getChartColors();
  
  chart.options.scales.x.ticks.color = colors.textColor;
  chart.options.scales.x.grid.color = colors.gridColor;
  chart.options.scales.y.ticks.color = colors.textColor;
  chart.options.scales.y.grid.color = colors.gridColor;
  chart.options.scales.y1.ticks.color = colors.textColor;
  chart.options.plugins.legend.labels.color = colors.legendColor;
  
  chart.update();
}

let soilData = [];
let tempData = [];
let labels = [];
const maxDataPoints = 7; // Batasi menjadi 7 data points

// Update chart
function updateChart() {
  chart.data.labels = [...labels];
  chart.data.datasets[0].data = [...soilData];
  chart.data.datasets[1].data = [...tempData];
  chart.update();
}