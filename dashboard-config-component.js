// Dashboard Configuration Component
// This component provides a UI for configuring Google Drive file links

// Define the component (in browser environment)
const DashboardConfigComponent = ({
  dashboardType,
  onConfigUpdate,
  onConfigSave,
  onConfigTest,
  isVisible = false
}) => {
  // Use React hooks
  const { useState, useEffect } = React;
  
  // Component state
  const [config, setConfig] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load configuration on component mount
  useEffect(() => {
    // Check for config in URL first
    if (window.dashboardConfigManager) {
      const { config: urlConfig, type } = window.dashboardConfigManager.extractConfigFromUrl();
      if (urlConfig && type === dashboardType) {
        // URL config was found, save it and use it
        window.dashboardConfigManager.updateDashboardConfig(dashboardType, urlConfig);
        setConfig(window.dashboardConfigManager.loadDashboardConfig(dashboardType));
        setIsLoading(false);
        
        // Notify parent component
        if (onConfigUpdate) {
          onConfigUpdate(window.dashboardConfigManager.loadDashboardConfig(dashboardType));
        }
        return;
      }
    }
    
    // Otherwise load from localStorage
    if (window.dashboardConfigManager) {
      setConfig(window.dashboardConfigManager.loadDashboardConfig(dashboardType));
    } else {
      // Fallback default config if manager not available
      setConfig({
        refreshInterval: 5,
        files: {},
        lastUpdated: null
      });
    }
    setIsLoading(false);
  }, [dashboardType]);
  
  // Handle file URL updates
  const handleFileUrlChange = (fileName, url) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      files: {
        ...prevConfig.files,
        [fileName]: url
      }
    }));
  };
  
  // Handle refresh interval change
  const handleRefreshIntervalChange = (interval) => {
    // Ensure it's a number and within reasonable bounds (1-60 minutes)
    const numInterval = Math.max(1, Math.min(60, parseInt(interval) || 5));
    
    setConfig(prevConfig => ({
      ...prevConfig,
      refreshInterval: numInterval
    }));
  };
  
  // Save configuration
  const saveConfiguration = () => {
    if (window.dashboardConfigManager && config) {
      window.dashboardConfigManager.saveDashboardConfig(dashboardType, {
        ...config,
        lastUpdated: new Date().toISOString()
      });
      
      // Notify parent component
      if (onConfigSave) {
        onConfigSave(config);
      }
      
      // Exit edit mode
      setIsEditing(false);
      setTestResult(null);
    }
  };
  
  // Test configuration
  const testConfiguration = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Test the configuration using the manager
      if (window.dashboardConfigManager) {
        // Save current config first
        window.dashboardConfigManager.saveDashboardConfig(dashboardType, config);
        
        // Then validate it
        const result = await window.dashboardConfigManager.validateDashboardConfig(dashboardType);
        setTestResult(result);
        
        // If valid and test callback provided, call it
        if (result.valid && onConfigTest) {
          onConfigTest(config);
        }
      }
    } catch (error) {
      console.error('Error testing configuration:', error);
      setTestResult({
        valid: false,
        message: `Error testing configuration: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Share configuration with others
  const shareConfiguration = () => {
    if (window.dashboardConfigManager) {
      try {
        const shareableUrl = window.dashboardConfigManager.createConfigShareableUrl(dashboardType);
        
        // Copy the URL to clipboard
        navigator.clipboard.writeText(shareableUrl)
          .then(() => {
            alert('Configuration link copied to clipboard!');
          })
          .catch(err => {
            console.error('Could not copy to clipboard:', err);
            // Show the URL in a prompt as fallback
            prompt('Copy this configuration link:', shareableUrl);
          });
      } catch (error) {
        console.error('Error creating shareable config link:', error);
        alert('Error creating shareable link');
      }
    }
  };
  
  // If config isn't loaded yet, show loading
  if (isLoading) {
    return (
      <div className={`transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 hidden'}`}>
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-semibold mb-2">Dashboard Configuration</h2>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }
  
  // Render configuration UI
  return (
    <div className={`transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0 hidden'}`}>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Dashboard Configuration</h2>
          {!isEditing ? (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Configuration
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                onClick={saveConfiguration}
              >
                Save
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                onClick={() => {
                  setIsEditing(false);
                  // Reset to saved config
                  if (window.dashboardConfigManager) {
                    setConfig(window.dashboardConfigManager.loadDashboardConfig(dashboardType));
                  }
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        {/* Configuration status */}
        <div className="mb-4 p-3 bg-gray-50 rounded border">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                <span className="font-medium">Status:</span> {config.lastUpdated 
                  ? <span className="text-green-600">Configured</span> 
                  : <span className="text-yellow-600">Not Configured</span>}
              </p>
              {config.lastUpdated && (
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(config.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                onClick={shareConfiguration}
              >
                Share Config
              </button>
              <button
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                onClick={testConfiguration}
                disabled={isTesting}
              >
                {isTesting ? 'Testing...' : 'Test Config'}
              </button>
            </div>
          </div>
          
          {/* Test results */}
          {testResult && (
            <div className={`mt-3 p-2 text-sm rounded ${testResult.valid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {testResult.message}
            </div>
          )}
        </div>
        
        {/* Edit mode - File configuration */}
        {isEditing && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">Google Drive File URLs</h3>
            <p className="text-sm text-gray-500 mb-2">
              Add Google Drive sharing links for each file. Make sure files are set to "Anyone with the link can view".
            </p>
            
            <div className="space-y-3 mt-3">
              {/* Refresh interval setting */}
              <div className="flex items-center">
                <label className="w-60 text-sm font-medium">Refresh Interval (minutes):</label>
                <input
                  type="number"
                  className="border rounded p-1 w-20"
                  value={config.refreshInterval}
                  onChange={(e) => handleRefreshIntervalChange(e.target.value)}
                  min="1"
                  max="60"
                />
              </div>
              
              {/* File URL inputs */}
              <div className="bg-gray-50 p-3 rounded border">
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(config.files).map(([fileName, url]) => (
                    <div key={fileName} className="flex items-center">
                      <label className="w-60 text-sm font-medium">{fileName}:</label>
                      <input
                        type="text"
                        className="border rounded p-1 flex-1"
                        value={url}
                        onChange={(e) => handleFileUrlChange(fileName, e.target.value)}
                        placeholder="Google Drive URL"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Instructions for non-edit mode */}
        {!isEditing && (
          <div>
            <p className="text-sm text-gray-600">
              This dashboard loads data directly from Google Drive. 
              {config.lastUpdated ? 
                ' Your configuration is set up and ready to use.' : 
                ' Click "Edit Configuration" to set up file links.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Make the component available globally
window.DashboardConfigComponent = DashboardConfigComponent;