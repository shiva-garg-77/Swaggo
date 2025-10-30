'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Trash2, Edit3 } from 'lucide-react';
import { UPDATE_HIGHLIGHT, DELETE_HIGHLIGHT } from '../../../lib/graphql/highlightQueries';
import { useHighlightStore } from '../../../store/highlightStore';
import HighlightCoverSelector from './HighlightCoverSelector';
import toast from 'react-hot-toast';

/**
 * Edit Highlight Modal
 * Modal for editing existing highlights
 */
export default function EditHighlightModal({ highlight, isOpen, onClose, theme = 'light' }) {
  const { updateHighlight, removeHighlight } = useHighlightStore();
  const [highlightName, setHighlightName] = useState('');
  const [selectedCover, setSelectedCover] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [updateHighlightMutation] = useMutation(UPDATE_HIGHLIGHT);
  const [deleteHighlightMutation] = useMutation(DELETE_HIGHLIGHT);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (highlight) {
      setHighlightName(highlight.title || '');
      setSelectedCover(highlight.coverImage);
    }
  }, [highlight]);

  const handleUpdate = async () => {
    if (!highlightName.trim()) {
      toast.error('Please enter a highlight name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await updateHighlightMutation({
        variables: {
          highlightid: highlight.highlightid,
          title: highlightName.trim(),
          coverImage: selectedCover
        }
      });

      updateHighlight(highlight.highlightid, {
        title: highlightName.trim(),
        coverImage: selectedCover
      });
      
      toast.success('Highlight updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating highlight:', error);
      toast.error('Failed to update highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteHighlightMutation({
        variables: {
          highlightid: highlight.highlightid
        }
      });

      removeHighlight(highlight.highlightid);
      toast.success('Highlight deleted successfully!');
      onClose();
    } catch (error) {
      console.error('Error deleting highlight:', error);
      toast.error('Failed to delete highlight');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !highlight) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Edit3 className="w-6 h-6 text-blue-500" />
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Edit Highlight
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Preview */}
          <div className="text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600 mx-auto mb-3">
              <img
                src={selectedCover || highlight.coverImage}
                alt={highlightName}
                className="w-full h-full object-cover"
              />
            </div>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {highlight.stories?.length || 0} {highlight.stories?.length === 1 ? 'story' : 'stories'}
            </p>
          </div>

          {/* Name Input */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Highlight Name *
            </label>
            <input
              type="text"
              value={highlightName}
              onChange={(e) => setHighlightName(e.target.value)}
              placeholder="Enter highlight name"
              maxLength={50}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Cover Selection */}
          <HighlightCoverSelector
            stories={highlight.stories || []}
            selectedCover={selectedCover}
            onCoverSelect={setSelectedCover}
            theme={theme}
          />

          {/* Stories Grid */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Stories in this highlight
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {highlight.stories?.map((story) => (
                <div key={story.storyid} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={story.mediaUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className={`border-2 border-red-200 dark:border-red-800 rounded-lg p-4 ${
            isDark ? 'bg-red-900/10' : 'bg-red-50'
          }`}>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Danger Zone
            </h3>
            <p className={`text-sm mb-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Deleting this highlight is permanent and cannot be undone.
            </p>
            
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Highlight
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Are you sure you want to delete this highlight?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSubmitting || !highlightName.trim()}
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
      </div>
    </div>
  );
}
