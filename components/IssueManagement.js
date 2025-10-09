'use client';

import { useState, useEffect } from 'react';
import { Download, Settings as SettingsIcon, X } from 'lucide-react';
import DateFilter from './DateFilter';

export default function IssueManagement() {
  const [issueAlert, setIssueAlert] = useState(true);
  const [issueData, setIssueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          page: '1',
          per_page: '100'
        });

        if (selectedDate) {
          queryParams.append('date', selectedDate);
        }

        const response = await fetch(`/api/conversations?${queryParams}`);

        if (!response.ok) {
          throw new Error('Failed to fetch conversations');
        }

        const result = await response.json();

        // Handle both array response and object with conversations property
        const conversations = Array.isArray(result) ? result : (result.conversations || []);

        // Transform conversations data to issue format
        const issues = conversations.map(conv => ({
          lpoId: conv.lpo_number,
          conversationId: conv.conversation_id,
          customer: conv.contact || 'Unknown',
          issueType: conv.issue || (conv.problem ? conv.problem.substring(0, 50) : 'Issue'),
          description: conv.problem || 'No description',
          reportedValue: '-',
          expectedValue: '-',
          deviation: '-',
          kamResponse: conv.status === 'solved' ? 'Approved' : conv.status === 'in_progress' ? 'Pending' : 'Pending',
          status: conv.status === 'solved' ? 'approved' : conv.status === 'in_progress' ? 'pending' : 'pending',
          communicationMode: conv.communication_mode,
          createdAt: conv.created_at,
          time: new Date(conv.created_at).toLocaleString(),
          lastUpdate: conv.last_update
        }));

        setIssueData(issues);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [selectedDate]);


  const getStatusBadge = (status) => {
    const classes = {
      'pending': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-danger'
    };
    return <span className={`badge ${classes[status] || 'badge-secondary'}`}>{status}</span>;
  };

  const getKAMResponseBadge = (response) => {
    const classes = {
      'Pending': 'badge-warning',
      'Approved': 'badge-success',
      'Rejected': 'badge-danger'
    };
    return <span className={`badge ${classes[response] || 'badge-secondary'}`}>{response}</span>;
  };

  const handleApprove = (lpoId) => {
    setIssueData(prev => prev.map(item =>
      item.lpoId === lpoId ? { ...item, status: 'approved', kamResponse: 'Approved' } : item
    ));
  };

  const handleReject = (lpoId) => {
    setIssueData(prev => prev.map(item =>
      item.lpoId === lpoId ? { ...item, status: 'rejected', kamResponse: 'Rejected' } : item
    ));
  };

  if (loading) {
    return (
      <div className="page active">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p style={{ color: '#6b7280' }}>Loading issues...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page active">
        <div className="alert alert-danger">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="page active">
      {/* Date Filter */}
      <div className="filter-bar">
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          label="Created Date"
        />
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          Reset to Today
        </button>
      </div>

      {/* Issue Alert */}
      {issueAlert && issueData.length > 0 && (
        <div className="alert alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{issueData.length} LPOs</strong> have issues requiring attention
          </div>
          <X
            className="w-5 h-5"
            style={{ cursor: 'pointer' }}
            onClick={() => setIssueAlert(false)}
          />
        </div>
      )}

      {/* Issue Management & Approval */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Issue Management & Approval</h3>
            <p>Handle issue discrepancies and approval workflows</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const csvData = issueData.map(issue => ({
                  'LPO ID': issue.lpoId,
                  'Customer': issue.customer,
                  'Issue Type': issue.issueType,
                  'Description': issue.description,
                  'Time': issue.time,
                  'Response': issue.kamResponse
                }));
                const headers = Object.keys(csvData[0]).join(',');
                const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
                const csv = `${headers}\n${rows}`;
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'issues_export.csv';
                link.click();
              }}
            >
              <Download className="w-4 h-4" />
              Export as CSV
            </button>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                const { jsPDF } = await import('jspdf');
                await import('jspdf-autotable');
                const doc = new jsPDF();
                doc.text('Issues Report', 14, 15);
                doc.autoTable({
                  head: [['LPO ID', 'Customer', 'Issue Type', 'Description', 'Time', 'Response']],
                  body: issueData.map(issue => [
                    issue.lpoId,
                    issue.customer,
                    issue.issueType,
                    issue.description,
                    issue.time,
                    issue.kamResponse
                  ]),
                  startY: 20
                });
                doc.save('issues_export.pdf');
              }}
            >
              <Download className="w-4 h-4" />
              Export as PDF
            </button>
          </div>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>LPO ID</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Issue Type</th>
                  <th style={{ minWidth: '300px' }}>Description</th>
                  <th>Response</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issueData.map((row) => (
                  <tr key={row.lpoId}>
                    <td className="font-semibold">{row.lpoId}</td>
                    <td>{row.time}</td>
                    <td>{row.customer}</td>
                    <td>{row.issueType}</td>
                    <td style={{ maxWidth: '400px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                      <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                        {row.description}
                      </div>
                    </td>
                    <td>{getKAMResponseBadge(row.kamResponse)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                        {row.status === 'pending' ? (
                          <>
                            <button
                              className="btn btn-success"
                              style={{
                                padding: '0.375rem 0.625rem',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleApprove(row.lpoId)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{
                                padding: '0.375rem 0.625rem',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap'
                              }}
                              onClick={() => handleReject(row.lpoId)}
                            >
                              Reject
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{
                                padding: '0.375rem 0.625rem',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Escalate
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{
                              padding: '0.375rem 0.75rem',
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            View Details
                          </button>
                        )}
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