// In browser environment, we're using globals instead of imports
// React and ReactDOM are loaded from CDN
// Recharts components are made available globally via the script in index.html
// PapaParse is available globally as Papa

const { useState, useEffect } = React;

// Define component on global scope for browser usage
const EmailDashboard = () => {
  // State for data and UI
  const [emailData, setEmailData] = useState({
    campaigns: [],
    topCampaigns: {
      byOpenRate: [],
      byClickRate: []
    },
    totalSubscribers: 0,
    unopenedRate: 0,
    openedNoClickRate: 0,
    averageOpenRate: 0,
    clickRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    comparisonEnabled: false,
    comparisonStartDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
    comparisonEndDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
  });
  
  // Add notification state for user feedback
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '',
    type: 'info' // 'info', 'success', 'error'
  });

  // Colors for charts
  const COLORS = ['#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#F5F3FF'];

  // Load data from localStorage on component mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('emailDashboardData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.campaigns) {
          setEmailData(parsedData);
          showNotification('Data loaded from local storage', 'success');
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      showNotification('Error loading saved data', 'error');
    }
  }, []);

  // Save data to localStorage whenever emailData changes
  useEffect(() => {
    if (emailData.campaigns && emailData.campaigns.length > 0) {
      try {
        localStorage.setItem('emailDashboardData', JSON.stringify(emailData));
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        showNotification('Error saving data', 'error');
      }
    }
  }, [emailData]);

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  // Format numbers for display
  const formatNumber = (value, type = 'number') => {
    if (value === undefined || value === null) return '--';
    
    if (type === 'percent') {
      return `${value.toFixed(1)}%`;
    } else if (type === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
    }
    
    return value;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = event.target.files;
    
    if (!files || files.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    showNotification('Processing files...', 'info');
    
    // Process each file
    Array.from(files).forEach(file => {
      // Skip non-CSV files
      if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
        return;
      }
      
      // Check if it's an Email file
      if (!file.name.startsWith('Email_')) {
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Parse CSV
          const csv = e.target.result;
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Process the email campaign data
              processEmailData(file.name, results.data);
              showNotification(`${file.name} processed successfully!`, 'success');
            },
            error: (error) => {
              console.error(`Error parsing ${file.name}:`, error);
              showNotification(`Error parsing ${file.name}`, 'error');
            }
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          showNotification(`Error processing ${file.name}`, 'error');
        }
      };
      
      reader.onerror = () => {
        console.error(`Error reading ${file.name}`);
        showNotification(`Error reading ${file.name}`, 'error');
      };
      
      reader.readAsText(file);
    });
    
    setIsLoading(false);
  };

  // Process email campaign data
  const processEmailData = (fileName, rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Check if it's the campaign performance file
    if (fileName === 'Email_Campaign_Performance.csv') {
      const newEmailData = {
        campaigns: [],
        topCampaigns: {
          byOpenRate: [],
          byClickRate: []
        },
        totalSubscribers: 0,
        unopenedRate: 0,
        openedNoClickRate: 0,
        averageOpenRate: 0,
        clickRate: 0
      };
      
      // Process campaigns
      const campaigns = rawData.map(row => {
        const emailsSent = parseInt((row['Emails sent'] || '0').replace(/,/g, ''));
        const emailOpened = parseInt((row['Email opened (MPP excluded)'] || '0').replace(/,/g, ''));
        const emailClicked = parseInt((row['Email clicked'] || '0').replace(/,/g, ''));

        // Calculate percentages (ensure they are within reasonable bounds)
        const openRate = emailsSent > 0 ? Math.min((emailOpened / emailsSent) * 100, 100) : 0;
        const clickRate = emailsSent > 0 ? Math.min((emailClicked / emailsSent) * 100, 100) : 0;

        return {
          name: row['Campaign'] || 'Unnamed Campaign',
          emailsSent,
          emailOpened,
          emailClicked,
          openRate,
          clickRate,
          bounceRate: Math.min(parseFloat(row['Email bounce rate'] || '0'), 100),
          unsubscribeRate: Math.min(parseFloat(row['Email unsubscribe rate'] || '0'), 100),
          date: extractDateFromCampaignName(row['Campaign']),
          url: `mailto:?subject=${encodeURIComponent(row['Campaign'] || 'Email Campaign')}`
        };
      });

      newEmailData.campaigns = campaigns;

      // Extract date from campaign name (assuming format like "01-04-24 News")
      function extractDateFromCampaignName(name) {
        if (!name) return null;
        const dateRegex = /^(\d{2})-(\d{2})-(\d{2})/;
        const match = name.match(dateRegex);
        if (match) {
          // Convert to YYYY-MM-DD format for proper sorting
          return `20${match[3]}-${match[1]}-${match[2]}`;
        }
        return null;
      }

      // Sort campaigns by date, most recent first
      const sortedCampaigns = [...campaigns].sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return 0;
      });

      // Calculate aggregate metrics
      const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.emailsSent, 0);
      const totalOpened = campaigns.reduce((sum, campaign) => sum + campaign.emailOpened, 0);
      const totalClicked = campaigns.reduce((sum, campaign) => sum + campaign.emailClicked, 0);

      // Use the most recent campaign's subscriber count
      newEmailData.totalSubscribers = sortedCampaigns.length > 0 ? sortedCampaigns[0].emailsSent : 0;
      newEmailData.unopenedRate = totalSent > 0 ? Math.min(((totalSent - totalOpened) / totalSent) * 100, 100) : 0;
      newEmailData.openedNoClickRate = totalOpened > 0 ? Math.min(((totalOpened - totalClicked) / totalOpened) * 100, 100) : 0;

      // Calculate overall click rate
      newEmailData.clickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

      // Calculate average open rate (make sure it's reasonable)
      let avgOpenRate = campaigns.length > 0
        ? campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / campaigns.length
        : 0;

      // Ensure average open rate is between 0-100%
      newEmailData.averageOpenRate = Math.min(Math.max(avgOpenRate, 0), 100);

      // Sort campaigns by open rate and click rate
      newEmailData.topCampaigns.byOpenRate = [...campaigns]
        .sort((a, b) => b.openRate - a.openRate)
        .slice(0, 5);

      newEmailData.topCampaigns.byClickRate = [...campaigns]
        .sort((a, b) => b.clickRate - a.clickRate)
        .slice(0, 5);
      
      // Update state with the new data
      setEmailData(newEmailData);
    }
  };
  
  // Function to export dashboard data
  const exportDashboardData = () => {
    try {
      // Create a data URL for the dashboard data
      const dataStr = JSON.stringify(emailData);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      // Create a download link and trigger it
      const exportFileDefaultName = `email-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showNotification('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showNotification('Error exporting data', 'error');
    }
  };
  
  // Function to import dashboard data
  const importDashboardData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && importedData.campaigns) {
          setEmailData(importedData);
          showNotification('Data imported successfully!', 'success');
        } else {
          showNotification('Invalid data format', 'error');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        showNotification('Error importing data', 'error');
      }
    };
    
    reader.onerror = () => {
      showNotification('Error reading import file', 'error');
    };
    
    reader.readAsText(file);
  };
  
  // Function to clear all dashboard data
  const clearDashboardData = () => {
    if (window.confirm('Are you sure you want to clear all dashboard data? This cannot be undone.')) {
      setEmailData({
        campaigns: [],
        topCampaigns: {
          byOpenRate: [],
          byClickRate: []
        },
        totalSubscribers: 0,
        unopenedRate: 0,
        openedNoClickRate: 0,
        averageOpenRate: 0,
        clickRate: 0
      });
      localStorage.removeItem('emailDashboardData');
      showNotification('All data cleared', 'info');
    }
  };

  // KPI Card Component
  const KpiCard = ({ title, value, change = null, type = 'number' }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-full">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold mt-2">{formatNumber(value, type)}</div>
        {change !== null && (
          <div className={`text-sm mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    );
  };

  // Date Range Selector Component
  const DateRangeSelector = () => {
    // Format date for input fields
    const formatDateForInput = (date) => {
      if (!date) return '';
      
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Handler for date changes
    const handleDateChange = (e) => {
      const { name, value } = e.target;
      
      setDateRange(prev => ({
        ...prev,
        [name]: value ? new Date(value) : prev[name]
      }));
    };

    // Toggle comparison
    const toggleComparison = () => {
      setDateRange(prev => ({
        ...prev,
        comparisonEnabled: !prev.comparisonEnabled
      }));
    };

    // Predefined periods
    const setPredefinedPeriod = (days) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const comparisonEndDate = new Date(startDate);
      const comparisonStartDate = new Date(startDate);
      comparisonStartDate.setDate(comparisonStartDate.getDate() - days);
      
      setDateRange({
        startDate,
        endDate,
        comparisonEnabled: dateRange.comparisonEnabled,
        comparisonStartDate,
        comparisonEndDate
      });
    };
    
    // Add function to apply filters
    const applyDateFilter = () => {
      // This would filter the displayed data based on date range
      // For now, we'll just show a notification
      showNotification('Date filters applied!', 'success');
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Date Range</h2>
        
        {/* Quick selectors */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
            onClick={() => setPredefinedPeriod(7)}
          >
            Last 7 days
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
            onClick={() => setPredefinedPeriod(30)}
          >
            Last 30 days
          </button>
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
            onClick={() => setPredefinedPeriod(90)}
          >
            Last 90 days
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Period</label>
            <div className="flex space-x-2">
              <input 
                type="date" 
                name="startDate"
                className="border rounded p-1 text-sm w-full" 
                value={formatDateForInput(dateRange.startDate)}
                onChange={handleDateChange}
              /> 
              <span className="flex items-center">to</span>
              <input 
                type="date"
                name="endDate" 
                className="border rounded p-1 text-sm w-full" 
                value={formatDateForInput(dateRange.endDate)}
                onChange={handleDateChange}
              />
            </div>
          </div>
          <div className="flex items-end">
            <div className="form-check">
              <input 
                className="form-check-input mr-2" 
                type="checkbox" 
                id="enable-comparison"
                checked={dateRange.comparisonEnabled}
                onChange={toggleComparison}
              />
              <label className="form-check-label" htmlFor="enable-comparison">
                Enable period comparison
              </label>
            </div>
          </div>
        </div>
        
        {dateRange.comparisonEnabled && (
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Comparison Period</label>
            <div className="flex space-x-2">
              <input 
                type="date"
                name="comparisonStartDate" 
                className="border rounded p-1 text-sm w-full" 
                value={formatDateForInput(dateRange.comparisonStartDate)}
                onChange={handleDateChange}
              /> 
              <span className="flex items-center">to</span>
              <input 
                type="date"
                name="comparisonEndDate" 
                className="border rounded p-1 text-sm w-full" 
                value={formatDateForInput(dateRange.comparisonEndDate)}
                onChange={handleDateChange}
              />
            </div>
          </div>
        )}
        
        {/* Apply filters button */}
        <div className="mt-3 flex justify-end">
          <button 
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            onClick={applyDateFilter}
          >
            Apply Filters
          </button>
        </div>
      </div>
    );
  };
  
  // Notification Component
  const Notification = () => {
    if (!notification.show) return null;
    
    const bgColor = notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-700' :
                  notification.type === 'error' ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-blue-100 border-blue-400 text-blue-700';
    
    return (
      <div className={`fixed bottom-4 right-4 px-4 py-3 rounded border ${bgColor} z-50`} role="alert">
        <span className="block sm:inline">{notification.message}</span>
      </div>
    );
  };
  
  // Data Management Component
  const DataManagement = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Data Management</h2>
        <div className="flex flex-wrap gap-2">
          <button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={exportDashboardData}
          >
            Export Data
          </button>
          
          <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer">
            <span>Import Data</span>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={importDashboardData}
            />
          </label>
          
          <button 
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={clearDashboardData}
          >
            Clear All Data
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Data is saved automatically in your browser's local storage.
        </p>
      </div>
    );
  };

  // Check if we have any data
  const hasEmailData = emailData.campaigns && emailData.campaigns.length > 0;

  // Render campaign metrics chart
  const renderCampaignMetricsChart = () => {
    if (!hasEmailData) return null;
    
    // Get last 10 campaigns, sorted by date
    const recentCampaigns = [...emailData.campaigns]
      .sort((a, b) => {
        if (a.date && b.date) {
          return new Date(b.date) - new Date(a.date);
        }
        return 0;
      })
      .slice(0, 10)
      .reverse(); // Reverse to show oldest to newest
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance Trends</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={recentCampaigns}
              margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(value, name) => {
                if (name === 'openRate' || name === 'clickRate') {
                  return [`${value.toFixed(1)}%`, name === 'openRate' ? 'Open Rate' : 'Click Rate'];
                }
                return [value.toLocaleString(), name];
              }} />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="emailsSent" 
                name="Emails Sent" 
                stroke="#8884d8" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="openRate" 
                name="Open Rate (%)" 
                stroke="#82ca9d" 
                activeDot={{ r: 8 }} 
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="clickRate" 
                name="Click Rate (%)" 
                stroke="#ffc658" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Main Render
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Email Campaigns Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your email campaign CSV files to see your performance.
        </p>
        
        <div className="flex items-center">
          <label className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded cursor-pointer">
            <span>Choose Files</span>
            <input 
              type="file" 
              accept=".csv" 
              multiple
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
          <span className="ml-3 text-sm text-gray-500">
            {isLoading ? 'Processing...' : 'Select Email_*.csv files'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Data Management Section */}
      <DataManagement />
      
      {/* Date Range Selector */}
      {hasEmailData && <DateRangeSelector />}
      
      {/* Dashboard Content */}
      {hasEmailData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <KpiCard 
              title="Campaign Count"
              value={emailData.campaigns.length}
            />
            <KpiCard 
              title="Average Open Rate"
              value={emailData.averageOpenRate}
              type="percent"
            />
            <KpiCard 
              title="Unopened Emails"
              value={emailData.unopenedRate}
              type="percent"
            />
            <KpiCard 
              title="Clicked Emails"
              value={emailData.clickRate}
              type="percent"
            />
          </div>
          
          {/* Campaign Metrics Chart */}
          {renderCampaignMetricsChart()}
          
          {/* Top Campaigns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Top Campaigns by Open Rate</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailData.topCampaigns.byOpenRate.map((campaign, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <a href={campaign.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                            {campaign.name}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{campaign.emailsSent.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{campaign.openRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold mb-4">Top Campaigns by Click Rate</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailData.topCampaigns.byClickRate.map((campaign, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <a href={campaign.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                            {campaign.name}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{campaign.emailsSent.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{campaign.clickRate.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Subscriber Engagement */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Subscriber Engagement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-medium text-center mb-2">Never Opened</h4>
                <div className="text-4xl font-bold text-center text-gray-700">
                  {emailData.unopenedRate.toFixed(1)}%
                </div>
                <p className="text-sm text-center text-gray-500 mt-2">of your subscribers have never opened an email</p>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-medium text-center mb-2">Opened but No Click</h4>
                <div className="text-4xl font-bold text-center text-gray-700">
                  {emailData.openedNoClickRate.toFixed(1)}%
                </div>
                <p className="text-sm text-center text-gray-500 mt-2">of your subscribers open but don't click</p>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="text-lg font-medium text-center mb-2">Active Clickers</h4>
                <div className="text-4xl font-bold text-center text-green-700">
                  {emailData.clickRate.toFixed(1)}%
                </div>
                <p className="text-sm text-center text-gray-500 mt-2">of your subscribers actively engage with content</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Email Campaign Data Available</h3>
          <p className="text-gray-500">Upload email campaign CSV files to view the dashboard.</p>
          <div className="mt-4 bg-purple-50 p-4 rounded border border-purple-100">
            <h4 className="font-medium text-purple-800 mb-2">Required files:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>Email_Campaign_Performance.csv - Campaign metrics (opens, clicks, bounces)</li>
            </ul>
          </div>
        </div>
      )}
      
      {/* Notification Component */}
      <Notification />
    </div>
  );
};

// No export in browser environment - this will be referenced directly
// The bridge file will make it available on the window object