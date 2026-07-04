import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, 
  FaBuilding, FaUser, FaMapMarkerAlt,FaTag,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AddSupplier.css';

interface SupplierForm {
  // Basic Info
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  defaultCurrency: string;
  language: string;
  
  // Contact
  firstName: string;
  lastName: string;
  emailId: string;
  mobileNo: string;
  
  // Address
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  
  // Tax & Financial
  taxId: string;
  taxCategory: string;
  paymentTerms: string;
  defaultBankAccount: string;
  defaultPriceList: string;
  
  // Additional
  website: string;
  supplierDetails: string;
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
}

interface SupplierResponse {
  success: number;
  message: string;
  data: {
    fieldCount: number;
    affectedRows: number;
    insertId: number;
    info: string;
    serverStatus: number;
    warningStatus: number;
    changedRows: number;
  };
}

export default function AddSupplier() {
  const navigate = useNavigate();
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pincodeSuggestions, setPincodeSuggestions] = useState<string[]>([]);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);

  const [formData, setFormData] = useState<SupplierForm>({
    supplierName: '',
    supplierType: 'Company',
    supplierGroup: '',
    country: 'India',
    defaultCurrency: 'INR',
    language: 'en',
    firstName: '',
    lastName: '',
    emailId: '',
    mobileNo: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    taxId: '',
    taxCategory: 'Registered Regular',
    paymentTerms: '30 Days',
    defaultBankAccount: '',
    defaultPriceList: 'Standard Buying',
    website: '',
    supplierDetails: '',
    isTransporter: false,
    isInternalSupplier: false,
    onHold: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
  const supplierGroups = ['Raw Materials', 'Electronic Components', 'Packaging', 'Chemicals', 'Logistics', 'Office Supplies', 'Services', 'All Supplier Groups'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  // const languages = ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ar'];
  const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
  const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
  const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];

  // Sample pincode data for autofill
  const pincodeData: { [key: string]: { city: string; state: string; country: string } } = {
    '400001': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '400002': { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
    '411001': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '411002': { city: 'Pune', state: 'Maharashtra', country: 'India' },
    '560001': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '560002': { city: 'Bangalore', state: 'Karnataka', country: 'India' },
    '110001': { city: 'Delhi', state: 'Delhi', country: 'India' },
    '110002': { city: 'Delhi', state: 'Delhi', country: 'India' },
    '700001': { city: 'Kolkata', state: 'West Bengal', country: 'India' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu', country: 'India' },
    '500001': { city: 'Hyderabad', state: 'Telangana', country: 'India' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat', country: 'India' },
    '302001': { city: 'Jaipur', state: 'Rajasthan', country: 'India' },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
    '201301': { city: 'Noida', state: 'Uttar Pradesh', country: 'India' },
    '122001': { city: 'Gurgaon', state: 'Haryana', country: 'India' }
  };

  // Handle pincode change - autofill address
  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, pincode: value }));
    
    const suggestions = Object.keys(pincodeData).filter(p => p.startsWith(value));
    setPincodeSuggestions(suggestions);
    setShowPincodeSuggestions(suggestions.length > 0 && value.length > 0);

    if (pincodeData[value]) {
      const data = pincodeData[value];
      setFormData(prev => ({
        ...prev,
        pincode: value,
        city: data.city,
        state: data.state,
        country: data.country
      }));
      setShowPincodeSuggestions(false);
      toast.success('Address autofilled from pincode!');
    }
  };

  const selectPincode = (pincode: string) => {
    const data = pincodeData[pincode];
    if (data) {
      setFormData(prev => ({
        ...prev,
        pincode: pincode,
        city: data.city,
        state: data.state,
        country: data.country
      }));
    }
    setShowPincodeSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email ID is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }
    if (!formData.mobileNo.trim()) {
      newErrors.mobileNo = 'Mobile number is required';
    } else if (!/^[0-9+\-\s()]{8,20}$/.test(formData.mobileNo)) {
      newErrors.mobileNo = 'Please enter a valid phone number';
    }
    if (!formData.addressLine1.trim()) {
      newErrors.addressLine1 = 'Address line 1 is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.querySelector(`[name="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).focus();
        }
      }
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      // ✅ CORRECT: Match the exact API payload structure
      const payload = {
        name: formData.supplierName,
        supplier_name: formData.supplierName,
        supplier_type: formData.supplierType,
        supplier_group: formData.supplierGroup,
        country: formData.country,
        gender: null,
        is_transporter: formData.isTransporter ? 1 : 0,
        image: null,
        default_currency: formData.defaultCurrency,
        default_bank_account: formData.defaultBankAccount || null,
        default_price_list: formData.defaultPriceList,
        supplier_details: formData.supplierDetails || null,
        website: formData.website || null,
        language: formData.language || 'en',
        supplier_primary_address: null,
        primary_address: null,
        supplier_primary_contact: null,
        mobile_no: formData.mobileNo,
        email_id: formData.emailId,
        tax_id: formData.taxId || null,
        tax_category: formData.taxCategory || null,
        tax_withholding_category: null,
        tax_withholding_group: null,
        payment_terms: formData.paymentTerms || null,
        is_internal_supplier: formData.isInternalSupplier ? 1 : 0,
        represents_company: null,
        allow_purchase_invoice_creation_without_purchase_order: 0,
        allow_purchase_invoice_creation_without_purchase_receipt: 0,
        warn_rfqs: 0,
        prevent_rfqs: 0,
        warn_pos: 0,
        prevent_pos: 0,
        on_hold: formData.onHold ? 1 : 0,
        hold_type: null,
        release_date: null,
        modified_by: "Administrator",
        owner: "Administrator",
        _user_tags: null,
        _comments: null,
        _assign: null,
        _liked_by: null
      };

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

      const response = await api.post<SupplierResponse>('/supplier', payload);

      console.log('📥 Response:', response.data);

      if (response.data && response.data.success === 1) {
        toast.success(response.data.message || 'Supplier created successfully!');
        setTimeout(() => {
          navigate('/supplier');
        }, 500);
      } else {
        toast.error(response.data?.message || 'Failed to create supplier');
      }
    } catch (error: any) {
      console.error('❌ Error creating supplier:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 400) {
          toast.error(error.response.data?.message || 'Bad request. Please check your input.');
        } else if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
        } else if (error.response.status === 403) {
          toast.error('You don\'t have permission to create suppliers.');
        } else if (error.response.status === 409) {
          toast.error(error.response.data?.message || 'Supplier already exists.');
        } else if (error.response.status === 422) {
          const errors = error.response.data?.errors || {};
          Object.keys(errors).forEach(key => {
            setErrors(prev => ({ ...prev, [key]: errors[key] }));
          });
          toast.error('Please fix the validation errors.');
        } else if (error.response.status === 500) {
          toast.error(error.response.data?.message || 'Server error. Please try again later.');
        } else {
          toast.error(error.response.data?.message || 'Failed to create supplier');
        }
      } else if (error.request) {
        toast.error('Network error - No response from server');
      } else {
        toast.error(error.message || 'Failed to create supplier');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/supplier');
    }
  };

  return (
    <div className={`add-supplier-page ${theme}-theme`}>
      <style>{`
        .add-supplier-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--layout-bg, #f5f7fb);
          padding: 16px 24px;
          gap: 16px;
          overflow-y: auto;
          font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
          color: var(--text-primary, #1f2433);
        }

        .add-supplier-page::-webkit-scrollbar { width: 4px; }
        .add-supplier-page::-webkit-scrollbar-track { background: transparent; }
        .add-supplier-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
          flex-shrink: 0;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #e5e7eb);
          background: var(--card-bg, #ffffff);
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: var(--nav-hover, #f3f4f6);
          border-color: var(--primary-color, #6366f1);
          color: var(--primary-color, #6366f1);
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
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

        .form-section {
          background: var(--card-bg, #ffffff);
          border-radius: 10px;
          padding: 16px 20px;
          border: 1px solid var(--border-color, #e5e7eb);
          margin-bottom: 12px;
        }

        .form-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #1f2433);
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title .badge-info {
          font-size: 10px;
          font-weight: 400;
          color: var(--text-secondary, #6b7280);
          background: var(--layout-bg, #f3f4f6);
          padding: 2px 10px;
          border-radius: 10px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px 20px;
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
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .form-group label .required {
          color: #ef4444;
          font-weight: 600;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
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

        .form-group input.error {
          border-color: var(--danger-color, #ef4444);
        }

        .form-group input::placeholder,
        .form-group textarea::placeholder {
          color: var(--text-secondary, #9ca3af);
        }

        .error-text {
          font-size: 10px;
          color: var(--danger-color, #ef4444);
          margin-top: 2px;
          display: block;
        }

        .field-hint {
          font-size: 10px;
          color: var(--text-secondary, #6b7280);
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
        }

        .checkbox-group input[type="checkbox"] {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          cursor: pointer;
          accent-color: var(--primary-color, #6366f1);
        }

        .checkbox-group label {
          font-size: 13px;
          color: var(--text-primary, #374151);
          cursor: pointer;
        }

        .suggestions-container {
          position: relative;
        }

        .suggestions-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--card-bg, #ffffff);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 6px;
          max-height: 150px;
          overflow-y: auto;
          z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-top: 2px;
        }

        .suggestions-list::-webkit-scrollbar {
          width: 4px;
        }

        .suggestions-list::-webkit-scrollbar-track {
          background: var(--layout-bg, #f9fafb);
        }

        .suggestions-list::-webkit-scrollbar-thumb {
          background: var(--border-color, #e5e7eb);
          border-radius: 2px;
        }

        .suggestion-item {
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-primary, #374151);
          transition: background 0.15s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .suggestion-item:hover {
          background: var(--nav-hover, #f3f4f6);
        }

        .suggestion-item .suggestion-detail {
          font-size: 11px;
          color: var(--text-secondary, #6b7280);
        }

        .address-checkboxes {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color, #e5e7eb);
          margin-top: 4px;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .add-supplier-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-actions { flex-wrap: wrap; }
          .form-grid { grid-template-columns: 1fr; }
          .form-section { padding: 14px 16px; }
          .address-checkboxes { flex-direction: column; gap: 8px; }
        }

        @media (max-width: 480px) {
          .add-supplier-page { padding: 8px 12px; }
          .page-title { font-size: 18px; }
          .form-section { padding: 12px; }
          .form-group input, .form-group select { font-size: 14px; padding: 10px 12px; }
        }

        .dark-theme .add-supplier-page { background: var(--layout-bg, #0f172a); }
        .dark-theme .page-header { border-bottom-color: var(--border-color, #334155); }
        .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .back-btn { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
        .dark-theme .back-btn:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); border-color: var(--primary-color, #818cf8); color: var(--primary-color, #818cf8); }
        .dark-theme .form-section { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .section-title { color: var(--text-primary, #f8fafc); }
        .dark-theme .form-group label { color: var(--text-primary, #e2e8f0); }
        .dark-theme .form-group input, .dark-theme .form-group select, .dark-theme .form-group textarea { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .form-group input:focus, .dark-theme .form-group select:focus, .dark-theme .form-group textarea:focus { border-color: var(--primary-color, #818cf8); }
        .dark-theme .form-group input::placeholder, .dark-theme .form-group textarea::placeholder { color: var(--text-secondary, #64748b); }
        .dark-theme .suggestions-list { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
        .dark-theme .suggestion-item { color: var(--text-primary, #f8fafc); }
        .dark-theme .suggestion-item:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); }
        .dark-theme .checkbox-group label { color: var(--text-primary, #f8fafc); }
        .dark-theme .field-hint { color: var(--text-secondary, #64748b); }
        .dark-theme .error-text { color: #f87171; }
        .dark-theme .form-group input.error { border-color: #f87171; }
        .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
        .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
        .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
        .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleCancel}>
            <FaArrowLeft size={16} />
          </button>
          <h1 className="page-title">Add Supplier</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading || isSubmitting}>
            {(loading || isSubmitting) && <FaSpinner className="spinning" />}
            <FaSave size={14} /> {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <div className="section-title">
            <FaBuilding size={14} /> Basic Information
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier Name <span className="required">*</span></label>
              <input
                type="text"
                name="supplierName"
                value={formData.supplierName}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                className={errors.supplierName ? 'error' : ''}
              />
              {errors.supplierName && <span className="error-text">{errors.supplierName}</span>}
            </div>
            <div className="form-group">
              <label>Supplier Type <span className="required">*</span></label>
              <select
                name="supplierType"
                value={formData.supplierType}
                onChange={handleInputChange}
              >
                {supplierTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Supplier Group</label>
              <select
                name="supplierGroup"
                value={formData.supplierGroup}
                onChange={handleInputChange}
              >
                <option value="">Select Group</option>
                {supplierGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Country <span className="required">*</span></label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              >
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Default Currency</label>
              <select
                name="defaultCurrency"
                value={formData.defaultCurrency}
                onChange={handleInputChange}
              >
                {currencies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <select
                name="language"
                value={formData.language}
                onChange={handleInputChange}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="form-section">
          <div className="section-title">
            <FaUser size={14} /> Contact Details
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter last name"
              />
            </div>
            <div className="form-group">
              <label>Email ID <span className="required">*</span></label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={errors.emailId ? 'error' : ''}
              />
              {errors.emailId && <span className="error-text">{errors.emailId}</span>}
            </div>
            <div className="form-group">
              <label>Mobile Number <span className="required">*</span></label>
              <input
                type="tel"
                name="mobileNo"
                value={formData.mobileNo}
                onChange={handleInputChange}
                placeholder="Enter mobile number"
                className={errors.mobileNo ? 'error' : ''}
              />
              {errors.mobileNo && <span className="error-text">{errors.mobileNo}</span>}
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="form-section">
          <div className="section-title">
            <FaMapMarkerAlt size={14} /> Address Details
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Address Line 1 <span className="required">*</span></label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                placeholder="Enter address line 1"
                className={errors.addressLine1 ? 'error' : ''}
              />
              {errors.addressLine1 && <span className="error-text">{errors.addressLine1}</span>}
            </div>
            <div className="form-group full-width">
              <label>Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                placeholder="Enter address line 2 (optional)"
              />
            </div>
            <div className="form-group">
              <label>City/Town <span className="required">*</span></label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className={errors.city ? 'error' : ''}
              />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>
            <div className="form-group">
              <label>State/Province <span className="required">*</span></label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Enter state"
                className={errors.state ? 'error' : ''}
              />
              {errors.state && <span className="error-text">{errors.state}</span>}
            </div>
            <div className="form-group">
              <label>Postal Code <span className="required">*</span></label>
              <div className="suggestions-container">
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter postal code"
                  className={errors.pincode ? 'error' : ''}
                />
                {showPincodeSuggestions && (
                  <div className="suggestions-list">
                    {pincodeSuggestions.map(p => (
                      <div 
                        key={p} 
                        className="suggestion-item"
                        onClick={() => selectPincode(p)}
                      >
                        <span>{p}</span>
                        {pincodeData[p] && (
                          <span className="suggestion-detail">
                            {pincodeData[p].city}, {pincodeData[p].state}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {errors.pincode && <span className="error-text">{errors.pincode}</span>}
              <div className="field-hint">
                <FaInfoCircle size={12} />
                Change the Postal Code to autofill other addresses.
              </div>
            </div>
          </div>
        </div>

        {/* Tax & Financial Details */}
        <div className="form-section">
          <div className="section-title">
            <FaTag size={14} /> Tax & Financial Details
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Tax ID / GSTIN</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="Enter tax ID"
              />
            </div>
            <div className="form-group">
              <label>Tax Category</label>
              <select
                name="taxCategory"
                value={formData.taxCategory}
                onChange={handleInputChange}
              >
                {taxCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
              >
                {paymentTerms.map(term => (
                  <option key={term} value={term}>{term}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Default Price List</label>
              <select
                name="defaultPriceList"
                value={formData.defaultPriceList}
                onChange={handleInputChange}
              >
                {priceLists.map(pl => (
                  <option key={pl} value={pl}>{pl}</option>
                ))}
              </select>
            </div>
            <div className="form-group full-width">
              <label>Default Bank Account</label>
              <input
                type="text"
                name="defaultBankAccount"
                value={formData.defaultBankAccount}
                onChange={handleInputChange}
                placeholder="Bank Name - Account Number"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <div className="section-title">
            <FaInfoCircle size={14} /> Additional Information
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://www.example.com"
              />
            </div>
            <div className="form-group full-width">
              <label>Supplier Details</label>
              <textarea
                name="supplierDetails"
                value={formData.supplierDetails}
                onChange={handleInputChange}
                placeholder="Additional notes about the supplier..."
                rows={3}
              />
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="isTransporter"
                  checked={formData.isTransporter}
                  onChange={handleInputChange}
                  id="isTransporter"
                />
                <label htmlFor="isTransporter">Is Transporter</label>
              </div>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="isInternalSupplier"
                  checked={formData.isInternalSupplier}
                  onChange={handleInputChange}
                  id="isInternalSupplier"
                />
                <label htmlFor="isInternalSupplier">Internal Supplier</label>
              </div>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  name="onHold"
                  checked={formData.onHold}
                  onChange={handleInputChange}
                  id="onHold"
                />
                <label htmlFor="onHold">On Hold</label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading || isSubmitting}>
            {(loading || isSubmitting) && <FaSpinner className="spinning" />}
            <FaSave size={14} /> {isSubmitting ? 'Saving...' : 'Save Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
}