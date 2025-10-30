'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Save, Clock } from 'lucide-react';
import { UPDATE_SCHEDULED_MESSAGE } from '../../../lib/graphql/scheduledMessages';
import { useScheduledMessageStore } from '../../../store/scheduledMessageStore';
import DateTimePicker from '../../Helper/DateTimePicker';
import toast from 'react-hot-toast';

/**
 * Edit Scheduled Message Modal
 * Modal for editing existing scheduled messages
 */
export default function EditScheduledMessageModal({ scheduledMessage, isOpen, onClose, theme = 'light' }) {
  const { updateScheduledMessage } = useScheduledMessageStore();
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [updateScheduledMessageMutation] = useMutation(UPDATE_SCHEDULED_MESSAGE);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (scheduledMessage) {
      setContent(scheduledMessage.content || '');
      setScheduledFor(scheduledMessage.scheduledFor || '');
    }
  }, [scheduledMessage]);

  const handleSubmit = async () => {
    if (!content.trim() || !scheduledFor) {
      toast.error('Please fill in all fields');
      return;
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      toast.error('Cannot schedule messages in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await updateScheduledMessageMutation({
        variables: {
          scheduledMessageId: scheduledMessage.scheduledMessageId,
          input: {
            content: content.trim(),
            scheduledFor
          }
        }
      });

      updateScheduledMessage(scheduledMessage.scheduledMessageId, {
        content: content.trim(),
        scheduledFor
      });

      toast.success('Scheduled message updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update scheduled message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !scheduledMessage) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`rounded-lg shadow-xl max-w-lg w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Scheduled Message
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Message Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Message *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className={`w-full px-4 py-2 rounded-lg border resize-none ${
                isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          {/* Date/Time Picker */}
          <DateTimePicker
            value={scheduledFor}
            onChange={setScheduledFor}
            theme={theme}
          />

          {/* Current Schedule Info */}
          {scheduledMessage.scheduledFor && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Currently scheduled for:
              </p>
              <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {new Date(scheduledMessage.scheduledFor).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || !scheduledFor}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
