"use client";

export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile, theme }) {
  const tabs = [
    {
      id: 'uploads',
      label: 'Uploads',
      icon: <GridIcon />,
      showForAll: true
    },
    {
      id: 'draft',
      label: 'Draft',
      icon: <DocumentIcon />,
      showForAll: false // Only show for own profile
    },
    {
      id: 'tagged',
      label: 'Tag',
      icon: <TagIcon />,
      showForAll: true
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.showForAll || isOwnProfile);

  return (
    <div className={`border-t ${
      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
    } mb-0`}>
      <div className="flex justify-center">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border-t-2 transition-all duration-200 ${
              activeTab === tab.id
                ? theme === 'dark'
                  ? 'border-white text-white'
                  : 'border-gray-900 text-gray-900'
                : theme === 'dark'
                  ? 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className={`w-5 h-5 ${
              activeTab === tab.id 
                ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {tab.icon}
            </div>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Icon Components
function GridIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
