// This is a browser-compatible bridge file that attaches the component to the window object
// File: marketing-dashboard-bridge.jsx

// NOTE: We need to define MarketingDashboard component directly in this file
// since browser-based imports won't work with the standard ES6 module syntax
(function() {
  // We'll assume marketing-dashboard.jsx has been loaded and its exported function is available
  // The component will be manually loaded in the HTML before this script
  
  // Create a reference to the component on the window object
  window.MarketingDashboard = { 
    default: MarketingDashboard 
  };
})();