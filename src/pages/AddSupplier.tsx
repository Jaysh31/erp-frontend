import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationCircle,
  FaExclamationTriangle, FaTimesCircle,
  FaBuilding, FaUser, FaMapMarkerAlt, FaTag, FaFolder, FaPhone, FaEnvelope,
  FaUniversity, FaPlus, FaCheckCircle,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './AddSupplier.css';

interface SupplierForm {
  supplierName: string;
  supplierType: string;
  supplierGroup: string;
  country: string;
  defaultCurrency: string;
  language: string;
  firstName: string;
  lastName: string;
  emailId: string;
  mobileNo: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  taxId: string;
  taxCategory: string;
  paymentTerms: string;
  defaultPriceList: string;
  website: string;
  supplierDetails: string;
  isTransporter: boolean;
  isInternalSupplier: boolean;
  onHold: boolean;
  status: 'Active' | 'Inactive';
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface SupplierBankAccount {
  _key: string;
  recordId: number | string | null;
  docName: string | null;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  micr_code: string;
  swift_code: string;
  iban: string;
  upi_id: string;
  currency: string;
  cancelled_cheque: string;
  passbook_copy: string;
  verified: boolean;
  verified_by: string;
  verified_on: string;
  is_primary: boolean;
  remarks: string;
}

// Helper icon component with proper sizing
function FaGlobeIcon(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: '12px', height: '12px', flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const parsePrimaryAddress = (addr: string) => {
  const empty = { addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' };
  if (!addr || !addr.trim()) return empty;

  const parts = addr.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return empty;

  const country = parts.length > 0 ? parts.pop()! : 'India';
  const pincode = parts.length > 0 ? parts.pop()! : '';
  const state = parts.length > 0 ? parts.pop()! : '';
  const city = parts.length > 0 ? parts.pop()! : '';
  const addressLine1 = parts.join(', ');

  return { addressLine1, addressLine2: '', city, state, pincode, country: country || 'India' };
};

const mapBankAccountRow = (row: any): SupplierBankAccount => ({
  _key: row.recordId ? `saved-${row.recordId}` : row._key || `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  recordId: row.recordId ?? row.id ?? null,
  docName: row.docName ?? row.name ?? null,
  account_holder_name: row.account_holder_name || '',
  account_type: row.account_type || 'Savings',
  bank_name: row.bank_name || '',
  branch_name: row.branch_name || '',
  account_number: row.account_number || '',
  ifsc_code: row.ifsc_code || '',
  micr_code: row.micr_code || '',
  swift_code: row.swift_code || '',
  iban: row.iban || '',
  upi_id: row.upi_id || '',
  currency: row.currency || 'INR',
  cancelled_cheque: row.cancelled_cheque || '',
  passbook_copy: row.passbook_copy || '',
  verified: row.verified === 1 || row.verified === true,
  verified_by: row.verified_by || '',
  verified_on: row.verified_on || '',
  is_primary: row.is_primary === 1 || row.is_primary === true,
  remarks: row.remarks || '',
});

const DEFAULT_COMPANY_ID_KEY = 'default_company_id';
const getDefaultCompanyId = (): number | null => {
  const stored = localStorage.getItem(DEFAULT_COMPANY_ID_KEY);
  return stored ? Number(stored) : null;
};

export default function AddSupplier() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { theme } = useAdminTheme();

  const isNew = id === 'new' || !id;
  const isEditMode = !isNew && id;

  const [, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [creatingSupplier, setCreatingSupplier] = useState(false);
  const [pincodeSuggestions, setPincodeSuggestions] = useState<string[]>([]);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [, setIsDirty] = useState(false);

  const [supplierId, setSupplierId] = useState<number | null>(null);


  const [bankAccounts, setBankAccounts] = useState<SupplierBankAccount[]>([]);

  const [formDraftKey, setFormDraftKey] = useState<string>('');

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
    defaultPriceList: 'Standard Buying',
    website: '',
    supplierDetails: '',
    isTransporter: false,
    isInternalSupplier: false,
    onHold: false,
    status: 'Active'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const supplierTypes = ['Company', 'Individual', 'Partnership', 'Proprietorship', 'LLP', 'Trust', 'Society'];
  const supplierGroups = ['Raw Materials', 'Electronic Components', 'Packaging', 'Chemicals', 'Logistics', 'Office Supplies', 'Services', 'All Supplier Groups'];
  const countries = ['India', 'USA', 'UK', 'Germany', 'China', 'Japan', 'UAE', 'Singapore'];
  // const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
  const taxCategories = ['Registered Regular', 'Registered Composition', 'Unregistered', 'SEZ', 'Export Oriented'];
  // const paymentTerms = ['7 Days', '15 Days', '30 Days', '45 Days', '60 Days', 'Due on Receipt'];
  const priceLists = ['Standard Buying', 'Export Pricing', 'Wholesale', 'Distributor'];
  const statusOptions = ['Active', 'Inactive'];

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

  // ── Set up the form-draft cache key and load whatever's there ──────────
  useEffect(() => {
    if (isEditMode && id) {
      const formKey = `supplier_form_draft_edit_${id}`;
      setFormDraftKey(formKey);
      setSupplierId(Number(id));
      fetchSupplier(id, formKey);
    } else {
      let draftId = sessionStorage.getItem('new_supplier_draft_id');
      if (!draftId) {
        draftId = `tmp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
        sessionStorage.setItem('new_supplier_draft_id', draftId);
      }
      const formKey = `supplier_form_draft_new_${draftId}`;
      setFormDraftKey(formKey);

      try {
        const storedForm = JSON.parse(localStorage.getItem(formKey) || 'null');
        if (storedForm) setFormData(prev => ({ ...prev, ...storedForm }));
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  // ── Handle returning from the embedded bank-details form ───────────────
  // BankDetailsForm now saves bank accounts itself (via /bank-detail) and
  // hands back the list of accounts it just created/updated so we can merge
  // them into local state for display — we don't re-save them here.
  useEffect(() => {
    const state = location.state as {
      bankAccountsUpdated?: boolean;
      updatedAccounts?: any[];
    } | undefined;

    if (state?.bankAccountsUpdated) {
      if (Array.isArray(state.updatedAccounts) && state.updatedAccounts.length > 0) {
        setBankAccounts(prev => {
          const merged = [...prev];
          state.updatedAccounts!.forEach(row => {
            const mapped = mapBankAccountRow(row);
            const existingIdx = mapped.recordId != null
              ? merged.findIndex(a => a.recordId === mapped.recordId)
              : -1;
            if (existingIdx >= 0) {
              merged[existingIdx] = mapped;
            } else {
              merged.push(mapped);
            }
          });
          return merged;
        });
      }

      const targetId = String(supplierId || id || '');
      if (targetId && targetId !== 'undefined' && targetId !== 'new') {
        refreshBankAccounts(targetId);
      }

      // Clear the flag so navigating away and back doesn't re-trigger it.
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const fetchSupplier = async (supplierIdParam: string, formKey?: string) => {
    setFetching(true);
    setApiError(null);
    try {
      const response = await api.get(`/supplier/${supplierIdParam}?_=${Date.now()}`);
      if (response.data && response.data.success === 1) {
        const data = response.data.data;
        setSupplierId(data.id || null);

        const hasDedicatedAddressFields = !!(
          data.address_line1 || data.city || data.state || data.pincode
        );
        const addressFallback = hasDedicatedAddressFields
          ? null
          : parsePrimaryAddress(data.primary_address || data.address || '');

        setFormData({
          supplierName: data.supplier_name || data.name || '',
          supplierType: data.supplier_type || 'Company',
          supplierGroup: data.supplier_group || '',
          country: data.country || addressFallback?.country || 'India',
          defaultCurrency: data.default_currency || 'INR',
          language: data.language || 'en',
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          emailId: data.email_id || data.email || '',
          mobileNo: data.mobile_no || data.phone || '',
          addressLine1: data.address_line1 || addressFallback?.addressLine1 || '',
          addressLine2: data.address_line2 || addressFallback?.addressLine2 || '',
          city: data.city || addressFallback?.city || '',
          state: data.state || addressFallback?.state || '',
          pincode: data.pincode || addressFallback?.pincode || '',
          taxId: data.tax_id || '',
          taxCategory: data.tax_category || 'Registered Regular',
          paymentTerms: data.payment_terms || '30 Days',
          defaultPriceList: data.default_price_list || 'Standard Buying',
          website: data.website || '',
          supplierDetails: data.supplier_details || '',
          isTransporter: data.is_transporter === 1 || data.is_transporter === true,
          isInternalSupplier: data.is_internal_supplier === 1 || data.is_internal_supplier === true,
          onHold: data.on_hold === 1 || data.on_hold === true,
          status: data.disabled === 1 ? 'Inactive' : 'Active'
        });


        if (formKey) {
          try {
            const storedForm = JSON.parse(localStorage.getItem(formKey) || 'null');
            if (storedForm) setFormData(prev => ({ ...prev, ...storedForm }));
          } catch {
            /* ignore */
          }
        }

        setBankAccountsFromApiRows(data.bank_details);
      } else {
        setApiError(response.data?.message || 'Failed to fetch supplier details');
      }
    } catch (err: any) {
      console.error('Error fetching supplier:', err);
      setApiError(err.response?.data?.message || 'Failed to fetch supplier details');
    } finally {
      setFetching(false);
    }
  };


  const refreshBankAccounts = async (supplierIdParam: string) => {
    try {
      const response = await api.get(`/supplier/${supplierIdParam}?_=${Date.now()}`);
      if (response.data && response.data.success === 1) {
        setBankAccountsFromApiRows(response.data.data.bank_details);
      }
    } catch (err) {
      console.error('Error refreshing bank accounts:', err);
    }
  };

  const setBankAccountsFromApiRows = (bankDetails: any) => {
    const list = Array.isArray(bankDetails) ? bankDetails : [];
    setBankAccounts(list.map(mapBankAccountRow));
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];
    if (!formData.supplierName.trim()) {
      allErrors.push({ field: 'supplierName', label: 'Supplier Name', message: 'Supplier name is required' });
    }
    if (!formData.emailId.trim()) {
      allErrors.push({ field: 'emailId', label: 'Email ID', message: 'Email ID is required' });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId)) {
      allErrors.push({ field: 'emailId', label: 'Email ID', message: 'Please enter a valid email address' });
    }
    if (!formData.mobileNo.trim()) {
      allErrors.push({ field: 'mobileNo', label: 'Mobile Number', message: 'Mobile number is required' });
    }
    if (!formData.addressLine1.trim()) {
      allErrors.push({ field: 'addressLine1', label: 'Address Line 1', message: 'Address line 1 is required' });
    }
    if (!formData.city.trim()) {
      allErrors.push({ field: 'city', label: 'City', message: 'City is required' });
    }
    if (!formData.state.trim()) {
      allErrors.push({ field: 'state', label: 'State', message: 'State is required' });
    }
    if (!formData.pincode.trim()) {
      allErrors.push({ field: 'pincode', label: 'Pincode', message: 'Pincode is required' });
    }
    return allErrors;
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, pincode: value }));
    setIsDirty(true);

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
    setIsDirty(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setIsDirty(true);

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const persistFormDraft = () => {
    if (formDraftKey) {
      try {
        localStorage.setItem(formDraftKey, JSON.stringify(formData));
      } catch {
        /* ignore quota errors etc. */
      }
    }
  };


  const buildSupplierPayload = (includeId: boolean) => {
    const primaryAddress = [
      formData.addressLine1,
      formData.addressLine2,
      formData.city,
      formData.state,
      formData.pincode,
      formData.country
    ].filter(Boolean).join(', ');

    const payload: any = {
      ...(includeId && supplierId !== null ? { id: supplierId } : {}),
      name: formData.supplierName,
      naming_series: 'SUP-.YYYY.-',
      supplier_type: formData.supplierType,
      supplier_name: formData.supplierName,
      gender: null,
      supplier_group: formData.supplierGroup || '',
      country: formData.country,
      is_transporter: formData.isTransporter ? 1 : 0,
      image: '',
      default_currency: formData.defaultCurrency,
      default_bank_account: '',
      default_price_list: formData.defaultPriceList,
      supplier_details: formData.supplierDetails || '',
      website: formData.website || '',
      language: formData.language,
      supplier_primary_address: null,
      primary_address: primaryAddress,
      supplier_primary_contact: null,
      mobile_no: formData.mobileNo,
      email_id: formData.emailId,
      tax_id: formData.taxId || '',
      tax_category: formData.taxCategory,
      tax_withholding_category: null,
      tax_withholding_group: null,
      payment_terms: formData.paymentTerms,
      is_internal_supplier: formData.isInternalSupplier ? 1 : 0,
      represents_company: null,
      allow_purchase_invoice_creation_without_purchase_order: 0,
      allow_purchase_invoice_creation_without_purchase_receipt: 0,
      disabled: formData.status === 'Inactive' ? 1 : 0,
      is_frozen: 0,
      warn_rfqs: 0,
      prevent_rfqs: 0,
      warn_pos: 0,
      prevent_pos: 0,
      on_hold: formData.onHold ? 1 : 0,
      hold_type: null,
      release_date: null,
    };

    return payload;
  };

  const ensureSupplierIsSaved = async (): Promise<number | null> => {
    if (supplierId) return supplierId;

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      toast.error('Please fill in the required supplier fields before adding a bank account.');
      return null;
    }

    setCreatingSupplier(true);
    setApiError(null);
    try {
      const payload = buildSupplierPayload(false);
      const response = await api.post('/supplier', payload);

      if (response.data && response.data.success === 1) {

        const newId: number | string | null =
          response.data?.data?.insertId ??
          response.data?.data?.id ??
          response.data?.id ??
          null;

        if (!newId) {
          console.error('Could not resolve new supplier id from response:', response.data);
          toast.error('Supplier saved, but its id could not be resolved. Please refresh and try again.');
          return null;
        }

        setSupplierId(Number(newId));
        if (formDraftKey) localStorage.removeItem(formDraftKey);
        if (!isEditMode) sessionStorage.removeItem('new_supplier_draft_id');


        navigate(`/supplier/${newId}`, { replace: true });
        toast.success('Supplier created. Now add the bank account.');
        return Number(newId);
      }

      toast.error(response.data?.message || 'Failed to create supplier');
      return null;
    } catch (error: any) {
      console.error('Error auto-creating supplier:', error);
      if (error.response) {
        toast.error(error.response.data?.message || 'Failed to create supplier');
      } else if (error.request) {
        toast.error('Network error - No response from server');
      } else {
        toast.error(error.message || 'Failed to create supplier');
      }
      return null;
    } finally {
      setCreatingSupplier(false);
    }
  };

  const handleAddBankDetails = async (editIndex?: number) => {
    persistFormDraft();

    const sId = await ensureSupplierIsSaved();
    if (!sId) return;

    const account = typeof editIndex === 'number' ? bankAccounts[editIndex] : undefined;

    navigate('/bank-details', {
      state: {
        embedContext: {
          returnPath: `/supplier/${sId}`,
          partyType: 'Supplier',
          partyId: String(sId),
          companyId: getDefaultCompanyId(),
          supplierName: formData.supplierName,
          editIndex,
          prefill: account,
        },
      },
    });
  };

  const handleRemoveBankAccount = async (idx: number) => {
    const acc = bankAccounts[idx];
    if (!acc?.recordId) return;

    const confirmed = window.confirm('Remove this bank account? This cannot be undone.');
    if (!confirmed) return;

    try {
      await api.delete(`/bank-detail/${acc.docName || acc.recordId}`);
      toast.success('Bank account removed');
      setBankAccounts(prev => prev.filter((_, i) => i !== idx));
    } catch (err) {
      console.error('Error removing bank account:', err);
      toast.error('Failed to remove bank account');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      
      const payload = buildSupplierPayload(!!supplierId);

      let response;
      if (supplierId) {
        response = await api.put('/supplier', payload);
      } else {
        response = await api.post('/supplier', payload);
      }

      if (response.data && response.data.success === 1) {
        if (formDraftKey) localStorage.removeItem(formDraftKey);
        if (!isEditMode) sessionStorage.removeItem('new_supplier_draft_id');

        toast.success(response.data.message || (supplierId ? 'Supplier updated successfully!' : 'Supplier created successfully!'));
        setTimeout(() => navigate('/supplier'), 500);
      } else {
        setApiError(response.data?.message || (supplierId ? 'Failed to update supplier' : 'Failed to create supplier'));
      }
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      if (error.response) {
        if (error.response.status === 409) {
          setApiError('Supplier already exists.');
        } else if (error.response.status === 422) {
          const errs = error.response.data?.errors || {};
          Object.keys(errs).forEach(key => setErrors(prev => ({ ...prev, [key]: errs[key] })));
          setApiError('Please fix the validation errors.');
        } else {
          setApiError(error.response.data?.message || 'Failed to save supplier');
        }
      } else if (error.request) {
        setApiError('Network error - No response from server');
      } else {
        setApiError(error.message || 'Failed to save supplier');
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/supplier');

  const hasErrors = getAllValidationErrors().length > 0;
  const title = isNew ? '' : `Edit: ${formData.supplierName || 'Supplier'}`;

  if (fetching) {
    return (
      <div className={`as-page ${theme}`}>
        <div className="as-loading">
          <FaSpinner className="spinning" size={32} />
          <p>Loading supplier details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`as-page ${theme}`}>
      <div className="as-inner">

        {/* Validation Summary Modal */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FaExclamationTriangle /> Missing Required Fields</h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">Please fill in the following required fields before submitting:</p>
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
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* API Error Display */}
        {apiError && (
          <div className="as-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="as-header">
          <button onClick={handleCancel} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          {!isNew && (
            <div className="header-title">
              <h1>{title}</h1>
            </div>
          )}
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="as-card">

            {/* Basic Information */}
            <span className="as-section-title">
              <FaBuilding className="section-icon" /> Basic Information
            </span>

            <div className="as-grid-2">
              <div className="as-field">
                <label className="as-label">
                  <FaBuilding className="label-icon" /> Supplier Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="supplierName"
                  value={formData.supplierName}
                  onChange={handleInputChange}
                  className={`form-field${errors.supplierName ? ' field-error' : ''}`}
                  placeholder="Enter supplier name"
                  disabled={isSubmitting}
                />
                {errors.supplierName && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.supplierName}</span>}
              </div>

              <div className="as-field">
                <label className="as-label">Supplier Type</label>
                <select
                  name="supplierType"
                  value={formData.supplierType}
                  onChange={handleInputChange}
                  className="form-field"
                  disabled={isSubmitting}
                >
                  {supplierTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="as-field">
                <label className="as-label"><FaFolder className="label-icon" />Supplier Group</label>
                <select
                  name="supplierGroup"
                  value={formData.supplierGroup}
                  onChange={handleInputChange}
                  className="form-field"
                  disabled={isSubmitting}
                >
                  <option value="">Select Group</option>
                  {supplierGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>

              <div className="as-field">
                <label className="as-label"><FaGlobeIcon className="label-icon" />Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="form-field"
                  disabled={isSubmitting}
                >
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="as-divider" />

            {/* Contact Details */}
            <span className="as-section-title">
              <FaUser className="section-icon" /> Contact Details
            </span>

            <div className="as-grid-2">
              <div className="as-field">
                <label className="as-label"><FaUser className="label-icon" />First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-field"
                  placeholder="Enter first name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="as-field">
                <label className="as-label">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-field"
                  placeholder="Enter last name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="as-field">
                <label className="as-label"><FaEnvelope className="label-icon" />Email ID <span className="required">*</span></label>
                <input
                  type="email"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleInputChange}
                  className={`form-field${errors.emailId ? ' field-error' : ''}`}
                  placeholder="Enter email address"
                  disabled={isSubmitting}
                />
                {errors.emailId && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.emailId}</span>}
              </div>

              <div className="as-field">
                <label className="as-label"><FaPhone className="label-icon" />Mobile Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={formData.mobileNo}
                  onChange={handleInputChange}
                  className={`form-field${errors.mobileNo ? ' field-error' : ''}`}
                  placeholder="Enter mobile number"
                  disabled={isSubmitting}
                />
                {errors.mobileNo && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.mobileNo}</span>}
              </div>
            </div>

            <div className="as-divider" />

            {/* Address Details */}
            <span className="as-section-title">
              <FaMapMarkerAlt className="section-icon" /> Address Details
            </span>

            <div className="as-grid-2">
              <div className="as-field as-full-width">
                <label className="as-label">Address Line 1 <span className="required">*</span></label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  className={`form-field${errors.addressLine1 ? ' field-error' : ''}`}
                  placeholder="Enter address line 1"
                  disabled={isSubmitting}
                />
                {errors.addressLine1 && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.addressLine1}</span>}
              </div>

              <div className="as-field as-full-width">
                <label className="as-label">Address Line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="form-field"
                  placeholder="Enter address line 2 (optional)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="as-field">
                <label className="as-label">City/Town <span className="required">*</span></label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`form-field${errors.city ? ' field-error' : ''}`}
                  placeholder="Enter city"
                  disabled={isSubmitting}
                />
                {errors.city && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.city}</span>}
              </div>

              <div className="as-field">
                <label className="as-label">State/Province <span className="required">*</span></label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`form-field${errors.state ? ' field-error' : ''}`}
                  placeholder="Enter state"
                  disabled={isSubmitting}
                />
                {errors.state && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.state}</span>}
              </div>

              <div className="as-field">
                <label className="as-label">Postal Code <span className="required">*</span></label>
                <div className="suggestions-container">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    className={`form-field${errors.pincode ? ' field-error' : ''}`}
                    placeholder="Enter postal code"
                    disabled={isSubmitting}
                  />
                  {showPincodeSuggestions && (
                    <div className="suggestions-list">
                      {pincodeSuggestions.map(p => (
                        <div key={p} className="suggestion-item" onClick={() => selectPincode(p)}>
                          <span>{p}</span>
                          {pincodeData[p] && (
                            <span className="suggestion-detail">{pincodeData[p].city}, {pincodeData[p].state}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.pincode && <span className="as-error-msg"><FaExclamationCircle size={10} />{errors.pincode}</span>}
                <p className="as-field-hint">
                  <FaInfoCircle className="hint-icon" />
                  Change the Postal Code to autofill other addresses.
                </p>
              </div>
            </div>

            <div className="as-divider" />

            {/* Tax & Financial Details */}
            <span className="as-section-title">
              <FaTag className="section-icon" /> Tax & Financial Details
            </span>

            <div className="as-grid-2">
              <div className="as-field">
                <label className="as-label">Tax ID / GSTIN</label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className="form-field"
                  placeholder="Enter tax ID"
                  disabled={isSubmitting}
                />
              </div>

              <div className="as-field">
                <label className="as-label">Tax Category</label>
                <select
                  name="taxCategory"
                  value={formData.taxCategory}
                  onChange={handleInputChange}
                  className="form-field"
                  disabled={isSubmitting}
                >
                  {taxCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="as-field">
                <label className="as-label">Default Price List</label>
                <select
                  name="defaultPriceList"
                  value={formData.defaultPriceList}
                  onChange={handleInputChange}
                  className="form-field"
                  disabled={isSubmitting}
                >
                  {priceLists.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                </select>
              </div>

              {/* ── Bank Accounts ── */}
              <div className="as-field as-full-width">
                <label className="as-label"><FaUniversity className="label-icon" />Bank Accounts</label>

                {bankAccounts.length === 0 ? (
                  <p className="as-field-hint">
                    <FaInfoCircle className="hint-icon" />
                    No bank accounts added yet.
                  </p>
                ) : (
                  <div className="as-bank-accounts-list">
                    {bankAccounts.map((acc, idx) => (
                      <div
                        key={acc._key || idx}
                        className="as-bank-account-card"
                        onClick={() => handleAddBankDetails(idx)}
                      >
                        <div className="as-bank-account-icon">
                          <FaUniversity size={15} />
                        </div>
                        <div className="as-bank-account-info">
                          <div className="as-bank-account-top">
                            <strong className="as-bank-account-name">{acc.bank_name || 'Bank account'}</strong>
                            <div className="as-bank-account-badges">
                              {acc.is_primary && (
                                <span className="as-bank-badge as-bank-badge-primary">Primary</span>
                              )}
                              {acc.verified && (
                                <span className="as-bank-badge as-bank-badge-verified">
                                  <FaCheckCircle size={9} /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="as-bank-account-details">
                            {acc.account_holder_name && <span>{acc.account_holder_name}</span>}
                            {acc.account_number && (
                              <span>•••• {String(acc.account_number).slice(-4)}</span>
                            )}
                            {acc.branch_name && <span>{acc.branch_name}</span>}
                            {acc.ifsc_code && <span>{acc.ifsc_code}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="as-bank-remove-btn"
                          onClick={(e) => { e.stopPropagation(); handleRemoveBankAccount(idx); }}
                          title="Remove"
                        >
                          <FaTimesCircle size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="as-add-bank-btn"
                  onClick={() => handleAddBankDetails()}
                  disabled={isSubmitting || creatingSupplier}
                >
                  {creatingSupplier ? <FaSpinner className="spinning" size={11} /> : <FaPlus size={11} />}
                  {creatingSupplier
                    ? 'Saving supplier…'
                    : bankAccounts.length > 0
                    ? 'Add Another Bank Account'
                    : 'Add Bank Details'}
                </button>
                <p className="as-field-hint">
                  <FaInfoCircle className="hint-icon" />
                  {supplierId
                    ? 'Bank accounts are saved immediately as you add them.'
                    : 'The supplier will be saved first (so the bank account can be linked to it), then the bank details form will open.'}
                </p>
              </div>
            </div>

            <div className="as-divider" />

            {/* Additional Information */}
            <span className="as-section-title">
              <FaInfoCircle className="section-icon" /> Additional Information
            </span>

            <div className="as-grid-2">
              <div className="as-field">
                <label className="as-label">Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="form-field"
                  placeholder="https://www.example.com"
                  disabled={isSubmitting}
                />
              </div>

              {isEditMode && (
                <div className="as-field">
                  <label className="as-label">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="form-field"
                    disabled={isSubmitting}
                  >
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="as-field as-full-width">
                <label className="as-label">Supplier Details</label>
                <textarea
                  name="supplierDetails"
                  value={formData.supplierDetails}
                  onChange={handleInputChange}
                  className="form-field as-textarea"
                  placeholder="Additional notes about the supplier..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Checkboxes */}
              <div className="as-checkboxes-row">
                <div className="checkbox-field">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="isTransporter"
                      checked={formData.isTransporter}
                      onChange={handleInputChange}
                      id="isTransporter"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="isTransporter">Is Transporter</label>
                  </div>
                </div>

                <div className="checkbox-field">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="isInternalSupplier"
                      checked={formData.isInternalSupplier}
                      onChange={handleInputChange}
                      id="isInternalSupplier"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="isInternalSupplier">Internal Supplier</label>
                  </div>
                </div>

                <div className="checkbox-field">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      name="onHold"
                      checked={formData.onHold}
                      onChange={handleInputChange}
                      id="onHold"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="onHold">On Hold</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="as-footer">
            <button type="button" onClick={handleCancel} className="cancel-btn" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {supplierId ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}