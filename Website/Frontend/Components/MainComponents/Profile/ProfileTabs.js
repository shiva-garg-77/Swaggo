"use client";

export default function ProfileTabs({ activeTab, onTabChange, isOwnProfile, theme }) {
  const tabs = [
    {
      id: 'uploads',
      label: 'Posts',
      icon: <GridIcon />,
      showForAll: true
    },
    {
      id: 'tagged',
      label: 'Tagged',
      icon: <TagIcon />,
      showForAll: true
    },
    {
      id: 'draft',
      label: 'Draft',
      icon: <DocumentIcon />,
      showForAll: false // Only show for own profile
    }
  ];

  const visibleTabs = tabs.filter(tab => tab.showForAll || isOwnProfile);

  // Keyboard navigation (Issue 6.6)
  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      e.preventDefault();
      onTabChange(visibleTabs[currentIndex - 1].id);
    } else if (e.key === 'ArrowRight' && currentIndex < visibleTabs.length - 1) {
      e.preventDefault();
      onTabChange(visibleTabs[currentIndex + 1].id);
    }
  };

  return (
    <div className={`border-b ${
      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
    } py-2`} role="tablist">
      <div className="flex justify-center gap-8 md:gap-12">
        {visibleTabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={`flex items-center gap-2 px-2 py-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
              activeTab === tab.id
                ? theme === 'dark'
                  ? 'text-red-400 border-red-400'
                  : 'text-red-600 border-red-500'
                : theme === 'dark'
                  ? 'text-gray-400 border-transparent hover:text-gray-200'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <div className={`w-4 h-4 md:w-5 md:h-5`}>
              {tab.icon}
            </div>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Icon Components
function GridIcon() {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full transition-transform duration-300 group-hover:scale-110">
      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
