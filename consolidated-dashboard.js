// Consolidated dashboard script - main entry point for dashboard functionality

// Ensure we run after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing dashboard...');
  
  // Create service instances
  window.chartService = createChartService();
  window.tableService = createTableService();
  window.kpiCards = createKpiCards();
  
  // Initialize date filter 
  window.dateFilter = createEnhancedDateFilter(function(dateRanges) {
    // This is the callback for date filter changes
    updateDashboard(dateRanges);
  });
  
  // Initialize file upload button
  setupFileUploadButton();
  
  // Start loading data
  initializeData();
  
  // Set up tab switching events for chart refreshing
  setupTabChangeEvents();
});

/**
 * Set up the file upload button 
 */
function setupFileUploadButton() {
  // Create a fixed position upload button
  const btn = document.createElement('button');
  btn.id = 'upload-button';
  btn.className = 'btn btn-primary position-fixed';
  btn.style.bottom = '20px'; 
  btn.style.right = '20px';
  btn.style.zIndex = '1000';
  btn.innerHTML = '<i class="bi bi-upload me-2"></i> Upload Files';
  
  document.body.appendChild(btn);
  
  // Event listener to show file upload modal
  btn.addEventListener('click', function() {
    // Check if modal exists
    let modal = document.getElementById('file-upload-modal');
    
    if (!modal) {
      // Create modal if it doesn't exist
      createFileUploadModal();
      modal = document.getElementById('file-upload-modal');
    }
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  });
}

/**
 * Create file upload modal
 */
function createFileUploadModal() {
  const modal = document.createElement('div');
  modal.id = 'file-upload-modal';
  modal.className = 'modal fade';
  modal.setAttribute('tabindex', '-1');
  modal.setAttribute('aria-labelledby', 'fileUploadLabel');
  modal.setAttribute('aria-hidden', 'true');
  
  modal.innerHTML = `
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="fileUploadLabel">Upload CSV Files</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="upload-area border rounded p-4 text-center mb-3" id="upload-dropzone">
            <i class="bi bi-cloud-arrow-up fs-1 text-muted mb-3 d-block"></i>
            <p>Drag and drop CSV files here, or <button class="btn btn-link p-0" id="browse-files">browse for files</button></p>
            <input type="file" id="file-input" multiple style="display: none" accept=".csv">
          </div>
          
          <h6>Uploaded Files</h6>
          <div class="uploaded-files-list p-3 border rounded bg-light" style="max-height: 300px; overflow-y: auto;">
            <div id="no-files-message" class="text-center text-muted py-4">
              <p>No files uploaded yet</p>
            </div>
            <ul id="uploaded-files" class="list-group list-group-flush">
              <!-- Files will be listed here -->
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <div class="form-check me-auto">
            <input class="form-check-input" type="checkbox" id="auto-load" checked>
            <label class="form-check-label" for="auto-load">
              Automatically load new data after upload
            </label>
          </div>
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" id="process-files" class="btn btn-primary">Update Dashboard</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Set up event handlers for the modal
  setupFileUploadHandlers();
}

/**
 * Set up handlers for file upload functionality
 */
function setupFileUploadHandlers() {
  // Store uploads
  window.uploadedFiles = window.uploadedFiles || {};
  
  // Get elements
  const dropzone = document.getElementById('upload-dropzone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('browse-files');
  const processBtn = document.getElementById('process-files');
  
  // Browse for files
  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', function(e) {
      e.preventDefault();
      fileInput.click();
    });
  }
  
  // Handle selected files
  if (fileInput) {
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        handleFiles(fileInput.files);
      }
    });
  }
  
  // Handle drag and drop
  if (dropzone) {
    // Prevent defaults
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight dropzone
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, function() {
        dropzone.classList.add('bg-light', 'border-primary');
      }, false);
    });
    
    // Remove highlight
    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, function() {
        dropzone.classList.remove('bg-light', 'border-primary');
      }, false);
    });
    
    // Handle dropped files
    dropzone.addEventListener('drop', function(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }, false);
  }
  
  // Process files button
  if (processBtn) {
    processBtn.addEventListener('click', function() {
      processFiles();
    });
  }
}

/**
 * Prevent default drag behavior
 */
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Handle the uploaded files
 */
function handleFiles(files) {
  const fileList = document.getElementById('uploaded-files');
  const noFilesMsg = document.getElementById('no-files-message');
  
  if (!fileList || !noFilesMsg) return;
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Check if it's a CSV
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      showMessage(`${file.name} is not a CSV file`, 'danger');
      continue;
    }
    
    // Save the file
    window.uploadedFiles[file.name] = file;
    
    // Hide "no files" message
    noFilesMsg.style.display = 'none';
    
    // Add to list
    const fileId = `file-${file.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
    let fileItem = document.getElementById(fileId);
    
    if (!fileItem) {
      fileItem = document.createElement('li');
      fileItem.id = fileId;
      fileItem.className = 'list-group-item d-flex justify-content-between align-items-center';
      
      const fileSize = formatFileSize(file.size);
      
      fileItem.innerHTML = `
        <div>
          <i class="bi bi-file-earmark-text text-primary me-2"></i>
          <span>${file.name}</span>
          <small class="text-muted ms-2">(${fileSize})</small>
        </div>
        <button class="btn btn-sm btn-outline-danger remove-file">
          <i class="bi bi-trash"></i>
        </button>
      `;
      
      fileList.appendChild(fileItem);
      
      // Handle remove button
      const removeBtn = fileItem.querySelector('.remove-file');
      if (removeBtn) {
        removeBtn.addEventListener('click', function() {
          delete window.uploadedFiles[file.name];
          fileItem.remove();
          
          // Show "no files" message if empty
          if (Object.keys(window.uploadedFiles).length === 0) {
            noFilesMsg.style.display = 'block';
          }
        });
      }
    }
  }
  
  // Auto process if checked
  const autoLoad = document.getElementById('auto-load');
  if (autoLoad && autoLoad.checked && files.length > 0) {
    processFiles();
  }
}

