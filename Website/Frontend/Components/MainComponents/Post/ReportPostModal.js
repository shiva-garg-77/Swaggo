'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, AlertTriangle, Check } from 'lucide-react';
import { REPORT_POST } from '../../../lib/graphql/postQueries';
import { useSecureAuth } from '../../../context/FixedSecureAuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../UI/ConfirmationModal';

/**
 * Report Post Modal
 * Allows users to report inappropriate content
 */
export default function ReportPostModal({ post, isOpen, onClose, theme = 'light' }) {
  const { user } = useSecureAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false); // Issue 5.10

  const [reportPost] = useMutation(REPORT_POST);

  const isDark = theme === 'dark';

  const reportReasons = [
    {
      value: 'spam',
      label: 'Spam',
      description: 'Repetitive or misleading content'
    },
    {
      value: 'harassment',
      label: 'Harassment or Bullying',
      description: 'Targeting or attacking someone'
    },
    {
      value: 'hate_speech',
      label: 'Hate Speech',
      description: 'Discriminatory or offensive content'
    },
    {
      value: 'violence',
      label: 'Violence or Dangerous Content',
      description: 'Promoting or depicting violence'
    },
    {
      value: 'nudity',
      label: 'Nudity or Sexual Content',
      description: 'Inappropriate sexual content'
    },
    {
      value: 'false_info',
      label: 'False Information',
      description: 'Misleading or fake content'
    },
    {
      value: 'intellectual_property',
      label: 'Intellectual Property Violation',
      description: 'Copyright or trademark infringement'
    },
    {
      value: 'self_harm',
      label: 'Self-Harm or Suicide',
      description: 'Content promoting self-harm'
    },
    {
      value: 'other',
      label: 'Other',
      description: 'Something else'
    }
  ];

  const handleSubmitClick = () => {
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    if (!user?.profileid) {
      toast.error('Please login to report posts');
      return;
    }

    // Show confirmation modal (Issue 5.10)
    setShowConfirmation(true);
  };

  const handleConfirmedSubmit = async () => {
    setShowConfirmation(false);
    setIsSubmitting(true);
    try {
      await reportPost({
        variables: {
          profileid: user.profileid,
          postid: post.postid,
          reason: selectedReason,
          description: description.trim() || null
        }
      });

      setSubmitted(true);
      toast.success('Report submitted successfully');
      
      // Close after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className={`rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className={`text-xl font-bold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Report Post
            </h2>
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

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            // Success State
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Report Submitted
              </h3>
              <p className={`text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Thank you for helping keep our community safe. We'll review this report shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Warning Message */}
              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-yellow-900/20 border border-yellow-800' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm ${
                  isDark ? 'text-yellow-400' : 'text-yellow-700'
                }`}>
                  ⚠️ False reports may result in account restrictions. Please only report content that violates our community guidelines.
                </p>
              </div>

              {/* Post Preview */}
              <div className={`p-3 rounded-lg border ${
                isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
              }`}>
                <p className={`text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Reporting this post:
                </p>
                <div className="flex gap-3">
                  {post.mediaUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={post.mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm line-clamp-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {post.caption || 'No caption'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reason Selection */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Why are you reporting this post? *
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setSelectedReason(reason.value)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedReason === reason.value
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : isDark
                          ? 'border-gray-700 hover:border-gray-600 bg-gray-700'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`font-medium ${
                            selectedReason === reason.value
                              ? 'text-red-600 dark:text-red-400'
                              : isDark
                              ? 'text-white'
                              : 'text-gray-900'
                          }`}>
                            {reason.label}
                          </p>
                          <p className={`text-sm mt-1 ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {reason.description}
                          </p>
                        </div>
                        {selectedReason === reason.value && (
                          <Check className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide any additional context that might help us review this report..."
                  rows={4}
                  maxLength={500}
                  className={`w-full px-3 py-2 rounded-lg border resize-none ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:ring-2 focus:ring-red-500 focus:border-transparent`}
                />
                <p className={`text-xs mt-1 text-right ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {description.length}/500
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div className={`flex items-center justify-end gap-3 p-6 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitClick}
              disabled={!selectedReason || isSubmitting}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal (Issue 5.10) */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmedSubmit}
        title="Confirm Report"
        message={`Are you sure you want to report this post for "${reportReasons.find(r => r.value === selectedReason)?.label}"? This action cannot be undone.`}
        confirmText="Yes, Report"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
