import React, { useState } from 'react';
import PollService from '../../Services/PollService';

export default function PollMessage({ poll, onVote }) {
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const totalVotes = (poll.options || []).reduce((sum, o) => sum + (o.votes || 0), 0);

  const handleVote = async (optionId) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const updatedPoll = await PollService.vote(poll.id, [optionId]);
      setSelected(optionId);
      onVote && onVote(optionId);
    } catch (error) {
      console.error('Error voting in poll:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="font-semibold mb-2 text-gray-900 dark:text-white">{poll.question || 'Poll'}</div>
      <div className="space-y-2">
        {(poll.options || []).map((opt) => {
          const pct = totalVotes > 0 ? Math.round((opt.votes || 0) * 100 / totalVotes) : 0;
          const isSelected = selected ? selected === opt.id : !!opt.voted;
          return (
            <button
              key={opt.id}
              disabled={submitting}
              onClick={() => handleVote(opt.id)}
              className={`w-full text-left p-2 rounded border relative overflow-hidden ${isSelected ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-900`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <span className="text-sm text-gray-900 dark:text-gray-100">{opt.text}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{pct}% • {opt.votes || 0}</span>
              </div>
              <div className="absolute inset-0 bg-blue-500/10" style={{ width: `${pct}%` }} />
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Total votes: {totalVotes}</div>
    </div>
  );
}
