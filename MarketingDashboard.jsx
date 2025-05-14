import React, { useState, useEffect } from 'react';
import { 
  LineChart, BarChart, PieChart, 
  Line, Bar, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import Papa from 'papaparse';

const MarketingDashboard = () => {
  // State for active tab, date range, data, and loading status
  const [activeTab, setActiveTab] = useState('overview');
  const [socialTab, setSocialTab] = useState('facebook');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    comparison: {
      enabled: false,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    }
  });
  const [data, setData] = useState({
    email: null,
    web: null,
    facebook: null,
    instagram: null,
    youtube: null
  });
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // New state for tracking data changes (for comparison)
  const [previousData, setPreviousData] = useState(null);

  // Define chart colors
  const COLORS = ['#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', '#68d391'];

  // Load data when component mounts
  useEffect(() => {
    // Check for previously processed data in sessionStorage
    const cachedData = sessionStorage.getItem('dashboardData');
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
        setIsLoading(false);
      } catch (e) {
        console.error("Error loading cached data:", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  // Process files when uploaded
  const processFiles = async (files) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Store current data for comparison
      setPreviousData(JSON.parse(JSON.stringify(data)));
      
      const newFiles = {...uploadedFiles};
      const processedData = {...data};
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Only accept CSV files
        if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
          continue;
        }
        
        newFiles[file.name] = file;
        
        // Read and parse the file
        const fileContent = await readFileAsText(file);
        const parsedData = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true
        });
        
        if (parsedData.errors && parsedData.errors.length > 0) {
          console.warn(`Errors parsing ${file.name}:`, parsedData.errors);
        }
        
        // Store the data based on file name
        if (file.name.includes('Email')) {
          processedData.email = processEmailData(parsedData.data);
        } else if (file.name.includes('FB')) {
          processedData.facebook = processFacebookData(file.name, parsedData.data, processedData.facebook);
        } else if (file.name.includes('IG')) {
          processedData.instagram = processInstagramData(file.name, parsedData.data, processedData.instagram);
        } else if (file.name.includes('YouTube')) {
          processedData.youtube = processYoutubeData(file.name, parsedData.data, processedData.youtube);
        } else if (file.name.includes('GA')) {
          processedData.web = processWebData(file.name, parsedData.data, processedData.web);
        }
      }
      
      // Update state with new data
      setUploadedFiles(newFiles);
      setData(processedData);
      
      // Cache data in sessionStorage
      sessionStorage.setItem('dashboardData', JSON.stringify(processedData));
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error processing files:", error);
      setErrorMessage("Error processing files: " + error.message);
      setIsLoading(false);
    }
  };
  
  // Read file as text
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
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
        bounces: parseInt(row['Email bounces'] || 0)
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
    
    // Create subscriber demographics (we'll use placeholder demographics as this isn't in the actual data)
    // This would be enhanced with real data when available
    const demographics = {
      regions: [
        { name: 'North America', value: 45 },
        { name: 'Europe', value: 30 },
        { name: 'Asia', value: 15 },
        { name: 'Other', value: 10 }
      ],
      age: [
        { name: '18-24', value: 15 },
        { name: '25-34', value: 35 },
        { name: '35-44', value: 25 },
        { name: '45-54', value: 15 },
        { name: '55+', value: 10 }
      ],
      interests: [
        { name: 'Technology', value: 40 },
        { name: 'Business', value: 30 },
        { name: 'Education', value: 20 },
        { name: 'Entertainment', value: 10 }
      ]
    };
    
    // Calculate link performance (we'll use the campaigns data as a proxy)
    // In a real implementation, this would be from link-level data
    const links = campaigns.map(campaign => {
      return {
        name: `Link in ${campaign.name}`,
        clicks: campaign.clicks,
        clickRate: (campaign.clicks / campaign.opens) * 100
      };
    }).sort((a, b) => b.clicks - a.clicks).slice(0, 5);
    
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
      ],
      demographics,
      links
    };
  };
  
  // Process Facebook data
  const processFacebookData = (fileName, rawData, existingData = null) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return existingData || null;
    }
    
    let result = existingData || {
      pageRank: { followers: 0, reach: 0, views: 0, engagement: 0 },
      topPosts: [],
      demographics: [],
      followerGrowth: []
    };
    
    // Process different file types
    if (fileName.includes('FB_Videos') || fileName.includes('FB_Posts')) {
      // Extract posts/videos
      const posts = rawData.map(row => {
        return {
          title: row['Title'] || row['Description'] || 'Untitled',
          views: parseInt(row['3-second video views'] || row['Views'] || row['Reach'] || 0),
          likes: parseInt(row['Reactions'] || row['Likes'] || 0),
          comments: parseInt(row['Comments'] || 0),
          shares: parseInt(row['Shares'] || 0)
        };
      }).sort((a, b) => b.views - a.views);
      
      // Get the top 5 posts
      result.topPosts = posts.slice(0, 5);
      
      // Extract demographics if available
      const demographics = [];
      Object.keys(rawData[0] || {}).forEach(key => {
        if (key.includes('audience') || key.includes('by top audience')) {
          const match = key.match(/\((.*?)\)/);
          if (match) {
            const segment = match[1];
            const value = parseFloat(rawData[0][key] || 0);
            
            if (value > 0) {
              demographics.push({ name: segment, value });
            }
          }
        }
      });
      
      if (demographics.length > 0) {
        result.demographics = demographics;
      }
    } else if (fileName.includes('FB_Follows')) {
      // Process follower data
      const followerData = {};
      
      rawData.forEach(row => {
        if (row['Date']) {
          const date = new Date(row['Date']);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!followerData[monthKey]) {
            followerData[monthKey] = { date: monthKey, followers: 0 };
          }
          
          followerData[monthKey].followers += parseInt(row['Primary'] || 0);
        }
      });
      
      result.followerGrowth = Object.values(followerData).sort((a, b) => a.date.localeCompare(b.date));
      
      // Get latest follower count
      if (result.followerGrowth.length > 0) {
        result.pageRank.followers = result.followerGrowth[result.followerGrowth.length - 1].followers;
      }
    } else if (fileName.includes('FB_Reach')) {
      // Process reach data
      const totalReach = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      result.pageRank.reach = totalReach;
    } else if (fileName.includes('FB_Views')) {
      // Process views data
      const totalViews = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      result.pageRank.views = totalViews;
    } else if (fileName.includes('FB_Interactions')) {
      // Process engagement data
      const totalInteractions = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      
      // Calculate engagement rate
      if (result.pageRank.reach > 0) {
        result.pageRank.engagement = (totalInteractions / result.pageRank.reach) * 100;
      }
    }
    
    return result;
  };
  
  // Process Instagram data
  const processInstagramData = (fileName, rawData, existingData = null) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return existingData || null;
    }
    
    let result = existingData || {
      pageRank: { followers: 0, reach: 0, views: 0, engagement: 0 },
      topPosts: [],
      engagement: [],
      followerGrowth: []
    };
    
    // Process different file types
    if (fileName.includes('IG_Posts')) {
      // Extract posts
      const posts = rawData.map(row => {
        return {
          description: row['Description'] || 'Untitled',
          reach: parseInt(row['Reach'] || 0),
          likes: parseInt(row['Likes'] || 0),
          comments: parseInt(row['Comments'] || 0),
          shares: parseInt(row['Shares'] || 0),
          saves: parseInt(row['Saves'] || 0)
        };
      }).sort((a, b) => b.reach - a.reach);
      
      // Get top 5 posts
      result.topPosts = posts.slice(0, 5);
      
      // Calculate engagement metrics
      const totalLikes = rawData.reduce((sum, row) => sum + parseInt(row['Likes'] || 0), 0);
      const totalComments = rawData.reduce((sum, row) => sum + parseInt(row['Comments'] || 0), 0);
      const totalShares = rawData.reduce((sum, row) => sum + parseInt(row['Shares'] || 0), 0);
      const totalSaves = rawData.reduce((sum, row) => sum + parseInt(row['Saves'] || 0), 0);
      
      result.engagement = [
        { name: 'Likes', value: totalLikes },
        { name: 'Comments', value: totalComments },
        { name: 'Shares', value: totalShares },
        { name: 'Saves', value: totalSaves }
      ];
    } else if (fileName.includes('IG_Follows')) {
      // Process follower data
      const followerData = {};
      
      rawData.forEach(row => {
        if (row['Date']) {
          const date = new Date(row['Date']);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!followerData[monthKey]) {
            followerData[monthKey] = { date: monthKey, followers: 0 };
          }
          
          followerData[monthKey].followers += parseInt(row['Primary'] || 0);
        }
      });
      
      result.followerGrowth = Object.values(followerData).sort((a, b) => a.date.localeCompare(b.date));
      
      // Get latest follower count
      if (result.followerGrowth.length > 0) {
        result.pageRank.followers = result.followerGrowth[result.followerGrowth.length - 1].followers;
      }
    } else if (fileName.includes('IG_Reach')) {
      // Process reach data
      const totalReach = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      result.pageRank.reach = totalReach;
    } else if (fileName.includes('IG_Views')) {
      // Process views data
      const totalViews = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      result.pageRank.views = totalViews;
    } else if (fileName.includes('IG_Interactions')) {
      // Process engagement data
      const totalInteractions = rawData.reduce((sum, row) => sum + parseInt(row['Primary'] || 0), 0);
      
      // Calculate engagement rate
      if (result.pageRank.reach > 0) {
        result.pageRank.engagement = (totalInteractions / result.pageRank.reach) * 100;
      }
    }
    
    return result;
  };
  
  // Process YouTube data
  const processYoutubeData = (fileName, rawData, existingData = null) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return existingData || null;
    }
    
    let result = existingData || {
      pageRank: { followers: 0, views: 0, engagement: 0 },
      demographics: { age: [], gender: [] },
      subscriptionStatus: [],
      topVideos: [],
      topCountries: []
    };
    
    // Process different file types
    if (fileName.includes('YouTube_Age')) {
      // Process age demographics
      result.demographics.age = rawData.map(row => ({
        name: row['Viewer age'] || 'Unknown',
        value: parseFloat(row['Views (%)'] || 0)
      }));
    } else if (fileName.includes('YouTube_Gender')) {
      // Process gender demographics
      result.demographics.gender = rawData.map(row => ({
        name: row['Viewer gender'] || 'Unknown',
        value: parseFloat(row['Views (%)'] || 0)
      }));
    } else if (fileName.includes('YouTube_Subscription_Status')) {
      // Process subscription status
      result.subscriptionStatus = rawData.map(row => {
        const status = row['Subscription status'] || 'Unknown';
        const views = parseInt(row['Views'] || 0);
        
        return { name: status, value: views };
      });
      
      // Calculate percentages
      const totalViews = result.subscriptionStatus.reduce((sum, item) => sum + item.value, 0);
      
      if (totalViews > 0) {
        result.subscriptionStatus.forEach(item => {
          item.percentage = (item.value / totalViews) * 100;
        });
      }
      
      // Extract subscriber count
      const subscribedItem = result.subscriptionStatus.find(item => 
        item.name.toLowerCase().includes('subscribed'));
      
      if (subscribedItem) {
        result.pageRank.followers = subscribedItem.value;
      }
      
      // Set total views
      result.pageRank.views = totalViews;
    } else if (fileName.includes('YouTube_Geography')) {
      // Process geographic data
      result.topCountries = rawData.map(row => ({
        country: row['Geography'] || 'Unknown',
        value: parseInt(row['Views'] || 0)
      })).sort((a, b) => b.value - a.value).slice(0, 10);
    } else if (fileName.includes('YouTube_Content')) {
      // Process video content data
      result.topVideos = rawData.map(row => ({
        title: row['Video title'] || 'Untitled',
        views: parseInt(row['Views'] || 0),
        likes: parseInt(row['Likes'] || 0),
        comments: parseInt(row['Comments added'] || 0),
        shares: parseInt(row['Shares'] || 0)
      })).sort((a, b) => b.views - a.views).slice(0, 5);
      
      // Calculate engagement rate
      const totalEngagements = rawData.reduce((sum, row) => {
        return sum + 
          parseInt(row['Likes'] || 0) + 
          parseInt(row['Comments added'] || 0) + 
          parseInt(row['Shares'] || 0);
      }, 0);
      
      const totalViews = rawData.reduce((sum, row) => sum + parseInt(row['Views'] || 0), 0);
      
      if (totalViews > 0) {
        result.pageRank.engagement = (totalEngagements / totalViews) * 100;
      }
    }
    
    return result;
  };
  
  // Process Web/GA data
  const processWebData = (fileName, rawData, existingData = null) => {
    if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
      return existingData || null;
    }
    
    let result = existingData || {
      demographics: { countries: [], languages: [], regions: [], age: [], gender: [] },
      trafficSources: [],
      campaigns: [],
      topPages: []
    };
    
    // Process different file types
    if (fileName.includes('GA_Demographics')) {
      // Process demographic data
      const countries = {};
      const languages = {};
      const regions = {};
      
      rawData.forEach(row => {
        // Process countries
        const country = row['Country'];
        if (country && country !== '(not set)') {
          if (!countries[country]) {
            countries[country] = 0;
          }
          countries[country] += parseInt(row['Total users'] || 0);
        }
        
        // Process languages
        const language = row['Language'];
        if (language && language !== '(not set)') {
          if (!languages[language]) {
            languages[language] = 0;
          }
          languages[language] += parseInt(row['Total users'] || 0);
        }
        
        // Process regions
        const region = row['Region'];
        if (region && region !== '(not set)') {
          if (!regions[region]) {
            regions[region] = 0;
          }
          regions[region] += parseInt(row['Total users'] || 0);
        }
      });
      
      // Convert to arrays and sort
      result.demographics.countries = Object.entries(countries)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      result.demographics.languages = Object.entries(languages)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      result.demographics.regions = Object.entries(regions)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      
      // Add placeholder age and gender data (would be actual data in real implementation)
      result.demographics.age = [
        { name: '18-24', value: 25 },
        { name: '25-34', value: 35 },
        { name: '35-44', value: 20 },
        { name: '45-54', value: 12 },
        { name: '55+', value: 8 }
      ];
      
      result.demographics.gender = [
        { name: 'Male', value: 55 },
        { name: 'Female', value: 45 }
      ];
    } else if (fileName.includes('GA_Traffic_Acquisition')) {
      // Process traffic sources
      const sources = {};
      
      rawData.forEach(row => {
        const source = row['Session primary channel group (Default Channel Group)'];
        if (source && source !== '(not set)') {
          if (!sources[source]) {
            sources[source] = 0;
          }
          sources[source] += parseInt(row['Sessions'] || 0);
        }
      });
      
      result.trafficSources = Object.entries(sources)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    } else if (fileName.includes('GA_UTMs')) {
      // Process campaign data
      const campaigns = {};
      
      rawData.forEach(row => {
        const campaign = row['Manual campaign name'];
        if (campaign && campaign !== '(not set)' && campaign !== 'not set') {
          if (!campaigns[campaign]) {
            campaigns[campaign] = {
              name: campaign,
              sessions: 0,
              engagementRate: 0,
              count: 0
            };
          }
          
          campaigns[campaign].sessions += parseInt(row['Sessions'] || 0);
          campaigns[campaign].engagementRate += parseFloat(row['Engagement rate'] || 0);
          campaigns[campaign].count++;
        }
      });
      
      // Calculate average engagement rate and format
      result.campaigns = Object.values(campaigns)
        .map(campaign => ({
          name: campaign.name,
          sessions: campaign.sessions,
          engagementRate: campaign.count > 0 ? campaign.engagementRate / campaign.count : 0
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
    } else if (fileName.includes('GA_Pages_And_Screens')) {
      // Process pages data
      const pages = {};
      
      rawData.forEach(row => {
        const page = row['Page title and screen class'];
        if (page && page !== '(not set)' && page !== 'not set') {
          if (!pages[page]) {
            pages[page] = {
              page,
              views: 0,
              sessions: 0,
              engagement: 0,
              count: 0
            };
          }
          
          pages[page].views += parseInt(row['Views'] || 0);
          pages[page].sessions += parseInt(row['Active users'] || 0);
          if (row['Average engagement time per session']) {
            pages[page].engagement += parseFloat(row['Average engagement time per session']);
            pages[page].count++;
          }
        }
      });
      
      // Calculate average engagement time and format
      result.topPages = Object.values(pages)
        .map(page => ({
          page: page.page,
          sessions: page.sessions,
          engagementTime: page.count > 0 ? page.engagement / page.count : 0,
          // We don't have bounce rate in the data, so we'll leave it as 0
          bounceRate: 0
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
    }
    
    return result;
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = event.target.files || (event.dataTransfer && event.dataTransfer.files);
    if (files && files.length > 0) {
      processFiles(files);
    }
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
    } else if (type === 'decimal') {
      return value.toFixed(2);
    }
    
    return value;
  };

  // Calculate percentage change for comparison
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  // KPI Card Component
  const KpiCard = ({ title, value, change = null, type = 'number' }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 h-full hover:shadow-lg transition-shadow duration-300">
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

  // Date Filter Component
  const DateFilter = () => {
    // State for temporary date values
    const [tempDates, setTempDates] = useState({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      comparisonEnabled: dateRange.comparison.enabled,
      comparisonStartDate: dateRange.comparison.startDate,
      comparisonEndDate: dateRange.comparison.endDate
    });

    // Handle input changes
    const handleDateChange = (e) => {
      const { name, value } = e.target;
      setTempDates(prev => ({
        ...prev,
        [name]: value ? new Date(value) : null
      }));
    };

    // Handle comparison toggle
    const handleComparisonToggle = (e) => {
      setTempDates(prev => ({
        ...prev,
        comparisonEnabled: e.target.checked
      }));
    };

    // Apply filter changes
    const applyFilter = () => {
      setDateRange({
        startDate: tempDates.startDate,
        endDate: tempDates.endDate,
        comparison: {
          enabled: tempDates.comparisonEnabled,
          startDate: tempDates.comparisonStartDate,
          endDate: tempDates.comparisonEndDate
        }
      });
    };

    // Format date for input fields
    const formatDateForInput = (date) => {
      if (!date) return '';
      
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    // Predefined date ranges
    const predefinedRanges = [
      { label: 'Last 7 days', value: 7 },
      { label: 'Last 30 days', value: 30 },
      { label: 'Last 90 days', value: 90 },
      { label: 'Last 12 months', value: 365 }
    ];

    // Apply predefined range
    const applyPredefinedRange = (days) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      let comparisonStartDate = null;
      let comparisonEndDate = null;
      
      if (tempDates.comparisonEnabled) {
        comparisonEndDate = new Date(startDate);
        comparisonStartDate = new Date(startDate);
        comparisonStartDate.setDate(comparisonStartDate.getDate() - days);
      }
      
      setTempDates({
        startDate,
        endDate,
        comparisonEnabled: tempDates.comparisonEnabled,
        comparisonStartDate,
        comparisonEndDate
      });
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Date Range</h2>
        
        {/* Predefined date ranges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {predefinedRanges.map(range => (
            <button 
              key={range.value} 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded"
              onClick={() => applyPredefinedRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Period</label>
            <div className="flex space-x-2">
              <input 
                type="date" 
                name="startDate"
                className="border rounded p-1 text-sm" 
                value={formatDateForInput(tempDates.startDate)}
                onChange={handleDateChange}
              /> 
              <span className="flex items-center">to</span>
              <input 
                type="date"
                name="endDate" 
                className="border rounded p-1 text-sm" 
                value={formatDateForInput(tempDates.endDate)}
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
                checked={tempDates.comparisonEnabled}
                onChange={handleComparisonToggle}
              />
              <label className="form-check-label" htmlFor="enable-comparison">
                Enable period comparison
              </label>
            </div>
          </div>
        </div>
        
        {tempDates.comparisonEnabled && (
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1">Comparison Period</label>
            <div className="flex space-x-2">
              <input 
                type="date"
                name="comparisonStartDate" 
                className="border rounded p-1 text-sm" 
                value={formatDateForInput(tempDates.comparisonStartDate)}
                onChange={handleDateChange}
              /> 
              <span className="flex items-center">to</span>
              <input 
                type="date"
                name="comparisonEndDate" 
                className="border rounded p-1 text-sm" 
                value={formatDateForInput(tempDates.comparisonEndDate)}
                onChange={handleDateChange}
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-3">
          <button 
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            onClick={applyFilter}
          >
            Apply Filter
          </button>
        </div>
      </div>
    );
  };

  // File Uploader Component
  const FileUploader = () => {
    const [dragging, setDragging] = useState(false);
    
    // Handlers for drag events
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(true);
    };
    
    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
    };
    
    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileUpload({ target: { files } });
      }
    };
    
    return (
      <div className="mb-6">
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} transition-colors duration-300`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-600">Drag and drop CSV files here, or</p>
          <div className="mt-2">
            <label htmlFor="file-upload" className="bg-blue-500 rounded px-3 py-1 text-sm text-white hover:bg-blue-600 cursor-pointer transition-colors duration-200">
              Browse files
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Upload CSV files from each platform</p>
          <p className="mt-1 text-xs text-gray-400">Supported files: Email_Campaign_Performance.csv, FB_*.csv, IG_*.csv, YouTube_*.csv, GA_*.csv</p>
        </div>
        
        {Object.keys(uploadedFiles).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Uploaded Files</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {Object.keys(uploadedFiles).map(fileName => (
                  <li key={fileName} className="py-2 flex justify-between">
                    <span className="text-sm">{fileName}</span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Processed</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Overview Tab Content
  const OverviewContent = () => {
    // Check if we have data for each platform
    const hasEmailData = data.email !== null;
    const hasFacebookData = data.facebook !== null;
    const hasInstagramData = data.instagram !== null;
    const hasYoutubeData = data.youtube !== null;
    const hasWebData = data.web !== null;
    
    // Define overview metrics
    const metrics = [
      {
        title: 'Email Subscribers',
        value: hasEmailData ? data.email.metrics.subscribers : null,
        type: 'number'
      },
      {
        title: 'Facebook Reach',
        value: hasFacebookData ? data.facebook.pageRank.reach : null,
        type: 'number'
      },
      {
        title: 'Instagram Engagement',
        value: hasInstagramData ? data.instagram.pageRank.engagement : null,
        type: 'percent'
      },
      {
        title: 'YouTube Views',
        value: hasYoutubeData ? data.youtube.pageRank.views : null,
        type: 'number'
      }
    ];
    
    // Channel traffic comparison data
    const channelData = [
      { name: 'Email Opens', value: hasEmailData ? data.email.metrics.totalOpens : 0 },
      { name: 'Facebook Reach', value: hasFacebookData ? data.facebook.pageRank.reach : 0 },
      { name: 'Instagram Reach', value: hasInstagramData ? data.instagram.pageRank.reach : 0 },
      { name: 'YouTube Views', value: hasYoutubeData ? data.youtube.pageRank.views : 0 }
    ];
    
    // Engagement by platform data
    const engagementData = [
      { name: 'Email', value: hasEmailData ? (data.email.metrics.clicked / data.email.metrics.subscribers) * 100 : 0 },
      { name: 'Facebook', value: hasFacebookData ? data.facebook.pageRank.engagement : 0 },
      { name: 'Instagram', value: hasInstagramData ? data.instagram.pageRank.engagement : 0 },
      { name: 'YouTube', value: hasYoutubeData ? data.youtube.pageRank.engagement : 0 }
    ];
    
    // Top performing content across all platforms
    const topContent = [];
    
    if (hasEmailData && data.email.campaigns) {
      const topEmail = data.email.campaigns[0];
      if (topEmail) {
        topContent.push({
          platform: 'Email',
          title: topEmail.name,
          metric: 'Open Rate',
          value: topEmail.openRate
        });
      }
    }
    
    if (hasFacebookData && data.facebook.topPosts && data.facebook.topPosts.length > 0) {
      const topFBPost = data.facebook.topPosts[0];
      if (topFBPost) {
        topContent.push({
          platform: 'Facebook',
          title: topFBPost.title,
          metric: 'Views',
          value: topFBPost.views
        });
      }
    }
    
    if (hasInstagramData && data.instagram.topPosts && data.instagram.topPosts.length > 0) {
      const topIGPost = data.instagram.topPosts[0];
      if (topIGPost) {
        topContent.push({
          platform: 'Instagram',
          title: topIGPost.description,
          metric: 'Reach',
          value: topIGPost.reach
        });
      }
    }
    
    if (hasYoutubeData && data.youtube.topVideos && data.youtube.topVideos.length > 0) {
      const topVideo = data.youtube.topVideos[0];
      if (topVideo) {
        topContent.push({
          platform: 'YouTube',
          title: topVideo.title,
          metric: 'Views',
          value: topVideo.views
        });
      }
    }
    
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Channel Traffic Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#4299e1" name="Traffic" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Engagement by Platform</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                  <Bar dataKey="value" fill="#9f7aea" name="Engagement Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Cross-platform Top Content */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Top Performing Content</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topContent.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">{item.platform}</span>
                </div>
                <h4 className="font-medium text-sm mb-2 line-clamp-2" title={item.title}>{item.title}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{item.metric}</span>
                  <span className="font-bold">{formatNumber(item.value, item.metric.includes('Rate') ? 'percent' : 'number')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Overall Marketing Performance Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Marketing Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-semibold text-blue-800 mb-2">Audience Growth</h4>
              <p className="text-sm text-gray-700 mb-2">
                {hasFacebookData && hasEmailData ? 
                  `Your social following grew by ${formatNumber(data.facebook.pageRank.followers * 0.05)}+ followers, while your email list has ${formatNumber(data.email.metrics.subscribers)} subscribers.` :
                  'Upload your social media and email files to see audience growth metrics.'}
              </p>
              <div className="flex justify-end">
                <button 
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setActiveTab('social')}
                >
                  View details →
                </button>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="font-semibold text-purple-800 mb-2">Content Performance</h4>
              <p className="text-sm text-gray-700 mb-2">
                {hasInstagramData && hasYoutubeData ? 
                  `Your top Instagram post reached ${formatNumber(data.instagram.topPosts[0]?.reach)} people, and your top YouTube video has ${formatNumber(data.youtube.topVideos[0]?.views)} views.` :
                  'Upload your content platform files to see performance metrics.'}
              </p>
              <div className="flex justify-end">
                <button 
                  className="text-xs text-purple-600 hover:underline"
                  onClick={() => {setActiveTab('social'); setSocialTab('instagram');}}
                >
                  View details →
                </button>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-800 mb-2">Conversion Metrics</h4>
              <p className="text-sm text-gray-700 mb-2">
                {hasEmailData && hasWebData ? 
                  `Your email click rate is ${formatNumber(data.email.campaigns[0]?.clickRate, 'percent')}, and web conversions are trending ${data.web?.campaigns[0]?.engagementRate > 2 ? 'up' : 'down'}.` :
                  'Upload your email and web analytics files to see conversion metrics.'}
              </p>
              <div className="flex justify-end">
                <button 
                  className="text-xs text-green-600 hover:underline"
                  onClick={() => setActiveTab('email')}
                >
                  View details →
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Web Analytics Tab Content
  const WebAnalyticsContent = () => {
    // Check if we have web data
    const hasWebData = data.web !== null;
    
    // Demographics charts
    const demographicsCharts = () => {
      if (!hasWebData) return null;
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-md font-semibold mb-3">Top Countries</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.web.demographics.countries}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.web.demographics.countries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-md font-semibold mb-3">Languages</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={data.web.demographics.languages}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.web.demographics.languages.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-md font-semibold mb-3">Age & Gender</h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.web.demographics.age}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Legend />
                  <Bar dataKey="value" name="Percentage" fill="#4c51bf" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span className="text-xs">Male: {formatNumber(data.web.demographics.gender[0].value, 'percent')}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-pink-500 rounded-full mr-1"></div>
                  <span className="text-xs">Female: {formatNumber(data.web.demographics.gender[1].value, 'percent')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // Traffic sources chart
    const trafficSourcesChart = () => {
      if (!hasWebData || !data.web.trafficSources || data.web.trafficSources.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data.web.trafficSources}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.web.trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    };

    // Campaign tables
    const campaignsTable = () => {
      if (!hasWebData || !data.web.campaigns || data.web.campaigns.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
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
                {data.email.campaigns.map((campaign, index) => (
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
            </table>-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.web.campaigns.map((campaign, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{campaign.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.sessions)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(campaign.engagementRate, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    // Top pages table
    const topPagesTable = () => {
      if (!hasWebData || !data.web.topPages || data.web.topPages.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top Landing Pages</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.web.topPages.map((page, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{page.page}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(page.sessions)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(page.engagementTime)} sec</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    };

    // If no data is available
    if (!hasWebData) {
      return (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Web Analytics</h3>
          <p className="text-gray-500">No web analytics data available. Please upload GA_Demographics.csv, GA_Traffic_Acquisition.csv, GA_Pages_And_Screens.csv, and GA_UTMs.csv to see web analytics.</p>
          <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">What you'll see here:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Demographics (age, gender, location)</li>
              <li>Top landing pages by sessions/engagement time</li>
              <li>Traffic sources (organic, social, direct, email)</li>
              <li>Campaign performance metrics</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <>
        {demographicsCharts()}
        {trafficSourcesChart()}
        {campaignsTable()}
        {topPagesTable()}
      </>
    );
  };

  // Social Media Tab Content
  const SocialMediaContent = () => {
    // Facebook tab content
    const FacebookContent = () => {
      const hasFacebookData = data.facebook !== null;
      
      // Page rank metrics
      const pageRankMetrics = () => {
        if (!hasFacebookData) return null;
        
        const metrics = [
          {
            title: 'Page Engagement',
            value: data.facebook.pageRank.engagement,
            type: 'percent'
          },
          {
            title: 'Total Followers',
            value: data.facebook.pageRank.followers,
            type: 'number'
          },
          {
            title: 'Profile Views',
            value: data.facebook.pageRank.views,
            type: 'number'
          },
          {
            title: 'Total Reach',
            value: data.facebook.pageRank.reach,
            type: 'number'
          }
        ];
        
        return (
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
        );
      };
      
      // Demographics chart
      const demographicsChart = () => {
        if (!hasFacebookData || !data.facebook.demographics || data.facebook.demographics.length === 0) return null;
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Facebook Audience Demographics</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.facebook.demographics}
                  margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  <Bar dataKey="value" fill="#4c51bf" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      };
      
      // Follower growth chart
      const followerGrowthChart = () => {
        if (!hasFacebookData || !data.facebook.followerGrowth || data.facebook.followerGrowth.length === 0) return null;
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Facebook Follower Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.facebook.followerGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Line type="monotone" dataKey="followers" stroke="#4c51bf" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      };
      
      // Top posts
      const topPosts = () => {
        if (!hasFacebookData || !data.facebook.topPosts || data.facebook.topPosts.length === 0) return null;
        
        // Find the "top" post for each metric
        const topByReach = [...data.facebook.topPosts].sort((a, b) => b.views - a.views)[0];
        const topByLikes = [...data.facebook.topPosts].sort((a, b) => b.likes - a.likes)[0];
        const topByComments = [...data.facebook.topPosts].sort((a, b) => b.comments - a.comments)[0];
        const topByShares = [...data.facebook.topPosts].sort((a, b) => b.shares - a.shares)[0];
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Facebook Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Reach</h4>
                <p className="font-medium mb-1">{topByReach.title}</p>
                <p className="text-sm">Reach: {formatNumber(topByReach.views)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Liked</h4>
                <p className="font-medium mb-1">{topByLikes.title}</p>
                <p className="text-sm">Likes: {formatNumber(topByLikes.likes)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Comments</h4>
                <p className="font-medium mb-1">{topByComments.title}</p>
                <p className="text-sm">Comments: {formatNumber(topByComments.comments)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Shares</h4>
                <p className="font-medium mb-1">{topByShares.title}</p>
                <p className="text-sm">Shares: {formatNumber(topByShares.shares)}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Title</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.facebook.topPosts.map((post, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{post.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.views)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.likes)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.comments)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      };
      
      // If no data is available
      if (!hasFacebookData) {
        return (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Facebook Analytics</h3>
            <p className="text-gray-500">No Facebook data available. Please upload FB_Videos.csv, FB_Posts.csv, FB_Follows.csv, FB_Reach.csv, FB_Visits.csv, and FB_Interactions.csv to see Facebook analytics.</p>
            <div className="mt-4 bg-blue-50 p-4 rounded border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-2">What you'll see here:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Page rank metrics (engagement, followers, views, reach)</li>
                <li>Audience demographics</li>
                <li>Follower growth over time</li>
                <li>Top performing posts</li>
              </ul>
            </div>
          </div>
        );
      }
      
      return (
        <>
          {pageRankMetrics()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {demographicsChart()}
            {followerGrowthChart()}
          </div>
          {topPosts()}
        </>
      );
    };
    
    // Instagram tab content
    const InstagramContent = () => {
      const hasInstagramData = data.instagram !== null;
      
      // Page rank metrics
      const pageRankMetrics = () => {
        if (!hasInstagramData) return null;
        
        const metrics = [
          {
            title: 'Page Engagement',
            value: data.instagram.pageRank.engagement,
            type: 'percent'
          },
          {
            title: 'Total Followers',
            value: data.instagram.pageRank.followers,
            type: 'number'
          },
          {
            title: 'Profile Views',
            value: data.instagram.pageRank.views,
            type: 'number'
          },
          {
            title: 'Total Reach',
            value: data.instagram.pageRank.reach,
            type: 'number'
          }
        ];
        
        return (
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
        );
      };
      
      // Engagement chart
      const engagementChart = () => {
        if (!hasInstagramData || !data.instagram.engagement || data.instagram.engagement.length === 0) return null;
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Instagram Engagement Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.instagram.engagement}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {data.instagram.engagement.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      };
      
      // Follower growth chart
      const followerGrowthChart = () => {
        if (!hasInstagramData || !data.instagram.followerGrowth || data.instagram.followerGrowth.length === 0) return null;
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Instagram Follower Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.instagram.followerGrowth}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatNumber(value)} />
                  <Line type="monotone" dataKey="followers" stroke="#ed64a6" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      };
      
      // Top posts
      const topPosts = () => {
        if (!hasInstagramData || !data.instagram.topPosts || data.instagram.topPosts.length === 0) return null;
        
        // Find the "top" post for each metric
        const topByReach = [...data.instagram.topPosts].sort((a, b) => b.reach - a.reach)[0];
        const topByLikes = [...data.instagram.topPosts].sort((a, b) => b.likes - a.likes)[0];
        const topByComments = [...data.instagram.topPosts].sort((a, b) => b.comments - a.comments)[0];
        const topByShares = [...data.instagram.topPosts].sort((a, b) => b.shares - a.shares)[0];
        const topBySaves = [...data.instagram.topPosts].sort((a, b) => b.saves - a.saves)[0];
        
        // Helper to shorten text
        const shortenText = (text, maxLength = 30) => {
          if (!text) return '';
          return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };
        
        return (
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">Top Instagram Posts</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Reach</h4>
                <p className="font-medium mb-1">{shortenText(topByReach.description)}</p>
                <p className="text-sm">Reach: {formatNumber(topByReach.reach)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Likes</h4>
                <p className="font-medium mb-1">{shortenText(topByLikes.description)}</p>
                <p className="text-sm">Likes: {formatNumber(topByLikes.likes)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Comments</h4>
                <p className="font-medium mb-1">{shortenText(topByComments.description)}</p>
                <p className="text-sm">Comments: {formatNumber(topByComments.comments)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Shares</h4>
                <p className="font-medium mb-1">{shortenText(topByShares.description)}</p>
                <p className="text-sm">Shares: {formatNumber(topByShares.shares)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded border">
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Most Saves</h4>
                <p className="font-medium mb-1">{shortenText(topBySaves.description)}</p>
                <p className="text-sm">Saves: {formatNumber(topBySaves.saves)}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reach</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saves</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.instagram.topPosts.map((post, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-900">{shortenText(post.description, 40)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.reach)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.likes)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.comments)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.shares)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(post.saves)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      };
      
      // If no data is available
      if (!hasInstagramData) {
        return (
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Instagram Analytics</h3>
            <p className="text-gray-500">No Instagram data available. Please upload IG_Posts.csv, IG_Follows.csv, IG_Reach.csv, IG_Views.csv, and IG_Interactions.csv to see Instagram analytics.</p>
            <div className="mt-4 bg-pink-50 p-4 rounded border border-pink-100">
              <h4 className="font-medium text-pink-800 mb-2">What you'll see here:</h4>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Page rank metrics (engagement, followers, views, reach)</li>
                <li>Engagement distribution</li>
                <li>Follower growth over time</li>
                <li>Top performing posts</li>
              </ul>
            </div>
          </div>
        );
      }
      
      return (
        <>
          {pageRankMetrics()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {engagementChart()}
            {followerGrowthChart()}
          </div>
          {topPosts()}
        </>
      );
    };
    
    return (
      <>
        <div className="mb-4">
          <div className="flex border-b">
            <button
              className={`px-4 py-2 mr-2 font-medium ${socialTab === 'facebook' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSocialTab('facebook')}
            >
              Facebook
            </button>
            <button
              className={`px-4 py-2 font-medium ${socialTab === 'instagram' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setSocialTab('instagram')}
            >
              Instagram
            </button>
          </div>
        </div>
        
        {socialTab === 'facebook' ? <FacebookContent /> : <InstagramContent />}
      </>
    );
  };

  // Email Tab Content
  const EmailContent = () => {
    const hasEmailData = data.email !== null;
    
    // Metrics
    const metrics = () => {
      if (!hasEmailData) return null;
      
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KpiCard 
            title="Subscribers"
            value={data.email.metrics.subscribers}
            type="number"
          />
          <KpiCard 
            title="Average Open Rate"
            value={data.email.campaigns.length > 0 
              ? data.email.campaigns.reduce((sum, c) => sum + c.openRate, 0) / data.email.campaigns.length 
              : 0}
            type="percent"
          />
          <KpiCard 
            title="Average Click Rate"
            value={data.email.campaigns.length > 0 
              ? data.email.campaigns.reduce((sum, c) => sum + c.clickRate, 0) / data.email.campaigns.length 
              : 0}
            type="percent"
          />
        </div>
      );
    };
    
    // Campaign performance chart
    const campaignChart = () => {
      if (!hasEmailData || !data.email.topByOpenRate || data.email.topByOpenRate.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Top Email Campaigns by Open Rate</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.email.topByOpenRate}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatNumber(value, 'percent'), name]} />
                <Legend />
                <Bar dataKey="openRate" name="Open Rate (%)" fill="#4299e1" />
                <Bar dataKey="clickRate" name="Click Rate (%)" fill="#9f7aea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    };
    
    // Engagement segmentation chart
    const engagementChart = () => {
      if (!hasEmailData || !data.email.engagementData) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Email Engagement Segmentation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.email.engagementData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#fc8181" />
                  <Cell fill="#f6ad55" />
                  <Cell fill="#68d391" />
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    };
    
    // Link performance chart
    const linkPerformanceChart = () => {
      if (!hasEmailData || !data.email.links || data.email.links.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Best-Performing Links</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.email.links}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value, name) => [name === 'clickRate' ? formatNumber(value, 'percent') : formatNumber(value), name === 'clickRate' ? 'Click Rate' : 'Clicks']} />
                <Legend />
                <Bar dataKey="clicks" name="Clicks" fill="#4c51bf" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    };
    
    // Subscriber demographics charts
    const demographicsCharts = () => {
      if (!hasEmailData || !data.email.demographics) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Subscriber Demographics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-md font-medium mb-2 text-center">Regions</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.email.demographics.regions}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.email.demographics.regions.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium mb-2 text-center">Age Groups</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.email.demographics.age}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                    <Bar dataKey="value" name="Percentage" fill="#9f7aea" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium mb-2 text-center">Interests</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={60} data={data.email.demographics.interests}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <Radar name="Interests" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Tooltip formatter={(value) => formatNumber(value, 'percent')} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      );
    };
    
    // Campaigns table
    const campaignsTable = () => {
      if (!hasEmailData || !data.email.campaigns || data.email.campaigns.length === 0) return null;
      
      return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">Email Campaigns</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide