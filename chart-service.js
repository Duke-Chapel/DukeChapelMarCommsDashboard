// Chart creation and management for the dashboard - UPDATED VERSION
function createChartService() {
  // Global chart instances tracker
  window.chartInstances = window.chartInstances || {};
  
  // Helper function to safely create a chart
  const createChart = (canvasId, config) => {
    console.log(`Creating chart for ${canvasId}`);
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
      console.warn(`Canvas with ID ${canvasId} not found`);
      return null;
    }
    
    // First destroy any existing chart for this canvas
    if (window.chartInstances && window.chartInstances[canvasId]) {
      console.log(`Destroying existing chart in ${canvasId}`);
      try {
        window.chartInstances[canvasId].destroy();
      } catch (error) {
        console.error(`Error destroying existing chart in ${canvasId}:`, error);
      }
      delete window.chartInstances[canvasId];
    }
    
    // Extra precaution: Look for any global Chart.js instances
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          console.log(`Found global Chart.js instance for ${canvasId}, destroying`);
          try {
            instance.destroy();
          } catch (error) {
            console.error(`Error destroying Chart.js instance for ${canvasId}:`, error);
          }
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
      
      // FIXED: Verify the config is valid
      if (!config || !config.data) {
        console.warn(`Invalid chart configuration for ${canvasId}`);
        showNoDataMessage(canvas);
        return null;
      }
      
      // Verify the data for the chart
      const hasData = checkChartHasData(config);
      if (!hasData) {
        console.log(`No valid data available for chart ${canvasId}`);
        
        // Show empty state
        showNoDataMessage(canvas);
        return null;
      }
      
      // FIXED: Create a new chart with proper error handling
      try {
        if (!window.Chart) {
          console.error(`Chart.js library not available for ${canvasId}`);
          showErrorMessage(canvas, "Chart.js library not loaded");
          return null;
        }
        
        // Create the chart instance
        window.chartInstances[canvasId] = new Chart(ctx, config);
        console.log(`Successfully created chart for ${canvasId}`);
        return window.chartInstances[canvasId];
      } catch (error) {
        console.error(`Error creating chart on ${canvasId}:`, error);
        // Clean up the canvas if chart creation failed
        showErrorMessage(canvas, error.message);
        return null;
      }
    } catch (error) {
      console.error(`Error setting up chart on ${canvasId}:`, error);
      // Clean up the canvas if chart setup failed
      const ctx = canvas.getContext('2d');
      if (ctx) {
        showErrorMessage(canvas, error.message);
      }
      return null;
    }
  };
  
  // Helper function to check if chart data is valid
  const checkChartHasData = (config) => {
    if (!config || !config.data || !config.data.datasets) {
      return false;
    }
    
    // FIXED: More robust data validation
    try {
      // Check if any dataset has data
      return config.data.datasets.some(dataset => {
        if (!dataset || !dataset.data) return false;
        
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
    } catch (error) {
      console.error('Error checking chart data:', error);
      return false;
    }
  };
  
  // FIXED: Helper function to show "no data" message on a canvas
  const showNoDataMessage = (canvas) => {
    if (!canvas) return;
    
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('No data available for the selected period', 
                    canvas.width / 2, canvas.height / 2);
      }
    } catch (error) {
      console.error('Error showing no data message:', error);
    }
  };
  
  // FIXED: Helper function to show error message on a canvas
  const showErrorMessage = (canvas, message) => {
    if (!canvas) return;
    
    try {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#dc3545';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Split message if too long
        const maxLineWidth = canvas.width - 40;
        const maxLines = 3;
        const words = message.split(' ');
        const lines = [];
        let currentLine = words[0];
        
        // Create lines that fit within the canvas width
        for (let i = 1; i < words.length; i++) {
          const testLine = currentLine + ' ' + words[i];
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxLineWidth) {
            lines.push(currentLine);
            currentLine = words[i];
            if (lines.length >= maxLines - 1) {
              // We're at the max lines, add ellipsis to current line
              currentLine += '...';
              break;
            }
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine);
        
        // Draw the lines centered in the canvas
        const lineHeight = 20;
        const totalHeight = lines.length * lineHeight;
        const startY = (canvas.height - totalHeight) / 2;
        
        lines.forEach((line, index) => {
          ctx.fillText(line, canvas.width / 2, startY + (index * lineHeight));
        });
      }
    } catch (error) {
      console.error('Error showing error message:', error);
    }
  };
  
  // Helper function to clear a chart
  const clearChart = (canvasId) => {
    if (window.chartInstances && window.chartInstances[canvasId]) {
      console.log(`Destroying chart in ${canvasId}`);
      try {
        window.chartInstances[canvasId].destroy();
      } catch (error) {
        console.error(`Error destroying chart in ${canvasId}:`, error);
      }
      delete window.chartInstances[canvasId];
    }
    
    // Also check global Chart.js instances
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          console.log(`Found global Chart.js instance for ${canvasId}, destroying`);
          try {
            instance.destroy();
          } catch (error) {
            console.error(`Error destroying global Chart.js instance for ${canvasId}:`, error);
          }
        }
      });
    }
    
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error(`Error clearing canvas ${canvasId}:`, error);
        }
      }
    }
  };
  
  // FIXED: Create a comparison bar chart with better validation
  const createComparisonBarChart = (canvasId, title, labels, currentData, comparisonData, colors, yAxisLabel = '') => {
    if (!labels || !Array.isArray(labels) || !currentData || !Array.isArray(currentData) || labels.length !== currentData.length) {
      console.warn(`Invalid data for comparison bar chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize data to prevent Chart.js errors
    const sanitizedLabels = labels.map(label => String(label || ''));
    const sanitizedCurrentData = currentData.map(val => typeof val === 'number' ? val : 0);
    
    const datasets = [
      {
        label: 'Current Period',
        data: sanitizedCurrentData,
        backgroundColor: colors?.current || '#4299e1',
        borderColor: colors?.currentBorder || '#3182ce',
        borderWidth: 1
      }
    ];
    
    // Add comparison data if provided
    if (comparisonData && Array.isArray(comparisonData) && comparisonData.length === currentData.length) {
      const sanitizedComparisonData = comparisonData.map(val => typeof val === 'number' ? val : 0);
      
      datasets.push({
        label: 'Comparison Period',
        data: sanitizedComparisonData,
        backgroundColor: colors?.comparison || '#9f7aea',
        borderColor: colors?.comparisonBorder || '#805ad5',
        borderWidth: 1
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: sanitizedLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a pie chart with better validation
  const createPieChart = (canvasId, title, labels, data, colors) => {
    if (!labels || !Array.isArray(labels) || !data || !Array.isArray(data) || labels.length !== data.length) {
      console.warn(`Invalid data for pie chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize data to prevent Chart.js errors
    const sanitizedLabels = labels.map(label => String(label || ''));
    const sanitizedData = data.map(val => typeof val === 'number' ? val : 0);
    
    // Default colors if not provided
    const defaultColors = [
      '#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', 
      '#68d391', '#f687b3', '#ecc94b', '#e53e3e', '#805ad5'
    ];
    
    // Use provided colors or generate enough colors
    let chartColors = colors;
    if (!chartColors || !Array.isArray(chartColors) || chartColors.length < sanitizedData.length) {
      chartColors = [];
      for (let i = 0; i < sanitizedData.length; i++) {
        chartColors.push(defaultColors[i % defaultColors.length]);
      }
    }
    
    const config = {
      type: 'pie',
      data: {
        labels: sanitizedLabels,
        datasets: [{
          data: sanitizedData,
          backgroundColor: chartColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a line chart with better validation
  const createLineChart = (canvasId, title, labels, datasets, yAxisLabel = '') => {
    if (!labels || !Array.isArray(labels) || !datasets || !Array.isArray(datasets) || datasets.length === 0) {
      console.warn(`Invalid data for line chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize labels to prevent Chart.js errors
    const sanitizedLabels = labels.map(label => String(label || ''));
    
    // Sanitize datasets
    const sanitizedDatasets = datasets.map(dataset => {
      if (!dataset || typeof dataset !== 'object') {
        return {
          label: 'Unknown',
          data: [],
          borderColor: '#4299e1',
          backgroundColor: 'rgba(66, 153, 225, 0.2)'
        };
      }
      
      return {
        label: dataset.label || 'Unknown',
        data: Array.isArray(dataset.data) ? dataset.data.map(val => typeof val === 'number' ? val : 0) : [],
        borderColor: dataset.borderColor || '#4299e1',
        backgroundColor: dataset.backgroundColor || 'rgba(66, 153, 225, 0.2)',
        tension: dataset.tension !== undefined ? dataset.tension : 0.1,
        borderWidth: dataset.borderWidth !== undefined ? dataset.borderWidth : 2,
        fill: dataset.fill !== undefined ? dataset.fill : false,
        pointRadius: dataset.pointRadius !== undefined ? dataset.pointRadius : 3
      };
    });
    
    const config = {
      type: 'line',
      data: {
        labels: sanitizedLabels,
        datasets: sanitizedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a doughnut chart with better validation
  const createDoughnutChart = (canvasId, title, labels, data, colors) => {
    if (!labels || !Array.isArray(labels) || !data || !Array.isArray(data) || labels.length !== data.length) {
      console.warn(`Invalid data for doughnut chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize data to prevent Chart.js errors
    const sanitizedLabels = labels.map(label => String(label || ''));
    const sanitizedData = data.map(val => typeof val === 'number' ? val : 0);
    
    // Default colors if not provided
    const defaultColors = [
      '#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', 
      '#68d391', '#f687b3', '#ecc94b', '#e53e3e', '#805ad5'
    ];
    
    // Use provided colors or generate enough colors
    let chartColors = colors;
    if (!chartColors || !Array.isArray(chartColors) || chartColors.length < sanitizedData.length) {
      chartColors = [];
      for (let i = 0; i < sanitizedData.length; i++) {
        chartColors.push(defaultColors[i % defaultColors.length]);
      }
    }
    
    const config = {
      type: 'doughnut',
      data: {
        labels: sanitizedLabels,
        datasets: [{
          data: sanitizedData,
          backgroundColor: chartColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a radar chart with better validation
  const createRadarChart = (canvasId, title, labels, datasets) => {
    if (!labels || !Array.isArray(labels) || !datasets || !Array.isArray(datasets) || datasets.length === 0) {
      console.warn(`Invalid data for radar chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize labels
    const sanitizedLabels = labels.map(label => String(label || ''));
    
    // Sanitize datasets
    const sanitizedDatasets = datasets.map(dataset => {
      if (!dataset || typeof dataset !== 'object') {
        return {
          label: 'Unknown',
          data: new Array(sanitizedLabels.length).fill(0),
          backgroundColor: 'rgba(66, 153, 225, 0.2)',
          borderColor: '#4299e1'
        };
      }
      
      return {
        label: dataset.label || 'Unknown',
        data: Array.isArray(dataset.data) ? 
          dataset.data.map(val => typeof val === 'number' ? val : 0) : 
          new Array(sanitizedLabels.length).fill(0),
        backgroundColor: dataset.backgroundColor || 'rgba(66, 153, 225, 0.2)',
        borderColor: dataset.borderColor || '#4299e1',
        borderWidth: dataset.borderWidth !== undefined ? dataset.borderWidth : 2,
        pointBackgroundColor: dataset.pointBackgroundColor || dataset.borderColor || '#4299e1',
        pointBorderColor: dataset.pointBorderColor || '#fff',
        pointHoverBackgroundColor: dataset.pointHoverBackgroundColor || '#fff',
        pointHoverBorderColor: dataset.pointHoverBorderColor || dataset.borderColor || '#4299e1'
      };
    });
    
    const config = {
      type: 'radar',
      data: {
        labels: sanitizedLabels,
        datasets: sanitizedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          r: {
            beginAtZero: true
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a horizontal bar chart with better validation
  const createHorizontalBarChart = (canvasId, title, labels, currentData, comparisonData, colors, xAxisLabel = '') => {
    if (!labels || !Array.isArray(labels) || !currentData || !Array.isArray(currentData) || labels.length !== currentData.length) {
      console.warn(`Invalid data for horizontal bar chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize data
    const sanitizedLabels = labels.map(label => String(label || ''));
    const sanitizedCurrentData = currentData.map(val => typeof val === 'number' ? val : 0);
    
    const datasets = [
      {
        label: 'Current Period',
        data: sanitizedCurrentData,
        backgroundColor: colors?.current || '#4299e1',
        borderColor: colors?.currentBorder || '#3182ce',
        borderWidth: 1
      }
    ];
    
    // Add comparison data if provided
    if (comparisonData && Array.isArray(comparisonData) && comparisonData.length === currentData.length) {
      const sanitizedComparisonData = comparisonData.map(val => typeof val === 'number' ? val : 0);
      
      datasets.push({
        label: 'Comparison Period',
        data: sanitizedComparisonData,
        backgroundColor: colors?.comparison || '#9f7aea',
        borderColor: colors?.comparisonBorder || '#805ad5',
        borderWidth: 1
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: sanitizedLabels,
        datasets: datasets
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: !!xAxisLabel,
              text: xAxisLabel
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a stacked bar chart with better validation
  const createStackedBarChart = (canvasId, title, labels, datasets, yAxisLabel = '') => {
    if (!labels || !Array.isArray(labels) || !datasets || !Array.isArray(datasets) || datasets.length === 0) {
      console.warn(`Invalid data for stacked bar chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize labels
    const sanitizedLabels = labels.map(label => String(label || ''));
    
    // Sanitize datasets
    const sanitizedDatasets = datasets.map(dataset => {
      if (!dataset || typeof dataset !== 'object') {
        return {
          label: 'Unknown',
          data: new Array(sanitizedLabels.length).fill(0),
          backgroundColor: '#4299e1'
        };
      }
      
      return {
        label: dataset.label || 'Unknown',
        data: Array.isArray(dataset.data) ? 
          dataset.data.map(val => typeof val === 'number' ? val : 0) : 
          new Array(sanitizedLabels.length).fill(0),
        backgroundColor: dataset.backgroundColor || '#4299e1',
        borderColor: dataset.borderColor,
        borderWidth: dataset.borderWidth !== undefined ? dataset.borderWidth : 1
      };
    });
    
    const config = {
      type: 'bar',
      data: {
        labels: sanitizedLabels,
        datasets: sanitizedDatasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // FIXED: Create a standard bar chart with better validation
  const createBarChart = (canvasId, title, labels, data, comparisonData, colors, yAxisLabel = '') => {
    if (!labels || !Array.isArray(labels) || !data || !Array.isArray(data) || labels.length !== data.length) {
      console.warn(`Invalid data for bar chart ${canvasId}`);
      clearChart(canvasId);
      showNoDataMessage(document.getElementById(canvasId));
      return;
    }
    
    // Sanitize data
    const sanitizedLabels = labels.map(label => String(label || ''));
    const sanitizedData = data.map(val => typeof val === 'number' ? val : 0);
    
    const datasets = [
      {
        label: 'Current Period',
        data: sanitizedData,
        backgroundColor: colors?.current || '#4299e1',
        borderColor: colors?.currentBorder || '#3182ce',
        borderWidth: 1
      }
    ];
    
    // Add comparison data if provided
    if (comparisonData && Array.isArray(comparisonData) && comparisonData.length === data.length) {
      const sanitizedComparisonData = comparisonData.map(val => typeof val === 'number' ? val : 0);
      
      datasets.push({
        label: 'Comparison Period',
        data: sanitizedComparisonData,
        backgroundColor: colors?.comparison || '#9f7aea',
        borderColor: colors?.comparisonBorder || '#805ad5',
        borderWidth: 1
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: sanitizedLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: !!title,
            text: title
          },
          legend: {
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: !!yAxisLabel,
              text: yAxisLabel
            }
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  

  // Return the public interface
  return {
    createChart,
    clearChart,
    createComparisonBarChart,
    createPieChart,
    createLineChart,
    createDoughnutChart,
    createRadarChart,
    createHorizontalBarChart,
    createStackedBarChart,
    createBarChart
  };
}