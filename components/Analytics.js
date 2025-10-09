'use client';

import { useEffect, useRef, useState } from 'react';
import { Scan, Tag, GitBranch, Zap } from 'lucide-react';
import DateFilter from './DateFilter';

export default function Analytics() {
  const throughputChartRef = useRef(null);
  const processingChartRef = useRef(null);
  const accuracyChartRef = useRef(null);
  const channelChartRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [analyticsData, setAnalyticsData] = useState({
    processingStatus: { hourly_volume: [], status_distribution: [] },
    summary: { processing_metrics: { avg_processing_time: 2.3 } },
    issueDistribution: { total_issues: 0, distribution: [] }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDate]);

  useEffect(() => {
    if (!loading) {
      // Check if Chart.js is available
      if (typeof window !== 'undefined' && window.Chart) {
        initializeCharts();
      } else {
        // Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
        script.onload = () => initializeCharts();
        document.head.appendChild(script);
      }
    }

    return () => {
      // Cleanup charts
      if (window.analyticsCharts) {
        Object.values(window.analyticsCharts).forEach(chart => chart.destroy());
        window.analyticsCharts = {};
      }
    };
  }, [loading, analyticsData]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const dateParam = selectedDate ? `?date=${selectedDate}` : '';
      const [processingRes, summaryRes, issueDistRes] = await Promise.allSettled([
        fetch(`/api/processing/status${dateParam}`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        }),
        fetch(`/api/dashboard/summary${dateParam}`, {
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        }),
        fetch(`/api/analytics/issue-distribution${dateParam}`, {
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        })
      ]);

      const data = {
        processingStatus: { hourly_volume: [], status_distribution: [] },
        summary: { processing_metrics: { avg_processing_time: 2.3 } },
        issueDistribution: { total_issues: 0, distribution: [] }
      };

      if (processingRes.status === 'fulfilled' && processingRes.value.ok) {
        const result = await processingRes.value.json();
        if (result.status === 'success' && result.data) {
          data.processingStatus = result.data;
        }
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        const result = await summaryRes.value.json();
        if (result.status === 'success' && result.data) {
          data.summary = result.data;
        }
      }

      if (issueDistRes.status === 'fulfilled' && issueDistRes.value.ok) {
        const result = await issueDistRes.value.json();
        console.log('Issue Distribution API Response:', result);
        if (result) {
          // Handle both direct format and nested data format
          if (result.status === 'success' && result.data) {
            data.issueDistribution = result.data;
          } else if (result.distribution || result.total_issues !== undefined) {
            data.issueDistribution = result;
          } else {
            data.issueDistribution = {
              total_issues: result.total_issues || 0,
              distribution: result.distribution || []
            };
          }
        }
      } else {
        console.error('Issue Distribution API failed:', issueDistRes);
      }

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeCharts = () => {
    const Chart = window.Chart;
    if (!window.analyticsCharts) window.analyticsCharts = {};

    // Throughput Chart - Use real data
    if (throughputChartRef.current) {
      let labels = [];
      let throughputData = [];

      // Use detailed processing status data for more granular hourly breakdown
      if (analyticsData.processingStatus?.hourly_volume && analyticsData.processingStatus.hourly_volume.length > 0) {
        const hourlyVolume = analyticsData.processingStatus.hourly_volume;
        const currentHour = new Date().getHours();
        
        // Get hours with data OR show a reasonable time window
        const hoursWithData = hourlyVolume.filter(item => item.volume > 0);
        
        let finalData;
        if (hoursWithData.length > 0) {
          // Show all hours with data plus surrounding context
          const minHourWithData = Math.min(...hoursWithData.map(item => parseInt(item.hour.split(':')[0])));
          const maxHourWithData = Math.max(...hoursWithData.map(item => parseInt(item.hour.split(':')[0])));
          
          // Expand range to show context (2 hours before and after)
          const startHour = Math.max(0, minHourWithData - 2);
          const endHour = Math.min(23, maxHourWithData + 2);
          
          finalData = hourlyVolume.filter(item => {
            const hour = parseInt(item.hour.split(':')[0]);
            return hour >= startHour && hour <= endHour;
          });
        } else {
          // If no data, show last 8 hours
          finalData = hourlyVolume.slice(Math.max(0, currentHour - 7), currentHour + 1);
        }

        labels = finalData.map(item => {
          const hour = parseInt(item.hour.split(':')[0]);
          if (hour === 0) return '12AM';
          if (hour < 12) return `${hour}AM`;
          if (hour === 12) return '12PM';
          return `${hour - 12}PM`;
        });
        throughputData = finalData.map(item => item.volume || 0);
      } else {
        labels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM'];
        throughputData = [0, 0, 0, 0, 0, 0, 0, 0];
      }

      window.analyticsCharts.throughput = new Chart(throughputChartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'LPOs/Hour',
            data: throughputData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // Issue Management Distribution
    if (processingChartRef.current) {
      const issueDistribution = analyticsData.issueDistribution?.distribution || [];

      // Format issue type names for display
      const formatIssueType = (type) => {
        if (!type || type === null) return 'Uncategorized';
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };

      const labels = issueDistribution.length > 0
        ? issueDistribution.map(item => formatIssueType(item.issue_type))
        : ['No Issues'];

      const data = issueDistribution.length > 0
        ? issueDistribution.map(item => item.count)
        : [0];

      const backgroundColors = issueDistribution.length > 0
        ? issueDistribution.map((_, index) => {
            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
            return colors[index % colors.length];
          })
        : ['#e5e7eb'];

      window.analyticsCharts.processing = new Chart(processingChartRef.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Count',
            data: data,
            backgroundColor: backgroundColors,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: function(context) {
                  const distribution = analyticsData.issueDistribution?.distribution || [];
                  const item = distribution[context.dataIndex];
                  return item ? `${item.percentage}% of total` : '';
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                precision: 0
              }
            },
            x: {
              ticks: {
                font: {
                  size: 11
                },
                maxRotation: 45,
                minRotation: 45
              }
            }
          }
        }
      });
    }

    // Accuracy Trends
    if (accuracyChartRef.current) {
      window.analyticsCharts.accuracy = new Chart(accuracyChartRef.current, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'OCR Accuracy',
              data: [98.5, 99.1, 99.3, 98.9, 99.2, 99.4, 99.3],
              borderColor: '#3b82f6',
              backgroundColor: 'transparent',
              tension: 0.4
            },
            {
              label: 'Classification',
              data: [95.2, 96.1, 96.8, 96.5, 97.0, 96.9, 96.8],
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    // Channel Distribution
    if (channelChartRef.current) {
      window.analyticsCharts.channel = new Chart(channelChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Email', 'EDI', 'Portal', 'API'],
          datasets: [{
            data: [35, 25, 30, 10],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  };

  return (
    <>
      {/* Date Filter */}
      <div className="filter-bar">
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          label="Analytics Date"
        />
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          Reset to Today
        </button>
      </div>

      {/* AI Performance Metrics */}
      <div className="card mb-4">
        <div className="card-header">
          <div className="card-header-content">
            <h3>AI Processing Performance</h3>
            <p>Intelligent automation metrics powered by AI engine</p>
          </div>
        </div>
        <div className="card-content">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '2rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {/* OCR Accuracy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
              <Scan className="w-7 h-7" style={{ color: '#007bff' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#007bff' }}>99.3%</div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>OCR Accuracy</div>
              </div>
            </div>
            {/* Auto-Classification */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
              <Tag className="w-7 h-7" style={{ color: '#28a745' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#28a745' }}>96.8%</div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Auto-Classification</div>
              </div>
            </div>
            {/* Smart Routing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
              <GitBranch className="w-7 h-7" style={{ color: '#ffc107' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffc107' }}>94.2%</div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Smart Routing</div>
              </div>
            </div>
            {/* Processing Speed */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.5rem',
              borderLeft: '2px solid #dee2e6'
            }}>
              <Zap className="w-7 h-7" style={{ color: '#dc3545' }} />
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc3545' }}>
                  {loading ? '...' : `${analyticsData.summary.processing_metrics?.avg_processing_time?.toFixed(1) || '2.3'} sec`}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Avg Processing</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>Processing Throughput</h3>
              <p>LPOs processed per hour</p>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={throughputChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>Issue Management</h3>
              <p>Distribution of issues by type</p>
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                padding: '0.25rem 0.75rem',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontWeight: 600,
                color: '#495057'
              }}>
                {loading ? '...' : `${analyticsData.issueDistribution?.total_issues || 0} Total Issues`}
              </span>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={processingChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>AI Accuracy Trends</h3>
              <p>OCR and classification accuracy over time</p>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={accuracyChartRef}></canvas>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>Channel Distribution</h3>
              <p>LPOs by submission channel</p>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={channelChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}