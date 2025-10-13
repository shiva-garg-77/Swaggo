import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFixedSecureAuth } from '../../context/FixedSecureAuthContext';
import AIModerationService from '../../services/AIModerationService';
import { 
  ShieldCheckIcon, 
  CogIcon, 
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const AutoModerationSettings = () => {
  const navigate = useNavigate();
  const { permissions } = useFixedSecureAuth();

  const [settings, setSettings] = useState({
    autoModerationEnabled: true,
    flagContent: true,
    autoRejectSevere: false,
    notifyModerators: true,
    profanityFilter: true,
    spamDetection: true,
    hateSpeechDetection: true,
    personalInfoProtection: true,
    customKeywords: '',
    severityThreshold: 'medium',
    actionForThreshold: 'flag'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testContent, setTestContent] = useState('');

  // Check if user has admin role
  const isAdmin = permissions?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }

    // Load existing settings (in a real app, this would come from backend)
    setLoading(false);
  }, [isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      // In a real implementation, you would save these settings to the backend
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestModeration = async () => {
    if (!testContent.trim()) {
      setError('Please enter content to test');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await AIModerationService.moderateContent(testContent);
      setTestResult(result);
    } catch (err) {
      setError('Failed to test content moderation');
      console.error('Error testing moderation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ShieldCheckIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-2 text-lg font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-1 text-gray-500">You don't have permission to access this page.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate('/admin/rbac')}
              className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Admin
            </button>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Auto-Moderation Settings
            </h1>
            <p className="mt-2 text-gray-600">
              Configure AI-powered content moderation and filtering
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Settings saved successfully!
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Settings Form */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  <CogIcon className="h-5 w-5 inline-block mr-2 text-indigo-600" />
                  Moderation Configuration
                </h3>
              </div>
              <form onSubmit={handleSave}>
                <div className="px-4 py-5 sm:p-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Enable Auto-Moderation</h4>
                        <p className="text-sm text-gray-500">Automatically scan all content for policy violations</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoModerationEnabled"
                          checked={settings.autoModerationEnabled}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Flag Content</h4>
                        <p className="text-sm text-gray-500">Flag content that violates policies for review</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="flagContent"
                          checked={settings.flagContent}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Auto-Reject Severe Content</h4>
                        <p className="text-sm text-gray-500">Automatically reject content with critical violations</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoRejectSevere"
                          checked={settings.autoRejectSevere}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Notify Moderators</h4>
                        <p className="text-sm text-gray-500">Send notifications for flagged content</p>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="notifyModerators"
                          checked={settings.notifyModerators}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Content Filters</h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Profanity Filter</h5>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="profanityFilter"
                              checked={settings.profanityFilter}
                              onChange={handleChange}
                              disabled={!settings.autoModerationEnabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Spam Detection</h5>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="spamDetection"
                              checked={settings.spamDetection}
                              onChange={handleChange}
                              disabled={!settings.autoModerationEnabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Hate Speech Detection</h5>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="hateSpeechDetection"
                              checked={settings.hateSpeechDetection}
                              onChange={handleChange}
                              disabled={!settings.autoModerationEnabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700">Personal Info Protection</h5>
                          </div>
                          <div className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              name="personalInfoProtection"
                              checked={settings.personalInfoProtection}
                              onChange={handleChange}
                              disabled={!settings.autoModerationEnabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Custom Keywords</h4>
                      <div>
                        <textarea
                          name="customKeywords"
                          value={settings.customKeywords}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          rows={3}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Enter custom keywords to block (one per line)"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Enter custom keywords or phrases that should be automatically flagged
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Severity Threshold</h4>
                      <div>
                        <select
                          name="severityThreshold"
                          value={settings.severityThreshold}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="low">Low - Flag most content</option>
                          <option value="medium">Medium - Balanced filtering</option>
                          <option value="high">High - Only flag severe violations</option>
                        </select>
                        <p className="mt-2 text-sm text-gray-500">
                          Set the sensitivity level for content moderation
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Action for Threshold</h4>
                      <div>
                        <select
                          name="actionForThreshold"
                          value={settings.actionForThreshold}
                          onChange={handleChange}
                          disabled={!settings.autoModerationEnabled}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                          <option value="flag">Flag for Review</option>
                          <option value="reject">Auto-Reject</option>
                          <option value="notify">Notify Only</option>
                        </select>
                        <p className="mt-2 text-sm text-gray-500">
                          Action to take when content meets the severity threshold
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                  <button
                    type="submit"
                    disabled={saving || !settings.autoModerationEnabled}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Test Moderation */}
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  <ShieldCheckIcon className="h-5 w-5 inline-block mr-2 text-indigo-600" />
                  Test Moderation
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="testContent" className="block text-sm font-medium text-gray-700">
                      Test Content
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="testContent"
                        name="testContent"
                        rows={4}
                        value={testContent}
                        onChange={(e) => setTestContent(e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter content to test moderation..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleTestModeration}
                    disabled={loading || !testContent.trim()}
                    className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                      </>
                    ) : (
                      'Test Moderation'
                    )}
                  </button>

                  {testResult && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Test Results</h4>
                      <div className={`rounded-md p-4 ${testResult.is_safe ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex">
                          <div className="flex-shrink-0">
                            {testResult.is_safe ? (
                              <CheckIcon className="h-5 w-5 text-green-400" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className={`text-sm font-medium ${testResult.is_safe ? 'text-green-800' : 'text-red-800'}`}>
                              Content is {testResult.is_safe ? 'Safe' : 'Flagged'}
                            </h3>
                            <div className={`mt-2 text-sm ${testResult.is_safe ? 'text-green-700' : 'text-red-700'}`}>
                              <p>{testResult.explanation}</p>
                              <p className="mt-1">Confidence: {(testResult.confidence_score * 100).toFixed(1)}%</p>
                              <p className="mt-1">Severity: {testResult.severity_level}</p>
                              <p className="mt-1">Recommended Action: {testResult.recommended_action}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {testResult.detected_issues.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium text-gray-700">Detected Issues</h5>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {testResult.detected_issues.map((issue, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                              >
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoModerationSettings;