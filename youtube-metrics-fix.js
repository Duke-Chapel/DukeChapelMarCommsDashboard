/**
 * This function fixes the YouTube metrics in the dashboard
 * to display the subscriber vs. non-subscriber comparison
 */
function updateYouTubeMetrics() {
  const dateRanges = dateFilter.getCurrentDateFilter();
  
  try {
    // Get YouTube data
    const ytData = dataService.analyzeYoutubeData(dateRanges);
    
    if (!ytData || !ytData.subscriptionData || ytData.subscriptionData.length === 0) {
      console.warn('No YouTube subscription data available');
      return;
    }
    
    // Extract subscription data
    const subscribedData = ytData.subscriptionData.find(item => 
      item.status.toLowerCase().includes('subscribed'));
    
    const nonSubscribedData = ytData.subscriptionData.find(item => 
      !item.status.toLowerCase().includes('subscribed'));
    
    if (!subscribedData || !nonSubscribedData) {
      console.warn('Incomplete YouTube subscription data');
      return;
    }
    
    // Create KPI cards for YouTube metrics
    const youtubeMetricsRow = document.getElementById('youtube-metrics-row');
    if (youtubeMetricsRow && kpiCards) {
      kpiCards.createKpiSection('youtube-metrics-row', null, [
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
          currentValue: subscribedData.percentage || 0,
          type: 'percent'
        },
        {
          title: 'Non-Subscribed Views',
          currentValue: nonSubscribedData.percentage || 0,
          type: 'percent'
        }
      ]);
    }
    
    // Update subscriber vs. non-subscriber chart
    const updateSubscriberChart = () => {
      if (document.getElementById('youtube-subscriber-chart')) {
        chartService.createDoughnutChart(
          'youtube-subscriber-chart',
          'Subscriber vs. Non-Subscriber Views',
          ytData.subscriptionData.map(item => item.status || 'Unknown'),
          ytData.subscriptionData.map(item => item.views || 0),
          ['#48bb78', '#4299e1']
        );
      }
    };
    
    // Update age demographics chart
    const updateAgeChart = () => {
      if (document.getElementById('youtube-age-chart') && ytData.ageData && ytData.ageData.length > 0) {
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
      }
    };
    
    // Update gender demographics chart
    const updateGenderChart = () => {
      if (document.getElementById('youtube-gender-chart') && ytData.genderData && ytData.genderData.length > 0) {
        chartService.createPieChart(
          'youtube-gender-chart',
          'YouTube Gender Demographics',
          ytData.genderData.map(item => item.gender || 'Unknown'),
          ytData.genderData.map(item => item.views || 0),
          ['#4c51bf', '#ed64a6', '#ecc94b']
        );
      }
    };
    
    // Update geography chart
    const updateGeographyChart = () => {
      if (document.getElementById('youtube-geography-chart') && ytData.topCountries && ytData.topCountries.length > 0) {
        chartService.createHorizontalBarChart(
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
    };
    
    // Create top videos table
    const updateTopVideosTable = () => {
      if (document.getElementById('youtube-videos-table') && tableService && ytData.topVideos) {
        tableService.createTable(
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
    };
    
    // Update all charts
    updateSubscriberChart();
    updateAgeChart();
    updateGenderChart();
    updateGeographyChart();
    updateTopVideosTable();
    
    // Refresh charts in the YouTube tab
    refreshChartsInContainer('youtube');
  } catch (error) {
    console.error('Error updating YouTube metrics:', error);
  }
}
