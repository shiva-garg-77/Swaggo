import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, PieChart, TrendingUp, Users, CheckCircle, Clock, Award } from 'lucide-react';

const PollAnalytics = ({ chatId, pollService }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'week', 'month'

  useEffect(() => {
    fetchAnalytics();
  }, [chatId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await pollService.getAnalytics(chatId);
      setAnalytics(data);
    } catch (error) {
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
        {error}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Poll Analytics</h2>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BarChart className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Polls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalPolls}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Votes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalVotes}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Polls</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.activePolls}</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Award className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Votes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.averageVotesPerPoll.toFixed(1)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Poll Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Poll Status Distribution</h3>
          <div className="flex items-end justify-center h-48 space-x-4">
            <div className="flex flex-col items-center">
              <div 
                className="w-12 bg-blue-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(analytics.activePolls / Math.max(analytics.totalPolls, 1)) * 100}%` }}
              ></div>
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Active</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.activePolls}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div 
                className="w-12 bg-gray-500 rounded-t-lg transition-all duration-500"
                style={{ height: `${(analytics.closedPolls / Math.max(analytics.totalPolls, 1)) * 100}%` }}
              ></div>
              <span className="mt-2 text-sm text-gray-500 dark:text-gray-400">Closed</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.closedPolls}
              </span>
            </div>
          </div>
        </div>

        {/* Most Voted Poll */}
        {analytics.mostVotedPoll && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Most Popular Poll</h3>
            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Award className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="ml-4 flex-1">
                <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">
                  {analytics.mostVotedPoll.question}
                </h4>
                <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{analytics.mostVotedPoll.votes} votes</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participation Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Participation Overview</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-gray-700 dark:text-gray-300">Participation Rate</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {analytics.participationRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Based on chat members
            </div>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-green-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${analytics.participationRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PollAnalytics;