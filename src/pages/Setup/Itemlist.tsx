import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaFileExcel,
  FaChevronDown
} from 'react-icons/fa';
import "./ItemList.css";
import '../Sales/SalesMobileTable.css';
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';

//hi
interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  is_stock_item: number;
  is_fixed_asset: number;
  is_sales_item: number;
  is_purchase_item: number;
  disabled: number;
  description: string;
  brand: string | null;
  valuation_method: string;
  creation: string;
  modified: string;
}

interface ApiResponse {
  success: number;
  data:
    | Item[]
    | {
        total: number;
        page: number;
        limit: number;
        records: Item[];
      };
}

export default function ItemList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRowExpand = (id: number, event?: React.MouseEvent) => {
    event?.stopPropagation();
    setExpandedRows((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch items from API with pagination
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (groupFilter !== 'all') {
        params.append('group', groupFilter);
      }

      const response = await api.get<ApiResponse>(`/item?${params.toString()}`);
      console.log('API RESPONSE for page', currentPage, ':', response.data);

      if (response.data.success === 1) {
        const raw = response.data.data;

        if (Array.isArray(raw)) {
          setItems(raw);
          setAllItems(raw);

          const isFullPage = raw.length === itemsPerPage;
          const estimatedTotal = isFullPage
            ? currentPage * itemsPerPage + 1
            : (currentPage - 1) * itemsPerPage + raw.length;

          setTotalItems(estimatedTotal);
        } else if (raw && typeof raw === 'object') {
          const records = raw.records || [];
          setItems(records);
          setTotalItems(raw.total || records.length || 0);
          setAllItems(records);
        } else {
          setItems([]);
          setTotalItems(0);
          setAllItems([]);
        }
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('An error occurred while fetching items');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, groupFilter]);

  // Delete item
  const handleDeleteItem = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await api.delete(`/item/${id}`);
      if (response.data.success === 1) {
        fetchItems();
        console.log('Item deleted successfully');
      } else {
        setError('Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('An error occurred while deleting the item');
    } finally {
      setDeletingId(null);
    }
  };

  // Handle edit
  const handleEditItem = (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/item/${item.id}`, {
      state: { itemData: item, editMode: true }
    });
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, groupFilter]);

  // Get unique item groups for filter
  const itemGroups = Array.from(new Set(allItems.map(item => item.item_group))).filter(Boolean);

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalItems);

  // Pagination navigation functions with wrap-around
  const goToPage = (page: number) => {
    if (page < 1) {
      page = totalPages;
    } else if (page > totalPages) {
      page = 1;
    }

    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => {
    if (totalPages > 0) {
      setCurrentPage(1);
    }
  };

  const goToLastPage = () => {
    if (totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  const goToNextPage = () => {
    console.log('goToNextPage clicked ->', { validCurrentPage, totalPages, totalItems, currentPage, itemsPerPage });
    if (validCurrentPage < totalPages) {
      setCurrentPage(validCurrentPage + 1);
    } else {
      setCurrentPage(1);
    }
  };

  const goToPrevPage = () => {
    if (validCurrentPage > 1) {
      setCurrentPage(validCurrentPage - 1);
    } else {
      setCurrentPage(totalPages);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGroupFilter('all');
  };

  const handleRowClick = (item: Item) => {
    navigate(`/item/${item.id}`, {
      state: { itemData: item }
    });
  };

  const handleAddItem = () => {
    navigate("/item/new");
  };

  const handleBulkUpload = () => {
    navigate("/item-bulk-upload");
  };

  return (
    <div className={`itl-page ${theme}`}>
      <style>{`
        /* ── Active Filters ── */
        .itl-active-filters {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
          border-radius: 8px;
          font-size: 12px;
          flex-wrap: wrap;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .itl-active-filters span {
          color: var(--text-primary, #111827);
        }

        .itl-clear-filters {
          margin-left: auto;
          padding: 4px 12px;
          background: var(--card-bg, white);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          transition: all 0.15s;
        }

        .itl-clear-filters:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        /* ── Filter Bar ── */
        .itl-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          flex-shrink: 0;
          padding: 12px 0;
        }

        .itl-filter-left {
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 200px;
        }

        .itl-search-wrapper {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .itl-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary, #9ca3af);
          font-size: 14px;
        }

        .itl-search-input {
          width: 100%;
          padding: 8px 36px 8px 36px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--input-bg, white);
          color: var(--text-primary, #374151);
          outline: none;
          transition: border-color 0.2s;
          height: 38px;
        }

        .itl-search-input:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .itl-search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .itl-search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-secondary, #9ca3af);
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .itl-filter-select {
          padding: 7px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          font-size: 13px;
          background: var(--card-bg, white);
          color: var(--text-primary, #374151);
          cursor: pointer;
          outline: none;
          height: 38px;
        }

        .itl-filter-select:focus {
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .itl-btn-secondary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          background: var(--card-bg, white);
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .itl-btn-secondary:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .itl-btn-primary {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: var(--primary-color, #6366f1);
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }

        .itl-btn-primary:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        /* ── Table ── */
        .itl-table-wrap {
          background: var(--card-bg, #fff);
          border-radius: 12px;
          box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
          border: 1px solid var(--border-color, #e5e7eb);
          overflow-x: auto;
          overflow-y: visible;
          flex: 0 0 auto;
        }

        .itl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .itl-th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          background: var(--layout-bg, #f9fafb);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .itl-th-meta {
          text-align: right;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }

        .itl-count-label {
          font-size: 11px;
          font-weight: 400;
          color: var(--text-secondary, #9ca3af);
          text-transform: none;
        }

        .itl-tr {
          cursor: pointer;
          transition: background 0.15s;
        }

        .itl-tr:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .itl-td {
          padding: 12px 16px;
          color: var(--text-primary, #374151);
          vertical-align: middle;
          text-align: left;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
        }

        .itl-td-code {
          font-weight: 500;
          font-family: monospace;
          color: var(--primary-color, #6366f1);
        }

        .itl-td-name {
          font-weight: 500;
        }

        .itl-td-meta {
          text-align: right;
        }

        /* ── Action Buttons ── */
        .itl-action-buttons {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
        }

        .itl-action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .itl-action-btn:hover:not(:disabled) {
          background: var(--nav-hover, #f3f4f6);
        }

        .itl-edit-btn:hover:not(:disabled) {
          color: var(--primary-color, #2563eb);
        }

        .itl-delete-btn:hover:not(:disabled) {
          color: var(--danger-color, #ef4444);
        }

        .itl-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Loading, Error, Empty ── */
        .itl-loading, .itl-error, .itl-empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .itl-loading p, .itl-error p, .itl-empty-state p {
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          margin-top: 12px;
        }

        .itl-empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-empty-content p {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary, #1e293b);
          margin: 0;
        }

        .itl-empty-content span {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-retry-btn {
          margin-top: 12px;
          padding: 8px 20px;
          background: var(--primary-color, #2563eb);
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .itl-retry-btn:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Pagination Styles - Single line layout ── */
        .itl-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 8px 0;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 8px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .itl-pagination-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-left select {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
        }

        .itl-pagination-left select:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
        }

        .itl-pagination-center {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .itl-page-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 4px;
          background: var(--card-bg, #fff);
          color: var(--text-primary, #1e293b);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 32px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .itl-page-btn:hover:not(:disabled):not(.itl-page-btn-active) {
          background: var(--nav-hover, #f8fafc);
          border-color: var(--primary-color, #2563eb);
        }

        .itl-page-btn-active {
          background: var(--primary-color, #2563eb);
          border-color: var(--primary-color, #2563eb);
          color: #fff;
        }

        .itl-page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .itl-pagination-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-label {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        .itl-pagination-info {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Dark Theme ── */
        .dark-theme .itl-page {
          background: var(--layout-bg, #0f172a);
        }

        .dark-theme .itl-search-input {
          background: var(--input-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-search-input::placeholder {
          color: var(--text-secondary, #64748b);
        }

        .dark-theme .itl-filter-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-btn-secondary {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-btn-secondary:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-btn-primary {
          background: var(--primary-color, #3b82f6);
        }

        .dark-theme .itl-btn-primary:hover {
          background: var(--primary-hover, #2563eb);
        }

        .dark-theme .itl-table-wrap {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .itl-th {
          background: var(--layout-bg, #0f172a);
          color: var(--text-secondary, #94a3b8);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .itl-td {
          color: var(--text-primary, #f8fafc);
          border-bottom-color: var(--border-color, #334155);
        }

        .dark-theme .itl-tr:hover {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-count-label {
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-active-filters {
          background: rgba(99, 102, 241, 0.08);
          border-color: var(--border-color, #334155);
        }

        .dark-theme .itl-active-filters span {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-clear-filters {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-secondary, #94a3b8);
        }

        .dark-theme .itl-page-btn {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-page-btn:hover:not(:disabled):not(.itl-page-btn-active) {
          background: var(--nav-hover, rgba(255,255,255,0.05));
        }

        .dark-theme .itl-page-size-select {
          background: var(--card-bg, #1e293b);
          border-color: var(--border-color, #334155);
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-empty-content p {
          color: var(--text-primary, #f8fafc);
        }

        .dark-theme .itl-empty-content span {
          color: var(--text-secondary, #94a3b8);
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .itl-filter-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .itl-filter-left {
            width: 100%;
          }

          .itl-search-wrapper {
            max-width: 100%;
          }

          .itl-filter-right {
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .itl-table {
            min-width: 600px;
          }

          .itl-pagination {
            flex-direction: column;
            align-items: center;
          }

          .itl-pagination-center {
            order: 2;
          }

          .itl-pagination-left,
          .itl-pagination-right {
            order: 1;
          }

          .itl-td {
            padding: 10px 12px;
            font-size: 12px;
          }

          .itl-th {
            padding: 10px 12px;
            font-size: 11px;
          }
        }

        @media (max-width: 480px) {
          .itl-filter-right {
            flex-direction: column;
            width: 100%;
          }

          .itl-filter-right > * {
            width: 100%;
          }

          .itl-btn-primary {
            justify-content: center;
          }

          .itl-btn-secondary {
            justify-content: center;
          }

          .itl-pagination {
            padding: 8px 0 0 0;
          }

          .itl-pagination-center {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      {/* Search and Filter Bar */}
      <div className="itl-filter-bar">
        <div className="itl-filter-left">
          <div className="itl-search-wrapper">
            <FaSearch className="itl-search-icon" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="itl-search-input"
            />
            {searchTerm && (
              <button className="itl-search-clear" onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="bom-filter-right">
          <select
            value={groupFilter}
            onChange={(e) => {
              setGroupFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="itl-filter-select"
          >
            <option value="all">All Groups</option>
            {itemGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <button className="itl-btn-secondary" onClick={handleBulkUpload}>
            <FaFileExcel size={13} />
            Bulk Upload
          </button>
        </div>
        <button className="itl-btn-primary" onClick={handleAddItem}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Item
          </button>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || groupFilter !== 'all') && (
        <div className="itl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {groupFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Group:</strong> {groupFilter}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="itl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="itl-loading">
          <FaSpinner className="spinning" size={24} />
          <p>Loading items...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="itl-error">
          <p>{error}</p>
          <button onClick={fetchItems} className="itl-retry-btn">Retry</button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="itl-table-wrap sales-desktop-table-wrap">
            <table className="itl-table">
              <thead>
                <tr>
                  <th className="itl-th">Item Code</th>
                  <th className="itl-th">Item Group</th>
                  <th className="itl-th">UOM</th>
                  <th className="itl-th">Type</th>
                  <th className="itl-th itl-th-meta">
                    <span className="itl-count-label">
                      {totalItems > 0
                        ? `${getStartIndex()}–${getEndIndex()}`
                        : '0'} of {totalItems}
                    </span>
                    
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="itl-empty-state">
                      <div className="itl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p>No items found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      className="itl-tr"
                      onClick={() => handleRowClick(row)}
                    >
                      <td className="itl-td itl-td-code">{row.item_code}</td>
                      <td className="itl-td">{row.item_group}</td>
                      <td className="itl-td">{row.stock_uom}</td>
                      <td className="itl-td">
                        {row.is_stock_item === 1 ? 'Stock' : 'Non-Stock'}
                      </td>
                      <td className="itl-td itl-td-meta">
                        <div className="itl-action-buttons" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="itl-action-btn itl-edit-btn"
                            onClick={(e) => handleEditItem(row, e)}
                            title="Edit item"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            className="itl-action-btn itl-delete-btn"
                            onClick={(e) => handleDeleteItem(row.id, e)}
                            disabled={deletingId === row.id}
                            title="Delete item"
                          >
                            {deletingId === row.id ? (
                              <FaSpinner className="spinning" size={14} />
                            ) : (
                              <FaTrash size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Table Section */}
          <div className="sales-mobile-list-wrap">
            <div className="sales-mobile-list-header">
              <div className="sales-mobile-th-primary">
                <span className="sales-mobile-th-cell">Item Code</span>
                <span className="sales-mobile-th-sep">•</span>
                <span className="sales-mobile-th-cell">Item Group</span>
              </div>
              <div className="sales-mobile-th-right">
                <span className="sales-count-label">
                  {totalItems > 0
                    ? `${getStartIndex()}–${getEndIndex()}`
                    : '0'} of {totalItems}
                </span>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="itl-empty-state">
                <div className="itl-empty-content">
                  <p>No Items found</p>
                  <span>Try adjusting your search criteria</span>
                </div>
              </div>
            ) : (
              <div className="sales-mobile-cards">
                {items.map((row) => {
                  const isExpanded = expandedRows.has(row.id);
                  return (
                    <div
                      key={row.id}
                      className={`sales-mobile-card ${isExpanded ? "sales-mobile-card-expanded" : ""}`}
                    >
                      <div
                        className="sales-mobile-card-header"
                        onClick={() => toggleRowExpand(row.id)}
                      >
                        <div className="sales-mobile-card-primary">
                          <div className="sales-mobile-card-primary-row">
                            <span className="sales-mobile-item-name">
                              {row.item_code}
                            </span>
                            <span className="sales-mobile-header-badge">
                              <span className="itl-td">
                                {row.item_group}
                              </span>
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className={`sales-mobile-dropdown-btn ${isExpanded ? "expanded" : ""}`}
                          onClick={(e) => toggleRowExpand(row.id, e)}
                          aria-label={isExpanded ? "Collapse item details" : "Expand item details"}
                          title={isExpanded ? "Collapse" : "Expand"}
                        >
                          <FaChevronDown size={13} className="sales-mobile-chevron" />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="sales-mobile-card-details">
                          <div className="sales-mobile-detail-row">
                            <span className="sales-mobile-detail-label">UOM</span>
                            <span className="sales-mobile-detail-value">{row.stock_uom}</span>
                          </div>

                          <div className="sales-mobile-detail-row">
                            <span className="sales-mobile-detail-label">Type</span>
                            <span className="sales-mobile-detail-value"> {row.is_stock_item === 1 ? 'Stock' : 'Non-Stock'}</span>
                          </div>

                          <div className="sales-mobile-detail-footer">
                            <span className="sales-mobile-card-meta-text">
                              {/*rowNumber} of {totalItems*/}
                            </span>
                            <div className="sales-mobile-action-buttons">
                              <button
                                className="qt-action-btn qt-action-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditItem(row, e);
                                }}
                                title="Edit"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                className="qt-action-btn qt-action-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(row.id, e);
                                }}
                                title="Delete"
                                disabled={deletingId === row.id}
                              >
                                {deletingId === row.id ? (
                                  <FaSpinner className="spinning" size={12} />
                                ) : (
                                  <FaTrash size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {(totalItems > 0 || items.length > 0) && (
            <div className="itl-pagination">
              {/* Left: Show dropdown + Showing entries info */}
              <div className="itl-pagination-left">
                <span className="itl-pagination-label">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="itl-page-size-select"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="itl-pagination-info">
                  {totalItems > 0
                    ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalItems} entries`
                    : 'No entries to show'}
                </span>
              </div>

              {/* Center: Page navigation buttons */}
              <div className="itl-pagination-center">
                <button
                  onClick={goToFirstPage}
                  disabled={validCurrentPage === 1 || totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaChevronLeft size={12} />
                </button>
                {totalPages > 0 && getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`itl-page-btn ${validCurrentPage === page ? 'itl-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={goToNextPage}
                  disabled={totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaChevronRight size={12} />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={validCurrentPage === totalPages || totalPages === 0}
                  className="itl-page-btn"
                >
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>

              {/* Right: Page info */}
              <div className="itl-pagination-right">
                <span className="itl-pagination-info">
                  Page {validCurrentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}