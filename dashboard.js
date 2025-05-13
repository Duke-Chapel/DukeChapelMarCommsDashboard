// Main dashboard script that integrates all components - UPDATED VERSION
document.addEventListener('DOMContentLoaded', function () {
  console.log('Initializing Marketing Analytics Dashboard');

  // Track initialization state
  let dashboardInitialized = false;
  let initialLoadComplete = false;

  // Create service instances
  const dataService = createDataService();
  const chartService = createChartService();
  const tableService = createTableService();
  const kpiCards = createKpiCards();

  // Initialize loader
  const showLoader = () => {
    let loader = document.getElementById('dashboard-loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.id = 'dashboard-loader';
      loader.className = 'loader';
      loader.style.display = 'block';
      document.querySelector('.container').appendChild(loader);
    } else {
      loader.style.display = 'block';
    }
  };

  const hideLoader = () => {
    const loader = document.getElementById('dashboard-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  };

  // ==================
  // Tab Navigation
  // ==================

  // FIXED: Improved tab navigation with Bootstrap and fallback support
  const setupTabNavigation = () => {
    console.log('Setting up tab navigation');

    // Check if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tab) {
      console.log('Using Bootstrap tab implementation');

      try {
        // Manually initialize all tabs
        const tabElements = document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-toggle="pill"]');
        tabElements.forEach(tabEl => {
          try {
            new bootstrap.Tab(tabEl);
          } catch (error) {
            console.error('Error initializing Bootstrap tab:', error);
          }
        });

        // Add event listeners for tab changes to trigger updates
        document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link').forEach(tab => {
          tab.addEventListener('shown.bs.tab', function (event) {
            console.log(`Tab changed to: ${event.target.getAttribute('id')}`);

            // Refresh charts in the newly shown tab
            const targetId = event.target.getAttribute('data-bs-target') || event.target.getAttribute('href');
            if (targetId) {
              refreshChartsInContainer(targetId);
            }
          });
        });
      } catch (error) {
        console.error('Error setting up Bootstrap tabs:', error);
        // Fallback to custom implementation
        setupCustomTabNavigation();
      }
    } else {
      console.warn('Bootstrap JavaScript is not available. Using custom tab implementation.');
      setupCustomTabNavigation();
    }
  };

  // FIXED: Custom tab implementation as fallback
  const setupCustomTabNavigation = () => {
    console.log('Setting up custom tab navigation');
    const tabs = document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link');

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();

        try {
          // Find all tabs in the same group
          const parent = tab.closest('.nav-tabs, .nav-pills');
          if (!parent) {
            console.warn('Tab parent not found');
            return;
          }

          const allTabs = parent.querySelectorAll('.nav-link');

          // Remove active class from all tabs
          allTabs.forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });

          // Add active class to clicked tab
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          // Find target content
          const targetId = tab.getAttribute('data-bs-target') || tab.getAttribute('href');

          if (targetId && targetId.startsWith('#')) {
            // Find all content panes
            const tabContent = document.querySelector('.tab-content');
            if (tabContent) {
              const allPanes = tabContent.querySelectorAll('.tab-pane');

              // Hide all panes
              allPanes.forEach(pane => {
                pane.classList.remove('show', 'active');
              });

              // Show target pane
              const targetPane = document.querySelector(targetId);
              if (targetPane) {
                targetPane.classList.add('show', 'active');

                // Refresh charts in the shown pane
                refreshChartsInContainer(targetId);
              } else {
                console.warn(`Target pane ${targetId} not found`);
              }
            } else {
              console.warn('Tab content container not found');
            }
          } else {
            console.warn(`Invalid target id: ${targetId}`);
          }
        } catch (error) {
          console.error('Error in custom tab navigation:', error);
        }
      });
    });
  };

  // ==================
  // Chart Refreshing
  // ==================

  // FIXED: Refresh charts in a specific container
  const refreshChartsInContainer = (containerId) => {
    if (!containerId) return;

    try {
      // Remove # if present
      const id = containerId.startsWith('#') ? containerId.substring(1) : containerId;
      const container = document.getElementById(id);

      if (!container) {
        console.warn(`Container "${id}" not found for chart refresh`);
        return;
      }

      console.log(`Refreshing charts in container: ${id}`);

      // Find all canvases in the container
      const canvases = container.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        if (canvas.id && window.chartInstances && window.chartInstances[canvas.id]) {
          try {
            console.log(`Updating chart: ${canvas.id}`);
            window.chartInstances[canvas.id].update();
          } catch (error) {
            console.error(`Error updating chart ${canvas.id}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('Error refreshing charts:', error);
    }
  };

  // ==================
  // Dashboard Updates
  // ==================

  // Dashboard update function
  const updateDashboard = (dateRanges) => {
    console.log('Updating dashboard with date ranges:', dateRanges);

    showLoader();

    // Update each section of the dashboard
    try {
      updateOverviewTab(dateRanges);
      updateEmailTab(dateRanges);
      updateSocialTabs(dateRanges);
      updateYouTubeTab(dateRanges);
      updateWebAnalyticsTab(dateRanges);

      // Wait a moment before refreshing charts to ensure DOM is updated
      setTimeout(() => {
        // Find the active tab
        const activeTab = document.querySelector('.tab-pane.active');
        if (activeTab) {
          refreshChartsInContainer(activeTab.id);
        }

        hideLoader();
      }, 100);
    } catch (error) {
      console.error('Error updating dashboard:', error);
      hideLoader();

      // Show error message
      showErrorMessage('Error updating dashboard: ' + error.message);
    }
  };

  // FIXED: Show error message to user
  const showErrorMessage = (message) => {
    console.error(message);

    try {
      // Create error alert if it doesn't exist yet
      let errorAlert = document.getElementById('dashboard-error');
      if (!errorAlert) {
        errorAlert = document.createElement('div');
        errorAlert.id = 'dashboard-error';
        errorAlert.className = 'alert alert-danger alert-dismissible fade show';
        errorAlert.setAttribute('role', 'alert');

        // Add close button
        errorAlert.innerHTML = `
        <span id="error-message"></span>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;

        // Insert at the top of the container
        const container = document.querySelector('.container');
        if (container && container.firstChild) {
          container.insertBefore(errorAlert, container.firstChild);
        }
      }

      // Update error message
      const errorMessageElement = document.getElementById('error-message');
      if (errorMessageElement) {
        errorMessageElement.textContent = message;
      }

      // Show the error
      errorAlert.style.display = 'block';

      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (errorAlert) {
          errorAlert.style.display = 'none';
        }
      }, 5000);
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  };

  // ==================
  // Date Filter Setup
  // ==================

  // FIXED: Create date filter with proper callback
  const dateFilter = createEnhancedDateFilter(updateDashboard);

  // ==================
  // Dashboard Initialization
  // ==================

  // FIXED: Improved dashboard initialization with error handling
  const initDashboard = async () => {
    console.log('Initializing dashboard...');

    if (dashboardInitialized) {
      console.log('Dashboard already initialized, skipping initialization');
      return;
    }

    try {
      // Show loading state
      showLoader();
      document.getElementById('last-updated').textContent = 'Loading...';

      // Load all data
      console.log('Loading data...');
      const { data, errors, availableDates } = await dataService.loadAllData();

      // Update last updated time
      document.getElementById('last-updated').textContent = new Date().toLocaleString();

      // Set available dates in the date filter
      console.log('Setting available dates:', availableDates);

      // Make sure we have valid dates before initializing the filter
      if (availableDates && availableDates.earliestDate && availableDates.latestDate) {
        dateFilter.setAvailableDates(availableDates.earliestDate, availableDates.latestDate);
      } else {
        console.warn('No valid date range found in data, using default range');
        // Use 1 year ago to today as fallback
        const now = new Date();
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        dateFilter.setAvailableDates(oneYearAgo, now);
      }

      // Render the date filter
      console.log('Rendering date filter...');
      dateFilter.render();

      // Setup tab navigation
      console.log('Setting up tab navigation...');
      setupTabNavigation();

      // Update dashboard with initial data
      console.log('Performing initial dashboard update...');
      updateDashboard(dateFilter.getCurrentDateFilter());

      // Show any errors
      if (errors && Object.keys(errors).length > 0) {
        console.error('Data loading errors:', errors);

        // Create error container if it doesn't exist
        let errorContainer = document.querySelector('#error-container');
        if (!errorContainer) {
          errorContainer = document.createElement('div');
          errorContainer.id = 'error-container';
          errorContainer.className = 'alert alert-warning mb-4 dashboard-section';

          // Create error content
          let errorContent = '<h4 class="alert-heading">Data Loading Issues</h4>' +
            '<p>Some data files could not be loaded. The dashboard may show incomplete information:</p>' +
            '<ul class="error-list mb-0">';

          // Add each error
          for (const [file, error] of Object.entries(errors)) {
            errorContent += `<li>${file}: ${error}</li>`;
          }

          errorContent += '</ul>';
          errorContainer.innerHTML = errorContent;

          // Insert at top of container
          const container = document.querySelector('.container');
          if (container) {
            container.insertBefore(errorContainer, container.firstChild);
          }
        }
      }

      dashboardInitialized = true;
      initialLoadComplete = true;
      hideLoader();

      console.log('Dashboard initialization complete!');
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      document.getElementById('last-updated').textContent = 'Error loading data';
      hideLoader();

      // Show error message
      showErrorMessage('Error initializing dashboard: ' + (error.message || 'Unknown error'));
    }
  };

  // ==================
  // Tab Updates
  // ==================

  // Update the Overview tab
  const updateOverviewTab = (dateRanges) => {
    console.log('Updating Overview tab');

    try {
      // Analyze data for each platform
      const emailData = dataService.analyzeEmailData(dateRanges);
      const fbData = dataService.analyzeFacebookData(dateRanges);
      const igData = dataService.analyzeInstagramData(dateRanges);
      const ytData = dataService.analyzeYoutubeData(dateRanges);

      // Create KPI cards for key metrics
      kpiCards.createKpiSection('overview-metrics', 'Cross-Channel Performance', [
        {
          title: 'Email Subscribers',
          currentValue: emailData.metrics.subscribers,
          comparisonValue: emailData.metrics.subscribersComparison,
          type: 'number'
        },
        {
          title: 'Email Open Rate',
          currentValue: emailData.metrics.subscribers ? (emailData.metrics.opens / emailData.metrics.subscribers) * 100 : 0,
          comparisonValue: emailData.metrics.subscribersComparison ?
            (emailData.metrics.opensComparison / emailData.metrics.subscribersComparison) * 100 : null,
          type: 'percent'
        },
        {
          title: 'Facebook Video Views',
          currentValue: fbData.metrics.views,
          comparisonValue: fbData.metrics.viewsComparison,
          type: 'number'
        },
        {
          title: 'Instagram Reach',
          currentValue: igData.metrics.reach,
          comparisonValue: igData.metrics.reachComparison,
          type: 'number'
        }
      ]);

      // Channel traffic comparison chart
      if (document.getElementById('channel-traffic-chart')) {
        // Prepare data for the chart
        const channelLabels = ['Email Opens', 'Facebook Views', 'Instagram Reach', 'YouTube Views'];

        const currentData = [
          emailData.metrics.opens || 0,
          fbData.metrics.views || 0,
          igData.metrics.reach || 0,
          ytData.subscriptionData.reduce((sum, item) => sum + (item.views || 0), 0) || 0
        ];

        const comparisonData = dateRanges.comparison.enabled ? [
          emailData.metrics.opensComparison || 0,
          fbData.metrics.viewsComparison || 0,
          igData.metrics.reachComparison || 0,
          0 // YouTube comparison not available
        ] : null;

        // Create the chart
        chartService.createComparisonBarChart(
          'channel-traffic-chart',
          'Channel Traffic Comparison',
          channelLabels,
          currentData,
          comparisonData,
          {
            current: '#4299e1',
            currentBorder: '#3182ce',
            comparison: '#9f7aea',
            comparisonBorder: '#805ad5'
          },
          'Views/Opens'
        );
      }

      // Engagement comparison chart
      if (document.getElementById('engagement-chart')) {
        // Calculate engagement rates with safety checks
        const emailEngagementRate = emailData.metrics.subscribers && emailData.metrics.subscribers > 0
          ? (emailData.metrics.clicks / emailData.metrics.subscribers) * 100
          : 0;

        const fbEngagementRate = fbData.metrics.views && fbData.metrics.views > 0
          ? (fbData.metrics.engagement / fbData.metrics.views) * 100
          : 0;

        const igEngagementRate = igData.metrics.reach && igData.metrics.reach > 0
          ? (igData.metrics.engagement / igData.metrics.reach) * 100
          : 0;

        // YouTube engagement (subscribed views percentage)
        const ytSubscribedViews = ytData.subscriptionData.find(item =>
          item.status === 'Subscribed')?.views || 0;
        const ytTotalViews = ytData.subscriptionData.reduce(
          (sum, item) => sum + (item.views || 0), 0) || 1; // Avoid division by zero
        const ytEngagementRate = (ytSubscribedViews / ytTotalViews) * 100;

        // Create radar chart for engagement
        const datasets = [
          {
            label: 'Engagement Rate (%)',
            data: [
              emailEngagementRate,
              fbEngagementRate,
              igEngagementRate,
              ytEngagementRate
            ],
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(75, 192, 192, 1)'
          }
        ];

        chartService.createRadarChart(
          'engagement-chart',
          'Engagement by Platform',
          ['Email', 'Facebook', 'Instagram', 'YouTube'],
          datasets
        );
      }
    } catch (error) {
      console.error('Error updating Overview tab:', error);
      showErrorMessage('Error updating Overview tab: ' + error.message);
    }
  };

  // Update the Email tab
  const updateEmailTab = (dateRanges) => {
    console.log('Updating Email tab');

    try {
      // Analyze email data
      const emailData = dataService.analyzeEmailData(dateRanges);

      // Email performance chart
      if (document.getElementById('email-performance-chart')) {
        const campaigns = emailData.topCampaigns;

        if (campaigns && campaigns.length > 0) {
          const labels = campaigns.map(campaign => {
            const name = campaign.name || 'Unnamed Campaign';
            return name.length > 15 ? name.substring(0, 15) + '...' : name;
          });

          const openRates = campaigns.map(campaign => campaign.openRate || 0);
          const clickRates = campaigns.map(campaign => campaign.clickRate || 0);

          chartService.createBarChart(
            'email-performance-chart',
            'Email Campaign Performance',
            labels,
            openRates,
            null,
            {
              current: '#4299e1',
              currentBorder: '#3182ce'
            },
            'Open Rate (%)'
          );
        } else {
          chartService.clearChart('email-performance-chart');
        }
      }

      // Email engagement segmentation chart
      if (document.getElementById('email-engagement-chart')) {
        if (typeof emailData.engagement.notOpened === 'number' ||
          typeof emailData.engagement.openedNotClicked === 'number' ||
          typeof emailData.engagement.clicked === 'number') {

          // Ensure values are not negative
          const notOpened = Math.max(0, emailData.engagement.notOpened || 0);
          const openedNotClicked = Math.max(0, emailData.engagement.openedNotClicked || 0);
          const clicked = Math.max(0, emailData.engagement.clicked || 0);

          // Only show chart if we have some data
          if (notOpened > 0 || openedNotClicked > 0 || clicked > 0) {
            chartService.createPieChart(
              'email-engagement-chart',
              'Email Engagement Segmentation',
              ['Not Opened', 'Opened (No Click)', 'Clicked'],
              [notOpened, openedNotClicked, clicked],
              ['#fc8181', '#f6ad55', '#68d391']
            );
          } else {
            chartService.clearChart('email-engagement-chart');
          }
        } else {
          chartService.clearChart('email-engagement-chart');
        }
      }

      // Top email campaigns table
      if (document.getElementById('top-email-campaigns-table')) {
        tableService.createEmailCampaignsTable(
          'top-email-campaigns-table',
          emailData.topCampaigns
        );
      }
    } catch (error) {
      console.error('Error updating Email tab:', error);
      showErrorMessage('Error updating Email tab: ' + error.message);
    }
  };

  // Update the Social Media tabs
  const updateSocialTabs = (dateRanges) => {
    console.log('Updating Social Media tabs');

    try {
      // Update Facebook tab
      updateFacebookTab(dateRanges);

      // Update Instagram tab
      updateInstagramTab(dateRanges);
    } catch (error) {
      console.error('Error updating Social tabs:', error);
      showErrorMessage('Error updating Social tabs: ' + error.message);
    }
  };

  // Update the Facebook tab
  const updateFacebookTab = (dateRanges) => {
    console.log('Updating Facebook tab');

    try {
      // Analyze Facebook data
      const fbData = dataService.analyzeFacebookData(dateRanges);

      // Facebook demographics chart
      if (document.getElementById('fb-demographics-chart')) {
        if (fbData.demographics && fbData.demographics.length > 0) {
          // Sort by value and take top 10
          const sortedDemographics = [...fbData.demographics]
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

          chartService.createHorizontalBarChart(
            'fb-demographics-chart',
            'Facebook Audience Demographics',
            sortedDemographics.map(item => item.name || 'Unknown'),
            sortedDemographics.map(item => (item.value || 0) * 100),
            null,
            {
              current: '#4c51bf',
              currentBorder: '#434190'
            },
            'Percentage (%)'
          );
        } else {
          chartService.clearChart('fb-demographics-chart');
        }
      }

      // Facebook follower growth chart (placeholder)
      if (document.getElementById('fb-followers-chart')) {
        chartService.clearChart('fb-followers-chart');
        const canvas = document.getElementById('fb-followers-chart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Follower growth data not available', canvas.width / 2, canvas.height / 2);
          }
        }
      }

      // Facebook videos table
      if (document.getElementById('fb-videos-table')) {
        tableService.createFBVideosTable(
          'fb-videos-table',
          fbData.topVideos
        );
      }
    } catch (error) {
      console.error('Error updating Facebook tab:', error);
      showErrorMessage('Error updating Facebook tab: ' + error.message);
    }
  };

  // Update the Instagram tab
  const updateInstagramTab = (dateRanges) => {
    console.log('Updating Instagram tab');

    try {
      // Analyze Instagram data
      const igData = dataService.analyzeInstagramData(dateRanges);

      // Instagram engagement distribution chart
      if (document.getElementById('ig-demographics-chart')) {
        if (igData.engagement && igData.engagement.length > 0) {
          // Filter out zero values
          const engagementData = igData.engagement.filter(item => item.value > 0);

          if (engagementData.length > 0) {
            chartService.createPieChart(
              'ig-demographics-chart',
              'Instagram Engagement Distribution',
              engagementData.map(item => item.name || 'Unknown'),
              engagementData.map(item => item.value || 0),
              ['#fc8181', '#f6ad55', '#4299e1', '#68d391']
            );
          } else {
            chartService.clearChart('ig-demographics-chart');
          }
        } else {
          chartService.clearChart('ig-demographics-chart');
        }
      }

      // Instagram follower growth chart (placeholder)
      if (document.getElementById('ig-followers-chart')) {
        chartService.clearChart('ig-followers-chart');
        const canvas = document.getElementById('ig-followers-chart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Follower growth data not available', canvas.width / 2, canvas.height / 2);
          }
        }
      }

      // Instagram posts table
      if (document.getElementById('top-ig-posts-table')) {
        tableService.createIGPostsTable(
          'top-ig-posts-table',
          igData.topPosts
        );
      }
    } catch (error) {
      console.error('Error updating Instagram tab:', error);
      showErrorMessage('Error updating Instagram tab: ' + error.message);
    }
  };

  // Update the YouTube tab
  const updateYouTubeTab = (dateRanges) => {
    console.log('Updating YouTube tab');

    try {
      // Analyze YouTube data
      const ytData = dataService.analyzeYoutubeData(dateRanges);

      // YouTube age demographics chart
      if (document.getElementById('youtube-age-chart')) {
        if (ytData.ageData && ytData.ageData.length > 0) {
          chartService.createBarChart(
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
        } else {
          chartService.clearChart('youtube-age-chart');
        }
      }

      // YouTube gender demographics chart
      if (document.getElementById('youtube-gender-chart')) {
        if (ytData.genderData && ytData.genderData.length > 0) {
          // Filter out zero values
          const genderData = ytData.genderData.filter(item => item.views > 0);

          if (genderData.length > 0) {
            chartService.createPieChart(
              'youtube-gender-chart',
              'YouTube Gender Demographics',
              genderData.map(item => item.gender || 'Unknown'),
              genderData.map(item => item.views || 0),
              ['#4c51bf', '#ed64a6', '#ecc94b']
            );
          } else {
            chartService.clearChart('youtube-gender-chart');
          }
        } else {
          chartService.clearChart('youtube-gender-chart');
        }
      }

      // YouTube subscriber status chart
      if (document.getElementById('youtube-subscriber-chart')) {
        if (ytData.subscriptionData && ytData.subscriptionData.length > 0) {
          // Filter out zero values
          const subData = ytData.subscriptionData.filter(item => item.views > 0);

          if (subData.length > 0) {
            chartService.createDoughnutChart(
              'youtube-subscriber-chart',
              'Subscriber vs. Non-Subscriber Views',
              subData.map(item => item.status || 'Unknown'),
              subData.map(item => item.views || 0),
              ['#48bb78', '#4299e1']
            );
          } else {
            chartService.clearChart('youtube-subscriber-chart');
          }
        } else {
          chartService.clearChart('youtube-subscriber-chart');
        }
      }

      // YouTube geography chart
      if (document.getElementById('youtube-geography-chart')) {
        if (ytData.topCountries && ytData.topCountries.length > 0) {
          const topN = ytData.topCountries.slice(0, 10); // Limit to top 10

          chartService.createHorizontalBarChart(
            'youtube-geography-chart',
            'Top Countries by Views',
            topN.map(item => item.country || 'Unknown'),
            topN.map(item => item.views || 0),
            null,
            {
              current: '#4c51bf',
              currentBorder: '#434190'
            },
            'Views'
          );
        } else {
          chartService.clearChart('youtube-geography-chart');
        }
      }
    } catch (error) {
      console.error('Error updating YouTube tab:', error);
      showErrorMessage('Error updating YouTube tab: ' + error.message);
    }
  };

  // Update the Web Analytics tab
  const updateWebAnalyticsTab = (dateRanges) => {
    console.log('Updating Web Analytics tab');

    try {
      // Web Demographics chart (placeholder)
      if (document.getElementById('web-demographics-chart')) {
        chartService.clearChart('web-demographics-chart');
        const canvas = document.getElementById('web-demographics-chart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Web demographics data not available', canvas.width / 2, canvas.height / 2);
          }
        }
      }

      // Traffic sources chart (placeholder)
      if (document.getElementById('traffic-sources-chart')) {
        chartService.clearChart('traffic-sources-chart');
        const canvas = document.getElementById('traffic-sources-chart');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#6c757d';
            ctx.textAlign = 'center';
            ctx.fillText('Traffic sources data not available', canvas.width / 2, canvas.height / 2);
          }
        }
      }

      // Top landing pages table (placeholder)
      if (document.getElementById('top-pages-table')) {
        const topPagesTable = document.getElementById('top-pages-table');
        topPagesTable.innerHTML = `
          <thead>
            <tr>
              <th>Page</th>
              <th>Sessions</th>
              <th>Engagement Time</th>
              <th>Bounce Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="4" class="text-center text-warning">
                Web analytics data not available
              </td>
            </tr>
          </tbody>
        `;
      }
    } catch (error) {
      console.error('Error updating Web Analytics tab:', error);
      showErrorMessage('Error updating Web Analytics tab: ' + error.message);
    }
  };

  // ==================
  // Window Resize Handling
  // ==================

  // FIXED: Handle window resizes to adjust charts
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Find the active tab
      const activeTab = document.querySelector('.tab-pane.active');
      if (activeTab) {
        refreshChartsInContainer(activeTab.id);
      }
    }, 300); // debounce
  });

  // ==================
  // Error Handling for Global Errors
  // ==================

  // FIXED: Global error handler
  window.addEventListener('error', function (event) {
    console.error('Global error caught:', event.error);
    if (!initialLoadComplete) {
      // Only show critical errors during initial load
      showErrorMessage('Error loading dashboard: ' + (event.error?.message || 'Unknown error'));
      hideLoader();
    }
  });

  // ==================
  // Initialization
  // ==================

  // Call the init function
  initDashboard();

  // Expose api for debugging
  window.dashboardApi = {
    refresh: () => {
      updateDashboard(dateFilter.getCurrentDateFilter());
    },
    reloadData: () => {
      dashboardInitialized = false;
      initDashboard();
    }
  };
});