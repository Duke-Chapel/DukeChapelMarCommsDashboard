// Google Drive Data Utilities
// This module handles fetching and processing CSV data from Google Drive

// Convert a Google Drive sharing URL to a direct download URL
const getGoogleDriveDownloadUrl = (url) => {
  try {
    // Check if it's already a direct download URL
    if (url.includes('export=download')) {
      return url;
    }
    
    // Extract the file ID from various Google Drive URL formats
    let fileId = '';
    
    // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    if (url.includes('/file/d/')) {
      const match = url.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        fileId = match[1];
      }
    }
    // Format: https://drive.google.com/open?id=FILE_ID
    else if (url.includes('open?id=')) {
      const match = url.match(/open\?id=([^&]+)/);
      if (match && match[1]) {
        fileId = match[1];
      }
    }
    // Format: https://docs.google.com/spreadsheets/d/FILE_ID/edit?usp=sharing
    else if (url.includes('/spreadsheets/d/')) {
      const match = url.match(/\/spreadsheets\/d\/([^\/]+)/);
      if (match && match[1]) {
        fileId = match[1];
        // For Google Sheets, we need to use the export format
        return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=csv`;
      }
    }
    
    if (!fileId) {
      console.error('Could not extract Google Drive file ID from URL:', url);
      return url;
    }
    
    // Create direct download URL
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  } catch (error) {
    console.error('Error converting Google Drive URL:', error);
    return url;
  }
};

// Fetch CSV data from a Google Drive URL
const fetchGoogleDriveCSV = async (url) => {
  try {
    // Convert to direct download URL
    const downloadUrl = getGoogleDriveDownloadUrl(url);
    
    // Add a timestamp to bypass caching
    const cacheBuster = `&timestamp=${new Date().getTime()}`;
    const finalUrl = downloadUrl.includes('?') 
      ? `${downloadUrl}${cacheBuster}`
      : `${downloadUrl}?${cacheBuster.substring(1)}`;
    
    // Fetch the data
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
    }
    
    // Get the CSV content
    const csvText = await response.text();
    return csvText;
  } catch (error) {
    console.error('Error fetching Google Drive CSV:', error);
    throw error;
  }
};

// Parse CSV from Google Drive and process it for a dashboard
const fetchAndProcessGoogleDriveCSV = async (url, processFunction, params = {}) => {
  try {
    // Fetch the CSV text
    const csvText = await fetchGoogleDriveCSV(url);
    
    // Parse with Papa Parse
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Process the data with the provided function
          const processedData = processFunction(results.data, params);
          resolve(processedData);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error in fetchAndProcessGoogleDriveCSV:', error);
    throw error;
  }
};

// Test if a Google Drive URL is valid and accessible
const testGoogleDriveURL = async (url) => {
  try {
    const downloadUrl = getGoogleDriveDownloadUrl(url);
    const response = await fetch(downloadUrl, {
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing Google Drive URL:', error);
    return false;
  }
};

// Make utilities available globally
window.googleDriveUtils = {
  getGoogleDriveDownloadUrl,
  fetchGoogleDriveCSV,
  fetchAndProcessGoogleDriveCSV,
  testGoogleDriveURL
};