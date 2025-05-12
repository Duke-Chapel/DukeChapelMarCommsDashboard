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
  const dateFilterContainer = document.createElement('div');
  dateFilterContainer.className = 'dashboard-section mb-4';
  dateFilterContainer.id = 'date-filter-container';
  document.querySelector('.container').insertBefore(dateFilterContainer, document.querySelector('.row.mb-4'));

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
      const itemDate = parseDate(item[dateField] || item['Publish time']);
      if (!itemDate) return false;
      
      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  };
  
  // Create date filter UI
  const renderDateFilter = () => {
    if (isLoading) return;
    
    dateFilterContainer.innerHTML = `
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
    document.getElementById('start-date-input').addEventListener('change', (e) => {
      dateRange.startDate = e.target.value ? new Date(e.target.value) : null;
      updateDashboard();
    });
    
    document.getElementById('end-date-input').addEventListener('change', (e) => {
      dateRange.endDate = e.target.value ? new Date(e.target.value) : null;
      updateDashboard();
    });
    
    document.getElementById('clear-date-filter').addEventListener('click', () => {
      dateRange.startDate = null;
      dateRange.endDate = null;
      renderDateFilter();
      updateDashboard();
    });
  };
  
  // Load CSV files
  const loadCSVData = async () => {
    isLoading = true;
    updateLoadingState();
    dataErrors = {};
    let allDates = [];
    
    // Function to load and parse a CSV file
    const loadCSVFile = (file) => {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          download: true,
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Extract dates if available
            if (results.data.length > 0 && (results.data[0].Date || results.data[0]['Publish time'])) {
              const dates = results.data
                .map(item => parseDate(item.Date || item['Publish time']))
                .filter(date => date !== null);
              
              if (dates.length > 0) {
                allDates = [...allDates, ...dates];
              }
            }
            resolve(results.data);
          },
          error: (error) => {
            dataErrors[file] = `Error parsing ${file}: ${error.message}`;
            reject(error);
          }
        });
      });
    };
    
    try {
      // Load all required CSV files
      const [email, fbVideos, igPosts, ytAge, ytGender, ytGeo, ytSub] = await Promise.allSettled([
        loadCSVFile('Email_Campaign_Performance.csv'),
        loadCSVFile('FB_Videos.csv'),
        loadCSVFile('IG_Posts.csv'),
        loadCSVFile('YouTube_Age.csv'),
        loadCSVFile('YouTube_Gender.csv'),
        loadCSVFile('YouTube_Geography.csv'),
        loadCSVFile('YouTube_Subscription_Status.csv')
      ]);
      
      // Set data from fulfilled promises
      emailData = email.status === 'fulfilled' ? email.value : null;
      fbVideosData = fbVideos.status === 'fulfilled' ? fbVideos.value : null;
      igPostsData = igPosts.status === 'fulfilled' ? igPosts.value : null;
      youtubeAgeData = ytAge.status === 'fulfilled' ? ytAge.value : null;
      youtubeGenderData = ytGender.status === 'fulfilled' ? ytGender.value : null;
      youtubeGeographyData = ytGeo.status === 'fulfilled' ? ytGeo.value : null;
      youtubeSubscriptionData = ytSub.status === 'fulfilled' ? ytSub.value : null;
      
      // Add errors for rejected promises
      if (email.status === 'rejected') dataErrors['Email_Campaign_Performance.csv'] = email.reason.message;
      if (fbVideos.status === 'rejected') dataErrors['FB_Videos.csv'] = fbVideos.reason.message;
      if (igPosts.status === 'rejected') dataErrors['IG_Posts.csv'] = igPosts.reason.message;
      if (ytAge.status === 'rejected') dataErrors['YouTube_Age.csv'] = ytAge.reason.message;
      if (ytGender.status === 'rejected') dataErrors['YouTube_Gender.csv'] = ytGender.reason.message;
      if (ytGeo.status === 'rejected') dataErrors['YouTube_Geography.csv'] = ytGeo.reason.message;
      if (ytSub.status === 'rejected') dataErrors['YouTube_Subscription_Status.csv'] = ytSub.reason.message;
      
      // Set date range from all available dates
      if (allDates.length > 0) {
        const earliest = new Date(Math.min(...allDates));
        const latest = new Date(Math.max(...allDates));
        
        availableDates.earliestDate = earliest;
        availableDates.latestDate = latest;
        
        // Default to last 30 days if data available
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        dateRange.startDate = thirtyDaysAgo > earliest ? thirtyDaysAgo : earliest;
        dateRange.endDate = latest;
      }
      
      isLoading = false;
      updateLoadingState();
      renderDateFilter();
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
    
    const errorContainer = document.querySelector('.container > .row.mb-4').nextElementSibling;
    if (Object.keys(dataErrors).length > 0) {
      let errorHtml = '<div class="alert alert-danger mb-4">Some data sources have errors:</div>';
      errorContainer.innerHTML = errorHtml;
    }
  };
  
  // Tab navigation
  const setupTabNavigation = () => {
    const tabs = document.querySelectorAll('#dashboardTabs button');
    const tabContents = document.querySelectorAll('#dashboardTabsContent .tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tabContents.forEach(content => content.classList.remove('show', 'active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const contentId = tab.getAttribute('data-bs-target');
        const content = document.querySelector(contentId);
        if (content) {
          content.classList.add('show', 'active');
        }
      });
    });
    
    // Social media sub-tabs
    const socialTabs = document.querySelectorAll('#socialTabs button');
    const socialContents = document.querySelectorAll('#socialTabContent .tab-pane');
    
    socialTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        socialTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        socialContents.forEach(content => content.classList.remove('show', 'active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const contentId = tab.getAttribute('data-bs-target');
        const content = document.querySelector(contentId);
        if (content) {
          content.classList.add('show', 'active');
        }
      });
    });
  };
  
  // Update the dashboard with current data and filters
  const updateDashboard = () => {
    // Filter data based on date range
    const filteredEmailData = emailData ? applyDateFilter(emailData, 'Date') : null;
    const filteredFbVideos = fbVideosData ? applyDateFilter(fbVideosData, 'Date') : null;
    const filteredIgPosts = igPostsData ? applyDateFilter(igPostsData, 'Date') : null;
    
    // Update Overview tab
    updateOverviewTab(filteredEmailData, filteredFbVideos, filteredIgPosts);
    
    // Update Email tab
    updateEmailTab(filteredEmailData);
    
    // Update YouTube tab
    updateYouTubeTab();
    
    // Update Facebook tab
    updateFacebookTab(filteredFbVideos);
    
    // Update Instagram tab
    updateInstagramTab(filteredIgPosts);
  };
  
  // Update Overview tab
  const updateOverviewTab = (filteredEmailData, filteredFbVideos, filteredIgPosts) => {
    // Calculate metrics
    const emailRecipients = emailData && emailData.length > 0 ? 
      Math.max(...emailData.map(campaign => parseInt(campaign['Emails sent'] || 0))) : null;
    
    const totalFbVideoViews = filteredFbVideos ? 
      filteredFbVideos.reduce((sum, video) => sum + (video['3-second video views'] || 0), 0) : 
      null;
    
    const totalIgReach = filteredIgPosts ? 
      filteredIgPosts.reduce((sum, post) => sum + (post.Reach || 0), 0) : 
      null;
    
    const totalYoutubeViews = youtubeGeographyData ? 
      youtubeGeographyData.reduce((sum, item) => sum + (item.Views || 0), 0) : 
      null;
    
    // Update metric cards
    document.getElementById('total-website-visitors').innerHTML = 'N/A';
    document.getElementById('total-followers').innerHTML = 'N/A';
    document.getElementById('total-subscribers').innerHTML = emailRecipients !== null ? formatNumber(emailRecipients) : 'No data';
    document.getElementById('total-youtube-views').innerHTML = totalYoutubeViews !== null ? formatNumber(totalYoutubeViews) : 'No data';
    
    // Update email performance chart
    const emailPerformanceChart = document.getElementById('email-performance-chart');
    if (emailPerformanceChart) {
      const ctx = emailPerformanceChart.getContext('2d');
      if (window.emailChart) window.emailChart.destroy();
      
      if (filteredEmailData && filteredEmailData.length > 0) {
        const sortedData = [...filteredEmailData]
          .sort((a, b) => {
            const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
            const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
            return openRateB - openRateA;
          })
          .slice(0, 5);
        
        window.emailChart = new Chart(ctx, {
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
        });
      } else {
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No email data available for selected date range', emailPerformanceChart.width / 2, emailPerformanceChart.height / 2);
      }
    }
    
    // Update YouTube demographics chart
    const youtubeAgeChart = document.getElementById('youtube-age-chart');
    if (youtubeAgeChart && youtubeAgeData) {
      const ctx = youtubeAgeChart.getContext('2d');
      if (window.youtubeAgeChart) window.youtubeAgeChart.destroy();
      
      window.youtubeAgeChart = new Chart(ctx, {
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
      });
    }
  };
  
  // Update Email tab
  const updateEmailTab = (filteredEmailData) => {
    // Email performance chart
    const emailPerformanceChart = document.getElementById('email-performance-chart');
    if (emailPerformanceChart) {
      const ctx = emailPerformanceChart.getContext('2d');
      if (window.emailPerformanceChart) window.emailPerformanceChart.destroy();
      
      if (filteredEmailData && filteredEmailData.length > 0) {
        const sortedData = [...filteredEmailData]
          .sort((a, b) => {
            const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
            const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
            return openRateB - openRateA;
          })
          .slice(0, 8);
        
        window.emailPerformanceChart = new Chart(ctx, {
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
        });
      } else {
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No email data available for selected date range', emailPerformanceChart.width / 2, emailPerformanceChart.height / 2);
      }
    }
    
    // Email engagement segmentation
    const emailEngagementChart = document.getElementById('email-engagement-chart');
    if (emailEngagementChart) {
      const ctx = emailEngagementChart.getContext('2d');
      if (window.emailEngagementChart) window.emailEngagementChart.destroy();
      
      if (filteredEmailData && filteredEmailData.length > 0) {
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
        
        window.emailEngagementChart = new Chart(ctx, {
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
        });
      } else {
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No email data available for selected date range', emailEngagementChart.width / 2, emailEngagementChart.height / 2);
      }
    }
    
    // Top email campaigns table
    const topEmailCampaignsTable = document.getElementById('top-email-campaigns-table');
    if (topEmailCampaignsTable) {
      if (filteredEmailData && filteredEmailData.length > 0) {
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
      } else {
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
      const ctx = youtubeAgeChart.getContext('2d');
      if (window.youtubeAgeChart2) window.youtubeAgeChart2.destroy();
      
      window.youtubeAgeChart2 = new Chart(ctx, {
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
      });
    }
    
    // YouTube demographics - gender
    const youtubeGenderChart = document.getElementById('youtube-gender-chart');
    if (youtubeGenderChart && youtubeGenderData) {
      const ctx = youtubeGenderChart.getContext('2d');
      if (window.youtubeGenderChart) window.youtubeGenderChart.destroy();
      
      window.youtubeGenderChart = new Chart(ctx, {
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
      });
    }
    
    // YouTube subscriber status
    const youtubeSubscriberChart = document.getElementById('youtube-subscriber-chart');
    if (youtubeSubscriberChart && youtubeSubscriptionData) {
      const ctx = youtubeSubscriberChart.getContext('2d');
      if (window.youtubeSubscriberChart) window.youtubeSubscriberChart.destroy();
      
      const totalViews = youtubeSubscriptionData.reduce((sum, data) => sum + (data.Views || 0), 0);
      
      window.youtubeSubscriberChart = new Chart(ctx, {
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
      });
    }
    
    // YouTube geography
    const youtubeGeographyChart = document.getElementById('youtube-geography-chart');
    if (youtubeGeographyChart && youtubeGeographyData) {
      const ctx = youtubeGeographyChart.getContext('2d');
      if (window.youtubeGeographyChart) window.youtubeGeographyChart.destroy();
      
      // Sort by views and take top 10
      const topCountries = [...youtubeGeographyData]
        .sort((a, b) => (b.Views || 0) - (a.Views || 0))
        .slice(0, 10);
      
      window.youtubeGeographyChart = new Chart(ctx, {
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
      });
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
      const ctx = fbDemographicsChart.getContext('2d');
      if (window.fbDemographicsChart) window.fbDemographicsChart.destroy();
      
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
        
        window.fbDemographicsChart = new Chart(ctx, {
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
        });
      } else {
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No Facebook video data available for selected date range', fbDemographicsChart.width / 2, fbDemographicsChart.height / 2);
      }
    }
    
    // Facebook followers chart placeholder
    const fbFollowersChart = document.getElementById('fb-followers-chart');
    if (fbFollowersChart) {
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
      const ctx = igDemographicsChart.getContext('2d');
      if (window.igDemographicsChart) window.igDemographicsChart.destroy();
      
      if (filteredIgPosts && filteredIgPosts.length > 0) {
        const engagementData = [
          { name: 'Likes', value: filteredIgPosts.reduce((sum, post) => sum + (post.Likes || 0), 0) },
          { name: 'Comments', value: filteredIgPosts.reduce((sum, post) => sum + (post.Comments || 0), 0) },
          { name: 'Shares', value: filteredIgPosts.reduce((sum, post) => sum + (post.Shares || 0), 0) },
          { name: 'Saves', value: filteredIgPosts.reduce((sum, post) => sum + (post.Saves || 0), 0) }
        ];
        
        const totalEngagement = engagementData.reduce((sum, item) => sum + item.value, 0);
        
        window.igDemographicsChart = new Chart(ctx, {
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
        });
      } else {
        // Show empty state
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f6ad55';
        ctx.textAlign = 'center';
        ctx.fillText('No Instagram post data available for selected date range', igDemographicsChart.width / 2, igDemographicsChart.height / 2);
      }
    }
    
    // Instagram followers chart placeholder
    const igFollowersChart = document.getElementById('ig-followers-chart');
    if (igFollowersChart) {
      const ctx = igFollowersChart.getContext('2d');
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f6ad55';
      ctx.textAlign = 'center';
      ctx.fillText('IG_Follows.csv data not loaded', igFollowersChart.width / 2, igFollowersChart.height / 2);
    }
  };
  
  // Initialize the dashboard
  const initDashboard = () => {
    // Set up tab navigation
    setupTabNavigation();
    
    // Load data
    loadCSVData();
  };
  
  // Start the dashboard
  initDashboard();
});