'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Users } from 'lucide-react';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';
import RolloutPercentageSlider from './RolloutPercentageSlider';
import UserWhitelistManager from './UserWhitelistManager';
import toast from 'react-hot-toast';

/**
 * Edit Feature Flag Modal
 * Modal for editing an existing feature flag
 */
export default function EditFeatureFlagModal({ flag, isOpen, onClose }) {
  const { updateFlag, deleteFlag } = useFeatureFlagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // general, users, advanced
  const [formData, setFormData] = useState({
    description: flag.description || '',
    enabled: flag.enabled || false,
    rolloutPercentage: flag.rolloutPercentage || 0,
    segments: flag.segments || []
  });
  const [segmentInput, setSegmentInput] = useState('');

  // Update form data when flag changes
  useEffect(() => {
    setFormData({
      description: flag.description || '',
      enabled: flag.enabled || false,
      rolloutPercentage: flag.rolloutPercentage || 0,
      segments: flag.segments || []
    });
  }, [flag]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle rollout change
  const handleRolloutChange = (percentage) => {
    setFormData(prev => ({ ...prev, rolloutPercentage: percentage }));
  };

  // Add segment
  const handleAddSegment = () => {
    if (segmentInput.trim() && !formData.segments.includes(segmentInput.trim())) {
      setFormData(prev => ({
        ...prev,
        segments: [...prev.segments, segmentInput.trim()]
      }));
      setSegmentInput('');
    }
  };

  // Remove segment
  const handleRemoveSegment = (segment) => {
    setFormData(prev => ({
      ...prev,
      segments: prev.segments.filter(s => s !== segment)
    }));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await updateFlag(flag.name, formData);
      toast.success(`Feature flag "${flag.name}" updated successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to update feature flag: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the feature flag "${flag.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteFlag(flag.name);
      toast.success(`Feature flag "${flag.name}" deleted successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to delete feature flag: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Feature Flag
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {flag.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              User Overrides
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'advanced'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Advanced
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what this feature flag controls..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Enabled Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Feature Enabled
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Master switch for this feature flag
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="enabled"
                  checked={formData.enabled}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Rollout Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rollout Percentage
                </label>
                <RolloutPercentageSlider
                  value={formData.rolloutPercentage}
                  onChange={handleRolloutChange}
                />
              </div>

              {/* Segments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Segments
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={segmentInput}
                    onChange={(e) => setSegmentInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSegment())}
                    placeholder="e.g., beta-users, premium-users"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleAddSegment}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
                
                {/* Segment Tags */}
                {formData.segments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.segments.map((segment) => (
                      <span
                        key={segment}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 
                                 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        {segment}
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(segment)}
                          className="hover:text-blue-600 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UserWhitelistManager flagName={flag.name} />
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              {/* Metadata */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(flag.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Modified:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {new Date(flag.lastModified).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Deleting a feature flag is permanent and cannot be undone. All user overrides and settings will be lost.
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors
                           disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Feature Flag
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                       rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
