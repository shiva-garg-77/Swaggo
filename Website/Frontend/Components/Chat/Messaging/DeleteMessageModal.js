import React from 'react';

const DeleteMessageModal = ({ message, onClose, onDeleteForMe, onDeleteForEveryone }) => {
  const isOwnMessage = message.senderid === message.currentUserProfileId;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Delete Message
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete this message?
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              onDeleteForMe(message.messageid);
              onClose();
            }}
            className="w-full px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Delete for Me
          </button>
          
          {isOwnMessage && (
            <button
              onClick={() => {
                onDeleteForEveryone(message.messageid);
                onClose();
              }}
              className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              Delete for Everyone
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteMessageModal;