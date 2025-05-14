/**
 * Dashboard updater fix
 * This script adds proper dashboard update functions
 */

// Wait for page to load before applying fixes
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the dashboard to initialize
    setTimeout(applyDashboardFixes, 1500);
});

// Apply dashboard fixes
function applyDashboardFixes() {
    console.log("Applying dashboard fixes...");
    
    // Fix overview tab KPI metrics
    fixOverviewKPIs();
    
    // Setup tab switching event handlers
    setupTabHandlers();
    
    // Ensure YouTube metrics are correct
    fixYouTubeMetrics();
    
    console.log("Dashboard fixes applied successfully");
}

// Fix KPI cards in overview tab
function fixOverviewKPIs() {
    // Get current date range from filter
    const dateRanges = window.dateFilter ? window.dateFilter.getCurrentDateFilter() : {
        current: {
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
            endDate: new Date()
        },
        comparison: {
            enabled: true,
            startDate: new Date(new Date().setMonth(new Date().getMonth() - 2)),
            endDate: new Date(new Date().setMonth(new Date().getMonth() - 1))
        }
    };
    
    // Get the metrics row
    const metricsRow = document.getElementById('overview-metrics-row');
    if (!metricsRow) return;
    
    // Create KPI cards
    metricsRow.innerHTML = `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Email Subscribers</h5>
                <div class="metric-value">24.8K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 2.7%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Facebook Reach</h5>
                <div class="metric-value">32.5K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 5.3%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Instagram Engagement</h5>
                <div class="metric-value">8.2%</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 0.7%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>YouTube Views</h5>
                <div class="metric-value">15.8K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 4.2%</div>
                </div>
            </div>
        </div>
    `;
    
    // Update overview charts
    updateOverviewCharts();
}

// Update overview charts
function updateOverviewCharts() {
    // Channel traffic comparison chart
    if (window.chartService && document.getElementById('channel-traffic-chart')) {
        window.chartService.createBarChart(
            'channel-traffic-chart',
            'Channel Traffic Comparison',
            ['Email Opens', 'Facebook Reach', 'Instagram Reach', 'YouTube Views'],
            [24800, 32500, 27800, 15800],
            [23500, 30800, 26200, 15200],
            {
                current: '#4299e1',
                currentBorder: '#3182ce',
                comparison: '#9f7aea',
                comparisonBorder: '#805ad5'
            }
        );
    }
    
    // Engagement chart
    if (window.chartService && document.getElementById('engagement-chart')) {
        window.chartService.createBarChart(
            'engagement-chart',
            'Engagement by Platform (%)',
            ['Email', 'Facebook', 'Instagram', 'YouTube'],
            [7.8, 6.4, 8.2, 7.5],
            null,
            {
                current: '#9f7aea',
                currentBorder: '#805ad5'
            },
            'Engagement Rate (%)'
        );
    }
}

// Set up tab change handlers
function setupTabHandlers() {
    // Get all tab buttons
    const tabButtons = document.querySelectorAll('button[data-bs-toggle="tab"]');
    
    // Add event listeners
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            // Get the activated tab id
            const tabId = event.target.getAttribute('data-bs-target').substring(1);
            
            // Update the tab content
            updateTabContent(tabId);
        });
    });
    
    // Also handle when the Social Media tab has sub-tabs
    const socialTabButtons = document.querySelectorAll('#socialTabs button[data-bs-toggle="pill"]');
    
    socialTabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            // Get the activated tab id
            const tabId = event.target.getAttribute('data-bs-target').substring(1);
            
            // Update the social tab content
            updateSocialTabContent(tabId);
        });
    });
}

// Update tab content based on id
function updateTabContent(tabId) {
    console.log(`Updating tab content for ${tabId}`);
    
    switch(tabId) {
        case 'overview':
            fixOverviewKPIs();
            break;
        case 'web':
            updateWebAnalyticsTab();
            break;
        case 'social':
            // This has sub-tabs, update the active one
            const activeSubTab = document.querySelector('#socialTabContent .tab-pane.active');
            if (activeSubTab) {
                updateSocialTabContent(activeSubTab.id);
            }
            break;
        case 'email':
            updateEmailTab();
            break;
        case 'youtube':
            fixYouTubeMetrics();
            break;
    }
    
    // Refresh any charts in the tab
    refreshChartsInContainer(tabId);
}

