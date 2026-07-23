import { useState, useEffect, type JSX } from "react";
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
  FaBoxes,
  FaFileInvoice,
  FaUsers,
  FaList,
  FaCalendarAlt,
  FaUser,
  FaExclamationTriangle,
} from 'react-icons/fa';
import "./GRNList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────

interface GRN {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  customer_id: number | null;
  name: string | null;
  party_name: string | null;
  purchase_order_id: number | null;
  warehouse_id: number;
  received_by: string;
  vehicle_number: string | null;
  delivery_challan_no: string;
  invoice_number: string | null;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  total_ordered_qty: number;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  remarks: string | null;
  total_items: number;
  type?: string;   // "External" or "Internal"
}

interface GRNDisplay {
  id: string;
  grnNo: string;
  partyName: string;
  partyId: number | null;
  supplierId: number | null;
  customerId: number | null;
  purchaseOrderId: number | null;
  poReference: string;
  date: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  items: number;
  receivedBy: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  createdAgo: string;
  isService: boolean;   // true if type === 'External'
  isManual: boolean;
  type: string;         // add type to display
}

interface ApiResponse {
  success: number;
  data: {
    data: GRN[];
    totalRecords: number;
    page: number;
    limit: number;
  };
  totalRecords: number;
  page: number;
  limit: number;
}

type TabId = 'all' | 'po' | 'manual' | 'service';

// ─── Main Component ──────────────────────────────────────────────

