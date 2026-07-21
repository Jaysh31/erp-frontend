import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSearch, 
  FaSync, 
  FaPlus, 
  FaTrash, 
  FaEdit,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaCheckCircle,
  FaBan,
  FaSnowflake,
  FaArrowLeft
} from 'react-icons/fa';
import './Customer.css';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ show: boolean; id?: string | number; bulk?: boolean }>({ show: false });
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const response = await api.get<ApiResponse>('/customer');
      
      const customerData = response.data.data.records || [];
      setCustomers(customerData);
      setTotalCount(response.data.data.total || 0);
      setError('');
    } catch (err) {
      setError('Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    setShowDeleteConfirm({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = showDeleteConfirm.id;
    if (!id) return;

    try {
      setApiError(null);
      await api.delete(`/customer/${id}`);
      setCustomers(customers.filter(customer => customer.id !== id));
      setSelectedCustomers(selectedCustomers.filter(cId => cId !== String(id)));
      setError('');
      setShowDeleteConfirm({ show: false });
    } catch (err) {
      setApiError('Failed to delete customer');
      console.error('Error deleting customer:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;
    setShowDeleteConfirm({ show: true, bulk: true });
  };

  const confirmBulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      setApiError(null);
      await Promise.all(
        selectedCustomers.map(id => api.delete(`/customer/${id}`))
      );
      setCustomers(customers.filter(customer => !selectedCustomers.includes(String(customer.id!))));
      setSelectedCustomers([]);
      setError('');
      setShowDeleteConfirm({ show: false });
    } catch (err) {
      setApiError('Failed to delete selected customers');
      console.error('Error deleting customers:', err);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCustomers(customers.map(c => String(c.id!)).filter(id => id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (id: string | number) => {
    const idStr = String(id);
    setSelectedCustomers(prev =>
      prev.includes(idStr)
        ? prev.filter(customerId => customerId !== idStr)
        : [...prev, idStr]
    );
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile_no?.includes(searchTerm) ||
    customer.customer_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_group?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id: string | number) => {
    navigate(`/customer/edit/${id}`);
  };

  const handleAddNew = () => {
    navigate('/customer/add');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getStatusBadge = (isFrozen: number, disabled: number) => {
    if (disabled === 1) {
      return <span className="cst-badge cst-badge-disabled"><FaBan /> Disabled</span>;
    }
    if (isFrozen === 1) {
      return <span className="cst-badge cst-badge-frozen"><FaSnowflake /> Frozen</span>;
    }
    return <span className="cst-badge cst-badge-active"><FaCheckCircle /> Active</span>;
  };

  if (loading) {
    return (
      <div className={`cst-page ${theme}`}>
        <div className="cst-inner">
          <div className="cst-loading">
            <div className="cst-spinner"></div>
            <p>Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`cst-page ${theme}`}>
      <div className="cst-inner">

        {/* ─── Delete Confirmation Modal ────────────────────────────── */}
        {showDeleteConfirm.show && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm({ show: false })}>
            <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Confirm Delete
                </h2>
                <button className="modal-close" onClick={() => setShowDeleteConfirm({ show: false })}>×</button>
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to delete {showDeleteConfirm.bulk ? `${selectedCustomers.length} selected customers` : 'this customer'}?
                  {showDeleteConfirm.bulk && <span className="cst-warning-text"> This action cannot be undone.</span>}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm({ show: false })}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={showDeleteConfirm.bulk ? confirmBulkDelete : confirmDelete}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="cst-api-error">
            <FaExclamationTriangle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {error && (
          <div className="cst-error-message">
            <FaTimesCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="cst-header">
          <button onClick={handleBack} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <div className="header-title">
            <h1>Customers</h1>
            <span className="header-subtitle">{totalCount} total customers</span>
          </div>
          <div className="header-actions">
            {selectedCustomers.length > 0 && (
              <button className="btn-delete-bulk" onClick={handleBulkDelete}>
                <FaTrash /> Delete ({selectedCustomers.length})
              </button>
            )}
            <button className="btn-add" onClick={handleAddNew}>
              <FaPlus /> Add Customer
            </button>
          </div>
        </div>

        {/* ─── Filters ────────────────────────────────────────────────── */}
        <div className="cst-filters">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers by name, email, phone, type, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-refresh" onClick={fetchCustomers}>
            <FaSync /> Refresh
          </button>
        </div>

        {/* ─── Table ────────────────────────────────────────────────── */}
        <div className="cst-card">
          <div className="cst-table-wrapper">
            <table className="cst-table">
              <thead>
                <tr>
                  <th className="cst-th cst-th-check">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      className="cst-checkbox"
                    />
                  </th>
                  <th className="cst-th">Customer</th>
                  <th className="cst-th">Type</th>
                  <th className="cst-th">Group</th>
                  <th className="cst-th">Territory</th>
                  <th className="cst-th">Email</th>
                  <th className="cst-th">Mobile</th>
                  <th className="cst-th">Currency</th>
                  <th className="cst-th">Status</th>
                  <th className="cst-th cst-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="cst-empty-row">
                      {searchTerm ? 'No customers found matching your search' : 'No customers available'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr 
                      key={customer.id} 
                      className={selectedCustomers.includes(String(customer.id!)) ? 'cst-row-selected' : ''}
                    >
                      <td className="cst-td cst-td-check">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(String(customer.id!))}
                          onChange={() => handleSelectCustomer(customer.id!)}
                          className="cst-checkbox"
                        />
                      </td>
                      <td className="cst-td cst-td-name">
                        <div className="cst-customer-info">
                          <div className="cst-avatar">
                            {customer.customer_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div className="cst-customer-name">{customer.customer_name || 'N/A'}</div>
                            {customer.website && (
                              <div className="cst-customer-website">
                                <FaGlobe className="cst-icon-small" />
                                {customer.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="cst-td">{customer.customer_type || 'N/A'}</td>
                      <td className="cst-td">{customer.customer_group || 'N/A'}</td>
                      <td className="cst-td">{customer.territory || 'N/A'}</td>
                      <td className="cst-td cst-td-email">
                        {customer.email_id ? (
                          <a href={`mailto:${customer.email_id}`} className="cst-email-link">
                            <FaEnvelope className="cst-icon-small" />
                            {customer.email_id}
                          </a>
                        ) : 'N/A'}
                      </td>
                      <td className="cst-td">
                        {customer.mobile_no ? (
                          <span className="cst-phone">
                            <FaPhone className="cst-icon-small" />
                            {customer.mobile_no}
                          </span>
                        ) : 'N/A'}
                      </td>
                      <td className="cst-td">{customer.default_currency || 'INR'}</td>
                      <td className="cst-td">{getStatusBadge(customer.is_frozen, customer.disabled)}</td>
                      <td className="cst-td cst-td-actions">
                        <div className="cst-action-buttons">
                          <button
                            className="cst-btn-edit"
                            onClick={() => handleEdit(customer.id!)}
                            title="Edit customer"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="cst-btn-delete"
                            onClick={() => handleDelete(customer.id!)}
                            title="Delete customer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="cst-footer">
            <div className="cst-footer-left">
              <span>Total: <strong>{totalCount}</strong></span>
              <span className="cst-footer-divider">|</span>
              <span>Showing: <strong>{filteredCustomers.length}</strong></span>
            </div>
            <div className="cst-footer-right">
              {selectedCustomers.length > 0 && (
                <span className="cst-selected-count">
                  <FaInfoCircle className="cst-icon-small" />
                  {selectedCustomers.length} selected
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customer;