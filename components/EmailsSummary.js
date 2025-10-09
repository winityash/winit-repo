'use client';

import { useState, useEffect } from 'react';
import { Mail, FileText, Clock, CheckCircle } from 'lucide-react';

export default function EmailsSummary() {
  const [summary, setSummary] = useState({
    total_emails: 0,
    processed_emails: 0,
    avg_processing_time: 0,
    success_rate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailsSummary();
  }, []);

  const fetchEmailsSummary = async () => {
    try {
      const response = await fetch('/api/dashboard/summary');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          const todayData = result.data.today || {};
          setSummary({
            total_emails: todayData.emails_processed || 0,
            processed_emails: todayData.pdfs_extracted || 0,
            avg_processing_time: todayData.avg_processing_time || 0,
            success_rate: todayData.success_rate || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching emails summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-6 bg-gray-300 rounded mb-1"></div>
            <div className="h-3 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Emails</p>
              <p className="text-2xl font-bold text-blue-900">{summary.total_emails}</p>
              <p className="text-xs text-blue-600">Received today</p>
            </div>
            <Mail className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Processed</p>
              <p className="text-2xl font-bold text-green-900">{summary.processed_emails}</p>
              <p className="text-xs text-green-600">Successfully extracted</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Avg Time</p>
              <p className="text-2xl font-bold text-orange-900">
                {summary.avg_processing_time > 0 ? `${summary.avg_processing_time.toFixed(1)}s` : '0s'}
              </p>
              <p className="text-xs text-orange-600">Per email</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Success Rate</p>
              <p className="text-2xl font-bold text-purple-900">
                {summary.success_rate > 0 ? `${summary.success_rate.toFixed(1)}%` : '0%'}
              </p>
              <p className="text-xs text-purple-600">Processing accuracy</p>
            </div>
            <FileText className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Email System Overview</h4>
          <div className="text-sm text-gray-500">
            Real-time data • Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Queue Status:</span>
              <span className="font-medium text-blue-600">Running</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Processed:</span>
              <span className="font-medium">{summary.total_emails > 0 ? 'Recently' : 'No data'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Processing Rate:</span>
              <span className="font-medium">
                {summary.avg_processing_time > 0 ? `${(1/summary.avg_processing_time * 60).toFixed(1)}/min` : '0/min'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Error Rate:</span>
              <span className="font-medium text-green-600">
                {summary.success_rate > 0 ? `${(100 - summary.success_rate).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">System Health:</span>
              <span className="font-medium text-green-600">Healthy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}