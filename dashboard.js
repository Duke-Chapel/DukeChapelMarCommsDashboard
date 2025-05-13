// Main dashboard script that integrates all components
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Marketing Analytics Dashboard');
  
  // Create service instances
  const dateFilter = createEnhancedDateFilter();
  const dataService = createDataService();
  const chartService = createChartService();
  const tableService = createTableService();
  const kpiCards = createKpiCards();
  
  // Setup tabs navigation
  const setupTabNavigation = () => {
    const tabs = document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Find all tabs in the same group
        const parent = tab.closest('.nav-tabs, .nav-pills');
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
          const tabContent = parent.nextElementSibling;
          if (tabContent && tabContent.classList.contains('tab-content')) {
            const allPanes = tabContent.querySelectorAll('.tab-pane');
            
            // Hide all panes
            allPanes.forEach(pane => {
              pane.classList.remove('show', 'active');
            });
            
            // Show target pane
            const targetPane = document.querySelector(targetId);
            if (targetPane) {
              targetPane.classList.add('show', 'active');
            }
          }
        }
      });
    });
  };
  
  // Load all data and initialize the dashboard
  const initDashboard = async () => {
    try {
      // Show loading state
      document.getElementById('last-updated').textContent = 'Loading...';
      
      // Load all data
      const { data, errors, availableDates } = await dataService.loadAllData();
      
      // Update last updated time
      document.getElementById('last-updated').textContent = new Date().toLocaleString();
      
      // Set available dates in the date filter
      dateFilter.setAvailableDates(availableDates.earliestDate, availableDates.latestDate);
      
      // Render the date filter
      dateFilter.render();
      
      // Setup tab navigation
      setupTabNavigation();
      
      // Update dashboard with initial data
      updateDashboard(dateFilter.getCurrentDateFilter());
      
      // Show any errors
      if (Object.keys(errors).length > 0) {
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
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      document.getElementById('last-updated').textContent = 'Error loading data';
    }
  };
  
  // Update the dashboard based on the date filter
  const updateDashboard = (dateRanges) => {
    console.log('Updating dashboard with date ranges:', dateRanges);
    
    // Update each section of the dashboard
    updateOverviewTab(dateRanges);
    updateEmailTab(dateRanges);
    updateSocialTabs(dateRanges);
    updateYouTubeTab(dateRanges);
    updateWebAnalyticsTab(dateRanges);
  };
  
  // Update the Overview tab
  const updateOverviewTab = (dateRanges) => {
    console.log('Updating Overview tab');
    
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
        ytData.subscriptionData.reduce((sum, item) => sum + item.views, 0) || 0
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
      // Calculate engagement rates
      const emailEngagementRate = emailData.metrics.subscribers ? 
        (emailData.metrics.clicks / emailData.metrics.subscribers) * 100 : 0;
      
      const fbEngagementRate = fbData.metrics.views ? 
        (fbData.metrics.engagement / fbData.metrics.views) * 100 : 0;
      
      const igEngagementRate = igData.metrics.reach ? 
        (igData.metrics.engagement / igData.metrics.reach) * 100 : 0;
      
      // YouTube engagement (subscribed views percentage)
      const ytSubscribedViews = ytData.subscriptionData.find(item => 
        item.status === 'Subscribed')?.views || 0;
      const ytTotalViews = ytData.subscriptionData.reduce(
        (sum, item) => sum + item.views, 0) || 1;
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
  };
  
  // Update the Email tab
  const updateEmailTab = (dateRanges) => {
    console.log('Updating Email tab');
    
    // Analyze email data
    const emailData = dataService.analyzeEmailData(dateRanges);
    
    // Email performance chart
    if (document.getElementById('email-performance-chart')) {
      const campaigns = emailData.topCampaigns;
      
      if (campaigns && campaigns.length > 0) {
        const labels = campaigns.map(campaign => 
          campaign.name.length > 15 ? campaign.name.substring(0, 15) + '...' : campaign.name);
        
        const datasets = [
          {
            label: 'Open Rate',
            data: campaigns.map(campaign => campaign.openRate),
            backgroundColor: '#4299e1',
            borderColor: '#3182ce',
            borderWidth: 1
          },
          {
            label: 'Click Rate',
            data: campaigns.map(campaign => campaign.clickRate),
            backgroundColor: '#38b2ac',
            borderColor: '#319795',
            borderWidth: 1
          }
        ];
        
        chartService.createComparisonBarChart(
          'email-performance-chart',
          'Email Campaign Performance',
          labels,
          datasets[0].data,
          null,
          {
            current: '#4299e1',
            currentBorder: '#3182ce'
          },
          'Rate (%)'
        );
      } else {
        chartService.clearChart('email-performance-chart');
      }
    }
    
    // Email engagement segmentation chart
    if (document.getElementById('email-engagement-chart')) {
      if (emailData.engagement.notOpened || 
          emailData.engagement.openedNotClicked || 
          emailData.engagement.clicked) {
        
        chartService.createPieChart(
          'email-engagement-chart',
          'Email Engagement Segmentation',
          ['Not Opened', 'Opened (No Click)', 'Clicked'],
          [
            emailData.engagement.notOpened, 
            emailData.engagement.openedNotClicked, 
            emailData.engagement.clicked
          ],
          ['#fc8181', '#f6ad55', '#68d391']
        );
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
  };
  
  // Update the Social Media tabs
  const updateSocialTabs = (dateRanges) => {
    console.log('Updating Social Media tabs');
    
    // Update Facebook tab
    updateFacebookTab(dateRanges);
    
    // Update Instagram tab
    updateInstagramTab(dateRanges);
  };
  
  // Update the Facebook tab
  const updateFacebookTab = (dateRanges) => {
    console.log('Updating Facebook tab');
    
    // Analyze Facebook data
    const fbData = dataService.analyzeFacebookData(dateRanges);
    
    // Facebook demographics chart
    if (document.getElementById('fb-demographics-chart')) {
      if (fbData.demographics && fbData.demographics.length > 0) {
        chartService.createHorizontalBarChart(
          'fb-demographics-chart',
          'Facebook Audience Demographics',
          fbData.demographics.map(item => item.name),
          fbData.demographics.map(item => item.value * 100),
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
  };
  
  // Update the Instagram tab
  const updateInstagramTab = (dateRanges) => {
    console.log('Updating Instagram tab');
    
    // Analyze Instagram data
    const igData = dataService.analyzeInstagramData(dateRanges);
    
    // Instagram engagement distribution chart
    if (document.getElementById('ig-demographics-chart')) {
      if (igData.engagement && igData.engagement.length > 0) {
        chartService.createPieChart(
          'ig-demographics-chart',
          'Instagram Engagement Distribution',
          igData.engagement.map(item => item.name),
          igData.engagement.map(item => item.value),
          ['#fc8181', '#f6ad55', '#4299e1', '#68d391']
        );
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
  };
  
  // Update the YouTube tab
  const updateYouTubeTab = (dateRanges) => {
    console.log('Updating YouTube tab');
    
    // Analyze YouTube data
    const ytData = dataService.analyzeYoutubeData(dateRanges);
    
    // YouTube age demographics chart
    if (document.getElementById('youtube-age-chart')) {
      if (ytData.ageData && ytData.ageData.length > 0) {
        chartService.createBarChart(
          'youtube-age-chart',
          'YouTube Age Demographics',
          ytData.ageData.map(item => item.age),
          ytData.ageData.map(item => item.views),
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
        chartService.createPieChart(
          'youtube-gender-chart',
          'YouTube Gender Demographics',
          ytData.genderData.map(item => item.gender),
          ytData.genderData.map(item => item.views),
          ['#4c51bf', '#ed64a6', '#ecc94b']
        );
      } else {
        chartService.clearChart('youtube-gender-chart');
      }
    }
    
    // YouTube subscriber status chart
    if (document.getElementById('youtube-subscriber-chart')) {
      if (ytData.subscriptionData && ytData.subscriptionData.length > 0) {
        chartService.createDoughnutChart(
          'youtube-subscriber-chart',
          'Subscriber vs. Non-Subscriber Views',
          ytData.subscriptionData.map(item => item.status),
          ytData.subscriptionData.map(item => item.views),
          ['#48bb78', '#4299e1']
        );
      } else {
        chartService.clearChart('youtube-subscriber-chart');
      }
    }
    
    // YouTube geography chart
    if (document.getElementById('youtube-geography-chart')) {
      if (ytData.topCountries && ytData.topCountries.length > 0) {
        chartService.createHorizontalBarChart(
          'youtube-geography-chart',
          'Top Countries by Views',
          ytData.topCountries.map(item => item.country),
          ytData.topCountries.map(item => item.views),
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
  };
  
  // Update the Web Analytics tab
  const updateWebAnalyticsTab = (dateRanges) => {
    console.log('Updating Web Analytics tab');
    
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
  };
  
  // Call the init function
  initDashboard();
});
