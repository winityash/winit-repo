'use client';

import { Calendar } from 'lucide-react';

export default function DateFilter({ selectedDate, onDateChange, label = 'Filter by Date' }) {
  // Format date to YYYY-MM-DD for input
  const formatDate = (date) => {
    if (!date) {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  };

  const currentDate = formatDate(selectedDate);

  return (
    <div className="filter-group" style={{ minWidth: '200px' }}>
      <label className="filter-label">{label.toUpperCase()}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="date"
          className="filter-select"
          value={currentDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            paddingLeft: '2.5rem',
            cursor: 'pointer'
          }}
        />
        <Calendar
          className="w-4 h-4"
          style={{
            position: 'absolute',
            left: '0.75rem',
            pointerEvents: 'none',
            color: '#6c757d'
          }}
        />
      </div>
    </div>
  );
}
