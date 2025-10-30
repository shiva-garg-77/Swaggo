'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFixedSecureAuth } from '../../../../context/FixedSecureAuthContext';
import FeatureFlagTable from '../../../../Components/Admin/FeatureFlags/FeatureFlagTable';
import CreateFeatureFlagModal from '../../../../Components/Admin/FeatureFlags/CreateFeatureFlagModal';
import { useFeatureFlags } from '../../../../hooks/useFeatureFlag';
import { RefreshCw, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Feature Flags Admin Page
 * Allows admins to manage feature flags
 */
export default function FeatureFlagsPage() {
  const { user, loading: authLoading } = useFixedSecureAuth();
  const router = useRouter();
  const { flags, isLoading, error, refresh, clearError } = useFeatureFlags();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('Feature flags refreshed');
    } catch (error) {
      toast.error('Failed to refresh feature flags');
    }
  };

  // Filter flags based on search and category
  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         flag.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || 
                           (filterCategory === 'enabled' && flag.enabled) ||
                           (filterCategory === 'disabled' && !flag.enabled);
    
    return matchesSearch && matchesCategory;
  });

  // Show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render if user is admin
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Feature Flags Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Control feature rollouts, A/B testing, and user segments
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading feature flags
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ×
            </button>
          </div>
        )}

        {/* Actions Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search feature flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Flags</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              {/* Create Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                         transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Flag
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">{flags.length}</span> total flags
            </div>
            <div>
              <span className="font-medium text-green-600 dark:text-green-400">
                {flags.filter(f => f.enabled).length}
              </span> enabled
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {flags.filter(f => !f.enabled).length}
              </span> disabled
            </div>
          </div>
        </div>

        {/* Feature Flags Table */}
        <FeatureFlagTable flags={filteredFlags} isLoading={isLoading} />

        {/* Create Modal */}
        {showCreateModal && (
          <CreateFeatureFlagModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
