// Configuration
const DATA_PATH = 'data/';
const csvFiles = {
    emailCampaign: 'Email_Campaign_Performance.csv',
    fbVideos: 'FB_Videos.csv',
    fbPosts: 'FB_Posts.csv',
    igPosts: 'IG_Posts.csv',
    youtubeAge: 'YouTube_Age.csv',
    youtubeGender: 'YouTube_Gender.csv',
    youtubeGeography: 'YouTube_Geography.csv',
    youtubeSubscription: 'YouTube_Subscription_Status.csv'
};

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num;
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateColorArray(count) {
    const colors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#5a5c69', '#6f42c1', '#20c9a6', '#fd7e14', '#6610f2'
    ];
    
    if (count <= colors.length) {
        return colors.slice(0, count);
    }
    
    const extraColors = [];
    for (let i = 0; i < count - colors.length; i++) {
        extraColors.push(getRandomColor());
    }
    
    return [...colors, ...extraColors];
}

// Parser options
const parseOptions = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true
};

// Main data loading function
async function loadData() {
    try {
        document.getElementById('last-updated').textContent = new Date().toLocaleString();
        
        // Load email campaign data
        await loadEmailCampaignData();
        
        // Load Facebook video data
        await loadFacebookVideoData();
        
        // Load Instagram post data
        await loadInstagramPostData();
        
        // Load YouTube demographic data
        await loadYouTubeData();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Email Campaign Data
async function loadEmailCampaignData() {
    try {
        const response = await fetch(DATA_PATH + csvFiles.emailCampaign);
        const csvData = await response.text();
        
        Papa.parse(csvData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                // Process email campaign data
                if (data && data.length > 0) {
                    // Update email metrics
                    document.getElementById('total-subscribers').textContent = formatNumber(data.length * 20); // Simulated total
                    
                    // Sort campaigns by open rate
                    data.sort((a, b) => {
                        const openRateA = parseFloat(a['Email open rate (MPP excluded)']) || 0;
                        const openRateB = parseFloat(b['Email open rate (MPP excluded)']) || 0;
                        return openRateB - openRateA;
                    });
                    
                    // Get top 5 campaigns by open rate
                    const topCampaigns = data.slice(0, 5);
                    
                    // Populate top email campaigns table
                    const tableBody = document.querySelector('#top-email-campaigns-table tbody');
                    tableBody.innerHTML = '';
                    
                    topCampaigns.forEach(campaign => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${campaign.Campaign}</td>
                            <td>${campaign['Email open rate (MPP excluded)']}</td>
                            <td>${campaign['Email click rate']}</td>
                            <td>${formatNumber(campaign['Email deliveries'])}</td>
                            <td>${campaign['Email unsubscribe rate']}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Create email performance chart
                    createEmailPerformanceChart(data);
                    
                    // Create email engagement chart
                    createEmailEngagementChart(data);
                }
            }
        });
    } catch (error) {
        console.error('Error loading email campaign data:', error);
    }
}

function createEmailPerformanceChart(data) {
    // Get top 10 campaigns
    const topCampaigns = data.slice(0, 10);
    
    const campaignNames = topCampaigns.map(campaign => campaign.Campaign);
    const openRates = topCampaigns.map(campaign => {
        return parseFloat(campaign['Email open rate (MPP excluded)']) * 100 || 0;
    });
    const clickRates = topCampaigns.map(campaign => {
        return parseFloat(campaign['Email click rate']) * 100 || 0;
    });
    
    const ctx = document.getElementById('email-performance-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: campaignNames,
            datasets: [
                {
                    label: 'Open Rate (%)',
                    data: openRates,
                    backgroundColor: '#4e73df',
                    borderWidth: 1
                },
                {
                    label: 'Click Rate (%)',
                    data: clickRates,
                    backgroundColor: '#1cc88a',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rate (%)'
                    }
                }
            }
        }
    });
}

