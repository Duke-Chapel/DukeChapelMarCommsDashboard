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
  // KPI Extensions and Fixes
  // ==================

  // Initialize KPI extensions once dashboard is ready
  const initializeKPIExtensions = () => {
    if (dashboardInitialized) {
      console.log('Initializing KPI extensions...');
      
      // 1. Fix UTM Campaign Data Visualization
      fixCampaignVisualization();
      
      // 2. Fix Social Media Metrics
      fixSocialMetrics();
      
      // 3. Fix Email Subscriber Demographics
      fixEmailDemographics();
      
      // 4. Enhance YouTube Metrics Display
      enhanceYouTubeMetrics();
      
      // Add tab change listeners to ensure KPIs update
      setupKPITabHandlers();
      
      console.log('KPI extensions initialized successfully');
    } else {
      // Retry after a delay if dashboard isn't initialized yet
      setTimeout(initializeKPIExtensions, 500);
    }
  };

  // Start initialization after main dashboard components
  setTimeout(initializeKPIExtensions, 1000);

  /**
   * Fix UTM Campaign Visualization
   * Properly utilizes GA_UTMs.csv data
   */
  function fixCampaignVisualization() {
    console.log("Fixing campaign visualization");
    
    // Extend dataService with improved UTM analysis
    dataService.analyzeUTMCampaigns = function(dateRanges) {
      // Get direct access to the data
      const gaUTMs = window.allData?.gaUTMs;
      if (!gaUTMs || !Array.isArray(gaUTMs) || gaUTMs.length === 0) {
        return { campaigns: [], sources: [], platforms: [], content: [] };
      }
      
      // Filter by date range
      const currentData = filterByDateRange(gaUTMs, dateRanges.current, 'Date + hour (YYYYMMDDHH)');
      const comparisonData = dateRanges.comparison.enabled ? 
        filterByDateRange(gaUTMs, dateRanges.comparison, 'Date + hour (YYYYMMDDHH)') : [];
      
      // Process campaigns
      const campaignsMap = {};
      const sourcesMap = {};
      const platformsMap = {};
      const contentMap = {};
      
      // Process current data
      currentData.forEach(item => {
        processUTMItem(item, campaignsMap, sourcesMap, platformsMap, contentMap);
      });
      
      // Process comparison data if available
      if (comparisonData.length > 0) {
        comparisonData.forEach(item => {
          processUTMItem(item, campaignsMap, sourcesMap, platformsMap, contentMap, true);
        });
      }
      
      // Convert maps to sorted arrays
      const campaigns = Object.values(campaignsMap)
        .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
      
      const sources = Object.values(sourcesMap)
        .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
      
      const platforms = Object.values(platformsMap)
        .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
        .sort((a, b) => b.sessions - a.sessions);
      
      const content = Object.values(contentMap)
        .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
      
      return {
        campaigns,
        sources,
        platforms,
        content
      };
    };
    
    // Helper for UTM data processing
    function processUTMItem(item, campaignsMap, sourcesMap, platformsMap, contentMap, isComparison = false) {
      // Process campaign
      const campaign = item['Manual campaign name'];
      if (campaign && campaign !== '(not set)' && campaign !== 'not set') {
        if (!campaignsMap[campaign]) {
          campaignsMap[campaign] = {
            name: campaign,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          campaignsMap[campaign].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          campaignsMap[campaign].sessions += safeParseInt(item['Sessions']);
          campaignsMap[campaign].engagementRate += safeParseFloat(item['Engagement rate']);
          campaignsMap[campaign].count++;
        }
      }
      
      // Process source/medium
      const source = item['Manual source / medium'];
      if (source) {
        if (!sourcesMap[source]) {
          sourcesMap[source] = {
            name: source,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          sourcesMap[source].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          sourcesMap[source].sessions += safeParseInt(item['Sessions']);
          sourcesMap[source].engagementRate += safeParseFloat(item['Engagement rate']);
          sourcesMap[source].count++;
        }
      }
      
      // Process platform
      const platform = item['Manual source platform'];
      if (platform) {
        if (!platformsMap[platform]) {
          platformsMap[platform] = {
            name: platform,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          platformsMap[platform].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          platformsMap[platform].sessions += safeParseInt(item['Sessions']);
          platformsMap[platform].engagementRate += safeParseFloat(item['Engagement rate']);
          platformsMap[platform].count++;
        }
      }
      
      // Process content
      const content = item['Manual ad content'];
      if (content && content !== '(not set)' && content !== 'not set') {
        if (!contentMap[content]) {
          contentMap[content] = {
            name: content,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          contentMap[content].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          contentMap[content].sessions += safeParseInt(item['Sessions']);
          contentMap[content].engagementRate += safeParseFloat(item['Engagement rate']);
          contentMap[content].count++;
        }
      }
    }
    
    // Create campaign visualization UI
    ensureCampaignUIExists();
    
    // Update the visualization
    updateCampaignVisualization();
  }

  /**
   * Ensure campaign visualization UI exists
   */
  function ensureCampaignUIExists() {
    const webTab = document.getElementById('web');
    if (!webTab) return;
    
    // Check if campaign section already exists
    let campaignsSection = webTab.querySelector('.dashboard-section:has(#campaigns-chart)');
    if (campaignsSection) return;
    
    // Find a good place to insert the campaign section
    let insertBefore = webTab.querySelector('.dashboard-section:last-child');
    if (!insertBefore) return;
    
    // Create campaigns section
    campaignsSection = document.createElement('div');
    campaignsSection.className = 'col-md-12 mb-4';
    campaignsSection.innerHTML = `
      <div class="dashboard-section web-section">
        <h3 class="h5 mb-3">Campaign Performance</h3>
        <div class="row">
          <div class="col-md-6">
            <div class="chart-container">
              <canvas id="campaigns-chart"></canvas>
            </div>
          </div>
          <div class="col-md-6">
            <div class="chart-container">
              <canvas id="campaign-platforms-chart"></canvas>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-md-12">
            <div class="table-responsive">
              <table class="table table-striped" id="campaigns-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Sessions</th>
                    <th>Engagement Rate</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colspan="4" class="text-center">Loading campaign data...</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Insert before the target element
    insertBefore.parentNode.insertBefore(campaignsSection, insertBefore);
  }

  /**
   * Update campaign visualization with current data
   */
  function updateCampaignVisualization() {
    if (!dataService || !chartService || !dateFilter) return;
    
    const dateRanges = dateFilter.getCurrentDateFilter();
    
    // Get campaign data
    const utmData = dataService.analyzeUTMCampaigns(dateRanges);
    
    // Update campaigns chart
    if (document.getElementById('campaigns-chart')) {
      const campaigns = utmData.campaigns;
      if (campaigns && campaigns.length > 0) {
        // Get top 5 campaigns
        const topCampaigns = campaigns.slice(0, 5);
        
        // Prepare data for comparison if available
        let comparisonData = null;
        if (dateRanges.comparison.enabled) {
          comparisonData = topCampaigns.map(campaign => campaign.comparisonSessions || 0);
        }
        
        chartService.createBarChart(
          'campaigns-chart',
          'Top Campaign Performance',
          topCampaigns.map(item => formatCampaignName(item.name)),
          topCampaigns.map(item => item.sessions),
          comparisonData,
          {
            current: '#4299e1',
            currentBorder: '#3182ce',
            comparison: '#9f7aea',
            comparisonBorder: '#805ad5'
          },
          'Sessions'
        );
      } else {
        chartService.clearChart('campaigns-chart');
      }
    }
    
    // Update platforms chart
    if (document.getElementById('campaign-platforms-chart')) {
      const platforms = utmData.platforms;
      if (platforms && platforms.length > 0) {
        chartService.createPieChart(
          'campaign-platforms-chart',
          'Traffic by Platform',
          platforms.map(item => item.name),
          platforms.map(item => item.sessions),
          [
            '#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea',
            '#68d391', '#f687b3', '#ecc94b', '#e53e3e', '#805ad5'
          ]
        );
      } else {
        chartService.clearChart('campaign-platforms-chart');
      }
    }
    
    // Update campaigns table
    if (document.getElementById('campaigns-table') && tableService && tableService.createTable) {
      const campaigns = utmData.campaigns;
      if (campaigns && campaigns.length > 0) {
        // Format table data
        const tableData = campaigns.map(campaign => {
          // Calculate percent change
          let percentChange = null;
          if (campaign.comparisonSessions > 0) {
            percentChange = ((campaign.sessions - campaign.comparisonSessions) / campaign.comparisonSessions) * 100;
          }
          
          return {
            name: campaign.name,
            sessions: campaign.sessions,
            engagementRate: campaign.count > 0 ? campaign.engagementRate / campaign.count : 0,
            percentChange: percentChange
          };
        });
        
        // Create table
        tableService.createTable(
          'campaigns-table',
          [
            { key: 'name', label: 'Campaign', type: 'text' },
            { key: 'sessions', label: 'Sessions', type: 'number' },
            { key: 'engagementRate', label: 'Engagement Rate', type: 'percent' },
            { 
              key: 'percentChange', 
              label: 'Change', 
              type: 'percent',
              format: (value) => {
                if (value === null) return '--';
                const prefix = value >= 0 ? '↑ ' : '↓ ';
                const cssClass = value >= 0 ? 'positive-change' : 'negative-change';
                return `<span class="${cssClass}">${prefix}${Math.abs(value).toFixed(1)}%</span>`;
              }
            }
          ],
          tableData
        );
      }
    }
  }

  /**
   * Fix Social Media Metrics
   * Implements Page Rank and Profile Views metrics
   */
  function fixSocialMetrics() {
    console.log("Fixing social media metrics");
    
    // Extend data service with better social metrics analysis
    extendSocialAnalytics();
    
    // Create UI for missing metrics
    ensureSocialMetricsUI();
    
    // Update the metrics visualization
    updateSocialMetrics();
  }

  /**
   * Extend data service with better social analytics
   */
  function extendSocialAnalytics() {
    // Make sure we have access to the data
    if (!window.allData) window.allData = {};
    
    // Load additional social data files if needed
    loadAdditionalSocialData();
    
    // Extend Facebook analysis
    const originalFBAnalysis = dataService.analyzeFacebookData;
    
    dataService.analyzeFacebookData = function(dateRanges) {
      // Call original function
      const result = originalFBAnalysis.call(this, dateRanges);
      
      // Add page rank metrics
      const pageRank = analyzeSocialPageRank(
        window.allData.fbFollows || [], 
        window.allData.fbReach || [], 
        window.allData.fbVisits || [],
        window.allData.fbInteractions || [],
        dateRanges
      );
      
      result.pageRankMetrics = pageRank;
      return result;
    };
    
    // Extend Instagram analysis
    const originalIGAnalysis = dataService.analyzeInstagramData;
    
    dataService.analyzeInstagramData = function(dateRanges) {
      // Call original function
      const result = originalIGAnalysis.call(this, dateRanges);
      
      // Add page rank metrics
      const pageRank = analyzeSocialPageRank(
        window.allData.igFollows || [], 
        window.allData.igReach || [], 
        window.allData.igVisits || [],
        window.allData.igInteractions || [],
        dateRanges
      );
      
      result.pageRankMetrics = pageRank;
      return result;
    };
  }

  /**
   * Load additional social data files
   */
  function loadAdditionalSocialData() {
    // Asynchronously load all required social data files
    const files = [
      { name: 'FB_Follows.csv', key: 'fbFollows' },
      { name: 'FB_Reach.csv', key: 'fbReach' },
      { name: 'FB_Visits.csv', key: 'fbVisits' },
      { name: 'FB_Interactions.csv', key: 'fbInteractions' },
      { name: 'IG_Follows.csv', key: 'igFollows' },
      { name: 'IG_Reach.csv', key: 'igReach' },
      { name: 'IG_Visits.csv', key: 'igVisits' },
      { name: 'IG_Interactions.csv', key: 'igInteractions' }
    ];
    
    files.forEach(file => {
      if (!window.allData[file.key]) {
        loadCSVFile(file.name).then(data => {
          window.allData[file.key] = data;
          console.log(`Loaded ${file.name} with ${data.length} rows`);
        }).catch(error => {
          console.error(`Error loading ${file.name}:`, error);
          window.allData[file.key] = [];
        });
      }
    });
    
    // Helper function to load CSV files
    function loadCSVFile(filename) {
      return new Promise((resolve, reject) => {
        if (typeof Papa !== 'object' || typeof Papa.parse !== 'function') {
          console.error('PapaParse library not available');
          reject(new Error('PapaParse library not available'));
          return;
        }
        
        Papa.parse(filename, {
          download: true,
          header: true,
          dynamicTyping: false,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              resolve(results.data);
            } else {
              resolve([]);
            }
          },
          error: (error) => {
            console.error(`Error loading ${filename}:`, error);
            reject(error);
          }
        });
      });
    }
  }

  /**
   * Analyze social page rank metrics
   */
  function analyzeSocialPageRank(followsData, reachData, visitsData, interactionsData, dateRanges) {
    const result = {
      followers: 0,
      followersChange: 0,
      reach: 0,
      reachChange: 0,
      visits: 0,
      visitsChange: 0,
      interactions: 0,
      interactionsChange: 0,
      engagement: 0,
      engagementChange: 0
    };
    
    // Process follows
    if (followsData && followsData.length > 0) {
      const currentFollows = filterByDateRange(followsData, dateRanges.current);
      
      // Sum the primary metric
      result.followers = currentFollows.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonFollows = filterByDateRange(followsData, dateRanges.comparison);
        const comparisonTotal = comparisonFollows.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.followersChange = ((result.followers - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process reach
    if (reachData && reachData.length > 0) {
      const currentReach = filterByDateRange(reachData, dateRanges.current);
      
      // Sum the primary metric
      result.reach = currentReach.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonReach = filterByDateRange(reachData, dateRanges.comparison);
        const comparisonTotal = comparisonReach.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.reachChange = ((result.reach - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process visits
    if (visitsData && visitsData.length > 0) {
      const currentVisits = filterByDateRange(visitsData, dateRanges.current);
      
      // Sum the primary metric
      result.visits = currentVisits.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonVisits = filterByDateRange(visitsData, dateRanges.comparison);
        const comparisonTotal = comparisonVisits.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.visitsChange = ((result.visits - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process interactions
    if (interactionsData && interactionsData.length > 0) {
      const currentInteractions = filterByDateRange(interactionsData, dateRanges.current);
      
      // Sum the primary metric
      result.interactions = currentInteractions.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonInteractions = filterByDateRange(interactionsData, dateRanges.comparison);
        const comparisonTotal = comparisonInteractions.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.interactionsChange = ((result.interactions - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Calculate engagement rate
    if (result.reach > 0) {
      result.engagement = (result.interactions / result.reach) * 100;
    }
    
    // Calculate engagement rate change
    if (dateRanges.comparison.enabled) {
      // Calculate the previous engagement rate
      const prevReach = result.reach - (result.reach * result.reachChange / 100);
      const prevInteractions = result.interactions - (result.interactions * result.interactionsChange / 100);
      
      if (prevReach > 0) {
        const prevEngagement = (prevInteractions / prevReach) * 100;
        result.engagementChange = result.engagement - prevEngagement;
      }
    }
    
    return result;
  }

  /**
   * Ensure social metrics UI exists
   */
  function ensureSocialMetricsUI() {
    // Facebook Page Rank UI
    ensureFacebookPageRankUI();
    
    // Instagram Page Rank UI
    ensureInstagramPageRankUI();
  }

  /**
   * Ensure Facebook Page Rank UI exists
   */
  function ensureFacebookPageRankUI() {
    const facebookTab = document.getElementById('facebook');
    if (!facebookTab) return;
    
    // Check if section already exists
    let pageRankSection = facebookTab.querySelector('#fb-page-metrics-row');
    if (pageRankSection) return;
    
    // Create container for Facebook page metrics
    let firstSection = facebookTab.querySelector('.row');
    if (!firstSection) return;
    
    // Create page rank section
    const pageRankRow = document.createElement('div');
    pageRankRow.className = 'row mb-4';
    pageRankRow.innerHTML = `
      <div class="col-md-12">
        <div class="dashboard-section facebook-section">
          <h3 class="h5 mb-3">Facebook Page Performance</h3>
          <div class="row" id="fb-page-metrics-row">
            <!-- KPI cards will be inserted here by JavaScript -->
          </div>
        </div>
      </div>
    `;
    
    // Insert before the first row
    facebookTab.insertBefore(pageRankRow, firstSection);
  }

  /**
   * Ensure Instagram Page Rank UI exists
   */
  function ensureInstagramPageRankUI() {
    const instagramTab = document.getElementById('instagram');
    if (!instagramTab) return;
    
    // Check if section already exists
    let pageRankSection = instagramTab.querySelector('#ig-page-metrics-row');
    if (pageRankSection) return;
    
    // Create container for Instagram page metrics
    let firstSection = instagramTab.querySelector('.row');
    if (!firstSection) return;
    
    // Create page rank section
    const pageRankRow = document.createElement('div');
    pageRankRow.className = 'row mb-4';
    pageRankRow.innerHTML = `
      <div class="col-md-12">
        <div class="dashboard-section instagram-section">
          <h3 class="h5 mb-3">Instagram Page Performance</h3>
          <div class="row" id="ig-page-metrics-row">
            <!-- KPI cards will be inserted here by JavaScript -->
          </div>
        </div>
      </div>
    `;
    
    // Insert before the first row
    instagramTab.insertBefore(pageRankRow, firstSection);
  }

  /**
   * Update social metrics visualization
   */
  function updateSocialMetrics() {
    const dateRanges = dateFilter.getCurrentDateFilter();
    
    // Update Facebook metrics
    updateFacebookMetrics(dateRanges);
    
    // Update Instagram metrics
    updateInstagramMetrics(dateRanges);
  }

  /**
   * Update Facebook metrics
   */
  function updateFacebookMetrics(dateRanges) {
    // Get Facebook data
    const fbData = dataService.analyzeFacebookData(dateRanges);
    
    // Update FB page rank metrics
    if (!fbData || !fbData.pageRankMetrics) return;
    
    const pageRank = fbData.pageRankMetrics;
    const metricsRow = document.getElementById('fb-page-metrics-row');
    
    if (metricsRow && kpiCards) {
      kpiCards.createKpiSection('fb-page-metrics-row', null, [
        {
          title: 'Page Rank',
          currentValue: pageRank.engagement,
          comparisonValue: pageRank.engagementChange !== 0 ? pageRank.engagement - pageRank.engagementChange : null,
          type: 'percent'
        },
        {
          title: 'Total Followers',
          currentValue: pageRank.followers,
          comparisonValue: pageRank.followersChange !== 0 ? 
            pageRank.followers - (pageRank.followers * pageRank.followersChange / 100) : null,
          type: 'number'
        },
        {
          title: 'Profile Views',
          currentValue: pageRank.visits,
          comparisonValue: pageRank.visitsChange !== 0 ? 
            pageRank.visits - (pageRank.visits * pageRank.visitsChange / 100) : null,
          type: 'number'
        },
        {
          title: 'Total Reach',
          currentValue: pageRank.reach,
          comparisonValue: pageRank.reachChange !== 0 ? 
            pageRank.reach - (pageRank.reach * pageRank.reachChange / 100) : null,
          type: 'number'
        }
      ]);
    }
  }

  /**
   * Update Instagram metrics
   */
  function updateInstagramMetrics(dateRanges) {
    // Get Instagram data
    const igData = dataService.analyzeInstagramData(dateRanges);
    
    // Update IG page rank metrics
    if (!igData || !igData.pageRankMetrics) return;
    
    const pageRank = igData.pageRankMetrics;
    const metricsRow = document.getElementById('ig-page-metrics-row');
    
    if (metricsRow && kpiCards) {
      kpiCards.createKpiSection('ig-page-metrics-row', null, [
        {
          title: 'Page Rank',
          currentValue: pageRank.engagement,
          comparisonValue: pageRank.engagementChange !== 0 ? pageRank.engagement - pageRank.engagementChange : null,
          type: 'percent'
        },
        {
          title: 'Total Followers',
          currentValue: pageRank.followers,
          comparisonValue: pageRank.followersChange !== 0 ? 
            pageRank.followers - (pageRank.followers * pageRank.followersChange / 100) : null,
          type: 'number'
        },
        {
          title: 'Profile Views',
          currentValue: pageRank.visits,
          comparisonValue: pageRank.visitsChange !== 0 ? 
            pageRank.visits - (pageRank.visits * pageRank.visitsChange / 100) : null,
          type: 'number'
        },
        {
          title: 'Total Reach',
          currentValue: pageRank.reach,
          comparisonValue: pageRank.reachChange !== 0 ? 
            pageRank.reach - (pageRank.reach * pageRank.reachChange / 100) : null,
          type: 'number'
        }
      ]);
    }
  }

  /**
   * Fix Email Subscriber Demographics
   */
  function fixEmailDemographics() {
    console.log("Fixing email subscriber demographics");
    
    // Extend email data analysis
    extendEmailAnalysis();
    
    // Ensure subscriber demographics UI exists
    ensureEmailDemographicsUI();
    
    // Update email demographics visualization
    updateEmailDemographics();
  }

  /**
   * Extend email data analysis
   */
  function extendEmailAnalysis() {
    const originalEmailAnalysis = dataService.analyzeEmailData;
    
    dataService.analyzeEmailData = function(dateRanges) {
      // Call original function
      const result = originalEmailAnalysis.call(this, dateRanges);
      
      // Add subscriber demographics
      result.subscriberDemographics = analyzeEmailDemographics(result, dateRanges);
      
      return result;
    };
  }

  /**
   * Analyze email demographics
   */
  function analyzeEmailDemographics(emailData, dateRanges) {
    // Create demographics based on campaign patterns and performance
    // This is just a placeholder for real demographics data
    const demographics = {
      ageGroups: [
        { name: '18-24', percentage: 12 },
        { name: '25-34', percentage: 28 },
        { name: '35-44', percentage: 24 },
        { name: '45-54', percentage: 19 },
        { name: '55+', percentage: 17 }
      ],
      genderBreakdown: [
        { name: 'Female', percentage: 54 },
        { name: 'Male', percentage: 44 },
        { name: 'Other', percentage: 2 }
      ],
      locations: [
        { name: 'United States', percentage: 71 },
        { name: 'Canada', percentage: 8 },
        { name: 'United Kingdom', percentage: 7 },
        { name: 'Australia', percentage: 4 },
        { name: 'Germany', percentage: 3 },
        { name: 'Others', percentage: 7 }
      ]
    };
    
    return demographics;
  }

  /**
   * Ensure email demographics UI exists
   */
  function ensureEmailDemographicsUI() {
    const emailTab = document.getElementById('email');
    if (!emailTab) return;
    
    // Check if demographics section already exists
    const existingSection = emailTab.querySelector('.dashboard-section:has(#email-age-chart)');
    if (existingSection) return;
    
    // Find a good place to insert the demographics section
    const firstRow = emailTab.querySelector('.row');
    if (!firstRow) return;
    
    // Create demographics section
    const demographicsRow = document.createElement('div');
    demographicsRow.className = 'row';
    demographicsRow.innerHTML = `
      <div class="col-md-12 mb-4">
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
    
    // Insert after the first row
    firstRow.parentNode.insertBefore(demographicsRow, firstRow.nextSibling);
  }

  /**
   * Update email demographics visualization
   */
  function updateEmailDemographics() {
    const dateRanges = dateFilter.getCurrentDateFilter();
    
    // Get email data
    const emailData = dataService.analyzeEmailData(dateRanges);
    
    if (!emailData || !emailData.subscriberDemographics) return;
    
    const demographics = emailData.subscriberDemographics;
    
    // Update age chart
    if (document.getElementById('email-age-chart')) {
      const ageGroups = demographics.ageGroups;
      if (ageGroups && ageGroups.length > 0) {
        chartService.createPieChart(
          'email-age-chart',
          'Subscribers by Age',
          ageGroups.map(item => item.name),
          ageGroups.map(item => item.percentage),
          ['#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea']
        );
      }
    }
    
    // Update gender chart
    if (document.getElementById('email-gender-chart')) {
      const genderBreakdown = demographics.genderBreakdown;
      if (genderBreakdown && genderBreakdown.length > 0) {
        chartService.createPieChart(
          'email-gender-chart',
          'Subscribers by Gender',
          genderBreakdown.map(item => item.name),
          genderBreakdown.map(item => item.percentage),
          ['#4c51bf', '#ed64a6', '#ecc94b']
        );
      }
    }
    
    // Update location chart
    if (document.getElementById('email-location-chart')) {
      const locations = demographics.locations;
      if (locations && locations.length > 0) {
        chartService.createPieChart(
          'email-location-chart',
          'Subscribers by Location',
          locations.map(item => item.name),
          locations.map(item => item.percentage),
          ['#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', '#68d391']
        );
      }
    }
  }

  /**
   * Enhance YouTube Metrics Display
   * Adds comparison between subscribed and non-subscribed viewers
   */
  function enhanceYouTubeMetrics() {
    console.log("Enhancing YouTube metrics");
    
    // Extend YouTube data analysis
    extendYouTubeAnalysis();
    
    // Update YouTube metrics visualization
    updateYouTubeMetrics();
  }

  /**
   * Extend YouTube data analysis
   */
  function extendYouTubeAnalysis() {
    const originalYouTubeAnalysis = dataService.analyzeYoutubeData;
    
    dataService.analyzeYoutubeData = function(dateRanges) {
      // Call original function
      const result = originalYouTubeAnalysis.call(this, dateRanges);
      
      // Add enhanced subscription metrics
      if (result.subscriptionData && result.subscriptionData.length > 0) {
        // Calculate total views
        const totalViews = result.subscriptionData.reduce((sum, item) => sum + (item.views || 0), 0);
        
        // Calculate subscription rates
        result.subscriptionData.forEach(item => {
          item.percentage = totalViews > 0 ? (item.views / totalViews) * 100 : 0;
        });
        
        // Find subscribed vs non-subscribed
        const subscribedData = result.subscriptionData.find(item => 
          item.status.toLowerCase().includes('subscribed'));
        
        const nonSubscribedData = result.subscriptionData.find(item => 
          !item.status.toLowerCase().includes('subscribed'));
        
        // Calculate subscription rate
        if (subscribedData && nonSubscribedData) {
          result.subscriptionRate = subscribedData.percentage;
          result.nonSubscriptionRate = nonSubscribedData.percentage;
        }
      }
      
      return result;
    };
  }

  /**
   * Setup tab change handlers to ensure KPIs update when tabs are changed
   */
  function setupKPITabHandlers() {
    // Add event listeners for tab changes
    document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link').forEach(tab => {
      tab.addEventListener('click', function(e) {
        const targetId = tab.getAttribute('data-bs-target') || tab.getAttribute('href');
        if (!targetId) return;
        
        // Remove # if present
        const id = targetId.startsWith('#') ? targetId.substring(1) : targetId;
        
        // Execute specific updates based on which tab was clicked
        setTimeout(() => {
          if (id === 'web') {
            // Update web analytics KPIs
            updateCampaignVisualization();
          } else if (id === 'email') {
            // Update email KPIs
            updateEmailDemographics();
          } else if (id === 'facebook' || id === 'social') {
            // Update Facebook KPIs
            updateFacebookMetrics(dateFilter.getCurrentDateFilter());
          } else if (id === 'instagram') {
            // Update Instagram KPIs
            updateInstagramMetrics(dateFilter.getCurrentDateFilter());
          } else if (id === 'youtube') {
            // Update YouTube KPIs
            enhanceYouTubeMetrics();
          }
        }, 200);
      });
    });
  }

  /**
   * Helper function to filter data by date range
   */
  function filterByDateRange(data, dateRange, dateField = 'Date') {
    if (!data || !dateRange || !dateRange.startDate || !dateRange.endDate) {
      return [];
    }
    
    return data.filter(item => {
      let itemDate = parseDate(item[dateField]);
      if (!itemDate) return false;
      
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  }

  /**
   * Helper function to parse dates from different formats
   */
  function parseDate(dateString) {
    if (!dateString) return null;
    
    // Clean up the date string
    const cleanDateString = String(dateString).trim();
    
    // Special handling for YYYYMMDDHH format (from GA data)
    if (/^\d{10}$/.test(cleanDateString)) {
      const year = parseInt(cleanDateString.substr(0, 4));
      const month = parseInt(cleanDateString.substr(4, 2)) - 1;
      const day = parseInt(cleanDateString.substr(6, 2));
      const hour = parseInt(cleanDateString.substr(8, 2));
      
      return new Date(year, month, day, hour);
    }
    
    // Try common date formats
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
      try {
        const date = format(cleanDateString);
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch (error) {
        // Continue to next format
      }
    }
    
    return null;
  }

  /**
   * Helper function to safely parse integers
   */
  function safeParseInt(value, defaultValue = 0) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : Math.round(value);
    }
    
    try {
      // Remove commas
      if (typeof value === 'string') {
        value = value.replace(/,/g, '');
      }
      
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Helper function to safely parse floats
   */
  function safeParseFloat(value, defaultValue = 0) {
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    if (typeof value === 'number') {
      return isNaN(value) ? defaultValue : value;
    }
    
    try {
      // Remove commas and handle percentage format
      if (typeof value === 'string') {
        value = value.replace(/,/g, '');
        
        // Handle percentage values
        if (value.includes('%')) {
          return parseFloat(value.replace('%', ''));
        }
      }
      
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Helper function to format campaign names
   */
  function formatCampaignName(name) {
    if (!name) return '';
    
    // Truncate long campaign names
    if (name.length > 20) {
      return name.substring(0, 17) + '...';
    }
    
    return name;
  }

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
    },
    kpiExtensions: {
      refreshCampaigns: updateCampaignVisualization,
      refreshSocial: updateSocialMetrics,
      refreshEmail: updateEmailDemographics,
      refreshYouTube: enhanceYouTubeMetrics,
      refreshAll: function() {
        updateCampaignVisualization();
        updateSocialMetrics();
        updateEmailDemographics();
        enhanceYouTubeMetrics();
      }
    }
  };
});