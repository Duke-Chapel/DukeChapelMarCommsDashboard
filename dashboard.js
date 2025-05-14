import React, { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart, ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, Pie, Cell } from 'recharts';

const MarketingDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    comparison: {
      enabled: true,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
      endDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    }
  });
  const [data, setData] = useState({
    email: null,
    web: null,
    social: {
      facebook: null,
      instagram: null
    },
    youtube: null
  });
  const [loading, setLoading] = useState(true);

  // Simulated data loading effect
  useEffect(() => {
    // In the real implementation, this would fetch data from the CSV files
    // based on the date range
    setTimeout(() => {
      setData({
        email: generateEmailData(),
        web: generateWebData(),
        social: {
          facebook: generateFacebookData(),
          instagram: generateInstagramData()
        },
        youtube: generateYoutubeData()
      });
      setLoading(false);
    }, 1000);
  }, [dateRange]);

  // Date filter handler
  const handleDateChange = (newDateRange) => {
    setLoading(true);
    setDateRange(newDateRange);
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Sample data generators (in real implementation, these would parse CSV data)
  const generateEmailData = () => ({
    campaigns: [
      { name: 'Monthly Newsletter', openRate: 28.4, clickRate: 5.7, sent: 5200, opens: 1476, clicks: 296 },
      { name: 'Product Launch', openRate: 32.6, clickRate: 9.2, sent: 4800, opens: 1564, clicks: 442 },
      { name: 'Event Invitation', openRate: 41.9, clickRate: 12.5, sent: 3000, opens: 1257, clicks: 375 },
      { name: 'Holiday Special', openRate: 25.8, clickRate: 8.3, sent: 6500, opens: 1677, clicks: 539 },
      { name: 'Customer Survey', openRate: 19.2, clickRate: 3.1, sent: 7800, opens: 1497, clicks: 242 }
    ],
    demographics: {
      age: [
        { name: '18-24', value: 12 },
        { name: '25-34', value: 28 },
        { name: '35-44', value: 24 },
        { name: '45-54', value: 19 },
        { name: '55+', value: 17 }
      ],
      gender: [
        { name: 'Female', value: 54 },
        { name: 'Male', value: 44 },
        { name: 'Other', value: 2 }
      ],
      location: [
        { name: 'United States', value: 71 },
        { name: 'Canada', value: 8 },
        { name: 'United Kingdom', value: 7 },
        { name: 'Australia', value: 4 },
        { name: 'Germany', value: 3 },
        { name: 'Others', value: 7 }
      ]
    },
    metrics: {
      subscriberCount: 24863,
      subscriberGrowth: 2.7,
      notOpened: 38,
      openedNotClicked: 45,
      clicked: 17
    },
    links: [
      { name: 'Event Registration', clicks: 325, clickRate: 8.2, campaign: 'Event Invitation' },
      { name: 'Product Page', clicks: 287, clickRate: 6.5, campaign: 'Product Launch' },
      { name: 'Feedback Form', clicks: 210, clickRate: 2.7, campaign: 'Customer Survey' },
      { name: 'Special Offer', clicks: 198, clickRate: 3.0, campaign: 'Holiday Special' },
      { name: 'Blog Article', clicks: 177, clickRate: 3.4, campaign: 'Monthly Newsletter' }
    ]
  });

  const generateWebData = () => ({
    demographics: {
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
      regions: [
        { name: 'Northeast', value: 32 },
        { name: 'Southeast', value: 28 },
        { name: 'West', value: 22 },
        { name: 'Midwest', value: 15 },
        { name: 'International', value: 3 }
      ]
    },
    trafficSources: [
      { name: 'Organic Search', value: 42 },
      { name: 'Direct', value: 25 },
      { name: 'Social', value: 18 },
      { name: 'Referral', value: 10 },
      { name: 'Email', value: 5 }
    ],
    campaigns: [
      { name: 'Fall Fundraiser', sessions: 4200, engagementRate: 3.2, change: 12.5 },
      { name: 'Holiday Service', sessions: 3800, engagementRate: 2.8, change: 8.7 },
      { name: 'Community Events', sessions: 2900, engagementRate: 4.1, change: -5.3 },
      { name: 'Worship Schedule', sessions: 2500, engagementRate: 2.2, change: 3.1 },
      { name: 'Virtual Services', sessions: 1800, engagementRate: 6.7, change: -2.8 }
    ],
    topPages: [
      { page: 'Home', sessions: 12500, engagementTime: 125, bounceRate: 42 },
      { page: 'Events', sessions: 8700, engagementTime: 187, bounceRate: 38 },
      { page: 'About', sessions: 6300, engagementTime: 142, bounceRate: 51 },
      { page: 'Donate', sessions: 4200, engagementTime: 215, bounceRate: 32 },
      { page: 'Services', sessions: 3900, engagementTime: 165, bounceRate: 45 }
    ]
  });

  const generateFacebookData = () => ({
    demographics: [
      { name: 'F, 25-34', value: 22 },
      { name: 'M, 25-34', value: 18 },
      { name: 'F, 35-44', value: 16 },
      { name: 'M, 35-44', value: 15 },
      { name: 'F, 45-54', value: 12 },
      { name: 'M, 45-54', value: 10 },
      { name: 'Other', value: 7 }
    ],
    pageRank: {
      engagement: 6.4,
      followers: 12850,
      views: 7645,
      reach: 32500
    },
    followerGrowth: [
      { date: '2022-01', followers: 11200 },
      { date: '2022-02', followers: 11500 },
      { date: '2022-03', followers: 12100 },
      { date: '2022-04', followers: 12300 },
      { date: '2022-05', followers: 12600 },
      { date: '2022-06', followers: 12850 }
    ],
    topVideos: [
      { title: 'Chapel Tour', views: 4200, reactions: 320, comments: 78, shares: 145, avgViewTime: 65 },
      { title: 'Easter Service', views: 3800, reactions: 290, comments: 62, shares: 127, avgViewTime: 82 },
      { title: 'Community Outreach', views: 3100, reactions: 245, comments: 53, shares: 112, avgViewTime: 73 },
      { title: 'Holiday Concert', views: 2700, reactions: 210, comments: 48, shares: 98, avgViewTime: 68 },
      { title: 'Youth Program', views: 2200, reactions: 175, comments: 41, shares: 85, avgViewTime: 57 }
    ]
  });

  const generateInstagramData = () => ({
    engagement: [
      { name: 'Likes', value: 15600 },
      { name: 'Comments', value: 2450 },
      { name: 'Shares', value: 3200 },
      { name: 'Saves', value: 1800 }
    ],
    pageRank: {
      engagement: 8.2,
      followers: 8750,
      views: 10235,
      reach: 27800
    },
    followerGrowth: [
      { date: '2022-01', followers: 7200 },
      { date: '2022-02', followers: 7600 },
      { date: '2022-03', followers: 7900 },
      { date: '2022-04', followers: 8200 },
      { date: '2022-05', followers: 8500 },
      { date: '2022-06', followers: 8750 }
    ],
    topPosts: [
      { description: 'Chapel interior renovation complete!', reach: 6800, likes: 520, comments: 87, shares: 142, saves: 76 },
      { description: 'Community service day highlights', reach: 5900, likes: 480, comments: 72, shares: 126, saves: 65 },
      { description: 'Youth choir performance', reach: 4800, likes: 420, comments: 58, shares: 104, saves: 54 },
      { description: 'Historic chapel architecture', reach: 4200, likes: 375, comments: 43, shares: 98, saves: 82 },
      { description: 'Sunrise Easter service', reach: 3900, likes: 340, comments: 39, shares: 87, saves: 48 }
    ]
  });

  const generateYoutubeData = () => ({
    ageData: [
      { age: '18-24', views: 14 },
      { age: '25-34', views: 28 },
      { age: '35-44', views: 24 },
      { age: '45-54', views: 18 },
      { age: '55-64', views: 10 },
      { age: '65+', views: 6 }
    ],
    genderData: [
      { gender: 'Female', views: 58 },
      { gender: 'Male', views: 41 },
      { gender: 'Unknown', views: 1 }
    ],
    subscriptionData: [
      { status: 'Subscribed', views: 62, watchHours: 320 },
      { status: 'Not Subscribed', views: 38, watchHours: 145 }
    ],
    topCountries: [
      { country: 'United States', views: 72 },
      { country: 'Canada', views: 9 },
      { country: 'United Kingdom', views: 6 },
      { country: 'Australia', views: 4 },
      { country: 'Germany', views: 3 },
      { country: 'Others', views: 6 }
    ],
    pageRank: {
      engagement: 7.5,
      followers: 4250,
      views: 15800,
      reach: 37600
    },
    topVideos: [
      { title: 'Chapel History Documentary', views: 5600, likes: 420, comments: 93, shares: 187 },
      { title: 'Christmas Eve Service', views: 4800, likes: 375, comments: 82, shares: 156 },
      { title: 'Worship Music Compilation', views: 4200, likes: 340, comments: 68, shares: 132 },
      { title: 'Community Outreach Highlights', views: 3900, likes: 310, comments: 54, shares: 118 },
      { title: 'Chapel Restoration Project', views: 3500, likes: 280, comments: 47, shares: 103 }
    ]
  });

  // Colors for charts
  const COLORS = ['#4299e1', '#38b2ac', '#f6ad55', '#fc8181', '#9f7aea', '#68d391', '#f687b3'];

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  // Format number for display
  const formatNumber = (num, type = 'number') => {
    if (num === undefined || num === null) return '--';
    
    if (type === 'percent') {
      return num.toFixed(1) + '%';
    } else if (type === 'duration') {
      const minutes = Math.floor(num / 60);
      const seconds = Math.floor(num % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
      }
      return num.toFixed(0);
    }
  };

  // Create KPI card component
  const KpiCard = ({ title, value, change = null, type = 'number' }) => {
    const isPositive = change > 0;
    const changeClass = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-gray-500 text-sm font-medium">{title}</div>
        <div className="text-2xl font-bold mt-2">{formatNumber(value, type)}</div>
        {change !== null && (
          <div className={`text-sm mt-1 ${changeClass} flex items-center`}>
            {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
    );
  };

  // Date filter component
  const DateFilter = () => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-semibold mb-2">Date Range</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Period</label>
            <div className="flex space-x-2">
              <input type="date" className="border rounded p-1 text-sm" 
                value="2022-02-01" /> 
              <span className="flex items-center">to</span>
              <input type="date" className="border rounded p-1 text-sm" 
                value="2022-03-01" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comparison Period</label>
            <div className="flex space-x-2">
              <input type="date" className="border rounded p-1 text-sm" 
                value="2022-01-01" /> 
              <span className="flex items-center">to</span>
              <input type="date" className="border rounded p-1 text-sm" 
                value="2022-02-01" />
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm">
            Apply Filter
          </button>
        </div>
      </div>
    );
  };

  // Tab navigation component
  const TabNavigation = () => {
    const tabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'web', label: 'Web Analytics' },
      { id: 'social', label: 'Social Media' },
      { id: 'email', label: 'Email' },
      { id: 'youtube', label: 'YouTube' }
    ];
    
    return (
      <div className="flex border-b mb-4">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 font-medium ${activeTab === tab.id ? 
              'border-b-2 border-blue-500 text-blue-600' : 
              'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  };

  // Section for Social Media tabs
  const SocialMediaTabs = () => {
    const [socialTab, setSocialTab] = useState('facebook');
    
    return (
      <div>
        <div className="flex mb-4">
          <button 
            onClick={() => setSocialTab('facebook')}
            className={`mr-4 px-3 py-1 rounded ${socialTab === 'facebook' ? 
              'bg-blue-500 text-white' : 
              'bg-gray-200 text-gray-700'}`}
          >
            Facebook
          </button>
          <button 
            onClick={() => setSocialTab('instagram')}
            className={`px-3 py-1 rounded ${socialTab === 'instagram' ? 
              'bg-purple-500 text-white' : 
              'bg-gray-200 text-gray-700'}`}
          >
            Instagram
          </button>
        </div>
        
        {socialTab === 'facebook' ? (
          <FacebookContent data={data.social.facebook} />
        ) : (
          <InstagramContent data={data.social.instagram} />
        )}
      </div>
    );
  };

  // Facebook content component
  const FacebookContent = ({ data }) => {
    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard title="Page Rank" value={data.pageRank.engagement} type="percent" />
          <KpiCard title="Total Followers" value={data.pageRank.followers} />
          <KpiCard title="Profile Views" value={data.pageRank.views} />
          <KpiCard title="Total Reach" value={data.pageRank.reach} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Facebook Audience Demographics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={data.demographics}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value) => [`${value}%`, 'Audience']} />
                <Bar dataKey="value" fill="#4c51bf" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Facebook Follower Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.followerGrowth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="#4c51bf" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top Facebook Videos</h3>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Video Title</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Reactions</th>
                <th className="text-right py-2">Comments</th>
                <th className="text-right py-2">Shares</th>
                <th className="text-right py-2">Avg View Time</th>
              </tr>
            </thead>
            <tbody>
              {data.topVideos.map((video, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2">{video.title}</td>
                  <td className="text-right py-2">{formatNumber(video.views)}</td>
                  <td className="text-right py-2">{formatNumber(video.reactions)}</td>
                  <td className="text-right py-2">{formatNumber(video.comments)}</td>
                  <td className="text-right py-2">{formatNumber(video.shares)}</td>
                  <td className="text-right py-2">{formatNumber(video.avgViewTime, 'duration')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Instagram content component
  const InstagramContent = ({ data }) => {
    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard title="Page Rank" value={data.pageRank.engagement} type="percent" />
          <KpiCard title="Total Followers" value={data.pageRank.followers} />
          <KpiCard title="Profile Views" value={data.pageRank.views} />
          <KpiCard title="Total Reach" value={data.pageRank.reach} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Instagram Engagement Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.engagement}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {data.engagement.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Instagram Follower Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={data.followerGrowth}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="followers" stroke="#ed64a6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top Instagram Posts</h3>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Post Description</th>
                <th className="text-right py-2">Reach</th>
                <th className="text-right py-2">Likes</th>
                <th className="text-right py-2">Comments</th>
                <th className="text-right py-2">Shares</th>
                <th className="text-right py-2">Saves</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts.map((post, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2">{post.description.length > 30 ? post.description.substring(0, 30) + '...' : post.description}</td>
                  <td className="text-right py-2">{formatNumber(post.reach)}</td>
                  <td className="text-right py-2">{formatNumber(post.likes)}</td>
                  <td className="text-right py-2">{formatNumber(post.comments)}</td>
                  <td className="text-right py-2">{formatNumber(post.shares)}</td>
                  <td className="text-right py-2">{formatNumber(post.saves)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Email content component
  const EmailContent = ({ data }) => {
    return (
      <>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <KpiCard title="Subscribers" value={data.metrics.subscriberCount} change={data.metrics.subscriberGrowth} />
          <KpiCard title="Avg. Open Rate" value={28.5} type="percent" />
          <KpiCard title="Avg. Click Rate" value={7.8} type="percent" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Email Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.campaigns}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="openRate" name="Open Rate (%)" fill="#4299e1" />
                <Bar dataKey="clickRate" name="Click Rate (%)" fill="#9f7aea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Email Engagement Segmentation</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Not Opened', value: data.metrics.notOpened },
                    { name: 'Opened (No Click)', value: data.metrics.openedNotClicked },
                    { name: 'Clicked', value: data.metrics.clicked }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#fc8181" />
                  <Cell fill="#f6ad55" />
                  <Cell fill="#68d391" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Subscribers by Age</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.age}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.demographics.age.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Subscribers by Gender</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.gender}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  <Cell fill="#4c51bf" />
                  <Cell fill="#ed64a6" />
                  <Cell fill="#ecc94b" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Subscribers by Location</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.location}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.demographics.location.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Best Performing Links</h3>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Link</th>
                  <th className="text-right py-2">Clicks</th>
                  <th className="text-right py-2">Click Rate</th>
                  <th className="text-left py-2">Campaign</th>
                </tr>
              </thead>
              <tbody>
                {data.links.map((link, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2">{link.name}</td>
                    <td className="text-right py-2">{formatNumber(link.clicks)}</td>
                    <td className="text-right py-2">{formatNumber(link.clickRate, 'percent')}</td>
                    <td className="py-2">{link.campaign}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // Web Analytics content component
  const WebAnalyticsContent = ({ data }) => {
    return (
      <>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Countries</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.countries}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.demographics.countries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Languages</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.languages}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.demographics.languages.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Regions</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.demographics.regions}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {data.demographics.regions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.trafficSources}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {data.trafficSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Campaign Performance</h3>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Campaign</th>
                  <th className="text-right py-2">Sessions</th>
                  <th className="text-right py-2">Engagement Rate</th>
                  <th className="text-right py-2">Change</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.map((campaign, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2">{campaign.name}</td>
                    <td className="text-right py-2">{formatNumber(campaign.sessions)}</td>
                    <td className="text-right py-2">{formatNumber(campaign.engagementRate, 'percent')}</td>
                    <td className={`text-right py-2 ${campaign.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {campaign.change >= 0 ? '↑' : '↓'} {Math.abs(campaign.change).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Top Landing Pages</h3>
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2">Page</th>
                  <th className="text-right py-2">Sessions</th>
                  <th className="text-right py-2">Engagement Time (sec)</th>
                  <th className="text-right py-2">Bounce Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((page, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2">{page.page}</td>
                    <td className="text-right py-2">{formatNumber(page.sessions)}</td>
                    <td className="text-right py-2">{page.engagementTime}</td>
                    <td className="text-right py-2">{formatNumber(page.bounceRate, 'percent')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  // YouTube content component
  const YouTubeContent = ({ data }) => {
    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard title="Page Rank" value={data.pageRank.engagement} type="percent" />
          <KpiCard title="Subscribers" value={data.pageRank.followers} />
          <KpiCard title="Views" value={data.pageRank.views} />
          <KpiCard title="Reach" value={data.pageRank.reach} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Age Demographics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.ageData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Views']} />
                <Bar dataKey="views" fill="#4c51bf" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="views"
                  nameKey="gender"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#4c51bf" />
                  <Cell fill="#ed64a6" />
                  <Cell fill="#ecc94b" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Subscriber vs. Non-Subscriber Views</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.subscriptionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                  fill="#8884d8"
                  dataKey="views"
                  nameKey="status"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  <Cell fill="#48bb78" />
                  <Cell fill="#4299e1" />
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Top Countries by Views</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                layout="vertical"
                data={data.topCountries}
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="country" type="category" />
                <Tooltip formatter={(value) => [`${value}%`, 'Views']} />
                <Bar dataKey="views" fill="#4c51bf" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4">Top YouTube Videos</h3>
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2">Video Title</th>
                <th className="text-right py-2">Views</th>
                <th className="text-right py-2">Likes</th>
                <th className="text-right py-2">Comments</th>
                <th className="text-right py-2">Shares</th>
              </tr>
            </thead>
            <tbody>
              {data.topVideos.map((video, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2">{video.title}</td>
                  <td className="text-right py-2">{formatNumber(video.views)}</td>
                  <td className="text-right py-2">{formatNumber(video.likes)}</td>
                  <td className="text-right py-2">{formatNumber(video.comments)}</td>
                  <td className="text-right py-2">{formatNumber(video.shares)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Overview dashboard content
  const OverviewContent = () => {
    const emailData = data.email;
    const fbData = data.social.facebook;
    const igData = data.social.instagram;
    const ytData = data.youtube;
    
    return (
      <>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KpiCard title="Email Subscribers" value={emailData.metrics.subscriberCount} change={emailData.metrics.subscriberGrowth} />
          <KpiCard title="Facebook Reach" value={fbData.pageRank.reach} />
          <KpiCard title="Instagram Engagement" value={igData.pageRank.engagement} type="percent" />
          <KpiCard title="YouTube Views" value={ytData.pageRank.views} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Channel Traffic Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Email Opens', value: emailData.metrics.subscriberCount * 0.285 },
                  { name: 'Facebook Reach', value: fbData.pageRank.reach },
                  { name: 'Instagram Reach', value: igData.pageRank.reach },
                  { name: 'YouTube Views', value: ytData.pageRank.views }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatNumber(value)} />
                <Bar dataKey="value" fill="#4299e1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold mb-4">Engagement by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: 'Email', value: 7.8 },
                  { name: 'Facebook', value: fbData.pageRank.engagement },
                  { name: 'Instagram', value: igData.pageRank.engagement },
                  { name: 'YouTube', value: ytData.pageRank.engagement }
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="value" name="Engagement Rate (%)" fill="#9f7aea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white shadow-sm p-4 border-b">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Marketing Analytics Dashboard</h1>
          <p className="text-gray-600 text-sm">Last updated: {new Date().toLocaleString()}</p>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <DateFilter />
        
        <TabNavigation />
        
        <div className="mt-4">
          {activeTab === 'overview' && (
            <OverviewContent />
          )}
          
          {activeTab === 'web' && (
            <WebAnalyticsContent data={data.web} />
          )}
          
          {activeTab === 'social' && (
            <SocialMediaTabs />
          )}
          
          {activeTab === 'email' && (
            <EmailContent data={data.email} />
          )}
          
          {activeTab === 'youtube' && (
            <YouTubeContent data={data.youtube} />
          )}
        </div>
      </main>
      
      <footer className="bg-white border-t p-4 mt-8">
        <div className="container mx-auto text-center text-gray-600 text-sm">
          Marketing Analytics Dashboard &copy; 2025. All data is refreshed when you upload new CSV files.
        </div>
      </footer>
    </div>
  );
};

export default MarketingDashboard;