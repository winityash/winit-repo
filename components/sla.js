'use client';

import { useState, useEffect } from 'react';
// Removed framer-motion import

export default function SLATable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Removed loading state
        const controller = new AbortController();
        // Removed timeout

        const response = await fetch('/api/sla-report', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Removed timeout clear
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();

        // Handle empty response from API
        if (!result || typeof result !== 'object' || Object.keys(result).length === 0) {
          setData([]);
          setError(null);
          return;
        }

        // Transform the data for table display
        const tableData = Object.entries(result).map(([channel, stats]) => ({
          channel: channel.replace('_', ' ').toUpperCase(),
          total: stats.total || 0,
          solved: stats.solved || 0,
          slaPercentage: stats.sla_percentage ? parseFloat(stats.sla_percentage).toFixed(2) : '0.00'
        }));

        setData(tableData);
        setError(null);
      } catch (err) {
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(err.message || 'Failed to fetch data');
        }
        console.error('Error fetching SLA data:', err);
      } finally {
        // Removed loading state
      }
    };

    fetchData();
    // Removed auto-refresh interval
  }, []);

  const getSLAStatusColor = (percentage) => {
    const percent = parseFloat(percentage);
    if (percent >= 80) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (percent >= 60) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-pink-100 text-pink-800 border-pink-200';
    }
  };

  const getChannelIcon = (channel) => {
    switch (channel.toLowerCase()) {
      case 'phone call':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-gray-200">
        <div className="text-center">
          <div className="h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
          <div className="text-lg font-medium" style={{ color: '#3B82F6' }}>Loading SLA data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-xl border-2 border-gray-200">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-lg font-medium" style={{ color: '#3B82F6' }}>Error loading data</div>
          <div className="text-sm mt-1" style={{ color: '#3B82F6' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden max-w-4xl mx-auto"
      style={{
        backgroundColor: '#ffffff',
        boxShadow: 'none',
        borderRadius: '16px'
      }}
    >
      {/* Header Section */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-800">Resolution Status</h2>
            <p className="text-sm text-gray-500 mt-1">Service Level Agreement Performance</p>
          </div>
          {data && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">Real-time SLA Tracking</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">
                  {data.reduce((sum, item) => sum + parseInt(item.total), 0)}
                </span>
                <span className="text-gray-500 ml-1">Total Cases</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">
                  {data.reduce((sum, item) => sum + parseInt(item.solved), 0)}
                </span>
                <span className="text-gray-500 ml-1">Solved Cases</span>
              </div>
              <div className="text-gray-700">
                <span className="font-medium">
                  {(data.reduce((sum, item) => sum + parseFloat(item.slaPercentage), 0) / data.length).toFixed(1)}%
                </span>
                <span className="text-gray-500 ml-1">Avg SLA</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Card Style like Escalation */}
      <div className="p-6 bg-white">
        <div
          className="rounded-lg p-4" 
          style={{ 
            backgroundColor: '#ffffff',
            boxShadow: 'none'
          }}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Communication Channel</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Total Cases</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Resolved</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Performance</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {data && data.map((item, index) => (
                  <tr
                    key={item.channel}
                    className={`transition-all duration-200 border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <div className="text-blue-600">
                              {getChannelIcon(item.channel)}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900">
                            {item.channel}
                          </div>
                          <div className="text-xs text-gray-500">
                            Support Channel
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-full">
                          {item.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900 bg-green-100 px-2 py-1 rounded-full">
                          {item.solved}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getSLAStatusColor(item.slaPercentage)}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                              parseFloat(item.slaPercentage) >= 80 ? 'bg-green-400' :
                              parseFloat(item.slaPercentage) >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}></span>
                            {item.slaPercentage}%
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                parseFloat(item.slaPercentage) >= 80 ? 'bg-green-500' :
                                parseFloat(item.slaPercentage) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(parseFloat(item.slaPercentage), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}