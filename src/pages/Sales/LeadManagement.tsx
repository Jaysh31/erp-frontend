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
} from "react-icons/fa";
import "./LeadManagement.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";
import toast from 'react-hot-toast';

// ─── types ──────────────────────────────────────────────────────────────

type LeadStatus = "Lead" | "Contacted" | "Qualified" | "Unqualified" | "Converted";

interface LeadDisplay {
  id: string; 
  recordId?: number; 
  leadName: string;
  organizationName: string;
  jobTitle: string;
  status: LeadStatus;
  leadType: string;
  source: string;
  email: string;
  mobileNo: string;
  city: string;
  country: string;
  createdOn: string;
  createdAgo: string;
}

const STATUS_CLASS: Record<LeadStatus, string> = {
  Lead: "s-open",
  Contacted: "s-inprocess",
  Qualified: "s-completed",
  Unqualified: "s-cancelled",
  Converted: "s-onhold",
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  Lead: "Lead",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Unqualified: "Unqualified",
  Converted: "Converted",
};

// ─── raw API record -> display record ──────────────────────────────────

function mapApiLeadToDisplay(raw: any, formatDate: (d: string) => string): LeadDisplay {
  const firstName = raw.first_name || "";
  const lastName = raw.last_name || "";
  return {
    id: String(raw.name ?? raw.id ?? ""),
    recordId: raw.id != null ? Number(raw.id) : undefined,
    leadName: raw.lead_name || [firstName, lastName].filter(Boolean).join(" ") || "—",
    organizationName: raw.company_name || "",
    jobTitle: raw.job_title || "",
    status: (raw.status as LeadStatus) || "Lead",
    leadType: raw.type || "",
    source: raw.utm_source || raw.request_type || "",
    email: raw.email_id || "",
    mobileNo: raw.mobile_no || "",
    city: raw.city || "",
    country: raw.country || "",
    createdOn: raw.creation || raw.createdOn || new Date().toISOString(),
    createdAgo: formatDate(raw.creation || raw.createdOn || new Date().toISOString()),
  };
}

function extractList(raw: any): any[] {
  const list = raw?.data?.records ?? raw?.data ?? raw?.leads ?? raw?.results ?? raw;
  return Array.isArray(list) ? list : [];
}

