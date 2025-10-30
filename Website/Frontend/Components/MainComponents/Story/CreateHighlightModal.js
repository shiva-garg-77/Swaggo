'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { CREATE_HIGHLIGHT_WITH_STORIES } from '../../../lib/graphql/highlightQueries';
import { useHighlightStore } from '../../../store/highlightStore';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import ExpiredStoriesSelector from './ExpiredStoriesSelector';
import HighlightCoverSelector from './HighlightCoverSelector';
import toast from 'react-hot-toast';

/**
 * Create Highlight Modal
 * 3-step wizard for creating new highlights
 */
export default function CreateHighlightModal({ isOpen, onClose, theme = 'light' }) {
  const { user } = useSecureAuth();
  const { addHighlight } = useHighlightStore();
  const [step, setStep] = useState(1); // 1: Select Stories, 2: Choose Cover, 3: Name & Create
  const [selectedStories, setSelectedStories] = useState([]);
  const [selectedCover, setSelectedCover] = useState(null);
  const [highlightName, setHighlightName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createHighlightMutation] = useMutation(CREATE_HIGHLIGHT_WITH_STORIES);

  const isDark = theme === 'dark';

  const handleNext = () => {
    if (step === 1 && selectedStories.length === 0) {
      toast.error('Please select at least one story');
      return;
    }
    if (step === 2 && !selectedCover) {
      toast.error('Please select a cover image');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreate = async () => {
    if (!highlightName.trim()) {
      toast.error('Please enter a highlight name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await createHighlightMutation({
        variables: {
          input: {
            profileid: user.profileid,
            title: highlightName.trim(),
            coverImage: selectedCover,
            storyIds: selectedStories.map(s => s.storyid)
          }
        }
      });

      addHighlight(data.createHighlightWithStories);
      toast.success('Highlight created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating highlight:', error);
      toast.error('Failed to create highlight');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedStories([]);
    setSelectedCover(null);
    setHighlightName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${ 
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-2xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Create Highlight
            </h2>
            <p className={`text-sm mt-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Step {step} of 3
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 p-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s === step ? 'w-12 bg-blue-600' : s < step ? 'w-8 bg-blue-400' : 'w-8 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Select Stories
              </h3>
              <ExpiredStoriesSelector
                selectedStories={selectedStories}
                onSelectionChange={setSelectedStories}
                theme={theme}
              />
            </div>
          )}

          {step === 2 && (
            <div>
              <HighlightCoverSelector
                stories={selectedStories}
                selectedCover={selectedCover}
                onCoverSelect={setSelectedCover}
                theme={theme}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-600 mx-auto mb-4">
                  <img
                    src={selectedCover}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className={`text-sm ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {selectedStories.length} {selectedStories.length === 1 ? 'story' : 'stories'} selected
                </p>
              </div>

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
                <p className={`text-xs mt-1 ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {highlightName.length}/50 characters
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  Preview
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {selectedStories.slice(0, 8).map((story) => (
                    <div key={story.storyid} className="aspect-square rounded-lg overflow-hidden">
                      <img
                        src={story.mediaUrl}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                {selectedStories.length > 8 && (
                  <p className={`text-xs mt-2 text-center ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    +{selectedStories.length - 8} more stories
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={step === 1 ? handleClose : handleBack}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isDark
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {step === 1 ? (
              'Cancel'
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Back
              </>
            )}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 && selectedStories.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isSubmitting || !highlightName.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Highlight
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
