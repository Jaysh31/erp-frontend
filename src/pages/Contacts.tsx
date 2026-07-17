import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter,
  FaTimes, FaCopy, FaEye,
  FaUser, FaEnvelope, FaPhone, FaCheckCircle,
  FaTimesCircle, FaChevronLeft, FaChevronRight,
  FaAngleDoubleLeft, FaAngleDoubleRight,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './Contact.css';

interface Contact {
  id: string;
  contactCode: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  status: 'Active' | 'Passive' | 'Suspended';
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  designation: string;
  department: string;
  supplierId: string;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
}

export default function Contact() {
  const navigate = useNavigate();
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [allChecked, setAllChecked] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Mock data - in real app, fetch from API
  const mockContacts: Contact[] = [
    {
      id: '1',
      contactCode: 'CONT-001',
      fullName: 'Nirjala Bagal',
      firstName: 'Nirjala',
      lastName: 'Bagal',
      email: 'nirjala@gmail.com',
      phone: '+91-9876543210',
      mobile: '+91-9876543210',
      status: 'Passive',
      address: '123, Residency Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      designation: 'Purchase Manager',
      department: 'Procurement',
      supplierId: 'SUP-001',
      supplierName: 'ABC Manufacturing Co.',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      contactCode: 'CONT-002',
      fullName: 'P S Kamthe',
      firstName: 'P S',
      lastName: 'Kamthe',
      email: 'pskamthe@rediffmail.com',
      phone: '+91-8765432109',
      mobile: '+91-8765432109',
      status: 'Passive',
      address: '456, Industrial Area',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411001',
      designation: 'Supplier Manager',
      department: 'Supply Chain',
      supplierId: 'SUP-002',
      supplierName: 'XYZ Electronics Ltd.',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    },
    {
      id: '3',
      contactCode: 'CONT-003',
      fullName: 'Tejas Tarte',
      firstName: 'Tejas',
      lastName: 'Tarte',
      email: 'tejasvithaltarte@gmail.com',
      phone: '+91-7654321098',
      mobile: '+91-7654321098',
      status: 'Active',
      address: '789, Tech Park',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: '560100',
      designation: 'Procurement Officer',
      department: 'Procurement',
      supplierId: 'SUP-003',
      supplierName: 'PQR Packaging Solutions',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    }
  ];

  // Fetch contacts - mock
  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setContacts(mockContacts);
    } catch (err) {
      setError('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Filter data based on search and status
  const filteredData = contacts.filter(contact => {
    const matchesSearch = contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.contactCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contact.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalFilteredItems = filteredData.length;
  const totalPages = Math.ceil(totalFilteredItems / itemsPerPage);
  const validCurrentPage = Math.min(currentPage, totalPages || 1);

  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * itemsPerPage,
    validCurrentPage * itemsPerPage
  );

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map((c) => c.id)));
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

  const getStartIndex = () => {
    return (validCurrentPage - 1) * itemsPerPage + 1;
  };

  const getEndIndex = () => {
    return Math.min(validCurrentPage * itemsPerPage, totalFilteredItems);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'status-active';
      case 'Passive': return 'status-passive';
      case 'Suspended': return 'status-suspended';
      default: return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active': return <FaCheckCircle size={10} />;
      case 'Passive': return <FaTimesCircle size={10} />;
      case 'Suspended': return <FaTimesCircle size={10} />;
      default: return null;
    }
  };

  const handleCreate = () => {
    navigate('/contacts/new');
  };

  const handleEdit = (contact: Contact) => {
    navigate(`/contacts/edit/${contact.id}`);
  };

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setShowViewModal(true);
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (selectedContact) {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
        setShowDeleteConfirm(false);
        setSelectedContact(null);
        toast.success('Contact deleted successfully!');
      } catch (err) {
        toast.error('Failed to delete contact');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDuplicate = (contact: Contact) => {
    const newContact: Contact = {
      ...contact,
      id: String(contacts.length + 1),
      contactCode: `CONT-${String(contacts.length + 1).padStart(3, '0')}`,
      fullName: `${contact.fullName} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setContacts(prev => [...prev, newContact]);
    toast.success('Contact duplicated successfully!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === 'Active').length;
  const passiveContacts = contacts.filter(c => c.status === 'Passive').length;
  const suspendedContacts = contacts.filter(c => c.status === 'Suspended').length;

  return (
    <div className={`contact-page ${theme}-theme`}>
      {/* Search and Filter Bar */}
      <div className="contact-filter-bar">
        <div className="contact-filter-left">
          <div className="contact-search-wrapper">
            <FaSearch className="contact-search-icon" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="contact-search-input"
            />
            {searchTerm && (
              <button className="contact-search-clear" onClick={() => setSearchTerm('')}>
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>
        <div className="contact-filter-right">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="contact-filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="passive">Passive</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="contact-filter-btn">
            <FaFilter size={12} />
            Filter
          </button>
          <button className="contact-btn-primary" onClick={handleCreate}>
            <FaPlus size={12} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="contact-stats">
        <div className="contact-stat-item">
          <span className="contact-stat-label">Total</span>
          <span className="contact-stat-value">{totalContacts}</span>
        </div>
        <div className="contact-stat-divider" />
        <div className="contact-stat-item">
          <span className="contact-stat-label">Active</span>
          <span className="contact-stat-value contact-stat-active">{activeContacts}</span>
        </div>
        <div className="contact-stat-divider" />
        <div className="contact-stat-item">
          <span className="contact-stat-label">Passive</span>
          <span className="contact-stat-value contact-stat-passive">{passiveContacts}</span>
        </div>
        <div className="contact-stat-divider" />
        <div className="contact-stat-item">
          <span className="contact-stat-label">Suspended</span>
          <span className="contact-stat-value contact-stat-suspended">{suspendedContacts}</span>
        </div>
      </div>

      {/* Active filters indicator */}
      {(searchTerm || statusFilter !== 'all') && (
        <div className="contact-active-filters">
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
            className="contact-clear-filters"
          >
            <FaTimes size={10} /> Clear All
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="contact-loading">
          <p>Loading contacts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="contact-error">
          <p>{error}</p>
          <button onClick={fetchContacts} className="contact-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="contact-table-wrap">
            <table className="contact-table">
              <thead>
                <tr>
                  <th className="contact-th-check">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="contact-checkbox" />
                  </th>
                  <th className="contact-th">ID</th>
                  <th className="contact-th">Full Name</th>
                  <th className="contact-th">Email</th>
                  <th className="contact-th">Phone</th>
                  <th className="contact-th">Status</th>
                  <th className="contact-th contact-th-meta">
                    <span className="contact-count-label">{totalFilteredItems} of {contacts.length}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="contact-empty-state">
                      <div className="contact-empty-content">
                        <FaUser size={48} color="var(--text-secondary)" />
                        <p>No contacts found</p>
                        <span>Try adjusting your search criteria</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((contact) => (
                    <tr
                      key={contact.id}
                      className={`contact-tr ${selected.has(contact.id) ? "contact-tr-selected" : ""}`}
                    >
                      <td className="contact-td-check" onClick={(e) => { e.stopPropagation(); toggleRow(contact.id); }}>
                        <input type="checkbox" checked={selected.has(contact.id)} onChange={() => toggleRow(contact.id)} className="contact-checkbox" />
                      </td>
                      <td className="contact-td contact-td-id">{contact.contactCode}</td>
                      <td className="contact-td">
                        <div className="contact-name-cell">
                          <span className="contact-full-name">{contact.fullName}</span>
                          {contact.designation && (
                            <span className="contact-designation">{contact.designation}</span>
                          )}
                        </div>
                      </td>
                      <td className="contact-td">
                        <div className="contact-email-cell">
                          <FaEnvelope size={10} />
                          {contact.email}
                        </div>
                      </td>
                      <td className="contact-td">
                        <div className="contact-phone-cell">
                          <FaPhone size={10} />
                          {contact.phone}
                        </div>
                      </td>
                      <td className="contact-td">
                        <span className={`contact-status-badge ${getStatusColor(contact.status)}`}>
                          {getStatusIcon(contact.status)}
                          {contact.status}
                        </span>
                      </td>
                      <td className="contact-td contact-td-meta">
                        <div className="contact-action-buttons">
                          <button
                            className="contact-action-btn contact-action-view"
                            onClick={() => handleView(contact)}
                            title="View"
                          >
                            <FaEye size={12} />
                          </button>
                          <button
                            className="contact-action-btn contact-action-edit"
                            onClick={() => handleEdit(contact)}
                            title="Edit"
                          >
                            <FaEdit size={12} />
                          </button>
                          <button
                            className="contact-action-btn contact-action-copy"
                            onClick={() => handleDuplicate(contact)}
                            title="Duplicate"
                          >
                            <FaCopy size={12} />
                          </button>
                          <button
                            className="contact-action-btn contact-action-delete"
                            onClick={() => handleDelete(contact)}
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
          <div className="contact-pagination">
            <div className="contact-pagination-left">
              <span className="contact-pagination-label">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="contact-page-size-select"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="contact-pagination-label">entries</span>
            </div>
            <div className="contact-pagination-center">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="contact-page-btn"
              >
                <FaAngleDoubleLeft size={12} />
              </button>
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1 || totalFilteredItems === 0}
                className="contact-page-btn"
              >
                <FaChevronLeft size={12} />
              </button>
              {totalFilteredItems > 0 && getPageNumbers().map(page => (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`contact-page-btn ${currentPage === page ? 'contact-page-btn-active' : ''}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages || totalFilteredItems === 0}
                className="contact-page-btn"
              >
                <FaChevronRight size={12} />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages || totalFilteredItems === 0}
                className="contact-page-btn"
              >
                <FaAngleDoubleRight size={12} />
              </button>
            </div>
            <div className="contact-pagination-right">
              <span className="contact-pagination-info">
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

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedContact && (
        <div className="contact-modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="contact-modal contact-modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <span className="contact-modal-title">Contact Details</span>
              <button className="contact-modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="contact-modal-body">
              <div className="contact-view-grid">
                <div className="contact-view-section">
                  <h4>Personal Information</h4>
                  <div className="contact-view-row"><label>Code:</label><span>{selectedContact.contactCode}</span></div>
                  <div className="contact-view-row"><label>Name:</label><span>{selectedContact.fullName}</span></div>
                  <div className="contact-view-row"><label>Email:</label><span>{selectedContact.email}</span></div>
                  <div className="contact-view-row"><label>Phone:</label><span>{selectedContact.phone}</span></div>
                  <div className="contact-view-row"><label>Status:</label><span className={`contact-status-badge ${getStatusColor(selectedContact.status)}`}>{selectedContact.status}</span></div>
                </div>
                <div className="contact-view-section">
                  <h4>Professional Information</h4>
                  <div className="contact-view-row"><label>Designation:</label><span>{selectedContact.designation || 'N/A'}</span></div>
                  <div className="contact-view-row"><label>Department:</label><span>{selectedContact.department || 'N/A'}</span></div>
                  <div className="contact-view-row"><label>Supplier:</label><span>{selectedContact.supplierName || 'N/A'}</span></div>
                </div>
                <div className="contact-view-section full-width">
                  <h4>Address</h4>
                  <div className="contact-view-row"><span>{selectedContact.address || 'No address provided'}</span></div>
                  {selectedContact.city && (
                    <div className="contact-view-row"><label>City:</label><span>{selectedContact.city}</span></div>
                  )}
                  {selectedContact.state && (
                    <div className="contact-view-row"><label>State:</label><span>{selectedContact.state}</span></div>
                  )}
                  {selectedContact.country && (
                    <div className="contact-view-row"><label>Country:</label><span>{selectedContact.country}</span></div>
                  )}
                  {selectedContact.pincode && (
                    <div className="contact-view-row"><label>Pincode:</label><span>{selectedContact.pincode}</span></div>
                  )}
                </div>
              </div>
            </div>
            <div className="contact-modal-footer">
              <button className="contact-btn-cancel" onClick={() => setShowViewModal(false)}>
                Close
              </button>
              <button className="contact-btn-primary" onClick={() => handleEdit(selectedContact)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      {showDeleteConfirm && selectedContact && (
        <div className="contact-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="contact-modal contact-modal-delete" onClick={(e) => e.stopPropagation()}>
            <div className="contact-modal-header">
              <span className="contact-modal-title">Confirm Delete</span>
              <button className="contact-modal-close" onClick={() => setShowDeleteConfirm(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            <div className="contact-modal-body">
              <p>Are you sure you want to delete this contact?</p>
              <p className="contact-modal-item-name"><strong>{selectedContact.fullName}</strong></p>
              <p className="contact-modal-warning">This action cannot be undone.</p>
            </div>
            <div className="contact-modal-footer">
              <button className="contact-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button className="contact-btn-delete" onClick={confirmDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}