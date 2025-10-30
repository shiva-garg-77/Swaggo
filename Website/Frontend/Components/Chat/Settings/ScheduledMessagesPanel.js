'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { Clock, Plus } from 'lucide-react';
import { GET_SCHEDULED_MESSAGES_BY_CHAT, DELETE_SCHEDULED_MESSAGE, SEND_SCHEDULED_MESSAGE_NOW } from '../../../lib/graphql/scheduledMessages';
import { useScheduledMessageStore } from '../../../store/scheduledMessageStore';
import ScheduledMessageItem from '../Messaging/ScheduledMessageItem';
import ScheduleMessageModal from '../Messaging/ScheduleMessageModal';
import toast from 'react-hot-toast';

export default function ScheduledMessagesPanel({ chatid, theme = 'light' }) {
  const { scheduledMessages, setScheduledMessages, removeScheduledMessage } = useScheduledMessageStore();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const isDark = theme === 'dark';

  const { data, loading, refetch } = useQuery(GET_SCHEDULED_MESSAGES_BY_CHAT, {
    variables: { chatid },
    skip: !chatid,
    errorPolicy: 'all'
  });

  const [deleteMessage] = useMutation(DELETE_SCHEDULED_MESSAGE);
  const [sendNow] = useMutation(SEND_SCHEDULED_MESSAGE_NOW);

  useEffect(() => {
    if (data?.getScheduledMessagesByChat) {
      setScheduledMessages(data.getScheduledMessagesByChat);
    }
  }, [data]);

  const handleDelete = async (message) => {
    if (!confirm('Delete this scheduled message?')) return;
    try {
      await deleteMessage({ variables: { scheduledMessageId: message.scheduledMessageId } });
      removeScheduledMessage(message.scheduledMessageId);
      toast.success('Scheduled message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleSendNow = async (message) => {
    if (!confirm('Send this message now?')) return;
    try {
      await sendNow({ variables: { scheduledMessageId: message.scheduledMessageId } });
      removeScheduledMessage(message.scheduledMessageId);
      toast.success('Message sent!');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <div className={`p-6 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Clock className="w-6 h-6" />
          Scheduled Messages
        </h2>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Schedule Message
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : scheduledMessages.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No scheduled messages</p>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Schedule Your First Message
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledMessages.map(message => (
            <ScheduledMessageItem
              key={message.scheduledMessageId}
              message={message}
              onEdit={() => {}}
              onDelete={() => handleDelete(message)}
              onSendNow={() => handleSendNow(message)}
              theme={theme}
            />
          ))}
        </div>
      )}

      <ScheduleMessageModal
        chatid={chatid}
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        theme={theme}
      />
    </div>
  );
}
