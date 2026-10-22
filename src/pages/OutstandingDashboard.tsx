import React, { useState } from 'react';
import {
  FaUser,
  FaEye,
  FaEdit,
  FaTrash,
  FaPrint,
  FaDownload
} from 'react-icons/fa';

const OutstandingDashboard: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  // Sample data
  const kpiData = [
    { label: 'Total Outstanding', value: '₹4,85,000', change: '+12%', color: '#2563eb' },
    { label: 'Overdue Amount', value: '₹1,25,000', change: '+8%', color: '#ef4444' },
    { label: 'Receivables This Month', value: '₹2,30,000', change: '+15%', color: '#10b981' },
    { label: 'Average Collection Days', value: '45', change: '-3', color: '#8b5cf6' }
  ];

  const outstandingItems = [
    {
      id: '1',
      customer: 'ABC Traders Pvt Ltd',
      receiptNo: 'SR-2024-002',
      invoiceNo: 'INV-2024-002',
      dueDate: '2024-03-15',
      outstandingAmount: 44400,
      agingDays: 45,
      status: '31-60 days'
    },
    {
      id: '2',
      customer: 'PQR Solutions Ltd',
      receiptNo: 'SR-2024-003',
      invoiceNo: 'INV-2024-003',
      dueDate: '2024-02-28',
      outstandingAmount: 53100,
      agingDays: 62,
      status: '61-90 days'
    },
    {
      id: '3',
      customer: 'RST Industries',
      receiptNo: 'SR-2024-005',
      invoiceNo: 'INV-2024-005',
      dueDate: '2024-03-20',
      outstandingAmount: 51700,
      agingDays: 15,
      status: '0-30 days'
    },
    {
      id: '4',
      customer: 'LMN Group',
      receiptNo: 'SR-2024-004',
      invoiceNo: 'INV-2024-004',
      dueDate: '2024-02-10',
      outstandingAmount: 0,
      agingDays: 0,
      status: 'Paid'
    },
    {
      id: '5',
      customer: 'XYZ Enterprises',
      receiptNo: 'SR-2024-006',
      invoiceNo: 'INV-2024-006',
      dueDate: '2024-03-25',
      outstandingAmount: 75000,
      agingDays: 5,
      status: '0-30 days'
    }
  ];

  const getAgingColor = (status: string) => {
    switch (status) {
      case '0-30 days': return '#10b981';
      case '31-60 days': return '#f59e0b';
      case '61-90 days': return '#ef4444';
      case '90+ days': return '#dc2626';
      default: return '#94a3b8';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="outstanding-dashboard">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span>Accounts</span>
            <span className="separator">/</span>
            <span>Receivables</span>
            <span className="separator">/</span>
            <span className="active">Outstanding Receivables</span>
          </div>
          <h1 className="page-title">Outstanding Receivables</h1>
          <p className="page-subtitle">Track and manage customer outstanding balances</p>
        </div>
        <div className="page-header-right">
          <button className="btn-secondary">
            <FaDownload /> Export Report
          </button>
          <button className="btn-secondary">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-cards">
        {kpiData.map((kpi, index) => (
          <div key={index} className="kpi-card" style={{ borderLeftColor: kpi.color }}>
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
              <span className={`kpi-change ${kpi.change.startsWith('+') ? 'positive' : 'negative'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h3>Outstanding by Customer</h3>
            <select className="chart-filter">
              <option value="30">Last 30 Days</option>
              <option value="60">Last 60 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div className="bar" style={{ height: '80%', background: '#2563eb' }}>
                <span className="bar-label">ABC Traders</span>
                <span className="bar-value">₹1,20,000</span>
              </div>
              <div className="bar" style={{ height: '60%', background: '#3b82f6' }}>
                <span className="bar-label">PQR Solutions</span>
                <span className="bar-value">₹85,000</span>
              </div>
              <div className="bar" style={{ height: '45%', background: '#60a5fa' }}>
                <span className="bar-label">RST Industries</span>
                <span className="bar-value">₹65,000</span>
              </div>
              <div className="bar" style={{ height: '30%', background: '#93c5fd' }}>
                <span className="bar-label">XYZ Enterprises</span>
                <span className="bar-value">₹45,000</span>
              </div>
              <div className="bar" style={{ height: '15%', background: '#bfdbfe' }}>
                <span className="bar-label">LMN Group</span>
                <span className="bar-value">₹20,000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>Aging Analysis</h3>
            <span className="chart-subtitle">As of {formatDate(new Date().toISOString())}</span>
          </div>
          <div className="aging-chart">
            <div className="aging-item">
              <span className="aging-label">0-30 Days</span>
              <div className="aging-bar-container">
                <div className="aging-bar" style={{ width: '40%', background: '#10b981' }}></div>
              </div>
              <span className="aging-value">₹1,95,000</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">31-60 Days</span>
              <div className="aging-bar-container">
                <div className="aging-bar" style={{ width: '25%', background: '#f59e0b' }}></div>
              </div>
              <span className="aging-value">₹1,25,000</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">61-90 Days</span>
              <div className="aging-bar-container">
                <div className="aging-bar" style={{ width: '15%', background: '#ef4444' }}></div>
              </div>
              <span className="aging-value">₹75,000</span>
            </div>
            <div className="aging-item">
              <span className="aging-label">90+ Days</span>
              <div className="aging-bar-container">
                <div className="aging-bar" style={{ width: '10%', background: '#dc2626' }}></div>
              </div>
              <span className="aging-value">₹45,000</span>
            </div>
          </div>
        </div>
      </div>

      {/* Outstanding Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Outstanding Receivables Details</h3>
          <div className="table-filters">
            <select
              className="filter-select"
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
            >
              <option value="all">All Customers</option>
              <option value="abc">ABC Traders</option>
              <option value="pqr">PQR Solutions</option>
              <option value="rst">RST Industries</option>
            </select>
            <div className="date-range">
              <input
                type="date"
                className="filter-input"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                placeholder="Start"
              />
              <span>to</span>
              <input
                type="date"
                className="filter-input"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                placeholder="End"
              />
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Receipt</th>
              <th>Invoice</th>
              <th>Due Date</th>
              <th>Outstanding Amount</th>
              <th>Aging Days</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {outstandingItems.filter(item => item.outstandingAmount > 0).map(item => {
              const agingColor = getAgingColor(item.status);
              return (
                <tr key={item.id}>
                  <td>
                    <div className="customer-info">
                      <FaUser className="customer-icon" />
                      <span>{item.customer}</span>
                    </div>
                  </td>
                  <td>{item.receiptNo}</td>
                  <td>{item.invoiceNo}</td>
                  <td>{formatDate(item.dueDate)}</td>
                  <td className="amount text-red">{formatCurrency(item.outstandingAmount)}</td>
                  <td>
                    <span
                      className="aging-badge"
                      style={{ background: agingColor + '15', color: agingColor }}
                    >
                      {item.agingDays} days
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{ background: agingColor + '15', color: agingColor }}
                    >
                      <span className="dot" style={{ background: agingColor }} />
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" title="View">
                        <FaEye />
                      </button>
                      <button className="action-btn" title="Edit">
                        <FaEdit />
                      </button>
                      <button className="action-btn" title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        /* =========================================================
           OUTSTANDING RECEIVABLES DASHBOARD
           ========================================================= */
        .outstanding-dashboard {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
            'Helvetica Neue', Arial, sans-serif;
          color: #1e293b;
        }

        /* ============ PAGE HEADER ============ */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .page-header-left {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #64748b;
        }

        .breadcrumb .separator {
          color: #cbd5e1;
          user-select: none;
        }

        .breadcrumb .active {
          color: #2563eb;
          font-weight: 600;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .page-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .page-header-right {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        /* ============ SECONDARY BUTTONS ============ */
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        }

        .btn-secondary:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
        }

        .btn-secondary svg {
          font-size: 13px;
          color: #64748b;
        }

        .btn-secondary:hover svg {
          color: #2563eb;
        }

        /* ============ KPI CARDS ============ */
        .kpi-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          border-left: 4px solid #2563eb;
          transition: all 0.2s;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .kpi-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .kpi-change {
          font-size: 12px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .kpi-change.positive {
          color: #10b981;
          background: #ecfdf5;
        }

        .kpi-change.negative {
          color: #ef4444;
          background: #fef2f2;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-top: 4px;
        }

        /* ============ CHARTS SECTION ============ */
        .charts-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .chart-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          padding: 20px 24px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          gap: 12px;
        }

        .chart-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .chart-subtitle {
          font-size: 13px;
          color: #94a3b8;
        }

        .chart-filter {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          outline: none;
        }

        .chart-filter:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .chart-placeholder {
          height: 220px;
          display: flex;
          align-items: flex-end;
          padding-top: 16px;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          width: 100%;
          height: 100%;
          gap: 12px;
        }

        .bar {
          flex: 1;
          min-height: 20px;
          border-radius: 4px 4px 0 0;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          padding: 6px 4px;
          transition: all 0.3s;
          cursor: pointer;
        }

        .bar:hover {
          filter: brightness(1.08);
        }

        .bar-label {
          font-size: 11px;
          color: #475569;
          margin-bottom: 4px;
          font-weight: 500;
          text-align: center;
        }

        .bar-value {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          background: rgba(255, 255, 255, 0.9);
          padding: 2px 6px;
          border-radius: 4px;
        }

        /* ============ AGING CHART ============ */
        .aging-chart {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding: 10px 0;
        }

        .aging-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .aging-label {
          font-size: 14px;
          color: #64748b;
          min-width: 80px;
          font-weight: 500;
        }

        .aging-bar-container {
          flex: 1;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
        }

        .aging-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.6s ease;
        }

        .aging-value {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          min-width: 100px;
          text-align: right;
        }

        /* ============ TABLE CONTAINER ============ */
        .table-container {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .table-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .table-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .filter-select,
        .filter-input {
          padding: 7px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          outline: none;
          transition: all 0.2s ease;
        }

        .filter-select:focus,
        .filter-input:focus {
          border-color: #2563eb;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .date-range span {
          color: #94a3b8;
          font-size: 13px;
        }

        /* ============ DATA TABLE (COMPACT HEIGHT) ============ */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table thead {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }

        .data-table th {
          padding: 8px 16px; /* Reduced vertical padding */
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          white-space: nowrap;
        }

        .data-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s ease;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        .data-table tbody tr:last-child {
          border-bottom: none;
        }

        .data-table td {
          padding: 8px 16px; /* Reduced vertical padding */
          color: #334155;
          vertical-align: middle;
        }

        .data-table .amount {
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .data-table .text-red {
          color: #ef4444;
        }

        /* ============ CUSTOMER INFO ============ */
        .customer-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          color: #1e293b;
        }

        .customer-icon {
          color: #94a3b8;
          font-size: 14px;
          flex-shrink: 0;
        }

        /* ============ AGING / STATUS BADGES ============ */
        .aging-badge {
          display: inline-block;
          padding: 3px 8px; /* Slightly reduced */
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px; /* Slightly reduced */
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* ============ ACTION BUTTONS ============ */
        .action-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          transition: color 0.2s ease, transform 0.2s ease;
          font-size: 14px;
          padding: 2px;
        }

        .action-btn:hover {
          color: #2563eb;
          transform: scale(1.1);
        }

        .action-btn[title="Delete"]:hover {
          color: #ef4444;
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1200px) {
          .kpi-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 992px) {
          .charts-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .outstanding-dashboard {
            padding: 16px;
          }

          .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .page-header-right {
            justify-content: flex-start;
          }

          .kpi-cards {
            grid-template-columns: 1fr 1fr;
          }

          .table-header {
            flex-direction: column;
            align-items: stretch;
          }

          .table-filters {
            flex-direction: column;
            align-items: stretch;
          }

          .date-range {
            flex-direction: column;
            align-items: stretch;
          }

          .date-range input {
            width: 100%;
          }

          .data-table {
            display: block;
            overflow-x: auto;
            white-space: nowrap;
            -webkit-overflow-scrolling: touch;
          }
        }

        @media (max-width: 480px) {
          .kpi-cards {
            grid-template-columns: 1fr;
          }

          .page-title {
            font-size: 20px;
          }

          .btn-secondary {
            flex: 1;
            justify-content: center;
          }

          .bar-chart {
            flex-direction: column;
            align-items: stretch;
            height: auto;
            gap: 8px;
          }

          .bar {
            min-height: 40px;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            border-radius: 6px;
          }

          .bar-label {
            margin: 0;
            text-align: left;
          }

          .bar-value {
            background: rgba(255, 255, 255, 0.85);
          }

          .aging-label {
            min-width: 70px;
            font-size: 13px;
          }

          .aging-value {
            min-width: 85px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

export default OutstandingDashboard;