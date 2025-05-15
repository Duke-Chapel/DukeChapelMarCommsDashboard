# Marketing Analytics Dashboard

A comprehensive marketing dashboard for visualizing data from multiple channels: social media, web analytics, email marketing, and YouTube.

## Important Setup Instructions

When deploying this dashboard on GitHub Pages, follow these critical steps to avoid errors:

1. **File Structure**: Make sure all files are in the root directory of your repository. The dashboard references files using relative paths without any subdirectories.

2. **File Naming**: Ensure all filenames match exactly as they are referenced in the HTML files. The dashboard uses kebab-case for file names (e.g., `social-dashboard.jsx`).

3. **Components Loading Order**: The HTML files are designed to load components in a specific order. Do not change the script loading order in the HTML files.

## Dashboard Features

- **Email Marketing Analytics**: Open rates, click-through rates, subscriber metrics
- **Social Media Analytics**: Facebook and Instagram metrics, engagement statistics
- **Web Analytics**: Traffic sources, demographics, page performance
- **YouTube Analytics**: Viewer demographics, subscription status, video performance

## How to Deploy

### Local Development

1. Clone this repository
2. Open any of the HTML files in your browser
3. Upload CSV files to see your analytics

### GitHub Pages Deployment

1. Push the code to a GitHub repository
2. Go to Settings > Pages
3. Set the source branch to `main` or `master`
4. Wait for GitHub to build and deploy your site
5. Visit `https://[your-username].github.io/[repository-name]/`

## Required CSV Files

The dashboard expects CSV files with these naming conventions:

### Email Marketing
- `Email_Campaign_Performance.csv`

### Social Media
- `FB_Posts.csv`
- `FB_Follows.csv`
- `FB_Reach.csv`
- `FB_Views.csv`
- `FB_Interactions.csv`
- `IG_Posts.csv`
- `IG_Follows.csv`
- `IG_Reach.csv`
- `IG_Views.csv`
- `IG_Interactions.csv`

### Web Analytics
- `GA_Demographics.csv`
- `GA_Traffic_Acquisition.csv`
- `GA_Pages_And_Screens.csv`
- `GA_UTMs.csv`

### YouTube Analytics
- `YouTube_Age.csv`
- `YouTube_Gender.csv`
- `YouTube_Geography.csv`
- `YouTube_Subscription_Status.csv`
- `YouTube_Content.csv`

## Troubleshooting

If you encounter errors:

1. **404 Errors**: Make sure all files are in the correct location and named exactly as specified
2. **JavaScript Errors**: Check the browser console for details about the error
3. **Loading Issues**: Ensure all dependencies (React, Recharts, etc.) are loading correctly

## Production Recommendations

For production use, consider:

1. Installing Tailwind CSS as a PostCSS plugin instead of using the CDN
2. Precompiling scripts with Babel instead of using the in-browser transformer
3. Using a proper build tool like Webpack or Vite for better performance
4. Implementing server-side rendering for improved SEO and performance