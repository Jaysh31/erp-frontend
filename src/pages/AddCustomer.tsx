import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaUsers,
  FaTag,
  FaCheckCircle,
  FaPlus,
  FaTrash,
  FaUserTie,
  FaTimes,
} from 'react-icons/fa';
import './AddCustomer.css';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface ContactPerson {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  designation: string;
  is_primary: boolean;
}

interface CustomerFormData {
  customer_name: string;
  customer_type: string;
  customer_group: string;
  gender: string;
  language: string;
  email_id: string;
  mobile_no: string;
  website: string;
  industry: string;
  market_segment: string;
  first_name: string;
  last_name: string;
  contact_persons: ContactPerson[];
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useAdminTheme();
  const isEditMode = !!id && id !== 'new';
  const isNew = !id || id === 'new';

  const [formData, setFormData] = useState<CustomerFormData>({
    customer_name: '',
    customer_type: 'Company',
    customer_group: 'Commercial',
    gender: '',
    language: 'English',
    email_id: '',
    mobile_no: '',
    website: '',
    industry: '',
    market_segment: '',
    first_name: '',
    last_name: '',
    contact_persons: [
      {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        designation: '',
        is_primary: true,
      }
    ],
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [tempContact, setTempContact] = useState<ContactPerson>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    designation: '',
    is_primary: false,
  });

  useEffect(() => {
    if (isEditMode && id) {
      fetchCustomerData(id);
    }
  }, [id, isEditMode]);

