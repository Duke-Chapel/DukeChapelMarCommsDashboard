// This is a bridge file to make the ESM-style components available on the window object
// for compatibility with the existing HTML files
import WebDashboard from './web-dashboard.jsx';
window.WebDashboard = { default: WebDashboard };