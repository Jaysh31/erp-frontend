import { useState, useEffect, useMemo } from "react";
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
  FaBuilding,
  FaSitemap,
  FaCheckCircle,
  FaTimesCircle,
  FaTag,
  FaPlus,
  FaSpinner,
  FaExclamationTriangle,
  FaUniversity,
  FaStar,
  FaPhoneAlt,
  FaIdCard,
  FaCalendarAlt,
} from 'react-icons/fa';
import "./CompanyList.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from "../../src/services/api";
import toast from "react-hot-toast";


interface CompanyRow {
  id: number | string;
  company_name?: string;
  abbr?: string;
  default_currency?: string;
  reporting_currency?: string;
  country?: string;
  is_group?: number | boolean;
  gst_category?: string;
  tax_id?: string;
  domain?: string;
  date_of_establishment?: string | null;
  date_of_incorporation?: string | null;
  date_of_commencement?: string | null;
  default_gst_rate?: number;
  parent_company?: string;
  default_holiday_list?: string;
  gstin_uin?: string;
  pan?: string;
  registration_details?: string;
  company_description?: string;
  company_logo?: string | null;
  phone_no?: string;
  email?: string;
  website?: string;
  fax?: string;
  default_letter_head?: string;
  default_buying_terms?: string;
  default_selling_terms?: string;
  monthly_sales_target?: number;
  default_sales_contact?: string;
  default_warehouse_for_sales_return?: string;
  purchase_expense_account?: string;
  purchase_expense_contra_account?: string;
  service_expense_account?: string;
  default_operating_cost_account?: string;
  default_work_in_progress_warehouse?: string;
  default_finished_goods_warehouse?: string;
  default_scrap_warehouse?: string;
  bank_details?: any[];
  created_at?: string;
  creation?: string;
  [key: string]: any;
}

const mapApiRowToFormCompany = (row: CompanyRow) => ({
  ...row,
  company: row.company_name || "",
  is_group: row.is_group === 1 || row.is_group === true,
});

const formatTimeAgo = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return "-";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
};

const formatDate = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const hasValue = (value?: string | number | null) =>
  value !== undefined && value !== null && value !== "";

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) => {
  if (!hasValue(value)) return null;
  return (
    <div className="cl-detail-row">
      <span className="cl-detail-label">{label}</span>
      <span className="cl-detail-value">{value}</span>
    </div>
  );
};