function createEmailEngagementChart(data) {
    // Calculate engagement segments
    let notOpened = 0;
    let openedNotClicked = 0;
    let clicked = 0;
    
    data.forEach(campaign => {
        const sent = parseInt(campaign['Emails sent']) || 0;
        const opened = parseInt(campaign['Email opened (MPP excluded)']) || 0;
        const clicked = parseInt(campaign['Email clicked']) || 0;
        
        notOpened += (sent - opened);
        openedNotClicked += (opened - clicked);
        clicked += clicked;
    });
    
    const total = notOpened + openedNotClicked + clicked;
    const notOpenedPercentage = (notOpened / total * 100).toFixed(1);
    const openedNotClickedPercentage = (openedNotClicked / total * 100).toFixed(1);
    const clickedPercentage = (clicked / total * 100).toFixed(1);
    
    const ctx = document.getElementById('email-engagement-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Not Opened', 'Opened (No Click)', 'Clicked'],
            datasets: [{
                data: [notOpenedPercentage, openedNotClickedPercentage, clickedPercentage],
                backgroundColor: ['#e74a3b', '#f6c23e', '#1cc88a']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Facebook Video Data
async function loadFacebookVideoData() {
    try {
        const response = await fetch(DATA_PATH + csvFiles.fbVideos);
        const csvData = await response.text();
        
        Papa.parse(csvData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    // Sort videos by views
                    data.sort((a, b) => {
                        const viewsA = a['3-second video views'] || 0;
                        const viewsB = b['3-second video views'] || 0;
                        return viewsB - viewsA;
                    });
                    
                    // Get top 5 videos
                    const topVideos = data.slice(0, 5);
                    
                    // Populate Facebook videos table
                    const tableBody = document.querySelector('#fb-videos-table tbody');
                    tableBody.innerHTML = '';
                    
                    topVideos.forEach(video => {
                        const engagement = (video['Reactions'] || 0) + (video['Comments'] || 0) + (video['Shares'] || 0);
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${video.Title}</td>
                            <td>${formatNumber(video['3-second video views'] || 0)}</td>
                            <td>${formatNumber(engagement)}</td>
                            <td>${video['Average Seconds viewed'] || '0'}s</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Load FB Posts next
                    loadFacebookPostData();
                }
            }
        });
    } catch (error) {
        console.error('Error loading Facebook video data:', error);
    }
}

// Facebook Post Data
async function loadFacebookPostData() {
    try {
        const response = await fetch(DATA_PATH + csvFiles.fbPosts);
        const csvData = await response.text();
        
        Papa.parse(csvData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    // Update social media metrics
                    document.getElementById('total-followers').textContent = formatNumber(25000); // Simulated data
                    
                    // Sort posts by reach
                    data.sort((a, b) => {
                        const reachA = a.Reach || 0;
                        const reachB = b.Reach || 0;
                        return reachB - reachA;
                    });
                    
                    // Get top 5 posts
                    const topPosts = data.slice(0, 5);
                    
                    // Populate top FB posts table
                    const tableBody = document.querySelector('#top-fb-posts-table tbody');
                    tableBody.innerHTML = '';
                    
                    topPosts.forEach(post => {
                        const engagement = (post.Likes || 0) + (post.Comments || 0) + (post.Shares || 0);
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${post.Description?.substring(0, 50) || 'No description'}...</td>
                            <td>${formatNumber(post.Reach || 0)}</td>
                            <td>${formatNumber(engagement)}</td>
                            <td>${new Date(post.Date).toLocaleDateString()}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Create FB Demographics chart (simulated data)
                    createFacebookDemographicsChart();
                    
                    // Create FB Followers Growth chart (simulated data)
                    createFacebookFollowersChart();
                }
            }
        });
    } catch (error) {
        console.error('Error loading Facebook post data:', error);
    }
}

function createFacebookDemographicsChart() {
    // Simulated Facebook demographics data
    const demographics = {
        '18-24': 15,
        '25-34': 32,
        '35-44': 25,
        '45-54': 18,
        '55-64': 7,
        '65+': 3
    };
    
    const ctx = document.getElementById('fb-demographics-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(demographics),
            datasets: [{
                label: 'Audience %',
                data: Object.values(demographics),
                backgroundColor: '#4e73df'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage'
                    }
                }
            }
        }
    });
}

