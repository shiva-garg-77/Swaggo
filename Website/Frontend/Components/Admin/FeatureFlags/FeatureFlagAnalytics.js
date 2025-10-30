'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Activity, BarChart3, PieChart, Calendar } from 'lucide-react';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';

/**
 * Feature Flag Analytics Component
 * Shows usage statistics and adoption metrics for feature flags
 */
export default function FeatureFlagAnalytics({ flagName, theme = 'light' }) {
  const { flags } = useFeatureFlagStore();
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, all
  const [isLoading, setIsLoading] = useState(true);

  const isDark = theme === 'dark';
  const flag = flags.find(f => f.name === flagName);

  useEffect(() => {
    // Simulate fetching analytics data
    // In production, this would call an API endpoint
    const fetchAnalytics = async () => {
      setIsLoading(true);
      
      // Simulated data - replace with actual API call
      setTimeout(() => {
        setAnalytics({
          totalChecks: Math.floor(Math.random() * 10000) + 1000,
          uniqueUsers: Math.floor(Math.random() * 1000) + 100,
          enabledCount: Math.floor(Math.random() * 800) + 50,
          disabledCount: Math.floor(Math.random() * 200) + 20,
          adoptionRate: Math.floor(Math.random() * 100),
          checksOverTime: generateTimeSeriesData(timeRange),
          userSegments: [
            { name: 'Beta Users', count: 45, percentage: 30 },
            { name: 'Premium Users', count: 30, percentage: 20 },
            { name: 'Regular Users', count: 75, percentage: 50 }
          ],
          topUsers: [
            { username: 'user1', checks: 234 },
            { username: 'user2', checks: 189 },
            { username: 'user3', checks: 156 },
            { username: 'user4', checks: 142 },
            { username: 'user5', checks: 128 }
          ]
        });
        setIsLoading(false);
      }, 500);
    };

    if (flagName) {
      fetchAnalytics();
    }
  }, [flagName, timeRange]);

  const generateTimeSeriesData = (range) => {
    const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return Array.from({ length: points }, (_, i) => ({
      label: range === '24h' ? `${i}:00` : `Day ${i + 1}`,
      checks: Math.floor(Math.random() * 500) + 100
    }));
  };

  if (!flag) {
    return (
      <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p>Select a feature flag to view analytics</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Analytics: {flag.name}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {flag.description || 'No description'}
          </p>
        </div>

        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${
            isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Activity}
          label="Total Checks"
          value={analytics.totalChecks.toLocaleString()}
          theme={theme}
          color="blue"
        />
        <MetricCard
          icon={Users}
          label="Unique Users"
          value={analytics.uniqueUsers.toLocaleString()}
          theme={theme}
          color="green"
        />
        <MetricCard
          icon={TrendingUp}
          label="Adoption Rate"
          value={`${analytics.adoptionRate}%`}
          theme={theme}
          color="purple"
        />
        <MetricCard
          icon={BarChart3}
          label="Enabled/Disabled"
          value={`${analytics.enabledCount}/${analytics.disabledCount}`}
          theme={theme}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Checks Over Time */}
        <div className={`p-6 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Activity className="w-5 h-5" />
            Checks Over Time
          </h3>
          <div className="space-y-2">
            {analytics.checksOverTime.slice(-10).map((point, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`text-xs w-16 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {point.label}
                </span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(point.checks / 500) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{point.checks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Segments */}
        <div className={`p-6 rounded-lg border ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <PieChart className="w-5 h-5" />
            User Segments
          </h3>
          <div className="space-y-4">
            {analytics.userSegments.map((segment, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {segment.name}
                  </span>
                  <span className={`text-sm ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {segment.count} users ({segment.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      index === 0 ? 'bg-blue-600' :
                      index === 1 ? 'bg-green-600' :
                      'bg-purple-600'
                    }`}
                    style={{ width: `${segment.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className={`p-6 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          <Users className="w-5 h-5" />
          Top Users by Checks
        </h3>
        <div className="space-y-3">
          {analytics.topUsers.map((user, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isDark ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-700'
                }`}>
                  {index + 1}
                </div>
                <span className={`font-medium ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {user.username}
                </span>
              </div>
              <span className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user.checks} checks
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Flag Status */}
      <div className={`p-6 rounded-lg border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          Current Configuration
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
            <p className={`text-lg font-semibold ${
              flag.enabled ? 'text-green-600' : 'text-red-600'
            }`}>
              {flag.enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Rollout</p>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {flag.rolloutPercentage || 100}%
            </p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Whitelisted</p>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {flag.userOverrides?.length || 0} users
            </p>
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</p>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {new Date(flag.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, theme, color }) {
  const isDark = theme === 'dark';
  
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  };

  return (
    <div className={`p-6 rounded-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
