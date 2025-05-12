// Complete, Fixed Implementation of the Dashboard Script

// Main dashboard initialization - immediately invoked to avoid polluting global scope
(function() {
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
  
  // *** CRITICAL FIX: Use global chart instances tracker to prevent canvas reuse issues ***
  window.chartInstances = {};
  
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
  
  // Debug logging helper
  const debugLog = (message, data = null) => {
    console.debug(`[Dashboard] ${message}`, data || '');
  };
  
  // ========== UTILITY FUNCTIONS ==========
  
  // Safe integer parsing with default value
  const safeParseInt = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    // If it's already a number, return it
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // If it's a string with commas (like "1,234"), remove them
    if (typeof value === 'string') {
      value = value.replace(/,/g, '');
    }
    
    // If it's a string with a percentage, remove the % sign and convert
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return isNaN(numValue) ? defaultValue : Math.round(numValue);
    }
    
    // Otherwise try to parse it as an integer
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Safe float parsing with default value
  const safeParseFloat = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    // If it's already a number, return it
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // If it's a string with commas (like "1,234.56"), remove them
    if (typeof value === 'string') {
      value = value.replace(/,/g, '');
    }
    
    // If it's a string with a percentage, remove the % sign and convert
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return isNaN(numValue) ? defaultValue : numValue;
    }
    
    // Otherwise try to parse it as a float
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };
  
  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return '--';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // *** CRITICAL FIX: Helper function to find field by pattern ***
  // CSV headers can sometimes be inconsistent, so this helps locate the right field
  const findFieldByPattern = (item, patterns) => {
    if (!item) return null;
    
    for (const pattern of patterns) {
      // Exact match
      if (item[pattern] !== undefined) {
        return pattern;
      }
      
      // Fuzzy match
      const keys = Object.keys(item);
      for (const key of keys) {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
          return key;
        }
      }
    }
    
    return null;
  };
  
  // Helper to get data safely with fallback field names
  const getDataField = (item, fieldPatterns, defaultValue = 0) => {
    if (!item) return defaultValue;
    
    // Try exact matches first
    for (const field of fieldPatterns) {
      if (item[field] !== undefined) {
        return typeof item[field] === 'string' && item[field].includes('%') 
          ? safeParseFloat(item[field].replace('%', ''))
          : safeParseFloat(item[field]);
      }
    }
    
    // Try fuzzy matches
    const keys = Object.keys(item);
    for (const pattern of fieldPatterns) {
      for (const key of keys) {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
          return typeof item[key] === 'string' && item[key].includes('%')
            ? safeParseFloat(item[key].replace('%', ''))
            : safeParseFloat(item[key]);
        }
      }
    }
    
    return defaultValue;
  };
  
  // *** CRITICAL FIX: Enhanced check for chart data validity ***
  const checkChartHasData = (config) => {
    if (!config || !config.data || !config.data.datasets) {
      return false;
    }
    
    // Check if any dataset has data
    return config.data.datasets.some(dataset => {
      if (!dataset.data) return false;
      
      // For numeric data arrays
      if (Array.isArray(dataset.data)) {
        // Check if array has any non-zero, non-null, non-undefined values
        return dataset.data.some(val => val !== null && val !== undefined && val !== 0);
      }
      
      // For object data
      if (typeof dataset.data === 'object') {
        return Object.values(dataset.data).some(val => val !== null && val !== undefined && val !== 0);
      }
      
      return false;
    });
  };
  
  // *** CRITICAL FIX: Helper function to safely create a chart ***
  const createChart = (canvasId, config) => {
    debugLog(`Creating chart for ${canvasId}`);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas with ID ${canvasId} not found`);
      return null;
    }
    
    // CRITICAL FIX: First destroy any existing chart for this canvas
    // This prevents "Canvas is already in use" errors
    if (window.chartInstances && window.chartInstances[canvasId]) {
      debugLog(`Destroying existing chart in ${canvasId}`);
      window.chartInstances[canvasId].destroy();
      delete window.chartInstances[canvasId];
    }
    
    // Extra precaution: Look for any global Chart.js instances that might be 
    // using this canvas
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          debugLog(`Found global Chart.js instance for ${canvasId}, destroying`);
          instance.destroy();
        }
      });
    }
    
    try {
      // Get the 2D context for the canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.warn(`Could not get 2D context for canvas ${canvasId}`);
        return null;
      }
      
      // DEBUG: Log the actual data that will be used for the chart
      debugLog(`Chart data for ${canvasId}:`, config.data);
      
      // Verify the data for the chart
      const hasData = checkChartHasData(config);
      if (!hasData) {
        debugLog(`No valid data available for chart ${canvasId}`);
        
        // Show empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No data available for the selected period', 
                    canvas.width / 2, canvas.height / 2);
        return null;
      }
      
      // Create a new chart
      window.chartInstances[canvasId] = new Chart(ctx, config);
      debugLog(`Successfully created chart for ${canvasId}`);
      return window.chartInstances[canvasId];
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
  
  // *** CRITICAL FIX: Enhanced clearChart function that works with global chart instances ***
  const clearChart = (canvasId) => {
    if (window.chartInstances && window.chartInstances[canvasId]) {
      debugLog(`Destroying chart in ${canvasId}`);
      window.chartInstances[canvasId].destroy();
      delete window.chartInstances[canvasId];
    }
    
    // Also check global Chart.js instances
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          debugLog(`Found global Chart.js instance for ${canvasId}, destroying`);
          instance.destroy();
        }
      });
    }
    
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  
  // *** CRITICAL FIX: Get proper path for CSV files based on deployment environment ***
  const getFilePath = (filename) => {
    // For GitHub Pages, need to include the repository name in the path
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
      // Extract repo name from the path
      const pathParts = window.location.pathname.split('/');
      const repoName = pathParts[1]; // First part after the domain
      
      // If we're in a repo (not a user pages site)
      if (repoName && repoName !== '') {
        debugLog(`Using GitHub Pages path: /${repoName}/${filename}`);
        return `/${repoName}/${filename}`;
      }
    }
    
    // Otherwise use relative path for local development
    return filename;
  };
  
  // ========== DATE HANDLING FUNCTIONS ==========
  
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
    
    debugLog(`Applying date filter to ${data.length} records. Range: ${dateRange.startDate.toISOString()} - ${dateRange.endDate.toISOString()}`);
    
    const filtered = data.filter(item => {
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
    
    debugLog(`Date filter resulted in ${filtered.length} records`);
    return filtered;
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
        // *** FIX: Set to full date range to show all data ***
        dateRange.startDate = availableDates.earliestDate;
        dateRange.endDate = availableDates.latestDate;
        renderDateFilter();
        updateDashboard();
      });
    }
  };
  
  // ========== DATA LOADING FUNCTIONS ==========
  
  // *** CRITICAL FIX: Improved CSV loading with better debugging and error handling ***
  const loadCSVFile = (filename) => {
    return new Promise((resolve, reject) => {
      const filepath = getFilePath(filename);
      debugLog(`Attempting to load ${filename} from ${filepath}...`);
      
      try {
        Papa.parse(filepath, {
          download: true,
          header: true,
          dynamicTyping: false, // IMPORTANT: Set to false to prevent automatic type conversion
          skipEmptyLines: true,
          complete: (results) => {
            debugLog(`Successfully loaded ${filename}, found ${results.data.length} rows`);
            
            // DEBUG: Log the first row to see column names
            if (results.data.length > 0) {
              debugLog(`First row of ${filename}:`, results.data[0]);
              debugLog(`Column headers:`, Object.keys(results.data[0]));
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
  
  // Load all CSV files
  const loadCSVData = async () => {
    isLoading = true;
    updateLoadingState();
    dataErrors = {};
    let allDates = [];
    
    debugLog('Loading CSV data...');
    
    try {
      // Load all required CSV files
      debugLog('Starting to load all CSV files...');
      
      try {
        debugLog('Loading Email_Campaign_Performance.csv');
        emailData = await loadCSVFile('Email_Campaign_Performance.csv');
      } catch (error) {
        console.error('Failed to load Email_Campaign_Performance.csv:', error);
        dataErrors['Email_Campaign_Performance.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading FB_Videos.csv');
        fbVideosData = await loadCSVFile('FB_Videos.csv');
      } catch (error) {
        console.error('Failed to load FB_Videos.csv:', error);
        dataErrors['FB_Videos.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading IG_Posts.csv');
        igPostsData = await loadCSVFile('IG_Posts.csv');
      } catch (error) {
        console.error('Failed to load IG_Posts.csv:', error);
        dataErrors['IG_Posts.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading YouTube_Age.csv');
        youtubeAgeData = await loadCSVFile('YouTube_Age.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Age.csv:', error);
        dataErrors['YouTube_Age.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading YouTube_Gender.csv');
        youtubeGenderData = await loadCSVFile('YouTube_Gender.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Gender.csv:', error);
        dataErrors['YouTube_Gender.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading YouTube_Geography.csv');
        youtubeGeographyData = await loadCSVFile('YouTube_Geography.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Geography.csv:', error);
        dataErrors['YouTube_Geography.csv'] = error.message || "File not found or inaccessible";
      }
      
      try {
        debugLog('Loading YouTube_Subscription_Status.csv');
        youtubeSubscriptionData = await loadCSVFile('YouTube_Subscription_Status.csv');
      } catch (error) {
        console.error('Failed to load YouTube_Subscription_Status.csv:', error);
        dataErrors['YouTube_Subscription_Status.csv'] = error.message || "File not found or inaccessible";
      }
      
      debugLog('All CSV files loaded or attempted');
      
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
          debugLog(`Found ${allDates.length} dates across all datasets`);
        }
      } catch (error) {
        console.error('Error extracting dates:', error);
      }
      
      // Set date range from all available dates
      if (allDates.length > 0) {
        const earliest = new Date(Math.min(...allDates));
        const latest = new Date(Math.max(...allDates));
        
        debugLog(`Found date range from ${earliest.toISOString()} to ${latest.toISOString()}`);
        
        availableDates.earliestDate = earliest;
        availableDates.latestDate = latest;
        
        // *** FIX: Set to full date range to show all data by default ***
        dateRange.startDate = earliest;
        dateRange.endDate = latest;
      } else {
        debugLog('No dates found in the data');
      }
      
      isLoading = false;
      updateLoadingState();
      renderDateFilter();
      
      // Clear all charts before updating dashboard
      for (const canvasId in window.chartInstances) {
        clearChart(canvasId);
      }
      
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
  
  // ========== TAB NAVIGATION ==========
  
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
  
  // ========== DASHBOARD UPDATE FUNCTIONS ==========
  
  // Update the dashboard with current data and filters
  const updateDashboard = () => {
    try {
      debugLog('Updating dashboard with current data and filters');
      
      // Calculate key metrics
      const totalYoutubeViews = youtubeGeographyData ? 
        youtubeGeographyData.reduce((sum, item) => sum + safeParseInt(item.Views), 0) : null;

      const emailRecipients = emailData && emailData.length > 0 ? 
        Math.max(...emailData.map(campaign => safeParseInt(campaign['Emails sent']))) : null;

      // Filter data based on date range
      const filteredEmailData = emailData ? applyDateFilter(emailData, 'Date') : null;
      const filteredFbVideos = fbVideosData ? applyDateFilter(fbVideosData, 'Date') : null;
      const filteredIgPosts = igPostsData ? applyDateFilter(igPostsData, 'Date') : null;
      
      // Calculate filtered metrics
      const totalFbVideoViews = filteredFbVideos && filteredFbVideos.length > 0 ? 
        filteredFbVideos.reduce((sum, video) => sum + safeParseInt(video['3-second video views']), 0) : null;
      
      const totalIgReach = filteredIgPosts && filteredIgPosts.length > 0 ? 
        filteredIgPosts.reduce((sum, post) => sum + safeParseInt(post.Reach), 0) : null;
      
      debugLog('Filtered data stats:', {
        emailData: filteredEmailData?.length || 0,
        fbVideos: filteredFbVideos?.length || 0,
        igPosts: filteredIgPosts?.length || 0,
        totalFbVideoViews,
        totalIgReach
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
      
      // Update Cross-Channel Analysis
      updateCrossChannelAnalysis(filteredEmailData, filteredFbVideos, filteredIgPosts, youtubeGeographyData);
      
    } catch (error) {
      console.error('Error updating dashboard:', error);
    }
  };
  
  // *** CRITICAL FIX: Update Cross-Channel Analysis with robust field detection ***
  const updateCrossChannelAnalysis = (emailData, fbVideos, igPosts, youtubeData) => {
    debugLog('Updating cross-channel analysis');
    
    // Check if the cross-channel chart elements exist
    const channelTrafficChart = document.getElementById('channel-traffic-chart');
    const engagementChart = document.getElementById('engagement-chart');
    
    if (!channelTrafficChart && !engagementChart) {
      debugLog('No cross-channel chart elements found');
      return;
    }
    
    // Prepare data for channel traffic comparison
    if (channelTrafficChart) {
      // Calculate total traffic/views by channel with detailed logging
      // FIX: More robust field checking and parsing
      let emailOpens = 0;
      if (emailData && emailData.length > 0) {
        emailData.forEach(campaign => {
          // Try different potential field names
          const openedField = getDataField(campaign, [
            'Email opened (MPP excluded)', 
            'Email opened',
            'Opened'
          ]);
          
          emailOpens += openedField;
        });
      }
      
      let fbViews = 0;
      if (fbVideos && fbVideos.length > 0) {
        fbVideos.forEach(video => {
          // Try different potential field names
          const viewsField = getDataField(video, [
            '3-second video views',
            'video views',
            'Views'
          ]);
          
          fbViews += viewsField;
        });
      }
      
      let igReach = 0;
      if (igPosts && igPosts.length > 0) {
        igPosts.forEach(post => {
          // Try different potential field names
          const reachField = getDataField(post, [
            'Reach',
            'reach',
            'Total reach'
          ]);
          
          igReach += reachField;
        });
      }
      
      let youtubeViews = 0;
      if (youtubeData && youtubeData.length > 0) {
        youtubeData.forEach(item => {
          // Try different potential field names
          const viewsField = getDataField(item, [
            'Views',
            'views'
          ]);
          
          youtubeViews += viewsField;
        });
      }
      
      debugLog('Channel traffic comparison data:', { emailOpens, fbViews, igReach, youtubeViews });
      
      // Check if there's any data to display
      if (emailOpens === 0 && fbViews === 0 && igReach === 0 && youtubeViews === 0) {
        clearChart('channel-traffic-chart');
        const ctx = channelTrafficChart.getContext('2d');
        if (ctx) {
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f6ad55';
          ctx.textAlign = 'center';
          ctx.fillText('No data available for the selected period', channelTrafficChart.width / 2, channelTrafficChart.height / 2);
        }
        return;
      }
      
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
    
    // *** CRITICAL FIX: Prepare data for engagement comparison with similar approach ***
    if (engagementChart) {
      // Calculate engagement metrics by channel
      const emailClickRate = emailData && emailData.length > 0 ? 
        emailData.reduce((sum, campaign) => {
          const rate = getDataField(campaign, [
            'Email click rate',
            'Click rate',
            'click rate'
          ]);
          return sum + rate;
        }, 0) / emailData.length * 100 : 0;
      
      const fbEngagementRate = fbVideos && fbVideos.length > 0 ? 
        fbVideos.reduce((sum, video) => {
          const views = getDataField(video, ['3-second video views', 'video views', 'Views']);
          
          // Combine different engagement metrics with fallbacks
          const reactions = getDataField(video, ['Reactions', 'reactions']);
          const comments = getDataField(video, ['Comments', 'comments']);
          const shares = getDataField(video, ['Shares', 'shares']);
          
          const engagement = reactions + comments + shares;
          return sum + (views > 0 ? engagement / views : 0);
        }, 0) / fbVideos.length * 100 : 0;
      
      const igEngagementRate = igPosts && igPosts.length > 0 ? 
        igPosts.reduce((sum, post) => {
          const reach = getDataField(post, ['Reach', 'reach']);
          
          // Combine different engagement metrics with fallbacks
          const likes = getDataField(post, ['Likes', 'likes']);
          const comments = getDataField(post, ['Comments', 'comments']);
          const shares = getDataField(post, ['Shares', 'shares']);
          const saves = getDataField(post, ['Saves', 'saves']);
          
          const engagement = likes + comments + shares + saves;
          return sum + (reach > 0 ? engagement / reach : 0);
        }, 0) / igPosts.length * 100 : 0;
      
      // YouTube engagement calculation (likes + comments + shares) / views
      const youtubeEngagementRate = 4.5; // Placeholder value since detailed engagement metrics aren't available
      
      debugLog('Channel engagement data:', { emailClickRate, fbEngagementRate, igEngagementRate, youtubeEngagementRate });
      
      // Check if there's any data to display
      if (emailClickRate === 0 && fbEngagementRate === 0 && igEngagementRate === 0 && youtubeEngagementRate === 0) {
        clearChart('engagement-chart');
        const ctx = engagementChart.getContext('2d');
        if (ctx) {
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f6ad55';
          ctx.textAlign = 'center';
          ctx.fillText('No engagement data available for the selected period', engagementChart.width / 2, engagementChart.height / 2);
        }
        return;
      }
      
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
            errorElement.className = 'error-message text-danger small mt-2';
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
  
  // *** CRITICAL FIX: Update Email tab with robust field handling ***
  const updateEmailTab = (filteredEmailData) => {
    // Email performance chart
    const emailPerformanceChart = document.getElementById('email-performance-chart');
    const emailEngagementChart = document.getElementById('email-engagement-chart');
    
    if (filteredEmailData && filteredEmailData.length > 0) {
      debugLog(`Updating email charts with ${filteredEmailData.length} campaigns`);
      
      // Email Performance Chart
      if (emailPerformanceChart) {
        const sortedData = [...filteredEmailData]
          .sort((a, b) => {
            const openRateA = getDataField(a, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']);
            const openRateB = getDataField(b, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']);
            return openRateB - openRateA;
          })
          .slice(0, 8);
          
        const emailChartConfig = {
          type: 'bar',
          data: {
            labels: sortedData.map(campaign => {
              // Ensure campaign name exists and is properly truncated
              const name = campaign.Campaign || 'Unnamed Campaign';
              return name.length > 15 ? name.substring(0, 15) + '...' : name;
            }),
            datasets: [
              {
                label: 'Open Rate',
                data: sortedData.map(campaign => 
                  getDataField(campaign, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']) * 100
                ),
                backgroundColor: '#4299e1',
                borderColor: '#3182ce',
                borderWidth: 1
              },
              {
                label: 'Click Rate',
                data: sortedData.map(campaign => 
                  getDataField(campaign, ['Email click rate', 'Click rate']) * 100
                ),
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
          const sent = getDataField(campaign, ['Emails sent', 'emails sent', 'Total sent']);
          const opened = getDataField(campaign, ['Email opened (MPP excluded)', 'Email opened', 'opened']);
          const clickedCount = getDataField(campaign, ['Email clicked', 'clicked']);
          
          notOpened += (sent - opened);
          openedNotClicked += (opened - clickedCount);
          clicked += clickedCount;
        });
        
        const total = notOpened + openedNotClicked + clicked;
        
        debugLog('Email engagement segments:', { notOpened, openedNotClicked, clicked, total });
        
        // Ensure we have valid data
        if (total <= 0) {
          clearChart('email-engagement-chart');
          const ctx = emailEngagementChart.getContext('2d');
          if (ctx) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#f6ad55';
            ctx.textAlign = 'center';
            ctx.fillText('No email engagement data available', emailEngagementChart.width / 2, emailEngagementChart.height / 2);
          }
          return;
        }
        
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
            const openRateA = getDataField(a, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']);
            const openRateB = getDataField(b, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']);
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
              <td>${campaign.Campaign || 'Unnamed Campaign'}</td>
              <td>${(getDataField(campaign, ['Email open rate (MPP excluded)', 'Email open rate', 'Open rate']) * 100).toFixed(2)}%</td>
              <td>${(getDataField(campaign, ['Email click rate', 'Click rate']) * 100).toFixed(2)}%</td>
              <td>${formatNumber(campaign['Email deliveries'] || campaign['deliveries'])}</td>
              <td>${(getDataField(campaign, ['Email unsubscribe rate', 'Unsubscribe rate']) * 100).toFixed(2)}%</td>
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
  
  // *** CRITICAL FIX: Update YouTube tab with fixed field mapping ***
  const updateYouTubeTab = () => {
    debugLog('Updating YouTube tab');
    
    // Helper function to extract YouTube metrics with fallbacks
    const getYoutubePercentage = (item) => {
      // Try different possible field names
      if (item['Views (%)'] !== undefined) return safeParseFloat(item['Views (%)']);
      if (item['Views%'] !== undefined) return safeParseFloat(item['Views%']);
      if (item['Views'] !== undefined && typeof item['Views'] === 'string' && item['Views'].includes('%')) {
        return safeParseFloat(item['Views'].replace('%', ''));
      }
      
      // For gender/age data, sometimes the field is just "Views" and they're all percentages adding to 100%
      const total = youtubeAgeData?.reduce((sum, d) => sum + safeParseInt(d['Views']), 0) || 0;
      if (total > 0 && item['Views'] !== undefined) {
        return (safeParseInt(item['Views']) / total) * 100;
      }
      
      return 0;
    };
    
    // FIX: YouTube demographics - age
    const youtubeAgeChart = document.getElementById('youtube-age-chart');
    if (youtubeAgeChart && youtubeAgeData && youtubeAgeData.length > 0) {
      debugLog('Creating YouTube age chart with', youtubeAgeData.length, 'entries');
      debugLog('Raw YouTube age data:', youtubeAgeData);
      
      // Create proper chart data with debugging
      const ageLabels = youtubeAgeData.map(data => data['Viewer age'] || '(Unknown)');
      
      // Try different approach for percentage values
      const ageValues = youtubeAgeData.map(data => {
        const value = getYoutubePercentage(data);
        debugLog(`Age value for ${data['Viewer age']}: ${value}`);
        return value;
      });
      
      debugLog('Age chart data:', {labels: ageLabels, values: ageValues});
      
      // Verify data has values - use raw array check
      if (ageValues.length === 0 || ageValues.every(v => v === 0)) {
        clearChart('youtube-age-chart');
        const ctx = youtubeAgeChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No valid age data available', 
                    youtubeAgeChart.width / 2, 
                    youtubeAgeChart.height / 2);
        return;
      }
      
      const ageChartConfig = {
        type: 'bar',
        data: {
          labels: ageLabels,
          datasets: [{
            label: 'Views %',
            data: ageValues,
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
    } else if (youtubeAgeChart) {
      clearChart('youtube-age-chart');
      const ctx = youtubeAgeChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('No YouTube age data available', 
                  youtubeAgeChart.width / 2, 
                  youtubeAgeChart.height / 2);
    }
    
    // FIX: YouTube demographics - gender with same approach
    const youtubeGenderChart = document.getElementById('youtube-gender-chart');
    if (youtubeGenderChart && youtubeGenderData && youtubeGenderData.length > 0) {
      debugLog('Creating YouTube gender chart with', youtubeGenderData.length, 'entries');
      debugLog('Raw YouTube gender data:', youtubeGenderData);
      
      // Create proper chart data
      const genderLabels = youtubeGenderData.map(data => data['Viewer gender'] || '(Unknown)');
      const genderValues = youtubeGenderData.map(data => {
        const value = getYoutubePercentage(data);
        debugLog(`Gender value for ${data['Viewer gender']}: ${value}`);
        return value;
      });
      
      debugLog('Gender chart data:', {labels: genderLabels, values: genderValues});
      
      // Verify we have valid data
      if (genderValues.length === 0 || genderValues.every(v => v === 0)) {
        clearChart('youtube-gender-chart');
        const ctx = youtubeGenderChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No valid gender data available', 
                    youtubeGenderChart.width / 2, 
                    youtubeGenderChart.height / 2);
        return;
      }
      
      const genderChartConfig = {
        type: 'pie',
        data: {
          labels: genderLabels,
          datasets: [{
            data: genderValues,
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
    } else if (youtubeGenderChart) {
      clearChart('youtube-gender-chart');
      const ctx = youtubeGenderChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('No YouTube gender data available', 
                   youtubeGenderChart.width / 2, 
                   youtubeGenderChart.height / 2);
    }
    
    // YouTube subscriber status
    const youtubeSubscriberChart = document.getElementById('youtube-subscriber-chart');
    if (youtubeSubscriberChart && youtubeSubscriptionData && youtubeSubscriptionData.length > 0) {
      debugLog('Creating YouTube subscriber chart with', youtubeSubscriptionData.length, 'entries');
      debugLog('Raw subscription data:', youtubeSubscriptionData);
      
      const totalViews = youtubeSubscriptionData.reduce((sum, data) => sum + safeParseInt(data.Views), 0);
      
      // Verify data has values
      if (totalViews <= 0) {
        clearChart('youtube-subscriber-chart');
        const ctx = youtubeSubscriberChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No valid subscriber data available', 
                    youtubeSubscriberChart.width / 2, 
                    youtubeSubscriberChart.height / 2);
        return;
      }
      
      const subscriberChartConfig = {
        type: 'doughnut',
        data: {
          labels: youtubeSubscriptionData.map(data => data['Subscription status'] || 'Unknown'),
          datasets: [{
            data: youtubeSubscriptionData.map(data => safeParseInt(data.Views)),
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
    } else if (youtubeSubscriberChart) {
      clearChart('youtube-subscriber-chart');
      const ctx = youtubeSubscriberChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('No YouTube subscriber data available', 
                 youtubeSubscriberChart.width / 2, 
                 youtubeSubscriberChart.height / 2);
    }
    
    // YouTube geography
    const youtubeGeographyChart = document.getElementById('youtube-geography-chart');
    if (youtubeGeographyChart && youtubeGeographyData && youtubeGeographyData.length > 0) {
      debugLog('Creating YouTube geography chart with', youtubeGeographyData.length, 'entries');
      
      // Sort by views and take top 10
      const topCountries = [...youtubeGeographyData]
        .sort((a, b) => safeParseInt(b.Views) - safeParseInt(a.Views))
        .slice(0, 10);
      
      debugLog('Top YouTube countries:', topCountries);
      
      // Verify data has values
      if (topCountries.length === 0 || topCountries.every(country => safeParseInt(country.Views) === 0)) {
        clearChart('youtube-geography-chart');
        const ctx = youtubeGeographyChart.getContext('2d');
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No valid geography data available', 
                    youtubeGeographyChart.width / 2, 
                    youtubeGeographyChart.height / 2);
        return;
      }
      
      const geographyChartConfig = {
        type: 'bar',
        data: {
          labels: topCountries.map(data => data.Geography || 'Unknown'),
          datasets: [{
            label: 'Views',
            data: topCountries.map(data => safeParseInt(data.Views)),
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
    } else if (youtubeGeographyChart) {
      clearChart('youtube-geography-chart');
      const ctx = youtubeGeographyChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('No YouTube geography data available', 
                  youtubeGeographyChart.width / 2, 
                  youtubeGeographyChart.height / 2);
    }
  };
  
  // *** CRITICAL FIX: Update Facebook tab with robust field detection ***
  const updateFacebookTab = (filteredFbVideos) => {
    debugLog('Updating Facebook tab');
    
    // Facebook videos table
    const fbVideosTable = document.getElementById('fb-videos-table');
    if (fbVideosTable) {
      if (filteredFbVideos && filteredFbVideos.length > 0) {
        debugLog(`Creating Facebook videos table with ${filteredFbVideos.length} videos`);
        debugLog('FB Videos sample:', filteredFbVideos[0]);
        
        // Sort videos by views, with extra logging
        const topVideos = [...filteredFbVideos]
          .sort((a, b) => {
            const aViews = safeParseInt(a['3-second video views']);
            const bViews = safeParseInt(b['3-second video views']);
            debugLog(`Comparing views: ${aViews} vs ${bViews}`);
            return bViews - aViews;
          })
          .slice(0, 5);
        
        debugLog('Top FB videos:', topVideos);
        
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
              <td>${video.Title || 'Untitled Video'}</td>
              <td>${formatNumber(video['3-second video views'])}</td>
              <td>${formatNumber(video.Reactions)}</td>
              <td>${formatNumber(video.Comments)}</td>
              <td>${formatNumber(video.Shares)}</td>
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
    
    // Facebook video demographics chart - key bugfix for field mapping
    const fbDemographicsChart = document.getElementById('fb-demographics-chart');
    if (fbDemographicsChart) {
      if (filteredFbVideos && filteredFbVideos.length > 0) {
        debugLog('Creating Facebook demographics chart');
        
        // Get top video by views
        const topVideo = filteredFbVideos
          .sort((a, b) => safeParseInt(b['3-second video views']) - safeParseInt(a['3-second video views']))[0];
        
        debugLog('Top FB video for demographics:', topVideo);
        
        // FIX: Extract demographic data with proper field detection
        // The actual column names might vary, so check for variations
        const extractDemographicValue = (video, ageGender) => {
          // Try different possible field patterns
          const patterns = [
            `3-second video views by top audience (${ageGender})`,
            `3-second video views by top audience ${ageGender}`,
            `video views by audience (${ageGender})`,
            `video views by audience ${ageGender}`
          ];
          
          for (const pattern of patterns) {
            if (video[pattern] !== undefined) {
              return safeParseFloat(video[pattern]);
            }
          }
          return 0;
        };
        
        const demographicData = [
          {name: 'F, 18-24', value: extractDemographicValue(topVideo, 'F, 18-24')},
          {name: 'F, 25-34', value: extractDemographicValue(topVideo, 'F, 25-34')},
          {name: 'F, 35-44', value: extractDemographicValue(topVideo, 'F, 35-44')},
          {name: 'F, 45-54', value: extractDemographicValue(topVideo, 'F, 45-54')},
          {name: 'M, 18-24', value: extractDemographicValue(topVideo, 'M, 18-24')},
          {name: 'M, 25-34', value: extractDemographicValue(topVideo, 'M, 25-34')},
          {name: 'M, 35-44', value: extractDemographicValue(topVideo, 'M, 35-44')},
          {name: 'M, 45-54', value: extractDemographicValue(topVideo, 'M, 45-54')},
        ].filter(item => item.value > 0);
        
        debugLog('FB demographic data:', demographicData);
        
        // Verify data has values
        if (demographicData.length === 0) {
          // Try alternate approach - dump all demographics fields
          debugLog('No demographic data found with standard patterns, trying alternate approach');
          const alternativeDemographics = [];
          
          // Find any field that might contain demographic data
          Object.keys(topVideo).forEach(key => {
            if (key.includes('audience') || (key.includes('video views') && (key.includes('F,') || key.includes('M,')))) {
              const value = safeParseFloat(topVideo[key]);
              if (value > 0) {
                // Extract the demographic category from the field name
                let name = key.match(/\((.*?)\)/) || key.match(/(F,.*?|M,.*?)$/);
                name = name ? name[1] : key;
                alternativeDemographics.push({
                  name: name,
                  value: value
                });
              }
            }
          });
          
          if (alternativeDemographics.length > 0) {
            debugLog('Found alternative demographics:', alternativeDemographics);
            demographicData.push(...alternativeDemographics);
          }
        }
        
        // Still no data? Show message
        if (demographicData.length === 0) {
          clearChart('fb-demographics-chart');
          const ctx = fbDemographicsChart.getContext('2d');
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f6ad55';
          ctx.textAlign = 'center';
          ctx.fillText('No demographic data available for selected videos', 
                      fbDemographicsChart.width / 2, 
                      fbDemographicsChart.height / 2);
          return;
        }
        
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
    debugLog('Updating Instagram tab');
    
    // Instagram posts table
    const topIgPostsTable = document.getElementById('top-ig-posts-table');
    if (topIgPostsTable) {
      if (filteredIgPosts && filteredIgPosts.length > 0) {
        debugLog(`Creating Instagram posts table with ${filteredIgPosts.length} posts`);
        
        const topPosts = [...filteredIgPosts]
          .sort((a, b) => safeParseInt(b.Reach) - safeParseInt(a.Reach))
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
          const description = post.Description || 'No description';
          tableHtml += `
            <tr>
              <td>${description.length > 30 ? description.substring(0, 30) + '...' : description}</td>
              <td>${formatNumber(post.Reach)}</td>
              <td>${formatNumber(post.Likes)}</td>
              <td>${formatNumber(post.Comments)}</td>
              <td>${formatNumber(post.Shares)}</td>
              <td>${formatNumber(post.Saves)}</td>
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
        debugLog('Creating Instagram engagement chart');
        
        const engagementData = [
          { name: 'Likes', value: filteredIgPosts.reduce((sum, post) => sum + safeParseInt(post.Likes), 0) },
          { name: 'Comments', value: filteredIgPosts.reduce((sum, post) => sum + safeParseInt(post.Comments), 0) },
          { name: 'Shares', value: filteredIgPosts.reduce((sum, post) => sum + safeParseInt(post.Shares), 0) },
          { name: 'Saves', value: filteredIgPosts.reduce((sum, post) => sum + safeParseInt(post.Saves), 0) }
        ];
        
        const totalEngagement = engagementData.reduce((sum, item) => sum + item.value, 0);
        
        // Verify data has values
        if (totalEngagement <= 0) {
          clearChart('ig-demographics-chart');
          const ctx = igDemographicsChart.getContext('2d');
          ctx.font = '14px Arial';
          ctx.fillStyle = '#f6ad55';
          ctx.textAlign = 'center';
          ctx.fillText('No engagement data available for selected posts', 
                      igDemographicsChart.width / 2, 
                      igDemographicsChart.height / 2);
          return;
        }
        
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
    debugLog('Initializing Marketing Analytics Dashboard');
    
    // Create global chart instances container if it doesn't exist
    window.chartInstances = window.chartInstances || {};
    
    // Insert date filter container
    insertDateFilter();
    
    // Set up tab navigation
    setupTabNavigation();
    
    // Clear all charts before loading data
    for (const canvasId in window.chartInstances) {
      clearChart(canvasId);
    }
    
    // Load data
    loadCSVData();
  };
  
  // Start the dashboard when DOM is fully loaded
  initDashboard();
})();