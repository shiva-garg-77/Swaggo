'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { X, Clock, Send } from 'lucide-react';
import { CREATE_SCHEDULED_MESSAGE } from '../../../lib/graphql/scheduledMessages';
import { useScheduledMessageStore } from '../../../store/scheduledMessageStore';
import DateTimePicker from '../../Helper/DateTimePicker';
import toast from 'react-hot-toast';

export default function ScheduleMessageModal({ chatid, isOpen, onClose, theme = 'light' }) {
  const { addScheduledMessage } = useScheduledMessageStore();
  const [content, setContent] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createScheduledMessage] = useMutation(CREATE_SCHEDULED_MESSAGE);
  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    if (!content.trim() || !scheduledFor) {
      toast.error('Please enter message and select date/time');
      return;
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      toast.error('Cannot schedule messages in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await createScheduledMessage({
        variables: {
          input: { chatid, content: content.trim(), scheduledFor }
        }
      });

      addScheduledMessage(data.createScheduledMessage);
      toast.success('Message scheduled successfully!');
      setContent('');
      setScheduledFor('');
      onClose();
    } catch (error) {
      toast.error('Failed to schedule message');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`rounded-lg shadow-xl max-w-lg w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Schedule Message</h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Message *</label>
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
          <DateTimePicker value={scheduledFor} onChange={setScheduledFor} theme={theme} />
        </div>
        <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={onClose} className={`px-4 py-2 rounded-lg ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim() || !scheduledFor}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Scheduling...' : 'Schedule Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
