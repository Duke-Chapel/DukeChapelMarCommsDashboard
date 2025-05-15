import React, { useState, useEffect } from 'react';
import { 
  LineChart, BarChart, PieChart, 
  Line, Bar, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const EmailDashboard = () => {
  // State for data and UI
  const [emailData, setEmailData] = useState(null);
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
  const COLORS = ['#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', '#68d391'];

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
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check if the file is a CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    // Check if the file has the correct name
    if (!file.name.includes('Email_Campaign')) {
      setError('Please upload a file named Email_Campaign_Performance.csv');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Parse CSV
        const csv = e.target.result;
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            // Process the data
            const processedData = processEmailData(results.data);
            setEmailData(processedData);
            setIsLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
            setIsLoading(false);
          }
        });
      } catch (error) {
        setError('Error processing file: ' + error.message);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };

  // Process email campaign data
  const processEmailData = (rawData) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return null;
    }
    
    // Extract campaign metrics
    const campaigns = rawData.map(row => {
      return {
        name: row['Campaign'] || 'Unknown',
        openRate: parseFloat(row['Email open rate (MPP excluded)'] || 0) * 100,
        clickRate: parseFloat(row['Email click rate'] || 0) * 100,
        sent: parseInt(row['Emails sent'] || 0),
        opens: parseInt(row['Email opened (MPP excluded)'] || 0),
        clicks: parseInt(row['Email clicked'] || 0),
        unsubscribes: parseInt(row['Email unsubscribes'] || 0),
        bounces: parseInt(row['Email bounces'] || 0),
        date: row['Date'] || 'Unknown'
      };
    }).sort((a, b) => b.openRate - a.openRate);

    // Get top 5 campaigns by open rate
    const topByOpenRate = [...campaigns].sort((a, b) => b.openRate - a.openRate).slice(0, 5);
    
    // Get top 5 campaigns by click rate
    const topByClickRate = [...campaigns].sort((a, b) => b.clickRate - a.clickRate).slice(0, 5);
    
    // Calculate overall metrics
    const totalSent = rawData.reduce((sum, row) => sum + parseInt(row['Emails sent'] || 0), 0);
    const totalOpens = rawData.reduce((sum, row) => sum + parseInt(row['Email opened (MPP excluded)'] || 0), 0);
    const totalClicks = rawData.reduce((sum, row) => sum + parseInt(row['Email clicked'] || 0), 0);
    
    // Calculate engagement percentages
    const notOpened = totalSent > 0 ? ((totalSent - totalOpens) / totalSent) * 100 : 0;
    const openedNotClicked = totalSent > 0 ? ((totalOpens - totalClicks) / totalSent) * 100 : 0;
    const clicked = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
    
    return {
      campaigns,
      topByOpenRate,
      topByClickRate,
      metrics: {
        subscribers: totalSent,
        totalOpens,
        totalClicks,
        notOpened,
        openedNotClicked,
        clicked
      },
      engagementData: [
        { name: 'Not Opened', value: notOpened },
        { name: 'Opened (No Click)', value: openedNotClicked },
        { name: 'Clicked', value: clicked }
      ]
    };
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

  // Render top metrics
  const renderTopMetrics = () => {
    if (!emailData) return null;
    
    const metrics = [
      { title: 'Total Subscribers', value: emailData.metrics.subscribers },
      { title: 'Average Open Rate', value: emailData.topByOpenRate.reduce((sum, c) => sum + c.openRate, 0) / emailData.topByOpenRate.length },
      { title: 'Average Click Rate', value: emailData.topByClickRate.reduce((sum, c) => sum + c.clickRate, 0) / emailData.topByClickRate.length },
      { title: 'Not Opened', value: emailData.metrics.notOpened, type: 'percent' }
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

  // Render engagement chart
  const renderEngagementChart = () => {
    if (!emailData) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Email Engagement</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={emailData.engagementData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {emailData.engagementData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render top campaigns
  const renderTopCampaigns = () => {
    if (!emailData) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Top Campaigns by Open Rate</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={emailData.topByOpenRate}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'openRate' || name === 'clickRate') {
                    return [`${value.toFixed(1)}%`, name === 'openRate' ? 'Open Rate' : 'Click Rate'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="openRate" name="Open Rate" fill="#4299e1" />
              <Bar dataKey="clickRate" name="Click Rate" fill="#9f7aea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render campaigns table
  const renderCampaignsTable = () => {
    if (!emailData) return null;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-4">All Email Campaigns</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Open Rate</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Click Rate</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opens</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emailData.campaigns.map((campaign, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.openRate, 'percent')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.clickRate, 'percent')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.sent)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.opens)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.clicks)}</td>
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
      <h1 className="text-2xl font-bold mb-4">Email Marketing Dashboard</h1>
      
      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Upload Data</h2>
        <p className="text-sm text-gray-600 mb-3">
          Upload your Email_Campaign_Performance.csv file to see your email marketing analytics.
        </p>
        
        <div className="flex items-center">
          <label className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer">
            <span>Choose File</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </label>
          <span className="ml-3 text-sm text-gray-500">
            {isLoading ? 'Processing...' : 'No file chosen'}
          </span>
        </div>
        
        {error && (
          <div className="mt-3 text-red-500 text-sm">
            {error}
          </div>
        )}
      </div>
      
      {/* Date Range Selector */}
      {emailData && <DateRangeSelector />}
      
      {/* Dashboard Content */}
      {emailData ? (
        <>
          {renderTopMetrics()}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {renderEngagementChart()}
            {renderTopCampaigns()}
          </div>
          
          {renderCampaignsTable()}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-gray-500">Upload your Email_Campaign_Performance.csv file to view the dashboard.</p>
          <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">What you'll see once data is loaded:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1 text-left">
              <li>Key email metrics (subscribers, open rates, click rates)</li>
              <li>Top performing campaigns</li>
              <li>Audience engagement breakdown</li>
              <li>Detailed campaign performance statistics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDashboard;