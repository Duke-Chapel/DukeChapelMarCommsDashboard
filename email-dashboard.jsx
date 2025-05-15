// Define component on global scope for browser usage
const EmailDashboard = () => {
  // State for data and UI
  const [emailData, setEmailData] = React.useState({
    campaigns: [],
    subscribers: {
      total: 0,
      unopened: 0,
      openedNoClick: 0
    }
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [dateRange, setDateRange] = React.useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    comparisonEnabled: false,
    comparisonStartDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
    comparisonEndDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
    
    // Process each file
    Array.from(files).forEach(file => {
      // Skip non-CSV files
      if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
        return;
      }
      
      // Check if it's an Email Campaign file
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
              // Process the campaign data
              processEmailData(results.data);
            },
            error: (error) => {
              console.error(`Error parsing ${file.name}:`, error);
              setError(`Error parsing ${file.name}: ${error.message}`);
            }
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setError(`Error processing ${file.name}: ${error.message}`);
        }
      };
      
      reader.onerror = () => {
        console.error(`Error reading ${file.name}`);
        setError(`Error reading ${file.name}`);
      };
      
      reader.readAsText(file);
    });
    
    setIsLoading(false);
  };

  // Process email campaign data
  const processEmailData = (rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Format and prepare campaign data
    const campaigns = rawData.map(row => {
      const emailsSent = parseInt(row['Emails sent'] || '0');
      const emailOpened = parseInt(row['Email opened (MPP excluded)'] || '0');
      const emailClicked = parseInt(row['Email clicked'] || '0');
      
      // Calculate percentages
      const openRate = emailsSent > 0 ? (emailOpened / emailsSent) * 100 : 0;
      const clickRate = emailsSent > 0 ? (emailClicked / emailsSent) * 100 : 0;
      const clickToOpenRate = emailOpened > 0 ? (emailClicked / emailOpened) * 100 : 0;
      
      return {
        name: row['Campaign'] || 'Unnamed Campaign',
        emailsSent: emailsSent,
        emailOpened: emailOpened,
        emailClicked: emailClicked,
        emailBounces: parseInt(row['Email bounces'] || '0'),
        emailUnsubscribes: parseInt(row['Email unsubscribes'] || '0'),
        openRate: openRate,
        clickRate: clickRate,
        clickToOpenRate: clickToOpenRate,
        bounceRate: parseFloat(row['Email bounce rate'] || '0'),
        unsubscribeRate: parseFloat(row['Email unsubscribe rate'] || '0'),
        date: new Date() // You may want to extract the date from the campaign name or other field
      };
    });
    
    // Calculate subscriber metrics
    const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.emailsSent, 0);
    const totalOpened = campaigns.reduce((sum, campaign) => sum + campaign.emailOpened, 0);
    const totalClicked = campaigns.reduce((sum, campaign) => sum + campaign.emailClicked, 0);
    
    // Calculate percentages
    const unopenedPercentage = totalSent > 0 ? ((totalSent - totalOpened) / totalSent) * 100 : 0;
    const openedNoClickPercentage = totalSent > 0 ? ((totalOpened - totalClicked) / totalSent) * 100 : 0;
    
    // Update state with processed data
    setEmailData({
      campaigns: campaigns,
      subscribers: {
        total: totalSent,
        unopened: unopenedPercentage,
        openedNoClick: openedNoClickPercentage
      }
    });
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
      </div>
    );
  };

  // Check if we have any data
  const hasEmailData = emailData.campaigns && emailData.campaigns.length > 0;

  // Render top metrics
  const renderTopMetrics = () => {
    const metrics = [
      { 
        title: 'Total Subscribers',
        value: emailData.subscribers.total || 0 
      },
      { 
        title: 'Average Open Rate',
        value: emailData.campaigns.length > 0 
          ? emailData.campaigns.reduce((sum, campaign) => sum + campaign.openRate, 0) / emailData.campaigns.length
          : 0,
        type: 'percent'
      },
      { 
        title: 'Unopened Emails',
        value: emailData.subscribers.unopened || 0,
        type: 'percent'
      },
      { 
        title: 'Opened but No Click',
        value: emailData.subscribers.openedNoClick || 0,
        type: 'percent'
      }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <KpiCard 
            key={index}
            title={metric.title}
            value={metric.value}
            type={metric.type || 'number'}
          />
        ))}
      </div>
    );
  };

  // Render top campaigns by open rate
  const renderTopCampaigns = () => {
    if (!hasEmailData) return null;
    
    // Sort campaigns by open rate
    const topCampaignsByOpenRate = [...emailData.campaigns]
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);
      
    // Sort campaigns by click rate
    const topCampaignsByClickRate = [...emailData.campaigns]
      .sort((a, b) => b.clickRate - a.clickRate)
      .slice(0, 5);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top 5 Campaigns by Open Rate</h3>
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
                {topCampaignsByOpenRate.map((campaign, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900">{campaign.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.emailsSent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.openRate, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top 5 Campaigns by Click Rate</h3>
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
                {topCampaignsByClickRate.map((campaign, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm text-gray-900">{campaign.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.emailsSent)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.clickRate, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render engagement charts
  const renderEngagementCharts = () => {
    if (!hasEmailData) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Email Engagement Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Unopened', value: emailData.subscribers.unopened },
                    { name: 'Opened (No Click)', value: emailData.subscribers.openedNoClick },
                    { name: 'Clicked', value: 100 - emailData.subscribers.unopened - emailData.subscribers.openedNoClick }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {[
                    { name: 'Unopened', color: '#E0E0E0' },
                    { name: 'Opened (No Click)', color: '#FFC658' },
                    { name: 'Clicked', color: '#0088FE' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Open vs. Click Rates</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={emailData.campaigns.slice(0, 5)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                <Legend />
                <Bar dataKey="openRate" name="Open Rate" fill="#0088FE" />
                <Bar dataKey="clickRate" name="Click Rate" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render subscriber metrics
  const renderSubscriberMetrics = () => {
    if (!hasEmailData) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">Subscriber Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="text-lg font-medium text-center mb-2">Never Opened</h4>
            <div className="text-4xl font-bold text-center text-gray-700">
              {formatNumber(emailData.subscribers.unopened, 'percent')}
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">of your subscribers have never opened an email</p>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="text-lg font-medium text-center mb-2">Opened but No Click</h4>
            <div className="text-4xl font-bold text-center text-gray-700">
              {formatNumber(emailData.subscribers.openedNoClick, 'percent')}
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">of your subscribers open but don't click</p>
          </div>
          
          <div className="p-4 border rounded-lg bg-gray-50">
            <h4 className="text-lg font-medium text-center mb-2">Active Clickers</h4>
            <div className="text-4xl font-bold text-center text-green-700">
              {formatNumber(100 - emailData.subscribers.unopened - emailData.subscribers.openedNoClick, 'percent')}
            </div>
            <p className="text-sm text-center text-gray-500 mt-2">of your subscribers actively engage with content</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Email Campaign Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your email campaign CSV files to see your analytics.
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
      
      {/* Date Range Selector */}
      {hasEmailData && <DateRangeSelector />}
      
      {/* Dashboard Content */}
      {hasEmailData ? (
        <>
          {/* Top Metrics */}
          {renderTopMetrics()}
          
          {/* Top Campaigns */}
          {renderTopCampaigns()}
          
          {/* Engagement Charts */}
          {renderEngagementCharts()}
          
          {/* Subscriber Metrics */}
          {renderSubscriberMetrics()}
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
    </div>
  );
};

// No export in browser environment - this will be referenced directly