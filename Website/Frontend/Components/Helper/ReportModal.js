"use client";

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { useTheme } from './ThemeProvider';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import { REPORT_POST, REPORT_PROFILE } from '../../lib/graphql/postStatsQueries';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Universal Report Modal
 * For reporting posts, profiles, or other content
 */
export default function ReportModal({ 
  isOpen, 
  onClose, 
  type = 'post', // 'post', 'profile', 'story'
  targetId,
  targetUsername 
}) {
  const { theme } = useTheme();
  const { user } = useFixedSecureAuth();
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reportPost] = useMutation(REPORT_POST);
  const [reportProfile] = useMutation(REPORT_PROFILE);

  const reportReasons = {
    post: [
      { value: 'spam', label: 'Spam or misleading' },
      { value: 'inappropriate', label: 'Inappropriate content' },
      { value: 'violence', label: 'Violence or dangerous organizations' },
      { value: 'harassment', label: 'Bullying or harassment' },
      { value: 'hate_speech', label: 'Hate speech or symbols' },
      { value: 'false_info', label: 'False information' },
      { value: 'intellectual_property', label: 'Intellectual property violation' },
      { value: 'other', label: 'Something else' }
    ],
    profile: [
      { value: 'pretending', label: 'Pretending to be someone' },
      { value: 'fake_account', label: 'Fake account' },
      { value: 'inappropriate_content', label: 'Posts inappropriate things' },
      { value: 'harassment', label: 'Harassing or bullying' },
      { value: 'spam', label: 'Posting spam' },
      { value: 'underage', label: 'May be under 13 years old' },
      { value: 'other', label: 'Something else' }
    ],
    story: [
      { value: 'spam', label: 'Spam or misleading' },
      { value: 'inappropriate', label: 'Inappropriate content' },
      { value: 'violence', label: 'Violence or harm' },
      { value: 'harassment', label: 'Bullying or harassment' },
      { value: 'other', label: 'Something else' }
    ]
  };

  const reasons = reportReasons[type] || reportReasons.post;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      alert('Please select a reason');
      return;
    }

    if (!user?.profileid) {
      alert('Please login to report content');
      return;
    }

    setSubmitting(true);

    try {
      if (type === 'post') {
        await reportPost({
          variables: {
            profileid: user.profileid,
            postid: targetId,
            reason: selectedReason,
            description: description.trim() || null
          }
        });
      } else if (type === 'profile') {
        await reportProfile({
          variables: {
            profileid: user.profileid,
            reportedprofileid: targetId,
            reason: selectedReason,
            description: description.trim() || null
          }
        });
      }
      // Story reporting would use REPORT_STORY mutation

      alert('Report submitted successfully. We\'ll review this content.');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedReason('');
    setDescription('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`w-full max-w-md rounded-xl shadow-2xl ${
          theme === 'dark'
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h2 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Report {type === 'profile' ? 'Account' : type.charAt(0).toUpperCase() + type.slice(1)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {targetUsername && (
            <p className={`text-sm mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Reporting: @{targetUsername}
            </p>
          )}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className={`block text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Why are you reporting this?
              </label>
              <div className="space-y-2">
                {reasons.map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedReason === reason.value
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : theme === 'dark'
                        ? 'border-gray-700 hover:bg-gray-750'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mr-3 text-red-500 focus:ring-red-500"
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {reason.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Description */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Additional details (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context..."
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <p className={`text-xs mt-1 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {description.length}/500 characters
              </p>
            </div>

            {/* Warning */}
            <div className={`p-3 rounded-lg text-xs ${
              theme === 'dark'
                ? 'bg-yellow-900/20 text-yellow-300 border border-yellow-800'
                : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            }`}>
              <p className="font-medium mb-1">Before you submit:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your report is anonymous</li>
                <li>We may contact you for more information</li>
                <li>False reports may result in account restrictions</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              } disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || submitting}
              className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                selectedReason && !submitting
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
