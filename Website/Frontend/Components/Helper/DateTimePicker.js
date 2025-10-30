'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

export default function DateTimePicker({ value, onChange, minDate, theme = 'light' }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDate(d.toISOString().split('T')[0]);
      setTime(d.toTimeString().slice(0, 5));
    }
  }, [value]);

  const handleChange = () => {
    if (date && time) {
      const datetime = new Date(`${date}T${time}`);
      onChange(datetime.toISOString());
    }
  };

  useEffect(() => {
    handleChange();
  }, [date, time]);

  const today = minDate || new Date().toISOString().split('T')[0];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <Calendar className="w-4 h-4 inline mr-1" />
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={today}
          className={`w-full px-4 py-2 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          <Clock className="w-4 h-4 inline mr-1" />
          Time
        </label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border ${
            isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </div>
    </div>
  );
}
