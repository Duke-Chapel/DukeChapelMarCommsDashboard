// MarketingDashboard.jsx
(function() {
  const {
    React,
    ReactDOM
  } = window;

  const { useState } = React;

  const MarketingDashboard = () => {
    const [activeTab, setActiveTab] = useState('email');
    
    // Get Dashboard component based on active tab
    const getDashboardComponent = () => {
      switch (activeTab) {
        case 'email':
          return window.EmailDashboard?.default ? 
            React.createElement(window.EmailDashboard.default) : 
            <div className="p-8 text-center">
              <p className="text-gray-500">Email Dashboard component not loaded</p>
              <p className="mt-2 text-sm text-gray-400">Please ensure EmailDashboard.jsx is properly loaded</p>
            </div>;
          
        case 'social':
          return window.SocialDashboard?.default ? 
            React.createElement(window.SocialDashboard.default) : 
            <div className="p-8 text-center">
              <p className="text-gray-500">Social Dashboard component not loaded</p>
              <p className="mt-2 text-sm text-gray-400">Please ensure SocialDashboard.jsx is properly loaded</p>
            </div>;
          
        case 'youtube':
          return window.YouTubeDashboard?.default ? 
            React.createElement(window.YouTubeDashboard.default) : 
            <div className="p-8 text-center">
              <p className="text-gray-500">YouTube Dashboard component not loaded</p>
              <p className="mt-2 text-sm text-gray-400">Please ensure YouTubeDashboard.jsx is properly loaded</p>
            </div>;
          
        case 'web':
          return window.WebDashboard?.default ? 
            React.createElement(window.WebDashboard.default) : 
            <div className="p-8 text-center">
              <p className="text-gray-500">Web Dashboard component not loaded</p>
              <p className="mt-2 text-sm text-gray-400">Please ensure WebDashboard.jsx is properly loaded</p>
            </div>;
          
        default:
          return <div>Select a dashboard</div>;
      }
    };

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-2xl font-bold text-gray-900">Marketing Analytics Dashboard</h1>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                className={`py-4 px-1 ${
                  activeTab === 'email'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('email')}
              >
                Email
              </button>
              <button
                className={`py-4 px-1 ${
                  activeTab === 'social'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('social')}
              >
                Social Media
              </button>
              <button
                className={`py-4 px-1 ${
                  activeTab === 'youtube'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('youtube')}
              >
                YouTube
              </button>
              <button
                className={`py-4 px-1 ${
                  activeTab === 'web'
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('web')}
              >
                Web Analytics
              </button>
            </nav>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {getDashboardComponent()}
        </main>
        
        {/* Footer */}
        <footer className="bg-white py-4 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              Marketing Analytics Dashboard © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    );
  };

  // Export the component
  window.MarketingDashboard = { default: MarketingDashboard };
})();