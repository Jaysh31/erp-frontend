import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEye, FaEdit, FaTrash, FaPrint,
  FaFilter, FaCheckCircle, FaTimesCircle,
   FaSpinner, FaTimes,
  FaClipboardCheck, FaClipboardList, FaPercentage
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './QualityInspectionList.css';
import api from '../../src/services/api';

/* ─────────────────────────── Types ─────────────────────────── */

export interface InspectionListItem {
  id: string;
  reportNo: string;
  docNo: string;
  partProductName: string;
  partNo: string;
  customerName: string;
  date: string;
  sampleCount: number;
  outOfSpecCount: number;
}

interface InspectionApiRecord {
  name: string;
  report_no?: string;
  doc_no?: string;
  part_product_name?: string;
  part_no?: string;
  customer_name?: string;
  transaction_date?: string;
  sample_count?: number;
  out_of_spec_count?: number;
}

/** Normalizes a list-style API response: { success, data: { records, total } } or { success, data: [...] } */
const extractRecords = (payload: any): any[] => {
  if (!payload) return [];
  const data = payload.success === 1 || payload.success === 0 ? payload.data : payload;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data)) return data;
  return [];
};

export default function QualityInspectionList() {
  const navigate = useNavigate();

  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedResult, setSelectedResult] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reports, setReports] = useState<InspectionListItem[]>([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<InspectionListItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── load from GET /quality-inspection ────────────────────────── */

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/quality-inspection');

      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to fetch inspection reports');
      }

      const all: InspectionApiRecord[] = extractRecords(response.data);

      const transformed: InspectionListItem[] = all.map((r) => ({
        id: r.name,
        reportNo: r.report_no || r.name,
        docNo: r.doc_no || '',
        partProductName: r.part_product_name || '',
        partNo: r.part_no || '',
        customerName: r.customer_name || '',
        date: r.transaction_date || '',
        sampleCount: r.sample_count ?? 0,
        outOfSpecCount: r.out_of_spec_count ?? 0,
      }));

      setReports(transformed);
    } catch (err: any) {
      console.error('Error fetching inspection reports:', err);
      setError(err.response?.data?.message || 'An error occurred while loading inspection reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.reportNo.toLowerCase().includes(filterText.toLowerCase()) ||
      r.partProductName.toLowerCase().includes(filterText.toLowerCase()) ||
      r.customerName.toLowerCase().includes(filterText.toLowerCase());
    const matchesResult =
      selectedResult === 'All' ||
      (selectedResult === 'Pass' && r.outOfSpecCount === 0) ||
      (selectedResult === 'Fail' && r.outOfSpecCount > 0);
    return matchesSearch && matchesResult;
  });

  const totalReports = reports.length;
  const passedCount = reports.filter((r) => r.outOfSpecCount === 0).length;
  const failedCount = reports.filter((r) => r.outOfSpecCount > 0).length;
  const passRate = totalReports > 0 ? Math.round((passedCount / totalReports) * 100) : 0;

  const handleView = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}`);
  };

  const handleEdit = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}`);
  };

  const handlePrint = (report: InspectionListItem) => {
    navigate(`/quality-inspection/${report.id}?print=1`);
  };

  const handleDeleteClick = (report: InspectionListItem) => {
    setSelectedReport(report);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const response = await api.delete(`/quality-inspection/${selectedReport.id}`);
      if (response.data.success !== 1) {
        throw new Error(response.data?.message || 'Failed to delete inspection report');
      }
      setShowDeleteModal(false);
      setSelectedReport(null);
      toast.success('Inspection report deleted successfully!');
      fetchReports();
    } catch (err: any) {
      console.error('Error deleting inspection report:', err);
      toast.error(err.response?.data?.message || 'Failed to delete inspection report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setSelectedResult('All');
  };

  return (
    <div className={`qi-list-page ${theme}`}>
      {/* Stats Cards */}
      <div className="qi-stats-container">
        <div className="qi-stat-card" style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6' }}>
          <div className="qi-stat-icon" style={{ color: '#3B82F6' }}>
            <FaClipboardList size={18} />
          </div>
          <div className="qi-stat-content">
            <p className="qi-stat-title">Total Reports</p>
            <p className="qi-stat-value">{totalReports}</p>
          </div>
        </div>
        <div className="qi-stat-card" style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981' }}>
          <div className="qi-stat-icon" style={{ color: '#10B981' }}>
            <FaCheckCircle size={18} />
          </div>
          <div className="qi-stat-content">
            <p className="qi-stat-title">Passed</p>
            <p className="qi-stat-value">{passedCount}</p>
          </div>
        </div>
        <div className="qi-stat-card" style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444' }}>
          <div className="qi-stat-icon" style={{ color: '#EF4444' }}>
            <FaTimesCircle size={18} />
          </div>
          <div className="qi-stat-content">
            <p className="qi-stat-title">Failed</p>
            <p className="qi-stat-value">{failedCount}</p>
          </div>
        </div>
        <div className="qi-stat-card" style={{ background: '#F5F3FF', borderLeft: '4px solid #8B5CF6' }}>
          <div className="qi-stat-icon" style={{ color: '#8B5CF6' }}>
            <FaPercentage size={18} />
          </div>
          <div className="qi-stat-content">
            <p className="qi-stat-title">Pass Rate</p>
            <p className="qi-stat-value">{passRate}%</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="qi-filter-bar">
        <div className="qi-filter-left">
          <div className="qi-search-wrapper">
            <FaSearch className="qi-search-icon" />
            <input
              type="text"
              placeholder="Search by Report #, Part, or Customer..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="qi-search-input"
            />
            {filterText && (
              <button className="qi-search-clear" onClick={() => setFilterText('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="qi-filter-right">
          <select
            value={selectedResult}
            onChange={(e) => setSelectedResult(e.target.value)}
            className="qi-filter-select"
          >
            <option value="All">All Results</option>
            <option value="Pass">Pass</option>
            <option value="Fail">Fail</option>
          </select>
          <button className="qi-btn-new" onClick={() => navigate('/quality-inspection/new')}>
            <FaPlus size={12} /> Add Quality Inspection
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(filterText || selectedResult !== 'All') && (
        <div className="qi-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {filterText && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{filterText}"
            </span>
          )}
          {selectedResult !== 'All' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Result:</strong> {selectedResult}
            </span>
          )}
          <button onClick={clearFilters} className="qi-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="qi-loading">
          <p>Loading inspection reports...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="qi-error">
          <p>{error}</p>
          <button onClick={fetchReports} className="qi-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="qi-table-wrap">
          {filteredReports.length === 0 ? (
            <div className="qi-empty-state">
              <div className="qi-empty-content">
                <FaClipboardCheck size={48} />
                <p>No inspection reports found</p>
                <span>Try adjusting your search, or add a new inspection</span>
              </div>
            </div>
          ) : (
            <table className="qi-table">
              <thead>
                <tr>
                  <th className="qi-th">Report #</th>
                  <th className="qi-th">Part / Product</th>
                  <th className="qi-th">Customer</th>
                  <th className="qi-th">Date</th>
                  <th className="qi-th qi-text-center">Samples</th>
                  <th className="qi-th">Result</th>
                  <th className="qi-th qi-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="qi-tr">
                    <td className="qi-td qi-td-id">{report.reportNo}</td>
                    <td className="qi-td">
                      <div>
                        <div className="qi-td-link">{report.partProductName || '-'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{report.partNo}</div>
                      </div>
                    </td>
                    <td className="qi-td">{report.customerName || '-'}</td>
                    <td className="qi-td">{report.date ? new Date(report.date).toLocaleDateString() : '-'}</td>
                    <td className="qi-td qi-text-center">{report.sampleCount}</td>
                    <td className="qi-td">
                      {report.outOfSpecCount === 0 ? (
                        <span className="qi-status-badge qi-status-pass">
                          <FaCheckCircle size={10} /> Pass
                        </span>
                      ) : (
                        <span className="qi-status-badge qi-status-fail">
                          <FaTimesCircle size={10} /> {report.outOfSpecCount} out of spec
                        </span>
                      )}
                    </td>
                    <td className="qi-td qi-td-meta">
                      <div className="qi-action-buttons">
                        <button className="qi-action-btn qi-action-view" onClick={() => handleView(report)} title="View / Edit">
                          <FaEye size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-print" onClick={() => handlePrint(report)} title="Print">
                          <FaPrint size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-edit" onClick={() => handleEdit(report)} title="Edit">
                          <FaEdit size={12} />
                        </button>
                        <button className="qi-action-btn qi-action-delete" onClick={() => handleDeleteClick(report)} title="Delete">
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="qi-pagination">
        <div className="qi-pagination-left">
          <span className="qi-pagination-info">
            {filteredReports.length} of {reports.length} reports
          </span>
        </div>
        <div className="qi-pagination-right">
          <span className="qi-pagination-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheckCircle size={14} style={{ color: 'var(--primary-color)' }} />
            {passRate}% pass rate
          </span>
        </div>
      </div>

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedReport && (
        <div className="qi-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="qi-modal qi-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="qi-modal-header">
              <span className="qi-modal-title">Confirm Delete</span>
              <button className="qi-modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="qi-modal-body">
              <p>Are you sure you want to delete this inspection report?</p>
              <p className="qi-modal-item-name">
                <strong>{selectedReport.reportNo}</strong> - {selectedReport.partProductName}
              </p>
              <p className="qi-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="qi-modal-footer">
              <button className="qi-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="qi-btn-delete" onClick={confirmDelete} disabled={isSubmitting}>
                {isSubmitting && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}