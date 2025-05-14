/**
 * This file contains the necessary UI enhancements to display all required KPIs
 * It ensures all tabs have the proper sections for demographics, metrics, and comparisons
 */

// Wait for the dashboard to be initialized
document.addEventListener('DOMContentLoaded', function() {
  // Wait a bit for dashboard initialization
  setTimeout(enhanceDashboardUI, 1000);
});

function enhanceDashboardUI() {
  // Create YouTube metrics UI if missing
  ensureYouTubeMetricsUI();
  
  // Create Facebook post rankings
  ensureFacebookPostRankingUI();
  
  // Create Instagram post rankings
  ensureInstagramPostRankingUI();
  
  // Create Web Demographics UI if missing
  ensureWebDemographicsUI();
  
  // Create Email Links UI if missing
  ensureEmailLinksUI();
  
  // Add comparison toggle to date filter
  enhanceDateFilter();
}

/**
 * Ensure YouTube metrics UI exists with subscriber vs non-subscriber section
 */
function ensureYouTubeMetricsUI() {
  const youtubeTab = document.getElementById('youtube');
  if (!youtubeTab) return;
  
  // Check if metrics row already exists
  let metricsRow = youtubeTab.querySelector('#youtube-metrics-row');
  if (!metricsRow) {
    // First section is usually the age/gender demographics
    const firstSection = youtubeTab.querySelector('.row');
    if (!firstSection) return;
    
    // Create metrics section before demographics
    const metricsSection = document.createElement('div');
    metricsSection.className = 'row mb-4';
    metricsSection.innerHTML = `
      <div class="col-md-12">
        <div class="dashboard-section youtube-section">
          <h3 class="h5 mb-3">YouTube Performance Metrics</h3>
          <div class="row" id="youtube-metrics-row">
            <!-- KPI cards will be inserted here by JavaScript -->
          </div>
        </div>
      </div>
    `;
    
    // Insert before the first section
    firstSection.parentNode.insertBefore(metricsSection, firstSection);
  }
  
  // Check if videos table exists
  let videosTable = youtubeTab.querySelector('#youtube-videos-table');
  if (!videosTable) {
    // Find the bottom of the page
    const lastSection = youtubeTab.querySelector('.row:last-child');
    if (!lastSection) return;
    
    // Create videos table section
    const videosSection = document.createElement('div');
    videosSection.className = 'col-md-12 mb-4';
    videosSection.innerHTML = `
      <div class="dashboard-section youtube-section">
        <h3 class="h5 mb-3">Top YouTube Videos</h3>
        <div class="table-responsive">
          <table class="table table-striped" id="youtube-videos-table">
            <thead>
              <tr>
                <th>Video Title</th>
                <th>Views</th>
                <th>Likes</th>
                <th>Comments</th>
                <th>Shares</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" class="text-center">Loading video data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Append after the last section
    lastSection.parentNode.appendChild(videosSection);
  }
}

/**
 * Ensure Facebook has "Top 5" post rankings
 */
function ensureFacebookPostRankingUI() {
  const facebookTab = document.getElementById('facebook');
  if (!facebookTab) return;
  
  // Find the videos table section
  const videosSection = facebookTab.querySelector('.dashboard-section:has(#fb-videos-table)');
  if (!videosSection) return;
  
  // Check if top posts section already exists
  let topPostsSection = videosSection.querySelector('.row:has(.metric-card)');
  
  if (!topPostsSection || !videosSection.querySelector('#fb-most-reach')) {
    // Create a row with the top posts by category
    const topPostsRow = document.createElement('div');
    topPostsRow.className = 'row mb-3';
    topPostsRow.innerHTML = `
      <div class="col-md-12">
        <h4 class="h6 mb-3">Top Posts by Category</h4>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Reach</h5>
          <div id="fb-most-reach" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Liked</h5>
          <div id="fb-most-liked" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Comments</h5>
          <div id="fb-most-commented" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Shares</h5>
          <div id="fb-most-shared" class="small">Loading...</div>
        </div>
      </div>
    `;
    
    // Insert before the table
    const tableElement = videosSection.querySelector('.table-responsive');
    if (tableElement) {
      videosSection.insertBefore(topPostsRow, tableElement);
    }
  }
  
  // Set up event listener to update the rankings when data is loaded
  setupFacebookRankingsUpdates();
}

/**
 * Ensure Instagram has "Top 5" post rankings
 */
function ensureInstagramPostRankingUI() {
  const instagramTab = document.getElementById('instagram');
  if (!instagramTab) return;
  
  // Find the posts table section
  const postsSection = instagramTab.querySelector('.dashboard-section:has(#top-ig-posts-table)');
  if (!postsSection) return;
  
  // Check if top posts section already exists
  let topPostsSection = postsSection.querySelector('.row:has(.metric-card)');
  
  if (!topPostsSection || !postsSection.querySelector('#ig-most-reach')) {
    // Create a row with the top posts by category
    const topPostsRow = document.createElement('div');
    topPostsRow.className = 'row mb-3';
    topPostsRow.innerHTML = `
      <div class="col-md-12">
        <h4 class="h6 mb-3">Top Posts by Category</h4>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Reach</h5>
          <div id="ig-most-reach" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="metric-card">
          <h5>Most Likes</h5>
          <div id="ig-most-liked" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="metric-card">
          <h5>Most Comments</h5>
          <div id="ig-most-commented" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="metric-card">
          <h5>Most Shares</h5>
          <div id="ig-most-shared" class="small">Loading...</div>
        </div>
      </div>
      <div class="col-md-2">
        <div class="metric-card">
          <h5>Most Saved</h5>
          <div id="ig-most-saved" class="small">Loading...</div>
        </div>
      </div>
    `;
    
    // Insert before the table
    const tableElement = postsSection.querySelector('.table-responsive');
    if (tableElement) {
      postsSection.insertBefore(topPostsRow, tableElement);
    }
  }
  
  // Set up event listener to update the rankings when data is loaded
  setupInstagramRankingsUpdates();
}

/**
 * Ensure Web Analytics tab has demographics section
 */
function ensureWebDemographicsUI() {
  const webTab = document.getElementById('web');
  if (!webTab) return;
  
  // Check if demographics section already exists
  let demographicsSection = webTab.querySelector('.dashboard-section:has(#web-demographics-chart)');
  if (!demographicsSection) {
    // Create a row for demographics
    const demographicsRow = document.createElement('div');
    demographicsRow.className = 'col-md-12 mb-4';
    demographicsRow.innerHTML = `
      <div class="dashboard-section web-section">
        <h3 class="h5 mb-3">Demographics Breakdown</h3>
        <div class="row">
          <div class="col-md-4">
            <div class="chart-container">
              <canvas id="web-countries-chart"></canvas>
            </div>
          </div>
          <div class="col-md-4">
            <div class="chart-container">
              <canvas id="web-languages-chart"></canvas>
            </div>
          </div>
          <div class="col-md-4">
            <div class="chart-container">
              <canvas id="web-regions-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Find a good place to insert
    const firstSection = webTab.querySelector('.row:first-child');
    if (firstSection) {
      firstSection.appendChild(demographicsRow);
    }
  }
  
  // Create traffic sources section if not exists
  let trafficsSection = webTab.querySelector('.dashboard-section:has(#traffic-sources-chart)');
  if (!trafficsSection) {
    // Create a row for traffic sources
    const trafficRow = document.createElement('div');
    trafficRow.className = 'col-md-12 mb-4';
    trafficRow.innerHTML = `
      <div class="dashboard-section web-section">
        <h3 class="h5 mb-3">Traffic Sources</h3>
        <div class="row">
          <div class="col-md-12">
            <div class="chart-container">
              <canvas id="traffic-sources-chart"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Find a good place to insert
    const firstSection = webTab.querySelector('.row:first-child');
    if (firstSection) {
      firstSection.appendChild(trafficRow);
    }
  }
  
  // Set up event listener to update the web demographics when data is loaded
  setupWebDemographicsUpdates();
}

/**
 * Ensure Email tab has links section
 */
function ensureEmailLinksUI() {
  const emailTab = document.getElementById('email');
  if (!emailTab) return;
  
  // Check if links section already exists
  let linksSection = emailTab.querySelector('.dashboard-section:has(#best-links-table)');
  if (!linksSection) {
    // Create a row for email links
    const linksRow = document.createElement('div');
    linksRow.className = 'col-md-12 mb-4';
    linksRow.innerHTML = `
      <div class="dashboard-section email-section">
        <h3 class="h5 mb-3">Best Performing Links</h3>
        <div class="table-responsive">
          <table class="table table-striped" id="best-links-table">
            <thead>
              <tr>
                <th>Link</th>
                <th>Clicks</th>
                <th>Click Rate</th>
                <th>Campaign</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="4" class="text-center">Loading link data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Find a good place to insert
    const campaignsTable = emailTab.querySelector('#top-email-campaigns-table');
    if (campaignsTable) {
      const campaignsSection = campaignsTable.closest('.dashboard-section');
      if (campaignsSection && campaignsSection.parentNode) {
        campaignsSection.parentNode.insertBefore(linksRow, campaignsSection);
      }
    }
  }
  
  // Set up event listener to update the email links when data is loaded
  setupEmailLinksUpdates();
}

