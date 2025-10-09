'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, AlertCircle, Eye, Check, Filter, ArrowRight, X, Clock, Calendar, RefreshCw } from 'lucide-react';
import EmailsSummary from './EmailsSummary';
import LPOPreview from './LPOPreview';
import EmailsPreview from './EmailsPreview';

export default function DashboardNew({ onNavigate }) {
  const throughputChartRef = useRef(null);
  const urgencyChartRef = useRef(null);
  const [criticalAlert, setCriticalAlert] = useState(true);
  const [dateFilter, setDateFilter] = useState('today'); // 'today' or 'week'
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

  const COLORS = {
    processing: '#3B82F6',
    pending: '#EF4444',
    solved: '#10B981',
    failed: '#F59E0B'
  };

  useEffect(() => {
    console.log('Date filter changed to:', dateFilter);
    fetchDashboardData();

    // Set up real-time refresh every 30 seconds
    const interval = setInterval(() => {
      fetchProcessingStatus();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dateFilter]);


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
          'ngrok-skip-browser-warning': 'true',
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
      const headers = {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      };

      // Fetch all data in parallel - use Next.js API routes and direct external APIs
      const [
        summaryRes,
        processingStatusRes,
        performanceRes,
        queueStatusRes,
        slaRes
      ] = await Promise.allSettled([
        fetch('/api/dashboard/summary', { headers, cache: 'no-store' }),
        fetch('/api/processing/status', { headers, cache: 'no-store' }),
        fetch('/api/dashboard/performance?metric_type=processing_time&days=7&include_email_details=true'),
        fetch('/api/queue/status'),
        fetch('/api/sla-report')
      ]);

      const data = {
        escalation: [],
        orderExtraction: [],
        sla: [],
        kpiData: {
          totalLPOs: 0,
          urgentLPOs: 0,
          aiProcessingRate: 0
        },
        summaryData: {
          today: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0,
            success_rate: 0
          },
          week: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0,
            success_rate: 0
          }
        },
        processingStatus: {
          status_distribution: [],
          hourly_volume: [],
          timestamp: null
        }
      };

      // Process Processing Status data for throughput chart
      if (processingStatusRes.status === 'fulfilled' && processingStatusRes.value.ok) {
        const result = await processingStatusRes.value.json();
        console.log('Processing Status API Response:', result);
        if (result.status === 'success' && result.data) {
          data.processingStatus = result.data;
          console.log('Processing Status Data:', data.processingStatus);
          console.log('Hourly Volume:', data.processingStatus.hourly_volume);
        }
      } else {
        console.error('Failed to fetch processing status:', processingStatusRes);
      }

      // Process Performance data
      if (performanceRes.status === 'fulfilled' && performanceRes.value.ok) {
        const result = await performanceRes.value.json();
        data.orderExtraction = result.data ? result.data.slice(0, 5) : [];
      }

      // Process SLA data
      if (slaRes.status === 'fulfilled' && slaRes.value.ok) {
        const result = await slaRes.value.json();
        if (result && typeof result === 'object') {
          data.sla = Object.entries(result).map(([channel, stats]) => ({
            channel: channel.replace('_', ' ').toUpperCase(),
            total: stats.total,
            solved: stats.solved,
            slaPercentage: parseFloat(stats.sla_percentage).toFixed(2)
          }));
        }
      }

      // Process Queue data for KPIs
      if (queueStatusRes.status === 'fulfilled' && queueStatusRes.value.ok) {
        const result = await queueStatusRes.value.json();
        if (result && result.processing_status) {
          data.kpiData.totalLPOs = result.processing_status.total || 0;
        }
      }

      // Process Summary data for the four cards
      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        const result = await summaryRes.value.json();
        console.log('Dashboard Summary API Response:', result);

        if (result && result.status === 'success' && result.data) {
          const todayData = result.data.today || {};
          const weekData = result.data.week || {};

          console.log('Today data:', todayData);
          console.log('Week data:', weekData);
          console.log('Current dateFilter:', dateFilter);

          // Process today's data
          let todaySuccessRate = 0;
          if (todayData.success_rate !== null && todayData.success_rate !== undefined) {
            todaySuccessRate = todayData.success_rate;
          } else if (todayData.emails_processed > 0 && todayData.pdfs_extracted !== null && todayData.pdfs_extracted !== undefined) {
            todaySuccessRate = (todayData.pdfs_extracted / todayData.emails_processed) * 100;
          }

          // Process week's data - calculate success rate since API doesn't provide it
          let weekSuccessRate = 0;
          if (weekData.emails_processed > 0 && weekData.pdfs_extracted !== null && weekData.pdfs_extracted !== undefined) {
            weekSuccessRate = (weekData.pdfs_extracted / weekData.emails_processed) * 100;
          }

          // Store both datasets
          data.summaryData = {
            today: {
              emails_processed: todayData.emails_processed !== undefined ? todayData.emails_processed : 0,
              pdfs_extracted: todayData.pdfs_extracted !== undefined && todayData.pdfs_extracted !== null
                ? todayData.pdfs_extracted : 0,
              avg_processing_time: todayData.avg_processing_time !== undefined ? todayData.avg_processing_time : 0,
              success_rate: todayData.success_rate !== undefined ? todayData.success_rate : todaySuccessRate
            },
            week: {
              emails_processed: weekData.emails_processed !== undefined ? weekData.emails_processed : 0,
              pdfs_extracted: weekData.pdfs_extracted !== undefined && weekData.pdfs_extracted !== null
                ? weekData.pdfs_extracted : 0,
              avg_processing_time: weekData.avg_processing_time !== undefined ? weekData.avg_processing_time : 0,
              success_rate: weekData.success_rate !== undefined ? weekData.success_rate : weekSuccessRate
            }
          };

          console.log('Processed summary data:', data.summaryData);
        }
      } else {
        console.error('Failed to fetch summary data:', summaryRes);
      }

      // Fetch Escalation data from external API
      const escalationData = [];
      const modes = ['whatsapp', 'email', 'call'];
      const apiBaseUrlTwo = process.env.NEXT_PUBLIC_API_BASE_URL_TWO || 'https://e8a4eb9316cc.ngrok-free.app';

      const fetchPromises = modes.map(async (mode) => {
        try {
          const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          };

          const apiUrl = `${apiBaseUrlTwo}/status/${mode}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(apiUrl, {
            headers,
            cache: 'no-store',
            method: 'GET',
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const result = await response.json();
            const status = result?.status || {};
            const processing = status.processing || 0;
            const pending = status.pending || 0;
            const solved = status.solved || 0;

            return {
              mode: mode.charAt(0).toUpperCase() + mode.slice(1),
              data: [
                { name: 'Processing', value: processing || 0.1, displayValue: processing || 0, color: COLORS.processing },
                { name: 'Pending', value: pending || 0.1, displayValue: pending || 0, color: COLORS.pending },
                { name: 'Solved', value: solved || 0.1, displayValue: solved || 0, color: COLORS.solved }
              ].map(item => ({
                ...item,
                value: item.displayValue === 0 ? 0.1 : item.displayValue
              })),
              total: processing + pending + solved,
              hasRealData: true
            };
          } else {
            throw new Error(`HTTP ${response.status}`);
          }
        } catch (error) {
          console.error(`Error fetching ${mode} escalation data:`, error.message);

          // Return empty real data for failed API calls - no mock data
          return {
            mode: mode.charAt(0).toUpperCase() + mode.slice(1),
            data: [
              { name: 'Processing', value: 0, displayValue: 0, color: COLORS.processing },
              { name: 'Pending', value: 0, displayValue: 0, color: COLORS.pending },
              { name: 'Solved', value: 0, displayValue: 0, color: COLORS.solved }
            ],
            total: 0,
            hasRealData: false
          };
        }
      });

      const results = await Promise.allSettled(fetchPromises);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          escalationData.push(result.value);
        } else {
          // Add empty real data for failed promises - no mock data
          const mode = modes[index];
          escalationData.push({
            mode: mode.charAt(0).toUpperCase() + mode.slice(1),
            data: [
              { name: 'Processing', value: 0, displayValue: 0, color: COLORS.processing },
              { name: 'Pending', value: 0, displayValue: 0, color: COLORS.pending },
              { name: 'Solved', value: 0, displayValue: 0, color: COLORS.solved }
            ],
            total: 0,
            hasRealData: false
          });
        }
      });

      data.escalation = escalationData;
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Don't use mock data - show real empty state
      setDashboardData({
        escalation: [],
        orderExtraction: [],
        sla: [],
        kpiData: {
          totalLPOs: 0,
          urgentLPOs: 0,
          aiProcessingRate: 0
        },
        summaryData: {
          today: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0,
            success_rate: 0
          },
          week: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0,
            success_rate: 0
          }
        },
        processingStatus: {
          status_distribution: [],
          hourly_volume: [],
          timestamp: null
        }
      });
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

      // Use real-time hourly volume data from API - ALWAYS prefer real data over mock
      if (dashboardData.processingStatus && dashboardData.processingStatus.hourly_volume && dashboardData.processingStatus.hourly_volume.length > 0) {
        const hourlyVolume = dashboardData.processingStatus.hourly_volume;
        console.log('Raw hourly volume data:', hourlyVolume);

        // Get all available hours up to current hour
        const currentHour = new Date().getHours();
        const relevantData = hourlyVolume.filter(item => {
          const hour = parseInt(item.hour.split(':')[0]);
          return hour <= currentHour;
        });

        console.log('Filtered data for current hour:', currentHour, relevantData);

        // Use real API data even if it's all zeros
        labels = relevantData.map(item => {
          const hour = parseInt(item.hour.split(':')[0]);
          if (hour === 0) return '12AM';
          if (hour < 12) return `${hour}AM`;
          if (hour === 12) return '12PM';
          return `${hour - 12}PM`;
        });
        throughputData = relevantData.map(item => item.volume || 0);

        console.log('Using REAL API data for throughput chart:', { labels, throughputData });
        
        // If all data is 0, show a message but still display the chart
        if (throughputData.every(val => val === 0)) {
          console.log('All throughput data is 0 - this is real data from API');
        }
      } else {
        // Only use fallback if API completely failed
        console.log('API failed or no data - using minimal fallback');
        console.log('Processing status data:', dashboardData.processingStatus);
        labels = ['No Data'];
        throughputData = [0];
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
                label: function(context) {
                  return `Volume: ${context.parsed.y} LPOs`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                display: true,
                color: 'rgba(0, 0, 0, 0.05)',
                drawBorder: false
              },
              ticks: {
                padding: 10,
                callback: function(value) {
                  return value % 1 === 0 ? value : '';
                }
              }
            },
            x: {
              grid: {
                display: false,
                drawBorder: false
              },
              ticks: {
                padding: 10
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

    // Urgency Distribution Chart - use processing status distribution if available
    if (urgencyChartRef.current) {
      let urgencyLabels = ['No Data'];
      let urgencyData = [1];
      let urgencyColors = ['#e5e7eb'];

      // Use real status distribution if available - prefer real API data
      if (dashboardData.processingStatus && dashboardData.processingStatus.status_distribution !== undefined) {
        if (dashboardData.processingStatus.status_distribution.length > 0) {
          const statusDist = dashboardData.processingStatus.status_distribution;
          urgencyLabels = statusDist.map(item => item.status || 'Unknown');
          urgencyData = statusDist.map(item => item.count || 0);

          // Map status to colors
          urgencyColors = statusDist.map(item => {
            const status = (item.status || '').toLowerCase();
            if (status.includes('critical') || status.includes('urgent')) return '#ef4444';
            if (status.includes('high') || status.includes('processing')) return '#f97316';
            if (status.includes('medium') || status.includes('pending')) return '#eab308';
            if (status.includes('low') || status.includes('complete')) return '#22c55e';
            return '#94a3b8';
          });
          console.log('Using REAL API data for status distribution:', { urgencyLabels, urgencyData });
        } else {
          // API returned empty array - show "No Data"
          urgencyLabels = ['No Processing Data'];
          urgencyData = [1];
          urgencyColors = ['#e5e7eb'];
          console.log('API returned empty status distribution - showing no data state');
        }
      } else if (dashboardData.escalation.length > 0) {
        urgencyData = generateUrgencyDataFromEscalation(dashboardData.escalation);
        console.log('Using escalation data as fallback');
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


  const generateUrgencyDataFromEscalation = (escalationData) => {
    // Combine escalation data to estimate urgency distribution
    let totalPending = 0;
    let totalProcessing = 0;
    escalationData.forEach(item => {
      const pending = item.data.find(d => d.name === 'Pending')?.displayValue || 0;
      const processing = item.data.find(d => d.name === 'Processing')?.displayValue || 0;
      totalPending += pending;
      totalProcessing += processing;
    });

    const critical = Math.floor(totalPending * 0.8); // Most pending are critical
    const high = Math.floor(totalProcessing * 0.6); // Some processing are high
    const medium = Math.floor((totalPending + totalProcessing) * 0.3);
    const low = Math.floor((totalPending + totalProcessing) * 0.2);

    return [critical || 0, high || 0, medium || 0, low || 0];
  };




  const getUrgencyBadgeClass = (level) => {
    switch (level) {
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

  // Helper function to get current data based on filter
  const getCurrentData = () => {
    const data = dateFilter === 'week' ? dashboardData.summaryData.week : dashboardData.summaryData.today;
    console.log('Getting data for filter:', dateFilter, 'Data:', data);
    return data;
  };

  return (
    <div className="page active">
      {/* Alert Strip */}
      {criticalAlert && (
        <div className="alert alert-danger" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{ cursor: 'pointer', flex: 1 }}
            onClick={() => document.getElementById('active-lpo-queue').scrollIntoView({ behavior: 'smooth' })}
          >
            <strong>3 Critical LPOs</strong> require immediate attention - SLA breached
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
        <div className="date-filter">
          <Calendar className="w-4 h-4" />
          <select
            value={dateFilter}
            onChange={(e) => {
              console.log('Filter changed from', dateFilter, 'to', e.target.value);
              setDateFilter(e.target.value);
            }}
            className="date-filter-select"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
        </div>
        <div style={{marginLeft: '10px', fontSize: '12px', color: '#666'}}>
          Showing: {dateFilter === 'week' ? 'Weekly Data' : "Today's Data"}
        </div>
      </div>

      {/* KPI Strip */}
      <div className={`kpi-strip ${dateFilter === 'week' ? 'three-cards' : 'four-cards'}`} key={dateFilter}>
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Emails Processed</div>
            <div className="kpi-change positive">
              <TrendingUp className="w-4 h-4" />
              {dateFilter === 'week' ? 'This Week' : 'Today'}
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : getCurrentData().emails_processed}
          </div>
          <div className="kpi-description">
            Total emails processed ({dateFilter === 'week' ? 'this week' : 'today'})
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">PDFs Extracted</div>
            <div className="kpi-change positive">
              <Check className="w-4 h-4" />
              Successful
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' : (getCurrentData().pdfs_extracted !== null && getCurrentData().pdfs_extracted !== undefined ? getCurrentData().pdfs_extracted : 0)}
          </div>
          <div className="kpi-description">Documents extracted</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Avg Processing Time</div>
            <div className="kpi-change">
              <Clock className="w-4 h-4" />
              Speed
            </div>
          </div>
          <div className="kpi-value">
            {loading ? '...' :
              (getCurrentData().avg_processing_time > 0
                ? `${getCurrentData().avg_processing_time.toFixed(1)}s`
                : '0s')}
          </div>
          <div className="kpi-description">Average time per email</div>
        </div>

        {dateFilter === 'today' && (
          <div className="kpi-card">
            <div className="kpi-header">
              <div className="kpi-label">Success Rate</div>
              <div className="kpi-change positive">
                <TrendingUp className="w-4 h-4" />
                Performance
              </div>
            </div>
            <div className="kpi-value">
              {loading ? '...' :
                (getCurrentData().success_rate > 0
                  ? `${getCurrentData().success_rate.toFixed(1)}%`
                  : '0%')}
            </div>
            <div className="kpi-description">
              Processing success rate
            </div>
          </div>
        )}
      </div>

      {/* Emails Summary Widget */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Email Processing Summary</h3>
            <p>Overview of stored emails and processing status</p>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Live Data</span>
            </div>
          </div>
        </div>
        <div className="card-content">
          <EmailsSummary />
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>Processing Throughput</h3>
              <p>LPOs processed per hour</p>
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
              <p>Current urgency levels</p>
            </div>
          </div>
          <div className="card-content">
            <div className="chart-container">
              <canvas ref={urgencyChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>


      {/* LPO and Emails Tables Row */}
      <div className="grid-2">
        {/* LPO Processing Queue Table */}
        <div className="card" id="active-lpo-queue">
          <div className="card-header">
            <div className="card-header-content">
              <h3>LPO Processing Queue</h3>
              <p>Sortable queue with bulk actions and real-time updates</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw className="w-4 h-4" />
                <span className="btn-text">Refresh</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate && onNavigate('queue')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Filter className="w-4 h-4" />
                <span className="btn-text">View All</span>
              </button>
            </div>
          </div>
          <div className="card-content">
            <LPOPreview onNavigate={onNavigate} />
          </div>
        </div>

        {/* All Emails Table */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>All Emails</h3>
              <p>Complete email repository with filtering and detailed view</p>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw className="w-4 h-4" />
                <span className="btn-text">Refresh</span>
              </button>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate && onNavigate('emails')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Eye className="w-4 h-4" />
                <span className="btn-text">View All</span>
              </button>
            </div>
          </div>
          <div className="card-content">
            <EmailsPreview onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </div>
  );
}