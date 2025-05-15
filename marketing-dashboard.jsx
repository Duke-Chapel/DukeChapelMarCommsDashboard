// Define hooks at the top
const { useState, useEffect } = React;

// Define component on global scope for browser usage
const MarketingDashboard = () => {
  // State for active dashboard
  const [activeDashboard, setActiveDashboard] = useState('overview');
  
  // Simple navigation component
  const Navigation = () => {
    return (
      <div className="bg-gray-800 text-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <div className="w-full">
              <nav className="flex">
                <button 
                  className={`px-4 py-4 hover:bg-gray-700 ${activeDashboard === 'overview' ? 'bg-gray-700 font-medium' : ''}`}
                  onClick={() => setActiveDashboard('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`px-4 py-4 hover:bg-gray-700 ${activeDashboard === 'web' ? 'bg-gray-700 font-medium' : ''}`}
                  onClick={() => setActiveDashboard('web')}
                >
                  Web Analytics
                </button>
                <button 
                  className={`px-4 py-4 hover:bg-gray-700 ${activeDashboard === 'social' ? 'bg-gray-700 font-medium' : ''}`}
                  onClick={() => setActiveDashboard('social')}
                >
                  Social Media
                </button>
                <button 
                  className={`px-4 py-4 hover:bg-gray-700 ${activeDashboard === 'email' ? 'bg-gray-700 font-medium' : ''}`}
                  onClick={() => setActiveDashboard('email')}
                >
                  Email Campaigns
                </button>
                <button 
                  className={`px-4 py-4 hover:bg-gray-700 ${activeDashboard === 'youtube' ? 'bg-gray-700 font-medium' : ''}`}
                  onClick={() => setActiveDashboard('youtube')}
                >
                  YouTube
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Header component
  const Header = () => {
    return (
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Marketing Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive view of web, social, email, and video performance
          </p>
        </div>
      </header>
    );
  };
  
  // Footer component
  const Footer = () => {
    return (
      <footer className="bg-white shadow-inner mt-8 py-4">
        <div className="container mx-auto px-4">
          <p className="text-gray-600 text-center">
            &copy; {new Date().getFullYear()} Marketing Analytics Dashboard
          </p>
        </div>
      </footer>
    );
  };
  
  // Overview dashboard - shows a summary of all platforms
  const OverviewDashboard = () => {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Quick Analytics Overview</h2>
          <p className="text-gray-600 mb-4">
            Welcome to the Marketing Analytics Dashboard. This tool provides a comprehensive view of your marketing performance across multiple channels.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Web Analytics</h3>
              <p className="text-sm text-gray-600">
                Analyze website traffic sources, user demographics, and page performance.
              </p>
              <button 
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                onClick={() => setActiveDashboard('web')}
              >
                View Dashboard
              </button>
            </div>
            
            <div className="bg-pink-50 p-6 rounded-lg border border-pink-100">
              <h3 className="text-lg font-semibold text-pink-800 mb-3">Social Media</h3>
              <p className="text-sm text-gray-600">
                Track engagement, followers growth, and top-performing posts across platforms.
              </p>
              <button 
                className="mt-4 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded text-sm"
                onClick={() => setActiveDashboard('social')}
              >
                View Dashboard
              </button>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
              <h3 className="text-lg font-semibold text-purple-800 mb-3">Email Campaigns</h3>
              <p className="text-sm text-gray-600">
                Monitor open rates, click-through rates, and subscriber engagement.
              </p>
              <button 
                className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm"
                onClick={() => setActiveDashboard('email')}
              >
                View Dashboard
              </button>
            </div>
            
            <div className="bg-red-50 p-6 rounded-lg border border-red-100">
              <h3 className="text-lg font-semibold text-red-800 mb-3">YouTube Performance</h3>
              <p className="text-sm text-gray-600">
                Analyze video engagement, viewer demographics, and subscription metrics.
              </p>
              <button 
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
                onClick={() => setActiveDashboard('youtube')}
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
          <div className="text-gray-600">
            <p className="mb-4">
              To use this dashboard, follow these steps:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>Download analytics data from each platform (Google Analytics, Facebook, Instagram, Email Provider, YouTube)</li>
              <li>Upload the CSV files to each respective dashboard using the "Upload Data" button</li>
              <li>Use the date range selector to analyze specific time periods</li>
              <li>Enable comparison feature to compare current performance with previous periods</li>
            </ol>
            <p className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded">
              <strong>Note:</strong> This dashboard runs entirely in your browser. Your data is never sent to any server.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the appropriate dashboard based on active selection
  const renderDashboard = () => {
    switch (activeDashboard) {
      case 'web':
        // Get the WebDashboard component from window object
        const WebDashboard = window.WebDashboard?.default;
        return WebDashboard ? <WebDashboard /> : <div>Web dashboard is loading...</div>;
        
      case 'social':
        // Get the SocialDashboard component from window object
        const SocialDashboard = window.SocialDashboard?.default;
        return SocialDashboard ? <SocialDashboard /> : <div>Social dashboard is loading...</div>;
        
      case 'email':
        // Get the EmailDashboard component from window object
        const EmailDashboard = window.EmailDashboard?.default;
        return EmailDashboard ? <EmailDashboard /> : <div>Email dashboard is loading...</div>;
        
      case 'youtube':
        // Get the YouTubeDashboard component from window object
        const YouTubeDashboard = window.YouTubeDashboard?.default;
        return YouTubeDashboard ? <YouTubeDashboard /> : <div>YouTube dashboard is loading...</div>;
        
      case 'overview':
      default:
        return <OverviewDashboard />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <Navigation />
      <main className="flex-grow">
        {renderDashboard()}
      </main>
      <Footer />
    </div>
  );
};

// No export in browser environment - this will be referenced directly