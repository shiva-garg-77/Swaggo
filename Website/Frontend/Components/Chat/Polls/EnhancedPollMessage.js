import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, Check, Clock, Users, Eye, EyeOff, Plus, X } from 'lucide-react';

const EnhancedPollMessage = ({ poll, userId, onVote, isCreator = false, onEdit, onDelete }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [addingOption, setAddingOption] = useState(false);
  const [error, setError] = useState('');

  // Initialize selected options if user has already voted
  useEffect(() => {
    if (poll.voters && poll.voters.includes(userId)) {
      // In a real implementation, we would fetch the user's actual votes
      // For now, we'll just set showResults to true
      setShowResults(true);
    }
  }, [poll.voters, userId]);

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes || 0), 0);

  const handleOptionSelect = (optionId) => {
    if (poll.isClosed || showResults || submitting) return;

    if (poll.isMultipleChoice) {
      setSelectedOptions(prev => {
        if (prev.includes(optionId)) {
          return prev.filter(id => id !== optionId);
        } else {
          return [...prev, optionId];
        }
      });
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (submitting || selectedOptions.length === 0) return;
    
    setSubmitting(true);
    setError('');
    
    try {
      await onVote(poll.pollId, selectedOptions);
      setShowResults(true);
    } catch (error) {
      setError(error.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOption = async () => {
    if (!newOptionText.trim() || addingOption) return;
    
    setAddingOption(true);
    setError('');
    
    try {
      // In a real implementation, this would call an API to add the option
      // For now, we'll just simulate it
      console.log('Adding option:', newOptionText);
      setNewOptionText('');
    } catch (error) {
      setError(error.message || 'Failed to add option');
    } finally {
      setAddingOption(false);
    }
  };

  const handleDeletePoll = () => {
    if (window.confirm('Are you sure you want to delete this poll?')) {
      onDelete(poll.pollId);
    }
  };

  const handleEditPoll = () => {
    onEdit(poll);
  };

  const isOptionSelected = (optionId) => {
    return selectedOptions.includes(optionId);
  };

  const getPollStatus = () => {
    if (poll.isClosed) return 'Closed';
    if (poll.endDate && new Date(poll.endDate) < new Date()) return 'Ended';
    return 'Active';
  };

  const getStatusColor = () => {
    if (poll.isClosed) return 'text-gray-500';
    if (poll.endDate && new Date(poll.endDate) < new Date()) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Poll Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{poll.question}</h3>
          <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500 dark:text-gray-400">
            <span className={`flex items-center ${getStatusColor()}`}>
              <Clock className="w-3 h-3 mr-1" />
              {getPollStatus()}
            </span>
            {poll.endDate && (
              <span>
                Ends: {new Date(poll.endDate).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {totalVotes} votes
            </span>
          </div>
        </div>
        
        {isCreator && (
          <div className="flex space-x-1">
            <button 
              onClick={handleEditPoll}
              className="p-1 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              title="Edit poll"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button 
              onClick={handleDeletePoll}
              className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              title="Delete poll"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-3 p-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      {/* Poll Options */}
      <div className="space-y-2 mb-4">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes || 0) * 100 / totalVotes) : 0;
          const isSelected = isOptionSelected(option.optionId);
          const hasVoted = showResults || (poll.voters && poll.voters.includes(userId));
          
          return (
            <motion.div
              key={option.optionId}
              className={`relative rounded-lg border transition-all ${
                hasVoted 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : `border-gray-200 dark:border-gray-700 ${
                      isSelected 
                        ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 dark:ring-blue-400/20' 
                        : 'hover:border-gray-300 dark:hover:border-gray-600'
                    }`
              }`}
              whileHover={!hasVoted && !poll.isClosed ? { scale: 1.01 } : {}}
              whileTap={!hasVoted && !poll.isClosed ? { scale: 0.99 } : {}}
            >
              {/* Progress bar background */}
              {hasVoted && (
                <motion.div 
                  className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 rounded-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              )}
              
              <button
                disabled={poll.isClosed || hasVoted || submitting}
                onClick={() => handleOptionSelect(option.optionId)}
                className={`w-full text-left p-3 relative z-10 ${
                  hasVoted ? '' : 'cursor-pointer'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {!hasVoted ? (
                      poll.isMultipleChoice ? (
                        <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      ) : (
                        <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      )
                    ) : (
                      <div className="w-5 h-5 mr-3 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </span>
                      </div>
                    )}
                    <span className="text-gray-900 dark:text-gray-100">{option.text}</span>
                  </div>
                  
                  {hasVoted && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span>{option.votes || 0} votes</span>
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Add Option (if allowed) */}
      {poll.allowAddOptions && !showResults && !poll.isClosed && (
        <div className="mb-4">
          <div className="flex">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Add an option..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-l-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={addingOption}
            />
            <button
              onClick={handleAddOption}
              disabled={!newOptionText.trim() || addingOption}
              className="px-3 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!showResults && !poll.isClosed && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleVote}
            disabled={selectedOptions.length === 0 || submitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Voting...
              </>
            ) : (
              'Vote'
            )}
          </button>
          
          <button
            onClick={() => setShowResults(!showResults)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            {showResults ? 'Hide Results' : 'Show Results'}
          </button>
        </div>
      )}

      {/* Results View */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Results</h4>
            <button
              onClick={() => setShowResults(!showResults)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {poll.options.map((option) => {
              const percentage = totalVotes > 0 ? Math.round((option.votes || 0) * 100 / totalVotes) : 0;
              
              return (
                <div key={option.optionId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-900 dark:text-gray-100">{option.text}</span>
                    <span className="text-gray-500 dark:text-gray-400">{percentage}% ({option.votes || 0})</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              );
            })}
            
            <div className="pt-2 text-sm text-gray-500 dark:text-gray-400">
              Total votes: {totalVotes} • {poll.voters ? poll.voters.length : 0} participants
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedPollMessage;