import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUser,
  FaCheckCircle,
  FaPlus,
  FaUserTie,
  FaTimes,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import './AddCustomer.css';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface ContactPerson {
  id?: string;
  first_name: string;
  last_name: string;
  contact_name: string;
  mobile_no: string;
  alternate_mobile: string;
  email_id: string;
  telephone: string;
  extension: string;
  is_primary: number; // 1 or 0
  is_billing_contact: number; // 1 or 0
  is_saler_contact: number; // 1 or 0
  remarks: string;
}

interface CustomerFormData {
  customer_name: string;
  customer_group: string;
  territory: string;
  customer_type: string;
  mobile_no: string;
  email_id: string;
  customer_primary_address: string;
  primary_address: string;
  contacts: ContactPerson[];
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface CustomerApiResponse {
  success: number;
  data: {
    id: number;
    name: string;
    creation: string;
    modified: string;
    modified_by: string;
    owner: string;
    docstatus: number;
    idx: number;
    naming_series: string | null;
    customer_type: string;
    customer_name: string;
    gender: string;
    customer_group: string;
    territory: string | null;
    image: string | null;
    default_currency: string | null;
    default_bank_account: string | null;
    default_price_list: string | null;
    customer_primary_address: string | null;
    primary_address: string | null;
    customer_primary_contact: string | null;
    mobile_no: string;
    email_id: string;
    first_name: string;
    last_name: string;
    tax_id: string | null;
    tax_category: string | null;
    tax_withholding_category: string | null;
    tax_withholding_group: string | null;
    payment_terms: string | null;
    is_internal_customer: number;
    represents_company: string | null;
    loyalty_program: string | null;
    loyalty_program_tier: string | null;
    account_manager: string | null;
    default_sales_partner: string | null;
    default_commission_rate: number;
    so_required: number;
    dn_required: number;
    disabled: number;
    is_frozen: number;
    lead_name: string | null;
    opportunity_name: string | null;
    prospect_name: string | null;
    market_segment: string;
    industry: string;
    website: string;
    language: string;
    customer_pos_id: string | null;
    customer_details: string | null;
    _user_tags: string | null;
    _comments: string | null;
    _assign: string | null;
    _liked_by: string | null;
    contacts?: ContactPerson[];
  };
}

// API Payload interface
interface ApiPayload {
  customer_name: string;
  customer_group: string;
  territory: string;
  customer_type: string;
  mobile_no: string;
  email_id: string;
  customer_primary_address: string;
  primary_address: string;
  contacts: {
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
  }[];
}

// Update payload interface with id
interface UpdateApiPayload extends ApiPayload {
  id: number;
}

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { theme } = useAdminTheme();
  const isEditMode = !!id && id !== 'new';
  const isNew = !id || id === 'new';

