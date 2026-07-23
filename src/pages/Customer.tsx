import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaCheckCircle,
  FaBan,
  FaSnowflake,
  FaChevronDown,
  FaChevronRight as FaChevronRightIcon,
  FaUser,
  FaStar,
} from 'react-icons/fa';
import './Customer.css';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface Contact {
  id: number;
  customer_id: number;
  first_name: string;
  last_name: string;
  contact_name: string;
  mobile_no: string;
  alternate_mobile: string;
  email_id: string;
  telephone: string;
  extension: string;
  is_primary: number;
  is_billing_contact: number;
  is_saler_contact: number;
  remarks: string;
}

interface Customer {
  id?: string | number;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory: string;
  default_currency: string;
  default_price_list: string;
  tax_category: string;
  payment_terms: string;
  account_manager: string;
  language: string;
  email_id: string;
  mobile_no: string;
  website: string;
  industry: string;
  market_segment: string;
  is_frozen: number;
  disabled: number;
  creation?: string;
  contacts?: Contact[];
}

interface CustomerDisplay {
  id: string;
  customerName: string;
  customerType: string;
  customerGroup: string;
  email: string;
  mobile: string;
  status: 'active' | 'frozen' | 'disabled';
  website: string;
  contacts: Contact[];
  territory: string;
  creation: string;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: Customer[];
  };
}

