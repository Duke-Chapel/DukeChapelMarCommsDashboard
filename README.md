# Marketing Analytics Dashboard

A simple, elegant dashboard that displays marketing KPIs from CSV data using GitHub Pages.

## Overview

This dashboard visualizes marketing data from multiple sources including:
- Web Analytics (Google Analytics)
- Social Media (Facebook & Instagram)
- Email Marketing
- YouTube Analytics

## How to Use

1. Fork this repository
2. Enable GitHub Pages in your repository settings (Settings > Pages)
3. Download your marketing data CSVs from their respective platforms
4. Rename them according to the expected filenames (see below)
5. Upload them to the `data` folder in your repository
6. Your dashboard will automatically update with the new data

## Required CSV Files

Place these files in the `data` directory:

- `Email_Campaign_Performance.csv` - Email campaign metrics
- `FB_Videos.csv` - Facebook video performance
- `FB_Posts.csv` - Facebook post performance
- `IG_Posts.csv` - Instagram post performance
- `YouTube_Age.csv` - YouTube audience age demographics
- `YouTube_Gender.csv` - YouTube audience gender demographics
- `YouTube_Geography.csv` - YouTube audience by country
- `YouTube_Subscription_Status.csv` - YouTube subscriber statistics

Additional files for extended functionality:
- `FB_Audience.csv`
- `FB_Follows.csv`
- `FB_Interactions.csv`
- `FB_Link_clicks.csv`
- `FB_Reach.csv`
- `FB_Views.csv`
- `FB_Visits.csv`
- `GA_Demographics.csv`
- `GA_Pages_And_Screens.csv`
- `GA_Traffic_Acquisition.csv`
- `GA_UTMs.csv`
- `IG_Audience.csv`
- `IG_Follows.csv`
- `IG_Interactions.csv`
- `IG_Link_clicks.csv`
- `IG_Reach.csv`
- `IG_Views.csv`
- `IG_Visits.csv`
- `YouTube_Cities.csv`
- `YouTube_Content.csv`

## Features

- **Cross-Channel Overview**: See key metrics across all platforms
- **Web Analytics**: Track traffic sources, user demographics, and top pages
- **Social Media**: Analyze Facebook and Instagram performance
- **Email Marketing**: Monitor campaign performance and subscriber engagement
- **YouTube**: View audience demographics and content performance
- **Mobile-Friendly**: Responsive design works on all devices

## Customization

You can customize the dashboard by modifying:

1. `index.html` - Dashboard structure and layout
2. `dashboard.js` - Data processing and chart creation
3. CSS styles within `index.html`

## Technology

This dashboard uses:
- HTML, CSS, JavaScript
- [Bootstrap 5](https://getbootstrap.com/) for layout and styling
- [Chart.js](https://www.chartjs.org/) for data visualization
- [PapaParse](https://www.papaparse.com/) for CSV parsing

## Note

This is a client-side only solution. All data processing happens in your browser. No data is sent to any server for processing.
