'use client'

import React, { useState } from 'react'
import { 
  Trash2,
  UserX,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'

export default function AccountDeletion() {
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showSecretAccess, setShowSecretAccess] = useState(true)
  const [secretCode, setSecretCode] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deactivateReason, setDeactivateReason] = useState('')
  const [toast, setToast] = useState({ show: false, type: '', message: '' })
  
  const UNLOCK_CODE = "delete2024"

  const showToast = (type, message) => {
    setToast({ show: true, type, message })
    setTimeout(() => setToast({ show: false, type: '', message: '' }), 4000)
  }

  const handleSecretAccess = () => {
    if (secretCode.toLowerCase() === UNLOCK_CODE) {
      setShowSecretAccess(true)
      showToast('info', 'Advanced account options unlocked')
    } else {
      showToast('error', 'Invalid access code')
      setSecretCode('')
    }
  }

  const handleDeactivateAccount = async () => {
    if (!deactivateReason.trim()) {
      showToast('error', 'Please provide a reason for deactivation')
      return
    }

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      showToast('success', 'Account deactivated. You can reactivate anytime by logging in.')
      setShowDeactivateModal(false)
      
    } catch (error) {
      showToast('error', 'Failed to deactivate account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete my account permanently') {
      showToast('error', 'Please type the exact confirmation phrase')
      return
    }

    setIsLoading(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      showToast('success', 'Account deletion scheduled. You have 15 days to restore it by contacting support.')
      setShowDeleteModal(false)
      
    } catch (error) {
      showToast('error', 'Failed to delete account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {!showSecretAccess ? (
        // Hidden access section
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400">
              Advanced Account Management
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Enter access code to view additional options
            </p>
          </div>
          
          <div className="max-w-xs mx-auto">
            <div className="flex space-x-2">
              <input
                type="password"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center"
                placeholder="Enter code"
                onKeyPress={(e) => e.key === 'Enter' && handleSecretAccess()}
              />
              <button
                onClick={handleSecretAccess}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Hint: delete + year
            </p>
          </div>
        </div>
      ) : (
        // Danger zone content
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">
                  Danger Zone - Handle with Extreme Care
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  These actions will affect your account permanently or temporarily. Please read carefully before proceeding.
                </p>
              </div>
            </div>
          </div>

          {/* Account Deactivation */}
          <div className="bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <UserX className="w-5 h-5 mr-2 text-yellow-600" />
              Temporarily Deactivate Account
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your account will be hidden from other users, but you can reactivate it anytime by logging back in. 
              All your data will be preserved.
            </p>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ✓ Reversible action - simply log in to reactivate<br/>
                ✓ All data and settings preserved<br/>
                ✓ Profile hidden from other users
              </p>
            </div>
            <button
              onClick={() => setShowDeactivateModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Deactivate Account
            </button>
          </div>

          {/* Account Deletion */}
          <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
              <Trash2 className="w-5 h-5 mr-2 text-red-600" />
              Permanently Delete Account
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This will permanently delete your account and all associated data. You have 15 days to restore 
              it by contacting support before it's permanently removed.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                ⚠️ 15-day restoration period available<br/>
                ⚠️ All posts, messages, and data will be deleted<br/>
                ⚠️ Username will become available to others
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserX className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Deactivate Account
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your account will be hidden from other users, but you can reactivate it anytime by logging in.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tell us why you're leaving (optional)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                rows={3}
                placeholder="Your feedback helps us improve..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Deactivate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account Permanently
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This will permanently delete your account and all associated data. You have 15 days to restore it.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type "delete my account permanently" to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="delete my account permanently"
              />
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-start">
                <Clock className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  You can restore your account within 15 days by contacting support or attempting to log in. After 15 days, all data will be permanently removed.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isLoading || deleteConfirmation.toLowerCase() !== 'delete my account permanently'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-right duration-300 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'info' && <Info className="w-5 h-5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
