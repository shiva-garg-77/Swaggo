// main.js - Entry point for the frontend application

// Import global styles
import './styles/globals.css';
import './styles/components.css';

// Import theme provider
import { ThemeProvider } from './Helper/ThemeProvider';

// Import monitoring services
import { frontendMonitoringService } from './monitoring';

// Import main application component
import App from './App';

// Initialize monitoring service
if (frontendMonitoringService) {
  console.log('Frontend monitoring service initialized');
  
  // Add page visibility tracking
  document.addEventListener('visibilitychange', () => {
    frontendMonitoringService.recordUserInteraction('visibility_change', {
      state: document.visibilityState
    });
  });
  
  // Add beforeunload tracking
  window.addEventListener('beforeunload', () => {
    frontendMonitoringService.recordUserInteraction('page_unload', {
      timestamp: Date.now()
    });
    
    // Flush any pending data
    frontendMonitoringService.flush();
  });
}

// Render the application
const root = document.getElementById('root');
if (root) {
  // Create the root component with theme provider
  const app = new ThemeProvider({
    children: new App()
  });
  
  // Mount the application
  root.appendChild(app.render());
  
  console.log('SwagGo Frontend Application Initialized');
} else {
  console.error('Root element not found. Make sure there is a div with id="root" in your HTML.');
}