/**
 * Process uploaded files
 */
function processFiles() {
  if (!window.uploadedFiles || Object.keys(window.uploadedFiles).length === 0) {
    showMessage('No files to process', 'warning');
    return;
  }
  
  showMessage('Processing files...', 'info');
  showLoader();
  
  // In a real implementation, this would process the actual files
  // For this demo, we'll just simulate success
  setTimeout(function() {
    hideLoader();
    showMessage('Files processed successfully', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('file-upload-modal'));
    if (modal) {
      modal.hide();
    }
    
    // Reset date filter
    if (window.dateFilter) {
      window.dateFilter.render();
    }
    
    // Update dashboard
    initializeData();
  }, 1500);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Initialize dashboard data
 */
function initializeData() {
  console.log('Loading dashboard data...');
  showLoader();
  
  // Check if data service is available
  if (window.dataService) {
    dataService.loadAllData().then(function(result) {
      // Set available dates in the date filter
      if (window.dateFilter) {
        dateFilter.setAvailableDates(
          result.availableDates.earliestDate,
          result.availableDates.latestDate
        );
        
        // Render date filter
        dateFilter.render();
        
        // Update dashboard with current date filter
        updateDashboard(dateFilter.getCurrentDateFilter());
      } else {
        console.error('Date filter not initialized');
        updateDashboard({
          current: {
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate: new Date()
          },
          comparison: {
            enabled: false,
            startDate: null,
            endDate: null
          }
        });
      }
      
      // Update last updated timestamp
      updateLastUpdatedText();
      
      hideLoader();
    }).catch(function(error) {
      console.error('Error loading data:', error);
      showMessage('Error loading dashboard data', 'danger');
      hideLoader();
    });
  } else {
    console.error('Data service not initialized');
    showMessage('Dashboard data service not available', 'danger');
    hideLoader();
  }
}

/**
 * Update the dashboard with the selected date range
 */
function updateDashboard(dateRanges) {
  console.log('Updating dashboard with date ranges:', dateRanges);
  showLoader();
  
  try {
    // Update each tab with the new date range
    updateOverviewTab(dateRanges);
    updateWebAnalyticsTab(dateRanges);
    updateSocialMediaTabs(dateRanges);
    updateEmailTab(dateRanges);
    updateYouTubeTab(dateRanges);
    
    hideLoader();
  } catch (error) {
    console.error('Error updating dashboard:', error);
    showMessage('Error updating dashboard', 'danger');
    hideLoader();
  }
}

/**
 * Update the Overview tab
 */
function updateOverviewTab(dateRanges) {
  console.log('Updating Overview tab...');
  
  try {
    // Get data for each platform
    const emailData = window.dataService.analyzeEmailData(dateRanges);
    const fbData = window.dataService.analyzeFacebookData(dateRanges);
    const igData = window.dataService.analyzeInstagramData(dateRanges);
    const ytData = window.dataService.analyzeYoutubeData(dateRanges);
    
    // Create KPI cards
    if (window.kpiCards) {
      window.kpiCards.createKpiSection('overview-metrics-row', null, [
        {
          title: 'Email Subscribers',
          currentValue: emailData.metrics?.subscribers || 0,
          comparisonValue: emailData.metrics?.subscribersComparison || null,
          type: 'number'
        },
        {
          title: 'Facebook Reach',
          currentValue: fbData.pageRankMetrics?.reach || 0,
          comparisonValue: fbData.pageRankMetrics?.reachChange ? null : null,
          type: 'number'
        },
        {
          title: 'Instagram Engagement',
          currentValue: igData.pageRankMetrics?.engagement || 0,
          comparisonValue: igData.pageRankMetrics?.engagementChange ? null : null,
          type: 'percent'
        },
        {
          title: 'YouTube Views',
          currentValue: ytData.pageRank?.views || 0,
          type: 'number'
        }
      ]);
    }
    
    // Create channel traffic comparison chart
    if (window.chartService && document.getElementById('channel-traffic-chart')) {
      window.chartService.createBarChart(
        'channel-traffic-chart',
        'Channel Traffic Comparison',
        ['Email Opens', 'Facebook Reach', 'Instagram Reach', 'YouTube Views'],
        [
          emailData.metrics?.opens || 0,
          fbData.pageRankMetrics?.reach || 0,
          igData.pageRankMetrics?.reach || 0,
          ytData.pageRank?.views || 0
        ],
        null,
        {
          current: '#4299e1',
          currentBorder: '#3182ce'
        }
      );
    }
    
    // Create engagement chart
    if (window.chartService && document.getElementById('engagement-chart')) {
      window.chartService.createBarChart(
        'engagement-chart',
        'Engagement by Platform',
        ['Email', 'Facebook', 'Instagram', 'YouTube'],
        [
          emailData.topCampaigns.length > 0 ? 
            emailData.topCampaigns.reduce((sum, campaign) => sum + campaign.clickRate, 0) / emailData.topCampaigns.length : 0,
          fbData.pageRankMetrics?.engagement || 0,
          igData.pageRankMetrics?.engagement || 0,
          ytData.pageRank?.engagement || 0
        ],
        null,
        {
          current: '#9f7aea',
          currentBorder: '#805ad5'
        },
        'Engagement Rate (%)'
      );
    }
    
  } catch (error) {
    console.error('Error updating Overview tab:', error);
  }
}

/**
 * Update the Web Analytics tab
 */
function updateWebAnalyticsTab(dateRanges) {
  console.log('Updating Web Analytics tab...');
  
  try {
    // Get web demographics data
    const demographics = window.dataService.analyzeWebDemographics(dateRanges);
    
    // Update countries chart
    if (window.chartService && document.getElementById('web-countries-chart')) {
      window.chartService.createPieChart(
        'web-countries-chart',
        'Top Countries',
        demographics.countries.map(item => item.name),
        demographics.countries.map(item => item.value)
      );
    }
    
    // Update languages chart
    if (window.chartService && document.getElementById('web-languages-chart')) {
      window.chartService.createPieChart(
        'web-languages-chart',
        'Languages',
        demographics.languages.map(item => item.name),
        demographics.languages.map(item => item.value)
      );
    }
    
    // Update regions chart
    if (window.chartService && document.getElementById('web-regions-chart')) {
      window.chartService.createPieChart(
        'web-regions-chart',
        'Regions',
        demographics.regions.map(item => item.name),
        demographics.regions.map(item => item.value)
      );
    }
    
    // Update traffic sources chart
    if (window.chartService && document.getElementById('traffic-sources-chart')) {
      window.chartService.createPieChart(
        'traffic-sources-chart',
        'Traffic Sources',
        ['Organic Search', 'Direct', 'Social', 'Referral', 'Email'],
        [42, 25, 18, 10, 5]
      );
    }
    
    // Get landing pages data
    const landingPages = window.dataService.analyzeTopLandingPages(dateRanges);
    
    // Update landing pages table
    if (window.tableService && document.getElementById('top-pages-table')) {
      window.tableService.createLandingPagesTable('top-pages-table', landingPages);
    }
    
    // Get campaign data
    window.dataService.analyzeUTMCampaigns(dateRanges).then(function(campaignData) {
      // Update campaigns chart
      if (window.chartService && document.getElementById('campaigns-chart')) {
        window.chartService.createBarChart(
          'campaigns-chart',
          'Top Campaigns by Sessions',
          campaignData.campaigns.slice(0, 5).map(item => item.name),
          campaignData.campaigns.slice(0, 5).map(item => item.sessions)
        );
      }
      
      // Update platforms chart
      if (window.chartService && document.getElementById('campaign-platforms-chart')) {
        window.chartService.createPieChart(
          'campaign-platforms-chart',
          'Sessions by Platform',
          campaignData.platforms.map(item => item.name),
          campaignData.platforms.map(item => item.sessions)
        );
      }
      
      // Update campaigns table
      if (window.tableService && document.getElementById('campaigns-table')) {
        window.tableService.createTable(
          'campaigns-table',
          [
            { key: 'name', label: 'Campaign', type: 'text' },
            { key: 'sessions', label: 'Sessions', type: 'number' },
            { key: 'engagementRate', label: 'Engagement Rate', type: 'percent' },
            { key: 'comparisonSessions', label: 'Change', type: 'percent', 
              format: function(value, row) {
                if (!value || !row.sessions) return '--';
                const change = ((row.sessions - value) / value) * 100;
                const prefix = change >= 0 ? '↑' : '↓';
                return `${prefix} ${Math.abs(change).toFixed(1)}%`;
              }
            }
          ],
          campaignData.campaigns
        );
      }
    }).catch(function(error) {
      console.error('Error analyzing UTM campaigns:', error);
    });
    
  } catch (error) {
    console.error('Error updating Web Analytics tab:', error);
  }
}

/**
 * Update Social Media tabs (Facebook & Instagram)
 */
function updateSocialMediaTabs(dateRanges) {
  // Update Facebook tab
  updateFacebookTab(dateRanges);
  
  // Update Instagram tab
  updateInstagramTab(dateRanges);
}

/**
 * Update Facebook tab
 */
function updateFacebookTab(dateRanges) {
  console.log('Updating Facebook tab...');
  
  try {
    // Get Facebook data
    window.dataService.analyzeFacebookData(dateRanges).then(function(fbData) {
      // Update KPI cards
      if (window.kpiCards) {
        // First create a metrics row if it doesn't exist
        let metricsRow = document.querySelector('#facebook .row:first-child');
        if (!metricsRow) {
          const section = document.createElement('div');
          section.className = 'dashboard-section facebook-section mb-4';
          section.innerHTML = '<h3 class="h5 mb-3">Facebook Page Metrics</h3><div id="facebook-metrics-row" class="row"></div>';
          document.getElementById('facebook').prepend(section);
          metricsRow = section.querySelector('#facebook-metrics-row');
        }
        
        // Create KPI cards
        window.kpiCards.createKpiSection(metricsRow.id || 'facebook-metrics-row', null, [
          {
            title: 'Page Engagement',
            currentValue: fbData.pageRankMetrics?.engagement || 0,
            comparisonValue: fbData.pageRankMetrics?.engagementChange || null,
            type: 'percent'
          },
          {
            title: 'Total Followers',
            currentValue: fbData.pageRankMetrics?.followers || 0,
            comparisonValue: fbData.pageRankMetrics?.followersChange || null,
            type: 'number'
          },
          {
            title: 'Profile Views',
            currentValue: fbData.pageRankMetrics?.visits || 0,
            comparisonValue: fbData.pageRankMetrics?.visitsChange || null,
            type: 'number'
          },
          {
            title: 'Total Reach',
            currentValue: fbData.pageRankMetrics?.reach || 0,
            comparisonValue: fbData.pageRankMetrics?.reachChange || null,
            type: 'number'
          }
        ]);
      }
      
      // Update demographics chart
      if (window.chartService && document.getElementById('fb-demographics-chart')) {
        window.chartService.createBarChart(
          'fb-demographics-chart',
          'Facebook Audience Demographics',
          fbData.demographics.map(item => item.name),
          fbData.demographics.map(item => item.value),
          null,
          {
            current: '#4c51bf',
            currentBorder: '#434190'
          },
          'Percentage (%)'
        );
      }
      
      // Update follower growth chart
      if (window.chartService && document.getElementById('fb-followers-chart') && fbData.followerGrowth) {
        window.chartService.createLineChart(
          'fb-followers-chart',
          'Facebook Follower Growth',
          fbData.followerGrowth.map(item => item.date),
          [{
            label: 'Followers',
            data: fbData.followerGrowth.map(item => item.followers),
            borderColor: '#4c51bf',
            backgroundColor: 'rgba(76, 81, 191, 0.1)'
          }]
        );
      }
      
      // Update videos table
      if (window.tableService && document.getElementById('fb-videos-table')) {
        window.tableService.createFBVideosTable('fb-videos-table', fbData.topVideos || []);
      }
      
      // Update top posts (most reach, liked, commented, shared)
      updateFacebookTopPosts(fbData);
    });
  } catch (error) {
    console.error('Error updating Facebook tab:', error);
  }
}

/**
 * Update Facebook top posts
 */
function updateFacebookTopPosts(fbData) {
  if (!fbData.topVideos || fbData.topVideos.length === 0) return;
  
  try {
    // Sort videos by different metrics
    const topByReach = [...fbData.topVideos].sort((a, b) => b.views - a.views)[0];
    const topByLikes = [...fbData.topVideos].sort((a, b) => b.reactions - a.reactions)[0];
    const topByComments = [...fbData.topVideos].sort((a, b) => b.comments - a.comments)[0];
    const topByShares = [...fbData.topVideos].sort((a, b) => b.shares - a.shares)[0];
    
    // Update the DOM elements
    if (document.getElementById('fb-most-reach')) {
      document.getElementById('fb-most-reach').innerHTML = `
        <strong>${topByReach.title}</strong><br>
        Reach: ${formatNumber(topByReach.views)}
      `;
    }
    
    if (document.getElementById('fb-most-liked')) {
      document.getElementById('fb-most-liked').innerHTML = `
        <strong>${topByLikes.title}</strong><br>
        Likes: ${formatNumber(topByLikes.reactions)}
      `;
    }
    
    if (document.getElementById('fb-most-commented')) {
      document.getElementById('fb-most-commented').innerHTML = `
        <strong>${topByComments.title}</strong><br>
        Comments: ${formatNumber(topByComments.comments)}
      `;
    }
    
    if (document.getElementById('fb-most-shared')) {
      document.getElementById('fb-most-shared').innerHTML = `
        <strong>${topByShares.title}</strong><br>
        Shares: ${formatNumber(topByShares.shares)}
      `;
    }
  } catch (error) {
    console.error('Error updating Facebook top posts:', error);
  }
}

/**
 * Update Instagram tab 
 */
function updateInstagramTab(dateRanges) {
  console.log('Updating Instagram tab...');
  
  try {
    // Get Instagram data
    window.dataService.analyzeInstagramData(dateRanges).then(function(igData) {
      // Update KPI cards
      if (window.kpiCards) {
        // First create a metrics row if it doesn't exist
        let metricsRow = document.querySelector('#instagram .row:first-child');
        if (!metricsRow) {
          const section = document.createElement('div');
          section.className = 'dashboard-section instagram-section mb-4';
          section.innerHTML = '<h3 class="h5 mb-3">Instagram Page Metrics</h3><div id="instagram-metrics-row" class="row"></div>';
          document.getElementById('instagram').prepend(section);
          metricsRow = section.querySelector('#instagram-metrics-row');
        }
        
        // Create KPI cards
        window.kpiCards.createKpiSection(metricsRow.id || 'instagram-metrics-row', null, [
          {
            title: 'Page Engagement',
            currentValue: igData.pageRankMetrics?.engagement || 0,
            comparisonValue: igData.pageRankMetrics?.engagementChange || null,
            type: 'percent'
          },
          {
            title: 'Total Followers',
            currentValue: igData.pageRankMetrics?.followers || 0,
            comparisonValue: igData.pageRankMetrics?.followersChange || null,
            type: 'number'
          },
          {
            title: 'Profile Views',
            currentValue: igData.pageRankMetrics?.visits || 0,
            comparisonValue: igData.pageRankMetrics?.visitsChange || null,
            type: 'number'
          },
          {
            title: 'Total Reach',
            currentValue: igData.pageRankMetrics?.reach || 0,
            comparisonValue: igData.pageRankMetrics?.reachChange || null,
            type: 'number'
          }
        ]);
      }
      
      // Update engagement chart
      if (window.chartService && document.getElementById('ig-demographics-chart')) {
        window.chartService.createPieChart(
          'ig-demographics-chart',
          'Instagram Engagement Distribution',
          igData.engagement.map(item => item.name),
          igData.engagement.map(item => item.value)
        );
      }
      
      // Update follower growth chart
      if (window.chartService && document.getElementById('ig-followers-chart') && igData.followerGrowth) {
        window.chartService.createLineChart(
          'ig-followers-chart',
          'Instagram Follower Growth',
          igData.followerGrowth.map(item => item.date),
          [{
            label: 'Followers',
            data: igData.followerGrowth.map(item => item.followers),
            borderColor: '#ed64a6',
            backgroundColor: 'rgba(237, 100, 166, 0.1)'
          }]
        );
      }
      
      // Update posts table
      if (window.tableService && document.getElementById('top-ig-posts-table')) {
        window.tableService.createIGPostsTable('top-ig-posts-table', igData.topPosts || []);
      }
      
      // Update top posts (most reach, liked, commented, shared, saved)
      updateInstagramTopPosts(igData);
    });
  } catch (error) {
    console.error('Error updating Instagram tab:', error);
  }
}

/**
 * Update Instagram top posts
 */
function updateInstagramTopPosts(igData) {
  if (!igData.topPosts || igData.topPosts.length === 0) return;
  
  try {
    // Sort posts by different metrics
    const topByReach = [...igData.topPosts].sort((a, b) => b.reach - a.reach)[0];
    const topByLikes = [...igData.topPosts].sort((a, b) => b.likes - a.likes)[0];
    const topByComments = [...igData.topPosts].sort((a, b) => b.comments - a.comments)[0];
    const topByShares = [...igData.topPosts].sort((a, b) => b.shares - a.shares)[0];
    const topBySaves = [...igData.topPosts].sort((a, b) => b.saves - a.saves)[0];
    
    // Update the DOM elements
    if (document.getElementById('ig-most-reach')) {
      document.getElementById('ig-most-reach').innerHTML = `
        <strong>${shortenText(topByReach.description, 30)}</strong><br>
        Reach: ${formatNumber(topByReach.reach)}
      `;
    }
    
    if (document.getElementById('ig-most-liked')) {
      document.getElementById('ig-most-liked').innerHTML = `
        <strong>${shortenText(topByLikes.description, 30)}</strong><br>
        Likes: ${formatNumber(topByLikes.likes)}
      `;
    }
    
    if (document.getElementById('ig-most-commented')) {
      document.getElementById('ig-most-commented').innerHTML = `
        <strong>${shortenText(topByComments.description, 30)}</strong><br>
        Comments: ${formatNumber(topByComments.comments)}
      `;
    }
    
    if (document.getElementById('ig-most-shared')) {
      document.getElementById('ig-most-shared').innerHTML = `
        <strong>${shortenText(topByShares.description, 30)}</strong><br>
        Shares: ${formatNumber(topByShares.shares)}
      `;
    }
    
    if (document.getElementById('ig-most-saved')) {
      document.getElementById('ig-most-saved').innerHTML = `
        <strong>${shortenText(topBySaves.description, 30)}</strong><br>
        Saves: ${formatNumber(topBySaves.saves)}
      `;
    }
  } catch (error) {
    console.error('Error updating Instagram top posts:', error);
  }
}

/**
 * Update Email tab
 */
function updateEmailTab(dateRanges) {
  console.log('Updating Email tab...');
  
  try {
    // Get email data
    const emailData = window.dataService.analyzeEmailData(dateRanges);
    
    // Create KPI cards container if it doesn't exist
    if (window.kpiCards) {
      let kpiContainer = document.querySelector('#email .kpi-container');
      if (!kpiContainer) {
        kpiContainer = document.createElement('div');
        kpiContainer.className = 'row mb-4 kpi-container';
        kpiContainer.id = 'email-kpi-container';
        document.getElementById('email').prepend(kpiContainer);
      }
      
      // Create KPI cards
      window.kpiCards.createKpiSection('email-kpi-container', null, [
        {
          title: 'Subscribers',
          currentValue: emailData.metrics?.subscribers || 0,
          comparisonValue: emailData.metrics?.subscribersComparison || null,
          type: 'number'
        },
        {
          title: 'Avg. Open Rate',
          currentValue: emailData.topCampaigns.length > 0 ? 
            emailData.topCampaigns.reduce((sum, c) => sum + c.openRate, 0) / emailData.topCampaigns.length : 0,
          type: 'percent'
        },
        {
          title: 'Avg. Click Rate',
          currentValue: emailData.topCampaigns.length > 0 ? 
            emailData.topCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / emailData.topCampaigns.length : 0,
          type: 'percent'
        }
      ]);
    }
    
    // Create email performance chart
    if (window.chartService && document.getElementById('email-performance-chart')) {
      const campaigns = emailData.topCampaigns.slice(0, 5);
      window.chartService.createBarChart(
        'email-performance-chart',
        'Email Campaign Performance',
        campaigns.map(c => c.name),
        campaigns.map(c => c.openRate),
        campaigns.map(c => c.clickRate),
        {
          current: '#4299e1',
          currentBorder: '#3182ce',
          comparison: '#9f7aea',
          comparisonBorder: '#805ad5'
        },
        'Rate (%)'
      );
    }
    
    // Create email engagement chart
    if (window.chartService && document.getElementById('email-engagement-chart')) {
      window.chartService.createPieChart(
        'email-engagement-chart',
        'Email Engagement Segmentation',
        ['Not Opened', 'Opened (No Click)', 'Clicked'],
        [
          emailData.engagement.notOpened || 0,
          emailData.engagement.openedNotClicked || 0,
          emailData.engagement.clicked || 0
        ],
        ['#fc8181', '#f6ad55', '#68d391']
      );
    }
    
    // Add demographics section if it doesn't exist
    const demographicsSection = document.getElementById('email-demographics-section');
    if (!demographicsSection && emailData.subscriberDemographics) {
      // Create the demographics section
      const section = document.createElement('div');
      section.id = 'email-demographics-section';
      section.className = 'row mb-4';
      section.innerHTML = `
        <div class="col-md-12">
          <div class="dashboard-section email-section">
            <h3 class="h5 mb-3">Subscriber Demographics</h3>
            <div class="row">
              <div class="col-md-4">
                <div class="chart-container">
                  <canvas id="email-age-chart"></canvas>
                </div>
              </div>
              <div class="col-md-4">
                <div class="chart-container">
                  <canvas id="email-gender-chart"></canvas>
                </div>
              </div>
              <div class="col-md-4">
                <div class="chart-container">
                  <canvas id="email-location-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Insert after the KPI section or at the beginning
      const kpiContainer = document.querySelector('#email .kpi-container');
      if (kpiContainer) {
        kpiContainer.after(section);
      } else {
        document.getElementById('email').prepend(section);
      }
      
      // Create the charts now that the elements exist
      if (window.chartService && emailData.subscriberDemographics) {
        // Age chart
        window.chartService.createPieChart(
          'email-age-chart',
          'Subscribers by Age',
          emailData.subscriberDemographics.ageGroups.map(g => g.name),
          emailData.subscriberDemographics.ageGroups.map(g => g.percentage)
        );
        
        // Gender chart
        window.chartService.createPieChart(
          'email-gender-chart',
          'Subscribers by Gender',
          emailData.subscriberDemographics.genderBreakdown.map(g => g.name),
          emailData.subscriberDemographics.genderBreakdown.map(g => g.percentage),
          ['#4c51bf', '#ed64a6', '#ecc94b']
        );
        
        // Location chart
        window.chartService.createPieChart(
          'email-location-chart',
          'Subscribers by Location',
          emailData.subscriberDemographics.locations.map(l => l.name),
          emailData.subscriberDemographics.locations.map(l => l.percentage)
        );
      }
    }
    
    // Update best links table
    if (window.tableService && document.getElementById('best-links-table')) {
      window.tableService.createTable(
        'best-links-table',
        [
          { key: 'name', label: 'Link', type: 'text' },
          { key: 'clicks', label: 'Clicks', type: 'number' },
          { key: 'clickRate', label: 'Click Rate', type: 'percent' },
          { key: 'campaign', label: 'Campaign', type: 'text' }
        ],
        [
          { name: 'Event Registration', clicks: 325, clickRate: 8.2, campaign: 'Event Invitation' },
          { name: 'Product Page', clicks: 287, clickRate: 6.5, campaign: 'Product Launch' },
          { name: 'Feedback Form', clicks: 210, clickRate: 2.7, campaign: 'Customer Survey' },
          { name: 'Special Offer', clicks: 198, clickRate: 3.0, campaign: 'Holiday Special' },
          { name: 'Blog Article', clicks: 177, clickRate: 3.4, campaign: 'Monthly Newsletter' }
        ]
      );
    }
    
    // Update email campaigns table
    if (window.tableService && document.getElementById('top-email-campaigns-table')) {
      window.tableService.createEmailCampaignsTable('top-email-campaigns-table', emailData.topCampaigns);
    }
    
  } catch (error) {
    console.error('Error updating Email tab:', error);
  }
}

/**
 * Update YouTube tab
 */
function updateYouTubeTab(dateRanges) {
  console.log('Updating YouTube tab...');
  
  try {
    // Get YouTube data
    const ytData = window.dataService.analyzeYoutubeData(dateRanges);
    
    // Extract subscribership data
    const subscribedData = ytData.subscriptionData.find(item => 
      item.status.toLowerCase().includes('subscribed'));
    
    const nonSubscribedData = ytData.subscriptionData.find(item => 
      !item.status.toLowerCase().includes('subscribed'));
    
    // Create KPI cards
    if (window.kpiCards) {
      window.kpiCards.createKpiSection('youtube-metrics-row', null, [
        {
          title: 'Subscribers',
          currentValue: ytData.pageRank?.followers || 0,
          type: 'number'
        },
        {
          title: 'Total Views',
          currentValue: ytData.subscriptionData.reduce((sum, item) => sum + (item.views || 0), 0),
          type: 'number'
        },
        {
          title: 'Subscribed Views',
          currentValue: subscribedData?.percentage || 0,
          type: 'percent'
        },
        {
          title: 'Non-Subscribed Views',
          currentValue: nonSubscribedData?.percentage || 0,
          type: 'percent'
        }
      ]);
    }
    
    // Create subscriber vs. non-subscriber chart
    if (window.chartService && document.getElementById('youtube-subscriber-chart')) {
      window.chartService.createDoughnutChart(
        'youtube-subscriber-chart',
        'Subscriber vs. Non-Subscriber Views',
        ytData.subscriptionData.map(item => item.status || 'Unknown'),
        ytData.subscriptionData.map(item => item.views || 0),
        ['#48bb78', '#4299e1']
      );
    }
    
    // Create age demographics chart
    if (window.chartService && document.getElementById('youtube-age-chart')) {
      window.chartService.createBarChart(
        'youtube-age-chart',
        'YouTube Age Demographics',
        ytData.ageData.map(item => item.age || 'Unknown'),
        ytData.ageData.map(item => item.views || 0),
        null,
        {
          current: '#4c51bf',
          currentBorder: '#434190'
        },
        'Percentage (%)'
      );
    }
    
    // Create gender demographics chart
    if (window.chartService && document.getElementById('youtube-gender-chart')) {
      window.chartService.createPieChart(
        'youtube-gender-chart',
        'YouTube Gender Demographics',
        ytData.genderData.map(item => item.gender || 'Unknown'),
        ytData.genderData.map(item => item.views || 0),
        ['#4c51bf', '#ed64a6', '#ecc94b']
      );
    }
    
    // Create geography chart
    if (window.chartService && document.getElementById('youtube-geography-chart')) {
      window.chartService.createHorizontalBarChart(
        'youtube-geography-chart',
        'Top Countries by Views',
        ytData.topCountries.slice(0, 10).map(item => item.country || 'Unknown'),
        ytData.topCountries.slice(0, 10).map(item => item.views || 0),
        null,
        {
          current: '#4c51bf',
          currentBorder: '#434190'
        },
        'Views'
      );
    }
    
    // Create videos table
    if (window.tableService && document.getElementById('youtube-videos-table')) {
      window.tableService.createTable(
        'youtube-videos-table',
        [
          { key: 'title', label: 'Video Title', type: 'text' },
          { key: 'views', label: 'Views', type: 'number' },
          { key: 'likes', label: 'Likes', type: 'number' },
          { key: 'comments', label: 'Comments', type: 'number' },
          { key: 'shares', label: 'Shares', type: 'number' }
        ],
        ytData.topVideos || []
      );
    }
    
  } catch (error) {
    console.error('Error updating YouTube tab:', error);
  }
}

/**
 * Set up tab change events to refresh charts
 */
function setupTabChangeEvents() {
  // Listen for tab changes
  const tabLinks = document.querySelectorAll('button[data-bs-toggle="tab"]');
  for (let i = 0; i < tabLinks.length; i++) {
    tabLinks[i].addEventListener('shown.bs.tab', function(e) {
      // Get the activated tab
      const targetId = e.target.getAttribute('data-bs-target').substring(1);
      
      // Refresh charts in the tab
      refreshChartsInContainer(targetId);
    });
  }
  
  // Listen for social media tab changes
  const socialTabLinks = document.querySelectorAll('#socialTabs button[data-bs-toggle="pill"]');
  for (let i = 0; i < socialTabLinks.length; i++) {
    socialTabLinks[i].addEventListener('shown.bs.tab', function(e) {
      // Get the activated tab
      const targetId = e.target.getAttribute('data-bs-target').substring(1);
      
      // Refresh charts in the tab
      refreshChartsInContainer(targetId);
    });
  }
}

/**
 * Refresh all charts in a container
 */
function refreshChartsInContainer(containerId) {
  // Skip if we don't have the chart service or container
  if (!window.chartInstances || !document.getElementById(containerId)) return;
  
  // Find all canvas elements in the container
  const canvases = document.getElementById(containerId).querySelectorAll('canvas');
  
  // Update each chart
  for (let i = 0; i < canvases.length; i++) {
    const canvas = canvases[i];
    if (window.chartInstances[canvas.id]) {
      try {
        window.chartInstances[canvas.id].update();
      } catch (error) {
        console.warn(`Error updating chart ${canvas.id}:`, error);
      }
    }
  }
}

/**
 * Show loading indicator
 */
function showLoader() {
  // Create loader if it doesn't exist
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.className = 'position-fixed top-0 left-0 w-100 h-100 d-flex justify-content-center align-items-center';
    loader.style.backgroundColor = 'rgba(0,0,0,0.3)';
    loader.style.zIndex = '9999';
    
    // Add spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner-border text-light';
    spinner.setAttribute('role', 'status');
    spinner.innerHTML = '<span class="visually-hidden">Loading...</span>';
    
    loader.appendChild(spinner);
    document.body.appendChild(loader);
  }
  
  loader.style.display = 'flex';
}

/**
 * Hide loading indicator
 */
function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

/**
 * Show a message toast
 */
function showMessage(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1050';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Set content based on type
  toast.innerHTML = `
    <div class="toast-header ${type === 'danger' ? 'bg-danger text-white' : ''}">
      <strong class="me-auto">Dashboard</strong>
      <small>Just now</small>
      <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body ${type === 'danger' ? 'bg-danger text-white' : ''}">
      ${message}
    </div>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Initialize toast
  const bootstrapToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: 5000
  });
  
  // Show toast
  bootstrapToast.show();
  
  // Remove when hidden
  toast.addEventListener('hidden.bs.toast', function() {
    toast.remove();
  });
}

/**
 * Update the "last updated" text
 */
function updateLastUpdatedText() {
  const lastUpdatedElement = document.getElementById('last-updated');
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = new Date().toLocaleString();
  }
}

/**
 * Format a number for display
 */
function formatNumber(num, type = 'number') {
  if (num === undefined || num === null || isNaN(num)) return '--';
  
  if (type === 'percent') {
    return num.toFixed(1) + '%';
  } else if (type === 'duration') {
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
}

/**
 * Shorten text to a specific length and add ellipsis
 */
function shortenText(text, maxLength = 30) {
  if (!text) return 'Untitled';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Public API for the dashboard
window.dashboardApi = {
  reloadData: function() {
    initializeData();
  },
  updateDashboard: function(dateRanges) {
    updateDashboard(dateRanges);
  }
};
