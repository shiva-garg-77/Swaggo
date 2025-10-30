'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Star, Copy, Search } from 'lucide-react';
import { useMessageTemplateStore } from '../../../store/messageTemplateStore';
import toast from 'react-hot-toast';

/**
 * Popular Templates Section
 * Shows trending/popular templates from the community
 */
export default function PopularTemplatesSection({ onSelect, theme = 'light' }) {
  const { popularTemplates, createTemplate } = useMessageTemplateStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredTemplates, setFilteredTemplates] = useState([]);

  const isDark = theme === 'dark';

  // Mock popular templates (in production, fetch from API)
  const mockPopularTemplates = [
    {
      id: '1',
      title: 'Welcome Message',
      content: 'Hi {{name}}! Welcome to our community. How can I help you today?',
      category: 'Greetings',
      usageCount: 1250,
      isPublic: true,
      author: 'Community'
    },
    {
      id: '2',
      title: 'Thank You',
      content: 'Thank you so much for your support! I really appreciate it. 💕',
      category: 'Personal',
      usageCount: 980,
      isPublic: true,
      author: 'Community'
    },
    {
      id: '3',
      title: 'Meeting Reminder',
      content: 'Hi {{name}}, just a reminder about our meeting today at {{time}}. See you there!',
      category: 'Business',
      usageCount: 750,
      isPublic: true,
      author: 'Community'
    },
    {
      id: '4',
      title: 'Follow Up',
      content: 'Hey {{name}}, just following up on our previous conversation. Any updates?',
      category: 'Follow-up',
      usageCount: 620,
      isPublic: true,
      author: 'Community'
    },
    {
      id: '5',
      title: 'Out of Office',
      content: 'Thanks for your message! I\'m currently out of office and will respond when I return on {{date}}.',
      category: 'Business',
      usageCount: 540,
      isPublic: true,
      author: 'Community'
    },
    {
      id: '6',
      title: 'Birthday Wishes',
      content: 'Happy Birthday {{name}}! 🎉🎂 Wishing you an amazing day filled with joy and happiness!',
      category: 'Personal',
      usageCount: 480,
      isPublic: true,
      author: 'Community'
    }
  ];

  useEffect(() => {
    filterTemplates();
  }, [searchQuery, selectedCategory]);

  const filterTemplates = () => {
    let filtered = mockPopularTemplates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleSaveToMyTemplates = async (template) => {
    try {
      await createTemplate({
        title: template.title,
        content: template.content,
        category: template.category
      });
      toast.success('Template saved to your collection!');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleUseTemplate = (template) => {
    if (onSelect) {
      onSelect(template);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Popular Templates
        </h3>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search popular templates..."
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
            }`}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={`px-3 py-2 rounded-lg border text-sm ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        >
          <option value="all">All</option>
          <option value="Greetings">Greetings</option>
          <option value="Personal">Personal</option>
          <option value="Business">Business</option>
          <option value="Follow-up">Follow-up</option>
        </select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No popular templates found
            </p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {template.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                      {template.category}
                    </span>
                    <span className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {template.usageCount.toLocaleString()} uses
                    </span>
                  </div>
                </div>
              </div>

              <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {template.content}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  Use Template
                </button>
                <button
                  onClick={() => handleSaveToMyTemplates(template)}
                  className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${
                    isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  <Star className="w-3 h-3" />
                  Save
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
