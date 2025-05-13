// dashboard-fix.js - Simple, focused fix for chart rendering issues
// Add this file to your repository and include it in index.html

(function() {
  // Wait for document to be ready
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for dashboard to initialize
    setTimeout(function() {
      console.log("Applying targeted fixes for chart rendering");
      
      // Fix for missing charts in Email tab
      function fixEmailCharts() {
        // Wait until the email tab is active or when manually called
        const emailTab = document.getElementById('email');
        if (!emailTab) return;
        
        // Get the chart containers
        const perfChartContainer = document.getElementById('email-performance-chart');
        const engChartContainer = document.getElementById('email-engagement-chart');
        
        if (perfChartContainer && !window.chartInstances['email-performance-chart']) {
          console.log("Fixing email performance chart");
          
          // Get the email data from the dataService
          if (window.dataService && typeof window.dataService.analyzeEmailData === 'function') {
            try {
              // Get current date filter
              const dateFilter = window.dateFilter ? window.dateFilter.getCurrentDateFilter() : null;
              if (!dateFilter) return;
              
              // Re-analyze the email data
              const emailData = window.dataService.analyzeEmailData(dateFilter);
              
              // Check if there's actual campaign data
              if (emailData && emailData.topCampaigns && emailData.topCampaigns.length > 0) {
                console.log("Found email campaign data, recreating chart");
                
                // Create chart data
                const labels = emailData.topCampaigns.map(campaign => {
                  const name = campaign.name || 'Unnamed Campaign';
                  return name.length > 15 ? name.substring(0, 15) + '...' : name;
                });
                
                const openRates = emailData.topCampaigns.map(campaign => campaign.openRate || 0);
                
                // Use chartService to create the chart
                if (window.chartService) {
                  window.chartService.createBarChart(
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
                }
              }
            } catch (error) {
              console.error("Error fixing email performance chart:", error);
            }
          }
        }
        
        // Fix the engagement chart if needed
        if (engChartContainer && !window.chartInstances['email-engagement-chart']) {
          console.log("Fixing email engagement chart");
          
          if (window.dataService && typeof window.dataService.analyzeEmailData === 'function') {
            try {
              // Get current date filter
              const dateFilter = window.dateFilter ? window.dateFilter.getCurrentDateFilter() : null;
              if (!dateFilter) return;
              
              // Re-analyze the email data
              const emailData = window.dataService.analyzeEmailData(dateFilter);
              
              // Check if engagement data exists
              if (emailData && emailData.engagement) {
                console.log("Found email engagement data, recreating chart");
                
                // Ensure values are not negative
                const notOpened = Math.max(0, emailData.engagement.notOpened || 0);
                const openedNotClicked = Math.max(0, emailData.engagement.openedNotClicked || 0);
                const clicked = Math.max(0, emailData.engagement.clicked || 0);
                
                // Only show chart if we have some data
                if (notOpened > 0 || openedNotClicked > 0 || clicked > 0) {
                  if (window.chartService) {
                    window.chartService.createPieChart(
                      'email-engagement-chart',
                      'Email Engagement Segmentation',
                      ['Not Opened', 'Opened (No Click)', 'Clicked'],
                      [notOpened, openedNotClicked, clicked],
                      ['#fc8181', '#f6ad55', '#68d391']
                    );
                  }
                }
              }
            } catch (error) {
              console.error("Error fixing email engagement chart:", error);
            }
          }
        }
      }
      
      // Function to fix Web Analytics tab
      function fixWebAnalyticsTab() {
        // Since we have no GA data, let's make sure "no data" messages show properly
        const webTab = document.getElementById('web');
        if (!webTab) return;
        
        // Make sure containers display appropriate "no data" messages
        const containers = [
          'web-demographics-chart',
          'traffic-sources-chart'
        ];
        
        containers.forEach(id => {
          const container = document.getElementById(id);
          if (container) {
            // Only add message if no chart exists
            if (!window.chartInstances[id]) {
              const ctx = container.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, container.width, container.height);
                ctx.font = '14px Arial';
                ctx.fillStyle = '#6c757d';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Web analytics data not available', 
                            container.width / 2, container.height / 2);
              }
            }
          }
        });
      }
      
      // Function to manually refresh a tab's charts when tab is clicked
      function setupTabRefreshing() {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('.nav-tabs .nav-link, .nav-pills .nav-link');
        
        // Add click handler to each tab
        tabButtons.forEach(button => {
          button.addEventListener('click', function(e) {
            const tabId = button.getAttribute('data-bs-target') || button.getAttribute('href');
            if (!tabId) return;
            
            // Remove # if present
            const id = tabId.startsWith('#') ? tabId.substring(1) : tabId;
            
            // Execute specific fixes based on which tab was clicked
            setTimeout(() => {
              if (id === 'email') {
                fixEmailCharts();
              } else if (id === 'web') {
                fixWebAnalyticsTab();
              }
              
              // Ensure all charts in the container are refreshed
              refreshChartsInContainer(id);
            }, 100);
          });
        });
      }
      
      // Helper to refresh charts in a container
      function refreshChartsInContainer(containerId) {
        if (!containerId) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Find all canvases in the container
        const canvases = container.querySelectorAll('canvas');
        canvases.forEach(canvas => {
          if (canvas.id && window.chartInstances && window.chartInstances[canvas.id]) {
            try {
              console.log(`Refreshing chart: ${canvas.id}`);
              window.chartInstances[canvas.id].update();
            } catch (error) {
              console.error(`Error updating chart ${canvas.id}:`, error);
            }
          }
        });
      }
      
      // Set up the tab refreshing
      setupTabRefreshing();
      
      // Check which tab is active and apply appropriate fixes
      const activeTab = document.querySelector('.tab-pane.active');
      if (activeTab) {
        if (activeTab.id === 'email') {
          fixEmailCharts();
        } else if (activeTab.id === 'web') {
          fixWebAnalyticsTab();
        }
        
        // Refresh charts in the active tab
        refreshChartsInContainer(activeTab.id);
      }
      
      // Make window.dashboardApi available for manual fixes
      window.dashboardApi = window.dashboardApi || {};
      window.dashboardApi.fixCharts = {
        email: fixEmailCharts,
        web: fixWebAnalyticsTab,
        refreshCharts: refreshChartsInContainer
      };
      
      console.log("Applied targeted fixes - use window.dashboardApi.fixCharts to manually fix specific tabs");
    }, 1000); // Wait 1 second after page load to ensure all components are initialized
  });
})();