  const fetchCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/customer/${customerId}`);
      const data = response.data;
      if (!data.contact_persons || data.contact_persons.length === 0) {
        data.contact_persons = [
          {
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            designation: '',
            is_primary: true,
          }
        ];
      }
      setFormData(data);
      setApiError(null);
    } catch (err) {
      setApiError('Failed to fetch customer data');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getInitials = (firstName: string, lastName: string): string => {
    if (!firstName && !lastName) return '?';
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const getColorFromName = (name: string): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const openAddContactModal = () => {
    setEditingContactIndex(null);
    setTempContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designation: '',
      is_primary: false,
    });
    setShowContactModal(true);
  };

  const openEditContactModal = (index: number) => {
    setEditingContactIndex(index);
    setTempContact({ ...formData.contact_persons[index] });
    setShowContactModal(true);
  };

  const handleTempContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setTempContact(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveContact = () => {
    if (!tempContact.first_name || !tempContact.last_name || !tempContact.email || !tempContact.phone) {
      setApiError('Please fill in all required fields for the contact');
      return;
    }

    setFormData(prev => {
      let updatedContacts: ContactPerson[];
      
      if (editingContactIndex !== null) {
        updatedContacts = [...prev.contact_persons];
        
        if (tempContact.is_primary) {
          updatedContacts = updatedContacts.map((contact, i) => ({
            ...contact,
            is_primary: i === editingContactIndex
          }));
        }
        
        updatedContacts[editingContactIndex] = tempContact;
      } else {
        updatedContacts = [...prev.contact_persons];
        
        if (tempContact.is_primary) {
          updatedContacts = updatedContacts.map(contact => ({
            ...contact,
            is_primary: false
          }));
        }
        
        updatedContacts.push(tempContact);
      }
      
      return {
        ...prev,
        contact_persons: updatedContacts
      };
    });

    setShowContactModal(false);
    setTempContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      designation: '',
      is_primary: false,
    });
    setEditingContactIndex(null);
    setApiError(null);
  };

  const removeContactPerson = (index: number) => {
    if (formData.contact_persons.length <= 1) {
      setApiError('You must have at least one contact person');
      return;
    }

    setFormData(prev => {
      const updatedContacts = prev.contact_persons.filter((_, i) => i !== index);
      
      if (prev.contact_persons[index].is_primary && updatedContacts.length > 0) {
        updatedContacts[0].is_primary = true;
      }
      
      return {
        ...prev,
        contact_persons: updatedContacts
      };
    });
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!formData.customer_name && !formData.first_name) {
      errors.push({ 
        field: 'customer_name', 
        label: 'Customer Name', 
        message: 'Please provide at least customer name or first name' 
      });
    }

    if (!formData.customer_type) {
      errors.push({
        field: 'customer_type',
        label: 'Customer Type',
        message: 'Customer type is required'
      });
    }

    if (!formData.customer_group) {
      errors.push({
        field: 'customer_group',
        label: 'Customer Group',
        message: 'Customer group is required'
      });
    }

    formData.contact_persons.forEach((contact, index) => {
      if (!contact.first_name) {
        errors.push({
          field: `contact_persons[${index}].first_name`,
          label: `Contact ${index + 1} - First Name`,
          message: 'First name is required'
        });
      }
      if (!contact.last_name) {
        errors.push({
          field: `contact_persons[${index}].last_name`,
          label: `Contact ${index + 1} - Last Name`,
          message: 'Last name is required'
        });
      }
      if (!contact.email) {
        errors.push({
          field: `contact_persons[${index}].email`,
          label: `Contact ${index + 1} - Email`,
          message: 'Email is required'
        });
      }
      if (!contact.phone) {
        errors.push({
          field: `contact_persons[${index}].phone`,
          label: `Contact ${index + 1} - Phone`,
          message: 'Phone number is required'
        });
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess('');

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        ...formData,
        customer_name: formData.customer_name || `${formData.first_name} ${formData.last_name}`.trim(),
      };
      
      if (isEditMode && id) {
        await api.put(`/customer/${id}`, payload);
        setSuccess('Customer updated successfully!');
        setTimeout(() => navigate('/customer'), 1500);
      } else {
        await api.post('/customer', payload);
        setSuccess('Customer created successfully!');
        setTimeout(() => navigate('/customer'), 1500);
      }
      
    } catch (err: any) {
      console.error('Error saving customer:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A customer with this name already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to save customer');
        }
      } else if (err.request) {
        setApiError('Network error. Please check your connection.');
      } else {
        setApiError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved changes will be lost.')) {
      navigate('/customer');
    }
  };

  if (loading && isEditMode) {
    return (
      <div className={`acf-page ${theme}`}>
        <div className="acf-inner">
          <div className="acf-loading">
            <div className="acf-spinner"></div>
            <p>Loading customer data...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = getAllValidationErrors().length > 0;

  // Filter out empty contact persons (those with no first_name and no last_name)
  const hasValidContacts = formData.contact_persons.some(
    contact => contact.first_name || contact.last_name
  );

  return (
    <div className={`acf-page ${theme}`}>
      <div className="acf-inner">

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
                  <FaInfoCircle className="tip-icon" />
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

        {/* Contact Person Modal */}
        {showContactModal && (
          <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaUserTie /> 
                  {editingContactIndex !== null ? 'Edit Contact Person' : 'Add Contact Person'}
                </h2>
                <button className="modal-close" onClick={() => setShowContactModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="contact-form-grid">
                  <div className="contact-form-field">
                    <label className="contact-form-label">First Name <span className="acf-required">*</span></label>
                    <input
                      type="text"
                      name="first_name"
                      value={tempContact.first_name}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Last Name <span className="acf-required">*</span></label>
                    <input
                      type="text"
                      name="last_name"
                      value={tempContact.last_name}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Email <span className="acf-required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={tempContact.email}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Phone <span className="acf-required">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={tempContact.phone}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Designation</label>
                    <input
                      type="text"
                      name="designation"
                      value={tempContact.designation}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter designation"
                    />
                  </div>
                  <div className="contact-form-field checkbox-field">
                    <label className="contact-form-label checkbox-label">
                      <input
                        type="checkbox"
                        name="is_primary"
                        checked={tempContact.is_primary}
                        onChange={handleTempContactChange}
                        className="contact-checkbox"
                      />
                      Set as Primary Contact
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowContactModal(false)}>
                  Cancel
                </button>
                <button className="btn-save-contact" onClick={saveContact}>
                  <FaSave /> {editingContactIndex !== null ? 'Update' : 'Add'} Contact
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Error Display */}
        {apiError && (
          <div className="acf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {success && (
          <div className="acf-success-message">
            <FaCheckCircle className="success-icon" />
            <span>{success}</span>
          </div>
        )}

        {/* Header */}
        <div className="acf-header">
          <button onClick={() => navigate('/customer')} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Customer' : `Edit: ${formData.customer_name || 'Customer'}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          <div className="acf-card">

