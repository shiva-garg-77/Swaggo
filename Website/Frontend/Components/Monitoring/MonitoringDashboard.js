"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';

const MetricCard = ({ title, value, change, icon, trend, theme }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-xl border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      } shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          trend === 'up' ? 'bg-green-100 text-green-600' :
          trend === 'down' ? 'bg-red-100 text-red-600' :
          'bg-blue-100 text-blue-600'
        }`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center text-sm ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? '↗' : '↘'} {Math.abs(change)}%
          </div>
        )}
      </div>
      <h3 className={`text-sm font-medium ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        {title}
      </h3>
      <p className={`text-2xl font-bold mt-2 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {value}
      </p>
    </motion.div>
  );
};

const ChartContainer = ({ title, children, height = "300px", theme }) => {
  return (
    <div className={`p-6 rounded-xl border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    } shadow-sm`}>
      <h3 className={`text-lg font-semibold mb-4 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        {title}
      </h3>
      <div style={{ height }} className="relative">
        {children}
      </div>
    </div>
  );
};

export default function MonitoringDashboard() {
  const { theme } = useTheme();
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring/frontend', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch monitoring data');
      }
      
      const data = await response.json();
      if (data.success) {
        setMonitoringData(data);
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Monitoring data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Set up auto-refresh
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMonitoringData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [timeRange, refreshInterval]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setLoading(true);
  };

  const handleRefreshIntervalChange = (newInterval) => {
    setRefreshInterval(newInterval);
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
              Loading monitoring dashboard...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen p-6 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-center h-96">
          <div className={`p-6 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } border text-center`}>
            <div className="text-red-500 text-lg mb-2">⚠️ Error</div>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              {error}
            </p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchMonitoringData();
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { errors = [], performance = [], interactions = [], summary = {} } = monitoringData || {};

  // Calculate metrics
  const totalErrors = errors.length;
  const totalPerformanceMetrics = performance.length;
  const totalInteractions = interactions.length;
  
  // Get recent errors
  const recentErrors = errors.slice(-10);
  
  // Get error types distribution
  const errorTypes = errors.reduce((acc, error) => {
    const type = error.error?.name || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  // Get performance metrics by type
  const performanceByType = performance.reduce((acc, metric) => {
    const type = metric.type || 'Unknown';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(metric);
    return acc;
  }, {});
  
  // Get interaction types distribution
  const interactionTypes = interactions.reduce((acc, interaction) => {
    const type = interaction.type || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={`min-h-screen p-6 ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              📊 Monitoring Dashboard
            </h1>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Real-time frontend monitoring and observability
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Refresh Interval Selector */}
            <select
              value={refreshInterval}
              onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value={0}>Manual</option>
              <option value={10000}>10 seconds</option>
              <option value={30000}>30 seconds</option>
              <option value={60000}>1 minute</option>
              <option value={300000}>5 minutes</option>
            </select>
            
            {/* Manual Refresh Button */}
            <button
              onClick={() => {
                setLoading(true);
                fetchMonitoringData();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Errors"
          value={totalErrors}
          change={null}
          trend="stable"
          icon={<span className="text-xl">🚨</span>}
          theme={theme}
        />
        <MetricCard
          title="Performance Metrics"
          value={totalPerformanceMetrics}
          change={null}
          trend="stable"
          icon={<span className="text-xl">⚡</span>}
          theme={theme}
        />
        <MetricCard
          title="User Interactions"
          value={totalInteractions}
          change={null}
          trend="stable"
          icon={<span className="text-xl">🖱️</span>}
          theme={theme}
        />
        <MetricCard
          title="Active Sessions"
          value={summary.totalErrors ? 'N/A' : '0'}
          change={null}
          trend="stable"
          icon={<span className="text-xl">👥</span>}
          theme={theme}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Error Distribution */}
        <ChartContainer title="Error Distribution" height="300px" theme={theme}>
          <div className="space-y-4">
            {Object.keys(errorTypes).length > 0 ? (
              Object.entries(errorTypes).map(([errorType, count]) => (
                <div key={errorType} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {errorType}
                  </span>
                  <span className={`text-lg font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No errors recorded
              </div>
            )}
          </div>
        </ChartContainer>
        
        {/* Interaction Types */}
        <ChartContainer title="Interaction Types" height="300px" theme={theme}>
          <div className="space-y-4">
            {Object.keys(interactionTypes).length > 0 ? (
              Object.entries(interactionTypes).map(([interactionType, count]) => (
                <div key={interactionType} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className={`font-medium capitalize ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {interactionType.replace('_', ' ')}
                  </span>
                  <span className={`text-lg font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No interactions recorded
              </div>
            )}
          </div>
        </ChartContainer>
      </div>

      {/* Recent Errors */}
      <ChartContainer title="Recent Errors" height="auto" theme={theme}>
        {recentErrors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <th className={`text-left py-3 px-4 font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Error Type
                  </th>
                  <th className={`text-left py-3 px-4 font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Message
                  </th>
                  <th className={`text-left py-3 px-4 font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentErrors.map((error, index) => (
                  <tr key={index} className={`border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  } hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <td className={`py-3 px-4 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {error.error?.name || 'Unknown'}
                    </td>
                    <td className={`py-3 px-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {error.error?.message?.substring(0, 50) || 'No message'}
                      {error.error?.message?.length > 50 ? '...' : ''}
                    </td>
                    <td className={`py-3 px-4 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No recent errors
          </div>
        )}
      </ChartContainer>

      {/* Performance Metrics by Type */}
      <ChartContainer title="Performance Metrics" height="auto" theme={theme}>
        {Object.keys(performanceByType).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(performanceByType).map(([metricType, metrics]) => (
              <div key={metricType} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <h4 className={`text-md font-medium mb-3 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {metricType.replace('_', ' ').toUpperCase()}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.slice(-6).map((metric, index) => (
                    <div key={index} className={`p-4 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {new Date(metric.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="mt-2">
                        {Object.entries(metric.data || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                              {key}:
                            </span>
                            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                              {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            No performance metrics recorded
          </div>
        )}
      </ChartContainer>
    </div>
  );
}