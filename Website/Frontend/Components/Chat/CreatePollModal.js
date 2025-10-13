import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calendar, Users, Eye, EyeOff } from 'lucide-react';

const CreatePollModal = ({ isOpen, onClose, onCreate, initialData = null }) => {
  const [question, setQuestion] = useState(initialData?.question || '');
  const [options, setOptions] = useState(
    initialData?.options?.length > 0 
      ? initialData.options.map(opt => ({ id: opt.optionId, text: opt.text })) 
      : [{ id: 1, text: '' }, { id: 2, text: '' }]
  );
  const [isMultipleChoice, setIsMultipleChoice] = useState(initialData?.isMultipleChoice || false);
  const [allowAnonymous, setAllowAnonymous] = useState(initialData?.allowAnonymous || false);
  const [allowAddOptions, setAllowAddOptions] = useState(initialData?.allowAddOptions || false);
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length >= 10) {
      setError('Maximum 10 options allowed');
      return;
    }
    
    setOptions([...options, { id: Date.now(), text: '' }]);
    setError('');
  };

  const removeOption = (id) => {
    if (options.length <= 2) {
      setError('Minimum 2 options required');
      return;
    }
    
    setOptions(options.filter(option => option.id !== id));
    setError('');
  };

  const updateOption = (id, text) => {
    setOptions(options.map(option => 
      option.id === id ? { ...option, text } : option
    ));
  };

  const validateForm = () => {
    // Validate question
    if (!question.trim()) {
      setError('Poll question is required');
      return false;
    }
    
    if (question.length > 200) {
      setError('Question must be less than 200 characters');
      return false;
    }
    
    // Validate options
    const validOptions = options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      setError('At least 2 options are required');
      return false;
    }
    
    if (validOptions.length > 10) {
      setError('Maximum 10 options allowed');
      return false;
    }
    
    // Check for duplicate options
    const optionTexts = validOptions.map(opt => opt.text.trim().toLowerCase());
    const uniqueOptions = [...new Set(optionTexts)];
    if (uniqueOptions.length !== optionTexts.length) {
      setError('Duplicate options are not allowed');
      return false;
    }
    
    // Validate option lengths
    for (const option of validOptions) {
      if (option.text.length > 100) {
        setError('Each option must be less than 100 characters');
        return false;
      }
    }
    
    // Validate end date
    if (endDate && new Date(endDate) < new Date()) {
      setError('End date must be in the future');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const validOptions = options.filter(opt => opt.text.trim() !== '');
      
      const pollData = {
        question: question.trim(),
        options: validOptions.map(opt => ({
          optionId: `opt_${Math.random().toString(36).substr(2, 9)}`,
          text: opt.text.trim()
        })),
        isMultipleChoice,
        allowAnonymous,
        allowAddOptions,
        endDate: endDate ? new Date(endDate).toISOString() : null
      };
      
      if (initialData) {
        // This is an edit operation
        await onCreate({ ...pollData, pollId: initialData.pollId }, true);
      } else {
        // This is a create operation
        await onCreate(pollData);
      }
      
      // Reset form
      setQuestion('');
      setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
      setIsMultipleChoice(false);
      setAllowAnonymous(false);
      setAllowAddOptions(false);
      setEndDate('');
      
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setQuestion(initialData?.question || '');
    setOptions(
      initialData?.options?.length > 0 
        ? initialData.options.map(opt => ({ id: opt.optionId, text: opt.text })) 
        : [{ id: 1, text: '' }, { id: 2, text: '' }]
    );
    setIsMultipleChoice(initialData?.isMultipleChoice || false);
    setAllowAnonymous(initialData?.allowAnonymous || false);
    setAllowAddOptions(initialData?.allowAddOptions || false);
    setEndDate(initialData?.endDate || '');
    setError('');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Poll' : 'Create Poll'}
            </h2>
            <button 
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg">
                {error}
              </div>
            )}

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                {question.length}/200
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={100}
                    />
                    <button
                      onClick={() => removeOption(option.id)}
                      disabled={options.length <= 2}
                      className="ml-2 p-2 text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={addOption}
                disabled={options.length >= 10}
                className="mt-2 flex items-center text-sm text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Multiple choice</span>
                </div>
                <button
                  onClick={() => setIsMultipleChoice(!isMultipleChoice)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isMultipleChoice ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isMultipleChoice ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <EyeOff className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Anonymous voting</span>
                </div>
                <button
                  onClick={() => setAllowAnonymous(!allowAnonymous)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowAnonymous ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowAnonymous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Allow adding options</span>
                </div>
                <button
                  onClick={() => setAllowAddOptions(!allowAddOptions)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    allowAddOptions ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      allowAddOptions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span>End date (optional)</span>
                  </div>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Poll' : 'Create Poll'
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreatePollModal;