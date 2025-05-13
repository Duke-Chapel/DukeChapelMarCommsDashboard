// Data loading and processing for the dashboard
function createDataService() {
  // State storage
  let allData = {
    email: null,
    fbVideos: null,
    fbPosts: null,
    igPosts: null,
    youtubeAge: null,
    youtubeGender: null,
    youtubeGeography: null,
    youtubeSubscription: null,
    gaTraffic: null,
    gaDemographics: null,
    gaPages: null
  };

  let dataErrors = {};

  // Available dates range
  let availableDates = {
    earliestDate: null,
    latestDate: null
  };

  // Safe parsing helpers
  const safeParseInt = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') return defaultValue;

    // If it's already a number, return it
    if (typeof value === 'number' && !isNaN(value)) return value;

    // If it's a string with commas (like "1,234"), remove them
    if (typeof value === 'string') value = value.replace(/,/g, '');

    // If it's a string with a percentage, remove the % sign and convert
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return isNaN(numValue) ? defaultValue : Math.round(numValue);
    }

    // Otherwise try to parse it as an integer
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  const safeParseFloat = (value, defaultValue = 0) => {
    if (value === undefined || value === null || value === '') return defaultValue;

    // If it's already a number, return it
    if (typeof value === 'number' && !isNaN(value)) return value;

    // If it's a string with commas (like "1,234.56"), remove them
    if (typeof value === 'string') value = value.replace(/,/g, '');

    // If it's a string with a percentage, remove the % sign and convert
    if (typeof value === 'string' && value.includes('%')) {
      const numValue = parseFloat(value.replace('%', ''));
      return isNaN(numValue) ? defaultValue : numValue;
    }

    // Otherwise try to parse it as a float
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  };

  // Parse dates from different formats
  const parseDate = (dateString) => {
    if (!dateString) return null;

    // Clean up the date string
    const cleanDateString = String(dateString).trim();

    // Try different date formats
    const formats = [
      // ISO format
      (str) => new Date(str),
      // MM/DD/YYYY
      (str) => {
        const parts = str.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        return null;
      },
      // DD/MM/YYYY
      (str) => {
        const parts = str.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return null;
      },
      // YYYY-MM-DD
      (str) => {
        const parts = str.split('-');
        if (parts.length === 3) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return null;
      },
      // MM-DD-YYYY
      (str) => {
        const parts = str.split('-');
        if (parts.length === 3) {
          return new Date(parts[2], parts[0] - 1, parts[1]);
        }
        return null;
      },
      // Month DD, YYYY (e.g., January 1, 2022)
      (str) => {
        const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        const monthPattern = monthNames.join('|');
        const regex = new RegExp(`(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})`, 'i');
        const match = str.match(regex);
        if (match) {
          const month = monthNames.indexOf(match[1].toLowerCase());
          const day = parseInt(match[2], 10);
          const year = parseInt(match[3], 10);
          return new Date(year, month, day);
        }
        return null;
      },
      // Timestamp (milliseconds since epoch)
      (str) => {
        const timestamp = parseInt(str, 10);
        if (!isNaN(timestamp) && timestamp > 946684800000) { // Jan 1, 2000
          return new Date(timestamp);
        }
        return null;
      },
      // M/D/YYYY format (single digit month/day)
      (str) => {
        const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
        const match = str.match(regex);
        if (match) {
          return new Date(match[3], match[1] - 1, match[2]);
        }
        return null;
      }
    ];

    for (const format of formats) {
      try {
        const date = format(cleanDateString);
        if (date && !isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Continue to next format on error
      }
    }

    // If all else fails, try the built-in Date parser as a last resort
    try {
      const date = new Date(cleanDateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (e) {
      console.warn(`Could not parse date: ${cleanDateString}`);
    }

    return null;
  };

  // (Removed duplicate extractAvailableDateRange function to fix redeclaration error)
  
  // Helper to get data safely with fallback field names
  const getDataField = (item, fieldPatterns, defaultValue = 0) => {
    if (!item) return defaultValue;

    // Try exact matches first
    for (const field of fieldPatterns) {
      if (item[field] !== undefined) {
        return typeof item[field] === 'string' && item[field].includes('%')
          ? safeParseFloat(item[field].replace('%', ''))
          : safeParseFloat(item[field]);
      }
    }

    // Try fuzzy matches
    const keys = Object.keys(item);
    for (const pattern of fieldPatterns) {
      for (const key of keys) {
        if (key.toLowerCase().includes(pattern.toLowerCase())) {
          return typeof item[key] === 'string' && item[key].includes('%')
            ? safeParseFloat(item[key].replace('%', ''))
            : safeParseFloat(item[key]);
        }
      }
    }

    return defaultValue;
  };

  // Get proper path for CSV files based on deployment environment
  const getFilePath = (filename) => {
    // For GitHub Pages, need to include the repository name in the path
    const isGitHubPages = window.location.hostname.includes('github.io');
    if (isGitHubPages) {
      // Extract repo name from the path
      const pathParts = window.location.pathname.split('/');
      const repoName = pathParts[1]; // First part after the domain

      // If we're in a repo (not a user pages site)
      if (repoName && repoName !== '') {
        console.log(`Using GitHub Pages path: /${repoName}/${filename}`);
        return `/${repoName}/${filename}`;
      }
    }

    // Otherwise use relative path for local development
    return filename;
  };

  // Load a CSV file
  const loadCSVFile = (filename) => {
    return new Promise((resolve, reject) => {
      const filepath = getFilePath(filename);
      console.log(`Loading ${filename} from ${filepath}...`);

      try {
        Papa.parse(filepath, {
          download: true,
          header: true,
          dynamicTyping: false, // Keep as strings to handle format variations
          skipEmptyLines: true,
          complete: (results) => {
            console.log(`Successfully loaded ${filename}, found ${results.data.length} rows`);
            resolve(results.data);
          },
          error: (error) => {
            console.error(`Error parsing ${filename}:`, error);
            dataErrors[filename] = `Error parsing: ${error.message}`;
            reject(error);
          }
        });
      } catch (error) {
        console.error(`Exception loading ${filename}:`, error);
        dataErrors[filename] = `Error loading: ${error.message}`;
        reject(error);
      }
    });
  };

  // Filter data based on date range
  const filterDataByDateRange = (data, dateRange, dateField = 'Date') => {
    if (!data || !dateRange.startDate || !dateRange.endDate) return [];

    return data.filter(item => {
      let itemDate = null;

      // Try different possible date fields
      const dateFields = [dateField, 'Publish time', 'publish_time', 'date'];

      for (const field of dateFields) {
        if (item[field]) {
          itemDate = parseDate(item[field]);
          if (itemDate) break;
        }
      }

      if (!itemDate) return false;

      return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
    });
  };

  // Extract all dates from datasets to determine available date range
  const extractAvailableDateRange = () => {
    const allDates = [];

    // Define datasets and their date fields
    const datasetsToCheck = [
      { data: allData.email, fields: ['Date', 'Publish time', 'publish_time', 'date'] },
      { data: allData.fbVideos, fields: ['Date', 'Publish time', 'publish_time', 'date'] },
      { data: allData.fbPosts, fields: ['Date', 'Publish time', 'publish_time', 'date'] },
      { data: allData.igPosts, fields: ['Date', 'Publish time', 'publish_time', 'date'] },
      { data: allData.gaTraffic, fields: ['Date', 'date', 'Date Range'] },
      { data: allData.gaDemographics, fields: ['Date', 'date', 'Date Range'] }
    ];

    // Scan all objects in all datasets for any field that might contain a date
    Object.values(allData).forEach(dataset => {
      if (!dataset || !dataset.length) return;

      // Take a sample of records to scan for date fields (performance optimization)
      const sampleSize = Math.min(dataset.length, 100);
      const sampleRecords = dataset.slice(0, sampleSize);

      sampleRecords.forEach(record => {
        Object.entries(record).forEach(([key, value]) => {
          // Look for any field that might contain a date
          if (typeof value === 'string' &&
            (key.toLowerCase().includes('date') ||
              key.toLowerCase().includes('time') ||
              key.toLowerCase().includes('publish'))) {

            const date = parseDate(value);
            if (date && !isNaN(date.getTime())) {
              // Validate date is reasonable (between 2000 and current year + 1)
              const currentYear = new Date().getFullYear();
              if (date.getFullYear() >= 2000 && date.getFullYear() <= currentYear + 1) {
                allDates.push(date);
              }
            }
          }
        });
      });
    });

    // Also check main datasets with known date fields
    datasetsToCheck.forEach(dataset => {
      if (!dataset.data || !dataset.data.length) return;

      dataset.data.forEach(item => {
        dataset.fields.forEach(field => {
          if (item[field]) {
            const date = parseDate(item[field]);
            if (date && !isNaN(date.getTime())) {
              allDates.push(date);
            }
          }
        });
      });
    });

    // Set available date range
    if (allDates.length > 0) {
      // Filter out any invalid dates and sort
      const validDates = allDates.filter(date =>
        date instanceof Date && !isNaN(date.getTime())
      ).sort((a, b) => a - b);

      if (validDates.length > 0) {
        availableDates.earliestDate = new Date(validDates[0]);
        availableDates.latestDate = new Date(validDates[validDates.length - 1]);

        console.log(`Available date range: ${availableDates.earliestDate.toISOString()} to ${availableDates.latestDate.toISOString()}`);
      }
    }

    // If no valid dates found or date range is unreasonably narrow, use fallback
    if (allDates.length === 0 ||
      !availableDates.earliestDate ||
      !availableDates.latestDate ||
      (availableDates.latestDate - availableDates.earliestDate) < 86400000) { // Less than a day difference

      console.warn('No valid dates found in the datasets or date range too narrow. Using fallback dates.');
      // Set fallback dates (last 2 years)
      const now = new Date();
      availableDates.latestDate = now;
      availableDates.earliestDate = new Date(now);
      availableDates.earliestDate.setFullYear(now.getFullYear() - 2);
    }

    return availableDates;
  };

  // Load all data
  const loadAllData = async () => {
    dataErrors = {};

    // Helper function to safely load a file and store in the data object
    const safeLoad = async (filename, dataKey) => {
      try {
        allData[dataKey] = await loadCSVFile(filename);
        return true;
      } catch (error) {
        console.error(`Failed to load ${filename}:`, error);
        dataErrors[filename] = error.message || "File not found or inaccessible";
        return false;
      }
    };

    // Load all files
    await Promise.allSettled([
      safeLoad('Email_Campaign_Performance.csv', 'email'),
      safeLoad('FB_Videos.csv', 'fbVideos'),
      safeLoad('FB_Posts.csv', 'fbPosts'),
      safeLoad('IG_Posts.csv', 'igPosts'),
      safeLoad('YouTube_Age.csv', 'youtubeAge'),
      safeLoad('YouTube_Gender.csv', 'youtubeGender'),
      safeLoad('YouTube_Geography.csv', 'youtubeGeography'),
      safeLoad('YouTube_Subscription_Status.csv', 'youtubeSubscription'),
      safeLoad('GA_Traffic_Acquisition.csv', 'gaTraffic'),
      safeLoad('GA_Demographics.csv', 'gaDemographics'),
      safeLoad('GA_Pages_And_Screens.csv', 'gaPages')
    ]);

    // Determine available date range from the data
    extractAvailableDateRange();

    return {
      data: allData,
      errors: dataErrors,
      availableDates
    };
  };

  // Analyze email data
  const analyzeEmailData = (dateRanges) => {
    if (!allData.email || !allData.email.length) {
      return {
        topCampaigns: [],
        metrics: {
          subscribers: null,
          opens: null,
          clicks: null,
          bounces: null
        },
        engagement: {
          notOpened: 0,
          openedNotClicked: 0,
          clicked: 0
        }
      };
    }

    // Filter data by date ranges
    const currentData = filterDataByDateRange(allData.email, dateRanges.current);
    const comparisonData = dateRanges.comparison.enabled
      ? filterDataByDateRange(allData.email, dateRanges.comparison)
      : null;

    // Calculate metrics for current period
    const currentMetrics = currentData.reduce((metrics, campaign) => {
      metrics.sent += safeParseInt(campaign['Emails sent']);
      metrics.opens += safeParseInt(campaign['Email opened (MPP excluded)']);
      metrics.clicks += safeParseInt(campaign['Email clicked']);
      metrics.bounces += safeParseInt(campaign['Email bounces']);
      metrics.unsubscribes += safeParseInt(campaign['Email unsubscribes']);
      return metrics;
    }, { sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 });

    // Calculate metrics for comparison period
    const comparisonMetrics = comparisonData ? comparisonData.reduce((metrics, campaign) => {
      metrics.sent += safeParseInt(campaign['Emails sent']);
      metrics.opens += safeParseInt(campaign['Email opened (MPP excluded)']);
      metrics.clicks += safeParseInt(campaign['Email clicked']);
      metrics.bounces += safeParseInt(campaign['Email bounces']);
      metrics.unsubscribes += safeParseInt(campaign['Email unsubscribes']);
      return metrics;
    }, { sent: 0, opens: 0, clicks: 0, bounces: 0, unsubscribes: 0 }) : null;

    // Calculate engagement segments for current period
    const engagement = {
      notOpened: currentMetrics.sent - currentMetrics.opens,
      openedNotClicked: currentMetrics.opens - currentMetrics.clicks,
      clicked: currentMetrics.clicks
    };

    // Calculate engagement segments for comparison period
    const comparisonEngagement = comparisonData ? {
      notOpened: comparisonMetrics.sent - comparisonMetrics.opens,
      openedNotClicked: comparisonMetrics.opens - comparisonMetrics.clicks,
      clicked: comparisonMetrics.clicks
    } : null;

    // Sort campaigns by open rate
    const topCampaigns = [...currentData]
      .map(campaign => {
        const openRate = safeParseFloat(campaign['Email open rate (MPP excluded)']);
        const clickRate = safeParseFloat(campaign['Email click rate']);
        return {
          name: campaign['Campaign'],
          openRate: openRate * 100, // Convert to percentage
          clickRate: clickRate * 100, // Convert to percentage
          sent: safeParseInt(campaign['Emails sent']),
          opens: safeParseInt(campaign['Email opened (MPP excluded)']),
          clicks: safeParseInt(campaign['Email clicked']),
          unsubscribes: safeParseInt(campaign['Email unsubscribes'])
        };
      })
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5);

    return {
      topCampaigns,
      metrics: {
        subscribers: currentMetrics.sent,
        subscribersComparison: comparisonMetrics?.sent || null,
        opens: currentMetrics.opens,
        opensComparison: comparisonMetrics?.opens || null,
        clicks: currentMetrics.clicks,
        clicksComparison: comparisonMetrics?.clicks || null,
        bounces: currentMetrics.bounces,
        bouncesComparison: comparisonMetrics?.bounces || null,
        unsubscribes: currentMetrics.unsubscribes,
        unsubscribesComparison: comparisonMetrics?.unsubscribes || null
      },
      engagement,
      engagementComparison: comparisonEngagement
    };
  };

  // Analyze YouTube data
  const analyzeYoutubeData = (dateRanges) => {
    if (!allData.youtubeAge || !allData.youtubeGender || !allData.youtubeSubscription) {
      return {
        ageData: [],
        genderData: [],
        subscriptionData: [],
        topCountries: []
      };
    }

    // Process age data
    const ageData = allData.youtubeAge.map(item => ({
      age: item['Viewer age'],
      views: safeParseFloat(item['Views (%)'])
    }));

    // Process gender data
    const genderData = allData.youtubeGender.map(item => ({
      gender: item['Viewer gender'],
      views: safeParseFloat(item['Views (%)'])
    }));

    // Process subscription data
    const subscriptionData = allData.youtubeSubscription.map(item => ({
      status: item['Subscription status'],
      views: safeParseInt(item['Views']),
      watchTime: safeParseFloat(item['Watch time (hours)'])
    }));

    // Calculate total views
    const totalViews = subscriptionData.reduce((sum, item) => sum + item.views, 0);

    // Add percentages
    subscriptionData.forEach(item => {
      item.percentage = (item.views / totalViews) * 100;
    });

    // Process geography data
    const topCountries = allData.youtubeGeography
      ? [...allData.youtubeGeography]
        .sort((a, b) => safeParseInt(b['Views']) - safeParseInt(a['Views']))
        .slice(0, 10)
        .map(item => ({
          country: item['Geography'],
          views: safeParseInt(item['Views']),
          watchTime: safeParseFloat(item['Watch time (hours)']),
          avgViewDuration: item['Average view duration']
        }))
      : [];

    return {
      ageData,
      genderData,
      subscriptionData,
      topCountries
    };
  };

  // Analyze Facebook data
  const analyzeFacebookData = (dateRanges) => {
    if (!allData.fbVideos || !allData.fbVideos.length) {
      return {
        topVideos: [],
        demographics: [],
        metrics: {
          views: null,
          engagement: null
        }
      };
    }

    // Filter data by date ranges
    const currentData = filterDataByDateRange(allData.fbVideos, dateRanges.current);
    const comparisonData = dateRanges.comparison.enabled
      ? filterDataByDateRange(allData.fbVideos, dateRanges.comparison)
      : null;

    // Calculate metrics for current period
    const currentMetrics = currentData.reduce((metrics, video) => {
      metrics.views += safeParseInt(video['3-second video views']);
      metrics.engagement += safeParseInt(video['Reactions']) +
        safeParseInt(video['Comments']) +
        safeParseInt(video['Shares']);
      return metrics;
    }, { views: 0, engagement: 0 });

    // Calculate metrics for comparison period
    const comparisonMetrics = comparisonData ? comparisonData.reduce((metrics, video) => {
      metrics.views += safeParseInt(video['3-second video views']);
      metrics.engagement += safeParseInt(video['Reactions']) +
        safeParseInt(video['Comments']) +
        safeParseInt(video['Shares']);
      return metrics;
    }, { views: 0, engagement: 0 }) : null;

    // Sort videos by views
    const topVideos = [...currentData]
      .sort((a, b) => safeParseInt(b['3-second video views']) - safeParseInt(a['3-second video views']))
      .slice(0, 5)
      .map(video => ({
        title: video['Title'],
        views: safeParseInt(video['3-second video views']),
        reactions: safeParseInt(video['Reactions']),
        comments: safeParseInt(video['Comments']),
        shares: safeParseInt(video['Shares']),
        avgViewTime: safeParseFloat(video['Average Seconds viewed'])
      }));

    // Extract demographic data from the top video (if available)
    const topVideo = currentData.length > 0
      ? currentData.sort((a, b) => safeParseInt(b['3-second video views']) - safeParseInt(a['3-second video views']))[0]
      : null;

    let demographics = [];

    if (topVideo) {
      // Extract demographic data with proper field detection
      const extractDemographicValue = (video, ageGender) => {
        // Try different possible field patterns
        const patterns = [
          `3-second video views by top audience (${ageGender})`,
          `3-second video views by top audience ${ageGender}`,
          `video views by audience (${ageGender})`,
          `video views by audience ${ageGender}`
        ];

        for (const pattern of patterns) {
          if (video[pattern] !== undefined) {
            return safeParseFloat(video[pattern]);
          }
        }
        return 0;
      };

      // Extract demographic values for various age/gender segments
      demographics = [
        { name: 'F, 18-24', value: extractDemographicValue(topVideo, 'F, 18-24') },
        { name: 'F, 25-34', value: extractDemographicValue(topVideo, 'F, 25-34') },
        { name: 'F, 35-44', value: extractDemographicValue(topVideo, 'F, 35-44') },
        { name: 'F, 45-54', value: extractDemographicValue(topVideo, 'F, 45-54') },
        { name: 'M, 18-24', value: extractDemographicValue(topVideo, 'M, 18-24') },
        { name: 'M, 25-34', value: extractDemographicValue(topVideo, 'M, 25-34') },
        { name: 'M, 35-44', value: extractDemographicValue(topVideo, 'M, 35-44') },
        { name: 'M, 45-54', value: extractDemographicValue(topVideo, 'M, 45-54') },
      ].filter(item => item.value > 0);

      // If no demographic data was found with standard patterns, try an alternate approach
      if (demographics.length === 0) {
        // Find any field that might contain demographic data
        Object.keys(topVideo).forEach(key => {
          if (key.includes('audience') || (key.includes('video views') && (key.includes('F,') || key.includes('M,')))) {
            const value = safeParseFloat(topVideo[key]);
            if (value > 0) {
              // Extract the demographic category from the field name
              let name = key.match(/\((.*?)\)/) || key.match(/(F,.*?|M,.*?)$/);
              name = name ? name[1] : key;
              demographics.push({
                name: name,
                value: value
              });
            }
          }
        });
      }
    }

    return {
      topVideos,
      demographics,
      metrics: {
        views: currentMetrics.views,
        viewsComparison: comparisonMetrics?.views || null,
        engagement: currentMetrics.engagement,
        engagementComparison: comparisonMetrics?.engagement || null
      }
    };
  };

  // Analyze Instagram data
  const analyzeInstagramData = (dateRanges) => {
    if (!allData.igPosts || !allData.igPosts.length) {
      return {
        topPosts: [],
        engagement: [],
        metrics: {
          reach: null,
          engagement: null
        }
      };
    }

    // Filter data by date ranges
    const currentData = filterDataByDateRange(allData.igPosts, dateRanges.current);
    const comparisonData = dateRanges.comparison.enabled
      ? filterDataByDateRange(allData.igPosts, dateRanges.comparison)
      : null;

    // Calculate metrics for current period
    const currentMetrics = currentData.reduce((metrics, post) => {
      metrics.reach += safeParseInt(post['Reach']);
      metrics.engagement += safeParseInt(post['Likes']) +
        safeParseInt(post['Comments']) +
        safeParseInt(post['Shares']) +
        safeParseInt(post['Saves']);
      return metrics;
    }, { reach: 0, engagement: 0 });

    // Calculate metrics for comparison period
    const comparisonMetrics = comparisonData ? comparisonData.reduce((metrics, post) => {
      metrics.reach += safeParseInt(post['Reach']);
      metrics.engagement += safeParseInt(post['Likes']) +
        safeParseInt(post['Comments']) +
        safeParseInt(post['Shares']) +
        safeParseInt(post['Saves']);
      return metrics;
    }, { reach: 0, engagement: 0 }) : null;

    // Sort posts by reach
    const topPosts = [...currentData]
      .sort((a, b) => safeParseInt(b['Reach']) - safeParseInt(a['Reach']))
      .slice(0, 5)
      .map(post => ({
        description: post['Description'],
        reach: safeParseInt(post['Reach']),
        likes: safeParseInt(post['Likes']),
        comments: safeParseInt(post['Comments']),
        shares: safeParseInt(post['Shares']),
        saves: safeParseInt(post['Saves'])
      }));

    // Calculate engagement distribution
    const engagement = [
      { name: 'Likes', value: currentData.reduce((sum, post) => sum + safeParseInt(post['Likes']), 0) },
      { name: 'Comments', value: currentData.reduce((sum, post) => sum + safeParseInt(post['Comments']), 0) },
      { name: 'Shares', value: currentData.reduce((sum, post) => sum + safeParseInt(post['Shares']), 0) },
      { name: 'Saves', value: currentData.reduce((sum, post) => sum + safeParseInt(post['Saves']), 0) }
    ];

    return {
      topPosts,
      engagement,
      metrics: {
        reach: currentMetrics.reach,
        reachComparison: comparisonMetrics?.reach || null,
        engagement: currentMetrics.engagement,
        engagementComparison: comparisonMetrics?.engagement || null
      }
    };
  };

  // Return the public interface
  return {
    loadAllData,
    getAvailableDates: () => availableDates,
    getErrors: () => dataErrors,
    analyzeEmailData,
    analyzeYoutubeData,
    analyzeFacebookData,
    analyzeInstagramData
  };
}