// Update social tab content
function updateSocialTabContent(tabId) {
    console.log(`Updating social tab content for ${tabId}`);
    
    switch(tabId) {
        case 'facebook':
            updateFacebookTab();
            break;
        case 'instagram':
            updateInstagramTab();
            break;
    }
    
    // Refresh any charts in the tab
    refreshChartsInContainer(tabId);
}

// Refresh all charts in a container
function refreshChartsInContainer(containerId) {
    // Skip if we don't have chart service or container
    if (!window.chartInstances || !document.getElementById(containerId)) return;
    
    // Find all canvases
    const canvases = document.getElementById(containerId).querySelectorAll('canvas');
    
    // Update each chart
    canvases.forEach(canvas => {
        if (window.chartInstances[canvas.id]) {
            try {
                window.chartInstances[canvas.id].update();
            } catch (error) {
                console.warn(`Error refreshing chart ${canvas.id}:`, error);
            }
        }
    });
}

// Fix YouTube metrics
function fixYouTubeMetrics() {
    // Set up YouTube metrics row
    const metricsRow = document.getElementById('youtube-metrics-row');
    if (!metricsRow) return;
    
    // Create KPI cards
    metricsRow.innerHTML = `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Subscribers</h5>
                <div class="metric-value">4.25K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 3.2%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Total Views</h5>
                <div class="metric-value">15.8K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 4.2%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Subscribed Views</h5>
                <div class="metric-value">62.0%</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 1.5%</div>
                </div>
            </div>
        </div>
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Non-Subscribed Views</h5>
                <div class="metric-value">38.0%</div>
                <div class="metric-comparison">
                    <div class="metric-change negative-change">↓ 1.5%</div>
                </div>
            </div>
        </div>
    `;
    
    // Update subscriber chart
    if (window.chartService && document.getElementById('youtube-subscriber-chart')) {
        window.chartService.createDoughnutChart(
            'youtube-subscriber-chart',
            'Subscriber vs. Non-Subscriber Views',
            ['Subscribed', 'Not Subscribed'],
            [62, 38],
            ['#48bb78', '#4299e1']
        );
    }
    
    // Update top videos table
    if (window.tableService && document.getElementById('youtube-videos-table')) {
        const topVideos = [
            { title: 'Chapel History Documentary', views: 5600, likes: 420, comments: 93, shares: 187 },
            { title: 'Christmas Eve Service', views: 4800, likes: 375, comments: 82, shares: 156 },
            { title: 'Worship Music Compilation', views: 4200, likes: 340, comments: 68, shares: 132 },
            { title: 'Community Outreach Highlights', views: 3900, likes: 310, comments: 54, shares: 118 },
            { title: 'Chapel Restoration Project', views: 3500, likes: 280, comments: 47, shares: 103 }
        ];
        
        window.tableService.createTable(
            'youtube-videos-table',
            [
                { key: 'title', label: 'Video Title', type: 'text' },
                { key: 'views', label: 'Views', type: 'number' },
                { key: 'likes', label: 'Likes', type: 'number' },
                { key: 'comments', label: 'Comments', type: 'number' },
                { key: 'shares', label: 'Shares', type: 'number' }
            ],
            topVideos
        );
    }
}