export default function CompanyList() {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CompanyRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bank Accounts popup — shows the full details for a row's bank_details
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankModalCompany, setBankModalCompany] = useState<CompanyRow | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get(`/company?_=${Date.now()}`);
      if (response.data?.success === 1 || Array.isArray(response.data?.data) || Array.isArray(response.data)) {
        const rows: CompanyRow[] = Array.isArray(response.data?.data)
          ? response.data.data
          : Array.isArray(response.data)
          ? response.data
          : [];
        setCompanies(rows);
      } else {
        setFetchError(response.data?.message || "Failed to load companies");
      }
    } catch (err: any) {
      console.error("Error fetching companies:", err);
      if (err.response) {
        setFetchError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setFetchError("Network error. Please check your connection.");
      } else {
        setFetchError(err.message || "Failed to load companies");
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search and group type
  const filteredData = useMemo(() => {
    return companies.filter((item) => {
      const name = item.company_name || "";
      const country = item.country || "";
      const currency = item.default_currency || "";
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        name.toLowerCase().includes(term) ||
        country.toLowerCase().includes(term) ||
        currency.toLowerCase().includes(term);

      const isGroup = item.is_group === 1 || item.is_group === true;
      const matchesGroup =
        groupFilter === 'all' ||
        (groupFilter === 'group' && isGroup) ||
        (groupFilter === 'standalone' && !isGroup);

      return matchesSearch && matchesGroup;
    });
  }, [companies, searchTerm, groupFilter]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const rowKey = (row: CompanyRow) => String(row.id);

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map(rowKey)));
    }
    setAllChecked(!allChecked);
  };

  const toggleRow = (key: string) => {
    const next = new Set(selected);
    next.has(key) ? next.delete(key) : next.add(key);
    setSelected(next);
    setAllChecked(next.size === paginatedData.length && paginatedData.length > 0);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  const handleDelete = (item: CompanyRow) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;
    setDeleting(true);
    try {
      await api.delete(`/company/${selectedItem.id}`);
      toast.success("Company deleted successfully.");
      setCompanies((prev) => prev.filter((c) => c.id !== selectedItem.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(rowKey(selectedItem));
        return next;
      });
      setShowDeleteConfirm(false);
      setSelectedItem(null);
    } catch (err: any) {
      console.error("Error deleting company:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setGroupFilter('all');
  };

  const openCompany = (row: CompanyRow) => {
    navigate(`/company/${encodeURIComponent(String(row.id))}`, {
      state: { company: mapApiRowToFormCompany(row) },
    });
  };

  const openBankModal = (row: CompanyRow) => {
    setBankModalCompany(row);
    setBankModalOpen(true);
  };

  const closeBankModal = () => {
    setBankModalOpen(false);
    setBankModalCompany(null);
  };
  const openBankAdd = (row: CompanyRow) => {
    navigate("/bank-details", {
      state: {
        embedContext: {
          returnPath: `/company/${row.id}`,
          partyType: "Company",
          partyId: String(row.id),
          companyId: Number(row.id),
          supplierName: row.company_name || "Company",
          isPendingSupplier: false,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className={`cl-page ${theme}`}>
        <div className="cl-empty-content" style={{ padding: "60px 0" }}>
          <FaSpinner className="cl-spinning" size={28} />
          <p>Loading companies...</p>
        </div>
      </div>
    );
  }

  const onlyCompany = companies.length === 1 ? companies[0] : null;

  return (
    <div className={`cl-page ${theme}`}>
      {fetchError && (
        <div className="cl-active-filters" style={{ borderColor: "var(--danger-color, #ef4444)" }}>
          <FaExclamationTriangle size={12} style={{ color: "var(--danger-color, #ef4444)" }} />
          <span style={{ color: "var(--text-primary)" }}>{fetchError}</span>
          <button className="cl-clear-filters" onClick={fetchCompanies}>
            Retry
          </button>
        </div>
      )}

      {onlyCompany ? (
        /* ── Single Company: detail view instead of a one-row list ── */
        <div className="cl-single">
          <div className="cl-single-toolbar">
            <div className="cl-single-toolbar-info">
              <FaBuilding size={12} />
              <span>You have a single company set up</span>
            </div>
            <button className="cl-btn-primary" onClick={() => navigate("/company/new")}>
              <FaPlus size={12} />
              Add Company
            </button>
          </div>

          {(() => {
            const c = onlyCompany;
            const isGroup = c.is_group === 1 || c.is_group === true;
            const bankAccounts = Array.isArray(c.bank_details) ? c.bank_details : [];
            const initials = (c.company_name || "?")
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase();
            const established = formatDate(c.date_of_establishment);
            const incorporated = formatDate(c.date_of_incorporation);
            const commenced = formatDate(c.date_of_commencement);
            const companyDetailRows = [
              { label: "Default Currency", value: c.default_currency },
              { label: "Reporting Currency", value: c.reporting_currency },
              { label: "Country", value: c.country },
              { label: "Industry / Domain", value: c.domain },
              { label: "Holiday List", value: c.default_holiday_list },
              { label: "Parent Company", value: c.parent_company },
              { label: "Date of Establishment", value: established },
              { label: "Date of Incorporation", value: incorporated },
              { label: "Date of Commencement", value: commenced },
            ].filter((r) => hasValue(r.value));

            const registrationRows = [
              { label: "Tax ID", value: c.tax_id },
              { label: "GSTIN / UIN", value: c.gstin_uin },
              { label: "PAN", value: c.pan },
              { label: "Registration Details", value: c.registration_details },
            ].filter((r) => hasValue(r.value));

            const contactRows = [
              { label: "Phone", value: c.phone_no },
              { label: "Email", value: c.email },
              { label: "Website", value: c.website },
              { label: "Fax", value: c.fax },
            ].filter((r) => hasValue(r.value));

            const hasCompanyDetails = companyDetailRows.length > 0;
            const hasRegistration = registrationRows.length > 0;
            const hasContact = contactRows.length > 0;
            const hasSide = hasRegistration || hasContact;

            return (
              <>
                {/* Profile header */}
                <div className="cl-single-card cl-single-profile">
                  <div className="cl-single-logo">
                    {c.company_logo ? (
                      <img src={c.company_logo} alt={c.company_name || "Company"} />
                    ) : (
                      <span>{initials || <FaBuilding size={20} />}</span>
                    )}
                  </div>

                  <div className="cl-single-profile-info">
                    <div className="cl-single-profile-top">
                      <h2>{c.company_name || "Unnamed Company"}</h2>
                      {c.abbr && <span className="cl-single-abbr-badge">{c.abbr}</span>}
                    </div>
                    <div className="cl-single-profile-badges">
                      <span className={`cl-single-badge ${isGroup ? "cl-single-badge-accent" : "cl-single-badge-good"}`}>
                        {isGroup ? <FaSitemap size={10} /> : <FaCheckCircle size={10} />}
                        {isGroup ? "Group Company" : "Standalone"}
                      </span>
                      {c.gst_category && (
                        <span
                          className={`cl-single-badge ${
                            c.gst_category === "Unregistered" ? "cl-single-badge-muted" : "cl-single-badge-good"
                          }`}
                        >
                          <FaTag size={10} />
                          {c.gst_category}
                        </span>
                      )}
                      {c.domain && <span className="cl-single-badge cl-single-badge-muted">{c.domain}</span>}
                      {c.country && <span className="cl-single-badge cl-single-badge-muted">{c.country}</span>}
                    </div>
                    {c.company_description && <p className="cl-single-desc">{c.company_description}</p>}
                  </div>

                  <div className="cl-single-profile-actions">
                    <button className="cl-action-btn cl-action-edit" onClick={() => openCompany(c)} title="Edit company">
                      <FaEdit size={13} />
                    </button>
                    <button className="cl-action-btn cl-action-delete" onClick={() => handleDelete(c)} title="Delete company">
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>

                {/* Detail cards — only shown when they have data */}
                {(hasCompanyDetails || hasSide) && (
                  <div className={`cl-single-grid ${hasCompanyDetails && hasSide ? "" : "cl-single-grid-full"}`}>
                    {hasCompanyDetails && (
                      <div className="cl-single-card cl-single-main">
                        <div className="cl-single-card-header">
                          <FaBuilding size={12} />
                          Company Details
                        </div>
                        <div className="cl-single-card-body cl-single-details-grid">
                          {companyDetailRows.map((r) => (
                            <DetailRow key={r.label} label={r.label} value={r.value} />
                          ))}
                        </div>
                      </div>
                    )}

                    {hasSide && (
                      <div className="cl-single-side">
                        {hasRegistration && (
                          <div className="cl-single-card">
                            <div className="cl-single-card-header">
                              <FaIdCard size={12} />
                              Registration &amp; Tax
                            </div>
                            <div className="cl-single-card-body cl-single-details-list">
                              {registrationRows.map((r) => (
                                <DetailRow key={r.label} label={r.label} value={r.value} />
                              ))}
                            </div>
                          </div>
                        )}

                        {hasContact && (
                          <div className="cl-single-card">
                            <div className="cl-single-card-header">
                              <FaPhoneAlt size={11} />
                              Contact
                            </div>
                            <div className="cl-single-card-body cl-single-details-list">
                              {contactRows.map((r) => (
                                <DetailRow key={r.label} label={r.label} value={r.value} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Bank accounts */}
                <div className="cl-single-card cl-single-bank">
                  <div className="cl-single-card-header-row">
                    <div className="cl-single-card-header">
                      <FaUniversity size={12} />
                      Bank Accounts
                      {bankAccounts.length > 0 && <span className="cl-single-count-pill">{bankAccounts.length}</span>}
                    </div>
                    <button className="cl-bank-add-btn" onClick={() => openBankAdd(c)}>
                      <FaPlus size={10} /> Add Account
                    </button>
                  </div>
                  <div className={`cl-single-card-body cl-single-bank-list ${bankAccounts.length > 1 ? "cl-single-bank-list-grid" : ""}`}>
                    {bankAccounts.length > 0 ? (
                      bankAccounts.map((acc: any, idx: number) => (
                        <div key={acc.id || idx} className="cl-bank-card">
                          <div className="cl-bank-card-icon">
                            <FaUniversity size={16} />
                          </div>
                          <div className="cl-bank-card-info">
                            <div className="cl-bank-card-top">
                              <strong>{acc.bank_name || "Bank account"}</strong>
                              <div className="cl-bank-card-badges">
                                {(acc.is_primary === 1 || acc.is_primary === true) && (
                                  <span className="cl-bank-badge-tag cl-bank-badge-primary">
                                    <FaStar size={8} /> Primary
                                  </span>
                                )}
                                {acc.verified === 1 || acc.verified === true ? (
                                  <span className="cl-bank-badge-tag cl-bank-badge-verified">
                                    <FaCheckCircle size={9} /> Verified
                                  </span>
                                ) : (
                                  <span className="cl-bank-badge-tag cl-bank-badge-unverified">
                                    <FaTimesCircle size={9} /> Unverified
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="cl-bank-card-rows">
                              <div className="cl-bank-card-row">
                                <label>Holder</label>
                                <span>{acc.account_holder_name || "N/A"}</span>
                              </div>
                              <div className="cl-bank-card-row">
                                <label>Account No.</label>
                                <span>{acc.account_number || "N/A"}</span>
                              </div>
                              <div className="cl-bank-card-row">
                                <label>IFSC Code</label>
                                <span>{acc.ifsc_code || "N/A"}</span>
                              </div>
                              <div className="cl-bank-card-row">
                                <label>Branch</label>
                                <span>{acc.branch_name || "N/A"}</span>
                              </div>
                              <div className="cl-bank-card-row">
                                <label>Account Type</label>
                                <span>{acc.account_type || "N/A"}</span>
                              </div>
                              <div className="cl-bank-card-row">
                                <label>Currency</label>
                                <span>{acc.currency || "INR"}</span>
                              </div>
                              {acc.swift_code && (
                                <div className="cl-bank-card-row">
                                  <label>SWIFT</label>
                                  <span>{acc.swift_code}</span>
                                </div>
                              )}
                              {acc.iban && (
                                <div className="cl-bank-card-row">
                                  <label>IBAN</label>
                                  <span>{acc.iban}</span>
                                </div>
                              )}
                              {acc.upi_id && (
                                <div className="cl-bank-card-row">
                                  <label>UPI ID</label>
                                  <span>{acc.upi_id}</span>
                                </div>
                              )}
                              {acc.remarks && (
                                <div className="cl-bank-card-row cl-bank-card-row-full">
                                  <label>Remarks</label>
                                  <span>{acc.remarks}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="cl-bank-empty">
                        <FaUniversity size={28} />
                        <p>No bank accounts on file for this company.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cl-single-footer-meta">
                  <FaCalendarAlt size={11} />
                  <span>Added {formatTimeAgo(c.creation || c.created_at)}</span>
                  {c.modified && (
                    <>
                      <span className="cl-dot">·</span>
                      <span>Updated {formatTimeAgo(c.modified)}</span>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        <>
          {/* Search and Filter Bar */}
          <div className="cl-filter-bar">
            <div className="cl-filter-left">
              <div className="cl-search-wrapper">
                <FaSearch className="cl-search-icon" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="cl-search-input"
                />
                {searchTerm && (
                  <button className="cl-search-clear" onClick={() => setSearchTerm('')}>
                    <FaTimes size={12} />
                  </button>
                )}
              </div>
            </div>
            <div className="cl-filter-right">
              <select
                value={groupFilter}
                onChange={(e) => { setGroupFilter(e.target.value); setCurrentPage(1); }}
                className="cl-filter-select"
              >
                <option value="all">All Companies</option>
                <option value="group">Group</option>
                <option value="standalone">Standalone</option>
              </select>
              <button className="cl-filter-btn">
                <FaFilter size={12} />
                Filter
              </button>
              <button className="cl-sort-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
                </svg>
                Created On
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="cl-btn-primary" onClick={() => navigate("/company/new")}>
                <FaPlus size={12} />
                Add Company
              </button>
            </div>
          </div>

          {/* Active filters indicator */}
          {(searchTerm || groupFilter !== 'all') && (
            <div className="cl-active-filters">
              <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
              <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
              {searchTerm && (
                <span style={{ color: 'var(--text-primary)' }}>
                  <strong>Search:</strong> "{searchTerm}"
                </span>
              )}
              {groupFilter !== 'all' && (
                <span style={{ color: 'var(--text-primary)' }}>
                  <strong>Type:</strong> {groupFilter}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="cl-clear-filters"
              >
                <FaTimes size={10} /> Clear All
              </button>
            </div>
          )}

          {/* Table */}
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th className="cl-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="cl-checkbox" />
                  </th>
                  <th className="cl-th">Company</th>
                  <th className="cl-th">Default Currency</th>
                  <th className="cl-th">Country</th>
                  <th className="cl-th cl-th-bool">Is Group</th>
                  <th className="cl-th">Bank Accounts</th>
                  <th className="cl-th cl-th-meta">
                    <span className="cl-count-label">{totalItems} of {companies.length}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="cl-empty-state">
                      <div className="cl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1m-6 4h1m4 0h1m-6 4h1m4 0h1"/>
                        </svg>
                        <p>No companies found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row) => {
                    const key = rowKey(row);
                    const bankCount = Array.isArray(row.bank_details) ? row.bank_details.length : 0;
                    return (
                      <tr
                        key={key}
                        className={`cl-tr ${selected.has(key) ? "cl-tr-selected" : ""}`}
                        onClick={() => openCompany(row)}
                      >
                        <td className="cl-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(key); }}>
                          <input type="checkbox" checked={selected.has(key)} onChange={() => toggleRow(key)} className="cl-checkbox" />
                        </td>
                        <td className="cl-td cl-td-name">{row.company_name || "-"}</td>
                        <td className="cl-td">{row.default_currency || "-"}</td>
                        <td className="cl-td">{row.country || "-"}</td>
                        <td className="cl-td cl-td-bool">
                          <input
                            type="checkbox"
                            checked={row.is_group === 1 || row.is_group === true}
                            disabled
                            className="cl-checkbox cl-checkbox-readonly"
                          />
                        </td>
                        <td className="cl-td cl-td-bank" onClick={(e) => e.stopPropagation()}>
                          {bankCount > 0 ? (
                            <button
                              type="button"
                              className="cl-bank-badge"
                              onClick={() => openBankModal(row)}
                              title="View bank account details"
                            >
                              <FaUniversity size={11} />
                              {bankCount} Account{bankCount > 1 ? "s" : ""}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cl-bank-add-btn"
                              onClick={() => openBankAdd(row)}
                              title="Add a bank account for this company"
                            >
                              <FaPlus size={10} /> Add Account
                            </button>
                          )}
                        </td>
                        <td className="cl-td cl-td-meta">
                          <span className="cl-ago">{formatTimeAgo(row.creation || row.created_at)}</span>
                          <span className="cl-dot">·</span>
                          <div className="cl-action-buttons">
                            <button
                              className="cl-action-btn cl-action-view"
                              onClick={(e) => { e.stopPropagation(); openCompany(row); }}
                              title="View"
                            >
                              <FaEye size={12} />
                            </button>
                            <button
                              className="cl-action-btn cl-action-edit"
                              onClick={(e) => { e.stopPropagation(); openCompany(row); }}
                              title="Edit"
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              className="cl-action-btn cl-action-delete"
                              onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                              title="Delete"
                            >
                              <FaTrash size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="cl-pagination">
              <div className="cl-pagination-left">
                <span className="cl-pagination-label">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="cl-page-size-select"
                >
                  <option value={20}>20</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                  <option value={2500}>2500</option>
                </select>
                <span className="cl-pagination-label">entries</span>
              </div>
              <div className="cl-pagination-center">
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="cl-page-btn"
                >
                  <FaAngleDoubleLeft size={12} />
                </button>
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="cl-page-btn"
                >
                  <FaChevronLeft size={12} />
                </button>
                {getPageNumbers().map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cl-page-btn ${currentPage === page ? 'cl-page-btn-active' : ''}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="cl-page-btn"
                >
                  <FaChevronRight size={12} />
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="cl-page-btn"
                >
                  <FaAngleDoubleRight size={12} />
                </button>
              </div>
              <div className="cl-pagination-right">
                <span className="cl-pagination-info">
                  Showing {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bank Accounts Modal — used by the list view's per-row badge */}
      {bankModalOpen && bankModalCompany && (
        <div className="cl-modal-overlay" onClick={closeBankModal}>
          <div className="cl-modal cl-modal-bank" onClick={(e) => e.stopPropagation()}>
            <div className="cl-bank-modal-header">
              <div className="cl-bank-modal-header-icon">
                <FaUniversity size={16} />
              </div>
              <div className="cl-bank-modal-header-text">
                <span className="cl-modal-title">Bank Accounts</span>
                <span className="cl-edit-subtitle">{bankModalCompany.company_name || "Company"}</span>
              </div>
              <button className="cl-modal-close" onClick={closeBankModal}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="cl-modal-body cl-bank-modal-body">
              {bankModalCompany.bank_details && bankModalCompany.bank_details.length > 0 ? (
                bankModalCompany.bank_details.map((acc: any, idx: number) => (
                  <div key={acc.id || idx} className="cl-bank-card">
                    <div className="cl-bank-card-icon">
                      <FaUniversity size={16} />
                    </div>
                    <div className="cl-bank-card-info">
                      <div className="cl-bank-card-top">
                        <strong>{acc.bank_name || 'Bank account'}</strong>
                        <div className="cl-bank-card-badges">
                          {(acc.is_primary === 1 || acc.is_primary === true) && (
                            <span className="cl-bank-badge-tag cl-bank-badge-primary">
                              <FaStar size={8} /> Primary
                            </span>
                          )}
                          {(acc.verified === 1 || acc.verified === true) ? (
                            <span className="cl-bank-badge-tag cl-bank-badge-verified">
                              <FaCheckCircle size={9} /> Verified
                            </span>
                          ) : (
                            <span className="cl-bank-badge-tag cl-bank-badge-unverified">
                              <FaTimesCircle size={9} /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="cl-bank-card-rows">
                        <div className="cl-bank-card-row">
                          <label>Holder</label><span>{acc.account_holder_name || 'N/A'}</span>
                        </div>
                        <div className="cl-bank-card-row">
                          <label>Account No.</label><span>{acc.account_number || 'N/A'}</span>
                        </div>
                        <div className="cl-bank-card-row">
                          <label>IFSC Code</label><span>{acc.ifsc_code || 'N/A'}</span>
                        </div>
                        <div className="cl-bank-card-row">
                          <label>Branch</label><span>{acc.branch_name || 'N/A'}</span>
                        </div>
                        <div className="cl-bank-card-row">
                          <label>Account Type</label><span>{acc.account_type || 'N/A'}</span>
                        </div>
                        <div className="cl-bank-card-row">
                          <label>Currency</label><span>{acc.currency || 'INR'}</span>
                        </div>
                        {acc.swift_code && (
                          <div className="cl-bank-card-row">
                            <label>SWIFT</label><span>{acc.swift_code}</span>
                          </div>
                        )}
                        {acc.iban && (
                          <div className="cl-bank-card-row">
                            <label>IBAN</label><span>{acc.iban}</span>
                          </div>
                        )}
                        {acc.upi_id && (
                          <div className="cl-bank-card-row">
                            <label>UPI ID</label><span>{acc.upi_id}</span>
                          </div>
                        )}
                        {acc.remarks && (
                          <div className="cl-bank-card-row cl-bank-card-row-full">
                            <label>Remarks</label><span>{acc.remarks}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="cl-bank-empty">
                  <FaUniversity size={32} />
                  <p>No bank accounts on file for this company.</p>
                </div>
              )}
            </div>
            <div className="cl-modal-footer">
              <button className="cl-modal-btn-cancel" onClick={closeBankModal}>
                Close
              </button>
              <button
                className="cl-btn-edit"
                onClick={() => { closeBankModal(); openBankAdd(bankModalCompany); }}
              >
                <FaPlus size={12} /> Add Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedItem && (
        <div className="cl-modal-overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-header">
              <h3>Confirm Delete</h3>
              <button className="cl-modal-close" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                <FaTimes />
              </button>
            </div>
            <div className="cl-modal-body">
              <p>Are you sure you want to delete this company?</p>
              <p className="cl-modal-item-name"><strong>{selectedItem.company_name || selectedItem.id}</strong></p>
              <p className="cl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="cl-modal-footer">
              <button className="cl-modal-btn-cancel" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="cl-modal-btn-delete" onClick={confirmDelete} disabled={deleting}>
                {deleting && <FaSpinner className="cl-spinning" size={12} />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}