/**
 * Add comparison period toggle to date filter
 */
function enhanceDateFilter() {
  const dateFilter = document.getElementById('date-filter-container');
  if (!dateFilter) return;
  
  // Check if comparison toggle already exists
  let comparisonToggle = dateFilter.querySelector('#enable-comparison');
  if (!comparisonToggle) {
    // Create row for comparison toggle
    const toggleRow = document.createElement('div');
    toggleRow.className = 'row mb-3';
    toggleRow.innerHTML = `
      <div class="col-12">
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" id="enable-comparison">
          <label class="form-check-label" for="enable-comparison">Enable period comparison</label>
        </div>
      </div>
    `;
    
    // Find controls div
    const controlsDiv = dateFilter.querySelector('.date-filter-controls');
    if (controlsDiv) {
      // Insert after the first row
      const firstRow = controlsDiv.querySelector('.row');
      if (firstRow) {
        firstRow.after(toggleRow);
      } else {
        controlsDiv.appendChild(toggleRow);
      }
      
      // Create comparison period controls
      const comparisonControlsRow = document.createElement('div');
      comparisonControlsRow.id = 'comparison-period-controls';
      comparisonControlsRow.className = 'row align-items-end mb-3';
      comparisonControlsRow.style.display = 'none';
      comparisonControlsRow.innerHTML = `
        <div class="col-md-12 mb-3">
          <h6 class="comparison-period-label">Comparison Period</h6>
        </div>
        <div class="col-md-3">
          <label class="form-label">Start Date</label>
          <input type="date" id="comparison-start-date" class="form-control">
        </div>
        <div class="col-md-3">
          <label class="form-label">End Date</label>
          <input type="date" id="comparison-end-date" class="form-control">
        </div>
        <div class="col-md-6">
          <div class="btn-group" role="group">
            <button id="previous-period" class="btn btn-outline-secondary">Previous Period</button>
            <button id="same-period-last-year" class="btn btn-outline-secondary">Same Period Last Year</button>
          </div>
        </div>
      `;
      
      // Insert after the toggle row
      toggleRow.after(comparisonControlsRow);
      
      // Set up toggle event listener
      comparisonToggle = document.getElementById('enable-comparison');
      comparisonToggle.addEventListener('change', function() {
        document.getElementById('comparison-period-controls').style.display = this.checked ? 'flex' : 'none';
        
        // In real implementation, this would update the date filter state
        // and potentially trigger a dashboard update
      });
    }
  }
}

