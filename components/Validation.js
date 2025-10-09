'use client';

import { useState } from 'react';
import { Plus, Edit } from 'lucide-react';
import DateFilter from './DateFilter';

export default function Validation() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [validationRules, setValidationRules] = useState([
    {
      ruleType: 'Data Completeness',
      field: 'Customer PO Number',
      condition: 'Must be present',
      expectedValue: 'Not null/empty',
      severity: 'Critical'
    },
    {
      ruleType: 'Format Validation',
      field: 'Delivery Date',
      condition: 'Valid date format',
      expectedValue: 'YYYY-MM-DD',
      severity: 'High'
    },
    {
      ruleType: 'Business Logic',
      field: 'Delivery Date',
      condition: 'Must be future date',
      expectedValue: '> Today',
      severity: 'High'
    },
    {
      ruleType: 'Reference Check',
      field: 'SKU Code',
      condition: 'Exists in catalog',
      expectedValue: 'Valid SKU',
      severity: 'Critical'
    }
  ]);

  const getSeverityBadge = (severity) => {
    const classes = {
      'Critical': 'badge-danger',
      'High': 'badge-warning',
      'Medium': 'badge-info',
      'Low': 'badge-success'
    };
    return <span className={`badge ${classes[severity] || 'badge-secondary'}`}>{severity}</span>;
  };

  return (
    <div className="page active">
      {/* Date Filter */}
      <div className="filter-bar">
        <DateFilter
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          label="Validation Date"
        />
        <button
          className="btn btn-secondary"
          onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
        >
          Reset to Today
        </button>
      </div>

      {/* KPI Strip */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Pass Rate</div>
          </div>
          <div className="kpi-value">92.1%</div>
          <div className="kpi-description">First-pass validation success</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Top Issue</div>
          </div>
          <div className="kpi-value" style={{ fontSize: '1.5rem' }}>SKU Mismatch</div>
          <div className="kpi-description">34% of validation failures</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <div className="kpi-label">Avg Fix Time</div>
          </div>
          <div className="kpi-value">23 min</div>
          <div className="kpi-description">Time to resolve issues</div>
        </div>
      </div>

      {/* Validation Rules Engine */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Validation Rules Engine</h3>
            <p>Configure automated validation checks and quality controls</p>
          </div>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rule Type</th>
                  <th>Field</th>
                  <th>Condition</th>
                  <th>Expected Value</th>
                  <th>Severity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {validationRules.map((rule, index) => (
                  <tr key={index}>
                    <td>{rule.ruleType}</td>
                    <td>{rule.field}</td>
                    <td>{rule.condition}</td>
                    <td>{rule.expectedValue}</td>
                    <td>{getSeverityBadge(rule.severity)}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        <Edit className="w-[14px] h-[14px]" />
                        Edit
                      </button>
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