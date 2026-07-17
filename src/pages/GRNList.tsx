// GRNList.tsx
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
  FaClipboardCheck,
  FaClock,
  FaExclamationTriangle,
  FaUser,
  FaCalendarAlt,
  FaUsers,
  FaFileInvoice,
  FaList,
} from 'react-icons/fa';
import "./GRNList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface GRN {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  customer_id: number | null;
  name: string | null;           // customer name if service
  party_name: string | null;     // fallback party name
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
  type?: string;
}

interface GRNDisplay {
  id: string;
  grnNo: string;
  partyName: string;           // supplier_name or customer name
  partyId: number | null;      // supplier_id or customer_id
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
  isService: boolean;
  isManual: boolean;
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

export default function GRNList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const [allGrns, setAllGrns] = useState<GRNDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GRNDisplay | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('all');

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: JSX.Element }[] = [
    { id: 'all', label: 'All', icon: <FaList size={14} /> },
    { id: 'po', label: 'By PO', icon: <FaFileInvoice size={14} /> },
    { id: 'manual', label: 'Manual Entry', icon: <FaBoxes size={14} /> },
    { id: 'service', label: 'Service', icon: <FaUsers size={14} /> },
  ];

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date to "X h" or "X d" format
  const formatDate = (dateString: string) => {
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

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Fetch GRNs from API with pagination and filters
  const fetchGRNs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get<ApiResponse>(`/grn?${params.toString()}`);
      
      if (response.data.success === 1) {
        const apiData = response.data.data;
        const records = apiData.data || [];
        const total = apiData.totalRecords || response.data.totalRecords || 0;
        
        setTotalRecords(total);
        
        // Transform API data to display format
        const transformedData: GRNDisplay[] = records.map((item: GRN) => {
          const isService = item.customer_id !== null && item.customer_id !== undefined;
          const isManual = item.purchase_order_id === null && item.customer_id === null;
          const partyName = isService 
            ? (item.name || item.party_name || 'N/A')
            : (item.supplier_name || item.party_name || 'N/A');
          
          return {
            id: item.id.toString(),
            grnNo: item.grn_number || `GRN-${String(item.id).padStart(5, '0')}`,
            partyName: partyName,
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
            createdAgo: formatDate(item.grn_date || new Date().toISOString()),
            isService: isService,
            isManual: isManual,
          };
        });
        
        setAllGrns(transformedData);
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

  // Fetch when dependencies change
  useEffect(() => {
    fetchGRNs();
  }, [currentPage, itemsPerPage, debouncedSearchTerm, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, activeTab]);

  // ─── Tab filtering logic ──────────────────────────────────────────────
  const getFilteredGrns = (): GRNDisplay[] => {
    let filtered = allGrns;
    
    // Tab filter
    if (activeTab === 'po') {
      filtered = filtered.filter(g => g.purchaseOrderId !== null && g.purchaseOrderId > 0);
    } else if (activeTab === 'manual') {
      filtered = filtered.filter(g => g.purchaseOrderId === null && g.customerId === null);
    } else if (activeTab === 'service') {
      filtered = filtered.filter(g => g.customerId !== null && g.customerId > 0);
    }
    // 'all' shows everything
    
    // Additional search & status filters are already applied on the server,
    // but we also apply them client‑side for safety (since tabs are client‑side)
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(g =>
        g.grnNo.toLowerCase().includes(term) ||
        g.partyName.toLowerCase().includes(term) ||
        g.poReference.toLowerCase().includes(term)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.status === statusFilter);
    }
    
    return filtered;
  };

  const filteredGrns = getFilteredGrns();
  const totalFiltered = filteredGrns.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);

  // Paginate the filtered list
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGrns = filteredGrns.slice(startIndex, startIndex + itemsPerPage);

  // ─── Stats (computed from filtered data) ──────────────────────────────


  // ─── Handlers ──────────────────────────────────────────────────────────
  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedGrns.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedGrns.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(totalPages);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToPrevPage = () => goToPage(currentPage - 1);

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (item: GRNDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedItem) {
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
    }
  };

  const handleEdit = (item: GRNDisplay) => {
    navigate(`/grn/${encodeURIComponent(item.id)}`);
  };

  const handleView = (item: GRNDisplay) => {
    navigate(`/grn/${encodeURIComponent(item.id)}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDebouncedSearchTerm('');
    setActiveTab('all');
  };

  const getStartIndex = () => {
    return (currentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(currentPage * itemsPerPage, totalFiltered);
  };

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

  return (
    <div className={`grn-page ${theme}`}>
      {/* ─── Tabs ─────────────────────────────────────────────────────── */}
      <div className="grn-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`grn-tab-btn ${activeTab === tab.id ? 'grn-tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

        

      {/* ─── Search and Filter Bar ───────────────────────────────────── */}
      <div className="grn-filter-bar">
        <div className="grn-filter-left">
          <div className="grn-search-wrapper">
            <FaSearch className="grn-search-icon" />
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
          <button className="grn-filter-btn" onClick={() => setCurrentPage(1)}>
            <FaFilter size={12} />
            Filter
          </button>
          <button className="grn-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="grn-btn-primary" onClick={() => navigate("/grn/new")}>
            <FaPlus size={12} />
            New GRN
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all' || activeTab !== 'all') && (
        <div className="grn-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {activeTab !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Tab:</strong> {tabs.find(t => t.id === activeTab)?.label}
            </span>
          )}
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {getStatusLabel(statusFilter)}
            </span>
          )}
          <button 
            onClick={clearFilters}
            className="grn-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grn-loading">
          <div className="grn-loading-spinner"></div>
          <p>Loading GRNs...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="grn-error">
          <p>{error}</p>
          <button onClick={fetchGRNs} className="grn-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="grn-table-wrap">
            <table className="grn-table">
              <thead>
                <tr>
                  <th className="grn-th-check">
                    <input type="checkbox" checked={allChecked && paginatedGrns.length > 0} onChange={toggleAll} className="grn-checkbox" />
                  </th>
                  <th className="grn-th">GRN No.</th>
                  <th className="grn-th">Party</th>
                  <th className="grn-th">PO</th>
                  <th className="grn-th">Received By</th>
                  <th className="grn-th">Date</th>
                  <th className="grn-th">Status</th>
                  <th className="grn-th">Qty (Recived)</th>
                  <th className="grn-th grn-th-meta">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGrns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="grn-empty-state">
                      <div className="grn-empty-content">
                        <FaBoxes size={48} style={{ color: 'var(--text-secondary)' }} />
                        <p>No GRNs found</p>
                        <span>Try adjusting your search or filter criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedGrns.map((row) => (
                    <tr
                      key={row.id}
                      className={`grn-tr ${selected.has(row.id) ? "grn-tr-selected" : ""}`}
                    >
                      <td className="grn-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="grn-checkbox" />
                      </td>
                      <td className="grn-td grn-td-id">
                        <span className="grn-id">{row.grnNo}</span>
                      </td>
                      <td className="grn-td grn-td-supplier">
                        <span className="grn-supplier-name">
                          {row.isService && <FaUsers size={10} style={{ marginRight: 4, color: 'var(--primary-color)' }} />}
                          {row.partyName}
                        </span>
                      </td>
                      <td className="grn-td grn-td-po">
                        <span className="grn-po-ref">{row.poReference}</span>
                      </td>
                      <td className="grn-td grn-td-received-by">
                        <span className="grn-received-by">
                          <FaUser size={10} />
                          {row.receivedBy}
                        </span>
                      </td>
                      <td className="grn-td grn-td-date">
                        <span className="grn-date">
                          <FaCalendarAlt size={10} />
                          {row.date}
                        </span>
                      </td>
                      <td className="grn-td">
                        <span className={`grn-status-badge ${getStatusBadgeClass(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </span>
                      </td>
                      <td className="grn-td grn-td-qty">
                        <div className="grn-qty-info">
                          <span className="grn-qty-received">{row.receivedQty}</span>
                 
                        </div>
                      </td>
                      <td className="grn-td grn-td-meta" onClick={(e) => e.stopPropagation()}>
                        <span className="grn-ago">{row.createdAgo}</span>
                        <span className="grn-dot">·</span>
                        <div className="grn-action-buttons">
                          <button 
                            className="grn-action-btn grn-action-view" 
                            onClick={() => handleView(row)}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button 
                            className="grn-action-btn grn-action-edit" 
                            onClick={() => handleEdit(row)}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button 
                            className="grn-action-btn grn-action-delete" 
                            onClick={() => handleDelete(row)}
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
              <span className="grn-pagination-total">of {totalFiltered}</span>
            </div>
            <div className="grn-pagination-center">
              <button 
                onClick={goToFirstPage} 
                disabled={currentPage === 1 || totalFiltered === 0} 
                className="grn-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1 || totalFiltered === 0} 
                className="grn-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFiltered > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`grn-page-btn ${currentPage === page ? 'grn-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages || totalFiltered === 0} 
                className="grn-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages || totalFiltered === 0} 
                className="grn-page-btn"
              >
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
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="grn-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="grn-modal grn-modal-delete">
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