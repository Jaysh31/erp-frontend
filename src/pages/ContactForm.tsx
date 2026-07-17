import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaTag,
  FaBuilding,
  FaMapMarkerAlt,
  FaBriefcase,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './ContactForm.css';

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

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

// Mock contacts data - in real app, this would come from API
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

export default function ContactForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { theme } = useAdminTheme();
  
  // Check if we're on the new route by checking the pathname
  const isNew = location.pathname === '/contacts/new';
  const isEdit = !isNew && id !== undefined && id !== 'new';
  const contactId = isEdit ? id : null;

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

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  const statusOptions = ['Active', 'Passive', 'Suspended'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan'];
  const states = ['Maharashtra', 'Karnataka', 'Delhi', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Telangana'];
  const departments = ['Procurement', 'Supply Chain', 'Logistics', 'Operations', 'Finance', 'Quality'];
  const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];

  // Generate next contact code
  const generateContactCode = () => {
    const nextNumber = mockContacts.length + 1;
    return `CONT-${String(nextNumber).padStart(3, '0')}`;
  };

  // Fetch contact data for edit
  useEffect(() => {
    if (isEdit && contactId) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const foundContact = mockContacts.find(c => c.id === contactId);
        if (foundContact) {
          setFormData({
            contactCode: foundContact.contactCode,
            firstName: foundContact.firstName,
            lastName: foundContact.lastName,
            email: foundContact.email,
            phone: foundContact.phone,
            mobile: foundContact.mobile,
            status: foundContact.status,
            address: foundContact.address || '',
            city: foundContact.city || '',
            state: foundContact.state || '',
            country: foundContact.country || 'India',
            pincode: foundContact.pincode || '',
            designation: foundContact.designation || '',
            department: foundContact.department || '',
            supplierId: foundContact.supplierId || '',
            supplierName: foundContact.supplierName || ''
          });
        } else {
          toast.error('Contact not found');
          navigate('/contacts');
        }
        setLoading(false);
      }, 500);
    } else if (isNew) {
      // Set auto-generated contact code for new contact
      setFormData(prev => ({
        ...prev,
        contactCode: generateContactCode()
      }));
    }
  }, [isEdit, contactId, isNew, navigate]);

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.firstName.trim()) {
      errors.push({ field: 'firstName', label: 'First Name', message: 'First name is required' });
    }
    if (!formData.email.trim()) {
      errors.push({ field: 'email', label: 'Email', message: 'Email is required' });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push({ field: 'email', label: 'Email', message: 'Please enter a valid email address' });
    }
    if (!formData.phone.trim() && !formData.mobile.trim()) {
      errors.push({ field: 'phone', label: 'Phone', message: 'At least one contact number is required' });
    }

    return errors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const errors = getAllValidationErrors();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      if (isEdit) {
        // In real app, call API to update
        toast.success('Contact updated successfully!');
      } else {
        // In real app, call API to create
        const newContact: Contact = {
          id: String(mockContacts.length + 1),
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
        // In real app, you would save this to API
        console.log('New contact created:', newContact);
        toast.success('Contact created successfully!');
      }
      
      navigate('/contacts');
    } catch (err: any) {
      setApiError(err.message || 'Failed to save contact');
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  // Debug logging
  console.log('📍 Location:', location.pathname);
  console.log('📝 isNew:', isNew);
  console.log('✏️ isEdit:', isEdit);
  console.log('🆔 contactId:', contactId);

  if (loading) {
    return (
      <div className={`contact-form-page ${theme}-theme`}>
        <div className="contact-form-inner">
          <div className="cf-loading">
            <FaSpinner className="spinning" size={24} />
            <p>Loading contact...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`contact-form-page ${theme}-theme`}>
      <div className="contact-form-inner">
        {/* Validation Summary Modal */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="validation-error-item">
                      <div className="error-header">
                        <FaTimesCircle className="error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip">
                  <FaExclamationCircle className="tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Error Display */}
        {apiError && (
          <div className="cf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="cf-header">
          <button onClick={() => navigate('/contacts')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Contact' : 'Edit Contact'}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Main Form Card */}
          <div className="cf-card">
            <span className="cf-section-title">Personal Information</span>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">
                  <FaUser className="cf-label-icon" />First Name <span className="cf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="form-field"
                  placeholder="Enter first name"
                  disabled={submitting}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">
                  <FaUser className="cf-label-icon" />Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="form-field"
                  placeholder="Enter last name"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">
                  <FaEnvelope className="cf-label-icon" />Email <span className="cf-required">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-field"
                  placeholder="Enter email address"
                  disabled={submitting}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">
                  <FaTag className="cf-label-icon" />Contact Code
                </label>
                <input
                  type="text"
                  value={formData.contactCode}
                  disabled
                  className="form-field cf-code-field"
                />
              </div>
            </div>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">
                  <FaPhone className="cf-label-icon" />Phone <span className="cf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="form-field"
                  placeholder="Enter phone number"
                  disabled={submitting}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">
                  <FaPhone className="cf-label-icon" />Mobile
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  className="form-field"
                  placeholder="Enter mobile number"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="cf-divider" />

            <span className="cf-section-title">Professional Information</span>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">
                  <FaBriefcase className="cf-label-icon" />Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                  className="form-field"
                  placeholder="Enter designation"
                  disabled={submitting}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">
                  <FaBuilding className="cf-label-icon" />Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">
                  <FaBuilding className="cf-label-icon" />Supplier
                </label>
                <select
                  value={formData.supplierName}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="cf-field">
                <label className="cf-label">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="form-field"
                  disabled={submitting}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="cf-divider" />

            <span className="cf-section-title">Address</span>

            <div className="cf-field">
              <label className="cf-label">
                <FaMapMarkerAlt className="cf-label-icon" />Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="form-field"
                placeholder="Enter address"
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="form-field"
                  placeholder="Enter city"
                  disabled={submitting}
                />
              </div>

              <div className="cf-field">
                <label className="cf-label">State</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="cf-grid-2">
              <div className="cf-field">
                <label className="cf-label">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="form-field"
                  disabled={submitting}
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="cf-field">
                <label className="cf-label">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  className="form-field"
                  placeholder="Enter pincode"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="cf-footer">
            <button
              type="button"
              onClick={() => navigate('/contacts')}
              className="cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}