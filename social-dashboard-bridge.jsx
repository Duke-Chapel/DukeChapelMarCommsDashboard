// This is a bridge file to make the ESM-style components available on the window object
// for compatibility with the existing HTML files
import SocialDashboard from './social-dashboard.jsx';
window.SocialDashboard = { default: SocialDashboard };