"use client";

export default function ChartSection({ data, theme }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Engagement Over Time
          </h3>
          <div className="h-64 flex items-center justify-center">
            <EngagementChart theme={theme} />
          </div>
        </div>
        
        {/* Follower Demographics */}
        <div className={`p-6 rounded-xl border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Follower Demographics
          </h3>
          <div className="h-64 flex items-center justify-center">
            <DemographicsChart theme={theme} />
          </div>
        </div>
      </div>
      
      {/* Content Performance */}
      <div className={`p-6 rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Content Performance
        </h3>
        <div className="h-80">
          <ContentPerformanceChart theme={theme} />
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component for Engagement
function EngagementChart({ theme }) {
  const data = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 38 },
    { day: 'Thu', value: 67 },
    { day: 'Fri', value: 71 },
    { day: 'Sat', value: 89 },
    { day: 'Sun', value: 56 }
  ];
  
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full h-full flex flex-col justify-end">
      <div className="flex items-end justify-between h-48 gap-3">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-md transition-all duration-1000 hover:from-red-600 hover:to-red-500`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
            />
            <span className={`text-xs mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {item.day}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pie Chart Component for Demographics
function DemographicsChart({ theme }) {
  const data = [
    { label: '18-24', value: 35, color: '#ef4444' },
    { label: '25-34', value: 42, color: '#f97316' },
    { label: '35-44', value: 15, color: '#eab308' },
    { label: '45+', value: 8, color: '#22c55e' }
  ];
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-48">
        {/* Simple pie chart representation */}
        <div className="w-full h-full rounded-full bg-gradient-to-br from-red-400 via-orange-400 via-yellow-400 to-green-400 relative overflow-hidden">
          <div className={`absolute inset-4 rounded-full ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                1.2K
              </div>
              <div className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Total
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                {item.label}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Line Chart Component for Content Performance
function ContentPerformanceChart({ theme }) {
  const posts = [
    { title: 'Morning motivation post', views: 1250, likes: 89, comments: 23 },
    { title: 'Sunset photography', views: 2100, likes: 156, comments: 31 },
    { title: 'Workout routine video', views: 890, likes: 67, comments: 12 },
    { title: 'Recipe tutorial', views: 1800, likes: 134, comments: 28 },
    { title: 'Travel memories', views: 1450, likes: 98, comments: 19 }
  ];
  
  return (
    <div className="w-full h-full">
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {post.title}
              </p>
              <div className="flex gap-4 mt-1">
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.views.toLocaleString()} views
                </span>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.likes} likes
                </span>
                <span className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {post.comments} comments
                </span>
              </div>
            </div>
            
            {/* Visual bar */}
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                style={{ width: `${Math.min((post.views / 2500) * 100, 100)}%` }}
              />
            </div>
            
            <div className={`text-sm font-medium w-16 text-right ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {((post.likes / post.views) * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
