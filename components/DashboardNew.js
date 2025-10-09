'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, AlertCircle, Eye, Check, Filter, ArrowRight, X, Clock, Calendar } from 'lucide-react';
import EmailsSummary from './EmailsSummary';
import LPOPreview from './LPOPreview';
import EmailsPreview from './EmailsPreview';

export default function DashboardNew({ onNavigate }) {
  const throughputChartRef = useRef(null);
  const urgencyChartRef = useRef(null);
  const [criticalAlert, setCriticalAlert] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [dashboardData, setDashboardData] = useState({
    overview: {
      kpis: {
        total_lpos_today: { value: 0, change: '0%', trend: 'stable', description: '' },
        urgent_lpos: { value: 0, level: 'normal', description: '' },
        ai_processing_rate: { value: '0%', change: '0%', trend: 'stable', description: '' }
      },
      alerts: [],
      charts: {
        processing_throughput: { type: 'line', data: [] },
        urgency_distribution: { type: 'doughnut', data: [] }
      }
    },
    analytics: {
      processing_metrics: {
        total_lpos_processed: 0,
        success_rate: 0,
        avg_processing_time: 0,
        throughput_per_hour: 0
      },
      quality_metrics: {
        total_emails: 0,
        lpo_relevant: 0,
        spam_filtered: 0,
        spam_detection_rate: 0
      },
      volume_trends: {
        daily_average: 0,
        weekly_total: 0,
        growth_rate: 0
      }
    },
    activeQueue: {
      lpos: [],
      total_count: 0,
      filters_applied: {}
    },
    lpoQueue: {
      lpos: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 5
      },
      filters_applied: {}
    },
    processingStatus: {
      status_distribution: [],
      hourly_volume: [],
      timestamp: null
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    console.log('📅 Date filter changed to:', dateFilter);
    fetchAllDashboardData();

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchProcessingStatus();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateFilter]);

  // Log whenever dashboardData changes
  useEffect(() => {
    console.log('🔄 dashboardData STATE UPDATED!');
    console.log('🔄 Current avg_processing_time in state:', dashboardData.analytics?.processing_metrics?.avg_processing_time);
  }, [dashboardData]);

  useEffect(() => {
    // Initialize charts after data is loaded
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
      if (window.throughputChart) window.throughputChart.destroy();
      if (window.urgencyChart) window.urgencyChart.destroy();
    };
  }, [loading, dashboardData]);

  const fetchProcessingStatus = async () => {
    try {
      const response = await fetch('/api/processing/status', {
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success' && result.data) {
          setDashboardData(prev => ({
            ...prev,
            processingStatus: result.data
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching processing status:', error);
    }
  };

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      const headers = {
        'Content-Type': 'application/json'
      };

      console.log('Fetching all dashboard data from API routes...');

      // Fetch all real API data in parallel using Next.js API routes with date filter
      const dateParams = `start_date=${dateFilter.startDate}&end_date=${dateFilter.endDate}`;
      const [
        overviewRes,
        analyticsRes,
        activeQueueRes,
        lpoQueueRes,
        processingStatusRes
      ] = await Promise.allSettled([
        fetch(`/api/dashboard/overview?${dateParams}`, { headers, cache: 'no-store' }),
        fetch(`/api/lpo/analytics/summary?${dateParams}`, { headers, cache: 'no-store' }),
        fetch(`/api/dashboard/active-queue?${dateParams}`, { headers, cache: 'no-store' }),
        fetch(`/api/lpo/queue?limit=10&${dateParams}`, { headers, cache: 'no-store' }),
        fetch(`/api/processing/status?${dateParams}`, { headers, cache: 'no-store' })
      ]);

      // Initialize data structure
      const data = {
        overview: {
          kpis: {
            total_lpos_today: { value: 0, change: '0%', trend: 'stable', description: '' },
            urgent_lpos: { value: 0, level: 'normal', description: '' },
            ai_processing_rate: { value: '0%', change: '0%', trend: 'stable', description: '' }
          },
          alerts: [],
          charts: {
            processing_throughput: { type: 'line', data: [] },
            urgency_distribution: { type: 'doughnut', data: [] }
          }
        },
        analytics: {
          processing_metrics: {
            total_lpos_processed: 0,
            success_rate: 0,
            avg_processing_time: 0,
            throughput_per_hour: 0
          },
          quality_metrics: {
            total_emails: 0,
            lpo_relevant: 0,
            spam_filtered: 0,
            spam_detection_rate: 0
          },
          volume_trends: {
            daily_average: 0,
            weekly_total: 0,
            growth_rate: 0
          }
        },
        activeQueue: {
          lpos: [],
          total_count: 0,
          filters_applied: {}
        },
        lpoQueue: {
          lpos: [],
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 0,
            items_per_page: 5
          },
          filters_applied: {}
        },
        processingStatus: {
          status_distribution: [],
          hourly_volume: [],
          timestamp: null
        }
      };

      // Process Dashboard Overview data
      if (overviewRes.status === 'fulfilled' && overviewRes.value.ok) {
        const result = await overviewRes.value.json();
        if (result.status === 'success' && result.data) {
          data.overview = result.data;
          console.log('✅ Dashboard Overview loaded:', result.data);
        }
      }

      // Process Analytics Summary data
      console.log('🔍 Analytics Response Status:', analyticsRes.status);
      if (analyticsRes.status === 'fulfilled') {
        console.log('✅ Analytics API fulfilled, checking response.ok:', analyticsRes.value.ok);
        if (analyticsRes.value.ok) {
          const result = await analyticsRes.value.json();
          console.log('📊 Raw Analytics API Response:', JSON.stringify(result, null, 2));

          if (result.status === 'success' && result.data && result.data.processing_metrics) {
            const rawAvgTime = result.data.processing_metrics.avg_extraction_time;
            console.log('⏱️ Raw avg_extraction_time from API:', rawAvgTime, 'Type:', typeof rawAvgTime);

            // FORCE the value - make absolutely sure it's a number
            const avgTime = Number(rawAvgTime);
            console.log('⏱️ Converted to Number:', avgTime, 'Is NaN?', isNaN(avgTime));

            if (!isNaN(avgTime)) {
              // Directly set it
              data.analytics.processing_metrics.avg_processing_time = avgTime;
              data.analytics.processing_metrics.total_lpos_processed = result.data.processing_metrics.total_emails_processing || 0;
              data.analytics.processing_metrics.success_rate = result.data.processing_metrics.success_rate || 0;
              data.analytics.processing_metrics.throughput_per_hour = result.data.processing_metrics.throughput_per_hour || 0;

              console.log('✅✅✅ SUCCESSFULLY SET avg_processing_time to:', data.analytics.processing_metrics.avg_processing_time);
              console.log('✅ Full processing_metrics object:', JSON.stringify(data.analytics.processing_metrics, null, 2));
            } else {
              console.error('❌ avgTime is NaN! Raw value was:', rawAvgTime);
            }

            data.analytics.quality_metrics = result.data.quality_metrics || data.analytics.quality_metrics;
            data.analytics.volume_trends = result.data.volume_trends || data.analytics.volume_trends;
          } else {
            console.error('❌ Invalid result structure:', result);
          }
        } else {
          console.error('❌ Analytics API response not ok. Status:', analyticsRes.value.status);
        }
      } else {
        console.error('❌ Analytics API request failed. Status:', analyticsRes.status);
        if (analyticsRes.status === 'rejected') {
          console.error('❌ Rejection reason:', analyticsRes.reason);
        }
      }

      // Process Active Queue data
      if (activeQueueRes.status === 'fulfilled' && activeQueueRes.value.ok) {
        const result = await activeQueueRes.value.json();
        if (result.status === 'success' && result.data) {
          data.activeQueue = result.data;
          console.log('✅ Active Queue loaded:', result.data);
          // Set critical alert if there are urgent LPOs
          setCriticalAlert(result.data.total_count > 0);
        }
      }

      // Process LPO Queue data
      if (lpoQueueRes.status === 'fulfilled' && lpoQueueRes.value.ok) {
        const result = await lpoQueueRes.value.json();
        if (result.status === 'success' && result.data) {
          data.lpoQueue = result.data;
          console.log('✅ LPO Queue loaded:', result.data);
        }
      }

      // Process Processing Status data
      if (processingStatusRes.status === 'fulfilled' && processingStatusRes.value.ok) {
        const result = await processingStatusRes.value.json();
        if (result.status === 'success' && result.data) {
          data.processingStatus = result.data;
          console.log('✅ Processing Status loaded:', result.data);
        }
      }

      console.log('🚀 All REAL API data loaded successfully:', data);
      console.log('🎯 Final avg_processing_time before setState:', data.analytics?.processing_metrics?.avg_processing_time);
      console.log('🎯 Full data.analytics before setState:', JSON.stringify(data.analytics, null, 2));

      // Create a completely new object to force React to re-render
      const newData = {
        overview: { ...data.overview },
        analytics: {
          processing_metrics: { ...data.analytics.processing_metrics },
          quality_metrics: { ...data.analytics.quality_metrics },
          volume_trends: { ...data.analytics.volume_trends }
        },
        activeQueue: { ...data.activeQueue },
        lpoQueue: { ...data.lpoQueue },
        processingStatus: { ...data.processingStatus }
      };

      console.log('🎯 New object avg_processing_time:', newData.analytics.processing_metrics.avg_processing_time);
      setDashboardData(newData);
    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      // Keep previous state on error, but log it
      console.warn('⚠️ Keeping previous state due to error');
    } finally {
      setLoading(false);
    }
  };

  const initializeCharts = () => {
    const Chart = window.Chart;

    // Throughput Chart - use real-time data from API
    if (throughputChartRef.current) {
      let labels = [];
      let throughputData = [];

      // Use detailed processing status data first (more granular), then fall back to overview
      if (dashboardData.processingStatus?.hourly_volume && dashboardData.processingStatus.hourly_volume.length > 0) {
        // Use processing status hourly volume - show all data with volume > 0 or recent hours
        const hourlyVolume = dashboardData.processingStatus.hourly_volume;
        const currentHour = new Date().getHours();
        
        // Get hours with data OR show a reasonable time window around current hour
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
        console.log('✅ Processing Status hourly data:', { 
          totalHours: hourlyVolume.length, 
          filteredHours: finalData.length,
          hasData: throughputData.some(v => v > 0),
          maxVolume: Math.max(...throughputData),
          hoursWithData: hoursWithData.length,
          dataHours: hoursWithData.map(item => `${item.hour}:${item.volume}`),
          labels, 
          throughputData,
          currentHour 
        });
      } else if (dashboardData.overview?.charts?.processing_throughput?.data && dashboardData.overview.charts.processing_throughput.data.length > 0) {
        // Fallback to overview API data if processing status is not available
        const chartData = dashboardData.overview.charts.processing_throughput.data;
        labels = chartData.map(item => item.time || 'Unknown');
        throughputData = chartData.map(item => item.processed || 0);
        console.log('Using Overview API chart data as fallback:', { labels, throughputData });
      } else {
        // Show empty state with better visualization
        const currentHour = new Date().getHours();
        labels = [];
        throughputData = [];
        // Show last 8 hours even with no data
        for (let i = Math.max(0, currentHour - 7); i <= currentHour; i++) {
          if (i === 0) labels.push('12AM');
          else if (i < 12) labels.push(`${i}AM`);
          else if (i === 12) labels.push('12PM');
          else labels.push(`${i - 12}PM`);
          throughputData.push(0);
        }
        console.log('⚠️ No throughput data - showing empty chart with time labels:', { labels, throughputData });
      }

      // Create gradient
      const ctx = throughputChartRef.current.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

      window.throughputChart = new Chart(throughputChartRef.current, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'LPOs/Hour',
            data: throughputData,
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            tension: 0.4,
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#3b82f6',
            pointBorderWidth: 2,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
                titleColor: '#fff',
                bodyColor: '#fff',
                displayColors: false,
                callbacks: {
                  title: function(context) {
                    return `${context[0].label} Processing`;
                  },
                  label: function(context) {
                    const value = context.parsed.y;
                    return value === 0 ? 'No LPOs processed' : `${value} LPO${value === 1 ? '' : 's'} processed`;
                  }
                }
              }
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: Math.max(5, Math.max(...throughputData) * 1.2),
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                padding: 10,
                stepSize: 1,
                callback: function(value) {
                  return Number.isInteger(value) ? value : '';
                }
              }
            },
            x: {
              grid: {
                display: false,
                drawBorder: false
              },
              ticks: {
                padding: 10,
                maxTicksLimit: 10
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      });
    }

    // Urgency Distribution Chart
    if (urgencyChartRef.current) {
      let urgencyLabels = ['No Data'];
      let urgencyData = [1];
      let urgencyColors = ['#e5e7eb'];

      // Use urgency distribution data from overview API
      if (dashboardData.overview?.charts?.urgency_distribution?.data && dashboardData.overview.charts.urgency_distribution.data.length > 0) {
        const chartData = dashboardData.overview.charts.urgency_distribution.data;
        urgencyLabels = chartData.map(item => item.level || 'Unknown');
        urgencyData = chartData.map(item => item.count || 0);
        urgencyColors = chartData.map(item => item.color || '#94a3b8');
        console.log('Using Overview API urgency data:', { urgencyLabels, urgencyData, urgencyColors });
      } else if (dashboardData.processingStatus?.status_distribution && dashboardData.processingStatus.status_distribution.length > 0) {
        // Fallback to processing status distribution
        const statusDist = dashboardData.processingStatus.status_distribution;
        urgencyLabels = statusDist.map(item => item.status || 'Unknown');
        urgencyData = statusDist.map(item => item.count || 0);
        urgencyColors = statusDist.map(item => {
          const status = (item.status || '').toLowerCase();
          if (status.includes('critical') || status.includes('urgent')) return '#ef4444';
          if (status.includes('high') || status.includes('processing')) return '#f97316';
          if (status.includes('medium') || status.includes('pending')) return '#eab308';
          if (status.includes('low') || status.includes('complete')) return '#22c55e';
          return '#94a3b8';
        });
        console.log('Using Processing Status distribution data:', { urgencyLabels, urgencyData });
      }

      window.urgencyChart = new Chart(urgencyChartRef.current, {
        type: 'doughnut',
        data: {
          labels: urgencyLabels,
          datasets: [{
            data: urgencyData,
            backgroundColor: urgencyColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            }
          }
        }
      });
    }
  };

  const getUrgencyBadgeClass = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getSLABadgeClass = (status) => {
    switch (status) {
      case 'On Track': return 'badge-success';
      case 'Near Breach': return 'badge-warning';
      case 'Breached': return 'badge-danger';
      default: return 'badge-info';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="page active">
      {/* Alert Strip */}
      {criticalAlert && dashboardData.activeQueue.total_count > 0 && (
        <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{ cursor: 'pointer', flex: 1 }}
            onClick={() => document.getElementById('active-lpo-queue').scrollIntoView({ behavior: 'smooth' })}
          >
            <strong>{dashboardData.activeQueue.total_count} Critical LPOs</strong> require immediate attention
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ArrowRight
              className="w-5 h-5"
              style={{ cursor: 'pointer' }}
              onClick={() => document.getElementById('active-lpo-queue').scrollIntoView({ behavior: 'smooth' })}
            />
            <X
              className="w-5 h-5"
              style={{ cursor: 'pointer' }}
              onClick={() => setCriticalAlert(false)}
            />
          </div>
        </div>
      )}

      {/* Date Filter */}
      <div className="date-filter-container">
        <div className="date-filter" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Calendar className="w-4 h-4" style={{ flexShrink: 0 }} />
          <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>Start:</label>
          <input
            type="date"
            value={dateFilter.startDate}
            onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
            className="date-filter-select"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          />
          <label style={{ fontSize: '0.75rem', fontWeight: 500 }}>End:</label>
          <input
            type="date"
            value={dateFilter.endDate}
            onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
            className="date-filter-select"
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* KPI Strip - Using Real API Data */}
      <div className="kpi-strip four-cards" key={dateFilter}>
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Total LPOs Today</div>
            <div className={`kpi-change ${dashboardData.overview.kpis.total_lpos_today.trend === 'positive' ? 'positive' : 'neutral'}`}>
              <TrendingUp className="w-4 h-4" />
              {dashboardData.overview.kpis.total_lpos_today.change}
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : dashboardData.overview.kpis.total_lpos_today.value}
          </div>
          <div className="kpi-description">
            {dashboardData.overview.kpis.total_lpos_today.description || 'LPOs processed today'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Urgent LPOs</div>
            <div className={`kpi-change ${dashboardData.overview.kpis.urgent_lpos.level === 'normal' ? 'positive' : 'negative'}`}>
              <AlertCircle className="w-4 h-4" />
              {dashboardData.overview.kpis.urgent_lpos.level}
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : dashboardData.overview.kpis.urgent_lpos.value}
          </div>
          <div className="kpi-description">
            {dashboardData.overview.kpis.urgent_lpos.description || 'Requiring attention'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">AI Processing Rate</div>
            <div className={`kpi-change ${dashboardData.overview.kpis.ai_processing_rate.trend === 'positive' ? 'positive' : 'neutral'}`}>
              <TrendingUp className="w-4 h-4" />
              {dashboardData.overview.kpis.ai_processing_rate.change}
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : dashboardData.overview.kpis.ai_processing_rate.value}
          </div>
          <div className="kpi-description">
            {dashboardData.overview.kpis.ai_processing_rate.description || 'Automated processing'}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Avg Processing Time</div>
            <div className="kpi-change positive">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : (() => {
              const avgTime = dashboardData.analytics.processing_metrics.avg_processing_time;
              console.log('🎯 DISPLAYING avg_processing_time:', avgTime);
              return `${Number(avgTime).toFixed(1)}s`;
            })()}
          </div>
          <div className="kpi-description">
            Average processing time
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>Processing Throughput</h3>
              <p>Real-time LPO processing data</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {dashboardData.processingStatus?.timestamp && (
                <span style={{ fontSize: '11px', color: '#666' }}>
                  Last updated: {new Date(dashboardData.processingStatus.timestamp).toLocaleTimeString()}
                </span>
              )}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                animation: 'pulse 2s infinite'
              }}></div>
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
              <h3>Urgency Distribution</h3>
              <p>Current priority levels</p>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={urgencyChartRef}></canvas>
            </div>
          </div>        </div>
      </div>



      {/* LPO Processing Queue Preview */}
      <div className="card" id="active-lpo-queue">
        <div className="card-header">
          <div className="card-header-content">
            <h3>LPO Processing Queue</h3>
            <p>Preview of the latest LPO items in the processing queue</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              console.log('[DashboardNew] View All Details (queue) clicked');
              onNavigate && onNavigate('queue');
            }}
          >
            <Filter className="w-4 h-4" />
            View All Details
          </button>
        </div>
        <div className="card-content">
          <LPOPreview onNavigate={onNavigate} />
        </div>
      </div>

      {/* All Emails Preview */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>All Emails</h3>
            <p>Preview of the latest emails processed by the system</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              console.log('[DashboardNew] View All Details (emails) clicked');
              onNavigate && onNavigate('emails');
            }}
          >
            <Eye className="w-4 h-4" />
            View All Details
          </button>
        </div>
        <div className="card-content">
          <EmailsPreview onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}