/**
 * Set up event listeners to update Facebook post rankings
 */
function setupFacebookRankingsUpdates() {
  // This function would be called after Facebook data is loaded
  // It would update the ranking cards with the top posts
  
  // Mock function - in real implementation, this would use actual data
  const updateFacebookRankings = () => {
    // Get Facebook data - in real implementation, this would come from the data service
    const data = {
      topByReach: { title: 'Chapel Tour', reach: 4200 },
      topByLikes: { title: 'Easter Service', likes: 320 },
      topByComments: { title: 'Community Outreach', comments: 78 },
      topByShares: { title: 'Holiday Concert', shares: 145 }
    };
    
    // Update the DOM
    document.getElementById('fb-most-reach').innerHTML = `
      <strong>${data.topByReach.title}</strong><br>
      Reach: ${data.topByReach.reach.toLocaleString()}
    `;
    
    document.getElementById('fb-most-liked').innerHTML = `
      <strong>${data.topByLikes.title}</strong><br>
      Likes: ${data.topByLikes.likes.toLocaleString()}
    `;
    
    document.getElementById('fb-most-commented').innerHTML = `
      <strong>${data.topByComments.title}</strong><br>
      Comments: ${data.topByComments.comments.toLocaleString()}
    `;
    
    document.getElementById('fb-most-shared').innerHTML = `
      <strong>${data.topByShares.title}</strong><br>
      Shares: ${data.topByShares.shares.toLocaleString()}
    `;
  };
  
  // Set timeout to simulate data loading
  setTimeout(updateFacebookRankings, 1500);
}

/**
 * Set up event listeners to update Instagram post rankings
 */
