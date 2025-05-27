// In browser environment, we're using globals instead of imports
// React and ReactDOM are loaded from CDN
// Recharts components are made available globally via the script in index.html
// PapaParse is available globally as Papa

const { useState, useEffect } = React;

// Define component on global scope for browser usage
const YouTubeDashboard = () => {
  // State for data and UI
  const [youtubeData, setYoutubeData] = useState({
    ageData: null,
    genderData: null,
    geographyData: null,
    subscriptionData: null,
    contentData: null
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

  // Colors for charts
  const COLORS = ['#FF0000', '#4299e1', '#f687b3', '#9f7aea', '#68d391', '#f6ad55', '#fc8181'];

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
    } else if (type === 'time') {
      // Format time values like "0:02:36" 
      return value;
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
      
      // Check if it's a YouTube file
      if (!file.name.startsWith('YouTube_')) {
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Determine the file type from its name
          let dataType = file.name.replace('YouTube_', '').replace('.csv', '');
          
          // Parse CSV
          const csv = e.target.result;
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Process the data based on type
              processYouTubeData(dataType, results.data);
            },
            error: (error) => {
              console.error(`Error parsing ${file.name}:`, error);
            }
          });
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
        }
      };
      
      reader.onerror = () => {
        console.error(`Error reading ${file.name}`);
      };
      
      reader.readAsText(file);
    });
    
    setIsLoading(false);
  };

  // Process YouTube data based on file type
  const processYouTubeData = (dataType, rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Update data based on the type
    switch (dataType) {
      case 'Age':
        // Process age demographics
        const ageData = rawData.map(row => ({
          age: row['Viewer age'] || 'Unknown',
          percentage: parseFloat(row['Views (%)'] || 0),
          avgViewDuration: row['Average view duration'] || '0:00',
          avgPercentViewed: parseFloat(row['Average percentage viewed (%)'] || 0),
          watchTimePercentage: parseFloat(row['Watch time (hours) (%)'] || 0)
        }));
        
        setYoutubeData(prevData => ({
          ...prevData,
          ageData
        }));
        break;
        
      case 'Gender':
        // Process gender demographics
        const genderData = rawData.map(row => ({
          gender: row['Viewer gender'] || 'Unknown',
          percentage: parseFloat(row['Views (%)'] || 0),
          avgViewDuration: row['Average view duration'] || '0:00',
          avgPercentViewed: parseFloat(row['Average percentage viewed (%)'] || 0),
          watchTimePercentage: parseFloat(row['Watch time (hours) (%)'] || 0)
        }));
        
        setYoutubeData(prevData => ({
          ...prevData,
          genderData
        }));
        break;
        
      case 'Geography':
        // Process geography data
        const geographyData = rawData.map(row => ({
          country: row['Geography'] || 'Unknown',
          views: parseInt(row['Views'] || 0),
          watchTime: parseFloat(row['Watch time (hours)'] || 0),
          avgViewDuration: row['Average view duration'] || '0:00'
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);  // Top 10 countries
        
        setYoutubeData(prevData => ({
          ...prevData,
          geographyData
        }));
        break;
        
      case 'Subscription_Status':
        // Process subscription status data
        const subscriptionData = rawData.map(row => ({
          status: row['Subscription status'] || 'Unknown',
          views: parseInt(row['Views'] || 0),
          watchTime: parseFloat(row['Watch time (hours)'] || 0),
          avgViewDuration: row['Average view duration'] || '0:00'
        }));
        
        // Calculate percentages
        const totalViews = subscriptionData.reduce((sum, item) => sum + item.views, 0);
        
        if (totalViews > 0) {
          subscriptionData.forEach(item => {
            item.percentage = (item.views / totalViews) * 100;
          });
        }
        
        setYoutubeData(prevData => ({
          ...prevData,
          subscriptionData,
          metrics: {
            ...prevData.metrics,
            totalViews: totalViews
          }
        }));
        break;
        
      case 'Content':
        // Process video content data
        const contentData = rawData.map(row => ({
          videoTitle: row['Video title'] || 'Untitled',
          publishTime: row['Video publish time'] || '',
          duration: parseFloat(row['Duration'] || 0),
          views: parseInt(row['Views'] || 0),
          watchTime: parseFloat(row['Watch time (hours)'] || 0),
          likes: parseInt(row['Likes'] || 0),
          comments: parseInt(row['Comments added'] || 0),
          shares: parseInt(row['Shares'] || 0),
          subscribers: parseInt(row['Subscribers'] || 0),
          impressions: parseInt(row['Impressions'] || 0),
          ctr: parseFloat(row['Impressions click-through rate (%)'] || 0)
        }))
        .sort((a, b) => b.views - a.views);
        
        // Calculate channel totals
        const totalContentViews = contentData.reduce((sum, item) => sum + item.views, 0);
        const totalLikes = contentData.reduce((sum, item) => sum + item.likes, 0);
        const totalComments = contentData.reduce((sum, item) => sum + item.comments, 0);
        const totalShares = contentData.reduce((sum, item) => sum + item.shares, 0);
        const totalWatchTime = contentData.reduce((sum, item) => sum + item.watchTime, 0);
        const totalSubscribers = contentData.reduce((sum, item) => sum + item.subscribers, 0);
        
        // Calculate engagement rate
        const engagementRate = totalContentViews > 0 
          ? ((totalLikes + totalComments + totalShares) / totalContentViews) * 100 
          : 0;
        
        setYoutubeData(prevData => ({
          ...prevData,
          contentData,
          metrics: {
            ...prevData.metrics,
            totalViews: totalContentViews,
            totalLikes,
            totalComments,
            totalShares,
            totalWatchTime,
            totalSubscribers,
            engagementRate
          }
        }));
        break;
        
      default:
        // Ignore unknown file types
        break;
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
  const hasYoutubeData = youtubeData.ageData || youtubeData.genderData || 
                          youtubeData.subscriptionData || youtubeData.contentData ||
                          youtubeData.geographyData;

  // Render top metrics
  const renderTopMetrics = () => {
    if (!youtubeData.metrics) return null;
    
    const metrics = [
      { title: 'Total Views', value: youtubeData.metrics.totalViews || 0 },
      { title: 'Watch Time (hours)', value: youtubeData.metrics.totalWatchTime || 0 },
      { title: 'New Subscribers', value: youtubeData.metrics.totalSubscribers || 0 },
      { title: 'Engagement Rate', value: youtubeData.metrics.engagementRate || 0, type: 'percent' }
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

  // Render subscription status chart
  const renderSubscriptionStatus = () => {
    if (!youtubeData.subscriptionData) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={youtubeData.subscriptionData}
                dataKey="views"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
              >
                {youtubeData.subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  formatNumber(value), 
                  props.payload.status
                ]} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render demographics charts
  const renderDemographics = () => {
    if (!youtubeData.ageData && !youtubeData.genderData) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Age Demographics */}
        {youtubeData.ageData && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Age Demographics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={youtubeData.ageData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                  <Bar dataKey="percentage" name="Percentage of Views" fill="#FF0000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Gender Demographics */}
        {youtubeData.genderData && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Gender Demographics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={youtubeData.genderData}
                    dataKey="percentage"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ gender, percentage }) => `${gender}: ${percentage.toFixed(1)}%`}
                  >
                    {youtubeData.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#4299e1" : "#f687b3"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render top videos
  const renderTopVideos = () => {
    if (!youtubeData.contentData || youtubeData.contentData.length === 0) return null;
    
    // Top 5 videos
    const topVideos = youtubeData.contentData.slice(0, 5);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Top Performing Videos</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video Title</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Watch Time (hrs)</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVideos.map((video, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {video.videoTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.views)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.watchTime)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.likes)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.comments)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.ctr, 'percent')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render geography data
  const renderGeography = () => {
    if (!youtubeData.geographyData || youtubeData.geographyData.length === 0) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">Top Viewer Locations</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={youtubeData.geographyData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="country" type="category" />
              <Tooltip formatter={(value) => formatNumber(value)} />
              <Legend />
              <Bar dataKey="views" name="Views" fill="#FF0000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // YouTube tab navigation state
  const [youtubeTab, setYoutubeTab] = useState('overview');

  // YouTube Tab Nav Component
  const YouTubeTabNav = () => (
    <div className="mb-4">
      <div className="flex border-b">
        <button
          className={`px-4 py-2 mr-2 font-medium ${youtubeTab === 'overview' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setYoutubeTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-4 py-2 mr-2 font-medium ${youtubeTab === 'demographics' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setYoutubeTab('demographics')}
        >
          Demographics
        </button>
        <button
          className={`px-4 py-2 font-medium ${youtubeTab === 'content' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setYoutubeTab('content')}
        >
          Content
        </button>
      </div>
    </div>
  );

  // YouTube Overview Tab
  const YouTubeOverview = () => {
    if (!hasYoutubeData) return null;
    
    const metrics = [
      {
        title: 'Total Views',
        value: youtubeData.metrics?.totalViews || 0,
        type: 'number'
      },
      {
        title: 'Subscribers',
        value: youtubeData.metrics?.totalSubscribers || 0,
        type: 'number'
      },
      {
        title: 'Engagement Rate',
        value: youtubeData.metrics?.engagementRate || 0,
        type: 'percent'
      },
      {
        title: 'Top Countries',
        value: youtubeData.geographyData?.length || 0,
        type: 'number'
      }
    ];
    
    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <KpiCard 
              key={index}
              title={metric.title}
              value={metric.value}
              type={metric.type}
            />
          ))}
        </div>
        
        {/* Subscription Status */}
        {youtubeData.subscriptionData && youtubeData.subscriptionData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Subscription Status</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={youtubeData.subscriptionData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="views"
                    nameKey="status"
                    label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                  >
                    <Cell fill="#ff0000" />
                    <Cell fill="#d3d3d3" />
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-4 text-sm text-gray-600">
              <p>This chart shows views from subscribers vs. non-subscribers</p>
            </div>
          </div>
        )}
        
        {/* Top Countries */}
        {youtubeData.geographyData && youtubeData.geographyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Countries by Views</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={youtubeData.geographyData.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="country" type="category" />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#ff0000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>
    );
  };

  // YouTube Demographics Tab
  const YouTubeDemographics = () => {
    if (!hasYoutubeData || !youtubeData.demographics) return null;
    
    return (
      <>
        {/* Age Demographics */}
        {youtubeData.ageData && youtubeData.ageData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Age Demographics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={youtubeData.ageData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="age" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                  <Bar dataKey="percentage" name="Percentage" fill="#ff0000" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Gender Demographics */}
        {youtubeData.genderData && youtubeData.genderData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Gender Demographics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={youtubeData.genderData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="gender"
                    label={({ gender, percentage }) => `${gender}: ${percentage.toFixed(1)}%`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ec4899" />
                    <Cell fill="#a3a3a3" />
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Geographic Distribution (Top 10 Cities) */}
        {youtubeData.geographyData && youtubeData.geographyData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={youtubeData.geographyData.slice(0, 10)}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="views"
                    nameKey="country"
                    label
                  >
                    {youtubeData.geographyData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>
    );
  };

  // YouTube Content Tab
  const YouTubeContent = () => {
    if (!hasYoutubeData || !youtubeData.contentData || youtubeData.contentData.length === 0) return null;
    
    // Find the "top" video for each metric
    const topByViews = [...youtubeData.contentData].sort((a, b) => b.views - a.views)[0];
    const topByLikes = [...youtubeData.contentData].sort((a, b) => b.likes - a.likes)[0];
    const topByComments = [...youtubeData.contentData].sort((a, b) => b.comments - a.comments)[0];
    const topByShares = [...youtubeData.contentData].sort((a, b) => b.shares - a.shares)[0];
    
    return (
      <>
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Top Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Views</h4>
              <p className="font-medium mb-1">{topByViews.videoTitle}</p>
              <p className="text-sm">Views: {formatNumber(topByViews.views)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Liked</h4>
              <p className="font-medium mb-1">{topByLikes.videoTitle}</p>
              <p className="text-sm">Likes: {formatNumber(topByLikes.likes)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Comments</h4>
              <p className="font-medium mb-1">{topByComments.videoTitle}</p>
              <p className="text-sm">Comments: {formatNumber(topByComments.comments)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded border">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Shares</h4>
              <p className="font-medium mb-1">{topByShares.videoTitle}</p>
              <p className="text-sm">Shares: {formatNumber(topByShares.shares)}</p>
            </div>
          </div>
          
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video Title</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {youtubeData.contentData.slice(0, 5).map((video, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{video.videoTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.views)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.likes)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.comments)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(video.shares)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Video Performance Metrics */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Video Performance Analysis</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={youtubeData.contentData.slice(0, 5)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="videoTitle" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="views" name="Views" fill="#ff0000" />
                <Bar dataKey="likes" name="Likes" stackId="a" fill="#4c51bf" />
                <Bar dataKey="comments" name="Comments" stackId="a" fill="#38b2ac" />
                <Bar dataKey="shares" name="Shares" stackId="a" fill="#f6ad55" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">YouTube Analytics Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your YouTube analytics CSV files to see your channel performance.
        </p>
        
        <div className="flex items-center">
          <label className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded cursor-pointer">
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
            {isLoading ? 'Processing...' : 'Select YouTube_*.csv files'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Date Range Selector */}
      {hasYoutubeData && <DateRangeSelector />}
      
      {/* Dashboard Content */}
      {hasYoutubeData ? (
        <>
          <YouTubeTabNav />
          {youtubeTab === 'overview' && <YouTubeOverview />}
          {youtubeTab === 'demographics' && <YouTubeDemographics />}
          {youtubeTab === 'content' && <YouTubeContent />}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No YouTube Data Available</h3>
          <p className="text-gray-500">Upload YouTube CSV files to view the dashboard.</p>
          <div className="mt-4 bg-red-50 p-4 rounded border border-red-100">
            <h4 className="font-medium text-red-800 mb-2">Required files:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>YouTube_Age.csv - Age demographics of your viewers</li>
              <li>YouTube_Gender.csv - Gender demographics of your viewers</li>
              <li>YouTube_Geography.csv - Geographic distribution of viewers</li>
              <li>YouTube_Subscription_Status.csv - Subscriber vs. non-subscriber metrics</li>
              <li>YouTube_Content.csv - Performance data for your videos</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// No export in browser environment - this will be referenced directly
// The bridge file will make it available on the window object