// Marketing Analytics Dashboard
document.addEventListener('DOMContentLoaded', () => {
  // State tracking
  let isLoading = true;
  let emailData = null;
  let fbVideosData = null;
  let igPostsData = null;
  let youtubeAgeData = null;
  let youtubeGenderData = null;
  let youtubeGeographyData = null;
  let youtubeSubscriptionData = null;
  let dataErrors = {};
  
  // Chart instances tracker - key component for fixing canvas reuse issues
  const chartInstances = {};
  
  // Date filter state
  let dateRange = {
    startDate: null,
    endDate: null
  };
  
  let availableDates = {
    earliestDate: null,
    latestDate: null
  };
  
  // DOM elements
  const lastUpdatedElement = document.getElementById('last-updated');
  
  // Helper function to safely create a chart
  const createChart = (canvasId, config) => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas with ID ${canvasId} not found`);
      return null;
    }
    
    // Clear any existing chart - CRITICAL FIX
    if (chartInstances[canvasId]) {
      console.log(`Destroying existing chart in ${canvasId}`);
      chartInstances[canvasId].destroy();
      delete chartInstances[canvasId]; // Proper cleanup
    }
    
    try {
      // Get the 2D context for the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn(`Could not get 2D context for canvas ${canvasId}`);
        return null;
      }
      
      // Create a new chart
      chartInstances[canvasId] = new Chart(ctx, config);
      return chartInstances[canvasId];
    } catch (error) {
      console.error(`Error creating chart on ${canvasId}:`, error);
      // Clean up the canvas if chart creation failed
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText(`Error creating chart: ${error.message}`, canvas.width / 2, canvas.height / 2);
      }
      return null;
    }
  };
  
  // Helper function to safely clear a chart if it exists
  const clearChart = (canvasId) => {
    if (chartInstances[canvasId]) {
      console.log(`Destroying chart in ${canvasId}`);
      chartInstances[canvasId].destroy();
      delete chartInstances[canvasId];
    }
    
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  // Create date filter container safely
  const dateFilterContainer = document.createElement('div');
  dateFilterContainer.className = 'dashboard-section mb-4';
  dateFilterContainer.id = 'date-filter-container';
  
  // Safely insert the date filter container
  function insertDateFilter() {
    const container = document.querySelector('.container');
    if (!container) return; // No container found
    
    // Try to insert before tabs
    const tabsRow = document.querySelector('#dashboardTabs');
    if (tabsRow) {
      const tabParent = tabsRow.closest('.row');
      if (tabParent && tabParent.parentNode === container) {
        container.insertBefore(dateFilterContainer, tabParent);
        return;
      }
    }
    
    // If we couldn't find tabs, try to insert as first child of container
    if (container.firstChild) {
      container.insertBefore(dateFilterContainer, container.firstChild);
    } else {
      container.appendChild(dateFilterContainer);
    }
  }

  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return '--';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Parse dates from different formats
  const parseDate = (dateString) => {
    if (!dateString) return null;
    
    // Try different date formats
    const formats = [
      // ISO format
      (str) => new Date(str),
      // MM/DD/YYYY
      (str) => {
        const parts = str.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        return null;
      },
      // DD/MM/YYYY
      (str) => {
        const parts = str.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return null;
      },
      // YYYY-MM-DD
      (str) => {
        const parts = str.split('-');
        if (parts.length === 3) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return null;
      }
    ];
    
    for (const format of formats) {
      const date = format(dateString);
      if (date && !isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  };
  
  // Format dates for display
  const formatDateForDisplay = (date) => {
    if (!date) return '';
    try {
      return date.toLocaleDateString();
    } catch (e) {
      return '';
    }
  };
  
  // Format date for input fields
  const formatDateForInput = (date) => {
    if (!date) return '';
    try {
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };
  
  // Apply date filters to data
  const applyDateFilter = (data, dateField) => {
    if (!data || !dateRange.startDate || !dateRange.endDate) return data;
    
    return data.filter(item => {
      let itemDate;
      if (item[dateField]) {
        itemDate = parseDate(item[dateField]);
      } else if (item['Publish time']) {
        itemDate = parseDate(item['Publish time']);
      } else if (item['Date']) {
        itemDate = parseDate(item['Date']);
      }
      
      if (!itemDate) return false;
      
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  };
  
  // Create date filter UI
  const renderDateFilter = () => {
    if (isLoading) return;
    
    // Check if dateFilterContainer is in the DOM
    if (!document.getElementById('date-filter-container')) {
      insertDateFilter();
    }
    
    const filterContainer = document.getElementById('date-filter-container');
    if (!filterContainer) {
      console.warn('Date filter container not found in the DOM');
      return;
    }
    
    filterContainer.innerHTML = `
      <h3 class="h5 mb-3">Date Range Filter</h3>
      <div class="date-filter-controls">
        <div class="row align-items-end mb-3">
          <div class="col-md-3">
            <label class="form-label">Start Date</label>
            <input 
              type="date" 
              id="start-date-input" 
              class="form-control" 
              value="${formatDateForInput(dateRange.startDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">End Date</label>
            <input 
              type="date" 
              id="end-date-input" 
              class="form-control" 
              value="${formatDateForInput(dateRange.endDate)}"
              min="${formatDateForInput(availableDates.earliestDate)}"
              max="${formatDateForInput(availableDates.latestDate)}"
            >
          </div>
          <div class="col-md-3">
            <button id="clear-date-filter" class="btn btn-secondary">Clear Filter</button>
          </div>
          ${dateRange.startDate && dateRange.endDate ? `
            <div class="col-md-3">
              <div class="alert alert-info mb-0 py-2">
                Showing data: ${formatDateForDisplay(dateRange.startDate)} - ${formatDateForDisplay(dateRange.endDate)}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    // Add event listeners
    const startDateInput = document.getElementById('start-date-input');
    const endDateInput = document.getElementById('end-date-input');
    const clearFilterBtn = document.getElementById('clear-date-filter');
    
    if (startDateInput) {
      startDateInput.addEventListener('change', (e) => {
        dateRange.startDate = e.target.value ? new Date(e.target.value) : null;
        updateDashboard();
      });
    }
    
    if (endDateInput) {
      endDateInput.addEventListener('change', (e) => {
        dateRange.endDate = e.target.value ? new Date(e.target.value) : null;
        updateDashboard();
      });
    }
    
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        dateRange.startDate = null;
        dateRange.endDate = null;
        renderDateFilter();
        updateDashboard();
      });
    }
  };
  
  // Load CSV files
  const loadCSVData = async () => {
    isLoading = true;
    updateLoadingState();
    dataErrors = {};
    let allDates = [];
    
    console.log('Loading CSV data...');
    
    // Function to load and parse a CSV file
    const loadCSVFile = (filename) => {
      return new Promise((resolve, reject) => {
        console.log(`Attempting to load ${filename}...`);
        
        try {
          // Use the filename directly for relative path loading
          Papa.parse(filename, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              console.log(`Successfully loaded ${filename}, found ${results.data.length} rows`);
              
              // Extract dates if available
              if (results.data.length > 0 && (results.data[0].Date || results.data[0]['Publish time'])) {
                const dates = results.data
                  .map(item => parseDate(item.Date || item['Publish time']))
                  .filter(date => date !== null);
                
                if (dates.length > 0) {
                  console.log(`Found ${dates.length} valid dates in ${filename}`);
                  allDates = [...allDates, ...dates];
                }
              }
              resolve(results.data);
            },
            error: (error) => {
              console.error(`Error parsing ${filename}:`, error);
              dataErrors[filename] = `Error parsing: ${error.message}`;
              reject(error);
            }
          });
        } catch (error) {
          console.error(`Exception loading ${filename}:`, error);
          dataErrors[filename] = `Error loading: ${error.message}`;
          reject(error);
        }
      });
    };
    
    
    try {
      // Load all required CSV files
      console.log('Starting to load all CSV files...');
      
      try {
        console.log('Loading Email_Campaign_Performance.csv');
        emailData = await loadCSVFile('Email_Campaign_Performance.csv');
      } catch (error) {
        console.error('Failed to load Email_Campaign_Performance.csv:', error);
        dataErrors['Email_Campaign_Performance.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading FB_Videos.csv');
        fbVideosData = await loadCSVFile('FB_Videos.csv');
      } catch (error) {
        console.error('Failed to load FB_Videos.csv:', error);
        dataErrors['FB_Videos.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading IG_Posts.csv');
        igPostsData = await loadCSVFile('IG_Posts.csv');
      } catch (error) {
        console.error('Failed to load IG_Posts.csv:', error);
        dataErrors['IG_Posts.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading YouTube_Age.csv');
        youtubeAgeData = await loadCSVFile('YouTube_Age.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Age.csv:', error);
        dataErrors['YouTube_Age.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading YouTube_Gender.csv');
        youtubeGenderData = await loadCSVFile('YouTube_Gender.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Gender.csv:', error);
        dataErrors['YouTube_Gender.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading YouTube_Geography.csv');
        youtubeGeographyData = await loadCSVFile('YouTube_Geography.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Geography.csv:', error);
        dataErrors['YouTube_Geography.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        console.log('Loading YouTube_Subscription_Status.csv');
        youtubeSubscriptionData = await loadCSVFile('YouTube_Subscription_Status.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Subscription_Status.csv:', error);
        dataErrors['YouTube_Subscription_Status.csv'] = error.message || "File not found or inaccessible";
      }
      
      console.log('All CSV files loaded or attempted');
      
      // Extract dates from all datasets
      try {
        // Check for date fields in each dataset
        const extractDatesFromDataset = (dataset, dateFields) => {
          if (!dataset || !dataset.length) return [];
          
          return dataset.reduce((dates, item) => {
            for (const field of dateFields) {
              if (item[field]) {
                const date = parseDate(item[field]);
                if (date) dates.push(date);
              }
            }
            return dates;
          }, []);
        };
        
        // Extract dates from all datasets
        const dateFields = ['Date', 'Publish time'];
        const allExtractedDates = [
          ...extractDatesFromDataset(emailData, dateFields),
          ...extractDatesFromDataset(fbVideosData, dateFields),
          ...extractDatesFromDataset(igPostsData, dateFields)
        ];
        
        if (allExtractedDates.length > 0) {
          allDates = allExtractedDates;
          console.log(`Found ${allDates.length} dates across all datasets`);
        }
      } catch (error) {
        console.error('Error extracting dates:', error);
      }
      
      // Set date range from all available dates
      if (allDates.length > 0) {
        const earliest = new Date(Math.min(...allDates));
        const latest = new Date(Math.max(...allDates));
        
        console.log(`Found date range from ${earliest.toISOString()} to ${latest.toISOString()}`);
        
        availableDates.earliestDate = earliest;
        availableDates.latestDate = latest;
        
        // Default to last 30 days if data available
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        dateRange.startDate = thirtyDaysAgo > earliest ? thirtyDaysAgo : earliest;
        dateRange.endDate = latest;
      } else {
        console.log('No dates found in the data');
      }
      
      isLoading = false;
      updateLoadingState();
      renderDateFilter();
      
      // Clear all charts before updating dashboard
      Object.keys(chartInstances).forEach(clearChart);
      
      updateDashboard();
      
    } catch (error) {
      console.error('Error loading data:', error);
      isLoading = false;
      updateLoadingState();
    }
  };
  
  // Update loading state display
  const updateLoadingState = () => {
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = isLoading ? 'Loading...' : new Date().toLocaleString();
    }
    
    // Add errors to the page if any
    if (Object.keys(dataErrors).length > 0) {
      // Try to find a good place to put error messages
      let errorContainer = document.querySelector('#error-container');
      
      if (!errorContainer) {
        // Create an error container if it doesn't exist
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'alert alert-danger mb-4 dashboard-section';
        errorContainer.innerHTML = '<h4 class="alert-heading">Data Loading Issues</h4>' +
          '<p>The dashboard was unable to load the following data files:</p>' +
          '<ul class="error-list mb-0"></ul>' +
          '<p class="mt-3">Please ensure that:</p>' +
          '<ol>' +
          '<li>The CSV files are in the correct location relative to this HTML file</li>' +
          '<li>The CSV files have the correct names (case-sensitive)</li>' +
          '<li>Your web server allows access to CSV files</li>' +
          '<li>CORS is not blocking access to the files</li>' +
          '</ol>' +
          '<p>If accessing locally, you may need to run a local web server for proper file access.</p>';
        
        // Try to insert it in a good place
        const container = document.querySelector('.container');
        if (container) {
          const firstSection = container.querySelector('.dashboard-section, .row');
          if (firstSection) {
            container.insertBefore(errorContainer, firstSection);
          } else {
            container.appendChild(errorContainer);
          }
        } else {
          // Last resort - just add to body
          document.body.insertBefore(errorContainer, document.body.firstChild);
        }
      }
      
      // Add error messages
      const errorList = errorContainer.querySelector('.error-list');
      if (errorList) {
        errorList.innerHTML = '';
        for (const [file, error] of Object.entries(dataErrors)) {
          const li = document.createElement('li');
          li.textContent = `${file}: ${error}`;
          errorList.appendChild(li);
        }
      }
    }
  };
  
  // Tab navigation
  const setupTabNavigation = () => {
    // Find tab elements
    const tabs = document.querySelectorAll('#dashboardTabs button, .nav-tabs .nav-link');
    if (!tabs.length) {
      console.warn('No tab navigation found in the document');
      return;
    }
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find all tabs in the same group
        const parent = tab.closest('.nav, .nav-tabs');
        if (!parent) return;
        
        const allTabs = parent.querySelectorAll('button, .nav-link');
        
        // Remove active class from all tabs
        allTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        
        // Add active class to clicked tab
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Find and activate corresponding content
        let contentId = tab.getAttribute('data-bs-target') || tab.getAttribute('href');
        if (!contentId) return;
        
        // Remove '#' if present
        if (contentId.startsWith('#')) {
          contentId = contentId.substring(1);
        }
        
        // Find all content panes
        const allContents = document.querySelectorAll('.tab-pane, .tab-content > div');
        allContents.forEach(content => {
          content.classList.remove('show', 'active');
        });
        
        // Activate the correct one
        const content = document.getElementById(contentId);
        if (content) {
          content.classList.add('show', 'active');
        }
      });
    });
  };
  
  // Update the dashboard with current data and filters
  const updateDashboard = () => {
    try {
      // Calculate key metrics
      const totalYoutubeViews = youtubeGeographyData ? 
        youtubeGeographyData.reduce((sum, item) => sum + (item.Views || 0), 0) : null;

      const emailRecipients = emailData && emailData.length > 0 ? 
        Math.max(...emailData.map(campaign => parseInt(campaign['Emails sent'] || 0))) : null;

      // Filter data based on date range
      const filteredEmailData = emailData ? applyDateFilter(emailData, 'Date') : null;
      const filteredFbVideos = fbVideosData ? applyDateFilter(fbVideosData, 'Date') : null;
      const filteredIgPosts = igPostsData ? applyDateFilter(igPostsData, 'Date') : null;
      
      // Calculate filtered metrics
      const totalFbVideoViews = filteredFbVideos && filteredFbVideos.length > 0 ? 
        filteredFbVideos.reduce((sum, video) => sum + (video['3-second video views'] || 0), 0) : null;
      
      const totalIgReach = filteredIgPosts && filteredIgPosts.length > 0 ? 
        filteredIgPosts.reduce((sum, post) => sum + (post.Reach || 0), 0) : null;
      
      console.log('Updating dashboard with filtered data:', {
        emailData: filteredEmailData?.length || 0,
        fbVideos: filteredFbVideos?.length || 0,
        igPosts: filteredIgPosts?.length || 0
      });
      
      // Update Overview tab
      updateOverviewTab(filteredEmailData, filteredFbVideos, filteredIgPosts, 
                       totalYoutubeViews, emailRecipients, totalFbVideoViews, totalIgReach);
      
      // Update Email tab
      updateEmailTab(filteredEmailData);
      
      // Update YouTube tab
      updateYouTubeTab();
      
      // Update Facebook tab
      updateFacebookTab(filteredFbVideos);
      
      // Update Instagram tab
      updateInstagramTab(filteredIgPosts);
      
      // New: Update Cross-Channel Analysis
      updateCrossChannelAnalysis(filteredEmailData, filteredFbVideos, filteredIgPosts, youtubeGeographyData);
      
    } catch (error) {
      console.error('Error updating dashboard:', error);
    }
  };
  
  // NEW FUNCTION: Update Cross-Channel Analysis
  const updateCrossChannelAnalysis = (emailData, fbVideos, igPosts, youtubeData) => {
    // Check if the cross-channel chart elements exist
    const channelTrafficChart = document.getElementById('channel-traffic-chart');
    const engagementChart = document.getElementById('engagement-chart');
    
    if (!channelTrafficChart && !engagementChart) return;
    
    // Prepare data for channel traffic comparison
    if (channelTrafficChart) {
      // Calculate total traffic/views by channel
      const emailOpens = emailData ? 
        emailData.reduce((sum, campaign) => sum + parseInt(campaign['Email opened (MPP excluded)'] || 0), 0) : 0;
      
      const fbViews = fbVideos ? 
        fbVideos.reduce((sum, video) => sum + (video['3-second video views'] || 0), 0) : 0;
      
      const igReach = igPosts ? 
        igPosts.reduce((sum, post) => sum + (post.Reach || 0), 0) : 0;
      
      const youtubeViews = youtubeData ? 
        youtubeData.reduce((sum, item) => sum + (item.Views || 0), 0) : 0;
      
      // Create the chart
      const trafficChartConfig = {
        type: 'bar',
        data: {
          labels: ['Email', 'Facebook', 'Instagram', 'YouTube'],
          datasets: [{
            label: 'Views/Reach',
            data: [emailOpens, fbViews, igReach, youtubeViews],
            backgroundColor: ['#4299e1', '#3b5998', '#e1306c', '#ff0000'],
            borderColor: ['#3182ce', '#344e86', '#cf125b', '#cc0000'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Views/Opens'
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Channel Performance Comparison'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatNumber(context.raw);
                }
              }
            }
          }
        }
      };
      
      createChart('channel-traffic-chart', trafficChartConfig);
    }
    
    // Prepare data for engagement comparison
    if (engagementChart) {
      // Calculate engagement metrics by channel
      const emailClickRate = emailData && emailData.length > 0 ? 
        emailData.reduce((sum, campaign) => sum + parseFloat(campaign['Email click rate'] || 0), 0) / emailData.length * 100 : 0;
      
      const fbEngagementRate = fbVideos && fbVideos.length > 0 ? 
        fbVideos.reduce((sum, video) => {
          const views = video['3-second video views'] || 0;
          const engagement = (video.Reactions || 0) + (video.Comments || 0) + (video.Shares || 0);
          return sum + (views > 0 ? engagement / views : 0);
        }, 0) / fbVideos.length * 100 : 0;
      
      const igEngagementRate = igPosts && igPosts.length > 0 ? 
        igPosts.reduce((sum, post) => {
          const reach = post.Reach || 0;
          const engagement = (post.Likes || 0) + (post.Comments || 0) + (post.Shares || 0) + (post.Saves || 0);
          return sum + (reach > 0 ? engagement / reach : 0);
        }, 0) / igPosts.length * 100 : 0;
      
      // YouTube engagement calculation (likes + comments + shares) / views
      const youtubeEngagementRate = 4.5; // Placeholder value since detailed engagement metrics aren't available
      
      // Create the chart
      const engagementChartConfig = {
        type: 'radar',
        data: {
          labels: ['Email', 'Facebook', 'Instagram', 'YouTube'],
          datasets: [{
            label: 'Engagement Rate (%)',
            data: [emailClickRate, fbEngagementRate, igEngagementRate, youtubeEngagementRate],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              beginAtZero: true,
              suggestedMax: Math.max(emailClickRate, fbEngagementRate, igEngagementRate, youtubeEngagementRate) * 1.2,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Engagement Rate by Channel'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.raw.toFixed(2) + '%';
                }
              }
            }
          }
        }
      };
      
      createChart('engagement-chart', engagementChartConfig);
    }
  };
  
  // Update Overview tab
  const updateOverviewTab = (filteredEmailData, filteredFbVideos, filteredIgPosts, 
                            totalYoutubeViews, emailRecipients, totalFbVideoViews, totalIgReach) => {
    // Update metric cards
    const updateMetricCard = (id, value, errorDataset) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      if (value !== null && value !== undefined) {
        element.innerHTML = formatNumber(value);
      } else {
        element.innerHTML = 'No data';
      }
      
      // Check for error message
      if (errorDataset && dataErrors[errorDataset]) {
        const parentCard = element.closest('.metric-card');
        if (parentCard) {
          let errorElement = parentCard.querySelector('.error-message');
          if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            parentCard.appendChild(errorElement);
          }
          errorElement.textContent = `Error: ${dataErrors[errorDataset]}`;
        }
      }
    };
    
    updateMetricCard('total-subscribers', emailRecipients, 'Email_Campaign_Performance.csv');
    updateMetricCard('total-youtube-views', totalYoutubeViews, 'YouTube_Geography.csv');
    
    // These metrics are filtered and might be empty due to date range
    if (document.getElementById('total-website-visitors')) {
      document.getElementById('total-website-visitors').innerHTML = 'N/A';
    }
    
    if (document.getElementById('total-followers')) {
      document.getElementById('total-followers').innerHTML = 'N/A';
    }
    
    // Update Facebook video views with filtered data
    if (totalFbVideoViews !== null) {
      updateMetricCard('total-facebook-views', totalFbVideoViews, 'FB_Videos.csv');
    } else if (document.getElementById('total-facebook-views')) {
      if (filteredFbVideos && filteredFbVideos.length === 0 && fbVideosData && fbVideosData.length > 0) {
        // We have data but nothing matches the filter
        document.getElementById('total-facebook-views').innerHTML = 'No data in range';
      } else {
        document.getElementById('total-facebook-views').innerHTML = 'No data';
      }
    }
    
    // Update Instagram reach with filtered data
    if (totalIgReach !== null) {
      updateMetricCard('total-instagram-reach', totalIgReach, 'IG_Posts.csv');
    } else if (document.getElementById('total-instagram-reach')) {
      if (filteredIgPosts && filteredIgPosts.length === 0 && igPostsData && igPostsData.length > 0) {
        // We have data but nothing matches the filter
        document.getElementById('total-instagram-reach').innerHTML = 'No data in range';
      } else {
        document.getElementById('total-instagram-reach').innerHTML = 'No data';
      }
    }
  };
  
  // Update Email tab
  const updateEmailTab = (filteredEmailData) => {
    // Email performance chart
    const emailPerformanceChart = document.getElementById('email-performance-chart');
    const emailEngagementChart = document.getElementById('email-engagement-chart');
    
    if (filteredEmailData && filteredEmailData.length > 0) {
      // Email Performance Chart
      if (emailPerformanceChart) {
        const sortedData = [...filteredEmailData]
          .sort((a, b) => {
            const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
            const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
            return openRateB - openRateA;
          })
          .slice(0, 8);
          
        const emailChartConfig = {
          type: 'bar',
          data: {
            labels: sortedData.map(campaign => campaign.Campaign.substring(0, 15) + '...'),
            datasets: [
              {
                label: 'Open Rate',
                data: sortedData.map(campaign => parseFloat(campaign['Email open rate (MPP excluded)']) * 100),
                backgroundColor: '#4299e1',
                borderColor: '#3182ce',
                borderWidth: 1
              },
              {
                label: 'Click Rate',
                data: sortedData.map(campaign => parseFloat(campaign['Email click rate']) * 100),
                backgroundColor: '#38b2ac',
                borderColor: '#319795',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              },
              x: {
                ticks: {
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                  }
                }
              }
            }
          }
        };
          
        createChart('email-performance-chart', emailChartConfig);
      }
      
      // Email Engagement Chart
      if (emailEngagementChart) {
        // Calculate engagement segments
        let notOpened = 0;
        let openedNotClicked = 0;
        let clicked = 0;
        
        filteredEmailData.forEach(campaign => {
          const sent = parseInt(campaign['Emails sent'] || 0);
          const opened = parseInt(campaign['Email opened (MPP excluded)'] || 0);
          const clickedCount = parseInt(campaign['Email clicked'] || 0);
          
          notOpened += (sent - opened);
          openedNotClicked += (opened - clickedCount);
          clicked += clickedCount;
        });
        
        const total = notOpened + openedNotClicked + clicked;
        
        const engagementChartConfig = {
          type: 'pie',
          data: {
            labels: ['Not Opened', 'Opened (No Click)', 'Clicked'],
            datasets: [{
              data: [notOpened, openedNotClicked, clicked],
              backgroundColor: ['#fc8181', '#f6ad55', '#68d391'],
              borderColor: ['#f56565', '#ed8936', '#48bb78'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return context.label + ': ' + formatNumber(value) + ' (' + percentage + '%)';
                  }
                }
              }
            }
          }
        };
        
        createChart('email-engagement-chart', engagementChartConfig);
      }
      
      // Top email campaigns table
      const topEmailCampaignsTable = document.getElementById('top-email-campaigns-table');
      if (topEmailCampaignsTable) {
        const sortedData = [...filteredEmailData]
          .sort((a, b) => {
            const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
            const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
            return openRateB - openRateA;
          })
          .slice(0, 10);
        
        let tableHtml = `
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Open Rate</th>
              <th>Click Rate</th>
              <th>Deliveries</th>
              <th>Unsubscribe Rate</th>
            </tr>
          </thead>
          <tbody>
        `;
        
        sortedData.forEach(campaign => {
          tableHtml += `
            <tr>
              <td>${campaign.Campaign}</td>
              <td>${(parseFloat(campaign['Email open rate (MPP excluded)']) * 100).toFixed(2)}%</td>
              <td>${(parseFloat(campaign['Email click rate']) * 100).toFixed(2)}%</td>
              <td>${formatNumber(campaign['Email deliveries'])}</td>
              <td>${(parseFloat(campaign['Email unsubscribe rate']) * 100).toFixed(2)}%</td>
            </tr>
          `;
        });
        
        tableHtml += '</tbody>';
        topEmailCampaignsTable.innerHTML = tableHtml;
      }
    } else {
      // Show empty state when no data available
      if (emailPerformanceChart) {
        clearChart('email-performance-chart');
        const ctx = emailPerformanceChart.getContext('2d');
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No email data available for selected date range', 
                    emailPerformanceChart.width / 2, 
                    emailPerformanceChart.height / 2);
      }
      
      if (emailEngagementChart) {
        clearChart('email-engagement-chart');
        const ctx = emailEngagementChart.getContext('2d');
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No email data available for selected date range', 
                    emailEngagementChart.width / 2, 
                    emailEngagementChart.height / 2);
      }
      
      // Update table with no data message
      const topEmailCampaignsTable = document.getElementById('top-email-campaigns-table');
      if (topEmailCampaignsTable) {
        topEmailCampaignsTable.innerHTML = `
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Open Rate</th>
              <th>Click Rate</th>
              <th>Deliveries</th>
              <th>Unsubscribe Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="text-center text-warning">No email data available for selected date range</td>
            </tr>
          </tbody>
        `;
      }
    }
  };
  
  // Update YouTube tab
  const updateYouTubeTab = () => {
    // YouTube demographics - age
    const youtubeAgeChart = document.getElementById('youtube-age-chart');
    if (youtubeAgeChart && youtubeAgeData) {
      const ageChartConfig = {
        type: 'bar',
        data: {
          labels: youtubeAgeData.map(data => data['Viewer age']),
          datasets: [{
            label: 'Views %',
            data: youtubeAgeData.map(data => data['Views (%)']),
            backgroundColor: '#4c51bf',
            borderColor: '#434190',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                }
              }
            }
          }
        }
      };
      
      createChart('youtube-age-chart', ageChartConfig);
    }
    
    // YouTube demographics - gender
    const youtubeGenderChart = document.getElementById('youtube-gender-chart');
    if (youtubeGenderChart && youtubeGenderData) {
      const genderChartConfig = {
        type: 'pie',
        data: {
          labels: youtubeGenderData.map(data => data['Viewer gender']),
          datasets: [{
            data: youtubeGenderData.map(data => data['Views (%)']),
            backgroundColor: ['#4c51bf', '#ed64a6', '#ecc94b'],
            borderColor: ['#434190', '#d53f8c', '#d69e2e'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.label + ': ' + context.raw.toFixed(2) + '%';
                }
              }
            }
          }
        }
      };
      
      createChart('youtube-gender-chart', genderChartConfig);
    }
    
    // YouTube subscriber status
    const youtubeSubscriberChart = document.getElementById('youtube-subscriber-chart');
    if (youtubeSubscriberChart && youtubeSubscriptionData) {
      const totalViews = youtubeSubscriptionData.reduce((sum, data) => sum + (data.Views || 0), 0);
      
      const subscriberChartConfig = {
        type: 'doughnut',
        data: {
          labels: youtubeSubscriptionData.map(data => data['Subscription status']),
          datasets: [{
            data: youtubeSubscriptionData.map(data => data.Views),
            backgroundColor: ['#48bb78', '#4299e1'],
            borderColor: ['#38a169', '#3182ce'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const percentage = ((value / totalViews) * 100).toFixed(1);
                  return context.label + ': ' + formatNumber(value) + ' (' + percentage + '%)';
                }
              }
            }
          }
        }
      };
      
      createChart('youtube-subscriber-chart', subscriberChartConfig);
    }
    
    // YouTube geography
    const youtubeGeographyChart = document.getElementById('youtube-geography-chart');
    if (youtubeGeographyChart && youtubeGeographyData) {
      // Sort by views and take top 10
      const topCountries = [...youtubeGeographyData]
        .sort((a, b) => (b.Views || 0) - (a.Views || 0))
        .slice(0, 10);
      
      const geographyChartConfig = {
        type: 'bar',
        data: {
          labels: topCountries.map(data => data.Geography),
          datasets: [{
            label: 'Views',
            data: topCountries.map(data => data.Views),
            backgroundColor: '#4c51bf',
            borderColor: '#434190',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            },
            x: {
              ticks: {
                autoSkip: false,
                maxRotation: 45,
                minRotation: 45
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return context.dataset.label + ': ' + formatNumber(context.raw);
                }
              }
            }
          }
        }
      };
      
      createChart('youtube-geography-chart', geographyChartConfig);
    }
  };
  
  // Update Facebook tab
  const updateFacebookTab = (filteredFbVideos) => {
    // Facebook videos table
    const fbVideosTable = document.getElementById('fb-videos-table');
    if (fbVideosTable) {
      if (filteredFbVideos && filteredFbVideos.length > 0) {
        const topVideos = [...filteredFbVideos]
          .sort((a, b) => (b['3-second video views'] || 0) - (a['3-second video views'] || 0))
          .slice(0, 5);
        
        let tableHtml = `
          <thead>
            <tr>
              <th>Video Title</th>
              <th>Views</th>
              <th>Reactions</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Avg View Time</th>
            </tr>
          </thead>
          <tbody>
        `;
        
        topVideos.forEach(video => {
          tableHtml += `
            <tr>
              <td>${video.Title}</td>
              <td>${formatNumber(video['3-second video views'] || 0)}</td>
              <td>${formatNumber(video.Reactions || 0)}</td>
              <td>${formatNumber(video.Comments || 0)}</td>
              <td>${formatNumber(video.Shares || 0)}</td>
              <td>${video['Average Seconds viewed'] || '0'}s</td>
            </tr>
          `;
        });
        
        tableHtml += '</tbody>';
        fbVideosTable.innerHTML = tableHtml;
      } else {
        fbVideosTable.innerHTML = `
          <thead>
            <tr>
              <th>Video Title</th>
              <th>Views</th>
              <th>Reactions</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Avg View Time</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="text-center text-warning">No Facebook video data available for selected date range</td>
            </tr>
          </tbody>
        `;
      }
    }
    
    // Facebook video engagement chart
    const fbDemographicsChart = document.getElementById('fb-demographics-chart');
    if (fbDemographicsChart) {
      if (filteredFbVideos && filteredFbVideos.length > 0) {
        const topVideo = filteredFbVideos
          .sort((a, b) => (b['3-second video views'] || 0) - (a['3-second video views'] || 0))[0];
        
        // Extract demographic data
        const demographicData = [
          {name: 'F, 18-24', value: topVideo ? topVideo['3-second video views by top audience (F, 18-24)'] || 0 : 0},
          {name: 'F, 25-34', value: topVideo ? topVideo['3-second video views by top audience (F, 25-34)'] || 0 : 0},
          {name: 'F, 35-44', value: topVideo ? topVideo['3-second video views by top audience (F, 35-44)'] || 0 : 0},
          {name: 'F, 45-54', value: topVideo ? topVideo['3-second video views by top audience (F, 45-54)'] || 0 : 0},
          {name: 'M, 18-24', value: topVideo ? topVideo['3-second video views by top audience (M, 18-24)'] || 0 : 0},
          {name: 'M, 25-34', value: topVideo ? topVideo['3-second video views by top audience (M, 25-34)'] || 0 : 0},
          {name: 'M, 35-44', value: topVideo ? topVideo['3-second video views by top audience (M, 35-44)'] || 0 : 0},
          {name: 'M, 45-54', value: topVideo ? topVideo['3-second video views by top audience (M, 45-54)'] || 0 : 0},
        ].filter(item => item.value > 0);
        
        const demographicsChartConfig = {
          type: 'bar',
          data: {
            labels: demographicData.map(item => item.name),
            datasets: [{
              label: 'Views Percentage',
              data: demographicData.map(item => item.value * 100),
              backgroundColor: '#4c51bf',
              borderColor: '#434190',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              },
              x: {
                ticks: {
                  autoSkip: false,
                  maxRotation: 45,
                  minRotation: 45
                }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + '%';
                  }
                }
              }
            }
          }
        };
        
        createChart('fb-demographics-chart', demographicsChartConfig);
      } else {
        clearChart('fb-demographics-chart');
        // Show empty state
        const ctx = fbDemographicsChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No Facebook video data available for selected date range', 
                    fbDemographicsChart.width / 2, 
                    fbDemographicsChart.height / 2);
      }
    }
    
    // Facebook followers chart placeholder
    const fbFollowersChart = document.getElementById('fb-followers-chart');
    if (fbFollowersChart) {
      clearChart('fb-followers-chart');
      const ctx = fbFollowersChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('FB_Follows.csv data not loaded', fbFollowersChart.width / 2, fbFollowersChart.height / 2);
    }
  };
  
  // Update Instagram tab
  const updateInstagramTab = (filteredIgPosts) => {
    // Instagram posts table
    const topIgPostsTable = document.getElementById('top-ig-posts-table');
    if (topIgPostsTable) {
      if (filteredIgPosts && filteredIgPosts.length > 0) {
        const topPosts = [...filteredIgPosts]
          .sort((a, b) => (b.Reach || 0) - (a.Reach || 0))
          .slice(0, 5);
        
        let tableHtml = `
          <thead>
            <tr>
              <th>Post</th>
              <th>Reach</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Saves</th>
            </tr>
          </thead>
          <tbody>
        `;
        
        topPosts.forEach(post => {
          tableHtml += `
            <tr>
              <td>${post.Description ? post.Description.substring(0, 30) + '...' : 'No description'}</td>
              <td>${formatNumber(post.Reach || 0)}</td>
              <td>${formatNumber(post.Likes || 0)}</td>
              <td>${formatNumber(post.Comments || 0)}</td>
              <td>${formatNumber(post.Shares || 0)}</td>
              <td>${formatNumber(post.Saves || 0)}</td>
            </tr>
          `;
        });
        
        tableHtml += '</tbody>';
        topIgPostsTable.innerHTML = tableHtml;
      } else {
        topIgPostsTable.innerHTML = `
          <thead>
            <tr>
              <th>Post</th>
              <th>Reach</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Saves</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="6" class="text-center text-warning">No Instagram post data available for selected date range</td>
            </tr>
          </tbody>
        `;
      }
    }
    
    // Instagram engagement distribution chart
    const igDemographicsChart = document.getElementById('ig-demographics-chart');
    if (igDemographicsChart) {
      if (filteredIgPosts && filteredIgPosts.length > 0) {
        const engagementData = [
          { name: 'Likes', value: filteredIgPosts.reduce((sum, post) => sum + (post.Likes || 0), 0) },
          { name: 'Comments', value: filteredIgPosts.reduce((sum, post) => sum + (post.Comments || 0), 0) },
          { name: 'Shares', value: filteredIgPosts.reduce((sum, post) => sum + (post.Shares || 0), 0) },
          { name: 'Saves', value: filteredIgPosts.reduce((sum, post) => sum + (post.Saves || 0), 0) }
        ];
        
        const totalEngagement = engagementData.reduce((sum, item) => sum + item.value, 0);
        
        const demographicsChartConfig = {
          type: 'pie',
          data: {
            labels: engagementData.map(data => data.name),
            datasets: [{
              data: engagementData.map(data => data.value),
              backgroundColor: ['#fc8181', '#f6ad55', '#4299e1', '#68d391'],
              borderColor: ['#f56565', '#ed8936', '#3182ce', '#48bb78'],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const percentage = ((value / totalEngagement) * 100).toFixed(1);
                    return context.label + ': ' + formatNumber(value) + ' (' + percentage + '%)';
                  }
                }
              }
            }
          }
        };
        
        createChart('ig-demographics-chart', demographicsChartConfig);
      } else {
        clearChart('ig-demographics-chart');
        // Show empty state
        const ctx = igDemographicsChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No Instagram post data available for selected date range', 
                    igDemographicsChart.width / 2, 
                    igDemographicsChart.height / 2);
      }
    }
    
    // Instagram followers chart placeholder
    const igFollowersChart = document.getElementById('ig-followers-chart');
    if (igFollowersChart) {
      clearChart('ig-followers-chart');
      const ctx = igFollowersChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('IG_Follows.csv data not loaded', igFollowersChart.width / 2, igFollowersChart.height / 2);
    }
  };
  
  // Initialize the dashboard
  const initDashboard = () => {
    console.log('Initializing Marketing Analytics Dashboard');
    
    // Insert date filter container
    insertDateFilter();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Clear all charts before loading data
    Object.keys(chartInstances).forEach(clearChart);
    
    // Load data
    loadCSVData();
  };
  
  // Start the dashboard
  initDashboard();
});