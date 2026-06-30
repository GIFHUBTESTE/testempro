const fs = require('fs');

let html = fs.readFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', 'utf8');

// Dashboard HTML - Adicionar botão do Gráfico
html = html.replace('<div class="card-title"><i class="ti ti-chart-bar"></i> Lucro por dia</div>', 
`<div class="card-title" style="display:flex; justify-content:space-between; align-items:center;">
  <div><i class="ti ti-chart-area-line"></i> Lucro por dia (Montanhas)</div>
  <button class="btn btn-sm" onclick="toggleChartHistory()" id="btn-chart-hist" style="padding:4px 8px; font-size:11px;">Ver Todo Histórico</button>
</div>`);

// Add state to JS
const jsChartState = `let chartMostraTudo = false;
function toggleChartHistory() {
  chartMostraTudo = !chartMostraTudo;
  document.getElementById('btn-chart-hist').textContent = chartMostraTudo ? 'Ver últimos 7 dias' : 'Ver Todo Histórico';
  renderDashboard();
}

function formatDate(ds) {`;
html = html.replace('function formatDate(ds) {', jsChartState);

// Replace Chart Logic in renderDashboard
const oldChartLogicRegex = /const ctx2 = document\.getElementById\('chart-lucro'\);.*?\}\);/s;

const newChartLogic = `const ctx2 = document.getElementById('chart-lucro');
  if(chartLucro) chartLucro.destroy();
  
  let chartData = sorted;
  if (!chartMostraTudo && sorted.length > 7) {
    chartData = sorted.slice(sorted.length - 7);
  }
  
  const lucros = chartData.map(h=>h.lucro);
  const chartLabels = chartData.map(h=>formatDate(h.data));
  
  chartLucro = new Chart(ctx2, {
    type: 'line', 
    data: { 
      labels: chartLabels, 
      datasets: [{
        label: 'Lucro/Prejuízo',
        data: lucros,
        fill: true,
        tension: 0.4,
        segment: {
          borderColor: ctx => ctx.p0.parsed.y >= 0 ? '#0ca30c' : '#d03b3b',
          backgroundColor: ctx => ctx.p0.parsed.y >= 0 ? 'rgba(12,163,12,0.2)' : 'rgba(208,59,59,0.2)'
        },
        borderWidth: 2,
        pointBackgroundColor: lucros.map(l => l >= 0 ? '#0ca30c' : '#d03b3b'),
        pointBorderColor: isDark ? '#1a1a1a' : '#fff',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        x:{ticks:{color:tc,font:{size:10}},grid:{color:gc, display:false}},
        y:{ticks:{color:tc,font:{size:10},callback:v=>'R$'+v.toLocaleString('pt-BR')},grid:{color:gc, borderDash: [4, 4]}}
      }
    }
  });`;

html = html.replace(oldChartLogicRegex, newChartLogic);

// Add chartMostraTudo variable if not exists
fs.writeFileSync('c:/Users/thaly/DASHPRO CPA IDEAL/index.html', html);
console.log('Patch Dashboard Gráfico aplicado.');
