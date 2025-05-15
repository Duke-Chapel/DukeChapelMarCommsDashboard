// This script handles loading all necessary components in the correct order
(function() {
  // Configure debug mode
  const DEBUG = true;
  
  // Helper function for logging
  function log(message) {
    if (DEBUG) {
      console.log(`[Loader] ${message}`);
    }
  }
  
  // Helper function for logging errors
  function logError(message, error) {
    console.error(`[Loader Error] ${message}`, error);
  }
  
  // Check if a library is loaded
  function isLibraryLoaded(libraryName, globalVar) {
    const loaded = typeof window[globalVar] !== 'undefined';
    log(`${libraryName} loaded: ${loaded}`);
    return loaded;
  }
  
  // Load Recharts components
  function loadRechartsComponents() {
    log("Setting up Recharts components");
    try {
      if (typeof Recharts !== 'undefined') {
        window.LineChart = Recharts.LineChart;
        window.BarChart = Recharts.BarChart;
        window.PieChart = Recharts.PieChart;
        window.Line = Recharts.Line;
        window.Bar = Recharts.Bar;
        window.Pie = Recharts.Pie;
        window.Cell = Recharts.Cell;
        window.XAxis = Recharts.XAxis;
        window.YAxis = Recharts.YAxis;
        window.CartesianGrid = Recharts.CartesianGrid;
        window.Tooltip = Recharts.Tooltip;
        window.Legend = Recharts.Legend;
        window.ResponsiveContainer = Recharts.ResponsiveContainer;
        log("Recharts components extracted successfully");
        return true;
      } else {
        logError("Recharts library not loaded properly!");
        return false;
      }
    } catch (e) {
      logError("Error setting up Recharts components:", e);
      return false;
    }
  }
  
  // Render the marketing dashboard
  function renderDashboard() {
    log("Attempting to render Marketing Dashboard");
    try {
      const MarketingDashboard = window.MarketingDashboard?.default;
      
      if (MarketingDashboard) {
        log("MarketingDashboard component found, rendering...");
        ReactDOM.render(
          React.createElement(MarketingDashboard, null),
          document.getElementById('root')
        );
        log("Dashboard rendered successfully");
        return true;
      } else {
        throw new Error("Marketing Dashboard component not found");
      }
    } catch (error) {
      logError("Error rendering dashboard:", error);
      document.getElementById('root').innerHTML = `
        <div class="p-8 text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
          <p class="mb-4">${error.message}</p>
          <details class="text-left bg-gray-100 p-4 rounded">
            <summary class="cursor-pointer mb-2">Technical Details</summary>
            <pre class="whitespace-pre-wrap text-xs">${error.stack}</pre>
          </details>
        </div>
      `;
      return false;
    }
  }
  
  // Check prerequisites
  function checkPrerequisites() {
    let allLoaded = true;
    
    // Check React
    allLoaded = allLoaded && isLibraryLoaded("React", "React");
    
    // Check ReactDOM
    allLoaded = allLoaded && isLibraryLoaded("ReactDOM", "ReactDOM");
    
    // Check PropTypes
    allLoaded = allLoaded && isLibraryLoaded("PropTypes", "PropTypes");
    
    // Check Recharts
    allLoaded = allLoaded && isLibraryLoaded("Recharts", "Recharts");
    
    // Check Papa Parse
    allLoaded = allLoaded && isLibraryLoaded("Papa Parse", "Papa");
    
    return allLoaded;
  }
  
  // Main initialization function
  function init() {
    log("Starting dashboard initialization");
    
    // Step 1: Check prerequisites
    const prerequisitesLoaded = checkPrerequisites();
    if (!prerequisitesLoaded) {
      logError("Not all prerequisites are loaded. Check console for details.");
      return;
    }
    
    // Step 2: Load Recharts components
    const rechartsLoaded = loadRechartsComponents();
    if (!rechartsLoaded) {
      logError("Failed to load Recharts components.");
      return;
    }
    
    // Step 3: Wait for all dashboard components to be loaded by Babel
    log("Waiting for dashboard components to be loaded by Babel...");
    setTimeout(() => {
      // Step 4: Check if dashboard components are available
      log("Checking dashboard components availability...");
      const isDashboardAvailable = typeof window.MarketingDashboard !== 'undefined';
      log(`MarketingDashboard available: ${isDashboardAvailable}`);
      
      if (isDashboardAvailable) {
        // Step 5: Render the dashboard
        renderDashboard();
      } else {
        logError("Dashboard components not found after waiting.");
        document.getElementById('root').innerHTML = `
          <div class="p-8 text-center">
            <h1 class="text-2xl font-bold text-red-600 mb-4">Loading Error</h1>
            <p class="mb-4">The dashboard components could not be loaded.</p>
            <div class="bg-yellow-50 p-4 rounded border border-yellow-100 mt-4 text-left">
              <h4 class="font-medium text-yellow-800 mb-2">Possible reasons:</h4>
              <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>JS files could not be loaded (check network tab)</li>
                <li>Babel could not transpile the JSX (check console for errors)</li>
                <li>Component bridging failed (check if bridge files are loaded)</li>
              </ul>
            </div>
          </div>
        `;
      }
    }, 2000); // Longer timeout for Babel processing
  }
  
  // Set up initialization when the window is fully loaded
  if (document.readyState === 'complete') {
    init();
  } else {
    window.addEventListener('load', init);
  }
})();