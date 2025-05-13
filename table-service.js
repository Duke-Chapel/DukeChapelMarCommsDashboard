// Table creation and management for the dashboard
function createTableService() {
  // Format numbers for display
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
  
  // Create a standard table with headers and data
  const createTable = (containerId, headers, rows, caption = null) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Table container with ID ${containerId} not found`);
      return;
    }
    
    if (!headers || !headers.length || !rows) {
      // Display no data message
      container.innerHTML = `
        <table class="table table-striped">
          <thead>
            <tr>
              ${headers && headers.length ? headers.map(h => `<th>${h.label}</th>`).join('') : '<th>No Data</th>'}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="${headers && headers.length ? headers.length : 1}" class="text-center text-warning">
                No data available for the selected period
              </td>
            </tr>
          </tbody>
        </table>
      `;
      return;
    }
    
    let tableHtml = `
      <table class="table table-striped">
        ${caption ? `<caption>${caption}</caption>` : ''}
        <thead>
          <tr>
            ${headers.map(h => `<th>${h.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;
    
    rows.forEach(row => {
      tableHtml += '<tr>';
      headers.forEach(header => {
        const value = row[header.key];
        const formattedValue = header.format ? 
          header.format(value) : 
          (header.type ? formatNumber(value, header.type) : value);
        
        tableHtml += `<td>${formattedValue}</td>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = tableHtml;
  };
  
  // Create a comparison table with headers and data for two periods
  const createComparisonTable = (containerId, headers, currentRows, comparisonRows, caption = null) => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Table container with ID ${containerId} not found`);
      return;
    }
    
    if (!headers || !headers.length || !currentRows || !currentRows.length) {
      // Display no data message
      container.innerHTML = `
        <table class="table table-striped">
          <thead>
            <tr>
              ${headers && headers.length ? headers.map(h => `<th>${h.label}</th>`).join('') : '<th>No Data</th>'}
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="${(headers && headers.length ? headers.length : 1) + 1}" class="text-center text-warning">
                No data available for the selected period
              </td>
            </tr>
          </tbody>
        </table>
      `;
      return;
    }
    
    let tableHtml = `
      <table class="table table-striped comparison-table">
        ${caption ? `<caption>${caption}</caption>` : ''}
        <thead>
          <tr>
            ${headers.map(h => `<th>${h.label}</th>`).join('')}
            ${comparisonRows && comparisonRows.length ? '<th>Previous</th><th>Change</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `;
    
    currentRows.forEach((currentRow, index) => {
      const comparisonRow = comparisonRows && comparisonRows.length > index ? comparisonRows[index] : null;
      
      tableHtml += '<tr>';
      
      // Add each column from current period
      headers.forEach(header => {
        const value = currentRow[header.key];
        const formattedValue = header.format ? 
          header.format(value) : 
          (header.type ? formatNumber(value, header.type) : value);
        
        tableHtml += `<td>${formattedValue}</td>`;
      });
      
      // Add comparison data if available
      if (comparisonRow) {
        // Add previous period value (for the last numeric column)
        const lastNumericHeader = [...headers].reverse().find(h => h.type && h.type !== 'text');
        if (lastNumericHeader) {
          const prevValue = comparisonRow[lastNumericHeader.key];
          const formattedPrevValue = lastNumericHeader.format ? 
            lastNumericHeader.format(prevValue) : 
            (lastNumericHeader.type ? formatNumber(prevValue, lastNumericHeader.type) : prevValue);
          
          tableHtml += `<td>${formattedPrevValue}</td>`;
          
          // Add change column
          const currentValue = currentRow[lastNumericHeader.key];
          if (typeof currentValue === 'number' && typeof prevValue === 'number' && prevValue !== 0) {
            const changePercent = ((currentValue - prevValue) / prevValue) * 100;
            const changeClass = changePercent >= 0 ? 'positive-change' : 'negative-change';
            const changeSymbol = changePercent >= 0 ? '↑' : '↓';
            
            tableHtml += `<td class="${changeClass}">${changeSymbol} ${Math.abs(changePercent).toFixed(1)}%</td>`;
          } else {
            tableHtml += '<td>--</td>';
          }
        } else {
          tableHtml += '<td>--</td><td>--</td>';
        }
      }
      
      tableHtml += '</tr>';
    });
    
    tableHtml += `
        </tbody>
      </table>
    `;
    
    container.innerHTML = tableHtml;
  };
  
  // Create a table for top landing pages with session and engagement metrics
  const createLandingPagesTable = (containerId, pages) => {
    const headers = [
      { key: 'page', label: 'Page', type: 'text' },
      { key: 'sessions', label: 'Sessions', type: 'number' },
      { key: 'engagementTime', label: 'Avg. Engagement Time', type: 'duration' },
      { key: 'bounceRate', label: 'Bounce Rate', type: 'percent' }
    ];
    
    createTable(containerId, headers, pages);
  };
  
  // Create a table for top email campaigns
  const createEmailCampaignsTable = (containerId, campaigns, comparisonCampaigns = null) => {
    const headers = [
      { key: 'name', label: 'Campaign', type: 'text' },
      { key: 'openRate', label: 'Open Rate', type: 'percent' },
      { key: 'clickRate', label: 'Click Rate', type: 'percent' },
      { key: 'sent', label: 'Sent', type: 'number' },
      { key: 'opens', label: 'Opens', type: 'number' },
      { key: 'clicks', label: 'Clicks', type: 'number' }
    ];
    
    if (comparisonCampaigns) {
      createComparisonTable(containerId, headers, campaigns, comparisonCampaigns);
    } else {
      createTable(containerId, headers, campaigns);
    }
  };
  
  // Create a table for top FB videos
  const createFBVideosTable = (containerId, videos) => {
    const headers = [
      { key: 'title', label: 'Video Title', type: 'text' },
      { key: 'views', label: 'Views', type: 'number' },
      { key: 'reactions', label: 'Reactions', type: 'number' },
      { key: 'comments', label: 'Comments', type: 'number' },
      { key: 'shares', label: 'Shares', type: 'number' },
      { key: 'avgViewTime', label: 'Avg. View Time', type: 'duration' }
    ];
    
    createTable(containerId, headers, videos);
  };
  
  // Create a table for top IG posts
  const createIGPostsTable = (containerId, posts) => {
    const headers = [
      { key: 'description', label: 'Post Description', type: 'text', 
        format: (value) => value && value.length > 30 ? value.substring(0, 30) + '...' : value },
      { key: 'reach', label: 'Reach', type: 'number' },
      { key: 'likes', label: 'Likes', type: 'number' },
      { key: 'comments', label: 'Comments', type: 'number' },
      { key: 'shares', label: 'Shares', type: 'number' },
      { key: 'saves', label: 'Saves', type: 'number' }
    ];
    
    createTable(containerId, headers, posts);
  };
  
  // Create a table for YouTube top countries
  const createYouTubeGeographyTable = (containerId, countries) => {
    const headers = [
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'views', label: 'Views', type: 'number' },
      { key: 'watchTime', label: 'Watch Time (hours)', type: 'number' },
      { key: 'avgViewDuration', label: 'Avg. View Duration', type: 'text' }
    ];
    
    createTable(containerId, headers, countries);
  };
  
  // Return the public interface
  return {
    createTable,
    createComparisonTable,
    createLandingPagesTable,
    createEmailCampaignsTable,
    createFBVideosTable,
    createIGPostsTable,
    createYouTubeGeographyTable
  };
}
