'use client';

import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Bot, MessageCircle, Zap } from 'lucide-react';

const HelpSupportSection = ({ onBack }) => {
  const [showFullCenter, setShowFullCenter] = useState(false);

  if (showFullCenter) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowFullCenter(false)}
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
        </div>
        <div className="h-full overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-20">
              <Bot className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Help & Support Center
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Get assistance with your account, billing, and technical questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Back Button */}
      {onBack && (
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Help & Support
          </h1>
        </div>
      )}

      {/* Preview Cards */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI Support Assistant
                </h2>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Online • Instant responses
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Get instant help with account settings, password resets, billing questions, feature tutorials, and technical troubleshooting. Our AI understands context and provides step-by-step solutions.
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                Account Help
              </span>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                Billing Support
              </span>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                Technical Issues
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFullCenter(true)}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Start AI Chat</span>
              </button>
              <button
                onClick={() => setShowFullCenter(true)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Find quick answers to common questions about your account, billing, and features.
            </p>
            <button
              onClick={() => setShowFullCenter(true)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Browse FAQ →
            </button>
          </div>


          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              User Guides
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Comprehensive written guides covering everything from basics to advanced features.
            </p>
            <button
              onClick={() => setShowFullCenter(true)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Read Guides →
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Contact Support
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Get in touch with our support team via chat, email, or phone.
            </p>
            <button
              onClick={() => setShowFullCenter(true)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              Contact Us →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Reset Password", action: "password" },
            { label: "Billing Help", action: "billing" },
            { label: "Report Bug", action: "bug" },
            { label: "Feature Request", action: "feature" }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => setShowFullCenter(true)}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HelpSupportSection;