const Customer: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAdminTheme();

  const [customers, setCustomers] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CustomerDisplay | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse>(`/customer?page=${currentPage}&limit=${itemsPerPage}`);
      
      const customerData = response.data.data.records || [];
      setTotalItems(response.data.data.total || 0);

      const transformedData: CustomerDisplay[] = customerData.map((customer: Customer) => ({
        id: String(customer.id || ''),
        customerName: customer.customer_name || 'N/A',
        customerType: customer.customer_type || 'N/A',
        customerGroup: customer.customer_group || 'N/A',
        email: customer.email_id || '',
        mobile: customer.mobile_no || '',
        status: customer.disabled === 1 ? 'disabled' : customer.is_frozen === 1 ? 'frozen' : 'active',
        website: customer.website || '',
        contacts: customer.contacts || [],
        territory: customer.territory || '',
        creation: customer.creation || '',
      }));

      setCustomers(transformedData);
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter data based on search and status
  const filteredData = customers.filter(customer => {
    const matchesSearch = 
      customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.mobile.includes(searchTerm) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contacts.some(contact => 
        contact.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.mobile_no.includes(searchTerm)
      );
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && customer.status === 'active') ||
      (statusFilter === 'frozen' && customer.status === 'frozen') ||
      (statusFilter === 'disabled' && customer.status === 'disabled');
    
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);

  // Ensure current page is valid when data changes
  const validCurrentPage = Math.min(currentPage, totalPages || 1);
  if (validCurrentPage !== currentPage) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

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

  const handleDelete = (item: CustomerDisplay) => {
    setSelectedItem(item);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedItem) return;

    try {
      await api.delete(`/customer/${selectedItem.id}`);
      setShowDeleteConfirm(false);
      setSelectedItem(null);
      fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      alert('Failed to delete customer');
    }
  };

  const handleView = (item: CustomerDisplay) => {
    navigate(`/customer/${encodeURIComponent(item.id)}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/customer/edit/${id}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="igl-status-badge igl-status-active"><FaCheckCircle /> Active</span>;
      case 'frozen':
        return <span className="igl-status-badge igl-status-frozen"><FaSnowflake /> Frozen</span>;
      case 'disabled':
        return <span className="igl-status-badge igl-status-disabled"><FaBan /> Disabled</span>;
      default:
        return <span className="igl-status-badge">{status}</span>;
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getContactTypeLabel = (contact: Contact) => {
    const types = [];
    if (contact.is_billing_contact) types.push('Billing');
    if (contact.is_saler_contact) types.push('Sales');
    // If primary only (no other types), show empty
    if (contact.is_primary && types.length === 0) return '';
    // If primary with other types, show the other types
    return types.length > 0 ? types.join(' • ') : 'General';
  };

  return (
    <div className={`igl-page ${theme}`}>
      {/* Search and Filter Bar */}
      <div className="igl-filter-bar">
        <div className="igl-filter-left">
          <div className="igl-search-wrapper">
            <FaSearch className="igl-search-icon" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="igl-search-input"
            />
            {searchTerm && (
              <button className="igl-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="igl-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="igl-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="igl-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="igl-sort-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/>
            </svg>
            Created On
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="igl-btn-primary" onClick={() => navigate("/customer/add")}>
            <FaPlus size={12} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="igl-active-filters">
          <FaFilter size={12} style={{ color: 'var(--primary-color)' }} />
          <span style={{ color: 'var(--text-primary)' }}>Active filters:</span>
          {searchTerm && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Search:</strong> "{searchTerm}"
            </span>
          )}
          {statusFilter !== 'all' && (
            <span style={{ color: 'var(--text-primary)' }}>
              <strong>Status:</strong> {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="igl-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="igl-loading">
          <p>Loading customers...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="igl-error">
          <p>{error}</p>
          <button onClick={fetchCustomers} className="igl-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="igl-table-wrap">
            <table className="igl-table">
              <thead>
                <tr>
                  <th className="igl-th" style={{ width: '30px' }}></th>
                  <th className="igl-th" style={{ width: '40px' }}>#</th>
                  <th className="igl-th">Customer</th>
                  <th className="igl-th">Type</th>
                  <th className="igl-th">Group</th>
                  <th className="igl-th">Email</th>
                  <th className="igl-th">Mobile</th>
                  <th className="igl-th">Status</th>
                  <th className="igl-th igl-th-meta">
                    <span className="igl-count-label">{totalFilteredItems} of {totalItems}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary, #9ca3af)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="igl-empty-state">
                      <div className="igl-empty-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <p>No customers found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, index) => {
                    const serialNumber = (validCurrentPage - 1) * itemsPerPage + index + 1;
                    const isExpanded = expandedRows.has(row.id);
                    const hasContacts = row.contacts && row.contacts.length > 0;

                    return (
                      <React.Fragment key={row.id}>
                        <tr 
                          className={`igl-tr ${isExpanded ? 'igl-tr-expanded' : ''}`}
                          onClick={() => toggleRow(row.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="igl-td" style={{ textAlign: 'center', padding: '8px 4px' }}>
                            {hasContacts && (
                              <button 
                                className="igl-expand-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(row.id);
                                }}
                              >
                                {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRightIcon size={10} />}
                              </button>
                            )}
                          </td>
                          <td className="igl-td" style={{ textAlign: 'center', fontWeight: 500, color: 'var(--text-secondary)', padding: '8px 4px', fontSize: '12px' }}>
                            {serialNumber}
                          </td>
                          <td className="igl-td">
                            <div className="igl-customer-info">
                              <div className="igl-avatar">
                                {row.customerName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="igl-customer-name">{row.customerName}</div>
                                {row.website && (
                                  <div className="igl-customer-website">
                                    <FaGlobe className="igl-icon-small" />
                                    {row.website}
                                  </div>
                                )}
                                {hasContacts && (
                                  <div className="igl-contact-count">
                                    <FaUser size={10} />
                                    <span>{row.contacts.length} contact{row.contacts.length > 1 ? 's' : ''}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="igl-td">{row.customerType}</td>
                          <td className="igl-td">{row.customerGroup}</td>
                          <td className="igl-td">
                            {row.email ? (
                              <a href={`mailto:${row.email}`} className="igl-email-link">
                                <FaEnvelope className="igl-icon-small" />
                                {row.email}
                              </a>
                            ) : 'N/A'}
                          </td>
                          <td className="igl-td">
                            {row.mobile ? (
                              <span className="igl-phone">
                                <FaPhone className="igl-icon-small" />
                                {row.mobile}
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="igl-td">{getStatusBadge(row.status)}</td>
                          <td className="igl-td igl-td-meta">
                            <div className="igl-action-buttons">
                              {/* <button
                                className="igl-action-btn igl-action-view"
                                onClick={(e) => { e.stopPropagation(); handleView(row); }}
                                title="View"
                              >
                                <FaEye size={12} />
                              </button> */}
                              <button
                                className="igl-action-btn igl-action-edit"
                                onClick={(e) => { e.stopPropagation(); handleEdit(row.id); }}
                                title="Edit"
                              >
                                <FaEdit size={12} />
                              </button>
                              <button
                                className="igl-action-btn igl-action-delete"
                                onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                                title="Delete"
                              >
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && hasContacts && (
                          <tr className="igl-expanded-row">
                            <td colSpan={9}>
                              <div className="igl-expanded-content">
                                <div className="igl-contact-table-wrap">
                                  <table className="igl-contact-table">
                                    <thead>
                                      <tr>
                                        <th className="igl-contact-th" style={{ width: '30px' }}>#</th>
                                        <th className="igl-contact-th">Name</th>
                                        <th className="igl-contact-th" style={{ width: '100px' }}>Type</th>
                                        <th className="igl-contact-th">Email</th>
                                        <th className="igl-contact-th" style={{ width: '130px' }}>Mobile</th>
                                        <th className="igl-contact-th" style={{ width: '130px' }}>Alternate</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.contacts.map((contact, idx) => (
                                        <tr key={contact.id || idx} className="igl-contact-row">
                                          <td className="igl-contact-td" style={{ textAlign: 'center', padding: '4px 4px' }}>{idx + 1}</td>
                                          <td className="igl-contact-td">
                                            <span className="igl-contact-name-text">
                                              {contact.contact_name || 'Unnamed Contact'}
                                              {contact.is_primary === 1 && (
                                                <span className="igl-contact-badge-primary">
                                                  <FaStar size={8} /> Primary
                                                </span>
                                              )}
                                            </span>
                                          </td>
                                          <td className="igl-contact-td">
                                            {getContactTypeLabel(contact) && (
                                              <span className="igl-contact-type-badge">
                                                {getContactTypeLabel(contact)}
                                              </span>
                                            )}
                                          </td>
                                          <td className="igl-contact-td">
                                            {contact.email_id ? (
                                              <a href={`mailto:${contact.email_id}`} className="igl-contact-email-link">
                                                {contact.email_id}
                                              </a>
                                            ) : '—'}
                                          </td>
                                          <td className="igl-contact-td">
                                            {contact.mobile_no ? (
                                              <a href={`tel:${contact.mobile_no}`} className="igl-contact-phone-link">
                                                {contact.mobile_no}
                                              </a>
                                            ) : '—'}
                                          </td>
                                          <td className="igl-contact-td">{contact.alternate_mobile || '—'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="igl-pagination">
            <div className="igl-pagination-left">
              <span className="igl-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="igl-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="igl-pagination-label">entries</span>
            </div>
            <div className="igl-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="igl-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="igl-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`igl-page-btn ${currentPage === page ? 'igl-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalFilteredItems === 0}
                className="igl-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalFilteredItems === 0}
                className="igl-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="igl-pagination-right">
              <span className="igl-pagination-info">
                {totalFilteredItems > 0 ? (
                  `Showing ${getStartIndex()} to ${getEndIndex()} of ${totalFilteredItems} entries`
                ) : (
                  'No entries to show'
                )}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="igl-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="igl-modal igl-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="igl-modal-header">
              <span className="igl-modal-title">Confirm Delete</span>
              <button className="igl-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="igl-modal-body">
              <p>Are you sure you want to delete "{selectedItem?.customerName}"?</p>
              <p className="igl-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="igl-modal-footer">
              <button className="igl-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="igl-btn-delete" onClick={confirmDelete}>
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customer;