function setupInstagramRankingsUpdates() {
  // This function would be called after Instagram data is loaded
  // It would update the ranking cards with the top posts
  
  // Mock function - in real implementation, this would use actual data
  const updateInstagramRankings = () => {
    // Get Instagram data - in real implementation, this would come from the data service
    const data = {
      topByReach: { title: 'Chapel interior renovation complete!', reach: 6800 },
      topByLikes: { title: 'Community service day highlights', likes: 520 },
      topByComments: { title: 'Youth choir performance', comments: 87 },
      topByShares: { title: 'Historic chapel architecture', shares: 142 },
      topBySaves: { title: 'Historic chapel architecture', saves: 82 }
    };
    
    // Update the DOM
    document.getElementById('ig-most-reach').innerHTML = `
      <strong>${data.topByReach.title}</strong><br>
      Reach: ${data.topByReach.reach.toLocaleString()}
    `;
    
    document.getElementById('ig-most-liked').innerHTML = `
      <strong>${data.topByLikes.title}</strong><br>
      Likes: ${data.topByLikes.likes.toLocaleString()}
    `;
    
    document.getElementById('ig-most-commented').innerHTML = `
      <strong>${data.topByComments.title}</strong><br>
      Comments: ${data.topByComments.comments.toLocaleString()}
    `;
    
    document.getElementById('ig-most-shared').innerHTML = `
      <strong>${data.topByShares.title}</strong><br>
      Shares: ${data.topByShares.shares.toLocaleString()}
    `;
    
    document.getElementById('ig-most-saved').innerHTML = `
      <strong>${data.topBySaves.title}</strong><br>
      Saves: ${data.topBySaves.saves.toLocaleString()}
    `;
  };
  
  // Set timeout to simulate data loading
  setTimeout(updateInstagramRankings, 1500);
}

/**
 * Set up Web demographics updates
 */
function setupWebDemographicsUpdates() {
  // Function to update web demographics charts
  const updateWebDemographics = () => {
    // In real implementation, this would fetch data from the data service
    if (window.chartService) {
      // Countries chart
      const countriesData = [
        { name: 'United States', value: 65 },
        { name: 'Canada', value: 9 },
        { name: 'United Kingdom', value: 8 },
        { name: 'Australia', value: 5 },
        { name: 'Germany', value: 4 },
        { name: 'Others', value: 9 }
      ];
      
      if (document.getElementById('web-countries-chart')) {
        window.chartService.createPieChart(
          'web-countries-chart',
          'Top Countries',
          countriesData.map(item => item.name),
          countriesData.map(item => item.value),
          null
        );
      }
      
      // Languages chart
      const languagesData = [
        { name: 'English', value: 82 },
        { name: 'Spanish', value: 7 },
        { name: 'French', value: 5 },
        { name: 'German', value: 3 },
        { name: 'Others', value: 3 }
      ];
      
      if (document.getElementById('web-languages-chart')) {
        window.chartService.createPieChart(
          'web-languages-chart',
          'Languages',
          languagesData.map(item => item.name),
          languagesData.map(item => item.value),
          null
        );
      }
      
      // Regions chart
      const regionsData = [
        { name: 'Northeast', value: 32 },
        { name: 'Southeast', value: 28 },
        { name: 'West', value: 22 },
        { name: 'Midwest', value: 15 },
        { name: 'International', value: 3 }
      ];
      
      if (document.getElementById('web-regions-chart')) {
        window.chartService.createPieChart(
          'web-regions-chart',
          'Regions',
          regionsData.map(item => item.name),
          regionsData.map(item => item.value),
          null
        );
      }
      
      // Traffic sources chart
      const trafficData = [
        { name: 'Organic Search', value: 42 },
        { name: 'Direct', value: 25 },
        { name: 'Social', value: 18 },
        { name: 'Referral', value: 10 },
        { name: 'Email', value: 5 }
      ];
      
      if (document.getElementById('traffic-sources-chart')) {
        window.chartService.createPieChart(
          'traffic-sources-chart',
          'Traffic Sources',
          trafficData.map(item => item.name),
          trafficData.map(item => item.value),
          null
        );
      }
    }
  };
  
  // Set timeout to simulate data loading
  setTimeout(updateWebDemographics, 1500);
}

/**
 * Set up Email links updates
 */
function setupEmailLinksUpdates() {
  // Function to update email links table
  const updateEmailLinks = () => {
    // In real implementation, this would fetch data from the data service
    if (window.tableService) {
      const linksData = [
        { name: 'Event Registration', clicks: 325, clickRate: 8.2, campaign: 'Event Invitation' },
        { name: 'Product Page', clicks: 287, clickRate: 6.5, campaign: 'Product Launch' },
        { name: 'Feedback Form', clicks: 210, clickRate: 2.7, campaign: 'Customer Survey' },
        { name: 'Special Offer', clicks: 198, clickRate: 3.0, campaign: 'Holiday Special' },
        { name: 'Blog Article', clicks: 177, clickRate: 3.4, campaign: 'Monthly Newsletter' }
      ];
      
      if (document.getElementById('best-links-table')) {
        window.tableService.createTable(
          'best-links-table',
          [
            { key: 'name', label: 'Link', type: 'text' },
            { key: 'clicks', label: 'Clicks', type: 'number' },
            { key: 'clickRate', label: 'Click Rate', type: 'percent' },
            { key: 'campaign', label: 'Campaign', type: 'text' }
          ],
          linksData
        );
      }
    }
  };
  
  // Set timeout to simulate data loading
  setTimeout(updateEmailLinks, 1500);
}
