// Dashboard Configuration Manager
// This module handles saving and loading dashboard configurations for Google Drive integration

// Default configuration for each dashboard type
const DEFAULT_CONFIGS = {
  social: {
    refreshInterval: 5, // minutes
    files: {
      'FB_Posts.csv': '',
      'FB_Follows.csv': '',
      'FB_Reach.csv': '',
      'FB_Views.csv': '',
      'FB_Interactions.csv': '',
      'IG_Posts.csv': '',
      'IG_Follows.csv': '',
      'IG_Reach.csv': '',
      'IG_Views.csv': '',
      'IG_Interactions.csv': ''
    },
    lastUpdated: null
  },
  web: {
    refreshInterval: 5, // minutes
    files: {
      'GA_Demographics.csv': '',
      'GA_Traffic_Acquisition.csv': '',
      'GA_Pages_And_Screens.csv': '',
      'GA_UTMs.csv': ''
    },
    lastUpdated: null
  },
  email: {
    refreshInterval: 5, // minutes
    files: {
      'Email_Campaign_Performance.csv': ''
    },
    lastUpdated: null
  },
  youtube: {
    refreshInterval: 5, // minutes
    files: {
      'YouTube_Age.csv': '',
      'YouTube_Gender.csv': '',
      'YouTube_Geography.csv': '',
      'YouTube_Subscription_Status.csv': '',
      'YouTube_Content.csv': ''
    },
    lastUpdated: null
  }
};

// Save dashboard configuration to localStorage
const saveDashboardConfig = (dashboardType, config) => {
  try {
    const configKey = `${dashboardType}DashboardConfig`;
    localStorage.setItem(configKey, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error(`Error saving ${dashboardType} dashboard config:`, error);
    return false;
  }
};

// Load dashboard configuration from localStorage
const loadDashboardConfig = (dashboardType) => {
  try {
    const configKey = `${dashboardType}DashboardConfig`;
    const savedConfig = localStorage.getItem(configKey);
    
    if (!savedConfig) {
      return DEFAULT_CONFIGS[dashboardType];
    }
    
    const parsedConfig = JSON.parse(savedConfig);
    
    // Ensure all expected fields exist (in case the config format was updated)
    return {
      ...DEFAULT_CONFIGS[dashboardType],
      ...parsedConfig,
      files: {
        ...DEFAULT_CONFIGS[dashboardType].files,
        ...parsedConfig.files
      }
    };
  } catch (error) {
    console.error(`Error loading ${dashboardType} dashboard config:`, error);
    return DEFAULT_CONFIGS[dashboardType];
  }
};

// Update dashboard configuration
const updateDashboardConfig = (dashboardType, updates) => {
  try {
    const currentConfig = loadDashboardConfig(dashboardType);
    
    // Deep merge configuration
    const newConfig = {
      ...currentConfig,
      ...updates,
      files: updates.files ? {
        ...currentConfig.files,
        ...updates.files
      } : currentConfig.files
    };
    
    return saveDashboardConfig(dashboardType, newConfig);
  } catch (error) {
    console.error(`Error updating ${dashboardType} dashboard config:`, error);
    return false;
  }
};

// Generate a shareable URL based on the dashboard configuration
const createConfigShareableUrl = (dashboardType) => {
  try {
    // Get the current configuration
    const config = loadDashboardConfig(dashboardType);
    
    // Create a config object suitable for sharing (only file URLs, not data)
    const sharingConfig = {
      files: config.files,
      refreshInterval: config.refreshInterval
    };
    
    // Get the base URL (current page without query params)
    const url = new URL(window.location.href);
    const baseUrl = url.origin + url.pathname;
    
    // Convert config to Base64 to make it URL-friendly
    const encodedConfig = btoa(JSON.stringify(sharingConfig));
    
    // Create URL with config parameter
    return `${baseUrl}?config=${encodedConfig}&type=${dashboardType}`;
  } catch (error) {
    console.error('Error creating shareable config URL:', error);
    return window.location.href;
  }
};

// Extract configuration from URL
const extractConfigFromUrl = () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedConfig = urlParams.get('config');
    const dashboardType = urlParams.get('type');
    
    if (!encodedConfig) return { config: null, type: dashboardType };
    
    // Decode from Base64
    const configStr = atob(encodedConfig);
    const config = JSON.parse(configStr);
    
    return { config, type: dashboardType };
  } catch (error) {
    console.error('Error extracting config from URL:', error);
    return { config: null, type: null };
  }
};

// Check if all configured files have valid URLs
const validateDashboardConfig = async (dashboardType) => {
  try {
    const config = loadDashboardConfig(dashboardType);
    const fileEntries = Object.entries(config.files);
    
    // Check if there are any file URLs configured
    const hasUrls = fileEntries.some(([_, url]) => url && url.trim() !== '');
    if (!hasUrls) {
      return {
        valid: false,
        message: 'No file URLs have been configured. Please add Google Drive links.'
      };
    }
    
    // Test each configured URL
    if (window.googleDriveUtils) {
      for (const [fileName, url] of fileEntries) {
        if (url && url.trim() !== '') {
          const isValid = await window.googleDriveUtils.testGoogleDriveURL(url);
          if (!isValid) {
            return {
              valid: false,
              message: `The URL for ${fileName} is not accessible. Please check sharing permissions.`
            };
          }
        }
      }
    }
    
    return {
      valid: true,
      message: 'Configuration validated successfully!'
    };
  } catch (error) {
    console.error(`Error validating ${dashboardType} dashboard config:`, error);
    return {
      valid: false,
      message: `Error validating configuration: ${error.message}`
    };
  }
};

// Make config manager available globally
window.dashboardConfigManager = {
  DEFAULT_CONFIGS,
  saveDashboardConfig,
  loadDashboardConfig,
  updateDashboardConfig,
  createConfigShareableUrl,
  extractConfigFromUrl,
  validateDashboardConfig
};