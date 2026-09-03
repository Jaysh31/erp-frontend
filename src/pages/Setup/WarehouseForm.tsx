import { useState, useEffect } from "react";
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

export default function WarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  
  const isNew = id === "new" || !id;
  const isEditMode = !isNew;

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

  // ─── Fetch contacts from API ─────────────────────────────────────────
  const fetchContacts = async () => {
    try {
      const response = await api.get('/contact');
      if (response.data && response.data.success === 1) {
        setContacts(response.data.data || []);
      } else {
        // Fallback to mock data if API fails
        const mockContacts: Contact[] = [
          {
            id: '1',
            contactCode: 'CONT-001',
            fullName: 'Nirjala Bagal',
            firstName: 'Nirjala',
            lastName: 'Bagal',
            email: 'nirjala@gmail.com',
            phone: '9876543210',
            mobile: '9876543210',
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
            phone: '8765432109',
            mobile: '8765432109',
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
            phone: '7654321098',
            mobile: '7654321098',
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
        setContacts(mockContacts);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      // Set mock contacts on error
      const mockContacts: Contact[] = [
        {
          id: '1',
          contactCode: 'CONT-001',
          fullName: 'Nirjala Bagal',
          firstName: 'Nirjala',
          lastName: 'Bagal',
          email: 'nirjala@gmail.com',
          phone: '9876543210',
          mobile: '9876543210',
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
          phone: '8765432109',
          mobile: '8765432109',
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
          phone: '7654321098',
          mobile: '7654321098',
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
      setContacts(mockContacts);
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
            // Fetch contacts if warehouse has ID
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
    console.log('Opening contact modal with index:', index);
    console.log('Selected contacts:', selectedContacts);
    
    if (index !== undefined && selectedContacts[index]) {
      const contact = selectedContacts[index];
      console.log('Editing contact:', contact);
      
      setEditingContactIndex(index);
      // Explicitly set each field with fallback values
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
      console.log('Adding new contact');
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
      // Update existing contact in local state
      const updatedContacts = [...selectedContacts];
      updatedContacts[editingContactIndex] = { ...updatedContacts[editingContactIndex], ...newContact };
      setSelectedContacts(updatedContacts);
      toast.success('Contact updated successfully!');
    } else {
      // Add new contact to local state
      setSelectedContacts([...selectedContacts, newContact]);
      toast.success('Contact added successfully!');
    }
    closeContactModal();
  };

  // Save contact to API (for existing warehouses)
  const handleSaveContactAPI = async () => {
    if (!warehouseId) {
      toast.error('Please save the warehouse first');
      return;
    }

    if (!validateContactForm()) {
      return;
    }

    setIsContactSubmitting(true);
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
        // Update existing contact
        const contactId = selectedContacts[editingContactIndex].id;
        response = await api.put(`/warehouse/${warehouseId}/contacts/${contactId}`, contactData);
      } else {
        // Create new contact
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
    if (isNew) {
      // Remove from local state
      const updatedContacts = selectedContacts.filter((_, i) => i !== index);
      setSelectedContacts(updatedContacts);
      toast.success('Contact removed successfully!');
    } else {
      // Delete from API
      if (!selectedContacts[index]?.id || selectedContacts[index].id.startsWith('temp-')) {
        // Remove temp contact from local state
        const updatedContacts = selectedContacts.filter((_, i) => i !== index);
        setSelectedContacts(updatedContacts);
        toast.success('Contact removed successfully!');
        return;
      }
      
      if (window.confirm('Are you sure you want to delete this contact?')) {
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
          });
        } catch (err) {
          console.error('Error deleting contact:', err);
          toast.error('Failed to delete contact');
        }
      }
    }
  };

  // ─── Add existing contact to warehouse ──────────────────────────────
  const handleAddExistingContact = (contact: Contact) => {
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

  // Only alphabets and spaces (for name, city, state, warehouse type)
  const isValidAlphabetOnly = (value: string): boolean => {
    return /^[A-Za-z\s]*$/.test(value);
  };

  // Only alphabets and spaces with dot (for state/province)
  const isValidState = (value: string): boolean => {
    return /^[A-Za-z\s.]*$/.test(value);
  };

  // Exactly 10 digits (for mobile and phone)
  const isValidPhone = (value: string): boolean => {
    return /^\d{10}$/.test(value);
  };

  // Valid email format
  const isValidEmail = (value: string): boolean => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  };

  // Exactly 6 digits (for PIN)
  const isValidPin = (value: string): boolean => {
    return /^\d{6}$/.test(value);
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // Warehouse Name - Required (only for new)
    if (isNew && !form.warehouseName.trim()) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name is required' });
    }
    if (isNew && form.warehouseName.trim() && !isValidAlphabetOnly(form.warehouseName.trim())) {
      allErrors.push({ field: 'warehouseName', label: 'Warehouse Name', message: 'Warehouse name should contain only alphabets and spaces' });
    }

    // Company - Required
    if (!form.company.trim()) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company is required' });
    }
    if (form.company.trim() && !isValidAlphabetOnly(form.company.trim())) {
      allErrors.push({ field: 'company', label: 'Company', message: 'Company should contain only alphabets and spaces' });
    }

    // Parent Warehouse - Alphabets only
    if (form.parentWarehouse.trim() && !isValidAlphabetOnly(form.parentWarehouse.trim())) {
      allErrors.push({ field: 'parentWarehouse', label: 'Parent Warehouse', message: 'Parent warehouse should contain only alphabets and spaces' });
    }

    // Phone No - Exactly 10 digits
    if (form.phoneNo.trim() && !isValidPhone(form.phoneNo.trim())) {
      allErrors.push({ field: 'phoneNo', label: 'Phone No', message: 'Phone number must be exactly 10 digits' });
    }

    // Mobile No - Exactly 10 digits
    if (form.mobileNo.trim() && !isValidPhone(form.mobileNo.trim())) {
      allErrors.push({ field: 'mobileNo', label: 'Mobile No', message: 'Mobile number must be exactly 10 digits' });
    }

    // Email - Valid email format
    if (form.emailId.trim() && !isValidEmail(form.emailId.trim())) {
      allErrors.push({ field: 'emailId', label: 'Email ID', message: 'Please enter a valid email address' });
    }

    // PIN - Exactly 6 digits
    if (form.pin.trim() && !isValidPin(form.pin.trim())) {
      allErrors.push({ field: 'pin', label: 'PIN', message: 'PIN code must be exactly 6 digits' });
    }

    // City - Alphabets only
    if (form.city.trim() && !isValidAlphabetOnly(form.city.trim())) {
      allErrors.push({ field: 'city', label: 'City', message: 'City should contain only alphabets and spaces' });
    }

    // State/Province - Alphabets, spaces and dot allowed
    if (form.stateProvince.trim() && !isValidState(form.stateProvince.trim())) {
      allErrors.push({ field: 'stateProvince', label: 'State/Province', message: 'State should contain only alphabets, spaces and dots' });
    }

    // Warehouse Type - Alphabets only
    if (form.warehouseType.trim() && !isValidAlphabetOnly(form.warehouseType.trim())) {
      allErrors.push({ field: 'warehouseType', label: 'Warehouse Type', message: 'Warehouse type should contain only alphabets and spaces' });
    }

    return allErrors;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrorsList = getAllValidationErrors();
    if (validationErrorsList.length > 0) {
      setValidationErrors(validationErrorsList);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const payload: any = {};

      if (!isNew && warehouseId) {
        payload.id = warehouseId;
      }

      payload.warehouse_name = form.warehouseName.trim();
      payload.company = form.company.trim() || null;
      payload.parent_warehouse = form.parentWarehouse.trim() || null;
      payload.warehouse_type = form.warehouseType.trim() || null;
      payload.city = form.city.trim() || null;
      payload.state = form.stateProvince.trim() || null;
      payload.phone_no = form.phoneNo.trim() || null;
      payload.mobile_no = form.mobileNo.trim() || null;
      payload.email_id = form.emailId.trim() || null;
      payload.address_line_1 = form.addressLine1.trim() || null;
      payload.address_line_2 = form.addressLine2.trim() || null;
      payload.pin = form.pin.trim() || null;
      payload.account = form.account.trim() || null;
      payload.customer = form.customer.trim() || null;
      
      payload.is_rejected_warehouse = form.isRejectedWarehouse ? 1 : 0;
      payload.is_group = form.isGroupWarehouse ? 1 : 0;
      payload.default_in_transit_warehouse = form.transit ? 1 : 0;

      // Add selected contacts to payload
      if (isNew) {
        // For new warehouse, send contacts data
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
        // For existing warehouse, send just the contact IDs
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
        toast.error(response.data?.message || 'Failed to save warehouse');
        setErrors({ submit: response.data?.message || 'Failed to save warehouse' });
      }
    } catch (err: any) {
      console.error('Error saving warehouse:', err);
      
      if (err.response) {
        if (err.response.status === 409) {
          toast.error('A warehouse with this name already exists');
          setErrors({ warehouseName: 'A warehouse with this name already exists' });
        } else if (err.response.status === 400) {
          toast.error(err.response.data?.message || 'Invalid data provided');
          setErrors({ submit: err.response.data?.message || 'Invalid data provided' });
        } else {
          toast.error(err.response.data?.message || 'Failed to save warehouse');
          setErrors({ submit: err.response.data?.message || 'Failed to save warehouse' });
        }
      } else if (err.request) {
        toast.error('Network error. Please check your connection.');
        setErrors({ submit: 'Network error. Please check your connection.' });
      } else {
        toast.error('An unexpected error occurred. Please try again.');
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = getAllValidationErrors().length > 0;

  // Helper to check if a field has error
  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => err.field === fieldName);
  };

  // Get error message for a field
  const getFieldError = (fieldName: string): string => {
    const error = validationErrors.find(err => err.field === fieldName);
    return error ? error.message : '';
  };

  // Filter contacts for search
  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    contact.contactCode.toLowerCase().includes(contactSearchTerm.toLowerCase())
  );

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

        {/* ─── Validation Summary Modal ────────────────────────────── */}
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

        {/* ─── Contact Modal ────────────────────────────────────────── */}
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
                  disabled={isContactSubmitting || (isNew ? false : !warehouseId)}
                >
                  {isContactSubmitting && <FaSpinner className="spinning" />}
                  <FaSave size={12} />
                  {editingContactIndex !== null ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Contact Search Modal ────────────────────────────────── */}
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
                  />
                  {contactSearchTerm && (
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
                        <button
                          className="contact-add-btn"
                          onClick={() => handleAddExistingContact(contact)}
                          disabled={selectedContacts.some(c => c.id === contact.id)}
                        >
                          {selectedContacts.some(c => c.id === contact.id) ? 'Added' : 'Add'}
                        </button>
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

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="wf-header">
          <button onClick={() => navigate('/warehouse')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            {/*<h1>{isNew ? 'Add New Warehouse' : `Edit: ${form.warehouseName || 'Warehouse'}`}</h1>*/}
          </div>
          {hasErrors && (
            <div className="error-badge" onClick={() => setShowValidationSummary(true)} style={{ cursor: 'pointer' }}>
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} field{getAllValidationErrors().length !== 1 ? 's' : ''} need attention
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="wf-card">

            {/* Warehouse Detail */}
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
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, warehouseName: value });
                    if (errors.warehouseName) setErrors({ ...errors, warehouseName: '' });
                  }}
                  className={`form-field${hasFieldError('warehouseName') ? ' field-error' : ''}`}
                  placeholder="Enter warehouse name"
                  maxLength={50}
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
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, company: value });
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  className={`form-field${hasFieldError('company') ? ' field-error' : ''}`}
                  placeholder="Enter company name"
                  maxLength={50}
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
                    // Only allow alphabets and spaces
                    const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setForm({ ...form, parentWarehouse: value });
                    if (errors.parentWarehouse) setErrors({ ...errors, parentWarehouse: '' });
                  }}
                  className={`form-field${hasFieldError('parentWarehouse') ? ' field-error' : ''}`}
                  placeholder="Enter parent warehouse"
                  maxLength={50}
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
              />
              <div>
                <label htmlFor="isGroupWarehouse" className="wf-check-label">
                  <FaCheckSquare className="wf-check-icon" /> Is Group Warehouse
                </label>
                <p className="wf-check-hint">Enable if this is a group warehouse</p>
              </div>
            </div>

            <div className="wf-divider" />

            {/* Address and Contact Section */}
            <span className="wf-section-title">Address and Contact</span>

            {/* Address Line 1 & 2 */}
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
                />
              </div>
            </div>

            {/* Warehouse Contact Info Collapsible */}
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
                          // Only allow digits, max 10
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm({ ...form, phoneNo: value });
                          if (errors.phoneNo) setErrors({ ...errors, phoneNo: '' });
                        }}
                        className={`form-field${hasFieldError('phoneNo') ? ' field-error' : ''}`}
                        placeholder="Enter 10 digit phone number"
                        maxLength={10}
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
                          // Only allow digits, max 10
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setForm({ ...form, mobileNo: value });
                          if (errors.mobileNo) setErrors({ ...errors, mobileNo: '' });
                        }}
                        className={`form-field${hasFieldError('mobileNo') ? ' field-error' : ''}`}
                        placeholder="Enter 10 digit mobile number"
                        maxLength={10}
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
                          // Only allow digits, max 6
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setForm({ ...form, pin: value });
                          if (errors.pin) setErrors({ ...errors, pin: '' });
                        }}
                        className={`form-field${hasFieldError('pin') ? ' field-error' : ''}`}
                        placeholder="Enter 6 digit PIN code"
                        maxLength={6}
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
                          // Only allow alphabets and spaces
                          const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                          setForm({ ...form, city: value });
                          if (errors.city) setErrors({ ...errors, city: '' });
                        }}
                        className={`form-field${hasFieldError('city') ? ' field-error' : ''}`}
                        placeholder="Enter city"
                        maxLength={50}
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
                          // Only allow alphabets, spaces and dots
                          const value = e.target.value.replace(/[^A-Za-z\s.]/g, '');
                          setForm({ ...form, stateProvince: value });
                          if (errors.stateProvince) setErrors({ ...errors, stateProvince: '' });
                        }}
                        className={`form-field${hasFieldError('stateProvince') ? ' field-error' : ''}`}
                        placeholder="Enter state/province"
                        maxLength={50}
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
                        // Only allow alphabets and spaces
                        const value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                        setForm({ ...form, warehouseType: value });
                        if (errors.warehouseType) setErrors({ ...errors, warehouseType: '' });
                      }}
                      className={`form-field${hasFieldError('warehouseType') ? ' field-error' : ''}`}
                      placeholder="Enter warehouse type"
                      maxLength={50}
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
                    />
                    <div>
                      <label htmlFor="transit" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>

                  {/* ─── Contacts Section ────────────────────────────────── */}
                  <div className="wf-contacts-section">
                    <div className="wf-contacts-header">
                      <span className="wf-contacts-title">Contacts ({selectedContacts.length})</span>
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="wf-empty-state">No contacts added yet. Add a new contact or add existing contact.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="wf-divider" />

            {/* Transit Collapsible */}
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
                    />
                    <div>
                      <label htmlFor="transitSection" className="wf-check-label">
                        <FaTruck className="wf-check-icon" /> Default In Transit Warehouse
                      </label>
                      <p className="wf-check-hint">Enable if this warehouse is used for transit</p>
                    </div>
                  </div>
                  <div className="wf-empty-state">No transit configurations added yet.</div>
                  <button type="button" className="wf-link-btn">
                    <FaPlus size={10} /> Add Transit
                  </button>
                </div>
              )}
            </div>

            <div className="wf-divider" />

            {/* Account */}
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
              />
              <p className="wf-field-hint">
                If blank, parent Warehouse Account or company default will be considered in transactions
              </p>
            </div>

            <div className="wf-divider" />

            {/* Customer */}
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
              />
              <p className="wf-field-hint">Only to be used for Subcontracting Inward</p>
            </div>

          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="wf-footer">
            <button
              type="button"
              onClick={() => navigate('/warehouse')}
              className="cancel-btn"
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
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}