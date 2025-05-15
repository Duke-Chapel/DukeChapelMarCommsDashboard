import React, { useState, useEffect } from 'react';
import { 
  LineChart, BarChart, PieChart, 
  Line, Bar, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Papa from 'papaparse';

const WebDashboard = () => {
  // State for data and UI
  const [webData, setWebData] = useState({
    demographics: null,
    trafficAcquisition: null,
    pagesAndScreens: null,
    utms: null
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
  const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9f7aea', '#68d391', '#f6ad55'];

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
      // Format time values in seconds
      return `${value.toFixed(0)}s`;
    } else if (type === 'decimal') {
      return value.toFixed(2);
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
      
      // Check if it's a Google Analytics file
      if (!file.name.startsWith('GA_')) {
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Determine the file type from its name
          let dataType = file.name.replace('GA_', '').replace('.csv', '');
          
          // Parse CSV
          const csv = e.target.result;
          Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              // Process the data based on type
              processWebData(dataType, results.data);
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

  // Process Web Analytics data based on file type
  const processWebData = (dataType, rawData) => {
    if (!rawData || rawData.length === 0) return;
    
    // Update data based on the type
    switch (dataType) {
      case 'Demographics':
        // Process demographics data
        const demographicsData = processDemographics(rawData);
        setWebData(prevData => ({
          ...prevData,
          demographics: demographicsData
        }));
        break;
        
      case 'Traffic_Acquisition':
        // Process traffic acquisition data
        const trafficData = processTrafficAcquisition(rawData);
        setWebData(prevData => ({
          ...prevData,
          trafficAcquisition: trafficData
        }));
        break;
        
      case 'Pages_And_Screens':
        // Process pages and screens data
        const pagesData = processPagesAndScreens(rawData);
        setWebData(prevData => ({
          ...prevData,
          pagesAndScreens: pagesData
        }));
        break;
        
      case 'UTMs':
        // Process UTM campaign data
        const utmData = processUTMs(rawData);
        setWebData(prevData => ({
          ...prevData,
          utms: utmData
        }));
        break;
        
      default:
        // Ignore unknown file types
        break;
    }
  };

  // Process demographics data
  const processDemographics = (rawData) => {
    // Group data by country
    const countries = {};
    const cities = {};
    const languages = {};
    
    rawData.forEach(row => {
      // Process countries
      const country = row['Country'];
      if (country && country !== '(not set)') {
        if (!countries[country]) {
          countries[country] = {
            name: country,
            users: 0,
            sessions: 0,
            engagement: 0
          };
        }
        countries[country].users += parseInt(row['Total users'] || 0);
        countries[country].sessions += parseInt(row['Sessions'] || 0);
      }
      
      // Process cities
      const city = row['City'];
      if (city && city !== '(not set)') {
        if (!cities[city]) {
          cities[city] = {
            name: city,
            users: 0,
            sessions: 0
          };
        }
        cities[city].users += parseInt(row['Total users'] || 0);
        cities[city].sessions += parseInt(row['Sessions'] || 0);
      }
      
      // Process languages
      const language = row['Language'];
      if (language && language !== '(not set)') {
        if (!languages[language]) {
          languages[language] = {
            name: language,
            users: 0
          };
        }
        languages[language].users += parseInt(row['Total users'] || 0);
      }
    });
    
    // Convert to arrays and sort
    const topCountries = Object.values(countries)
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
      
    const topCities = Object.values(cities)
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
      
    const topLanguages = Object.values(languages)
      .sort((a, b) => b.users - a.users)
      .slice(0, 10);
    
    // Calculate total users and sessions
    const totalUsers = rawData.reduce((sum, row) => sum + parseInt(row['Total users'] || 0), 0);
    const newUsers = rawData.reduce((sum, row) => sum + parseInt(row['New users'] || 0), 0);
    const returningUsers = rawData.reduce((sum, row) => sum + parseInt(row['Returning users'] || 0), 0);
    const totalSessions = rawData.reduce((sum, row) => sum + parseInt(row['Sessions'] || 0), 0);
    
    return {
      topCountries,
      topCities,
      topLanguages,
      metrics: {
        totalUsers,
        newUsers,
        returningUsers,
        totalSessions
      }
    };
  };

  // Process traffic acquisition data
  const processTrafficAcquisition = (rawData) => {
    // Group by channel
    const channels = {};
    
    rawData.forEach(row => {
      const channel = row['Session primary channel group (Default Channel Group)'];
      if (channel && channel !== '(not set)') {
        if (!channels[channel]) {
          channels[channel] = {
            name: channel,
            sessions: 0,
            engagedSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        channels[channel].sessions += parseInt(row['Sessions'] || 0);
        channels[channel].engagedSessions += parseInt(row['Engaged sessions'] || 0);
        channels[channel].engagementRate += parseFloat(row['Engagement rate'] || 0);
        channels[channel].count++;
      }
    });
    
    // Calculate average engagement rate and prepare for chart
    const channelsData = Object.values(channels).map(channel => ({
      name: channel.name,
      sessions: channel.sessions,
      engagementRate: channel.count > 0 ? channel.engagementRate / channel.count : 0
    }));
    
    // Sort by sessions
    const topChannels = [...channelsData].sort((a, b) => b.sessions - a.sessions);
    
    // Total metrics
    const totalSessions = channelsData.reduce((sum, channel) => sum + channel.sessions, 0);
    const totalEngagedSessions = rawData.reduce((sum, row) => sum + parseInt(row['Engaged sessions'] || 0), 0);
    
    return {
      channels: channelsData,
      topChannels,
      metrics: {
        totalSessions,
        totalEngagedSessions,
        overallEngagementRate: totalSessions > 0 ? (totalEngagedSessions / totalSessions) * 100 : 0
      }
    };
  };

  // Process pages and screens data
  const processPagesAndScreens = (rawData) => {
    // Group by page path
    const pages = {};
    
    rawData.forEach(row => {
      const pagePath = row['Page path and screen class'] || 'Unknown';
      const pageTitle = row['Page title and screen class'] || 'Unknown';
      
      const key = pagePath;
      
      if (!pages[key]) {
        pages[key] = {
          path: pagePath,
          title: pageTitle,
          views: 0,
          users: 0,
          events: 0
        };
      }
      
      pages[key].views += parseInt(row['Views'] || 0);
      pages[key].users += parseInt(row['Active users'] || 0);
      pages[key].events += parseInt(row['Event count'] || 0);
    });
    
    // Convert to array and sort by views
    const pagesArray = Object.values(pages);
    const topPages = [...pagesArray].sort((a, b) => b.views - a.views).slice(0, 10);
    
    // Total metrics
    const totalPageViews = pagesArray.reduce((sum, page) => sum + page.views, 0);
    const totalUsers = pagesArray.reduce((sum, page) => sum + page.users, 0);
    
    return {
      pages: pagesArray,
      topPages,
      metrics: {
        totalPageViews,
        totalUsers,
        avgViewsPerUser: totalUsers > 0 ? totalPageViews / totalUsers : 0
      }
    };
  };

  // Process UTM campaign data
  const processUTMs = (rawData) => {
    // Group by campaign name
    const campaigns = {};
    
    rawData.forEach(row => {
      const campaign = row['Manual campaign name'];
      const source = row['Manual source / medium'];
      
      if (campaign && campaign !== '(not set)' && campaign !== 'not set') {
        if (!campaigns[campaign]) {
          campaigns[campaign] = {
            name: campaign,
            source: source,
            sessions: 0,
            engagedSessions: 0,
            keyEvents: 0
          };
        }
        
        campaigns[campaign].sessions += parseInt(row['Sessions'] || 0);
        campaigns[campaign].engagedSessions += parseInt(row['Engaged sessions'] || 0);
        campaigns[campaign].keyEvents += parseFloat(row['Key events'] || 0);
      }
    });
    
    // Convert to array and sort by sessions
    const campaignsArray = Object.values(campaigns);
    const topCampaigns = [...campaignsArray].sort((a, b) => b.sessions - a.sessions).slice(0, 10);
    
    return {
      campaigns: campaignsArray,
      topCampaigns
    };
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
  const hasWebData = webData.demographics || webData.trafficAcquisition || 
                    webData.pagesAndScreens || webData.utms;

  // Render top metrics
  const renderTopMetrics = () => {
    const metrics = [
      { 
        title: 'Total Users',
        value: webData.demographics?.metrics?.totalUsers || 0 
      },
      { 
        title: 'New Users',
        value: webData.demographics?.metrics?.newUsers || 0 
      },
      { 
        title: 'Sessions',
        value: webData.trafficAcquisition?.metrics?.totalSessions || 0 
      },
      { 
        title: 'Engagement Rate',
        value: webData.trafficAcquisition?.metrics?.overallEngagementRate || 0,
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

  // Render traffic sources
  const renderTrafficSources = () => {
    if (!webData.trafficAcquisition) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={webData.trafficAcquisition.topChannels}
                dataKey="sessions"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {webData.trafficAcquisition.topChannels.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  formatNumber(value), 
                  props.payload.name
                ]} 
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render top landing pages
  const renderTopPages = () => {
    if (!webData.pagesAndScreens || !webData.pagesAndScreens.topPages) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Top Landing Pages</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views/User</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {webData.pagesAndScreens.topPages.map((page, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {page.title || page.path}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(page.views)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(page.users)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(page.users > 0 ? page.views / page.users : 0, 'decimal')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render demographics
  const renderDemographics = () => {
    if (!webData.demographics) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={webData.demographics.topCountries}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
                <Bar dataKey="users" name="Users" fill="#4285F4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Languages */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top Languages</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={webData.demographics.topLanguages}
                  dataKey="users"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {webData.demographics.topLanguages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Render campaigns
  const renderCampaigns = () => {
    if (!webData.utms || !webData.utms.topCampaigns) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Engaged Sessions</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {webData.utms.topCampaigns.map((campaign, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {campaign.source || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.sessions)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.engagedSessions)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {formatNumber(campaign.sessions > 0 ? (campaign.engagedSessions / campaign.sessions) * 100 : 0, 'percent')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Web Analytics Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your Google Analytics CSV files to see your web performance.
        </p>
        
        <div className="flex items-center">
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer">
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
            {isLoading ? 'Processing...' : 'Select GA_*.csv files'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Date Range Selector */}
      {hasWebData && <DateRangeSelector />}
      
      {/* Dashboard Content */}
      {hasWebData ? (
        <>
          {/* Top Metrics */}
          {renderTopMetrics()}
          
          {/* Traffic Sources */}
          {renderTrafficSources()}
          
          {/* Demographics */}
          {renderDemographics()}
          
          {/* Top Pages */}
          {renderTopPages()}
          
          {/* Campaigns */}
          {renderCampaigns()}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Web Analytics Data Available</h3>
          <p className="text-gray-500">Upload Google Analytics CSV files to view the dashboard.</p>
          <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">Required files:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>GA_Demographics.csv - User demographics and location data</li>
              <li>GA_Traffic_Acquisition.csv - Traffic source information</li>
              <li>GA_Pages_And_Screens.csv - Page view and engagement metrics</li>
              <li>GA_UTMs.csv - Campaign performance data</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebDashboard;