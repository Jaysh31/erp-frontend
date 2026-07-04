import  { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash, FaFilter, 
  FaTimes, FaSave, FaSpinner, FaCopy, FaEye,
  FaUser, FaEnvelope, FaPhone, FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

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

interface ContactFormData {
  contactCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  status: Contact['status'];
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  designation: string;
  department: string;
  supplierId: string;
  supplierName: string;
}

export default function Contact() {
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('All');
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([
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
  ]);

  const [formData, setFormData] = useState<ContactFormData>({
    contactCode: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    status: 'Active',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    designation: '',
    department: '',
    supplierId: '',
    supplierName: ''
  });

  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
  const statusOptions = ['Active', 'Passive', 'Suspended'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan'];
  const states = ['Maharashtra', 'Karnataka', 'Delhi', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Telangana'];
  const departments = ['Procurement', 'Supply Chain', 'Logistics', 'Operations', 'Finance', 'Quality'];

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = c.fullName.toLowerCase().includes(filterText.toLowerCase()) ||
                         c.email.toLowerCase().includes(filterText.toLowerCase()) ||
                         c.phone.toLowerCase().includes(filterText.toLowerCase()) ||
                         c.contactCode.toLowerCase().includes(filterText.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesSupplier = selectedSupplier === 'All' || c.supplierName === selectedSupplier;
    return matchesSearch && matchesStatus && matchesSupplier;
  });

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
    setFormData({
      contactCode: `CONT-${String(contacts.length + 1).padStart(3, '0')}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      mobile: '',
      status: 'Active',
      address: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      designation: '',
      department: '',
      supplierId: '',
      supplierName: ''
    });
    setShowCreateModal(true);
  };

  const handleEdit = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData({
      contactCode: contact.contactCode,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      mobile: contact.mobile,
      status: contact.status,
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      country: contact.country || 'India',
      pincode: contact.pincode || '',
      designation: contact.designation || '',
      department: contact.department || '',
      supplierId: contact.supplierId || '',
      supplierName: contact.supplierName || ''
    });
    setShowEditModal(true);
  };

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setShowViewModal(true);
  };

  const handleDelete = (contact: Contact) => {
    setSelectedContact(contact);
    setShowDeleteModal(true);
  };

  const handleSubmit = () => {
    setLoading(true);
    
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      setLoading(false);
      return;
    }
    
    setTimeout(() => {
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      if (showEditModal && selectedContact) {
        setContacts(prev => 
          prev.map(c => c.id === selectedContact.id 
            ? { 
                ...c, 
                ...formData, 
                fullName,
                updatedAt: new Date().toISOString() 
              }
            : c
          )
        );
        toast.success('Contact updated successfully!');
      } else {
        const newContact: Contact = {
          id: String(contacts.length + 1),
          contactCode: formData.contactCode,
          fullName,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          mobile: formData.mobile,
          status: formData.status,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          pincode: formData.pincode,
          designation: formData.designation,
          department: formData.department,
          supplierId: formData.supplierId,
          supplierName: formData.supplierName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setContacts(prev => [...prev, newContact]);
        toast.success('Contact created successfully!');
      }
      setShowCreateModal(false);
      setShowEditModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleDeleteConfirm = () => {
    if (!selectedContact) return;
    setLoading(true);
    
    setTimeout(() => {
      setContacts(prev => prev.filter(c => c.id !== selectedContact.id));
      setShowDeleteModal(false);
      setLoading(false);
      toast.success('Contact deleted successfully!');
    }, 1000);
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

  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === 'Active').length;
  const passiveContacts = contacts.filter(c => c.status === 'Passive').length;

  return (
    <div className={`contact-page ${theme}-theme`}>
      <style>{`
        /* ── Page Container ─────────────────────────────────────── */
        .contact-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          padding: 16px 24px;
          gap: 12px;
          overflow-y: auto;
          font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
          color: var(--text-primary, #1f2433);
        }

        .contact-page::-webkit-scrollbar { width: 4px; }
        .contact-page::-webkit-scrollbar-track { background: transparent; }
        .contact-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

        /* ── Header ──────────────────────────────────────────────── */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .badge {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          background: var(--card-bg, #ffffff);
          padding: 1px 10px;
          border-radius: 12px;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-primary:hover {
          background: var(--primary-hover, #4f46e5);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: var(--card-bg, #ffffff);
          color: var(--text-primary, #1f2433);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-secondary:hover {
          background: var(--layout-bg, #f3f4f6);
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 14px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        /* ── Compact Stats ────────────────────────────────────────── */
        .compact-stats {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 10px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .stat-item {
          display: flex;
          align-items: baseline;
          gap: 6px;
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
          font-weight: 500;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
        }

        .stat-active {
          color: #10b981;
        }

        .stat-passive {
          color: #f59e0b;
        }

        .stat-divider {
          width: 1px;
          height: 20px;
          background: var(--border-color, #e5e7eb);
        }

        /* ── Search Bar ───────────────────────────────────────────── */
        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 8px;
          padding: 0 12px;
          transition: all 0.15s ease;
          height: 34px;
        }

        .search-wrapper:focus-within {
          border-color: var(--primary-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
        }

        .search-icon {
          color: var(--text-secondary, #9ca3af);
          font-size: 13px;
          flex-shrink: 0;
        }

        .search-input {
          border: none;
          background: transparent;
          padding: 6px 10px;
          font-size: 13px;
          color: var(--text-primary, #374151);
          outline: none;
          flex: 1;
          min-width: 120px;
        }

        .search-input::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .clear-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: none;
          border-radius: 50%;
          background: var(--border-color, #e5e7eb);
          color: var(--text-secondary, #6b7280);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-btn:hover {
          background: var(--text-secondary, #6b7280);
          color: white;
        }

        .filter-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-toggle {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          background: var(--card-bg, #ffffff);
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          height: 34px;
        }

        .filter-toggle:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .filter-toggle.active {
          border-color: var(--primary-color, #6366f1);
          color: var(--primary-color, #6366f1);
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }

        .result-count {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        /* ── Expandable Filters ───────────────────────────────────── */
        .expandable-filters {
          display: flex;
          align-items: flex-end;
          gap: 16px;
          padding: 12px 16px;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          animation: slideDown 0.2s ease;
          flex-wrap: wrap;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-group label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        .filter-group select {
          padding: 4px 10px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 12px;
          background: var(--input-bg, #ffffff);
          color: var(--text-primary, #374151);
          outline: none;
          height: 30px;
        }

        .filter-group select:focus {
          border-color: var(--primary-color, #6366f1);
        }

        .apply-filters {
          padding: 4px 16px;
          background: var(--primary-color, #6366f1);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          height: 30px;
          transition: all 0.15s ease;
        }

        .apply-filters:hover {
          background: var(--primary-hover, #4f46e5);
        }

        /* ── Contact Table ────────────────────────────────────────── */
        .contact-container {
          flex: 1;
          min-height: 0;
          background: var(--card-bg, #ffffff);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
          overflow: hidden;
        }

        .table-wrapper {
          overflow-x: auto;
          height: 100%;
        }

        .contact-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 800px;
        }

        .contact-table thead {
          background: var(--layout-bg, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .contact-table th {
          padding: 10px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .contact-table td {
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color, #f3f4f6);
          color: var(--text-primary, #374151);
        }

        .contact-row {
          transition: background 0.15s ease;
        }

        .contact-row:hover {
          background: var(--nav-hover, #f9fafb);
        }

        .code-cell {
          font-weight: 600;
          color: var(--primary-color, #6366f1);
          font-size: 12px;
        }

        .name-cell {
          display: flex;
          flex-direction: column;
        }

        .name-cell .full-name {
          font-weight: 500;
          color: var(--text-primary, #1f2433);
        }

        .name-cell .designation {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .email-cell {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
        }

        .phone-cell {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--text-secondary, #6b7280);
          font-size: 12px;
        }

        .supplier-cell {
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .status-active {
          background: #d1fae5;
          color: #065f46;
        }

        .status-passive {
          background: #fef3c7;
          color: #92400e;
        }

        .status-suspended {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          color: var(--text-secondary, #6b7280);
        }

        .action-btn:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .action-btn.view:hover { color: var(--primary-color, #6366f1); }
        .action-btn.edit:hover { color: #f59e0b; }
        .action-btn.copy:hover { color: #8b5cf6; }
        .action-btn.delete:hover { color: #ef4444; background: #fef2f2; }

        /* ── Empty State ───────────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          text-align: center;
        }

        .empty-icon {
          color: var(--text-secondary, #9ca3af);
          margin-bottom: 12px;
        }

        .empty-state h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 4px 0;
        }

        .empty-state p {
          font-size: 13px;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 16px 0;
        }

        /* ── Footer ────────────────────────────────────────────────── */
        .list-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 4px 0 4px;
          font-size: 12px;
          color: var(--text-secondary, #6b7280);
          flex-shrink: 0;
        }

        .conversion-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          background: color-mix(in srgb, var(--primary-color) 10%, transparent);
          color: var(--primary-color, #6366f1);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        /* ── MODALS ────────────────────────────────────────────────── */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: var(--card-bg, #ffffff);
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        }

        .view-modal { max-width: 650px; }
        .delete-modal { max-width: 420px; }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        .modal-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          font-size: 20px;
          transition: all 0.15s ease;
        }

        .modal-close:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          flex-shrink: 0;
        }

        /* ── View Modal ────────────────────────────────────────────── */
        .view-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .view-section {
          padding: 12px;
          background: var(--layout-bg, #f8f9fa);
          border-radius: 8px;
        }

        .view-section.full-width {
          grid-column: 1 / -1;
        }

        .view-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #6b7280);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .view-row {
          display: flex;
          padding: 3px 0;
          font-size: 13px;
        }

        .view-row label {
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
          min-width: 100px;
        }

        .view-row span {
          color: var(--text-primary, #1f2433);
        }

        /* ── Edit/Create Modal ─────────────────────────────────────── */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #6b7280);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-primary, #374151);
          transition: all 0.2s ease;
          background: var(--input-bg, #ffffff);
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--primary-color, #6366f1);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 60px;
        }

        /* ── Delete Modal ──────────────────────────────────────────── */
        .delete-body {
          text-align: center;
          padding: 32px 20px;
        }

        .delete-icon {
          color: #ef4444;
          margin-bottom: 16px;
        }

        .delete-body h3 {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 8px 0;
        }

        .delete-body p {
          font-size: 14px;
          color: var(--text-secondary, #6b7280);
          margin: 4px 0;
        }

        .delete-warning {
          color: #ef4444 !important;
          font-weight: 500;
          margin-top: 12px !important;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .contact-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; justify-content: flex-end; }
          .search-bar { flex-direction: column; align-items: stretch; }
          .filter-wrapper { justify-content: space-between; }
          .contact-table { min-width: 600px; }
          .modal-container { max-width: 100%; margin: 10px; }
          .modal-footer { flex-direction: column; }
          .modal-footer button { width: 100%; justify-content: center; }
          .view-grid { grid-template-columns: 1fr; }
          .compact-stats { flex-wrap: wrap; gap: 8px; padding: 8px 12px; }
          .stat-divider { display: none; }
          .form-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .contact-page { padding: 8px 12px; }
          .contact-table { font-size: 12px; min-width: 500px; }
          .contact-table th, .contact-table td { padding: 6px 10px; }
          .action-group { gap: 0; }
          .action-btn { width: 24px; height: 24px; }
        }

        /* ─── Dark Theme ─────────────────────────────────────────── */
        .dark-theme .contact-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .badge { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .search-wrapper { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .search-input { color: var(--text-primary, #f8fafc); }
        .dark-theme .search-input::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .filter-toggle { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .filter-toggle:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .expandable-filters { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .filter-group select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .contact-container { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .contact-table thead { background: var(--layout-bg, #0f172a); }
        .dark-theme .contact-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
        .dark-theme .contact-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .contact-row:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .code-cell { color: var(--primary-color, #818cf8); }
        .dark-theme .name-cell .full-name { color: var(--text-primary, #f8fafc); }
        .dark-theme .name-cell .designation { color: var(--text-secondary, #94a3b8); }
        .dark-theme .email-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .phone-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .supplier-cell { color: var(--text-secondary, #94a3b8); }
        .dark-theme .action-btn { color: var(--text-secondary, #64748b); }
        .dark-theme .action-btn:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-container { background: var(--card-bg, #1e293b); }
        .dark-theme .modal-header { border-bottom-color: var(--border-color, #334155); }
        .dark-theme .modal-header h2 { color: var(--text-primary, #f8fafc); }
        .dark-theme .modal-close { color: var(--text-secondary, #94a3b8); }
        .dark-theme .modal-close:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .modal-footer { border-top-color: var(--border-color, #334155); }
        .dark-theme .view-section { background: var(--layout-bg, #0f172a); }
        .dark-theme .view-row span { color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
        .dark-theme .status-active { background: rgba(16,185,129,0.2); color: #34d399; }
        .dark-theme .status-passive { background: rgba(251,191,36,0.2); color: #fbbf24; }
        .dark-theme .status-suspended { background: rgba(239,68,68,0.2); color: #f87171; }
        .dark-theme .compact-stats { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .stat-value { color: var(--text-primary, #f8fafc); }
        .dark-theme .stat-divider { background: var(--border-color, #334155); }
        .dark-theme .empty-state h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .empty-state p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .conversion-badge { background: rgba(99,102,241,0.15); color: var(--primary-color, #818cf8); }
        .dark-theme .result-count { color: var(--text-secondary, #94a3b8); }
        .dark-theme .list-footer { color: var(--text-secondary, #94a3b8); }
        .dark-theme .delete-body h3 { color: var(--text-primary, #f8fafc); }
        .dark-theme .delete-body p { color: var(--text-secondary, #94a3b8); }
        .dark-theme .form-group label { color: var(--text-primary, #e2e8f0); }
        .dark-theme .form-group input, .dark-theme .form-group select, .dark-theme .form-group textarea { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .form-group input:focus, .dark-theme .form-group select:focus, .dark-theme .form-group textarea:focus { border-color: var(--primary-color, #818cf8); }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Contacts</h1>
          <span className="badge">{contacts.length}</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Contact
          </button>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="compact-stats">
        <div className="stat-item">
          <span className="stat-label">Total</span>
          <span className="stat-value">{totalContacts}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value stat-active">{activeContacts}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Passive</span>
          <span className="stat-value stat-passive">{passiveContacts}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-label">Suspended</span>
          <span className="stat-value">{contacts.filter(c => c.status === 'Suspended').length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-btn" onClick={() => setFilterText('')}>×</button>
          )}
        </div>
        <div className="filter-wrapper">
          <select 
            className="filter-toggle"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ width: '120px' }}
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Passive">Passive</option>
            <option value="Suspended">Suspended</option>
          </select>
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredContacts.length} of {contacts.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
            >
              <option value="All">All Suppliers</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Department</label>
            <select>
              <option value="all">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Contact List */}
      <div className="contact-container">
        {filteredContacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUser size={48} />
            </div>
            <h3>No contacts found</h3>
            <p>Create your first contact to get started</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Contact
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="contact-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="contact-row">
                    <td className="code-cell">{contact.contactCode}</td>
                    <td>
                      <div className="name-cell">
                        <span className="full-name">{contact.fullName}</span>
                        {contact.designation && (
                          <span className="designation">{contact.designation}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="email-cell">
                        <FaEnvelope size={10} />
                        {contact.email}
                      </div>
                    </td>
                    <td>
                      <div className="phone-cell">
                        <FaPhone size={10} />
                        {contact.phone}
                      </div>
                    </td>
                    <td className="supplier-cell">{contact.supplierName || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(contact.status)}`}>
                        {getStatusIcon(contact.status)}
                        {contact.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn view" 
                          title="View"
                          onClick={() => handleView(contact)}
                        >
                          <FaEye size={12} />
                        </button>
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(contact)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => handleDuplicate(contact)}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(contact)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredContacts.length} of {contacts.length} contacts</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaUser size={11} /> {activeContacts} active
          </span>
        </div>
      </div>

      {/* ====== VIEW MODAL ====== */}
      {showViewModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedContact.fullName}</h2>
              <button className="modal-close" onClick={() => setShowViewModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-section">
                  <h4>Personal Information</h4>
                  <div className="view-row"><label>Code:</label><span>{selectedContact.contactCode}</span></div>
                  <div className="view-row"><label>Name:</label><span>{selectedContact.fullName}</span></div>
                  <div className="view-row"><label>Email:</label><span>{selectedContact.email}</span></div>
                  <div className="view-row"><label>Phone:</label><span>{selectedContact.phone}</span></div>
                  <div className="view-row"><label>Status:</label><span className={`status-badge ${getStatusColor(selectedContact.status)}`}>{selectedContact.status}</span></div>
                </div>
                <div className="view-section">
                  <h4>Professional Information</h4>
                  <div className="view-row"><label>Designation:</label><span>{selectedContact.designation || 'N/A'}</span></div>
                  <div className="view-row"><label>Department:</label><span>{selectedContact.department || 'N/A'}</span></div>
                  <div className="view-row"><label>Supplier:</label><span>{selectedContact.supplierName || 'N/A'}</span></div>
                </div>
                <div className="view-section full-width">
                  <h4>Address</h4>
                  <div className="view-row"><span>{selectedContact.address || 'No address provided'}</span></div>
                  {selectedContact.city && (
                    <div className="view-row"><label>City:</label><span>{selectedContact.city}</span></div>
                  )}
                  {selectedContact.state && (
                    <div className="view-row"><label>State:</label><span>{selectedContact.state}</span></div>
                  )}
                  {selectedContact.country && (
                    <div className="view-row"><label>Country:</label><span>{selectedContact.country}</span></div>
                  )}
                  {selectedContact.pincode && (
                    <div className="view-row"><label>Pincode:</label><span>{selectedContact.pincode}</span></div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => handleEdit(selectedContact)}>
                <FaEdit size={12} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== CREATE/EDIT MODAL ====== */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Contact' : 'Add Contact'}</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Contact Code</label>
                  <input
                    type="text"
                    value={formData.contactCode}
                    disabled
                    style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Mobile</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="Enter designation"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select
                    value={formData.supplierName}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    rows={2}
                  />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Enter city"
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  >
                    <option value="">Select State</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  >
                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    placeholder="Enter pincode"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaSave size={12} /> {showEditModal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedContact && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Contact</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                You are about to delete <strong>{selectedContact.fullName}</strong>
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading && <FaSpinner className="spinning" />}
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}