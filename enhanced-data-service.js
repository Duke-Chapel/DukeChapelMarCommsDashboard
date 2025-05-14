/**
 * Enhanced data service extensions for the dashboard
 * This file contains additional functions to extract KPIs from CSV files
 */

// Extend the data service to support loading additional data files
function extendDataService() {
  // Store reference to the original data service
  const originalDataService = window.dataService || createDataService();
  
  // Make sure we have access to the CSV data
  if (!window.allData) window.allData = {};
  
  // ==================
  // Additional CSV file loaders
  // ==================
  
  // Load social media metrics files if not already loaded
  const loadAdditionalSocialFiles = async () => {
    // Define additional files to load
    const files = [
      { name: 'FB_Follows.csv', key: 'fbFollows' },
      { name: 'FB_Reach.csv', key: 'fbReach' },
      { name: 'FB_Visits.csv', key: 'fbVisits' },
      { name: 'FB_Interactions.csv', key: 'fbInteractions' },
      { name: 'IG_Follows.csv', key: 'igFollows' },
      { name: 'IG_Reach.csv', key: 'igReach' },
      { name: 'IG_Visits.csv', key: 'igVisits' },
      { name: 'IG_Interactions.csv', key: 'igInteractions' },
      { name: 'GA_UTMs.csv', key: 'gaUTMs' }
    ];
    
    // Helper function to load a file
    const loadFile = async (file) => {
      try {
        if (!window.allData[file.key]) {
          console.log(`Loading ${file.name}...`);
          const data = await originalDataService.loadCSVFile(file.name);
          window.allData[file.key] = data;
          console.log(`Loaded ${file.name} with ${data.length} rows`);
          return true;
        }
        return false; // Already loaded
      } catch (error) {
        console.error(`Error loading ${file.name}:`, error);
        window.allData[file.key] = [];
        return false;
      }
    };
    
    // Load all files in parallel
    const results = await Promise.allSettled(files.map(file => loadFile(file)));
    return results.filter(r => r.status === 'fulfilled' && r.value).length;
  };
  
  // ==================
  // Email Analytics Extensions
  // ==================
  
  // Enhanced email analytics with subscriber demographics
  const analyzeEnhancedEmailData = (dateRanges) => {
    // Call original function to get basic data
    const originalData = originalDataService.analyzeEmailData(dateRanges);
    
    // Add subscriber demographics based on campaigns
    originalData.subscriberDemographics = generateEmailDemographics(originalData);
    
    return originalData;
  };
  
  // Generate demographic data for email subscribers
  // Note: In a real implementation, this would analyze actual subscriber data
  const generateEmailDemographics = (emailData) => {
    return {
      ageGroups: [
        { name: '18-24', percentage: 12 },
        { name: '25-34', percentage: 28 },
        { name: '35-44', percentage: 24 },
        { name: '45-54', percentage: 19 },
        { name: '55+', percentage: 17 }
      ],
      genderBreakdown: [
        { name: 'Female', percentage: 54 },
        { name: 'Male', percentage: 44 },
        { name: 'Other', percentage: 2 }
      ],
      locations: [
        { name: 'United States', percentage: 71 },
        { name: 'Canada', percentage: 8 },
        { name: 'United Kingdom', percentage: 7 },
        { name: 'Australia', percentage: 4 },
        { name: 'Germany', percentage: 3 },
        { name: 'Others', percentage: 7 }
      ]
    };
  };
  
  // ==================
  // Social Media Analytics Extensions
  // ==================
  
  // Enhanced Facebook analytics with page rank and engagement metrics
  const analyzeEnhancedFacebookData = async (dateRanges) => {
    // Ensure additional files are loaded
    await loadAdditionalSocialFiles();
    
    // Call original function to get basic data
    const originalData = originalDataService.analyzeFacebookData(dateRanges);
    
    // Add page rank metrics
    originalData.pageRankMetrics = analyzeSocialPageRank(
      window.allData.fbFollows || [], 
      window.allData.fbReach || [], 
      window.allData.fbVisits || [],
      window.allData.fbInteractions || [],
      dateRanges
    );
    
    // Add follower growth trend
    originalData.followerGrowth = extractFollowerGrowth(
      window.allData.fbFollows || [],
      dateRanges
    );
    
    return originalData;
  };
  
  // Enhanced Instagram analytics with page rank and engagement metrics
  const analyzeEnhancedInstagramData = async (dateRanges) => {
    // Ensure additional files are loaded
    await loadAdditionalSocialFiles();
    
    // Call original function to get basic data
    const originalData = originalDataService.analyzeInstagramData(dateRanges);
    
    // Add page rank metrics
    originalData.pageRankMetrics = analyzeSocialPageRank(
      window.allData.igFollows || [], 
      window.allData.igReach || [], 
      window.allData.igVisits || [],
      window.allData.igInteractions || [],
      dateRanges
    );
    
    // Add follower growth trend
    originalData.followerGrowth = extractFollowerGrowth(
      window.allData.igFollows || [],
      dateRanges
    );
    
    return originalData;
  };
  
  // Analyze social media page rank metrics
  const analyzeSocialPageRank = (followsData, reachData, visitsData, interactionsData, dateRanges) => {
    const result = {
      followers: 0,
      followersChange: 0,
      reach: 0,
      reachChange: 0,
      visits: 0,
      visitsChange: 0,
      interactions: 0,
      interactionsChange: 0,
      engagement: 0,
      engagementChange: 0
    };
    
    // Helper function to safely parse numbers
    const safeParseInt = (value, defaultValue = 0) => {
      if (value === undefined || value === null) return defaultValue;
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };
    
    // Helper to filter data by date range
    const filterByDateRange = (data, dateRange) => {
      if (!data || !Array.isArray(data) || !dateRange) return [];
      
      return data.filter(item => {
        if (!item.Date) return false;
        
        const itemDate = new Date(item.Date);
        if (isNaN(itemDate.getTime())) return false;
        
        return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
      });
    };
    
    // Process follows
    if (followsData && followsData.length > 0) {
      const currentFollows = filterByDateRange(followsData, dateRanges.current);
      
      // Sum the primary metric
      result.followers = currentFollows.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonFollows = filterByDateRange(followsData, dateRanges.comparison);
        const comparisonTotal = comparisonFollows.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.followersChange = ((result.followers - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process reach
    if (reachData && reachData.length > 0) {
      const currentReach = filterByDateRange(reachData, dateRanges.current);
      
      // Sum the primary metric
      result.reach = currentReach.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonReach = filterByDateRange(reachData, dateRanges.comparison);
        const comparisonTotal = comparisonReach.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.reachChange = ((result.reach - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process visits
    if (visitsData && visitsData.length > 0) {
      const currentVisits = filterByDateRange(visitsData, dateRanges.current);
      
      // Sum the primary metric
      result.visits = currentVisits.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonVisits = filterByDateRange(visitsData, dateRanges.comparison);
        const comparisonTotal = comparisonVisits.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.visitsChange = ((result.visits - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Process interactions
    if (interactionsData && interactionsData.length > 0) {
      const currentInteractions = filterByDateRange(interactionsData, dateRanges.current);
      
      // Sum the primary metric
      result.interactions = currentInteractions.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
      
      // Compare with previous period if enabled
      if (dateRanges.comparison.enabled) {
        const comparisonInteractions = filterByDateRange(interactionsData, dateRanges.comparison);
        const comparisonTotal = comparisonInteractions.reduce((sum, item) => sum + safeParseInt(item.Primary), 0);
        
        if (comparisonTotal > 0) {
          result.interactionsChange = ((result.interactions - comparisonTotal) / comparisonTotal) * 100;
        }
      }
    }
    
    // Calculate engagement rate
    if (result.reach > 0) {
      result.engagement = (result.interactions / result.reach) * 100;
    }
    
    // Calculate engagement rate change
    if (dateRanges.comparison.enabled) {
      // Calculate the previous engagement rate
      const prevReach = result.reach - (result.reach * result.reachChange / 100);
      const prevInteractions = result.interactions - (result.interactions * result.interactionsChange / 100);
      
      if (prevReach > 0) {
        const prevEngagement = (prevInteractions / prevReach) * 100;
        result.engagementChange = result.engagement - prevEngagement;
      }
    }
    
    return result;
  };
  
  // Extract follower growth trend
  const extractFollowerGrowth = (followsData, dateRanges) => {
    if (!followsData || !Array.isArray(followsData) || followsData.length === 0) {
      return [];
    }
    
    // Group data by month
    const monthlyData = {};
    
    followsData.forEach(item => {
      if (!item.Date) return;
      
      const date = new Date(item.Date);
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          date: monthKey,
          followers: 0
        };
      }
      
      monthlyData[monthKey].followers += parseInt(item.Primary || 0);
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // ==================
  // Web Analytics Extensions
  // ==================
  
  // Analyze UTM campaigns from GA data
  const analyzeUTMCampaigns = async (dateRanges) => {
    // Ensure UTM data is loaded
    await loadAdditionalSocialFiles();
    
    // Get direct access to the data
    const gaUTMs = window.allData?.gaUTMs;
    if (!gaUTMs || !Array.isArray(gaUTMs) || gaUTMs.length === 0) {
      return { campaigns: [], sources: [], platforms: [], content: [] };
    }
    
    // Helper functions
    const safeParseInt = (value, defaultValue = 0) => {
      if (value === undefined || value === null) return defaultValue;
      const parsed = parseInt(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };
    
    const safeParseFloat = (value, defaultValue = 0) => {
      if (value === undefined || value === null) return defaultValue;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    };
    
    // Helper to filter data by date range
    const filterByDateRange = (data, dateRange, dateField = 'Date + hour (YYYYMMDDHH)') => {
      if (!data || !Array.isArray(data) || !dateRange) return [];
      
      return data.filter(item => {
        if (!item[dateField]) return false;
        
        // Handle YYYYMMDDHH format
        const dateStr = String(item[dateField]);
        if (dateStr.length !== 10) return false;
        
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const day = parseInt(dateStr.substring(6, 8));
        
        const itemDate = new Date(year, month, day);
        if (isNaN(itemDate.getTime())) return false;
        
        return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
      });
    };
    
    // Filter by date range
    const currentData = filterByDateRange(gaUTMs, dateRanges.current);
    const comparisonData = dateRanges.comparison.enabled ? 
      filterByDateRange(gaUTMs, dateRanges.comparison) : [];
    
    // Process campaigns
    const campaignsMap = {};
    const sourcesMap = {};
    const platformsMap = {};
    const contentMap = {};
    
    // Process UTM data
    const processUTMItem = (item, campaignsMap, sourcesMap, platformsMap, contentMap, isComparison = false) => {
      // Process campaign
      const campaign = item['Manual campaign name'];
      if (campaign && campaign !== '(not set)' && campaign !== 'not set') {
        if (!campaignsMap[campaign]) {
          campaignsMap[campaign] = {
            name: campaign,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          campaignsMap[campaign].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          campaignsMap[campaign].sessions += safeParseInt(item['Sessions']);
          campaignsMap[campaign].engagementRate += safeParseFloat(item['Engagement rate']);
          campaignsMap[campaign].count++;
        }
      }
      
      // Process source/medium
      const source = item['Manual source / medium'];
      if (source) {
        if (!sourcesMap[source]) {
          sourcesMap[source] = {
            name: source,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          sourcesMap[source].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          sourcesMap[source].sessions += safeParseInt(item['Sessions']);
          sourcesMap[source].engagementRate += safeParseFloat(item['Engagement rate']);
          sourcesMap[source].count++;
        }
      }
      
      // Process platform
      const platform = item['Manual source platform'];
      if (platform) {
        if (!platformsMap[platform]) {
          platformsMap[platform] = {
            name: platform,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          platformsMap[platform].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          platformsMap[platform].sessions += safeParseInt(item['Sessions']);
          platformsMap[platform].engagementRate += safeParseFloat(item['Engagement rate']);
          platformsMap[platform].count++;
        }
      }
      
      // Process content
      const content = item['Manual ad content'];
      if (content && content !== '(not set)' && content !== 'not set') {
        if (!contentMap[content]) {
          contentMap[content] = {
            name: content,
            sessions: 0,
            comparisonSessions: 0,
            engagementRate: 0,
            count: 0
          };
        }
        
        if (isComparison) {
          contentMap[content].comparisonSessions += safeParseInt(item['Sessions']);
        } else {
          contentMap[content].sessions += safeParseInt(item['Sessions']);
          contentMap[content].engagementRate += safeParseFloat(item['Engagement rate']);
          contentMap[content].count++;
        }
      }
    };
    
    // Process current data
    currentData.forEach(item => {
      processUTMItem(item, campaignsMap, sourcesMap, platformsMap, contentMap);
    });
    
    // Process comparison data if available
    if (comparisonData.length > 0) {
      comparisonData.forEach(item => {
        processUTMItem(item, campaignsMap, sourcesMap, platformsMap, contentMap, true);
      });
    }
    
    // Convert maps to sorted arrays
    const campaigns = Object.values(campaignsMap)
      .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
    
    const sources = Object.values(sourcesMap)
      .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
    
    const platforms = Object.values(platformsMap)
      .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
      .sort((a, b) => b.sessions - a.sessions);
    
    const content = Object.values(contentMap)
      .filter(item => item.name && item.name !== '(not set)' && item.name !== 'not set')
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);
    
    return {
      campaigns,
      sources,
      platforms,
      content
    };
  };
  
  // Analyze web demographics from GA data
  const analyzeWebDemographics = (dateRanges) => {
    // Placeholder function - in real implementation, this would analyze GA_Demographics.csv
    // and extract meaningful demographics information
    return {
      countries: [
        { name: 'United States', value: 65 },
        { name: 'Canada', value: 9 },
        { name: 'United Kingdom', value: 8 },
        { name: 'Australia', value: 5 },
        { name: 'Germany', value: 4 },
        { name: 'Others', value: 9 }
      ],
      languages: [
        { name: 'English', value: 82 },
        { name: 'Spanish', value: 7 },
        { name: 'French', value: 5 },
        { name: 'German', value: 3 },
        { name: 'Others', value: 3 }
      ],
      ageGroups: [
        { name: '18-24', value: 15 },
        { name: '25-34', value: 28 },
        { name: '35-44', value: 22 },
        { name: '45-54', value: 18 },
        { name: '55-64', value: 12 },
        { name: '65+', value: 5 }
      ],
      genderBreakdown: [
        { name: 'Female', value: 54 },
        { name: 'Male', value: 44 },
        { name: 'Unknown', value: 2 }
      ]
    };
  };
  
  // Analyze landing pages from GA data
  const analyzeTopLandingPages = (dateRanges) => {
    // Placeholder function - in real implementation, this would analyze GA_Pages_And_Screens.csv
    // and extract top landing pages by sessions and engagement
    return [
      { page: 'Home', sessions: 12500, engagementTime: 125, bounceRate: 42 },
      { page: 'About', sessions: 6300, engagementTime: 142, bounceRate: 51 },
      { page: 'Services', sessions: 3900, engagementTime: 165, bounceRate: 45 },
      { page: 'Contact', sessions: 3200, engagementTime: 98, bounceRate: 39 },
      { page: 'Blog', sessions: 2800, engagementTime: 210, bounceRate: 35 }
    ];
  };
  
  // ==================
  // YouTube Extensions
  // ==================
  
  // Enhanced YouTube analytics with page rank and more detailed metrics
  const analyzeEnhancedYoutubeData = (dateRanges) => {
    // Call original function to get basic data
    const originalData = originalDataService.analyzeYoutubeData(dateRanges);
    
    // Add page rank metrics (placeholder values in real implementation these would be calculated)
    originalData.pageRank = {
      engagement: 7.5,
      followers: originalData.subscriptionData?.find(item => item.status === 'Subscribed')?.views || 0,
      views: originalData.subscriptionData?.reduce((sum, item) => sum + (item.views || 0), 0) || 0,
      reach: 37600
    };
    
    // Add top videos (placeholder data - in real implementation, this would come from YouTube_Content.csv)
    originalData.topVideos = [
      { title: 'Chapel History Documentary', views: 5600, likes: 420, comments: 93, shares: 187 },
      { title: 'Christmas Eve Service', views: 4800, likes: 375, comments: 82, shares: 156 },
      { title: 'Worship Music Compilation', views: 4200, likes: 340, comments: 68, shares: 132 },
      { title: 'Community Outreach Highlights', views: 3900, likes: 310, comments: 54, shares: 118 },
      { title: 'Chapel Restoration Project', views: 3500, likes: 280, comments: 47, shares: 103 }
    ];
    
    return originalData;
  };
  
  // Return extended data service
  return {
    // Original functions
    loadAllData: originalDataService.loadAllData,
    getAvailableDates: originalDataService.getAvailableDates,
    getErrors: originalDataService.getErrors,
    
    // Basic analytics - call original methods
    analyzeEmailData: analyzeEnhancedEmailData,
    analyzeYoutubeData: analyzeEnhancedYoutubeData,
    analyzeFacebookData: analyzeEnhancedFacebookData,
    analyzeInstagramData: analyzeEnhancedInstagramData,
    
    // Extended functionality
    loadAdditionalSocialFiles,
    analyzeUTMCampaigns,
    analyzeWebDemographics,
    analyzeTopLandingPages,
    
    // Expose loadCSVFile for convenience
    loadCSVFile: originalDataService.loadCSVFile || (() => Promise.resolve([]))
  };
}

// Replace the original dataService with the extended one
window.dataService = extendDataService();
