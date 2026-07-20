import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaTags,
  FaList,
  FaUser,
  FaMapMarkerAlt,
  FaIdCard,
  FaMoneyBill,
  FaLanguage,
  FaLink,
  FaClock,
} from 'react-icons/fa';
import "./SupplierForm.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface FormData {
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  defaultCurrency: string;
  language: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  taxId: string;
  taxCategory: string;
  paymentTerms: string;
  defaultBankAccount: string;
  defaultPriceList: string;
  website: string;
  supplierDetails: string;
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
  status: 'Active' | 'Inactive';
}

const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
const supplierGroups = ['Raw Materials', 'Electronic Components', 'Packaging', 'Chemicals', 'Logistics', 'Office Supplies', 'Services', 'All Supplier Groups'];
const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const languages = ['en', 'hi', 'es', 'fr', 'de', 'zh', 'ar'];
const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];
const statusOptions = ['Active', 'Inactive'];

export default function SupplierForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";

  // ─── Form State ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    supplierName: '',
    supplierType: 'Company',
    supplierGroup: '',
    country: 'India',
    defaultCurrency: 'INR',
    language: 'en',
    email: '',
    phone: '',
    address: '',
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
    onHold: false,
    status: 'Active',
  });

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // ─── Fetch existing supplier for editing ──────────────────────────────
  useEffect(() => {
    if (!isNew && id) {
      const fetchSupplier = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/supplier/${id}`);
          if (response.data && response.data.success === 1) {
            const item = response.data.data;
            setFormData({
              supplierName: item.supplier_name || item.name || '',
              supplierType: item.supplier_type || 'Company',
              supplierGroup: item.supplier_group || '',
              country: item.country || 'India',
              defaultCurrency: item.default_currency || 'INR',
              language: item.language || 'en',
              email: item.email_id || item.email || '',
              phone: item.mobile_no || item.phone || '',
              address: item.address || '',
              city: item.city || '',
              state: item.state || '',
              pincode: item.pincode || '',
              taxId: item.tax_id || '',
              taxCategory: item.tax_category || 'Registered Regular',
              paymentTerms: item.payment_terms || '30 Days',
              defaultBankAccount: item.default_bank_account || '',
              defaultPriceList: item.default_price_list || 'Standard Buying',
              website: item.website || '',
              supplierDetails: item.supplier_details || '',
              isTransporter: item.is_transporter === 1 || item.is_transporter === true,
              isInternalSupplier: item.is_internal_supplier === 1 || item.is_internal_supplier === true,
              onHold: item.on_hold === 1 || item.on_hold === true,
              status: item.disabled === 1 ? 'Inactive' : 'Active',
            });
          } else {
            setApiError(response.data?.message || 'Failed to load supplier details');
          }
        } catch (err: any) {
          console.error('Error fetching supplier:', err);
          setApiError(err?.response?.data?.message || 'Failed to load supplier details');
        } finally {
          setLoading(false);
        }
      };
      fetchSupplier();
    }
  }, [id, isNew]);

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.supplierName.trim()) {
      allErrors.push({ field: 'supplierName', label: 'Supplier Name', message: 'Supplier name is required' });
    }

    return allErrors;
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplier_name: formData.supplierName.trim(),
        supplier_type: formData.supplierType,
        supplier_group: formData.supplierGroup || 'N/A',
        country: formData.country,
        default_currency: formData.defaultCurrency,
        language: formData.language,
        email_id: formData.email,
        mobile_no: formData.phone,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        tax_id: formData.taxId || null,
        tax_category: formData.taxCategory || null,
        payment_terms: formData.paymentTerms || null,
        default_bank_account: formData.defaultBankAccount || null,
        default_price_list: formData.defaultPriceList,
        website: formData.website || null,
        supplier_details: formData.supplierDetails || null,
        is_transporter: formData.isTransporter ? 1 : 0,
        is_internal_supplier: formData.isInternalSupplier ? 1 : 0,
        on_hold: formData.onHold ? 1 : 0,
        disabled: formData.status === 'Inactive' ? 1 : 0,
        modified_by: "Administrator",
        owner: "Administrator"
      };

      let response;
      if (isNew) {
        response = await api.post('/supplier', payload);
      } else {
        const payloadWithId = { ...payload, id };
        response = await api.put('/supplier', payloadWithId);
      }

      if (response.data && response.data.success === 1) {
        toast.success(response.data.message || `Supplier ${isNew ? 'created' : 'updated'} successfully!`);
        navigate('/supplier');
      } else {
        setApiError(response.data?.message || `Failed to ${isNew ? 'create' : 'update'} supplier`);
      }
    } catch (err: any) {
      console.error('Error saving supplier:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A supplier with this name already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || `Failed to ${isNew ? 'create' : 'update'} supplier`);
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

  const hasErrors = getAllValidationErrors().length > 0;

  if (loading) {
    return (
      <div className={`igf-page ${theme}`}>
        <div className="igf-inner">
          <div className="igf-loading-state">
            <FaSpinner className="spinning" size={32} />
            <p>Loading supplier details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`igf-page ${theme}`}>
      <div className="igf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
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

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="igf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="igf-header">
          <button onClick={() => navigate('/supplier')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Add New Supplier' : `Edit: ${formData.supplierName}`}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="igf-card">

            {/* General Settings */}
            <span className="igf-section-title">General Settings</span>

            <div className="igf-field">
              <label className="igf-label">
                <FaBuilding className="igf-label-icon" />Supplier Name <span className="igf-required">*</span>
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => handleChange('supplierName', e.target.value)}
                className={`form-field${errors.supplierName ? ' field-error' : ''}`}
                placeholder="Enter supplier name"
                disabled={submitting}
                autoFocus
              />
              {errors.supplierName && <span className="igf-error-msg"><FaExclamationCircle size={10} />{errors.supplierName}</span>}
            </div>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaUser className="igf-label-icon" />Supplier Type</label>
                <select
                  value={formData.supplierType}
                  onChange={(e) => handleChange('supplierType', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {supplierTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaTags className="igf-label-icon" />Supplier Group</label>
                <select
                  value={formData.supplierGroup}
                  onChange={(e) => handleChange('supplierGroup', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  <option value="">Select Group</option>
                  {supplierGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaGlobe className="igf-label-icon" />Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaMoneyBill className="igf-label-icon" />Default Currency</label>
                <select
                  value={formData.defaultCurrency}
                  onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaLanguage className="igf-label-icon" />Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {languages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaClock className="igf-label-icon" />Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as 'Active' | 'Inactive')}
                  className="form-field"
                  disabled={submitting}
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="igf-divider" />

            {/* Contact Details */}
            <span className="igf-section-title">Contact Details</span>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaEnvelope className="igf-label-icon" />Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="form-field"
                  placeholder="Enter email address"
                  disabled={submitting}
                />
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaPhone className="igf-label-icon" />Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="form-field"
                  placeholder="Enter phone number"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="igf-divider" />

            {/* Address */}
            <span className="igf-section-title">Address</span>

            <div className="igf-field">
              <label className="igf-label"><FaMapMarkerAlt className="igf-label-icon" />Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="form-field"
                placeholder="Enter street address"
                disabled={submitting}
              />
            </div>

            <div className="igf-grid-3">
              <div className="igf-field">
                <label className="igf-label">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="form-field"
                  placeholder="Enter city"
                  disabled={submitting}
                />
              </div>

              <div className="igf-field">
                <label className="igf-label">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="form-field"
                  placeholder="Enter state"
                  disabled={submitting}
                />
              </div>

              <div className="igf-field">
                <label className="igf-label">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="form-field"
                  placeholder="Enter pincode"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="igf-divider" />

            {/* Tax & Financial */}
            <span className="igf-section-title">Tax & Financial</span>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label"><FaIdCard className="igf-label-icon" />Tax ID / GSTIN</label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleChange('taxId', e.target.value)}
                  className="form-field"
                  placeholder="Enter tax ID or GSTIN"
                  disabled={submitting}
                />
              </div>

              <div className="igf-field">
                <label className="igf-label">Tax Category</label>
                <select
                  value={formData.taxCategory}
                  onChange={(e) => handleChange('taxCategory', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {taxCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="igf-grid-2">
              <div className="igf-field">
                <label className="igf-label">Payment Terms</label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => handleChange('paymentTerms', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {paymentTerms.map(term => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </select>
              </div>

              <div className="igf-field">
                <label className="igf-label"><FaList className="igf-label-icon" />Default Price List</label>
                <select
                  value={formData.defaultPriceList}
                  onChange={(e) => handleChange('defaultPriceList', e.target.value)}
                  className="form-field"
                  disabled={submitting}
                >
                  {priceLists.map(list => (
                    <option key={list} value={list}>{list}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="igf-field">
              <label className="igf-label">Default Bank Account</label>
              <input
                type="text"
                value={formData.defaultBankAccount}
                onChange={(e) => handleChange('defaultBankAccount', e.target.value)}
                className="form-field"
                placeholder="Enter default bank account"
                disabled={submitting}
              />
            </div>

            <div className="igf-divider" />

            {/* Additional Info */}
            <span className="igf-section-title">Additional Information</span>

            <div className="igf-field">
              <label className="igf-label"><FaLink className="igf-label-icon" />Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="form-field"
                placeholder="Enter website URL"
                disabled={submitting}
              />
            </div>

            <div className="igf-field">
              <label className="igf-label">Supplier Details</label>
              <textarea
                value={formData.supplierDetails}
                onChange={(e) => handleChange('supplierDetails', e.target.value)}
                className="form-field igf-textarea"
                placeholder="Additional notes about the supplier..."
                rows={4}
                disabled={submitting}
              />
            </div>

            <div className="igf-divider" />

            {/* Settings */}
            <span className="igf-section-title">Settings</span>

            <div className="igf-checkbox-group">
              <div className="igf-field-check">
                <input
                  type="checkbox"
                  id="isTransporter"
                  checked={formData.isTransporter}
                  onChange={(e) => handleChange('isTransporter', e.target.checked)}
                  className="igf-checkbox"
                  disabled={submitting}
                />
                <div>
                  <label htmlFor="isTransporter" className="igf-check-label">
                    Is Transporter
                  </label>
                  <p className="igf-check-hint">Supplier provides transportation services</p>
                </div>
              </div>

              <div className="igf-field-check">
                <input
                  type="checkbox"
                  id="isInternalSupplier"
                  checked={formData.isInternalSupplier}
                  onChange={(e) => handleChange('isInternalSupplier', e.target.checked)}
                  className="igf-checkbox"
                  disabled={submitting}
                />
                <div>
                  <label htmlFor="isInternalSupplier" className="igf-check-label">
                    Internal Supplier
                  </label>
                  <p className="igf-check-hint">Supplier is an internal entity within the organization</p>
                </div>
              </div>

              <div className="igf-field-check">
                <input
                  type="checkbox"
                  id="onHold"
                  checked={formData.onHold}
                  onChange={(e) => handleChange('onHold', e.target.checked)}
                  className="igf-checkbox"
                  disabled={submitting}
                />
                <div>
                  <label htmlFor="onHold" className="igf-check-label">
                    On Hold
                  </label>
                  <p className="igf-check-hint">Temporarily suspend transactions with this supplier</p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="igf-footer">
            <button
              type="button"
              onClick={() => navigate('/supplier')}
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
              {isNew ? 'Save' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}