export default function GRNList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  // ── State ──────────────────────────────────────────────────────
  const [allGrns, setAllGrns] = useState<GRNDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GRNDisplay | null>(null);

  // ── Tabs config ─────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: 'all', label: 'All GRNs', icon: <FaList size={14} /> },
    { id: 'po', label: 'By PO', icon: <FaFileInvoice size={14} /> },
    { id: 'manual', label: 'Manual Entry', icon: <FaBoxes size={14} /> },
    { id: 'service', label: 'Service', icon: <FaUsers size={14} /> },
  ];

  // ── Helpers ────────────────────────────────────────────────────

  const formatDateAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // ─── Fetch ALL GRNs (client‑side pagination & filtering) ──────

  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all records – use a large limit to get everything
      const params = new URLSearchParams();
      params.append('limit', '10000');

      const response = await api.get<ApiResponse>(`/grn?${params.toString()}`);

      if (response.data.success === 1) {
        const records = response.data.data.data || [];
        const transformed: GRNDisplay[] = records.map((item: GRN) => {
          // Determine service based on type
          const isService = item.type === 'External';
          const isManual = item.purchase_order_id === null && item.customer_id === null;
          const partyName = isService
            ? (item.name || item.party_name || 'N/A')
            : (item.supplier_name || item.party_name || 'N/A');

          return {
            id: item.id.toString(),
            grnNo: item.grn_number || `GRN-${String(item.id).padStart(5, '0')}`,
            partyName,
            partyId: isService ? item.customer_id : item.supplier_id,
            supplierId: item.supplier_id,
            customerId: item.customer_id,
            purchaseOrderId: item.purchase_order_id,
            poReference: item.purchase_order_id ? `PO-${String(item.purchase_order_id).padStart(5, '0')}` : 'N/A',
            date: formatDateDisplay(item.grn_date),
            status: item.status || 'draft',
            items: item.total_items || 0,
            receivedBy: item.received_by || 'N/A',
            orderedQty: item.total_ordered_qty || 0,
            receivedQty: item.total_received_qty || 0,
            acceptedQty: item.total_accepted_qty || 0,
            rejectedQty: item.total_rejected_qty || 0,
            createdAgo: formatDateAgo(item.grn_date || new Date().toISOString()),
            isService,
            isManual,
            type: item.type || '',   // store the raw type
          };
        });

        setAllGrns(transformed);
      } else {
        setError('Failed to fetch GRNs');
      }
    } catch (err) {
      console.error('Error fetching GRNs:', err);
      setError('An error occurred while fetching GRNs');
    } finally {
      setLoading(false);
    }
  };

  // ─── Effects ────────────────────────────────────────────────────

  // Initial fetch
  useEffect(() => {
    fetchGRNs();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, activeTab]);

  // ─── Filtering (all client‑side) ─────────────────────────────

  const getFilteredGrns = (): GRNDisplay[] => {
    let filtered = allGrns;

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.grnNo.toLowerCase().includes(term) ||
        g.partyName.toLowerCase().includes(term) ||
        g.poReference.toLowerCase().includes(term)
      );
    }

    // Status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }

    // Tabs
    if (activeTab === 'po') {
      filtered = filtered.filter(g => g.purchaseOrderId !== null && g.purchaseOrderId > 0);
    } else if (activeTab === 'manual') {
      filtered = filtered.filter(g => g.purchaseOrderId === null && g.customerId === null);
    } else if (activeTab === 'service') {
      // Filter by type === 'External' instead of customer_id
      filtered = filtered.filter(g => g.type === 'External');
    }

    return filtered;
  };

  const filteredGrns = getFilteredGrns();
  const totalFiltered = filteredGrns.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedGrns = filteredGrns.slice(startIndex, startIndex + itemsPerPage);

  // ─── Tab counts ──────────────────────────────────────────────────

  const tabCounts = {
    all: allGrns.length,
    po: allGrns.filter(g => g.purchaseOrderId !== null && g.purchaseOrderId > 0).length,
    manual: allGrns.filter(g => g.purchaseOrderId === null && g.customerId === null).length,
    service: allGrns.filter(g => g.type === 'External').length,   // updated
  };

  // ─── Pagination handlers (with loop) ──────────────────────────

  const goToPage = (page: number) => {
    if (page < 1) page = totalPages;
    if (page > totalPages) page = 1;
    setCurrentPage(page);
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(validCurrentPage + 1);
  const goToPrevPage = () => goToPage(validCurrentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalFiltered);

  // ── UI Helpers ──────────────────────────────────────────────────

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft': return 'grn-status-draft';
      case 'submitted': return 'grn-status-submitted';
      case 'completed': return 'grn-status-completed';
      case 'rejected': return 'grn-status-rejected';
      default: return 'grn-status-draft';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'submitted': return 'Submitted';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return 'Draft';
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────

  const handleDelete = (item: GRNDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.delete(`/grn/${selectedItem.id}`);
      if (response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        fetchGRNs();
      }
    } catch (err) {
      console.error('Error deleting GRN:', err);
      alert('Failed to delete GRN');
    }
  };

  const handleEdit = (item: GRNDisplay) => navigate(`/grn/${encodeURIComponent(item.id)}`);
  const handleView = (item: GRNDisplay) => navigate(`/grn/${encodeURIComponent(item.id)}`);
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setActiveTab('all');
  };

  // ─── Render ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className={`grn-page ${theme}`}>
        <div className="grn-loading">
          <div className="grn-loading-spinner"></div>
          <p>Loading GRNs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grn-page ${theme}`}>

      {/* ─── Tabs (BOM style) ───────────────────────────────────── */}
      <div className="grn-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`grn-tab ${activeTab === tab.id ? 'grn-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            <span className="grn-tab-count">{tabCounts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* ─── Error banner ───────────────────────────────────────── */}
      {error && (
        <div className="grn-error-banner">
          <FaExclamationTriangle size={14} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="grn-error-close">
            <FaTimes size={14} />
          </button>
        </div>
      )}

      {/* ─── Filter Bar ─────────────────────────────────────────── */}
      <div className="grn-filter-bar">
        <div className="grn-filter-left">
          <div className="grn-search-wrapper">
            <FaSearch className="grn-search-icon" size={14} />
            <input
              type="text"
              placeholder="Search GRNs by number, party, or PO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="grn-search-input"
            />
            {searchTerm && (
              <button className="grn-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="grn-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="grn-filter-select"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="grn-sort-btn">
            <FaFilter size={12} />
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="grn-btn-primary" onClick={() => navigate('/grn/new')}>
            <FaPlus size={12} /> New GRN
          </button>
        </div>
      </div>

      {/* ─── Active filters indicator ───────────────────────────── */}
      {(searchTerm || statusFilter !== 'all' || activeTab !== 'all') && (
        <div className="grn-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span>Active filters:</span>
          {activeTab !== 'all' && (
            <span><strong>Tab:</strong> {tabs.find(t => t.id === activeTab)?.label}</span>
          )}
          {searchTerm && (
            <span><strong>Search:</strong> "{searchTerm}"</span>
          )}
          {statusFilter !== 'all' && (
            <span><strong>Status:</strong> {getStatusLabel(statusFilter)}</span>
          )}
          <button onClick={clearFilters} className="grn-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* ─── Table ───────────────────────────────────────────────── */}
      <div className="grn-table-wrap">
        <table className="grn-table">
          <thead>
            <tr>
              <th className="grn-th">GRN No.</th>
              <th className="grn-th">Party</th>
              <th className="grn-th">PO</th>
              <th className="grn-th">Received By</th>
              <th className="grn-th">Date</th>
              <th className="grn-th">Status</th>
              <th className="grn-th">Qty</th>
              <th className="grn-th grn-th-meta">
                <span className="grn-count-label">{totalFiltered} records</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedGrns.length === 0 ? (
              <tr>
                <td colSpan={8} className="grn-empty-state">
                  <div className="grn-empty-content">
                    <FaBoxes size={48} />
                    <p>No GRNs found</p>
                    <span>Try adjusting your search or filter criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedGrns.map((row) => (
                <tr
                  key={row.id}
                  className="grn-tr"
                  onClick={() => handleView(row)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="grn-td grn-td-id">
                    <span className="grn-id-link">{row.grnNo}</span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-party">
                      {row.isService && <FaUsers size={12} style={{ marginRight: 4, color: 'var(--primary-color)' }} />}
                      {row.partyName}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-po-ref">{row.poReference}</span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-received-by">
                      <FaUser size={10} style={{ marginRight: 4 }} />
                      {row.receivedBy}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className="grn-date">
                      <FaCalendarAlt size={10} style={{ marginRight: 4 }} />
                      {row.date}
                    </span>
                  </td>
                  <td className="grn-td">
                    <span className={`grn-status-pill ${getStatusBadgeClass(row.status)}`}>
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="grn-td grn-td-qty">
                    <span className="grn-qty">{row.receivedQty}</span>
                  </td>
                  <td className="grn-td grn-td-meta">
                    <span className="grn-ago">{row.createdAgo}</span>
                    <span className="grn-dot">·</span>
                    <div className="grn-action-buttons">
                      <button
                        className="grn-action-btn grn-action-view"
                        onClick={(e) => { e.stopPropagation(); handleView(row); }}
                        title="View"
                      >
                        <FaEye size={12} />
                      </button>
                      <button
                        className="grn-action-btn grn-action-edit"
                        onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                        title="Edit"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        className="grn-action-btn grn-action-delete"
                        onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
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

      {/* ─── Pagination ──────────────────────────────────────────── */}
      {!loading && totalFiltered > 0 && (
        <div className="grn-pagination">
          <div className="grn-pagination-left">
            <span className="grn-pagination-label">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="grn-page-size-select"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="grn-pagination-label">entries</span>
          </div>
          <div className="grn-pagination-center">
            <button onClick={goToFirstPage} className="grn-page-btn">
              <FaAngleDoubleLeft size={12} />
            </button>
            <button onClick={goToPrevPage} className="grn-page-btn">
              <FaChevronLeft size={12} />
            </button>
            {totalFiltered > 0 && getPageNumbers().map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`grn-page-btn ${validCurrentPage === page ? 'grn-page-btn-active' : ''}`}
              >
                {page}
              </button>
            ))}
            <button onClick={goToNextPage} className="grn-page-btn">
              <FaChevronRight size={12} />
            </button>
            <button onClick={goToLastPage} className="grn-page-btn">
              <FaAngleDoubleRight size={12} />
            </button>
          </div>
          <div className="grn-pagination-right">
            <span className="grn-pagination-info">
              {totalFiltered > 0 ? (
                `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFiltered} entries`
              ) : (
                'No entries to show'
              )}
            </span>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Modal ───────────────────────────── */}
      {showDeleteConfirm && selectedItem && (
        <div className="grn-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="grn-modal grn-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="grn-modal-header">
              <span className="grn-modal-title">Confirm Delete</span>
              <button className="grn-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="grn-modal-body">
              <p>Are you sure you want to delete this GRN?</p>
              <p className="grn-modal-item-name"><strong>{selectedItem.grnNo}</strong> - {selectedItem.partyName}</p>
              <p className="grn-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="grn-modal-footer">
              <button className="grn-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="grn-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}