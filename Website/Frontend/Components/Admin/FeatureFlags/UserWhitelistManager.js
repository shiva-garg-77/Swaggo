'use client';

import { useState } from 'react';
import { Search, UserPlus, UserMinus } from 'lucide-react';
import { useFeatureFlagStore } from '../../../store/featureFlagStore';
import toast from 'react-hot-toast';

/**
 * User Whitelist Manager Component
 * Manage user-specific overrides for a feature flag
 */
export default function UserWhitelistManager({ flagName }) {
  const { setUserOverride } = useFeatureFlagStore();
  const [userIdInput, setUserIdInput] = useState('');
  const [whitelistedUsers, setWhitelistedUsers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Add user to whitelist
  const handleAddUser = async () => {
    if (!userIdInput.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    setIsAdding(true);
    try {
      await setUserOverride(flagName, userIdInput.trim(), true);
      
      // Add to local list
      setWhitelistedUsers(prev => [...prev, {
        userId: userIdInput.trim(),
        addedAt: new Date()
      }]);
      
      setUserIdInput('');
      toast.success(`User ${userIdInput} added to whitelist`);
    } catch (error) {
      toast.error(`Failed to add user: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Remove user from whitelist
  const handleRemoveUser = async (userId) => {
    try {
      await setUserOverride(flagName, userId, false);
      
      // Remove from local list
      setWhitelistedUsers(prev => prev.filter(u => u.userId !== userId));
      
      toast.success(`User ${userId} removed from whitelist`);
    } catch (error) {
      toast.error(`Failed to remove user: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add User */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add User to Whitelist
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
              placeholder="Enter user ID or username..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUser}
            disabled={isAdding}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isAdding ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Add
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Users in the whitelist will always have this feature enabled, regardless of rollout percentage
        </p>
      </div>

      {/* Whitelisted Users List */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Whitelisted Users ({whitelistedUsers.length})
        </h3>
        
        {whitelistedUsers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No users in whitelist yet
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Add users above to give them access to this feature
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {whitelistedUsers.map((user) => (
              <div
                key={user.userId}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {user.userId}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Added {new Date(user.addedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveUser(user.userId)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Remove from whitelist"
                >
                  <UserMinus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions (Future Enhancement) */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: You can also target users by segments (beta-users, premium-users, etc.) in the General tab
        </p>
      </div>
    </div>
  );
}