            {/* Basic Information - Compact Grid */}
            <div className="acf-section-header">
              <span className="acf-section-title">
                <FaUser className="acf-section-icon" /> Basic Information
              </span>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter customer name"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter first name"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter last name"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Type <span className="acf-required">*</span></label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                </select>
              </div>

              <div className="acf-field">
                <label className="acf-label">Group <span className="acf-required">*</span></label>
                <select
                  name="customer_group"
                  value={formData.customer_group}
                  onChange={handleChange}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Government">Government</option>
                </select>
              </div>

              <div className="acf-field">
                <label className="acf-label">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                </select>
              </div>

              <div className="acf-field">
                <label className="acf-label">Industry</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter industry"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">Market Segment</label>
                <input
                  type="text"
                  name="market_segment"
                  value={formData.market_segment}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter market segment"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Contact Information - Compact */}
            <div className="acf-section-header" style={{ marginTop: '15px' }}>
              <span className="acf-section-title">
                <FaEnvelope className="acf-section-icon" /> Contact Information
              </span>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Email</label>
                <input
                  type="email"
                  name="email_id"
                  value={formData.email_id}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter email"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">Mobile</label>
                <input
                  type="tel"
                  name="mobile_no"
                  value={formData.mobile_no}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter mobile"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter website"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Contact Persons - NEW Avatar Style */}
            <div className="acf-section-header" style={{ marginTop: '15px' }}>
              <span className="acf-section-title">
                <FaUserTie className="acf-section-icon" /> Contact Persons
              </span>
            </div>

            {/* Contacts with Add button at start */}
            <div className="acf-contact-avatars">
              {/* Add Contact Button - First card */}
              <button
                type="button"
                onClick={openAddContactModal}
                className="contact-add-card"
                disabled={submitting}
              >
                <FaPlus className="contact-add-icon" />
                <span>Add</span>
              </button>

              {/* Existing Contacts */}
              {formData.contact_persons.map((contact, index) => {
                // Only render if contact has at least first_name or last_name
                if (!contact.first_name && !contact.last_name) return null;
                
                const initials = getInitials(contact.first_name, contact.last_name);
                const color = getColorFromName(`${contact.first_name} ${contact.last_name}`);
                const fullName = `${contact.first_name} ${contact.last_name}`.trim();
                
                return (
                  <div key={index} className="contact-avatar-item">
                    <div 
                      className="contact-avatar-circle"
                      style={{ backgroundColor: color }}
                      onClick={() => openEditContactModal(index)}
                      title={fullName}
                    >
                      {initials}
                      {contact.is_primary && (
                        <div className="contact-primary-badge">
                          <FaCheckCircle size={14} />
                        </div>
                      )}
                    </div>
                    <div className="contact-avatar-name-only">{fullName}</div>
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="contact-remove-btn"
                      disabled={submitting || formData.contact_persons.length <= 1}
                      title="Remove contact"
                    >
                      <FaTimes />
                    </button>
                  </div>
                );
              })}
            </div>

            {!hasValidContacts && (
              <div className="acf-empty-contacts">
                <FaUserTie size={24} style={{ opacity: 0.3 }} />
                <p>No contact persons added. Click "Add" to add one.</p>
              </div>
            )}

            <div className="acf-table-hint">
              <FaInfoCircle size={12} /> 
              <span>Click on a contact's avatar to edit. Primary contact has a <FaCheckCircle size={12} style={{ color: '#4CAF50' }} /> badge.</span>
            </div>
          </div>

          {/* Footer */}
          <div className="acf-footer">
            <button
              type="button"
              onClick={handleCancel}
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
              <FaSave />
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;