function createFacebookFollowersChart() {
    // Simulated Facebook followers growth data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const followers = [22000, 22500, 23100, 23800, 24600, 25000];
    
    const ctx = document.getElementById('fb-followers-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Followers',
                data: followers,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#4e73df',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Instagram Post Data
async function loadInstagramPostData() {
    try {
        const response = await fetch(DATA_PATH + csvFiles.igPosts);
        const csvData = await response.text();
        
        Papa.parse(csvData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    // Sort posts by reach
                    data.sort((a, b) => {
                        const reachA = a.Reach || 0;
                        const reachB = b.Reach || 0;
                        return reachB - reachA;
                    });
                    
                    // Get top 5 posts
                    const topPosts = data.slice(0, 5);
                    
                    // Populate top IG posts table
                    const tableBody = document.querySelector('#top-ig-posts-table tbody');
                    tableBody.innerHTML = '';
                    
                    topPosts.forEach(post => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${post.Description?.substring(0, 50) || 'No description'}...</td>
                            <td>${formatNumber(post.Reach || 0)}</td>
                            <td>${formatNumber(post.Likes || 0)}</td>
                            <td>${formatNumber(post.Comments || 0)}</td>
                            <td>${formatNumber(post.Saves || 0)}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                    
                    // Create Instagram Demographics chart (simulated data)
                    createInstagramDemographicsChart();
                    
                    // Create Instagram Followers Growth chart (simulated data)
                    createInstagramFollowersChart();
                    
                    // Create channel traffic comparison chart
                    createChannelTrafficChart();
                    
                    // Create engagement by platform chart
                    createEngagementChart();
                }
            }
        });
    } catch (error) {
        console.error('Error loading Instagram post data:', error);
    }
}

function createInstagramDemographicsChart() {
    // Simulated Instagram demographics data
    const demographics = {
        '18-24': 28,
        '25-34': 34,
        '35-44': 20,
        '45-54': 12,
        '55-64': 4,
        '65+': 2
    };
    
    const ctx = document.getElementById('ig-demographics-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(demographics),
            datasets: [{
                label: 'Audience %',
                data: Object.values(demographics),
                backgroundColor: '#e74a3b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage'
                    }
                }
            }
        }
    });
}

