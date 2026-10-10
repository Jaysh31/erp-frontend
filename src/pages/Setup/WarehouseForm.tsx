import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaBuilding,
  FaBoxes,
  FaUsers,
  FaUserTie,
  FaChevronDown,
  FaChevronRight,
  FaPlus,
  FaCheckSquare,
  FaHome,
  FaPhone,
  FaMobileAlt,
  FaMapMarkerAlt,
  FaCity,
  FaGlobe,
  FaMapPin,
  FaTruck,
  FaEnvelope,
  FaTimes,
  FaUser,
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaEye,
} from 'react-icons/fa';
import "./WarehouseForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from "react-hot-toast";

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

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

// ===== 🆕 FULL-SCREEN LOADER OVERLAY =====
interface LoaderOverlayProps {
  isOpen: boolean;
  message?: string;
  subtitle?: string;
}

const LoaderOverlay: React.FC<LoaderOverlayProps> = ({
  isOpen,
  message = 'Please wait...',
  subtitle,
}) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="wf-loader-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20000,
        padding: '20px',
      }}
    >
      <div
        className="wf-loader-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '32px 40px',
          minWidth: '280px',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
        }}
      >
        <div
          className="wf-loader-spinner"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            animation: 'wfSpin 0.9s linear infinite',
          }}
        />
        <div
          className="wf-loader-message"
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
          }}
        >
          {message}
        </div>
        {subtitle && (
          <div
            className="wf-loader-subtitle"
            style={{
              fontSize: '13px',
              color: '#6b7280',
              marginTop: '-8px',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      <style>{`
        @keyframes wfSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default function WarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [searchParams] = useSearchParams();
  
  const isViewMode = searchParams.get('mode') === 'view';
  const isNew = id === "new" || !id;
  const isEditMode = !isNew && !isViewMode;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    warehouseName: "",
    company: "",
    isRejectedWarehouse: false,
    parentWarehouse: "",
    isGroupWarehouse: false,
    account: "",
    customer: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    pin: "",
    phoneNo: "",
    mobileNo: "",
    warehouseType: "",
    transit: false,
    emailId: "",
  });

  const [isContactInfoExpanded, setIsContactInfoExpanded] = useState(true);
  const [isTransitExpanded, setIsTransitExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  // 🆕 Global loader state
  const [loaderAction, setLoaderAction] = useState<'warehouse' | 'contact' | 'delete' | null>(null);

  // ─── Contact related states ──────────────────────────────────────────
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactIndex, setEditingContactIndex] = useState<number | null>(null);
  const [contactFormData, setContactFormData] = useState<any>({
    fullName: "",
    email: "",
    mobile: "",
    address: "",
    city: "",
    country: "",
    pincode: "",
    status: "Active",
  });
  const [contactErrors, setContactErrors] = useState<{ [key: string]: string }>({});
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");

  // ─── Toast helper function ──────────────────────────────────────────
  const showToastInfo = (message: string) => {
    toast.custom(() => (
      <div
        style={{
          background: '#3b82f6',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <FaInfoCircle size={16} />
        {message}
      </div>
    ), { duration: 3000 });
  };

  // ─── 🆕 Fetch contacts (silently handle 404) ────────────────────────
  const fetchContacts = async () => {
    try {
      const response = await api.get('/contact');
      if (response.data && response.data.success === 1) {
        setContacts(response.data.data || []);
      } else {
        setContacts([]);
      }
    } catch (err: any) {
      // 🆕 If 404, the endpoint doesn't exist – just use empty list,
      // don't spam the console with an error.
      if (err?.response?.status === 404) {
        console.warn('Contacts endpoint not found (404). Using empty list.');
        setContacts([]);
      } else {
        console.error('Error fetching contacts:', err);
        setContacts([]);
      }
    }
  };

  // ─── Fetch warehouse contacts ────────────────────────────────────────
  const fetchWarehouseContacts = async () => {
    if (!warehouseId) return;
    try {
      const response = await api.get(`/warehouse/${warehouseId}/contacts`);
      if (response.data && response.data.success === 1) {
        setSelectedContacts(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching warehouse contacts:', err);
    }
  };

  // Fetch warehouse data if editing
  useEffect(() => {
    const fetchWarehouseData = async () => {
      if (!isNew && id) {
        setLoading(true);
        try {
          const response = await api.get(`/warehouse/${id}`);
          if (response.data && response.data.success === 1) {
            const data = response.data.data;
            setWarehouseId(data.id);
            setForm({
              warehouseName: data.warehouse_name || "",
              company: data.company || "",
              isRejectedWarehouse: data.is_rejected_warehouse === 1,
              parentWarehouse: data.parent_warehouse || "",
              isGroupWarehouse: data.is_group === 1,
              account: data.account || "",
              customer: data.customer || "",
              addressLine1: data.address_line_1 || "",
              addressLine2: data.address_line_2 || "",
              city: data.city || "",
              stateProvince: data.state || "",
              pin: data.pin || "",
              phoneNo: data.phone_no || "",
              mobileNo: data.mobile_no || "",
              warehouseType: data.warehouse_type || "",
              transit: data.default_in_transit_warehouse === "1",
              emailId: data.email_id || "",
            });
            if (data.id) {
              await fetchWarehouseContacts();
            }
          } else {
            toast.error('Failed to load warehouse data');
          }
        } catch (err: any) {
          console.error('Error fetching warehouse:', err);
          toast.error(err.response?.data?.message || 'Failed to load warehouse data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchContacts();
    fetchWarehouseData();
  }, [isNew, id]);

  // ─── Contact CRUD Operations ─────────────────────────────────────────

  const openContactModal = (index?: number) => {
    if (isViewMode) {
      showToastInfo('Cannot edit in view mode');
      return;
    }
    
    if (index !== undefined && selectedContacts[index]) {
      const contact = selectedContacts[index];
      setEditingContactIndex(index);
      setContactFormData({
        fullName: contact.fullName || "",
        email: contact.email || "",
        mobile: contact.mobile || "",
        address: contact.address || "",
        city: contact.city || "",
        country: contact.country || "",
        pincode: contact.pincode || "",
        status: contact.status || "Active",
      });
    } else {
      setEditingContactIndex(null);
      setContactFormData({
        fullName: "",
        email: "",
        mobile: "",
        address: "",
        city: "",
        country: "",
        pincode: "",
        status: "Active",
      });
    }
    setContactErrors({});
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setEditingContactIndex(null);
    setContactFormData({
      fullName: "",
      email: "",
      mobile: "",
      address: "",
      city: "",
      country: "",
      pincode: "",
      status: "Active",
    });
    setContactErrors({});
  };

  const validateContactForm = (): boolean => {
    const errors: { [key: string]: string } = {};
    
    if (!contactFormData.fullName?.trim()) {
      errors.fullName = 'Contact name is required';
    }
    
    if (contactFormData.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(contactFormData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (contactFormData.mobile && !/^\d{10}$/.test(contactFormData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Mobile number must be exactly 10 digits';
    }
    
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save contact locally (for new warehouses)
  const handleSaveContactLocal = () => {
    if (isViewMode) {
      showToastInfo('Cannot edit in view mode');
      return;
    }
    
    if (!validateContactForm()) {
      return;
    }

    const newContact: Contact = {
      id: `temp-${Date.now()}`,
      contactCode: `CONT-TEMP-${Date.now()}`,
      fullName: contactFormData.fullName || "",
      firstName: contactFormData.fullName?.split(' ')[0] || "",
      lastName: contactFormData.fullName?.split(' ').slice(1).join(' ') || "",
      email: contactFormData.email || "",
      phone: "",
      mobile: contactFormData.mobile || "",
      status: (contactFormData.status as 'Active' | 'Passive' | 'Suspended') || "Active",
      address: contactFormData.address || "",
      city: contactFormData.city || "",
      state: "",
      country: contactFormData.country || "",
      pincode: contactFormData.pincode || "",
      designation: "",
      department: "",
      supplierId: "",
      supplierName: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingContactIndex !== null) {
      const updatedContacts = [...selectedContacts];
      updatedContacts[editingContactIndex] = { ...updatedContacts[editingContactIndex], ...newContact };
      setSelectedContacts(updatedContacts);
      toast.success('Contact updated successfully!');
    } else {
      setSelectedContacts([...selectedContacts, newContact]);
      toast.success('Contact added successfully!');
    }
    closeContactModal();
  };

  // Save contact to API (for existing warehouses)
  const handleSaveContactAPI = async () => {
    if (isViewMode) {
      showToastInfo('Cannot edit in view mode');
      return;
    }
    
    if (!warehouseId) {
      toast.error('Please save the warehouse first');
      return;
    }

    if (!validateContactForm()) {
      return;
    }

    setIsContactSubmitting(true);
    setLoaderAction('contact');
    try {
      const contactData = {
        fullName: contactFormData.fullName || "",
        email: contactFormData.email || "",
        mobile: contactFormData.mobile || "",
        address: contactFormData.address || "",
        city: contactFormData.city || "",
        country: contactFormData.country || "",
        pincode: contactFormData.pincode || "",
        status: contactFormData.status || "Active",
        warehouse_id: warehouseId,
      };

      let response;
      if (editingContactIndex !== null && selectedContacts[editingContactIndex]?.id && !selectedContacts[editingContactIndex].id.startsWith('temp-')) {
        const contactId = selectedContacts[editingContactIndex].id;
        response = await api.put(`/warehouse/${warehouseId}/contacts/${contactId}`, contactData);
      } else {
        response = await api.post(`/warehouse/${warehouseId}/contacts`, contactData);
      }

      if (response.data && response.data.success === 1) {
        toast.success(editingContactIndex !== null ? 'Contact updated successfully!' : 'Contact added successfully!');
        await fetchWarehouseContacts();
        closeContactModal();
      } else {
        toast.error(response.data?.message || 'Failed to save contact');
      }
    } catch (err: any) {
      console.error('Error saving contact:', err);
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setIsContactSubmitting(false);
      setLoaderAction(null);
    }
  };

  const handleSaveContact = () => {
    if (isNew) {
      handleSaveContactLocal();
    } else {
      handleSaveContactAPI();
    }
  };

  const handleDeleteContact = (index: number) => {
    if (isViewMode) {
      showToastInfo('Cannot delete in view mode');
      return;
    }
    
    if (isNew) {
      const updatedContacts = selectedContacts.filter((_, i) => i !== index);
      setSelectedContacts(updatedContacts);
      toast.success('Contact removed successfully!');
    } else {
      if (!selectedContacts[index]?.id || selectedContacts[index].id.startsWith('temp-')) {
        const updatedContacts = selectedContacts.filter((_, i) => i !== index);
        setSelectedContacts(updatedContacts);
        toast.success('Contact removed successfully!');
        return;
      }
      
      if (window.confirm('Are you sure you want to delete this contact?')) {
        setLoaderAction('delete');
        try {
          api.delete(`/warehouse/${warehouseId}/contacts/${selectedContacts[index].id}`).then(response => {
            if (response.data && response.data.success === 1) {
              toast.success('Contact deleted successfully!');
              fetchWarehouseContacts();
            } else {
              toast.error(response.data?.message || 'Failed to delete contact');
            }
          }).catch(err => {
            console.error('Error deleting contact:', err);
            toast.error('Failed to delete contact');
          }).finally(() => {
            setLoaderAction(null);
          });
        } catch (err) {
          console.error('Error deleting contact:', err);
          toast.error('Failed to delete contact');
          setLoaderAction(null);
        }
      }
    }
  };

  // ─── Add existing contact to warehouse ──────────────────────────────
  const handleAddExistingContact = (contact: Contact) => {
    if (isViewMode) {
      showToastInfo('Cannot add contacts in view mode');
      return;
    }
    
    if (selectedContacts.some(c => c.id === contact.id)) {
      toast.error('This contact is already added to the warehouse');
      return;
    }
    setSelectedContacts([...selectedContacts, contact]);
    setShowContactSearch(false);
    setContactSearchTerm("");
    toast.success('Contact added successfully!');
  };


  // ─── Validation Functions ──────────────────────────────────────────────

  const isValidAlphabetOnly = (value: string): boolean => {
    return /^[A-Za-z\s]*$/.test(value);
  };

  const isValidState = (value: string): boolean => {
    return /^[A-Za-z\s.]*$/.test(value);
  };

  const isValidPhone = (value: string): boolean => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10 || (digitsOnly.length >= 10 && digitsOnly.length <= 13);
  };

  const isValidEmail = (value: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  };

  const isValidPin = (value: string): boolean => {
    return /^\d{6}$/.test(value);
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (isNew && !form.warehouseName.trim()) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name is required' });
    }
    if (isNew && form.warehouseName.trim() && !isValidAlphabetOnly(form.warehouseName.trim())) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name should contain only alphabets and spaces' });
    }

    if (!form.company.trim()) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company is required' });
    }
    if (form.company.trim() && !isValidAlphabetOnly(form.company.trim())) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company should contain only alphabets and spaces' });
    }

    if (form.parentWarehouse.trim() && !isValidAlphabetOnly(form.parentWarehouse.trim())) {
      allErrors.push({ field: 'parentWarehouse', label: 'Parent Warehouse', message: 'Parent warehouse should contain only alphabets and spaces' });
    }

    if (form.phoneNo.trim() && !isValidPhone(form.phoneNo.trim())) {
      allErrors.push({ field: 'phoneNo', label: 'Phone No', message: 'Phone number must be 10 digits (with or without country code)' });
    }

    if (form.mobileNo.trim() && !isValidPhone(form.mobileNo.trim())) {
      allErrors.push({ field: 'mobileNo', label: 'Mobile No', message: 'Mobile number must be 10 digits (with or without country code)' });
    }

    if (form.emailId.trim() && !isValidEmail(form.emailId.trim())) {
      allErrors.push({ field: 'emailId', label: 'Email ID', message: 'Please enter a valid email address' });
    }

    if (form.pin.trim() && !isValidPin(form.pin.trim())) {
      allErrors.push({ field: 'pin', label: 'PIN', message: 'PIN code must be exactly 6 digits' });
    }

    if (form.city.trim() && !isValidAlphabetOnly(form.city.trim())) {
      allErrors.push({ field: 'city', label: 'City', message: 'City should contain only alphabets and spaces' });
    }

    if (form.stateProvince.trim() && !isValidState(form.stateProvince.trim())) {
      allErrors.push({ field: 'stateProvince', label: 'State/Province', message: 'State should contain only alphabets, spaces and dots' });
    }

    if (form.warehouseType.trim() && !isValidAlphabetOnly(form.warehouseType.trim())) {
      allErrors.push({ field: 'warehouseType', label: 'Warehouse Type', message: 'Warehouse type should contain only alphabets and spaces' });
    }

    return allErrors;
  };

  // ─── 🆕 handleSave with cleaned payload ──────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isViewMode) {
      navigate('/warehouse');
      return;
    }

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    setLoaderAction('warehouse');
    setErrors({});

    try {
      // 🆕 Build payload, then strip out empty fields so the backend
      //    doesn't receive null / empty strings that could break SQL.
      const rawPayload: any = {
        warehouse_name: form.warehouseName.trim(),
        company: form.company.trim() || null,
        parent_warehouse: form.parentWarehouse.trim() || null,
        warehouse_type: form.warehouseType.trim() || null,
        city: form.city.trim() || null,
        state: form.stateProvince.trim() || null,
        phone_no: form.phoneNo.trim() || null,
        mobile_no: form.mobileNo.trim() || null,
        email_id: form.emailId.trim() || null,
        address_line_1: form.addressLine1.trim() || null,
        address_line_2: form.addressLine2.trim() || null,
        pin: form.pin.trim() || null,
        account: form.account.trim() || null,
        customer: form.customer.trim() || null,
        is_rejected_warehouse: form.isRejectedWarehouse ? 1 : 0,
        is_group: form.isGroupWarehouse ? 1 : 0,
        default_in_transit_warehouse: form.transit ? 1 : 0,
      };

      if (!isNew && warehouseId) {
        rawPayload.id = warehouseId;
      }

      // 🆕 Remove keys whose value is null, undefined, or empty string
      const payload: any = {};
      Object.keys(rawPayload).forEach((key) => {
        const val = rawPayload[key];
        if (val !== null && val !== undefined && val !== '') {
          payload[key] = val;
        }
      });

      // Contacts (as before)
      if (isNew) {
        payload.contacts = selectedContacts.map(c => ({
          fullName: c.fullName,
          email: c.email,
          mobile: c.mobile,
          address: c.address,
          city: c.city,
          country: c.country,
          pincode: c.pincode,
          status: c.status || 'Active',
        }));
      } else {
        payload.contact_ids = selectedContacts.map(c => c.id);
      }

      let response;
      if (isNew) {
        response = await api.post('/warehouse', payload);
      } else {
        response = await api.put('/warehouse', payload);
      }

      if (response.data && response.data.success === 1) {
        toast.success(isNew ? 'Warehouse created successfully!' : 'Warehouse updated successfully!');
        navigate('/warehouse');
      } else {
        const errMsg = response.data?.message || 'Failed to save warehouse';
        toast.error(errMsg);
        setErrors({ submit: errMsg });
      }
    } catch (err: any) {
      console.error('Error saving warehouse:', err);

      let msg = 'Failed to save warehouse';
      if (err.response) {
        msg = err.response.data?.message || msg;
        if (err.response.status === 409) {
          msg = 'A warehouse with this name already exists';
          setErrors({ warehouseName: msg });
        } else {
          setErrors({ submit: msg });
        }
      } else if (err.request) {
        msg = 'Network error. Please check your connection.';
        setErrors({ submit: msg });
      } else {
        msg = 'An unexpected error occurred. Please try again.';
        setErrors({ submit: msg });
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
      setLoaderAction(null);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => err.field === fieldName);
  };

  const getFieldError = (fieldName: string): string => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.contactCode.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

  const navigateToEdit = () => {
    navigate(`/warehouse/${id}`);
  };

  const loaderMessage =
    loaderAction === 'warehouse'
      ? isNew
        ? 'Creating Warehouse...'
        : 'Updating Warehouse...'
      : loaderAction === 'contact'
      ? 'Saving Contact...'
      : loaderAction === 'delete'
      ? 'Deleting Contact...'
      : 'Please wait...';

  const loaderSubtitle =
    loaderAction === 'warehouse'
      ? isNew
        ? 'Please wait while we create the warehouse.'
        : 'Please wait while we save your changes.'
      : loaderAction === 'contact'
      ? 'Please wait while we save the contact.'
      : loaderAction === 'delete'
      ? 'Please wait while we remove the contact.'
      : undefined;

  if (loading) {
    return (
      <div className={`wf-page ${theme}`}>
        <div className="wf-inner">
          <div className="wf-loading">
            <FaSpinner className="spinning" size={40} />
            <p>Loading warehouse data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wf-page ${theme}`}>
      <div className="wf-inner">

        <LoaderOverlay
          isOpen={loaderAction !== null}
          message={loaderMessage}
          subtitle={loaderSubtitle}
        />

        {/* Validation Summary Modal */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing or Invalid Fields
                </h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-description">
                  Please fix the following issues before submitting:
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

        {/* Contact Modal */}
        {showContactModal && (
          <div className="modal-overlay" onClick={() => !isContactSubmitting && closeContactModal()}>
            <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaUserPlus /> {editingContactIndex !== null ? 'Edit Contact' : 'Add New Contact'}
                </h2>
                <button className="modal-close" onClick={closeContactModal} disabled={isContactSubmitting}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="contact-form">
                  <div className="contact-field">
                    <label className="contact-label">
                      <FaUser className="contact-label-icon" /> Full Name <span className="wf-required">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactFormData.fullName || ''}
                      onChange={(e) => {
                        setContactFormData({ ...contactFormData, fullName: e.target.value });
                        if (contactErrors.fullName) setContactErrors({ ...contactErrors, fullName: '' });
                      }}
                      className={`contact-input${contactErrors.fullName ? ' field-error' : ''}`}
                      placeholder="Enter full name"
                      disabled={isContactSubmitting}
                    />
                    {contactErrors.fullName && <span className="wf-error-msg"><FaExclamationCircle size={10} />{contactErrors.fullName}</span>}
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaEnvelope className="contact-label-icon" /> Email
                    </label>
                    <input
                      type="email"
                      value={contactFormData.email || ''}
                      onChange={(e) => {
                        setContactFormData({ ...contactFormData, email: e.target.value });
                        if (contactErrors.email) setContactErrors({ ...contactErrors, email: '' });
                      }}
                      className={`contact-input${contactErrors.email ? ' field-error' : ''}`}
                      placeholder="Enter email address"
                      disabled={isContactSubmitting}
                    />
                    {contactErrors.email && <span className="wf-error-msg"><FaExclamationCircle size={10} />{contactErrors.email}</span>}
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaMobileAlt className="contact-label-icon" /> Mobile No
                    </label>
                    <input
                      type="text"
                      value={contactFormData.mobile || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setContactFormData({ ...contactFormData, mobile: value });
                        if (contactErrors.mobile) setContactErrors({ ...contactErrors, mobile: '' });
                      }}
                      className={`contact-input${contactErrors.mobile ? ' field-error' : ''}`}
                      placeholder="Enter 10 digit mobile number"
                      maxLength={10}
                      disabled={isContactSubmitting}
                    />
                    {contactErrors.mobile && <span className="wf-error-msg"><FaExclamationCircle size={10} />{contactErrors.mobile}</span>}
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaMapMarkerAlt className="contact-label-icon" /> Address
                    </label>
                    <input
                      type="text"
                      value={contactFormData.address || ''}
                      onChange={(e) => setContactFormData({ ...contactFormData, address: e.target.value })}
                      className="contact-input"
                      placeholder="Enter address"
                      disabled={isContactSubmitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaCity className="contact-label-icon" /> City
                    </label>
                    <input
                      type="text"
                      value={contactFormData.city || ''}
                      onChange={(e) => setContactFormData({ ...contactFormData, city: e.target.value })}
                      className="contact-input"
                      placeholder="Enter city"
                      disabled={isContactSubmitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaGlobe className="contact-label-icon" /> Country
                    </label>
                    <input
                      type="text"
                      value={contactFormData.country || ''}
                      onChange={(e) => setContactFormData({ ...contactFormData, country: e.target.value })}
                      className="contact-input"
                      placeholder="Enter country"
                      disabled={isContactSubmitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">
                      <FaMapPin className="contact-label-icon" /> Pincode
                    </label>
                    <input
                      type="text"
                      value={contactFormData.pincode || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setContactFormData({ ...contactFormData, pincode: value });
                      }}
                      className="contact-input"
                      placeholder="Enter 6 digit pincode"
                      maxLength={6}
                      disabled={isContactSubmitting}
                    />
                  </div>

                  <div className="contact-field">
                    <label className="contact-label">Status</label>
                    <select
                      value={contactFormData.status || 'Active'}
                      onChange={(e) => setContactFormData({ ...contactFormData, status: e.target.value as Contact['status'] })}
                      className="contact-input"
                      disabled={isContactSubmitting}
                    >
                      <option value="Active">Active</option>
                      <option value="Passive">Passive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={closeContactModal} disabled={isContactSubmitting}>
                  Cancel
                </button>
                <button 
                  className="btn-submit" 
                  onClick={handleSaveContact} 
                  disabled={isContactSubmitting || (isNew ? false : !warehouseId) || isViewMode}
                >
                  {isContactSubmitting && <FaSpinner className="spinning" />}
                  <FaSave size={12} />
                  {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Search Modal */}
        {showContactSearch && (
          <div className="modal-overlay" onClick={() => setShowContactSearch(false)}>
            <div className="contact-modal contact-search-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <FaSearch /> Search Contacts
                </h2>
                <button className="modal-close" onClick={() => setShowContactSearch(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: 'calc(90vh - 140px)', overflowY: 'auto' }}>
                <div className="contact-search-wrapper" style={{ marginBottom: '16px' }}>
                  <FaSearch className="contact-search-icon" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or code..."
                    value={contactSearchTerm}
                    onChange={(e) => setContactSearchTerm(e.target.value)}
                    className="contact-search-input"
                    autoFocus
                    disabled={isViewMode}
                  />
                  {contactSearchTerm && !isViewMode && (
                    <button className="contact-search-clear" onClick={() => setContactSearchTerm('')}>
                      <FaTimes size={12} />
                    </button>
                  )}
                </div>
                <div className="contact-search-results">
                  {filteredContacts.length === 0 ? (
                    <div className="contact-empty-state">
                      <p>No contacts found</p>
                      <span>Try adjusting your search criteria</span>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div key={contact.id} className="contact-search-item">
                        <div className="contact-search-info">
                          <div className="contact-search-name">
                            <FaUser className="contact-icon" />
                            {contact.fullName}
                            <span className="contact-search-code">{contact.contactCode}</span>
                          </div>
                          <div className="contact-search-details">
                            {contact.email && <span><FaEnvelope /> {contact.email}</span>}
                            {contact.mobile && <span><FaMobileAlt /> {contact.mobile}</span>}
                          </div>
                        </div>
                        {!isViewMode && (
                          <button
                            className="contact-add-btn"
                            onClick={() => handleAddExistingContact(contact)}
                            disabled={selectedContacts.some(c => c.id === contact.id)}
                          >
                            {selectedContacts.some(c => c.id === contact.id) ? 'Added' : 'Add'}
                          </button>
                        )}
                        {isViewMode && (
                          <span className="contact-view-only-label">View Only</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowContactSearch(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="wf-header">
          <button onClick={() => navigate('/warehouse')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>
              {isNew ? 'Add New Warehouse' : 
               isViewMode ? `View: ${form.warehouseName || 'Warehouse'}` : 
               `Edit: ${form.warehouseName || 'Warehouse'}`}
              {isViewMode && (
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'normal', 
                  marginLeft: '12px',
                  color: 'var(--text-secondary)',
                  background: 'var(--primary-color-light, #dbeafe)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FaEye size={12} /> View Mode
                </span>
              )}
            </h1>
          </div>
          {hasErrors && !isViewMode && (
            <div className="error-badge" onClick={() => setShowValidationSummary(true)} style={{ cursor: 'pointer' }}>
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} field{getAllValidationErrors().length !== 1 ? 's' : ''} need attention
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          <div className="wf-card">

            <span className="wf-section-title">Warehouse Detail</span>

            {isNew && (
              <div className="wf-field">
                <label className="wf-label">
                  <FaBuilding className="wf-label-icon" />Warehouse Name <span className="wf-required">*</span>
                </label>
                <input
                  type="text"
                  value={form.warehouseName}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, warehouseName: value });
                    if (errors.warehouseName) setErrors({ ...errors, warehouseName: '' });
                  }}
                  className={`form-field${hasFieldError('warehouseName') ? ' field-error' : ''}`}
                  placeholder="Enter warehouse name"
                  maxLength={50}
                  disabled={isViewMode}
                />
                {hasFieldError('warehouseName') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('warehouseName')}</span>}
              </div>
            )}

            {!isNew && (
              <div className="wf-field">
                <label className="wf-label">
                  <FaBuilding className="wf-label-icon" />Warehouse Name
                </label>
                <input
                  type="text"
                  value={form.warehouseName}
                  disabled
                  className="form-field"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
                <p className="wf-field-hint">Warehouse name cannot be changed</p>
              </div>
            )}

            <div className="wf-grid-2">
              <div className="wf-field">
                <label className="wf-label">
                  <FaUsers className="wf-label-icon" />Company <span className="wf-required">*</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, company: value });
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  className={`form-field${hasFieldError('company') ? ' field-error' : ''}`}
                  placeholder="Enter company name"
                  maxLength={50}
                  disabled={isViewMode}
                />
                {hasFieldError('company') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('company')}</span>}
              </div>

              <div className="wf-field">
                <label className="wf-label">
                  <FaBoxes className="wf-label-icon" />Parent Warehouse
                </label>
                <input
                  type="text"
                  value={form.parentWarehouse}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, parentWarehouse: value });
                    if (errors.parentWarehouse) setErrors({ ...errors, parentWarehouse: '' });
                  }}
                  className={`form-field${hasFieldError('parentWarehouse') ? ' field-error' : ''}`}
                  placeholder="Enter parent warehouse"
                  maxLength={50}
                  disabled={isViewMode}
                />
                {hasFieldError('parentWarehouse') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('parentWarehouse')}</span>}
              </div>
            </div>

            <div className="wf-field-check">
              <input
                type="checkbox"
                id="isRejectedWarehouse"
                checked={form.isRejectedWarehouse}
                onChange={(e) => setForm({ ...form, isRejectedWarehouse: e.target.checked })}
                className="wf-checkbox"
                disabled={isViewMode}
              />
              <div>
                <label htmlFor="isRejectedWarehouse" className="wf-check-label">
                  <FaCheckSquare className="wf-check-icon" /> Is Rejected Warehouse
                </label>
                <p className="wf-check-hint">If yes, then this warehouse will be used to store rejected materials</p>
              </div>
            </div>

            <div className="wf-field-check">
              <input
                type="checkbox"
                id="isGroupWarehouse"
                checked={form.isGroupWarehouse}
                onChange={(e) => setForm({ ...form, isGroupWarehouse: e.target.checked })}
                className="wf-checkbox"
                disabled={isViewMode}
              />
              <div>
                <label htmlFor="isGroupWarehouse" className="wf-check-label">
                  <FaCheckSquare className="wf-check-icon" /> Is Group Warehouse
                </label>
                <p className="wf-check-hint">Enable if this is a group warehouse</p>
              </div>
            </div>

            <div className="wf-divider" />

            <span className="wf-section-title">Address and Contact</span>

            <div className="wf-grid-2">
              <div className="wf-field">
                <label className="wf-label">
                  <FaMapMarkerAlt className="wf-label-icon" />Address Line 1
                </label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                  className="form-field"
                  placeholder="Enter address line 1"
                  disabled={isViewMode}
                />
              </div>

              <div className="wf-field">
                <label className="wf-label">
                  <FaMapMarkerAlt className="wf-label-icon" />Address Line 2
                </label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                  className="form-field"
                  placeholder="Enter address line 2"
                  disabled={isViewMode}
                />
              </div>
            </div>

            <div className="wf-collapsible" style={{ marginTop: '8px' }}>
              <button 
                type="button"
                className="wf-collapsible-btn" 
                onClick={() => setIsContactInfoExpanded(!isContactInfoExpanded)}
              >
                <span className="wf-collapsible-icon">
                  {isContactInfoExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                Warehouse Contact Info
              </button>
              {isContactInfoExpanded && (
                <div className="wf-collapsible-content">
                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaPhone className="wf-label-icon" />Phone No
                      </label>
                      <input
                        type="text"
                        value={form.phoneNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9+\s-]/g, '');
                          setForm({ ...form, phoneNo: value });
                          if (errors.phoneNo) setErrors({ ...errors, phoneNo: '' });
                        }}
                        className={`form-field${hasFieldError('phoneNo') ? ' field-error' : ''}`}
                        placeholder="Enter phone number (10 digits)"
                        disabled={isViewMode}
                      />
                      {hasFieldError('phoneNo') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('phoneNo')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMobileAlt className="wf-label-icon" />Mobile No
                      </label>
                      <input
                        type="text"
                        value={form.mobileNo}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9+\s-]/g, '');
                          setForm({ ...form, mobileNo: value });
                          if (errors.mobileNo) setErrors({ ...errors, mobileNo: '' });
                        }}
                        className={`form-field${hasFieldError('mobileNo') ? ' field-error' : ''}`}
                        placeholder="Enter mobile number (10 digits)"
                        disabled={isViewMode}
                      />
                      {hasFieldError('mobileNo') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('mobileNo')}</span>}
                    </div>
                  </div>

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaEnvelope className="wf-label-icon" />Email ID
                      </label>
                      <input
                        type="email"
                        value={form.emailId}
                        onChange={(e) => {
                          setForm({ ...form, emailId: e.target.value });
                          if (errors.emailId) setErrors({ ...errors, emailId: '' });
                        }}
                        className={`form-field${hasFieldError('emailId') ? ' field-error' : ''}`}
                        placeholder="Enter email address"
                        disabled={isViewMode}
                      />
                      {hasFieldError('emailId') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('emailId')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaMapPin className="wf-label-icon" />PIN
                      </label>
                      <input
                        type="text"
                        value={form.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForm({ ...form, pin: value });
                          if (errors.pin) setErrors({ ...errors, pin: '' });
                        }}
                        className={`form-field${hasFieldError('pin') ? ' field-error' : ''}`}
                        placeholder="Enter 6 digit PIN code"
                        maxLength={6}
                        disabled={isViewMode}
                      />
                      {hasFieldError('pin') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('pin')}</span>}
                    </div>
                  </div>

                  <div className="wf-grid-2">
                    <div className="wf-field">
                      <label className="wf-label">
                        <FaCity className="wf-label-icon" />City
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                          setForm({ ...form, city: value });
                          if (errors.city) setErrors({ ...errors, city: '' });
                        }}
                        className={`form-field${hasFieldError('city') ? ' field-error' : ''}`}
                        placeholder="Enter city"
                        maxLength={50}
                        disabled={isViewMode}
                      />
                      {hasFieldError('city') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('city')}</span>}
                    </div>

                    <div className="wf-field">
                      <label className="wf-label">
                        <FaGlobe className="wf-label-icon" />State/Province
                      </label>
                      <input
                        type="text"
                        value={form.stateProvince}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^A-Za-z\s.]/g, '');
                          setForm({ ...form, stateProvince: value });
                          if (errors.stateProvince) setErrors({ ...errors, stateProvince: '' });
                        }}
                        className={`form-field${hasFieldError('stateProvince') ? ' field-error' : ''}`}
                        placeholder="Enter state/province"
                        maxLength={50}
                        disabled={isViewMode}
                      />
                      {hasFieldError('stateProvince') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('stateProvince')}</span>}
                    </div>
                  </div>

                  <div className="wf-field">
                    <label className="wf-label">
                      <FaBoxes className="wf-label-icon" />Warehouse Type
                    </label>
                    <input
                      type="text"
                      value={form.warehouseType}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        setForm({ ...form, warehouseType: value });
                        if (errors.warehouseType) setErrors({ ...errors, warehouseType: '' });
                      }}
                      className={`form-field${hasFieldError('warehouseType') ? ' field-error' : ''}`}
                      placeholder="Enter warehouse type"
                      maxLength={50}
                      disabled={isViewMode}
                    />
                    {hasFieldError('warehouseType') && <span className="wf-error-msg"><FaExclamationCircle size={10} />{getFieldError('warehouseType')}</span>}
                  </div>

                  <div className="wf-field-check">
                    <input
                      type="checkbox"
                      id="transit"
                      checked={form.transit}
                      onChange={(e) => setForm({ ...form, transit: e.target.checked })}
                      className="wf-checkbox"
                      disabled={isViewMode}
                    />
                    <div>
                      <label htmlFor="transit" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>

                  <div className="wf-contacts-section">
                    <div className="wf-contacts-header">
                      <span className="wf-contacts-title">Contacts ({selectedContacts.length})</span>
                      {!isViewMode && (
                        <div className="wf-contacts-actions">
                          <button 
                            type="button" 
                            className="wf-link-btn" 
                            onClick={() => setShowContactSearch(true)}
                          >
                            <FaSearch size={10} /> Add Existing
                          </button>
                          <button 
                            type="button" 
                            className="wf-link-btn" 
                            onClick={() => openContactModal()}
                          >
                            <FaPlus size={10} /> New Contact
                          </button>
                        </div>
                      )}
                      {isViewMode && (
                        <span className="wf-view-only-badge" style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          background: 'var(--primary-color-light, #dbeafe)',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <FaEye size={10} /> View Only
                        </span>
                      )}
                    </div>
                    
                    {selectedContacts.length > 0 ? (
                      <div className="wf-contacts-list">
                        {selectedContacts.map((contact, index) => (
                          <div key={contact.id || index} className="wf-contact-item">
                            <div className="wf-contact-info">
                              <div className="wf-contact-name">
                                <FaUser className="wf-contact-icon" />
                                {contact.fullName}
                                <span className={`wf-contact-status ${contact.status === 'Active' ? 'status-active' : contact.status === 'Passive' ? 'status-passive' : 'status-suspended'}`}>
                                  {contact.status}
                                </span>
                                {contact.id && contact.id.startsWith('temp-') && (
                                  <span className="wf-contact-temp-badge">(Unsaved)</span>
                                )}
                              </div>
                              <div className="wf-contact-details">
                                {contact.email && <span><FaEnvelope /> {contact.email}</span>}
                                {contact.mobile && <span><FaMobileAlt /> {contact.mobile}</span>}
                                {contact.contactCode && !contact.contactCode.startsWith('CONT-TEMP-') && (
                                  <span className="contact-code">{contact.contactCode}</span>
                                )}
                              </div>
                            </div>
                            {!isViewMode && (
                              <div className="wf-contact-actions">
                                <button 
                                  type="button" 
                                  className="wf-contact-edit-btn"
                                  onClick={() => openContactModal(index)}
                                  title="Edit"
                                >
                                  <FaEdit size={12} />
                                </button>
                                <button 
                                  type="button" 
                                  className="wf-contact-delete-btn"
                                  onClick={() => handleDeleteContact(index)}
                                  title="Remove from warehouse"
                                >
                                  <FaTrash size={12} />
                                </button>
                              </div>
                            )}
                            {isViewMode && (
                              <div className="wf-contact-actions">
                                <span className="wf-view-only-label" style={{
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  padding: '2px 8px'
                                }}>View Only</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="wf-empty-state">No contacts added yet.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="wf-divider" />

            <div className="wf-collapsible">
              <button 
                type="button"
                className="wf-collapsible-btn" 
                onClick={() => setIsTransitExpanded(!isTransitExpanded)}
              >
                <span className="wf-collapsible-icon">
                  {isTransitExpanded ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                Transit
              </button>
              {isTransitExpanded && (
                <div className="wf-collapsible-content">
                  <div className="wf-field-check">
                    <input
                      type="checkbox"
                      id="transitSection"
                      checked={form.transit}
                      onChange={(e) => setForm({ ...form, transit: e.target.checked })}
                      className="wf-checkbox"
                      disabled={isViewMode}
                    />
                    <div>
                      <label htmlFor="transitSection" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>
                  <div className="wf-empty-state">No transit configurations added yet.</div>
                  {!isViewMode && (
                    <button type="button" className="wf-link-btn">
                      <FaPlus size={10} /> Add Transit
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="wf-divider" />

            <span className="wf-section-title">Account</span>
            <div className="wf-field">
              <label className="wf-label">
                <FaHome className="wf-label-icon" />Account
              </label>
              <input
                type="text"
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                className="form-field"
                placeholder="If blank, parent Warehouse Account or company default will be considered in transactions"
                disabled={isViewMode}
              />
              <p className="wf-field-hint">
                If blank, parent Warehouse Account or company default will be considered in transactions
              </p>
            </div>

            <div className="wf-divider" />

            <span className="wf-section-title">Customer</span>
            <div className="wf-field">
              <label className="wf-label">
                <FaUserTie className="wf-label-icon" />Customer
              </label>
              <input
                type="text"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                className="form-field"
                placeholder="Only to be used for Subcontracting Inward"
                disabled={isViewMode}
              />
              <p className="wf-field-hint">Only to be used for Subcontracting Inward</p>
            </div>

          </div>

          <div className="wf-footer">
            <button
              type="button"
              onClick={() => navigate('/warehouse')}
              className="cancel-btn"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={submitting}
                className="submit-btn"
              >
                {submitting && <FaSpinner className="spinning" />}
                <FaSave size={12} />
                {isEditMode ? 'Update' : 'Save'}
              </button>
            )}
            {isViewMode && (
              <button
                type="button"
                onClick={navigateToEdit}
                className="submit-btn"
                style={{ background: 'var(--primary-color)' }}
              >
                <FaEdit size={12} />
                Edit
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}