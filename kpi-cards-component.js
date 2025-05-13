// Component for KPI Cards with comparison capabilities
function createKpiCards() {
  // Helper to format numbers
  const formatNumber = (num, type = 'number') => {
    if (num === undefined || num === null || isNaN(num)) return '--';
    
    if (type === 'percent') {
      return num.toFixed(2) + '%';
    } else if (type === 'duration') {
      // Format seconds as mm:ss
      const minutes = Math.floor(num / 60);
      const seconds = Math.floor(num % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (type === 'number') {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toFixed(0);
    }
    
    return num.toString();
  };
  
  // Create a KPI card
  const createKpiCard = (title, currentValue, comparisonValue = null, type = 'number', showComparisonAsPercent = true) => {
    const card = document.createElement('div');
    card.className = 'col-md-3 col-sm-6 mb-4';
    
    let changePercent = 0;
    let changeClass = '';
    let changeSymbol = '';
    
    if (comparisonValue !== null && comparisonValue !== 0) {
      changePercent = ((currentValue - comparisonValue) / comparisonValue) * 100;
      changeClass = changePercent >= 0 ? 'positive-change' : 'negative-change';
      changeSymbol = changePercent >= 0 ? '↑' : '↓';
    }
    
    card.innerHTML = `
      <div class="metric-card">
        <h5>${title}</h5>
        <div class="metric-value">${formatNumber(currentValue, type)}</div>
        ${comparisonValue !== null ? `
          <div class="metric-comparison">
            ${showComparisonAsPercent ? 
              `<div class="metric-change ${changeClass}">${changeSymbol} ${Math.abs(changePercent).toFixed(1)}%</div>` :
              `<div class="metric-previous">vs. ${formatNumber(comparisonValue, type)}</div>
               <div class="metric-change ${changeClass}">${changeSymbol} ${formatNumber(Math.abs(currentValue - comparisonValue), type)}</div>`
            }
          </div>
        ` : ''}
      </div>
    `;
    
    return card;
  };
  
  // Create a section of KPI cards
  const createKpiSection = (containerId, title, kpiData) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear previous content
    container.innerHTML = '';
    
    // Add section title if provided
    if (title) {
      const titleElement = document.createElement('h3');
      titleElement.className = 'h5 mb-3';
      titleElement.textContent = title;
      container.appendChild(titleElement);
    }
    
    // Create row for cards
    const row = document.createElement('div');
    row.className = 'row';
    container.appendChild(row);
    
    // Add each KPI card
    kpiData.forEach(kpi => {
      const card = createKpiCard(
        kpi.title,
        kpi.currentValue,
        kpi.comparisonValue,
        kpi.type || 'number',
        kpi.showComparisonAsPercent !== false
      );
      row.appendChild(card);
    });
  };
  
  return {
    createKpiSection
  };
}
