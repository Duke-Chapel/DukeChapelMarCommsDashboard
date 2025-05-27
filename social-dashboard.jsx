// In browser environment, we're using globals instead of imports
// React and ReactDOM are loaded from CDN
// Recharts components are made available globally via the script in index.html
// PapaParse is available globally as Papa

const { useState, useEffect } = React;

// Define component on global scope for browser usage
const SocialDashboard = () => {
  // State for data and UI
  const [socialData, setSocialData] = useState({
    facebook: null,
    instagram: null
  });
  const [activeTab, setActiveTab] = useState('facebook');
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
  const COLORS = ['#4299e1', '#f687b3', '#9f7aea', '#68d391', '#f6ad55', '#fc8181'];

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
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Determine the file type from its name
          let platform = null;
          let dataType = null;
          
          if (file.name.startsWith('FB_')) {
            platform = 'facebook';
            dataType = file.name.replace('FB_', '').replace('.csv', '');
          } else if (file.name.startsWith('IG_')) {
            platform = 'instagram';
            dataType = file.name.replace('IG_', '').replace('.csv', '');
          } else {
            // Skip files that don't match our patterns
            return;
          }
          
          // Parse CSV
          const csv = e.target.result;
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Process the data based on platform and type
              if (platform === 'facebook') {
                processFacebookData(dataType, results.data);
              } else if (platform === 'instagram') {
                processInstagramData(dataType, results.data);
              }
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

  // Process Facebook data
  const processFacebookData = (dataType, rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Make a copy of existing data
    const newSocialData = { ...socialData };
    
    // Initialize Facebook data if it doesn't exist
    if (!newSocialData.facebook) {
      newSocialData.facebook = {
        pageMetrics: {
          followers: 0,
          reach: 0,
          views: 0,
          interactions: 0,
          engagement: 0
        },
        posts: [],
        demographics: [],
        followerGrowth: []
      };
    }
    
    // Process based on data type
    switch (dataType) {
      case 'Posts':
        // Process posts data
        const posts = rawData.map(row => ({
          id: row['Post ID'] || '',
          title: row['Title'] || '',
          description: row['Description'] || '',
          reach: parseInt(row['Reach'] || 0),
          reactions: parseInt(row['Reactions'] || 0),
          comments: parseInt(row['Comments'] || 0),
          shares: parseInt(row['Shares'] || 0),
          clicks: parseInt(row['Total clicks'] || 0),
          date: row['Date'] || '',
          publishTime: row['Publish time'] || ''
        }));
        
        newSocialData.facebook.posts = posts;
        break;
        
      case 'Interactions':
        // Process interactions data (daily)
        const totalInteractions = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.facebook.pageMetrics.interactions = totalInteractions;
        break;
        
      case 'Follows':
        // Process follower data
        const followerData = rawData.map(row => ({
          date: row['Date'] ? new Date(row['Date']).toISOString().split('T')[0] : '',
          followers: parseInt(row['Primary'] || 0)
        }));
        
        newSocialData.facebook.followerGrowth = followerData;
        
        // Get latest follower count
        if (followerData.length > 0) {
          newSocialData.facebook.pageMetrics.followers = followerData.reduce((max, row) => 
            Math.max(max, row.followers), 0);
        }
        break;
        
      case 'Reach':
        // Process reach data
        const totalReach = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.facebook.pageMetrics.reach = totalReach;
        break;
        
      case 'Views':
        // Process views data
        const totalViews = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.facebook.pageMetrics.views = totalViews;
        break;
        
      default:
        // Ignore other data types
        break;
    }
    
    // Calculate engagement rate
    if (newSocialData.facebook.pageMetrics.reach > 0 && newSocialData.facebook.pageMetrics.interactions > 0) {
      newSocialData.facebook.pageMetrics.engagement = 
        (newSocialData.facebook.pageMetrics.interactions / newSocialData.facebook.pageMetrics.reach) * 100;
    }
    
    // Update state with new data
    setSocialData(newSocialData);
  };

  // Process Instagram data
  const processInstagramData = (dataType, rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Make a copy of existing data
    const newSocialData = { ...socialData };
    
    // Initialize Instagram data if it doesn't exist
    if (!newSocialData.instagram) {
      newSocialData.instagram = {
        pageMetrics: {
          followers: 0,
          reach: 0,
          views: 0,
          interactions: 0,
          engagement: 0
        },
        posts: [],
        demographics: [],
        followerGrowth: []
      };
    }
    
    // Process based on data type
    switch (dataType) {
      case 'Posts':
        // Process posts data
        const posts = rawData.map(row => ({
          id: row['Post ID'] || '',
          username: row['Account username'] || '',
          description: row['Description'] || '',
          reach: parseInt(row['Reach'] || 0),
          likes: parseInt(row['Likes'] || 0),
          comments: parseInt(row['Comments'] || 0),
          shares: parseInt(row['Shares'] || 0),
          saves: parseInt(row['Saves'] || 0),
          follows: parseInt(row['Follows'] || 0),
          date: row['Date'] || '',
          publishTime: row['Publish time'] || '',
          type: row['Post type'] || ''
        }));
        
        newSocialData.instagram.posts = posts;
        break;
        
      case 'Interactions':
        // Process interactions data
        const totalInteractions = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.instagram.pageMetrics.interactions = totalInteractions;
        break;
        
      case 'Follows':
        // Process follower data
        const followerData = rawData.map(row => ({
          date: row['Date'] ? new Date(row['Date']).toISOString().split('T')[0] : '',
          followers: parseInt(row['Primary'] || 0)
        }));
        
        newSocialData.instagram.followerGrowth = followerData;
        
        // Get latest follower count
        if (followerData.length > 0) {
          newSocialData.instagram.pageMetrics.followers = followerData.reduce((max, row) => 
            Math.max(max, row.followers), 0);
        }
        break;
        
      case 'Reach':
        // Process reach data
        const totalReach = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.instagram.pageMetrics.reach = totalReach;
        break;
        
      case 'Views':
        // Process views data
        const totalViews = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
        newSocialData.instagram.pageMetrics.views = totalViews;
        break;
        
      default:
        // Ignore other data types
        break;
    }
    
    // Calculate engagement rate
    if (newSocialData.instagram.pageMetrics.reach > 0 && newSocialData.instagram.pageMetrics.interactions > 0) {
      newSocialData.instagram.pageMetrics.engagement = 
        (newSocialData.instagram.pageMetrics.interactions / newSocialData.instagram.pageMetrics.reach) * 100;
    }
    
    // Update state with new data
    setSocialData(newSocialData);
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

  // Render Facebook Content
  const renderFacebookContent = () => {
    const fbData = socialData.facebook;
    
    if (!fbData) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Facebook Data Available</h3>
          <p className="text-gray-500">Upload Facebook CSV files to view the dashboard.</p>
          <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Required files:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>FB_Posts.csv - Post data with reach, reactions, comments, shares</li>
              <li>FB_Follows.csv - Follower growth data</li>
              <li>FB_Reach.csv - Reach metrics over time</li>
              <li>FB_Views.csv - Views metrics</li>
              <li>FB_Interactions.csv - Engagement interactions</li>
            </ul>
          </div>
        </div>
      );
    }
    
    // Page metrics
    const pageMetrics = [
      { title: 'Total Followers', value: fbData.pageMetrics.followers },
      { title: 'Total Reach', value: fbData.pageMetrics.reach },
      { title: 'Profile Views', value: fbData.pageMetrics.views },
      { title: 'Engagement Rate', value: fbData.pageMetrics.engagement, type: 'percent' }
    ];
    
    // Get top posts if available
    const topPosts = fbData.posts && fbData.posts.length > 0 
      ? [...fbData.posts].sort((a, b) => b.reach - a.reach).slice(0, 5)
      : [];
      
    return (
      <>
        {/* Page Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {pageMetrics.map((metric, index) => (
            <KpiCard 
              key={index}
              title={metric.title}
              value={metric.value}
              type={metric.type || 'number'}
            />
          ))}
        </div>
        
        {/* Follower Growth Chart */}
        {fbData.followerGrowth && fbData.followerGrowth.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Follower Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={fbData.followerGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#4299e1" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Top Posts */}
        {topPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Posts by Reach</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reactions</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topPosts.map((post, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.description || post.title || 'Untitled Post'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.reach)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.reactions)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.comments)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  // Render Instagram Content
  const renderInstagramContent = () => {
    const igData = socialData.instagram;
    
    if (!igData) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Instagram Data Available</h3>
          <p className="text-gray-500">Upload Instagram CSV files to view the dashboard.</p>
          <div className="mt-4 bg-pink-50 p-4 rounded border border-pink-100">
            <h4 className="font-medium text-pink-800 mb-2">Required files:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>IG_Posts.csv - Post data with reach, likes, comments, shares</li>
              <li>IG_Follows.csv - Follower growth data</li>
              <li>IG_Reach.csv - Reach metrics over time</li>
              <li>IG_Views.csv - Views metrics</li>
              <li>IG_Interactions.csv - Engagement interactions</li>
            </ul>
          </div>
        </div>
      );
    }
    
    // Page metrics
    const pageMetrics = [
      { title: 'Total Followers', value: igData.pageMetrics.followers },
      { title: 'Total Reach', value: igData.pageMetrics.reach },
      { title: 'Profile Views', value: igData.pageMetrics.views },
      { title: 'Engagement Rate', value: igData.pageMetrics.engagement, type: 'percent' }
    ];
    
    // Get top posts if available
    const topPosts = igData.posts && igData.posts.length > 0 
      ? [...igData.posts].sort((a, b) => b.reach - a.reach).slice(0, 5)
      : [];
      
    return (
      <>
        {/* Page Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {pageMetrics.map((metric, index) => (
            <KpiCard 
              key={index}
              title={metric.title}
              value={metric.value}
              type={metric.type || 'number'}
            />
          ))}
        </div>
        
        {/* Follower Growth Chart */}
        {igData.followerGrowth && igData.followerGrowth.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Follower Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={igData.followerGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#ed64a6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Top Posts */}
        {topPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Posts by Reach</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saves</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topPosts.map((post, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.description || 'Untitled Post'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.reach)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.likes)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.comments)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.saves)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Post Engagement Distribution */}
        {topPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Content Engagement</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topPosts.slice(0, 5)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="description" tickFormatter={(value) => value.substring(0, 10) + '...'} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="likes" fill="#ed64a6" name="Likes" />
                  <Bar dataKey="comments" fill="#4299e1" name="Comments" />
                  <Bar dataKey="saves" fill="#9f7aea" name="Saves" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Social Media Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your social media CSV files to see your analytics.
        </p>
        
        <div className="flex items-center">
          <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
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
            {isLoading ? 'Processing...' : 'Select FB_*.csv and IG_*.csv files'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Date Range Selector */}
      {(socialData.facebook || socialData.instagram) && <DateRangeSelector />}
      
      {/* Platform Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-4">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              className={`py-4 px-6 ${
                activeTab === 'facebook'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('facebook')}
            >
              Facebook
            </button>
            <button
              className={`py-4 px-6 ${
                activeTab === 'instagram'
                  ? 'border-b-2 border-pink-500 text-pink-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('instagram')}
            >
              Instagram
            </button>
          </nav>
        </div>
      </div>
      
      {/* Active Tab Content */}
      {activeTab === 'facebook' ? renderFacebookContent() : renderInstagramContent()}
    </div>
  );
};

// No export in browser environment - this will be referenced directly
// The bridge file will make it available on the window object