  // Main form state
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_name: '',
    customer_group: 'Commercial',
    territory: '',
    customer_type: 'Company',
    mobile_no: '',
    email_id: '',
    customer_primary_address: '',
    primary_address: '',
    contacts: [
      {
        first_name: '',
        last_name: '',
        contact_name: '',
        mobile_no: '',
        alternate_mobile: '',
        email_id: '',
        telephone: '',
        extension: '',
        is_primary: 1,
        is_billing_contact: 0,
        is_saler_contact: 1,
        remarks: '',
      }
    ],
  });

  // Main form validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  
  // Modal state - separate and independent
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [tempContact, setTempContact] = useState<ContactPerson>({
    first_name: '',
    last_name: '',
    contact_name: '',
    mobile_no: '',
    alternate_mobile: '',
    email_id: '',
    telephone: '',
    extension: '',
    is_primary: 0,
    is_billing_contact: 0,
    is_saler_contact: 1,
    remarks: '',
  });
  
  // Modal-specific validation errors
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  // Other states
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    if (isEditMode && id) {
      fetchCustomerData(id);
    }
  }, [id, isEditMode]);

  const fetchCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      const response = await api.get<CustomerApiResponse>(`/customer/${customerId}`);
      const data = response.data.data;
      
      // If there are contacts in the response, use them, otherwise create a default contact
      let contacts = data.contacts || [];
      if (contacts.length === 0) {
        contacts = [{
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          contact_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
          mobile_no: data.mobile_no || '',
          alternate_mobile: '',
          email_id: data.email_id || '',
          telephone: '',
          extension: '',
          is_primary: 1,
          is_billing_contact: 0,
          is_saler_contact: 1,
          remarks: '',
        }];
      }
      
      setFormData({
        customer_name: data.customer_name || '',
        customer_group: data.customer_group || 'Commercial',
        territory: data.territory || '',
        customer_type: data.customer_type || 'Company',
        mobile_no: data.mobile_no || '',
        email_id: data.email_id || '',
        customer_primary_address: data.customer_primary_address || '',
        primary_address: data.primary_address || '',
        contacts: contacts,
      });
      
      setApiError(null);
    } catch (err) {
      setApiError('Failed to fetch customer data');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== MAIN FORM HANDLERS =====
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field immediately
    setValidationErrors(prev => prev.filter(err => err.field !== name));
  };

  const getInitial = (firstName: string): string => {
    if (!firstName) return '?';
    return firstName.charAt(0).toUpperCase();
  };

  // ===== MODAL HANDLERS - COMPLETELY SEPARATE =====
  const openAddContactModal = () => {
    setEditingContactIndex(null);
    setTempContact({
      first_name: '',
      last_name: '',
      contact_name: '',
      mobile_no: '',
      alternate_mobile: '',
      email_id: '',
      telephone: '',
      extension: '',
      is_primary: 0,
      is_billing_contact: 0,
      is_saler_contact: 1,
      remarks: '',
    });
    setModalErrors({}); // Clear modal errors only
    setShowContactModal(true);
  };

  const openEditContactModal = (index: number) => {
    setEditingContactIndex(index);
    setTempContact({ ...formData.contacts[index] });
    setModalErrors({}); // Clear modal errors only
    setShowContactModal(true);
  };

  const handleTempContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Update temp contact
    setTempContact(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
      };
      
      // Auto-generate contact_name from first_name and last_name
      if (name === 'first_name' || name === 'last_name') {
        const firstName = name === 'first_name' ? value : prev.first_name;
        const lastName = name === 'last_name' ? value : prev.last_name;
        updated.contact_name = `${firstName} ${lastName}`.trim();
      }
      
      return updated;
    });
    
    // Clear error for this specific field in MODAL ERRORS ONLY
    if (name === 'first_name' || name === 'last_name' || name === 'email_id' || name === 'mobile_no') {
      setModalErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const validateContactModal = (): boolean => {
    const errors: Record<string, string> = {};

    if (!tempContact.first_name.trim()) {
      errors.first_name = 'First name is required';
    }
    if (!tempContact.last_name.trim()) {
      errors.last_name = 'Last name is required';
    }
    if (!tempContact.email_id.trim()) {
      errors.email_id = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(tempContact.email_id)) {
      errors.email_id = 'Please enter a valid email address';
    }
    if (!tempContact.mobile_no.trim()) {
      errors.mobile_no = 'Mobile number is required';
    }

    setModalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveContact = () => {
    // Validate only the modal fields
    if (!validateContactModal()) {
      return;
    }

    setFormData(prev => {
      let updatedContacts: ContactPerson[];
      
      if (editingContactIndex !== null) {
        updatedContacts = [...prev.contacts];
        
        // If this contact is being set as primary, unset others
        if (tempContact.is_primary === 1) {
          updatedContacts = updatedContacts.map((contact, i) => ({
            ...contact,
            is_primary: i === editingContactIndex ? 1 : 0
          }));
        }
        
        updatedContacts[editingContactIndex] = { ...tempContact };
      } else {
        updatedContacts = [...prev.contacts];
        
        // If this contact is being set as primary, unset others
        if (tempContact.is_primary === 1) {
          updatedContacts = updatedContacts.map(contact => ({
            ...contact,
            is_primary: 0
          }));
        }
        
        updatedContacts.push({ ...tempContact });
      }
      
      return {
        ...prev,
        contacts: updatedContacts
      };
    });

    // Close modal and reset
    setShowContactModal(false);
    setTempContact({
      first_name: '',
      last_name: '',
      contact_name: '',
      mobile_no: '',
      alternate_mobile: '',
      email_id: '',
      telephone: '',
      extension: '',
      is_primary: 0,
      is_billing_contact: 0,
      is_saler_contact: 1,
      remarks: '',
    });
    setEditingContactIndex(null);
    setModalErrors({});
    setApiError(null);
  };

  const removeContactPerson = (index: number) => {
    const validContacts = formData.contacts.filter(
      c => c.first_name.trim() || c.last_name.trim()
    );

    if (validContacts.length <= 1) {
      setApiError('You must have at least one contact person');
      return;
    }

    setFormData(prev => {
      const updatedContacts = prev.contacts.filter((_, i) => i !== index);
      
      // If we removed the primary contact, set the first remaining as primary
      if (prev.contacts[index].is_primary === 1 && updatedContacts.length > 0) {
        const validContact = updatedContacts.find(c => c.first_name.trim() || c.last_name.trim());
        if (validContact) {
          validContact.is_primary = 1;
        }
      }
      
      return {
        ...prev,
        contacts: updatedContacts
      };
    });

    setApiError(null);
  };

  // ===== MAIN FORM VALIDATION =====
  const getAllValidationErrors = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Check if customer has a name
    if (!formData.customer_name.trim()) {
      errors.push({ 
        field: 'customer_name', 
        label: 'Customer Name', 
        message: 'Customer name is required' 
      });
    }

    // Validate customer type
    if (!formData.customer_type) {
      errors.push({
        field: 'customer_type',
        label: 'Customer Type',
        message: 'Customer type is required'
      });
    }

    // Validate customer group
    if (!formData.customer_group) {
      errors.push({
        field: 'customer_group',
        label: 'Customer Group',
        message: 'Customer group is required'
      });
    }

    // Validate contact persons - only count actual contacts
    const validContacts = formData.contacts.filter(
      contact => contact.first_name.trim() || contact.last_name.trim() || contact.email_id.trim() || contact.mobile_no.trim()
    );

    if (validContacts.length === 0) {
      errors.push({
        field: 'contacts',
        label: 'Contact Persons',
        message: 'At least one contact person is required'
      });
    } else {
      // Validate each contact with data
      validContacts.forEach((contact, validIndex) => {
        const originalIndex = formData.contacts.findIndex(c => c === contact);
        
        if (!contact.first_name.trim()) {
          errors.push({
            field: `contact_${originalIndex}_first_name`,
            label: `Contact ${validIndex + 1} - First Name`,
            message: 'First name is required'
          });
        }
        if (!contact.last_name.trim()) {
          errors.push({
            field: `contact_${originalIndex}_last_name`,
            label: `Contact ${validIndex + 1} - Last Name`,
            message: 'Last name is required'
          });
        }
        if (!contact.email_id.trim()) {
          errors.push({
            field: `contact_${originalIndex}_email_id`,
            label: `Contact ${validIndex + 1} - Email`,
            message: 'Email is required'
          });
        } else if (!/\S+@\S+\.\S+/.test(contact.email_id)) {
          errors.push({
            field: `contact_${originalIndex}_email_id`,
            label: `Contact ${validIndex + 1} - Email`,
            message: 'Please enter a valid email address'
          });
        }
        if (!contact.mobile_no.trim()) {
          errors.push({
            field: `contact_${originalIndex}_mobile_no`,
            label: `Contact ${validIndex + 1} - Mobile`,
            message: 'Mobile number is required'
          });
        }
      });
    }

    return errors;
  };

  const getFieldError = (fieldName: string): string | null => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setSuccess('');

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      
      // Find the first field with error and scroll to it
      const firstError = validationErrorsList[0];
      
      // Handle contacts fields specially
      if (firstError.field.includes('contact_')) {
        const contactElements = document.querySelectorAll('.contact-avatar-item');
        if (contactElements.length > 0) {
          contactElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          const avatar = contactElements[0].querySelector('.contact-avatar-circle');
          if (avatar) {
            avatar.classList.add('contact-avatar-error');
            setTimeout(() => avatar.classList.remove('contact-avatar-error'), 3000);
          }
          return;
        }
      }
      
      const fieldSelector = `[name="${firstError.field}"]`;
      const fieldElement = document.querySelector(fieldSelector);
      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (fieldElement as HTMLElement).focus();
      }
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare the payload according to the required structure
      const payload: ApiPayload = {
        customer_name: formData.customer_name.trim(),
        customer_group: formData.customer_group,
        territory: formData.territory,
        customer_type: formData.customer_type,
        mobile_no: formData.mobile_no,
        email_id: formData.email_id,
        customer_primary_address: formData.customer_primary_address,
        primary_address: formData.primary_address,
        contacts: formData.contacts.map(contact => ({
          first_name: contact.first_name,
          last_name: contact.last_name,
          contact_name: contact.contact_name || `${contact.first_name} ${contact.last_name}`.trim(),
          mobile_no: contact.mobile_no,
          alternate_mobile: contact.alternate_mobile || '',
          email_id: contact.email_id,
          telephone: contact.telephone || '',
          extension: contact.extension || '',
          is_primary: contact.is_primary,
          is_billing_contact: contact.is_billing_contact || 0,
          is_saler_contact: contact.is_saler_contact || 1,
          remarks: contact.remarks || '',
        }))
      };
      
      if (isEditMode && id) {
        // For update, include id in the payload and use PUT
        const updatePayload: UpdateApiPayload = {
          id: Number(id),
          ...payload,
        };
        
        // Use PUT with the ID in the payload
        await api.put('/customer', updatePayload);
        
        setSuccess('Customer updated successfully!');
        setTimeout(() => navigate('/customer'), 1500);
      } else {
        // For create, use POST without ID
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
        } else if (err.response.status === 404) {
          setApiError('Customer not found. Please refresh and try again.');
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

  const hasErrors = validationErrors.length > 0;
  const hasValidContacts = formData.contacts.some(
    contact => contact.first_name.trim() || contact.last_name.trim()
  );

  return (
    <div className={`acf-page ${theme}`}>
      <div className="acf-inner">

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
                      className={`form-field ${modalErrors.first_name ? 'field-error' : ''}`}
                      placeholder="Enter first name"
                    />
                    {modalErrors.first_name && (
                      <div className="field-error-message">{modalErrors.first_name}</div>
                    )}
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Last Name <span className="acf-required">*</span></label>
                    <input
                      type="text"
                      name="last_name"
                      value={tempContact.last_name}
                      onChange={handleTempContactChange}
                      className={`form-field ${modalErrors.last_name ? 'field-error' : ''}`}
                      placeholder="Enter last name"
                    />
                    {modalErrors.last_name && (
                      <div className="field-error-message">{modalErrors.last_name}</div>
                    )}
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Contact Name</label>
                    <input
                      type="text"
                      name="contact_name"
                      value={tempContact.contact_name}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Auto-generated from first and last name"
                      disabled
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Email <span className="acf-required">*</span></label>
                    <input
                      type="email"
                      name="email_id"
                      value={tempContact.email_id}
                      onChange={handleTempContactChange}
                      className={`form-field ${modalErrors.email_id ? 'field-error' : ''}`}
                      placeholder="Enter email"
                    />
                    {modalErrors.email_id && (
                      <div className="field-error-message">{modalErrors.email_id}</div>
                    )}
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Mobile <span className="acf-required">*</span></label>
                    <input
                      type="tel"
                      name="mobile_no"
                      value={tempContact.mobile_no}
                      onChange={handleTempContactChange}
                      className={`form-field ${modalErrors.mobile_no ? 'field-error' : ''}`}
                      placeholder="Enter mobile number"
                    />
                    {modalErrors.mobile_no && (
                      <div className="field-error-message">{modalErrors.mobile_no}</div>
                    )}
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Alternate Mobile</label>
                    <input
                      type="tel"
                      name="alternate_mobile"
                      value={tempContact.alternate_mobile}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter alternate mobile"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Telephone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={tempContact.telephone}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter telephone"
                    />
                  </div>
                  <div className="contact-form-field">
                    <label className="contact-form-label">Extension</label>
                    <input
                      type="text"
                      name="extension"
                      value={tempContact.extension}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter extension"
                    />
                  </div>
                  <div className="contact-form-field checkbox-field">
                    <label className="contact-form-label checkbox-label">
                      <input
                        type="checkbox"
                        name="is_primary"
                        checked={tempContact.is_primary === 1}
                        onChange={handleTempContactChange}
                        className="contact-checkbox"
                      />
                      Set as Primary Contact
                    </label>
                  </div>
                  <div className="contact-form-field checkbox-field">
                    <label className="contact-form-label checkbox-label">
                      <input
                        type="checkbox"
                        name="is_billing_contact"
                        checked={tempContact.is_billing_contact === 1}
                        onChange={handleTempContactChange}
                        className="contact-checkbox"
                      />
                      Billing Contact
                    </label>
                  </div>
                  <div className="contact-form-field checkbox-field">
                    <label className="contact-form-label checkbox-label">
                      <input
                        type="checkbox"
                        name="is_saler_contact"
                        checked={tempContact.is_saler_contact === 1}
                        onChange={handleTempContactChange}
                        className="contact-checkbox"
                      />
                      Sales Contact
                    </label>
                  </div>
                  <div className="contact-form-field full-width">
                    <label className="contact-form-label">Remarks</label>
                    <textarea
                      name="remarks"
                      value={tempContact.remarks}
                      onChange={handleTempContactChange}
                      className="form-field"
                      placeholder="Enter remarks"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowContactModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-save-contact" 
                  onClick={saveContact}
                  type="button"
                >
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
              {validationErrors.length} missing field{validationErrors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>

          <div className="acf-card">

            {/* Basic Information - 3 Column Grid */}
            <div className="acf-section-header">
              <span className="acf-section-title">
                <FaUser className="acf-section-icon" /> Customer Information
              </span>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Customer Name <span className="acf-required">*</span></label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  className={`form-field ${getFieldError('customer_name') ? 'field-error' : ''}`}
                  placeholder="Enter customer name"
                  disabled={submitting}
                />
                {getFieldError('customer_name') && (
                  <div className="field-error-message">{getFieldError('customer_name')}</div>
                )}
              </div>

              <div className="acf-field">
                <label className="acf-label">Customer Type <span className="acf-required">*</span></label>
                <select
                  name="customer_type"
                  value={formData.customer_type}
                  onChange={handleChange}
                  className={`form-field ${getFieldError('customer_type') ? 'field-error' : ''}`}
                  disabled={submitting}
                >
                  <option value="Company">Company</option>
                  <option value="Individual">Individual</option>
                </select>
                {getFieldError('customer_type') && (
                  <div className="field-error-message">{getFieldError('customer_type')}</div>
                )}
              </div>

              <div className="acf-field">
                <label className="acf-label">Customer Group <span className="acf-required">*</span></label>
                <select
                  name="customer_group"
                  value={formData.customer_group}
                  onChange={handleChange}
                  className={`form-field ${getFieldError('customer_group') ? 'field-error' : ''}`}
                  disabled={submitting}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Government">Government</option>
                </select>
                {getFieldError('customer_group') && (
                  <div className="field-error-message">{getFieldError('customer_group')}</div>
                )}
              </div>
            </div>

            <div className="acf-grid-3">
              <div className="acf-field">
                <label className="acf-label">Territory</label>
                <input
                  type="text"
                  name="territory"
                  value={formData.territory}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter territory"
                  disabled={submitting}
                />
              </div>

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
            </div>

            {/* Address Information - 2 Column Grid */}
            <div className="acf-section-header" style={{ marginTop: '15px' }}>
              <span className="acf-section-title">
                <FaMapMarkerAlt className="acf-section-icon" /> Address Information
              </span>
            </div>

            <div className="acf-grid-2">
              <div className="acf-field">
                <label className="acf-label">Customer Primary Address</label>
                <input
                  type="text"
                  name="customer_primary_address"
                  value={formData.customer_primary_address}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter customer primary address"
                  disabled={submitting}
                />
              </div>

              <div className="acf-field">
                <label className="acf-label">Primary Address</label>
                <input
                  type="text"
                  name="primary_address"
                  value={formData.primary_address}
                  onChange={handleChange}
                  className="form-field"
                  placeholder="Enter primary address"
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Contact Persons - Avatar Style */}
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
              {formData.contacts.map((contact, index) => {
                // Only render if contact has first_name or last_name
                if (!contact.first_name.trim() && !contact.last_name.trim()) return null;
                
                const initial = getInitial(contact.first_name);
                const fullName = contact.contact_name || `${contact.first_name} ${contact.last_name}`.trim();
                
                // Generate a consistent color based on the name
                const colors = [
                  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
                  '#ec4899', '#f43f5e', '#ef4444', '#f59e0b',
                  '#eab308', '#84cc16', '#22c55e', '#10b981',
                  '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1'
                ];
                const colorIndex = fullName.length % colors.length;
                const avatarColor = colors[colorIndex];
                
                // Check if this contact has validation errors
                const hasContactError = validationErrors.some(err => 
                  err.field === `contact_${index}_first_name` ||
                  err.field === `contact_${index}_last_name` ||
                  err.field === `contact_${index}_email_id` ||
                  err.field === `contact_${index}_mobile_no`
                );
                
                return (
                  <div key={index} className="contact-avatar-item">
                    <div 
                      className={`contact-avatar-circle ${hasContactError ? 'contact-avatar-error' : ''}`}
                      onClick={() => openEditContactModal(index)}
                      title={fullName}
                      style={{ backgroundColor: avatarColor }}
                    >
                      {initial}
                      {contact.is_primary === 1 && (
                        <div className="contact-primary-badge">
                          <FaCheckCircle size={14} />
                        </div>
                      )}
                    </div>
                    <div className="contact-avatar-details">
  <div className="contact-avatar-name">{fullName}</div>

  <div className="contact-avatar-mobile">
    {/* <FaPhone size={11} /> */}
    <span>{contact.mobile_no || "-"}</span>
  </div>
</div>
                    <button
                      type="button"
                      onClick={() => removeContactPerson(index)}
                      className="contact-remove-btn"
                      disabled={submitting}
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