function createInstagramFollowersChart() {
    // Simulated Instagram followers growth data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const followers = [18000, 19200, 20500, 22000, 23800, 25500];
    
    const ctx = document.getElementById('ig-followers-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Followers',
                data: followers,
                borderColor: '#e74a3b',
                backgroundColor: 'rgba(231, 74, 59, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#e74a3b',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// YouTube Data
async function loadYouTubeData() {
    try {
        // Load YouTube Age data
        const ageResponse = await fetch(DATA_PATH + csvFiles.youtubeAge);
        const ageData = await ageResponse.text();
        
        // Load YouTube Gender data
        const genderResponse = await fetch(DATA_PATH + csvFiles.youtubeGender);
        const genderData = await genderResponse.text();
        
        // Load YouTube Geography data
        const geoResponse = await fetch(DATA_PATH + csvFiles.youtubeGeography);
        const geoData = await geoResponse.text();
        
        // Load YouTube Subscription Status data
        const subResponse = await fetch(DATA_PATH + csvFiles.youtubeSubscription);
        const subData = await subResponse.text();
        
        // Process YouTube Age data
        Papa.parse(ageData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    const ageLabels = data.map(item => item['Viewer age']);
                    const ageViewsPercentage = data.map(item => item['Views (%)']);
                    
                    createYouTubeAgeChart(ageLabels, ageViewsPercentage);
                }
            }
        });
        
        // Process YouTube Gender data
        Papa.parse(genderData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    const genderLabels = data.map(item => item['Viewer gender']);
                    const genderViewsPercentage = data.map(item => item['Views (%)']);
                    
                    createYouTubeGenderChart(genderLabels, genderViewsPercentage);
                }
            }
        });
        
        // Process YouTube Geography data
        Papa.parse(geoData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    // Sort by views
                    data.sort((a, b) => (b.Views || 0) - (a.Views || 0));
                    
                    // Get top 10 countries
                    const topCountries = data.slice(0, 10);
                    const countryLabels = topCountries.map(item => item.Geography);
                    const countryViews = topCountries.map(item => item.Views);
                    
                    createYouTubeGeographyChart(countryLabels, countryViews);
                    
                    // Update total YouTube views metric
                    const totalViews = data.reduce((sum, item) => sum + (item.Views || 0), 0);
                    document.getElementById('total-youtube-views').textContent = formatNumber(totalViews);
                }
            }
        });
        
        // Process YouTube Subscription Status data
        Papa.parse(subData, {
            ...parseOptions,
            complete: function(results) {
                const data = results.data;
                
                if (data && data.length > 0) {
                    const subLabels = data.map(item => item['Subscription status']);
                    const subViews = data.map(item => item.Views);
                    
                    createYouTubeSubscriberChart(subLabels, subViews);
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading YouTube data:', error);
    }
}

function createYouTubeAgeChart(labels, data) {
    const ctx = document.getElementById('youtube-age-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views %',
                data: data,
                backgroundColor: '#1cc88a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Age Distribution'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createYouTubeGenderChart(labels, data) {
    const ctx = document.getElementById('youtube-gender-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#4e73df', '#e74a3b', '#f6c23e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Gender Distribution'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createYouTubeGeographyChart(labels, data) {
    const ctx = document.getElementById('youtube-geography-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Views',
                data: data,
                backgroundColor: generateColorArray(labels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createYouTubeSubscriberChart(labels, data) {
    const ctx = document.getElementById('youtube-subscriber-chart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#1cc88a', '#4e73df', '#f6c23e']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Cross-Channel Charts
function createChannelTrafficChart() {
    // Simulated data for channel traffic comparison
    const channels = ['Organic Search', 'Direct', 'Social', 'Email', 'Referral', 'Paid Search'];
    const visitors = [35000, 22000, 18000, 15000, 8000, 6000];
    
    const ctx = document.getElementById('channel-traffic-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channels,
            datasets: [{
                label: 'Visitors',
                data: visitors,
                backgroundColor: generateColorArray(channels.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Update total website visitors metric
    const totalVisitors = visitors.reduce((sum, visitors) => sum + visitors, 0);
    document.getElementById('total-website-visitors').textContent = formatNumber(totalVisitors);
}

function createEngagementChart() {
    // Simulated data for engagement by platform
    const platforms = ['Website', 'Facebook', 'Instagram', 'Email', 'YouTube'];
    const engagementRates = [2.8, 4.5, 6.2, 3.7, 5.1];
    
    const ctx = document.getElementById('engagement-chart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: platforms,
            datasets: [{
                label: 'Engagement Rate (%)',
                data: engagementRates,
                backgroundColor: 'rgba(78, 115, 223, 0.2)',
                borderColor: '#4e73df',
                borderWidth: 2,
                pointBackgroundColor: '#4e73df',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10
                }
            }
        }
    });
}

// Traffic Sources Chart (simulated data)
function createTrafficSourcesChart() {
    const sources = ['Organic Search', 'Direct', 'Social', 'Email', 'Referral', 'Paid Search'];
    const percentages = [42, 25, 15, 10, 5, 3];
    
    const ctx = document.getElementById('traffic-sources-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: sources,
            datasets: [{
                data: percentages,
                backgroundColor: generateColorArray(sources.length)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Web Demographics Chart (simulated data)
function createWebDemographicsChart() {
    // Create the chart when the dashboard is loaded
    const ctx = document.getElementById('web-demographics-chart').getContext('2d');
    
    // Age groups
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    
    // Percentages for male and female
    const malePercentages = [8, 15, 10, 7, 4, 2];
    const femalePercentages = [10, 18, 12, 8, 4, 2];
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ageGroups,
            datasets: [
                {
                    label: 'Male',
                    data: malePercentages,
                    backgroundColor: '#4e73df',
                    borderWidth: 1
                },
                {
                    label: 'Female',
                    data: femalePercentages,
                    backgroundColor: '#e74a3b',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: false
                },
                y: {
                    stacked: false,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Percentage'
                    }
                }
            }
        }
    });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Create web analytics charts (with simulated data)
    createWebDemographicsChart();
    createTrafficSourcesChart();
    
    // Populate top pages table (simulated data)
    const topPagesTable = document.querySelector('#top-pages-table tbody');
    topPagesTable.innerHTML = `
        <tr>
            <td>/home</td>
            <td>25,432</td>
            <td>2:45</td>
            <td>32%</td>
        </tr>
        <tr>
            <td>/products</td>
            <td>18,721</td>
            <td>3:12</td>
            <td>28%</td>
        </tr>
        <tr>
            <td>/blog</td>
            <td>14,365</td>
            <td>4:05</td>
            <td>22%</td>
        </tr>
        <tr>
            <td>/about</td>
            <td>9,843</td>
            <td>2:18</td>
            <td>35%</td>
        </tr>
        <tr>
            <td>/contact</td>
            <td>7,621</td>
            <td>1:42</td>
            <td>40%</td>
        </tr>
    `;
    
    // Load CSV data
    loadData();
});
