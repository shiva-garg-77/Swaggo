/**
 * @fileoverview Feature flag manager component for admin panel
 * @module Components/FeatureFlags/FeatureFlagManager
 */

'use client';

import React, { useState } from 'react';
import { useFeatureFlags } from '../../context/FeatureFlagContext';
import { AccessibleButton } from '../Accessibility/AccessibilityUtils';

/**
 * Feature flag manager component
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 */
export default function FeatureFlagManager({ className = '' }) {
  const { 
    featureFlags, 
    isEnabled, 
    toggleFeature, 
    resetToDefaults, 
    FEATURES,
    getEnabledFeatures
  } = useFeatureFlags();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, enabled, disabled

  // Filter features based on search term and filter
  const filteredFeatures = Object.entries(FEATURES).filter(([key, value]) => {
    // Search filter
    if (searchTerm && !value.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filter === 'enabled' && !isEnabled(value)) {
      return false;
    }
    
    if (filter === 'disabled' && isEnabled(value)) {
      return false;
    }
    
    return true;
  });

  // Group features by category
  const groupedFeatures = filteredFeatures.reduce((groups, [key, value]) => {
    let category = 'Other';
    
    if (value.includes('voice') || value.includes('video') || value.includes('call')) {
      category = 'Communication';
    } else if (value.includes('message') || value.includes('chat')) {
      category = 'Messaging';
    } else if (value.includes('auth') || value.includes('security')) {
      category = 'Security';
    } else if (value.includes('theme') || value.includes('ui') || value.includes('ux')) {
      category = 'UI/UX';
    } else if (value.includes('performance') || value.includes('loading')) {
      category = 'Performance';
    } else if (value.includes('ai') || value.includes('smart')) {
      category = 'AI/ML';
    } else if (value.includes('experimental') || value.includes('beta')) {
      category = 'Experimental';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    
    groups[category].push([key, value]);
    return groups;
  }, {});

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Feature Flag Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage application features and experiments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {Object.keys(featureFlags).length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Features</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {getEnabledFeatures.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Enabled Features</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {Object.keys(featureFlags).length - getEnabledFeatures.length}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Disabled Features</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Features</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
            
            <AccessibleButton
              onClick={resetToDefaults}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition-colors"
            >
              Reset to Defaults
            </AccessibleButton>
          </div>
        </div>
      </div>

      {/* Feature List */}
      <div className="space-y-6">
        {Object.entries(groupedFeatures).map(([category, features]) => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {category}
              </h2>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {features.map(([key, feature]) => (
                <div key={feature} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {feature}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {key}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isEnabled(feature)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {isEnabled(feature) ? 'Enabled' : 'Disabled'}
                    </span>
                    
                    <AccessibleButton
                      onClick={() => toggleFeature(feature)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        isEnabled(feature)
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {isEnabled(feature) ? 'Disable' : 'Enable'}
                    </AccessibleButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            No features found matching your criteria
          </div>
        </div>
      )}
    </div>
  );
}