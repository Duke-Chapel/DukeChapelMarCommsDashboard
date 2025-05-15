// This is a browser-compatible bridge file that attaches the component to the window object
// File: marketing-dashboard-bridge.jsx

(function() {
  console.log("Marketing Dashboard Bridge: Running");
  
  // Create a reference to the component on the window object
  if (typeof MarketingDashboard === 'function') {
    console.log("Marketing Dashboard Bridge: Component found");
    window.MarketingDashboard = { 
      default: MarketingDashboard 
    };
    console.log("Marketing Dashboard Bridge: Component attached to window");
  } else {
    console.error("Marketing Dashboard Bridge: Component not found");
  }
})();