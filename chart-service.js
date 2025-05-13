// Chart creation and management for the dashboard
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
      window.chartInstances[canvasId].destroy();
      delete window.chartInstances[canvasId];
    }
    
    // Extra precaution: Look for any global Chart.js instances
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          console.log(`Found global Chart.js instance for ${canvasId}, destroying`);
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
      
      // Verify the data for the chart
      const hasData = checkChartHasData(config);
      if (!hasData) {
        console.log(`No valid data available for chart ${canvasId}`);
        
        // Show empty state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#6c757d';
        ctx.textAlign = 'center';
        ctx.fillText('No data available for the selected period', 
                    canvas.width / 2, canvas.height / 2);
        return null;
      }
      
      // Create a new chart
      window.chartInstances[canvasId] = new Chart(ctx, config);
      console.log(`Successfully created chart for ${canvasId}`);
      return window.chartInstances[canvasId];
    } catch (error) {
      console.error(`Error creating chart on ${canvasId}:`, error);
      // Clean up the canvas if chart creation failed
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#dc3545';
        ctx.textAlign = 'center';
        ctx.fillText(`Error creating chart: ${error.message}`, canvas.width / 2, canvas.height / 2);
      }
      return null;
    }
  };
  
  // Helper function to check if chart data is valid
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
  
  // Helper function to clear a chart
  const clearChart = (canvasId) => {
    if (window.chartInstances && window.chartInstances[canvasId]) {
      console.log(`Destroying chart in ${canvasId}`);
      window.chartInstances[canvasId].destroy();
      delete window.chartInstances[canvasId];
    }
    
    // Also check global Chart.js instances
    if (window.Chart && window.Chart.instances) {
      Object.values(window.Chart.instances).forEach(instance => {
        if (instance.canvas && instance.canvas.id === canvasId) {
          console.log(`Found global Chart.js instance for ${canvasId}, destroying`);
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
  
  // Create a comparison bar chart
  const createComparisonBarChart = (canvasId, title, labels, currentData, comparisonData, colors, yAxisLabel = '') => {
    if (!labels || !currentData || labels.length !== currentData.length) {
      console.warn(`Invalid data for comparison bar chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const datasets = [
      {
        label: 'Current Period',
        data: currentData,
        backgroundColor: colors.current || '#4299e1',
        borderColor: colors.currentBorder || '#3182ce',
        borderWidth: 1
      }
    ];
    
    // Add comparison data if provided
    if (comparisonData && comparisonData.length === currentData.length) {
      datasets.push({
        label: 'Comparison Period',
        data: comparisonData,
        backgroundColor: colors.comparison || '#9f7aea',
        borderColor: colors.comparisonBorder || '#805ad5',
        borderWidth: 1
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: labels,
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
  
  // Create a pie chart
  const createPieChart = (canvasId, title, labels, data, colors) => {
    if (!labels || !data || labels.length !== data.length) {
      console.warn(`Invalid data for pie chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const config = {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors || [
            '#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', 
            '#68d391', '#f687b3', '#ecc94b', '#e53e3e', '#805ad5'
          ]
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
  
  // Create a line chart
  const createLineChart = (canvasId, title, labels, datasets, yAxisLabel = '') => {
    if (!labels || !datasets || datasets.length === 0) {
      console.warn(`Invalid data for line chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const config = {
      type: 'line',
      data: {
        labels: labels,
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
  
  // Create a doughnut chart
  const createDoughnutChart = (canvasId, title, labels, data, colors) => {
    if (!labels || !data || labels.length !== data.length) {
      console.warn(`Invalid data for doughnut chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const config = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors || [
            '#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', 
            '#68d391', '#f687b3', '#ecc94b', '#e53e3e', '#805ad5'
          ]
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
  
  // Create a radar chart
  const createRadarChart = (canvasId, title, labels, datasets) => {
    if (!labels || !datasets || datasets.length === 0) {
      console.warn(`Invalid data for radar chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const config = {
      type: 'radar',
      data: {
        labels: labels,
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
          r: {
            beginAtZero: true
          }
        }
      }
    };
    
    return createChart(canvasId, config);
  };
  
  // Create a horizontal bar chart
  const createHorizontalBarChart = (canvasId, title, labels, currentData, comparisonData, colors, xAxisLabel = '') => {
    if (!labels || !currentData || labels.length !== currentData.length) {
      console.warn(`Invalid data for horizontal bar chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const datasets = [
      {
        label: 'Current Period',
        data: currentData,
        backgroundColor: colors.current || '#4299e1',
        borderColor: colors.currentBorder || '#3182ce',
        borderWidth: 1
      }
    ];
    
    // Add comparison data if provided
    if (comparisonData && comparisonData.length === currentData.length) {
      datasets.push({
        label: 'Comparison Period',
        data: comparisonData,
        backgroundColor: colors.comparison || '#9f7aea',
        borderColor: colors.comparisonBorder || '#805ad5',
        borderWidth: 1
      });
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: labels,
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
  
  // Create a stacked bar chart
  const createStackedBarChart = (canvasId, title, labels, datasets, yAxisLabel = '') => {
    if (!labels || !datasets || datasets.length === 0) {
      console.warn(`Invalid data for stacked bar chart ${canvasId}`);
      clearChart(canvasId);
      return;
    }
    
    const config = {
      type: 'bar',
      data: {
        labels: labels,
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
    createStackedBarChart
  };
}
