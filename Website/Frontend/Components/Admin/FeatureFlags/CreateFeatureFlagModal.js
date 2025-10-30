'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';
import RolloutPercentageSlider from './RolloutPercentageSlider';
import toast from 'react-hot-toast';

/**
 * Create Feature Flag Modal
 * Modal for creating a new feature flag
 */
export default function CreateFeatureFlagModal({ isOpen, onClose }) {
  const { createFlag } = useFeatureFlagStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    enabled: false,
    rolloutPercentage: 0,
    segments: []
  });
  const [segmentInput, setSegmentInput] = useState('');

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

    // Validation
    if (!formData.name.trim()) {
      toast.error('Flag name is required');
      return;
    }

    // Convert name to uppercase with underscores
    const flagName = formData.name.trim().toUpperCase().replace(/\s+/g, '_');

    setIsSubmitting(true);
    try {
      await createFlag(flagName, {
        enabled: formData.enabled,
        description: formData.description.trim(),
        rolloutPercentage: formData.rolloutPercentage,
        segments: formData.segments
      });

      toast.success(`Feature flag "${flagName}" created successfully`);
      onClose();
    } catch (error) {
      toast.error(`Failed to create feature flag: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create Feature Flag
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Flag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Flag Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., ENABLE_NEW_FEATURE"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Will be converted to uppercase with underscores
            </p>
          </div>

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
                Enable Immediately
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Turn on this feature flag right away
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
            
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Common segments: all, beta-users, premium-users, internal-team, vip-users
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
                  Creating...
                </>
              ) : (
                'Create Flag'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
