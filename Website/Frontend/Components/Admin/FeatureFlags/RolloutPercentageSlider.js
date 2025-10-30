'use client';

/**
 * Rollout Percentage Slider Component
 * Visual slider for adjusting feature flag rollout percentage
 */
export default function RolloutPercentageSlider({ value, onChange }) {
  const presets = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                   [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600
                   [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg
                   [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                   [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer
                   [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
          }}
        />
        
        {/* Value Display */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium shadow-lg">
            {value}%
          </div>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center justify-between gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            className={`
              flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${value === preset
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }
            `}
          >
            {preset}%
          </button>
        ))}
      </div>

      {/* Estimated Users (Example) */}
      <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Estimated reach: <span className="font-medium text-gray-900 dark:text-white">
          {value === 0 ? 'No users' : value === 100 ? 'All users' : `~${value}% of users`}
        </span>
      </div>
    </div>
  );
}
