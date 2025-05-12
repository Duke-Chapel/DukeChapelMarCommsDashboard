import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, RadarChart, Radar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell, RadialBar, RadialBarChart, ScatterChart, Scatter,
  ComposedChart
} from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

const MarketingDashboard = () => {
  // State for all datasets
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSocialTab, setActiveSocialTab] = useState('facebook');
  
  // Data states
  const [emailData, setEmailData] = useState(null);
  const [fbVideosData, setFbVideosData] = useState(null);
  const [fbPostsData, setFbPostsData] = useState(null);
  const [igPostsData, setIgPostsData] = useState(null);
  const [youtubeAgeData, setYoutubeAgeData] = useState(null);
  const [youtubeGenderData, setYoutubeGenderData] = useState(null);
  const [youtubeGeographyData, setYoutubeGeographyData] = useState(null);
  const [youtubeSubscriptionData, setYoutubeSubscriptionData] = useState(null);
  const [gaDemographicsData, setGaDemographicsData] = useState(null);
  const [gaPagesData, setGaPagesData] = useState(null);
  const [gaTrafficData, setGaTrafficData] = useState(null);
  const [gaUtmsData, setGaUtmsData] = useState(null);
  
  // Format number utility
  const formatNumber = (num) => {
    if (!num && num !== 0) return '--';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Function to load all CSV files
  useEffect(() => {
    const loadAllData = async () => {
      setIsLoading(true);
      const newErrors = {};
      
      // Define the file mapping
      const fileMapping = [
        { file: 'Email_Campaign_Performance.csv', setter: setEmailData },
        { file: 'FB_Videos.csv', setter: setFbVideosData },
        { file: 'FB_Posts.csv', setter: setFbPostsData },
        { file: 'IG_Posts.csv', setter: setIgPostsData },
        { file: 'YouTube_Age.csv', setter: setYoutubeAgeData },
        { file: 'YouTube_Gender.csv', setter: setYoutubeGenderData },
        { file: 'YouTube_Geography.csv', setter: setYoutubeGeographyData },
        { file: 'YouTube_Subscription_Status.csv', setter: setYoutubeSubscriptionData },
        { file: 'GA_Demographics.csv', setter: setGaDemographicsData },
        { file: 'GA_Pages_And_Screens.csv', setter: setGaPagesData },
        { file: 'GA_Traffic_Acquisition.csv', setter: setGaTrafficData },
        { file: 'GA_UTMs.csv', setter: setGaUtmsData }
      ];

      // Load all files in parallel
      await Promise.all(fileMapping.map(async ({ file, setter }) => {
        try {
          const fileData = await window.fs.readFile(file, { encoding: 'utf8' });
          
          if (!fileData) {
            newErrors[file] = `No data found in ${file}`;
            setter(null);
            return;
          }
          
          // Parse CSV data
          Papa.parse(fileData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                setter(results.data);
              } else {
                newErrors[file] = `No valid data found in ${file}`;
                setter(null);
              }
            },
            error: (error) => {
              newErrors[file] = `Error parsing ${file}: ${error.message}`;
              setter(null);
            }
          });
        } catch (error) {
          newErrors[file] = `Error loading ${file}: ${error.message}`;
          setter(null);
        }
      }));
      
      setErrors(newErrors);
      setIsLoading(false);
    };
    
    loadAllData();
  }, []);
  
  // Calculate total YouTube views from geography data
  const totalYoutubeViews = youtubeGeographyData ? 
    youtubeGeographyData.reduce((sum, item) => sum + (item.Views || 0), 0) : 0;

  // Calculate email subscribers from email campaign data
  const emailRecipients = emailData && emailData.length > 0 ? 
    Math.max(...emailData.map(campaign => parseInt(campaign['Emails sent'] || 0))) : 0;
  
  // Get total Facebook video views
  const totalFbVideoViews = fbVideosData ? 
    fbVideosData.reduce((sum, video) => sum + (video['3-second video views'] || 0), 0) : 0;

  // Get user engagement metrics for overview section
  const getOverviewData = () => {
    return (
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Cross-Channel Performance</h3>
            <div className="row">
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="p-3 border rounded h-full">
                  <h5 className="text-gray-700 text-sm font-semibold mb-2">Website Visitors</h5>
                  <div className="text-2xl font-bold">
                    {gaTrafficData ? formatNumber(gaTrafficData.reduce((sum, item) => sum + (item.Users || 0), 0)) : '--'}
                  </div>
                  {errors['GA_Traffic_Acquisition.csv'] && 
                    <div className="text-red-500 text-xs">Error loading data</div>
                  }
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="p-3 border rounded h-full">
                  <h5 className="text-gray-700 text-sm font-semibold mb-2">Email Subscribers</h5>
                  <div className="text-2xl font-bold">{formatNumber(emailRecipients)}</div>
                  {errors['Email_Campaign_Performance.csv'] && 
                    <div className="text-red-500 text-xs">Error loading data</div>
                  }
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="p-3 border rounded h-full">
                  <h5 className="text-gray-700 text-sm font-semibold mb-2">FB Video Views</h5>
                  <div className="text-2xl font-bold">{formatNumber(totalFbVideoViews)}</div>
                  {errors['FB_Videos.csv'] && 
                    <div className="text-red-500 text-xs">Error loading data</div>
                  }
                </div>
              </div>
              <div className="col-md-3 col-sm-6 mb-4">
                <div className="p-3 border rounded h-full">
                  <h5 className="text-gray-700 text-sm font-semibold mb-2">YouTube Views</h5>
                  <div className="text-2xl font-bold">{formatNumber(totalYoutubeViews)}</div>
                  {errors['YouTube_Geography.csv'] && 
                    <div className="text-red-500 text-xs">Error loading data</div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* YouTube Demographics */}
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm h-full">
            <h3 className="text-lg font-semibold mb-3">YouTube Demographics</h3>
            {youtubeAgeData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={youtubeAgeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Viewer age" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}%`, 'Views']} />
                  <Legend />
                  <Bar dataKey="Views (%)" fill="#4e73df" name="Views %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                {errors['YouTube_Age.csv'] ? 
                  <div className="text-red-500">Error loading YouTube Age data</div> : 
                  <div className="text-gray-500">Loading...</div>
                }
              </div>
            )}
          </div>
        </div>
        
        {/* Email Performance */}
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm h-full">
            <h3 className="text-lg font-semibold mb-3">Email Performance</h3>
            {emailData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={emailData
                    .sort((a, b) => {
                      const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
                      const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
                      return openRateB - openRateA;
                    })
                    .slice(0, 5)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="Campaign" tickFormatter={(value) => value?.substring(0, 15) + '...'} />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Rate']} />
                  <Legend />
                  <Bar 
                    dataKey="Email open rate (MPP excluded)" 
                    fill="#4e73df" 
                    name="Open Rate" 
                    formatter={(value) => `${(parseFloat(value) * 100).toFixed(2)}%`}
                  />
                  <Bar 
                    dataKey="Email click rate" 
                    fill="#1cc88a" 
                    name="Click Rate"
                    formatter={(value) => `${(parseFloat(value) * 100).toFixed(2)}%`}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                {errors['Email_Campaign_Performance.csv'] ? 
                  <div className="text-red-500">Error loading Email data</div> : 
                  <div className="text-gray-500">Loading...</div>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Email Tab Content
  const getEmailContent = () => {
    if (!emailData) {
      return (
        <div className="p-4 bg-white rounded shadow-sm">
          {errors['Email_Campaign_Performance.csv'] ? 
            <div className="text-red-500">Error loading Email data: {errors['Email_Campaign_Performance.csv']}</div> : 
            <div className="text-gray-500">Loading Email data...</div>
          }
        </div>
      );
    }

    // Process email data for charts
    const sortedByOpenRate = [...emailData].sort((a, b) => {
      const openRateA = parseFloat(a['Email open rate (MPP excluded)'] || 0);
      const openRateB = parseFloat(b['Email open rate (MPP excluded)'] || 0);
      return openRateB - openRateA;
    });
    
    const topCampaigns = sortedByOpenRate.slice(0, 10);
    
    // Calculate engagement segments
    let notOpened = 0;
    let openedNotClicked = 0;
    let clicked = 0;
    
    emailData.forEach(campaign => {
      const sent = parseInt(campaign['Emails sent'] || 0);
      const opened = parseInt(campaign['Email opened (MPP excluded)'] || 0);
      const clickedCount = parseInt(campaign['Email clicked'] || 0);
      
      notOpened += (sent - opened);
      openedNotClicked += (opened - clickedCount);
      clicked += clickedCount;
    });
    
    const total = notOpened + openedNotClicked + clicked;
    const engagementData = [
      { name: 'Not Opened', value: notOpened, percentage: (notOpened / total * 100).toFixed(1) },
      { name: 'Opened (No Click)', value: openedNotClicked, percentage: (openedNotClicked / total * 100).toFixed(1) },
      { name: 'Clicked', value: clicked, percentage: (clicked / total * 100).toFixed(1) }
    ];
    
    const colors = ['#e74a3b', '#f6c23e', '#1cc88a'];
    
    return (
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Email Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCampaigns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Campaign" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  interval={0}
                  tickFormatter={(value) => value?.substring(0, 20) + '...'}
                />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip 
                  formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Rate']} 
                  labelFormatter={(label) => label}
                />
                <Legend />
                <Bar 
                  dataKey="Email open rate (MPP excluded)" 
                  fill="#4e73df" 
                  name="Open Rate" 
                />
                <Bar 
                  dataKey="Email click rate" 
                  fill="#1cc88a" 
                  name="Click Rate" 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Email Engagement Segmentation</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={engagementData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  fill="#8884d8"
                  label={({name, percentage}) => `${name}: ${percentage}%`}
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${formatNumber(value)} emails`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-md-12 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Top Email Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Campaign</th>
                    <th className="p-2 text-left">Open Rate</th>
                    <th className="p-2 text-left">Click Rate</th>
                    <th className="p-2 text-left">Deliveries</th>
                    <th className="p-2 text-left">Unsubscribe Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((campaign, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{campaign.Campaign}</td>
                      <td className="p-2">{campaign['Email open rate (MPP excluded)']}</td>
                      <td className="p-2">{campaign['Email click rate']}</td>
                      <td className="p-2">{formatNumber(campaign['Email deliveries'])}</td>
                      <td className="p-2">{campaign['Email unsubscribe rate']}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // YouTube Tab Content
  const getYouTubeContent = () => {
    if (!youtubeAgeData || !youtubeGenderData || !youtubeGeographyData || !youtubeSubscriptionData) {
      return (
        <div className="p-4 bg-white rounded shadow-sm">
          {Object.keys(errors).filter(key => key.includes('YouTube')).length > 0 ? 
            <div className="text-red-500">
              Error loading YouTube data:
              <ul>
                {Object.keys(errors).filter(key => key.includes('YouTube')).map(key => (
                  <li key={key}>{key}: {errors[key]}</li>
                ))}
              </ul>
            </div> : 
            <div className="text-gray-500">Loading YouTube data...</div>
          }
        </div>
      );
    }

    // Process YouTube geography data
    const topCountries = [...youtubeGeographyData]
      .sort((a, b) => (b.Views || 0) - (a.Views || 0))
      .slice(0, 10);
    
    return (
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">YouTube Demographics</h3>
            <div className="row">
              <div className="col-md-6">
                <h4 className="text-md font-semibold mb-2">Age Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={youtubeAgeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="Viewer age" />
                    <YAxis tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Views']} />
                    <Bar dataKey="Views (%)" fill="#1cc88a" name="Views %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="col-md-6">
                <h4 className="text-md font-semibold mb-2">Gender Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={youtubeGenderData}
                      dataKey="Views (%)"
                      nameKey="Viewer gender"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({name, value}) => `${name}: ${value}%`}
                    >
                      {youtubeGenderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#4e73df' : index === 1 ? '#e74a3b' : '#f6c23e'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Views']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Subscriber Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={youtubeSubscriptionData}
                  dataKey="Views"
                  nameKey="Subscription status"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={60}
                  fill="#8884d8"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {youtubeSubscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1cc88a' : index === 1 ? '#4e73df' : '#f6c23e'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), 'Views']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-md-12 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Top Countries by Views</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCountries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="Geography" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip formatter={(value) => [formatNumber(value), 'Views']} />
                <Legend />
                <Bar dataKey="Views" fill="#4e73df" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Facebook Tab Content
  const getFacebookContent = () => {
    if (!fbVideosData || !fbPostsData) {
      return (
        <div className="p-4 bg-white rounded shadow-sm">
          {Object.keys(errors).filter(key => key.includes('FB_')).length > 0 ? 
            <div className="text-red-500">
              Error loading Facebook data:
              <ul>
                {Object.keys(errors).filter(key => key.includes('FB_')).map(key => (
                  <li key={key}>{key}: {errors[key]}</li>
                ))}
              </ul>
            </div> : 
            <div className="text-gray-500">Loading Facebook data...</div>
          }
        </div>
      );
    }

    // Process Facebook videos data
    const topVideos = [...fbVideosData]
      .sort((a, b) => (b['3-second video views'] || 0) - (a['3-second video views'] || 0))
      .slice(0, 5);
    
    return (
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Top Facebook Video Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Video Title</th>
                    <th className="p-2 text-left">Views</th>
                    <th className="p-2 text-left">Reactions</th>
                    <th className="p-2 text-left">Comments</th>
                    <th className="p-2 text-left">Shares</th>
                    <th className="p-2 text-left">Avg View Time</th>
                  </tr>
                </thead>
                <tbody>
                  {topVideos.map((video, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{video.Title}</td>
                      <td className="p-2">{formatNumber(video['3-second video views'] || 0)}</td>
                      <td className="p-2">{formatNumber(video.Reactions || 0)}</td>
                      <td className="p-2">{formatNumber(video.Comments || 0)}</td>
                      <td className="p-2">{formatNumber(video.Shares || 0)}</td>
                      <td className="p-2">{video['Average Seconds viewed'] || '0'}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Video Engagement Metrics</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topVideos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Title" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tickFormatter={(value) => value?.substring(0, 15) + '...'}
                />
                <YAxis />
                <Tooltip formatter={(value) => [formatNumber(value), 'Count']} />
                <Legend />
                <Bar dataKey="Reactions" fill="#4e73df" name="Reactions" />
                <Bar dataKey="Comments" fill="#1cc88a" name="Comments" />
                <Bar dataKey="Shares" fill="#f6c23e" name="Shares" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Video Views by Demographics</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={[
                  {name: 'F, 18-24', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 18-24)'] || 0 : 0},
                  {name: 'F, 25-34', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 25-34)'] || 0 : 0},
                  {name: 'F, 35-44', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 35-44)'] || 0 : 0},
                  {name: 'F, 45-54', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 45-54)'] || 0 : 0},
                  {name: 'F, 55-64', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 55-64)'] || 0 : 0},
                  {name: 'F, 65+', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (F, 65+)'] || 0 : 0},
                  {name: 'M, 18-24', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 18-24)'] || 0 : 0},
                  {name: 'M, 25-34', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 25-34)'] || 0 : 0},
                  {name: 'M, 35-44', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 35-44)'] || 0 : 0},
                  {name: 'M, 45-54', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 45-54)'] || 0 : 0},
                  {name: 'M, 55-64', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 55-64)'] || 0 : 0},
                  {name: 'M, 65+', value: topVideos[0] ? topVideos[0]['3-second video views by top audience (M, 65+)'] || 0 : 0},
                ].filter(item => item.value > 0)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                <Tooltip formatter={(value) => [`${(value * 100).toFixed(2)}%`, 'Views']} />
                <Legend />
                <Bar dataKey="value" fill="#4e73df" name="Views Percentage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Instagram Tab Content
  const getInstagramContent = () => {
    if (!igPostsData) {
      return (
        <div className="p-4 bg-white rounded shadow-sm">
          {Object.keys(errors).filter(key => key.includes('IG_')).length > 0 ? 
            <div className="text-red-500">
              Error loading Instagram data:
              <ul>
                {Object.keys(errors).filter(key => key.includes('IG_')).map(key => (
                  <li key={key}>{key}: {errors[key]}</li>
                ))}
              </ul>
            </div> : 
            <div className="text-gray-500">Loading Instagram data...</div>
          }
        </div>
      );
    }

    // Process Instagram posts data
    const topPosts = [...igPostsData]
      .sort((a, b) => (b.Reach || 0) - (a.Reach || 0))
      .slice(0, 5);
    
    return (
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Top Instagram Posts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-2 text-left">Post Description</th>
                    <th className="p-2 text-left">Reach</th>
                    <th className="p-2 text-left">Likes</th>
                    <th className="p-2 text-left">Comments</th>
                    <th className="p-2 text-left">Shares</th>
                    <th className="p-2 text-left">Saves</th>
                    <th className="p-2 text-left">Follows</th>
                  </tr>
                </thead>
                <tbody>
                  {topPosts.map((post, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2">{post.Description?.substring(0, 30)}...</td>
                      <td className="p-2">{formatNumber(post.Reach || 0)}</td>
                      <td className="p-2">{formatNumber(post.Likes || 0)}</td>
                      <td className="p-2">{formatNumber(post.Comments || 0)}</td>
                      <td className="p-2">{formatNumber(post.Shares || 0)}</td>
                      <td className="p-2">{formatNumber(post.Saves || 0)}</td>
                      <td className="p-2">{formatNumber(post.Follows || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Post Reach vs. Engagement</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="Reach" 
                  name="Reach" 
                  domain={['auto', 'auto']}
                />
                <YAxis 
                  type="number" 
                  dataKey="engagement" 
                  name="Engagement" 
                />
                <Tooltip 
                  formatter={(value, name) => [formatNumber(value), name]} 
                  labelFormatter={(value) => `Post ID: ${value}`}
                />
                <Legend />
                <Scatter 
                  name="Posts" 
                  data={igPostsData.map(post => ({
                    ...post,
                    engagement: (post.Likes || 0) + (post.Comments || 0) + (post.Shares || 0) + (post.Saves || 0)
                  }))} 
                  fill="#e74a3b"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="text-lg font-semibold mb-3">Engagement Distribution by Type</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Likes', value: igPostsData.reduce((sum, post) => sum + (post.Likes || 0), 0) },
                    { name: 'Comments', value: igPostsData.reduce((sum, post) => sum + (post.Comments || 0), 0) },
                    { name: 'Shares', value: igPostsData.reduce((sum, post) => sum + (post.Shares || 0), 0) },
                    { name: 'Saves', value: igPostsData.reduce((sum, post) => sum + (post.Saves || 0), 0) }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {['#e74a3b', '#f6c23e', '#4e73df', '#1cc88a'].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value), 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Return Dashboard UI
  return (
    <div className="bg-gray-100 min-h-screen pb-8">
      <div className="bg-white p-4 shadow-sm mb-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">Marketing Analytics Dashboard</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleString()}</p>
          {isLoading && <div className="text-blue-500">Loading data...</div>}
          {Object.keys(errors).length > 0 && (
            <div className="text-sm text-gray-600">
              Note: Some data sources have errors. Details are shown in each section.
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto">
        <div className="mb-4">
          <ul className="flex flex-wrap border-b border-gray-200">
            <li className="mr-2">
              <button
                className={`inline-block py-2 px-4 ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block py-2 px-4 ${activeTab === 'email' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('email')}
              >
                Email
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block py-2 px-4 ${activeTab === 'youtube' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('youtube')}
              >
                YouTube
              </button>
            </li>
            <li className="mr-2">
              <button
                className={`inline-block py-2 px-4 ${activeTab === 'social' ? 'text-blue-600 border-b-2 border-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('social')}
              >
                Social Media
              </button>
            </li>
          </ul>
        </div>

        {activeTab === 'social' && (
          <div className="mb-4">
            <ul className="flex flex-wrap mb-4">
              <li className="mr-2">
                <button
                  className={`inline-block py-1 px-3 rounded ${activeSocialTab === 'facebook' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveSocialTab('facebook')}
                >
                  Facebook
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block py-1 px-3 rounded ${activeSocialTab === 'instagram' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                  onClick={() => setActiveSocialTab('instagram')}
                >
                  Instagram
                </button>
              </li>
            </ul>
          </div>
        )}

        {activeTab === 'overview' && getOverviewData()}
        {activeTab === 'email' && getEmailContent()}
        {activeTab === 'youtube' && getYouTubeContent()}
        {activeTab === 'social' && activeSocialTab === 'facebook' && getFacebookContent()}
        {activeTab === 'social' && activeSocialTab === 'instagram' && getInstagramContent()}
      </div>
      
      <footer className="bg-white py-3 mt-8 border-t">
        <div className="container mx-auto">
          <p className="text-center text-gray-600 text-sm">Marketing Analytics Dashboard | Data refreshes when files are updated</p>
        </div>
      </footer>
    </div>
  );
};

export default MarketingDashboard;