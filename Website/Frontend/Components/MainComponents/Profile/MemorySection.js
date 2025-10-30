"use client";

import { EmptyMemories } from '../../UI/EmptyState';

export default function MemorySection({ memories = [], isOwnProfile, theme, onCreateMemory }) {
  const displayMemories = memories || [];

  return (
    <div className="mb-8">
      {/* Memory/Highlights Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
          {displayMemories.length > 0 ? 'Memories' : ''}
        </h2>
        {isOwnProfile && displayMemories.length > 0 && (
          <button
            onClick={onCreateMemory}
            className={`text-xs ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors`}
          >
            + New
          </button>
        )}
      </div>

      {/* Empty State (Issue 6.9) */}
      {displayMemories.length === 0 && isOwnProfile && (
        <EmptyMemories onAction={onCreateMemory} />
      )}

      {/* Memory Circles */}
      {displayMemories.length > 0 && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {displayMemories.map((memory) => (
            <MemoryCircle
              key={memory.memoryid}
              memory={memory}
              theme={theme}
            />
          ))}

          {/* Add Memory Circle (only for own profile) */}
          {isOwnProfile && (
            <div className="flex-shrink-0">
              <button
                onClick={onCreateMemory}
                className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed flex items-center justify-center transition-colors ${theme === 'dark'
                  ? 'border-gray-600 hover:border-gray-500 text-gray-500 hover:text-gray-400'
                  : 'border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-500'
                  }`}
              >
                <PlusIcon className="w-6 h-6" />
              </button>
              <p className={`text-xs text-center mt-1 max-w-[80px] truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                New
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Individual memory circle component
function MemoryCircle({ memory, theme }) {
  return (
    <div className="flex-shrink-0 cursor-pointer group">
      <div className="relative">
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500`}>
          <div className={`w-full h-full rounded-full border-2 overflow-hidden ${theme === 'dark' ? 'border-gray-900' : 'border-white'
            }`}>
            <img
              src={memory.coverImage || memory.stories[0]?.mediaUrl}
              alt={memory.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
        </div>
      </div>
      <p className={`text-xs text-center mt-1 max-w-[80px] truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
        }`}>
        {memory.title}
      </p>
    </div>
  );
}

// Plus icon for add memory button
function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
