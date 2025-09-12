"use client";

import { useState, useEffect } from 'react';

const VIPDashboard = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading VIP Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-purple-800">VIP Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">VIP Members</h2>
          <p className="text-3xl font-bold text-purple-600">847</p>
          <p className="text-sm text-green-600">+12% this month</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Premium Revenue</h2>
          <p className="text-3xl font-bold text-indigo-600">$24,789</p>
          <p className="text-sm text-green-600">+8% this month</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-pink-500">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Active Subscriptions</h2>
          <p className="text-3xl font-bold text-pink-600">692</p>
          <p className="text-sm text-green-600">+15% this month</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Retention Rate</h2>
          <p className="text-3xl font-bold text-blue-600">94.2%</p>
          <p className="text-sm text-green-600">+2.1% this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">VIP Features Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Premium Chat</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{width: '85%'}}></div>
              </div>
              <span className="text-sm font-semibold">85%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Exclusive Content</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{width: '72%'}}></div>
              </div>
              <span className="text-sm font-semibold">72%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Priority Support</span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-pink-600 h-2 rounded-full" style={{width: '91%'}}></div>
              </div>
              <span className="text-sm font-semibold">91%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Recent VIP Activities</h3>
          <div className="space-y-3">
            <div className="border-l-4 border-purple-400 pl-4 py-2">
              <p className="font-semibold text-gray-800">New VIP Member Joined</p>
              <p className="text-sm text-gray-600">John Doe upgraded to VIP membership</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
            <div className="border-l-4 border-indigo-400 pl-4 py-2">
              <p className="font-semibold text-gray-800">Premium Feature Used</p>
              <p className="text-sm text-gray-600">Sarah accessed exclusive content library</p>
              <p className="text-xs text-gray-500">4 hours ago</p>
            </div>
            <div className="border-l-4 border-pink-400 pl-4 py-2">
              <p className="font-semibold text-gray-800">VIP Event Scheduled</p>
              <p className="text-sm text-gray-600">Monthly VIP webinar set for next week</p>
              <p className="text-xs text-gray-500">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VIPDashboard;