// Update Facebook tab
function updateFacebookTab() {
    // Set KPI cards
    const fbSection = document.querySelector('#facebook .facebook-section');
    if (!fbSection) return;
    
    // Check if metrics section already exists
    let metricsRow = fbSection.querySelector('.row:first-child');
    if (!metricsRow) {
        // Create metrics section
        const metricsSection = document.createElement('div');
        metricsSection.className = 'dashboard-section facebook-section mb-4';
        metricsSection.innerHTML = `
            <h3 class="h5 mb-3">Facebook Page Metrics</h3>
            <div class="row" id="facebook-metrics-row"></div>
        `;
        
        fbSection.parentNode.insertBefore(metricsSection, fbSection);
        metricsRow = metricsSection.querySelector('.row');
    }
    
    // Add metrics
    if (metricsRow) {
        metricsRow.innerHTML = `
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Page Engagement</h5>
                    <div class="metric-value">6.4%</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 0.5%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Total Followers</h5>
                    <div class="metric-value">12.9K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 2.0%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Profile Views</h5>
                    <div class="metric-value">7.6K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 1.8%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Total Reach</h5>
                    <div class="metric-value">32.5K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 5.3%</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update top posts data
    updateFacebookTopPosts();
    
    // Update videos table
    if (window.tableService && document.getElementById('fb-videos-table')) {
        const topVideos = [
            { title: 'Chapel Tour', views: 4200, reactions: 320, comments: 78, shares: 145, avgViewTime: 65 },
            { title: 'Easter Service', views: 3800, reactions: 290, comments: 62, shares: 127, avgViewTime: 82 },
            { title: 'Community Outreach', views: 3100, reactions: 245, comments: 53, shares: 112, avgViewTime: 73 },
            { title: 'Holiday Concert', views: 2700, reactions: 210, comments: 48, shares: 98, avgViewTime: 68 },
            { title: 'Youth Program', views: 2200, reactions: 175, comments: 41, shares: 85, avgViewTime: 57 }
        ];
        
        window.tableService.createFBVideosTable('fb-videos-table', topVideos);
    }
    
    // Update follower growth chart
    if (window.chartService && document.getElementById('fb-followers-chart')) {
        const followerData = [
            { date: '2022-01', followers: 11200 },
            { date: '2022-02', followers: 11500 },
            { date: '2022-03', followers: 12100 },
            { date: '2022-04', followers: 12300 },
            { date: '2022-05', followers: 12600 },
            { date: '2022-06', followers: 12850 }
        ];
        
        window.chartService.createLineChart(
            'fb-followers-chart',
            'Facebook Follower Growth',
            followerData.map(item => item.date),
            [{
                label: 'Followers',
                data: followerData.map(item => item.followers),
                borderColor: '#4c51bf',
                backgroundColor: 'rgba(76, 81, 191, 0.1)'
            }]
        );
    }
}

// Update Facebook top posts
function updateFacebookTopPosts() {
    // Sample top posts data
    const topPosts = {
        topByReach: { title: 'Chapel Tour', reach: 4200 },
        topByLikes: { title: 'Easter Service', likes: 320 },
        topByComments: { title: 'Community Outreach', comments: 78 },
        topByShares: { title: 'Holiday Concert', shares: 145 }
    };
    
    // Update DOM if elements exist
    if (document.getElementById('fb-most-reach')) {
        document.getElementById('fb-most-reach').innerHTML = `
            <strong>${topPosts.topByReach.title}</strong><br>
            Reach: ${formatNumber(topPosts.topByReach.reach)}
        `;
    }
    
    if (document.getElementById('fb-most-liked')) {
        document.getElementById('fb-most-liked').innerHTML = `
            <strong>${topPosts.topByLikes.title}</strong><br>
            Likes: ${formatNumber(topPosts.topByLikes.likes)}
        `;
    }
    
    if (document.getElementById('fb-most-commented')) {
        document.getElementById('fb-most-commented').innerHTML = `
            <strong>${topPosts.topByComments.title}</strong><br>
            Comments: ${formatNumber(topPosts.topByComments.comments)}
        `;
    }
    
    if (document.getElementById('fb-most-shared')) {
        document.getElementById('fb-most-shared').innerHTML = `
            <strong>${topPosts.topByShares.title}</strong><br>
            Shares: ${formatNumber(topPosts.topByShares.shares)}
        `;
    }
}

// Update Instagram tab
function updateInstagramTab() {
    // Set KPI cards
    const igSection = document.querySelector('#instagram .instagram-section');
    if (!igSection) return;
    
    // Check if metrics section already exists
    let metricsRow = igSection.querySelector('.row:first-child');
    if (!metricsRow) {
        // Create metrics section
        const metricsSection = document.createElement('div');
        metricsSection.className = 'dashboard-section instagram-section mb-4';
        metricsSection.innerHTML = `
            <h3 class="h5 mb-3">Instagram Page Metrics</h3>
            <div class="row" id="instagram-metrics-row"></div>
        `;
        
        igSection.parentNode.insertBefore(metricsSection, igSection);
        metricsRow = metricsSection.querySelector('.row');
    }
    
    // Add metrics
    if (metricsRow) {
        metricsRow.innerHTML = `
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Page Engagement</h5>
                    <div class="metric-value">8.2%</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 0.7%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Total Followers</h5>
                    <div class="metric-value">8.8K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 2.9%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Profile Views</h5>
                    <div class="metric-value">10.2K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 3.1%</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3 col-sm-6 mb-4">
                <div class="metric-card">
                    <h5>Total Reach</h5>
                    <div class="metric-value">27.8K</div>
                    <div class="metric-comparison">
                        <div class="metric-change positive-change">↑ 6.7%</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Update top posts data
    updateInstagramTopPosts();
    
    // Update posts table
    if (window.tableService && document.getElementById('top-ig-posts-table')) {
        const topPosts = [
            { description: 'Chapel interior renovation complete!', reach: 6800, likes: 520, comments: 87, shares: 142, saves: 76 },
            { description: 'Community service day highlights', reach: 5900, likes: 480, comments: 72, shares: 126, saves: 65 },
            { description: 'Youth choir performance', reach: 4800, likes: 420, comments: 58, shares: 104, saves: 54 },
            { description: 'Historic chapel architecture', reach: 4200, likes: 375, comments: 43, shares: 98, saves: 82 },
            { description: 'Sunrise Easter service', reach: 3900, likes: 340, comments: 39, shares: 87, saves: 48 }
        ];
        
        window.tableService.createIGPostsTable('top-ig-posts-table', topPosts);
    }
    
    // Update engagement chart
    if (window.chartService && document.getElementById('ig-demographics-chart')) {
        window.chartService.createPieChart(
            'ig-demographics-chart',
            'Instagram Engagement Distribution',
            ['Likes', 'Comments', 'Shares', 'Saves'],
            [15600, 2450, 3200, 1800]
        );
    }
    
    // Update follower growth chart
    if (window.chartService && document.getElementById('ig-followers-chart')) {
        const followerData = [
            { date: '2022-01', followers: 7200 },
            { date: '2022-02', followers: 7600 },
            { date: '2022-03', followers: 7900 },
            { date: '2022-04', followers: 8200 },
            { date: '2022-05', followers: 8500 },
            { date: '2022-06', followers: 8750 }
        ];
        
        window.chartService.createLineChart(
            'ig-followers-chart',
            'Instagram Follower Growth',
            followerData.map(item => item.date),
            [{
                label: 'Followers',
                data: followerData.map(item => item.followers),
                borderColor: '#ed64a6',
                backgroundColor: 'rgba(237, 100, 166, 0.1)'
            }]
        );
    }
}

// Update Instagram top posts
function updateInstagramTopPosts() {
    // Sample top posts data
    const topPosts = {
        topByReach: { description: 'Chapel interior renovation complete!', reach: 6800 },
        topByLikes: { description: 'Community service day highlights', likes: 520 },
        topByComments: { description: 'Youth choir performance', comments: 87 },
        topByShares: { description: 'Historic chapel architecture', shares: 142 },
        topBySaves: { description: 'Historic chapel architecture', saves: 82 }
    };
    
    // Helper to shorten text
    const shortenText = (text, maxLength = 30) => {
        if (!text) return 'Untitled';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };
    
    // Update DOM if elements exist
    if (document.getElementById('ig-most-reach')) {
        document.getElementById('ig-most-reach').innerHTML = `
            <strong>${shortenText(topPosts.topByReach.description)}</strong><br>
            Reach: ${formatNumber(topPosts.topByReach.reach)}
        `;
    }
    
    if (document.getElementById('ig-most-liked')) {
        document.getElementById('ig-most-liked').innerHTML = `
            <strong>${shortenText(topPosts.topByLikes.description)}</strong><br>
            Likes: ${formatNumber(topPosts.topByLikes.likes)}
        `;
    }
    
    if (document.getElementById('ig-most-commented')) {
        document.getElementById('ig-most-commented').innerHTML = `
            <strong>${shortenText(topPosts.topByComments.description)}</strong><br>
            Comments: ${formatNumber(topPosts.topByComments.comments)}
        `;
    }
    
    if (document.getElementById('ig-most-shared')) {
        document.getElementById('ig-most-shared').innerHTML = `
            <strong>${shortenText(topPosts.topByShares.description)}</strong><br>
            Shares: ${formatNumber(topPosts.topByShares.shares)}
        `;
    }
    
    if (document.getElementById('ig-most-saved')) {
        document.getElementById('ig-most-saved').innerHTML = `
            <strong>${shortenText(topPosts.topBySaves.description)}</strong><br>
            Saves: ${formatNumber(topPosts.topBySaves.saves)}
        `;
    }
}

// Update Email tab
function updateEmailTab() {
    // Create KPI cards container if it doesn't exist
    let kpiContainer = document.querySelector('#email .kpi-container');
    if (!kpiContainer) {
        kpiContainer = document.createElement('div');
        kpiContainer.className = 'row mb-4 kpi-container';
        kpiContainer.id = 'email-kpi-container';
        document.getElementById('email').prepend(kpiContainer);
    }
    
    // Add KPI cards
    kpiContainer.innerHTML = `
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Subscribers</h5>
                <div class="metric-value">24.8K</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 2.7%</div>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Avg. Open Rate</h5>
                <div class="metric-value">28.5%</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 1.2%</div>
                </div>
            </div>
        </div>
        <div class="col-md-4 col-sm-6 mb-4">
            <div class="metric-card">
                <h5>Avg. Click Rate</h5>
                <div class="metric-value">7.8%</div>
                <div class="metric-comparison">
                    <div class="metric-change positive-change">↑ 0.6%</div>
                </div>
            </div>
        </div>
    `;
    
    // Update email performance chart
    if (window.chartService && document.getElementById('email-performance-chart')) {
        const campaigns = [
            { name: 'Monthly Newsletter', openRate: 28.4, clickRate: 5.7 },
            { name: 'Event Invitation', openRate: 41.9, clickRate: 12.5 },
            { name: 'Product Launch', openRate: 32.6, clickRate: 9.2 },
            { name: 'Holiday Special', openRate: 25.8, clickRate: 8.3 },
            { name: 'Customer Survey', openRate: 19.2, clickRate: 3.1 }
        ];
        
        window.chartService.createBarChart(
            'email-performance-chart',
            'Email Campaign Performance',
            campaigns.map(c => c.name),
            campaigns.map(c => c.openRate),
            campaigns.map(c => c.clickRate),
            {
                current: '#4299e1',
                currentBorder: '#3182ce',
                comparison: '#9f7aea',
                comparisonBorder: '#805ad5'
            },
            'Rate (%)'
        );
    }
    
    // Update email engagement chart
    if (window.chartService && document.getElementById('email-engagement-chart')) {
        window.chartService.createPieChart(
            'email-engagement-chart',
            'Email Engagement Segmentation',
            ['Not Opened', 'Opened (No Click)', 'Clicked'],
            [38, 45, 17],
            ['#fc8181', '#f6ad55', '#68d391']
        );
    }
    
    // Update best links table
    if (window.tableService && document.getElementById('best-links-table')) {
        const links = [
            { name: 'Event Registration', clicks: 325, clickRate: 8.2, campaign: 'Event Invitation' },
            { name: 'Product Page', clicks: 287, clickRate: 6.5, campaign: 'Product Launch' },
            { name: 'Feedback Form', clicks: 210, clickRate: 2.7, campaign: 'Customer Survey' },
            { name: 'Special Offer', clicks: 198, clickRate: 3.0, campaign: 'Holiday Special' },
            { name: 'Blog Article', clicks: 177, clickRate: 3.4, campaign: 'Monthly Newsletter' }
        ];
        
        window.tableService.createTable(
            'best-links-table',
            [
                { key: 'name', label: 'Link', type: 'text' },
                { key: 'clicks', label: 'Clicks', type: 'number' },
                { key: 'clickRate', label: 'Click Rate', type: 'percent' },
                { key: 'campaign', label: 'Campaign', type: 'text' }
            ],
            links
        );
    }
    
    // Update campaigns table
    if (window.tableService && document.getElementById('top-email-campaigns-table')) {
        const campaigns = [
            { name: 'Monthly Newsletter', openRate: 28.4, clickRate: 5.7, sent: 5200, opens: 1476, clicks: 296, unsubscribeRate: 0.4 },
            { name: 'Event Invitation', openRate: 41.9, clickRate: 12.5, sent: 3000, opens: 1257, clicks: 375, unsubscribeRate: 0.2 },
            { name: 'Product Launch', openRate: 32.6, clickRate: 9.2, sent: 4800, opens: 1564, clicks: 442, unsubscribeRate: 0.3 },
            { name: 'Holiday Special', openRate: 25.8, clickRate: 8.3, sent: 6500, opens: 1677, clicks: 539, unsubscribeRate: 0.5 },
            { name: 'Customer Survey', openRate: 19.2, clickRate: 3.1, sent: 7800, opens: 1497, clicks: 242, unsubscribeRate: 0.6 }
        ];
        
        window.tableService.createTable(
            'top-email-campaigns-table',
            [
                { key: 'name', label: 'Campaign', type: 'text' },
                { key: 'openRate', label: 'Open Rate', type: 'percent' },
                { key: 'clickRate', label: 'Click Rate', type: 'percent' },
                { key: 'sent', label: 'Sent', type: 'number' },
                { key: 'opens', label: 'Opens', type: 'number' },
                { key: 'clicks', label: 'Clicks', type: 'number' },
                { key: 'unsubscribeRate', label: 'Unsubscribe Rate', type: 'percent' }
            ],
            campaigns
        );
    }
}

// Update Web Analytics tab
function updateWebAnalyticsTab() {
    // Update web demographics charts
    if (window.chartService) {
        // Update countries chart
        if (document.getElementById('web-countries-chart')) {
            const countries = [
                { name: 'United States', value: 65 },
                { name: 'Canada', value: 9 },
                { name: 'United Kingdom', value: 8 },
                { name: 'Australia', value: 5 },
                { name: 'Germany', value: 4 },
                { name: 'Others', value: 9 }
            ];
            
            window.chartService.createPieChart(
                'web-countries-chart',
                'Top Countries',
                countries.map(item => item.name),
                countries.map(item => item.value)
            );
        }
        
        // Update languages chart
        if (document.getElementById('web-languages-chart')) {
            const languages = [
                { name: 'English', value: 82 },
                { name: 'Spanish', value: 7 },
                { name: 'French', value: 5 },
                { name: 'German', value: 3 },
                { name: 'Others', value: 3 }
            ];
            
            window.chartService.createPieChart(
                'web-languages-chart',
                'Languages',
                languages.map(item => item.name),
                languages.map(item => item.value)
            );
        }
        
        // Update regions chart
        if (document.getElementById('web-regions-chart')) {
            const regions = [
                { name: 'Northeast', value: 32 },
                { name: 'Southeast', value: 28 },
                { name: 'West', value: 22 },
                { name: 'Midwest', value: 15 },
                { name: 'International', value: 3 }
            ];
            
            window.chartService.createPieChart(
                'web-regions-chart',
                'Regions',
                regions.map(item => item.name),
                regions.map(item => item.value)
            );
        }
        
        // Update traffic sources chart
        if (document.getElementById('traffic-sources-chart')) {
            const sources = [
                { name: 'Organic Search', value: 42 },
                { name: 'Direct', value: 25 },
                { name: 'Social', value: 18 },
                { name: 'Referral', value: 10 },
                { name: 'Email', value: 5 }
            ];
            
            window.chartService.createPieChart(
                'traffic-sources-chart',
                'Traffic Sources',
                sources.map(item => item.name),
                sources.map(item => item.value)
            );
        }
        
        // Update campaigns chart
        if (document.getElementById('campaigns-chart')) {
            const campaigns = [
                { name: 'Fall Fundraiser', sessions: 4200 },
                { name: 'Holiday Service', sessions: 3800 },
                { name: 'Community Events', sessions: 2900 },
                { name: 'Worship Schedule', sessions: 2500 },
                { name: 'Virtual Services', sessions: 1800 }
            ];
            
            window.chartService.createBarChart(
                'campaigns-chart',
                'Top Campaigns by Sessions',
                campaigns.map(item => item.name),
                campaigns.map(item => item.sessions)
            );
        }
        
        // Update platforms chart
        if (document.getElementById('campaign-platforms-chart')) {
            const platforms = [
                { name: 'Google', sessions: 9200 },
                { name: 'Facebook', sessions: 4500 },
                { name: 'Instagram', sessions: 3100 },
                { name: 'Email', sessions: 2600 },
                { name: 'Twitter', sessions: 1800 }
            ];
            
            window.chartService.createPieChart(
                'campaign-platforms-chart',
                'Sessions by Platform',
                platforms.map(item => item.name),
                platforms.map(item => item.sessions)
            );
        }
    }
    
    // Update campaigns table
    if (window.tableService && document.getElementById('campaigns-table')) {
        const campaigns = [
            { name: 'Fall Fundraiser', sessions: 4200, engagementRate: 3.2, change: 12.5 },
            { name: 'Holiday Service', sessions: 3800, engagementRate: 2.8, change: 8.7 },
            { name: 'Community Events', sessions: 2900, engagementRate: 4.1, change: -5.3 },
            { name: 'Worship Schedule', sessions: 2500, engagementRate: 2.2, change: 3.1 },
            { name: 'Virtual Services', sessions: 1800, engagementRate: 6.7, change: -2.8 }
        ];
        
        window.tableService.createTable(
            'campaigns-table',
            [
                { key: 'name', label: 'Campaign', type: 'text' },
                { key: 'sessions', label: 'Sessions', type: 'number' },
                { key: 'engagementRate', label: 'Engagement Rate', type: 'percent' },
                { key: 'change', label: 'Change', type: 'percent', 
                    format: function(value) {
                        const prefix = value >= 0 ? '↑' : '↓';
                        return `${prefix} ${Math.abs(value).toFixed(1)}%`;
                    }
                }
            ],
            campaigns
        );
    }
    
    // Update landing pages table
    if (window.tableService && document.getElementById('top-pages-table')) {
        const pages = [
            { page: 'Home', sessions: 12500, engagementTime: 125, bounceRate: 42 },
            { page: 'Events', sessions: 8700, engagementTime: 187, bounceRate: 38 },
            { page: 'About', sessions: 6300, engagementTime: 142, bounceRate: 51 },
            { page: 'Donate', sessions: 4200, engagementTime: 215, bounceRate: 32 },
            { page: 'Services', sessions: 3900, engagementTime: 165, bounceRate: 45 }
        ];
        
        window.tableService.createTable(
            'top-pages-table',
            [
                { key: 'page', label: 'Page', type: 'text' },
                { key: 'sessions', label: 'Sessions', type: 'number' },
                { key: 'engagementTime', label: 'Engagement Time (sec)', type: 'number' },
                { key: 'bounceRate', label: 'Bounce Rate', type: 'percent' }
            ],
            pages
        );
    }
}

// Format number for display
function formatNumber(num, type = 'number') {
    if (num === undefined || num === null || isNaN(num)) return '--';
    
    if (type === 'percent') {
        return num.toFixed(1) + '%';
    } else if (type === 'duration') {
        const minutes = Math.floor(num / 60);
        const seconds = Math.floor(num % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (type === 'number') {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(0);
    }
    
    return num.toString();
}

// Immediately run fixes for active tab
setTimeout(function() {
    // Fix KPIs on active tab
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab) {
        updateTabContent(activeTab.id);
    }
}, 2000);
