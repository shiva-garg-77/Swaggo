'use client'

import { ArrowLeft } from 'lucide-react'
import AccountDeletion from './AccountDeletion'

export default function PrivacyPolicy({ onBack, isModal = false }) {
  if (isModal) {
    // Modal version - no header, just content
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400 mb-6">Read our privacy policy, terms of service, and manage account settings.</p>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Privacy Policy</h3>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>Your privacy is important to us. This policy describes how we collect, use, and protect your information.</p>
                <p><strong>Data Collection:</strong> We collect information you provide directly and automatically through your use of our services.</p>
                <p><strong>Data Usage:</strong> We use your data to provide, maintain, and improve our services.</p>
                <p><strong>Data Protection:</strong> We implement security measures to protect your personal information.</p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Terms of Service</h3>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>By using our service, you agree to these terms and conditions.</p>
                <p><strong>Account Usage:</strong> You are responsible for maintaining the security of your account.</p>
                <p><strong>Prohibited Activities:</strong> You may not use our service for illegal or harmful activities.</p>
                <p><strong>Service Availability:</strong> We strive to maintain service availability but cannot guarantee uninterrupted access.</p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <details className="group">
                <summary className="cursor-pointer select-none text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Account lifecycle and advanced options
                </summary>
                <div className="mt-4">
                  <AccountDeletion />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Standalone version with header
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 mr-3">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy & Policy</h1>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Privacy & Policy</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Read our privacy policy, terms of service, and manage account settings.</p>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <details className="group">
              <summary className="cursor-pointer select-none text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                Account lifecycle and advanced options
              </summary>
              <div className="mt-4">
                <AccountDeletion />
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  )
}