export default function LeadManagement() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [leads, setLeads] = useState<LeadDisplay[]>([]);
  const [rawLeads, setRawLeads] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadDisplay | null>(null);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const nowDate = new Date();
    const diffMs = nowDate.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    if (diffDays < 7) return `${diffDays} d`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} w`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} mo`;
    return `${Math.floor(diffDays / 365)} y`;
  };

  // ─── fetch from GET /lead ───────────────────────────────────────────

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/lead");
      console.log("GET /lead raw response:", response.data);

      const list = extractList(response.data);
      setRawLeads(list);

      if (list.length > 0) {
        console.log("First raw lead record:", list[0]);
      }

      const transformedData: LeadDisplay[] = list.map((item) => mapApiLeadToDisplay(item, formatDate));

      setTotalItems(transformedData.length);
      setLeads(transformedData);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.message || "An error occurred while loading leads");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredData = leads.filter((item) => {
    const matchesSearch =
      item.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const filteredTotalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  const validCurrentPage = Math.min(currentPage, filteredTotalPages || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((r) => r.id)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= filteredTotalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToLastPage = () => goToPage(filteredTotalPages);
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
    let endPage = Math.min(filteredTotalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleDelete = (item: LeadDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  // ✅ FIXED: Better delete with detailed error handling
  const confirmDelete = async () => {
    if (!selectedItem) return;

    setDeleting(true);
    setError(null);

    try {
      // Log the delete URL for debugging
      const deleteUrl = `/lead/${selectedItem.recordId}`;
      console.log(`Attempting to delete lead with ID: ${selectedItem.recordId}`);
      console.log(`DELETE URL: ${deleteUrl}`);
      
      const response = await api.delete(deleteUrl);
      console.log("Delete response:", response);

      // Check if the response indicates success
      if (response.data && response.data.success === 1) {
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        toast.success(response.data.message || "Lead deleted successfully!");
        await fetchLeads();
      } else {
        const errorMsg = response.data?.message || "Failed to delete lead";
        console.error("Delete failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error deleting lead:", err);
      
      // Detailed error logging
      if (err.response) {
        // The request was made and the server responded with a status code
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
        
        const errorMsg = err.response.data?.message || `Server error: ${err.response.status}`;
        toast.error(errorMsg);
        setError(errorMsg);
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        const errorMsg = "No response from server. Please check your connection and CORS settings.";
        toast.error(errorMsg);
        setError(errorMsg);
      } else {
        // Something happened in setting up the request
        console.error("Request setup error:", err.message);
        const errorMsg = "Failed to send delete request. Please try again.";
        toast.error(errorMsg);
        setError(errorMsg);
      }
    } finally {
      setDeleting(false);
    }
  };

  const findRawById = (id: string) => rawLeads.find((l) => String(l.name ?? l.id) === id);

  const goToLead = (item: LeadDisplay) => {
    const raw = findRawById(item.id);
    navigate(`/leads/${encodeURIComponent(item.id)}`, { state: { lead: raw } });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const getStartIndex = () => (validCurrentPage - 1) * itemsPerPage + 1;
  const getEndIndex = () => Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);

  return (
    <div className={`jc-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="jc-filter-bar">
        <div className="jc-filter-left">
          <div className="jc-search-wrapper">
            <FaSearch className="jc-search-icon" />
            <input
              type="text"
              placeholder="Search leads by name, organization, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="jc-search-input"
            />
            {searchTerm && (
              <button className="jc-search-clear" onClick={() => setSearchTerm("")}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="jc-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="jc-filter-select"
          >
            <option value="all">All Status</option>
            <option value="Lead">Lead</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Unqualified">Unqualified</option>
            <option value="Converted">Converted</option>
          </select>
          <button className="jc-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="jc-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="jc-btn-primary" onClick={() => navigate("/leads/new")}>
            <FaPlus size={12} />
            Add Lead
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== "all") && (
        <div className="jc-active-filters">
          <FaFilter size={12} style={{ color: "var(--primary-color)" }} />
          <span style={{ color: "var(--text-primary)" }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== "all" && (
            <span style={{ color: "var(--text-primary)" }}>
              <strong>Status:</strong> {STATUS_LABELS[statusFilter as LeadStatus]}
            </span>
          )}
          <button onClick={clearFilters} className="jc-clear-filters">
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="jc-loading">
          <p>Loading leads...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="jc-error">
          <p>{error}</p>
          <button onClick={fetchLeads} className="jc-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="jc-table-wrap">
            <table className="jc-table">
              <thead>
                <tr>
                  <th className="jc-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="jc-checkbox" />
                  </th>
                  <th className="jc-th">Lead ID</th>
                  <th className="jc-th">Name</th>
                  <th className="jc-th">Organization</th>
                  <th className="jc-th">Email</th>
                  <th className="jc-th">Mobile No</th>
                  <th className="jc-th">Source</th>
                  <th className="jc-th">Status</th>
                  <th className="jc-th jc-th-meta">
                    <span className="jc-count-label">{totalFilteredItems} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="jc-empty-state">
                      <div className="jc-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <p>No leads found</p>
                        <span>Try adjusting your search criteria, or add a new lead</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => (
                    <tr
                      key={row.id}
                      className={`jc-tr ${selected.has(row.id) ? "jc-tr-selected" : ""}`}
                      onClick={() => goToLead(row)}
                      style={{ cursor: "pointer" }}
                    >
                      <td className="jc-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}>
                        <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleRow(row.id)} className="jc-checkbox" />
                      </td>
                      <td className="jc-td jc-td-id">{row.id}</td>
                      <td className="jc-td jc-td-link">{row.leadName}</td>
                      <td className="jc-td jc-td-company">
                        <FaBuilding size={10} className="jc-company-icon" />
                        {row.organizationName || "—"}
                      </td>
                      <td className="jc-td">{row.email || "—"}</td>
                      <td className="jc-td">{row.mobileNo || "—"}</td>
                      <td className="jc-td">{row.source || "—"}</td>
                      <td className="jc-td">
                        <span className={`jc-status-badge ${STATUS_CLASS[row.status]}`}>
                          {STATUS_LABELS[row.status]}
                        </span>
                      </td>
                      <td className="jc-td jc-td-meta" onClick={(e) => e.stopPropagation()}>
                        <span className="jc-ago">{row.createdAgo}</span>
                        <span className="jc-dot">·</span>
                        <div className="jc-action-buttons">
                          <button className="jc-action-btn jc-action-view" onClick={(e) => { e.stopPropagation(); goToLead(row); }} title="View">
                            <FaEye size={12} />
                          </button>
                          <button className="jc-action-btn jc-action-edit" onClick={(e) => { e.stopPropagation(); goToLead(row); }} title="Edit">
                            <FaEdit size={12} />
                          </button>
                          <button className="jc-action-btn jc-action-delete" onClick={(e) => { e.stopPropagation(); handleDelete(row); }} title="Delete">
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
          <div className="jc-pagination">
            <div className="jc-pagination-left">
              <span className="jc-pagination-label">Show:</span>
              <select value={itemsPerPage} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="jc-page-size-select">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="jc-pagination-label">entries</span>
            </div>
            <div className="jc-pagination-center">
              <button onClick={goToFirstPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="jc-page-btn">
                <FaAngleDoubleLeft size={12} />
              </button>
              <button onClick={goToPrevPage} disabled={currentPage === 1 || totalFilteredItems === 0} className="jc-page-btn">
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map((page) => (
                <button key={page} onClick={() => goToPage(page)} className={`jc-page-btn ${currentPage === page ? "jc-page-btn-active" : ""}`}>
                  {page}
                </button>
              ))}
              <button onClick={goToNextPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="jc-page-btn">
                <FaChevronRight size={12} />
              </button>
              <button onClick={goToLastPage} disabled={currentPage === filteredTotalPages || totalFilteredItems === 0} className="jc-page-btn">
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="jc-pagination-right">
              <span className="jc-pagination-info">
                {totalFilteredItems > 0
                  ? `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                  : "No entries to show"}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="jc-modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="jc-modal jc-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="jc-modal-header">
              <span className="jc-modal-title">Confirm Delete</span>
              <button className="jc-modal-close" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="jc-modal-body">
              <p>Are you sure you want to delete this lead?</p>
              <p className="jc-modal-item-name"><strong>{selectedItem.leadName}</strong> - {selectedItem.organizationName || "—"}</p>
              <p className="jc-modal-warning">This action cannot be undone.</p>
              {deleting && (
                <div className="jc-deleting-indicator">
                  <span>Deleting...</span>
                </div>
              )}
            </div>
            <div className="jc-modal-footer">
              <button className="jc-btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="jc-btn-delete" onClick={confirmDelete} disabled={deleting}>
                <FaTrash size={12} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}