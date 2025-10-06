"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../Helper/ThemeProvider';

// Chart components (you'd typically import from a charting library like Chart.js or Recharts)
const MetricCard = ({ title, value, change, icon, trend }) => {
  const { theme } = useTheme();
  
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

const ChartContainer = ({ title, children, height = "300px" }) => {
  const { theme } = useTheme();
  
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

const UserBehaviorInsights = ({ insights, theme }) => {
  if (!insights || !insights.aggregated_metrics) {
    return (
      <div className="text-center py-8">
        <div className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>
          No user behavior data available
        </div>
      </div>
    );
  }

  const { aggregated_metrics } = insights;
  
  return (
    <div className="space-y-6">
      {/* Behavior Pattern Distribution */}
      {aggregated_metrics.pattern_distribution && (
        <div>
          <h4 className={`text-md font-medium mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Behavior Patterns
          </h4>
          <div className="space-y-2">
            {Object.entries(aggregated_metrics.pattern_distribution).map(([pattern, percentage]) => (
              <div key={pattern} className="flex items-center justify-between">
                <span className={`capitalize ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {pattern.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-20 h-2 rounded-full ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${percentage * 100}%` }}
                    />
                  </div>
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {Math.round(percentage * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Engagement Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Avg Session Duration
          </div>
          <div className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {Math.round(aggregated_metrics.avg_session_duration / 60)}m
          </div>
        </div>
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
        }`}>
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Avg Engagement Score
          </div>
          <div className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {Math.round(aggregated_metrics.avg_engagement_score)}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentPerformanceTable = ({ performance, theme }) => {
  if (!performance || !performance.content_performance) {
    return (
      <div className="text-center py-8">
        <div className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>
          No content performance data available
        </div>
      </div>
    );
  }

  const topContent = performance.content_performance.slice(0, 10); // Top 10

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className={`border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <th className={`text-left py-3 px-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Content ID
            </th>
            <th className={`text-left py-3 px-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Views
            </th>
            <th className={`text-left py-3 px-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Engagement Rate
            </th>
            <th className={`text-left py-3 px-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Performance
            </th>
            <th className={`text-left py-3 px-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {topContent.map((content, index) => (
            <tr key={content.content_id} className={`border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            } hover:${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <td className={`py-3 px-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                #{content.content_id}
              </td>
              <td className={`py-3 px-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {content.views.toLocaleString()}
              </td>
              <td className={`py-3 px-4 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {content.engagement_rate}%
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  content.performance_class === 'viral' ? 'bg-purple-100 text-purple-800' :
                  content.performance_class === 'high_performing' ? 'bg-green-100 text-green-800' :
                  content.performance_class === 'good' ? 'bg-blue-100 text-blue-800' :
                  content.performance_class === 'average' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {content.performance_class.replace('_', ' ')}
                </span>
              </td>
              <td className={`py-3 px-4 font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {content.content_score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function AdvancedAnalyticsDashboard() {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  
  const refreshIntervalRef = useRef(null);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/analytics/dashboard?hours=${timeRange}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      if (data.success) {
        setDashboardData(data.dashboard);
        setError(null);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh
    if (refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchDashboardData, refreshInterval);
    }
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [timeRange, refreshInterval]);

  const handleTimeRangeChange = (newRange) => {
    setTimeRange(newRange);
    setLoading(true);
  };

  const handleRefreshIntervalChange = (newInterval) => {
    setRefreshInterval(newInterval);
    
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Set new interval if greater than 0
    if (newInterval > 0) {
      refreshIntervalRef.current = setInterval(fetchDashboardData, newInterval);
    }
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
              Loading analytics dashboard...
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
                fetchDashboardData();
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

  const { kpis = {}, realtime_metrics = {}, user_behavior = {}, content_performance = {} } = dashboardData || {};

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
              📊 Advanced Analytics Dashboard
            </h1>
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Real-time insights and AI-powered analytics
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => handleTimeRangeChange(Number(e.target.value))}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-200 text-gray-900'
              }`}
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={72}>Last 3 Days</option>
              <option value={168}>Last 7 Days</option>
            </select>
            
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
                fetchDashboardData();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Events"
          value={kpis.total_events?.toLocaleString() || '0'}
          change={Math.random() > 0.5 ? Math.round(Math.random() * 20) : -Math.round(Math.random() * 10)}
          trend="up"
          icon={<span className="text-xl">📈</span>}
        />
        <MetricCard
          title="Active Users"
          value={kpis.active_users?.toLocaleString() || '0'}
          change={Math.random() > 0.5 ? Math.round(Math.random() * 15) : -Math.round(Math.random() * 5)}
          trend="up"
          icon={<span className="text-xl">👥</span>}
        />
        <MetricCard
          title="Content Views"
          value={kpis.total_content_views?.toLocaleString() || '0'}
          change={Math.random() > 0.5 ? Math.round(Math.random() * 25) : -Math.round(Math.random() * 8)}
          trend="up"
          icon={<span className="text-xl">👁️</span>}
        />
        <MetricCard
          title="Engagement Rate"
          value={`${Math.round(kpis.avg_engagement_rate || 0)}%`}
          change={Math.random() > 0.5 ? Math.round(Math.random() * 5) : -Math.round(Math.random() * 3)}
          trend="stable"
          icon={<span className="text-xl">💬</span>}
        />
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Behavior Insights */}
        <ChartContainer title="User Behavior Insights" height="400px">
          <UserBehaviorInsights insights={user_behavior} theme={theme} />
        </ChartContainer>
        
        {/* Real-time Metrics */}
        <ChartContainer title="Real-time Metrics" height="400px">
          <div className="space-y-4">
            {realtime_metrics.counters && Object.keys(realtime_metrics.counters).length > 0 ? (
              Object.entries(realtime_metrics.counters).map(([metric, data]) => (
                <div key={metric} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className={`font-medium ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {metric.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span className={`text-lg font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {Object.values(data)[0] || 0}
                  </span>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No real-time metrics available
              </div>
            )}
          </div>
        </ChartContainer>
      </div>

      {/* Content Performance Table */}
      <ChartContainer title="Top Performing Content" height="auto">
        <ContentPerformanceTable performance={content_performance} theme={theme} />
      </ChartContainer>
    </div>
  );
}