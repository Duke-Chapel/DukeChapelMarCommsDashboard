// This is a bridge file to make the ESM-style components available on the window object
// for compatibility with the existing HTML files
import YouTubeDashboard from './youtube-dashboard.jsx';
window.YouTubeDashboard = { default: YouTubeDashboard };