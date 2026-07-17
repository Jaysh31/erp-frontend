// WorkOrderList.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaBuilding,
  FaSpinner,
} from 'react-icons/fa';
import "./WorkOrder.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function WorkOrderList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/work-order?page=${currentPage}&limit=${itemsPerPage}`);
      if (response.data?.success === 1 && response.data?.data) {
        setRawData(response.data.data.records || []);
        setTotalItems(response.data.data.total || 0);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  // Simple filter
  const filteredData = rawData.filter((item: any) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || 
      (item.name || '').toLowerCase().includes(search) ||
      (item.production_item || '').toLowerCase().includes(search) ||
      (item.company || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/work-order/${deleteId}`);
      toast.success('Deleted');
      setShowDeleteConfirm(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'Draft': '#6b7280',
      'Not Started': '#f59e0b',
      'In Process': '#3b82f6',
      'Completed': '#22c55e',
      'Stopped': '#ef4444',
    };
    return (
      <span style={{
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 500,
        background: `${colors[status] || '#6b7280'}20`,
        color: colors[status] || '#6b7280',
      }}>
        {status || 'Draft'}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`wo-page ${theme}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: '12px' }}>
          <FaSpinner className="spinning" size={20} />
          <span>Loading work orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`wo-page ${theme}`}>
        <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
          <p>{error}</p>
          <button onClick={fetchData} style={{ marginTop: '12px', padding: '8px 16px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`wo-page ${theme}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Work Orders</h1>
        <button 
          onClick={() => navigate("/work-order/new")}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 500,
          }}
        >
          <FaPlus size={12} /> Add Work Order
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          style={{
            padding: '10px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '150px',
          }}
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Not Started">Not Started</option>
          <option value="In Process">In Process</option>
          <option value="Completed">Completed</option>
          <option value="Stopped">Stopped</option>
        </select>
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
            style={{
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FaTimes size={10} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>WO #</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Item</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>BOM</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Qty</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Company</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Start Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>End Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#6b7280', fontSize: '12px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                  No work orders found
                </td>
              </tr>
            ) : (
              paginatedData.map((row: any) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                  onClick={() => navigate(`/work-order/${row.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {row.name || `WO-${String(row.id).padStart(5, '0')}`}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{row.production_item || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      background: '#f3f4f6', 
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {row.bom_no || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>{row.qty || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <FaBuilding size={10} style={{ marginRight: '6px', color: '#9ca3af' }} />
                    {row.company || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>{getStatusBadge(row.status)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{formatDate(row.planned_start_date)}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{formatDate(row.planned_end_date)}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        onClick={() => navigate(`/work-order/${row.id}`)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#3b82f6',
                        }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        onClick={() => navigate(`/work-order/${row.id}`)}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#f59e0b',
                        }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => { setDeleteId(row.id); setShowDeleteConfirm(true); }}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: '#fff',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                        title="Delete"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px' }}>
        <span style={{ color: '#6b7280' }}>
          Showing {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}
            style={paginationBtnStyle(currentPage === 1)}>
            <FaAngleDoubleLeft size={12} />
          </button>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={paginationBtnStyle(currentPage === 1)}>
            <FaChevronLeft size={12} />
          </button>
          <span style={{ padding: '6px 12px', fontWeight: 500 }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={paginationBtnStyle(currentPage === totalPages)}>
            <FaChevronRight size={12} />
          </button>
          <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}
            style={paginationBtnStyle(currentPage === totalPages)}>
            <FaAngleDoubleRight size={12} />
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{
            background: '#fff', borderRadius: '12px', padding: '24px',
            maxWidth: '400px', width: '90%',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px 0' }}>Confirm Delete</h3>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>Are you sure you want to delete this work order? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {deleting ? <FaSpinner className="spinning" size={12} /> : <FaTrash size={12} />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

function paginationBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: disabled ? '#f3f4f6' : '#fff',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  };
}