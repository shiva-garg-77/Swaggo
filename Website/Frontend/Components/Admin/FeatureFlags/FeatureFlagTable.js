'use client';

import { useState } from 'react';
import { Edit2, Trash2, Users, TrendingUp, MoreVertical } from 'lucide-react';
import FeatureFlagToggle from './FeatureFlagToggle';
import EditFeatureFlagModal from './EditFeatureFlagModal';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';
import toast from 'react-hot-toast';

/**
 * Feature Flag Table Component
 * Displays all feature flags in a table with actions
 */
export default function FeatureFlagTable({ flags, isLoading }) {
  const { deleteFlag } = useFeatureFlagStore();
  const [editingFlag, setEditingFlag] = useState(null);
  const [deletingFlag, setDeletingFlag] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // name, enabled, rollout, created
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  // Handle delete
  const handleDelete = async (flagName) => {
    if (!confirm(`Are you sure you want to delete the feature flag "${flagName}"?`)) {
      return;
    }

    setDeletingFlag(flagName);
    try {
      await deleteFlag(flagName);
      toast.success(`Feature flag "${flagName}" deleted successfully`);
    } catch (error) {
      toast.error(`Failed to delete feature flag: ${error.message}`);
    } finally {
      setDeletingFlag(null);
    }
  };

  // Sort flags
  const sortedFlags = [...flags].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'enabled':
        comparison = (a.enabled === b.enabled) ? 0 : a.enabled ? -1 : 1;
        break;
      case 'rollout':
        comparison = (a.rolloutPercentage || 0) - (b.rolloutPercentage || 0);
        break;
      case 'created':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      default:
        comparison = 0;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Loading state
  if (isLoading && flags.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading feature flags...</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (flags.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
        <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No feature flags found
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Create your first feature flag to get started with controlled rollouts
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Flag Name
                    {sortBy === 'name' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('enabled')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    {sortBy === 'enabled' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('rollout')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Rollout %
                    {sortBy === 'rollout' && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Segments
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFlags.map((flag) => (
                <tr 
                  key={flag.name}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Flag Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {flag.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(flag.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {flag.description || 'No description'}
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-6 py-4 text-center">
                    <FeatureFlagToggle
                      flagName={flag.name}
                      enabled={flag.enabled}
                    />
                  </td>

                  {/* Rollout Percentage */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${flag.rolloutPercentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {flag.rolloutPercentage || 0}%
                      </span>
                    </div>
                  </td>

                  {/* Segments */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {flag.segments?.length || 0}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditingFlag(flag)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(flag.name)}
                        disabled={deletingFlag === flag.name}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingFlag === flag.name ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingFlag && (
        <EditFeatureFlagModal
          flag={editingFlag}
          isOpen={!!editingFlag}
          onClose={() => setEditingFlag(null)}
        />
      )}
    </>
  );
}
