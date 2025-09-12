"use client";

import React from 'react';
import { 
  Star, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
  Crown,
  Sparkles,
  Target
} from 'lucide-react';

export default function VIPFeaturesList({ theme }) {
  const vipFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get detailed insights into your profile performance, engagement rates, and audience demographics.",
      features: ["Hourly engagement tracking", "Demographic breakdowns", "Growth trend analysis", "Peak activity times"],
      color: "text-blue-500"
    },
    {
      icon: Eye,
      title: "Profile Views Tracking",
      description: "See who's viewing your profile and when, with detailed viewer analytics.",
      features: ["Anonymous view counts", "View history timeline", "Geographic view data", "View source tracking"],
      color: "text-green-500"
    },
    {
      icon: Users,
      title: "Audience Insights",
      description: "Understand your followers better with comprehensive audience analysis.",
      features: ["Follower growth patterns", "Age & location insights", "Interest categories", "Engagement preferences"],
      color: "text-purple-500"
    },
    {
      icon: TrendingUp,
      title: "Performance Metrics",
      description: "Track your content performance with advanced metrics and recommendations.",
      features: ["Content performance scores", "Best time to post", "Hashtag effectiveness", "Viral content analysis"],
      color: "text-orange-500"
    },
    {
      icon: Target,
      title: "Content Optimization",
      description: "Get AI-powered recommendations to improve your content strategy.",
      features: ["Content scoring", "Improvement suggestions", "Trending topic alerts", "Competitor analysis"],
      color: "text-red-500"
    },
    {
      icon: Shield,
      title: "Privacy Controls",
      description: "Advanced privacy settings and data control options for VIP members.",
      features: ["Granular data permissions", "Export all data", "Data retention controls", "Advanced blocking options"],
      color: "text-indigo-500"
    }
  ];

  const exclusivePerks = [
    {
      icon: Crown,
      title: "VIP Badge",
      description: "Stand out with the exclusive VIP badge on your profile"
    },
    {
      icon: Zap,
      title: "Priority Support",
      description: "Get faster response times from our support team"
    },
    {
      icon: Sparkles,
      title: "Early Access",
      description: "Be the first to try new features and updates"
    },
    {
      icon: Star,
      title: "Custom Themes",
      description: "Access to exclusive themes and customization options"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 mb-4">
          <Crown className="w-8 h-8 text-yellow-500" />
          <h2 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            VIP Features
          </h2>
        </div>
        <p className={`text-lg ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Unlock premium analytics and exclusive features designed for power users
        </p>
      </div>

      {/* Main Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vipFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div
              key={index}
              className={`p-6 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                theme === 'dark' 
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <IconComponent className={`w-6 h-6 ${feature.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className={`text-sm mb-4 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${feature.color.replace('text-', 'bg-')}`}></div>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exclusive Perks */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600' 
          : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-4 flex items-center space-x-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span>Exclusive VIP Perks</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {exclusivePerks.map((perk, index) => {
            const IconComponent = perk.icon;
            return (
              <div key={index} className="text-center">
                <div className={`inline-flex p-3 rounded-full mb-3 ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                }`}>
                  <IconComponent className="w-6 h-6 text-yellow-500" />
                </div>
                <h4 className={`font-semibold mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {perk.title}
                </h4>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {perk.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className={`rounded-xl border overflow-hidden ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Free vs VIP Comparison
          </h3>
        </div>
        <div className={theme === 'dark' ? 'bg-gray-800' : 'bg-white'}>
          <div className="grid grid-cols-3 text-center">
            <div className={`p-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Feature
            </div>
            <div className={`p-4 font-medium ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Free
            </div>
            <div className="p-4 font-medium text-yellow-500">
              VIP
            </div>
          </div>
          
          {[
            { feature: 'Basic Analytics', free: '✓', vip: '✓' },
            { feature: 'Profile Views', free: '✗', vip: '✓' },
            { feature: 'Advanced Metrics', free: '✗', vip: '✓' },
            { feature: 'Data Export', free: 'Limited', vip: 'Full' },
            { feature: 'Support Priority', free: 'Standard', vip: 'Priority' },
            { feature: 'Custom Themes', free: '✗', vip: '✓' }
          ].map((row, index) => (
            <div key={index} className={`grid grid-cols-3 text-center border-t ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`p-3 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {row.feature}
              </div>
              <div className={`p-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {row.free}
              </div>
              <div className="p-3 text-yellow-500 font-semibold">
                {row.vip}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className={`text-center p-8 rounded-xl border ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800' 
          : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
      }`}>
        <Crown className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className={`text-2xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Ready to Unlock VIP Features?
        </h3>
        <p className={`mb-6 ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Upgrade now and get access to all premium analytics and exclusive features
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2">
            <Crown className="w-5 h-5" />
            <span>Upgrade to VIP</span>
          </button>
          <button className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}>
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
