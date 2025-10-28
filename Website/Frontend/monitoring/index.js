/**
 * Monitoring Services Index
 * Export all monitoring-related services
 */

import errorMonitoringService from './ErrorMonitoringService.js';
import frontendMonitoringService from '../services/FrontendMonitoringService.js';
import productionSecurityMonitoring from './ProductionSecurityMonitoring.js';

export {
  errorMonitoringService,
  frontendMonitoringService,
  productionSecurityMonitoring
};

export default {
  errorMonitoringService,
  frontendMonitoringService,
  productionSecurityMonitoring
};