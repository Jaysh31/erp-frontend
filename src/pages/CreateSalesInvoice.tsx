import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner, 
  FaPlus, 
  FaTrash, 
  FaKeyboard, 
  FaFolder,
  FaUser,
  FaCalendarAlt,
  FaRupeeSign,
  FaTruck,
  FaFileInvoice,
  FaInfoCircle,
  FaBox,
  FaSearch,
  FaCheckSquare,
  FaSquare
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface InvoiceItem {
  id: string;
  itemCode: string;
  itemCategory: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  tax: number;
  taxAmount: number;
  total: number;
  dcId?: number;
}

interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  gstin: string;
}

interface DeliveryChallan {
  id: number;
  name: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  status: string;
  grand_total: number;
  items?: Array<{
    item_code: string;
    item_name: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
}

interface InvoiceForm {
  invoiceNumber: string;
  customer: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGstin: string;
  selectedDCIds: number[];
  date: string;
  dueDate: string;
  currency: string;
  exchangeRate: number;
  items: InvoiceItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  shippingCharge: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentTerms: string;
  notes: string;
  termsConditions: string;
  company: string;
  companyTaxId: string;
  costCenter: string;
  project: string;
}

// ===== MOCK DATA =====
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'ABC Traders Pvt Ltd',
    code: 'CUST001',
    email: 'info@abctraders.com',
    phone: '+91 98765 43210',
    address: '123, Business Park, Mumbai - 400001',
    gstin: '27AABCU1234D1Z1'
  },
  {
    id: '2',
    name: 'XYZ Enterprises',
    code: 'CUST002',
    email: 'contact@xyzent.com',
    phone: '+91 87654 32109',
    address: '456, Industrial Estate, Pune - 411001',
    gstin: '27BXYZU5678D1Z1'
  },
  {
    id: '3',
    name: 'PQR Solutions Ltd',
    code: 'CUST003',
    email: 'info@pqrsolutions.com',
    phone: '+91 76543 21098',
    address: '789, Tech Park, Bangalore - 560001',
    gstin: '27CPQRU9012D1Z1'
  },
  {
    id: '4',
    name: 'LMN Group',
    code: 'CUST004',
    email: 'contact@lmngroup.com',
    phone: '+91 65432 10987',
    address: '321, Corporate Tower, Delhi - 110001',
    gstin: '27DLMNU3456D1Z1'
  },
  {
    id: '5',
    name: 'RST Industries',
    code: 'CUST005',
    email: 'info@rstind.com',
    phone: '+91 54321 09876',
    address: '654, Industrial Area, Chennai - 600001',
    gstin: '27ERSTU7890D1Z1'
  }
];

const MOCK_DELIVERY_CHALLANS: Record<string, DeliveryChallan[]> = {
  '1': [
    {
      id: 101,
      name: 'DN-2026-001',
      customer: 'CUST001',
      customer_name: 'ABC Traders Pvt Ltd',
      posting_date: '2026-07-05',
      status: 'Submitted',
      grand_total: 150000,
      items: [
        { item_code: 'PRD-P001', item_name: 'Industrial Pump - 5 HP', description: 'Industrial Pump - 5 HP', qty: 10, uom: 'pcs', rate: 1500, amount: 15000 },
        { item_code: 'PRD-S001', item_name: 'Submersible Pump - 2 HP', description: 'Submersible Pump - 2 HP', qty: 5, uom: 'pcs', rate: 2000, amount: 10000 }
      ]
    },
    {
      id: 102,
      name: 'DN-2026-002',
      customer: 'CUST001',
      customer_name: 'ABC Traders Pvt Ltd',
      posting_date: '2026-07-10',
      status: 'Submitted',
      grand_total: 75000,
      items: [
        { item_code: 'PRD-C001', item_name: 'Centrifugal Pump - 3 HP', description: 'Centrifugal Pump - 3 HP', qty: 3, uom: 'pcs', rate: 2500, amount: 7500 },
        { item_code: 'PRD-M001', item_name: 'Motor Assembly - 7.5 HP', description: 'Motor Assembly - 7.5 HP', qty: 2, uom: 'pcs', rate: 5000, amount: 10000 }
      ]
    }
  ],
  '2': [
    {
      id: 201,
      name: 'DN-2026-003',
      customer: 'CUST002',
      customer_name: 'XYZ Enterprises',
      posting_date: '2026-07-08',
      status: 'Submitted',
      grand_total: 94400,
      items: [
        { item_code: 'PRD-G001', item_name: 'Gear Box - 10:1 Ratio', description: 'Gear Box - 10:1 Ratio', qty: 4, uom: 'pcs', rate: 3000, amount: 12000 },
        { item_code: 'PRD-P002', item_name: 'Hydraulic Pump - 10 HP', description: 'Hydraulic Pump - 10 HP', qty: 2, uom: 'pcs', rate: 4500, amount: 9000 }
      ]
    }
  ],
  '3': [
    {
      id: 301,
      name: 'DN-2026-004',
      customer: 'CUST003',
      customer_name: 'PQR Solutions Ltd',
      posting_date: '2026-07-12',
      status: 'Submitted',
      grand_total: 53100,
      items: [
        { item_code: 'SVC-C001', item_name: 'Consulting Services', description: 'Consulting Services - Hourly', qty: 10, uom: 'hrs', rate: 1500, amount: 15000 },
        { item_code: 'SVC-M001', item_name: 'Maintenance Services', description: 'Maintenance Services - Monthly', qty: 1, uom: 'month', rate: 25000, amount: 25000 }
      ]
    }
  ],
  '4': [
    {
      id: 401,
      name: 'DN-2026-005',
      customer: 'CUST004',
      customer_name: 'LMN Group',
      posting_date: '2026-07-15',
      status: 'Submitted',
      grand_total: 67200,
      items: [
        { item_code: 'PRD-S002', item_name: 'Submersible Pump - 5 HP', description: 'Submersible Pump - 5 HP', qty: 8, uom: 'pcs', rate: 2800, amount: 22400 }
      ]
    }
  ],
  '5': [
    {
      id: 501,
      name: 'DN-2026-006',
      customer: 'CUST005',
      customer_name: 'RST Industries',
      posting_date: '2026-07-18',
      status: 'Submitted',
      grand_total: 76700,
      items: [
        { item_code: 'PRD-M002', item_name: 'Motor Assembly - 10 HP', description: 'Motor Assembly - 10 HP', qty: 3, uom: 'pcs', rate: 7500, amount: 22500 },
        { item_code: 'SVC-I001', item_name: 'Installation Services', description: 'Installation Services', qty: 1, uom: 'job', rate: 15000, amount: 15000 }
      ]
    }
  ]
};

export default function CreateSalesInvoice() {
  const navigate = useNavigate();
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingDCs, setLoadingDCs] = useState(false);
  const [] = useState<string | null>(null);
  const [] = useState<string>(`SINV-${new Date().getFullYear()}-001`);
  
  // State for dropdowns
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [deliveryChallans, setDeliveryChallans] = useState<DeliveryChallan[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDCs, setSelectedDCs] = useState<number[]>([]);
  
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null }>({});
  const itemInputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement | null }>({});

  const [formData, setFormData] = useState<InvoiceForm>({
    invoiceNumber: `SINV-${new Date().getFullYear()}-001`,
    customer: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    customerGstin: '',
    selectedDCIds: [],
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: 'INR',
    exchangeRate: 1.0,
    items: [],
    subtotal: 0,
    discountPercent: 0,
    discountAmount: 0,
    taxPercent: 18,
    taxAmount: 0,
    shippingCharge: 0,
    totalAmount: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    paymentTerms: 'Net 15',
    notes: '',
    termsConditions: 'Payment due within 15 days. Late payment penalty of 2% per month applies.',
    company: 'My Company',
    companyTaxId: 'GSTIN123456789',
    costCenter: 'Main - MC',
    project: 'Project A'
  });

  const itemCategories = [
    'Raw Material',
    'Finished Goods',
    'Semi-Finished',
    'Packaging',
    'Spare Parts',
    'Consumables',
    'Tools & Equipment',
    'Office Supplies',
    'Electronics',
    'Furniture',
    'Hardware',
    'Software'
  ];

  // ===== MOCK FETCH CUSTOMERS =====
  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    setCustomers(MOCK_CUSTOMERS);
    setLoadingCustomers(false);
  };

  // ===== MOCK FETCH DELIVERY CHALLANS =====
  const fetchDeliveryChallansForCustomer = async (customerId: string) => {
    setLoadingDCs(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dcs = MOCK_DELIVERY_CHALLANS[customerId] || [];
    setDeliveryChallans(dcs);
    setSelectedDCs([]);
    setFormData(prev => ({ ...prev, selectedDCIds: [], items: [] }));
    
    if (dcs.length === 0) {
      toast.error('No submitted delivery challans found for this customer.');
    }
    setLoadingDCs(false);
  };

  // ===== LOAD CUSTOMER DETAILS =====
  const loadCustomerDetails = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setSelectedCustomer(customer);
      setFormData(prev => ({
        ...prev,
        customer: customer.code || customer.id,
        customerName: customer.name,
        customerEmail: customer.email || '',
        customerPhone: customer.phone || '',
        customerAddress: customer.address || '',
        customerGstin: customer.gstin || ''
      }));
      fetchDeliveryChallansForCustomer(customerId);
    }
  };

  // ===== TOGGLE DC SELECTION =====
  const toggleDCSelection = (dcId: number) => {
    setSelectedDCs(prev => {
      const newSelection = prev.includes(dcId) 
        ? prev.filter(id => id !== dcId) 
        : [...prev, dcId];
      
      setFormData(prevData => ({
        ...prevData,
        selectedDCIds: newSelection
      }));
      
      // Load items from selected DCs
      loadItemsFromSelectedDCs(newSelection);
      
      return newSelection;
    });
  };

  // ===== LOAD ITEMS FROM SELECTED DCs =====
  const loadItemsFromSelectedDCs = (dcIds: number[]) => {
    const selectedDCItems = deliveryChallans
      .filter(dc => dcIds.includes(dc.id))
      .flatMap(dc => 
        (dc.items || []).map(item => ({
          id: `${dc.id}_${item.item_code || Date.now()}`,
          itemCode: item.item_code || '',
          itemCategory: 'Finished Goods',
          itemName: item.item_name || item.description || '',
          quantity: item.qty || 0,
          rate: item.rate || 0,
          amount: (item.qty || 0) * (item.rate || 0),
          tax: 18,
          taxAmount: ((item.qty || 0) * (item.rate || 0)) * 0.18,
          total: ((item.qty || 0) * (item.rate || 0)) * 1.18,
          dcId: dc.id
        }))
      );
    
    // Merge duplicate items (same itemCode)
    const mergedItems: InvoiceItem[] = [];
    selectedDCItems.forEach(item => {
      const existing = mergedItems.find(i => i.itemCode === item.itemCode);
      if (existing) {
        existing.quantity += item.quantity;
        existing.amount = existing.quantity * existing.rate;
        existing.taxAmount = existing.amount * (existing.tax / 100);
        existing.total = existing.amount + existing.taxAmount;
      } else {
        mergedItems.push({ ...item });
      }
    });
    
    // Recalculate totals
    const subtotal = mergedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = mergedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = mergedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const finalTotal = total + formData.shippingCharge - discountAmount;
    const outstanding = finalTotal - formData.paidAmount;
    
    setFormData(prev => ({
      ...prev,
      items: mergedItems,
      subtotal,
      taxAmount,
      totalAmount: finalTotal,
      discountAmount,
      outstandingAmount: outstanding
    }));
  };

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchCustomers();
  }, []);

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit(e as any);
      }
      
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        addItemRow();
        toast.success('New item added');
        setTimeout(() => {
          const lastIndex = formData.items.length;
          const refKey = `item_${lastIndex}_itemCode`;
          if (itemInputRefs.current[refKey]) {
            itemInputRefs.current[refKey]?.focus();
          }
        }, 100);
      }
      
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData.items.length]);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current['customer']?.focus();
    }, 300);
  }, []);

  // ===== HANDLERS =====
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    if (customerId) {
      loadCustomerDetails(customerId);
    } else {
      setSelectedCustomer(null);
      setDeliveryChallans([]);
      setSelectedDCs([]);
      setFormData(prev => ({
        ...prev,
        customer: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        customerGstin: '',
        selectedDCIds: [],
        items: [],
        subtotal: 0,
        totalAmount: 0,
        outstandingAmount: 0
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    if (field === 'quantity' || field === 'rate' || field === 'tax') {
      const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
      const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
      const tax = field === 'tax' ? Number(value) : updatedItems[index].tax;
      
      updatedItems[index].amount = quantity * rate;
      updatedItems[index].taxAmount = (quantity * rate) * (tax / 100);
      updatedItems[index].total = (quantity * rate) + updatedItems[index].taxAmount;
    }
    
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const finalTotal = total + formData.shippingCharge - discountAmount;
    const outstanding = finalTotal - formData.paidAmount;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount: finalTotal,
      discountAmount,
      outstandingAmount: outstanding
    }));
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, index: number, field: keyof InvoiceItem) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const fields: (keyof InvoiceItem)[] = ['itemCode', 'itemCategory', 'itemName', 'quantity', 'rate', 'tax'];
      const currentIndex = fields.indexOf(field);
      
      if (currentIndex === fields.length - 1) {
        if (formData.items[index].rate > 0 && formData.items[index].itemCode) {
          addItemRow();
          setTimeout(() => {
            const newIndex = index + 1;
            const refKey = `item_${newIndex}_itemCode`;
            if (itemInputRefs.current[refKey]) {
              itemInputRefs.current[refKey]?.focus();
            }
          }, 100);
        }
      } else {
        const nextField = fields[currentIndex + 1];
        const refKey = `item_${index}_${nextField}`;
        if (itemInputRefs.current[refKey]) {
          itemInputRefs.current[refKey]?.focus();
        }
      }
    }
  };

  const addItemRow = () => {
    const newId = String(formData.items.length + 1);
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { id: newId, itemCode: '', itemCategory: '', itemName: '', quantity: 1, rate: 0, amount: 0, tax: 18, taxAmount: 0, total: 0 }
      ]
    }));
  };

  const removeItemRow = (index: number) => {
    if (formData.items.length <= 1) return;
    const updatedItems = formData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = updatedItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * (formData.discountPercent / 100);
    const finalTotal = total + formData.shippingCharge - discountAmount;
    const outstanding = finalTotal - formData.paidAmount;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount: finalTotal,
      discountAmount,
      outstandingAmount: outstanding
    }));
  };

  // ===== BUILD PAYLOAD (For Demo) =====
  const buildPayload = () => {
    const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = formData.items.reduce((sum, item) => sum + item.taxAmount, 0);
    
    const deliveryNoteId = formData.selectedDCIds.length > 0 ? formData.selectedDCIds[0] : null;
    
    return {
      company: formData.company,
      company_tax_id: formData.companyTaxId,
      delivery_note_id: deliveryNoteId,
      naming_series: "ACC-SINV-.YYYY.-",
      customer: formData.customer,
      customer_name: formData.customerName,
      tax_id: formData.customerGstin,
      posting_date: formData.date,
      posting_time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      due_date: formData.dueDate,
      is_pos: 0,
      is_return: 0,
      update_stock: 1,
      currency: formData.currency,
      conversion_rate: formData.exchangeRate,
      selling_price_list: "Standard Selling",
      price_list_currency: formData.currency,
      plc_conversion_rate: 1,
      cost_center: formData.costCenter,
      project: formData.project,
      total_qty: totalQty,
      total_net_weight: 0,
      base_total: totalAmount,
      base_net_total: totalAmount,
      total: totalAmount,
      net_total: totalAmount,
      tax_category: "GST",
      taxes_and_charges: "Output GST",
      base_total_taxes_and_charges: totalTax,
      total_taxes_and_charges: totalTax,
      grand_total: formData.totalAmount,
      rounded_total: formData.totalAmount,
      base_grand_total: formData.totalAmount,
      base_rounded_total: formData.totalAmount,
      total_advance: 0,
      paid_amount: formData.paidAmount,
      base_paid_amount: formData.paidAmount,
      outstanding_amount: formData.outstandingAmount,
      additional_discount_percentage: formData.discountPercent,
      discount_amount: formData.discountAmount,
      base_discount_amount: formData.discountAmount,
      customer_address: formData.customerAddress,
      contact_person: formData.customerName,
      territory: "India",
      remarks: formData.notes || "Sales Invoice created from Delivery Challan.",
      status: "Draft",
      modified_by: "Administrator",
      items: formData.items
        .filter(item => item.itemCode && item.quantity > 0)
        .map(item => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          description: item.itemName,
          qty: item.quantity,
          uom: "pcs",
          rate: item.rate,
          amount: item.amount,
          tax_rate: item.tax,
          tax_amount: item.taxAmount,
          total: item.total,
          warehouse: "Main Warehouse",
          cost_center: formData.costCenter
        }))
    };
  };

  // ===== VALIDATION =====
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.customer) newErrors.customer = 'Please select a customer';
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (formData.selectedDCIds.length === 0) newErrors.deliveryChallan = 'Please select at least one Delivery Challan';
    if (!formData.date) newErrors.date = 'Invoice date is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    
    let hasValidItem = false;
    formData.items.forEach((item, index) => {
      if (item.itemCode || item.itemName) {
        if (!item.itemCode) {
          newErrors[`item_${index}_code`] = 'Item code required';
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] = 'Quantity must be > 0';
        }
        if (item.rate <= 0) {
          newErrors[`item_${index}_rate`] = 'Rate must be > 0';
        }
        hasValidItem = true;
      }
    });
    if (!hasValidItem) {
      newErrors.items = 'At least one item is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== SUBMIT (Mock) =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      const firstError = Object.keys(errors)[0];
      if (firstError && inputRefs.current[firstError]) {
        inputRefs.current[firstError]?.focus();
      }
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = buildPayload();
      console.log('Sales Invoice Payload:', payload);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Sales Invoice SINV-${new Date().getFullYear()}-001 created successfully!`);
      navigate('/sales-invoice');
      
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Failed to create sales invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
      navigate('/sales-invoice');
    }
  };

  // ===== TOGGLE ALL DCs =====
  const toggleAllDCs = () => {
    if (selectedDCs.length === deliveryChallans.length) {
      setSelectedDCs([]);
      setFormData(prev => ({ ...prev, selectedDCIds: [], items: [] }));
    } else {
      const allIds = deliveryChallans.map(dc => dc.id);
      setSelectedDCs(allIds);
      setFormData(prev => ({ ...prev, selectedDCIds: allIds }));
      loadItemsFromSelectedDCs(allIds);
    }
  };

  return (
    <div className={`create-invoice-page ${theme}-theme`}>
      <style>{`
        .create-invoice-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #f5f7fb;
          padding: 20px 30px;
          gap: 16px;
          overflow-y: auto;
          font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
          color: #1f2433;
        }

        .create-invoice-page::-webkit-scrollbar { width: 6px; }
        .create-invoice-page::-webkit-scrollbar-track { background: #f9fafb; border-radius: 3px; }
        .create-invoice-page::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 3px; }
        .create-invoice-page::-webkit-scrollbar-thumb:hover { background: #6366f1; }

        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          flex-shrink: 0;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
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
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .back-btn:hover {
          background: #f3f4f6;
          border-color: #6366f1;
          color: #6366f1;
        }

        .page-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2433;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .page-title .title-icon { color: #6366f1; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .shortcuts-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 11px;
          color: #6b7280;
        }

        .cancel-btn, .submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 38px;
          padding: 0 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .cancel-btn {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #6b7280;
        }
        .cancel-btn:hover { background: #e5e7eb; }

        .submit-btn {
          background: #2563eb;
          border: none;
          color: #fff;
        }
        .submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .form-section {
          background: #ffffff;
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid #e5e7eb;
          margin-bottom: 12px;
        }
        .form-section:last-child { margin-bottom: 0; }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2433;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-title .section-icon { color: #2563eb; font-size: 14px; }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        .form-group.full-width { grid-column: 1 / -1; }

        .form-group label {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          display: block;
          margin-bottom: 3px;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          color: #374151;
          transition: all 0.2s ease;
          background: #ffffff;
          font-family: inherit;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .form-group input.error { border-color: #ef4444; }
        .form-group input::placeholder, .form-group textarea::placeholder { color: #9ca3af; }

        .error-text {
          font-size: 10px;
          color: #ef4444;
          margin-top: 3px;
          display: block;
        }

        .disabled-input {
          background: #f3f4f6 !important;
          color: #6b7280 !important;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px;
        }
        .input-with-icon input, .input-with-icon select { padding-left: 32px; }

        .dc-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 8px;
          max-height: 150px;
          overflow-y: auto;
          padding: 8px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #fafbfc;
        }

        .dc-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .dc-item:hover { background: #f3f4f6; }
        .dc-item.selected { 
          border-color: #2563eb; 
          background: #eff6ff;
        }

        .dc-item .dc-checkbox {
          flex-shrink: 0;
          color: #94a3b8;
          font-size: 18px;
        }

        .dc-item.selected .dc-checkbox { color: #2563eb; }
        .dc-item .dc-info { flex: 1; }
        .dc-item .dc-info .dc-name { font-size: 13px; font-weight: 500; color: #1f2433; }
        .dc-item .dc-info .dc-details { font-size: 11px; color: #64748b; }

        .dc-select-all {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          cursor: pointer;
          font-size: 12px;
          color: #2563eb;
          font-weight: 500;
        }

        .dc-select-all:hover { color: #1d4ed8; }

        .items-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .add-item-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          background: rgba(37, 99, 235, 0.1);
          color: #2563eb;
          border: 1px solid #2563eb;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .add-item-btn:hover { background: rgba(37, 99, 235, 0.15); }

        .items-table-wrapper {
          overflow-x: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }

        .items-table thead { background: #f8f9fa; }
        .items-table th {
          padding: 6px 10px;
          text-align: left;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .items-table td {
          padding: 4px 8px;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .items-table input, .items-table select {
          width: 100%;
          padding: 4px 6px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          font-size: 12px;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #374151;
        }
        .items-table input:focus, .items-table select:focus {
          outline: none;
          border-color: #2563eb;
        }
        .items-table input.error { border-color: #ef4444; }
        .items-table input[type="number"] { width: 60px; }

        .amount-cell {
          font-weight: 500;
          color: #1f2433;
          white-space: nowrap;
        }
        .total-item { font-weight: 600; color: #2563eb; }

        .remove-item-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .remove-item-btn:hover { background: rgba(239, 68, 68, 0.2); }

        .keyboard-tips {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          padding: 6px 10px;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 10px;
          color: #6b7280;
        }
        .keyboard-tips kbd {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 3px;
          padding: 1px 5px;
          font-size: 9px;
          font-family: monospace;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .create-invoice-page { padding: 12px 16px; }
          .page-header { flex-direction: column; align-items: stretch; }
          .header-left { justify-content: space-between; }
          .header-actions { width: 100%; flex-direction: column; }
          .cancel-btn, .submit-btn { width: 100%; justify-content: center; }
          .form-grid { grid-template-columns: 1fr; }
          .form-section { padding: 12px 16px; }
          .items-table { min-width: 500px; }
          .dc-list { grid-template-columns: 1fr; }
          .form-actions { flex-direction: column; }
          .form-actions button { width: 100%; justify-content: center; }
          .shortcuts-hint { display: none; }
        }

        @media (max-width: 480px) {
          .create-invoice-page { padding: 8px 12px; }
          .form-section { padding: 10px 12px; }
          .items-table { min-width: 400px; }
          .items-table input[type="number"] { width: 45px; }
          .page-title { font-size: 17px; }
        }

        .dark-theme .create-invoice-page {
          background: #0f172a;
          color: #f8fafc;
        }
        .dark-theme .page-header { border-bottom-color: #334155; }
        .dark-theme .page-title { color: #f8fafc; }
        .dark-theme .back-btn {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        .dark-theme .back-btn:hover {
          background: rgba(255,255,255,0.05);
          border-color: #818cf8;
          color: #818cf8;
        }
        .dark-theme .form-section {
          background: #1e293b;
          border-color: #334155;
        }
        .dark-theme .section-title { color: #f8fafc; }
        .dark-theme .form-group label { color: #e2e8f0; }
        .dark-theme .form-group input, .dark-theme .form-group select, .dark-theme .form-group textarea {
          background: #0f172a;
          border-color: #334155;
          color: #f8fafc;
        }
        .dark-theme .form-group input:focus, .dark-theme .form-group select:focus, .dark-theme .form-group textarea:focus {
          border-color: #818cf8;
        }
        .dark-theme .disabled-input {
          background: #0f172a !important;
          color: #64748b !important;
        }
        .dark-theme .items-table-wrapper { border-color: #334155; }
        .dark-theme .items-table thead { background: #0f172a; }
        .dark-theme .items-table th { color: #94a3b8; border-bottom-color: #334155; }
        .dark-theme .items-table td { border-bottom-color: #334155; }
        .dark-theme .items-table input, .dark-theme .items-table select {
          background: #0f172a;
          border-color: #334155;
          color: #f8fafc;
        }
        .dark-theme .amount-cell { color: #f8fafc; }
        .dark-theme .total-item { color: #818cf8; }
        .dark-theme .add-item-btn {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
          border-color: #818cf8;
        }
        .dark-theme .add-item-btn:hover { background: rgba(99, 102, 241, 0.3); }
        .dark-theme .remove-item-btn {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }
        .dark-theme .remove-item-btn:hover { background: rgba(239, 68, 68, 0.25); }
        .dark-theme .cancel-btn {
          background: #0f172a;
          border-color: #334155;
          color: #94a3b8;
        }
        .dark-theme .cancel-btn:hover { background: #334155; }
        .dark-theme .submit-btn { background: #3b82f6; }
        .dark-theme .submit-btn:hover:not(:disabled) { background: #2563eb; }
        .dark-theme .keyboard-tips {
          background: #0f172a;
          color: #94a3b8;
        }
        .dark-theme .keyboard-tips kbd {
          background: #1e293b;
          border-color: #334155;
          color: #e2e8f0;
        }
        .dark-theme .form-actions { border-top-color: #334155; }
        .dark-theme .error-text { color: #f87171; }
        .dark-theme .form-group input.error { border-color: #f87171; }
        .dark-theme .dc-item {
          background: #1e293b;
          border-color: #334155;
        }
        .dark-theme .dc-item:hover { background: #0f172a; }
        .dark-theme .dc-item.selected { 
          border-color: #818cf8; 
          background: rgba(99, 102, 241, 0.15);
        }
        .dark-theme .dc-list { background: #0f172a; border-color: #334155; }
        .dark-theme .dc-select-all { color: #818cf8; }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={handleCancel}>
            <FaArrowLeft size={16} />
          </button>
          <h1 className="page-title">
            <FaFileInvoice className="title-icon" />
            Create Sales Invoice
          </h1>
        </div>
        <div className="header-actions">
          <div className="shortcuts-hint">
            <FaKeyboard size={13} />
            <span>Ctrl+S | Ctrl+Shift+A | Esc</span>
          </div>
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading && <FaSpinner className="spinning" />}
            <FaSave /> Create Invoice
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="invoice-form">
        {/* ===== CUSTOMER SELECTION ===== */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <FaUser className="section-icon" />
              Select Customer
            </h3>
            <span className="required-label">* Required</span>
          </div>
          <div className="form-grid">
            <div className="form-group full-width" style={{ maxWidth: '400px' }}>
              <label>Customer *</label>
              <div className="input-with-icon">
                <FaSearch className="input-icon" />
                <select
                  name="customer"
                  value={selectedCustomer?.id || ''}
                  onChange={handleCustomerChange}
                  className={errors.customer ? 'error' : ''}
                  ref={el => { inputRefs.current['customer'] = el; }}
                  disabled={loadingCustomers}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              {errors.customer && <span className="error-text">{errors.customer}</span>}
              {loadingCustomers && <span className="error-text">Loading customers...</span>}
            </div>
          </div>
        </div>

        {/* ===== DELIVERY CHALLAN SELECTION ===== */}
        {selectedCustomer && (
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                <FaTruck className="section-icon" />
                Select Delivery Challans
              </h3>
              <div className="dc-select-all" onClick={toggleAllDCs}>
                {selectedDCs.length === deliveryChallans.length && deliveryChallans.length > 0 ? (
                  <FaCheckSquare /> 
                ) : (
                  <FaSquare />
                )}
                {selectedDCs.length === deliveryChallans.length && deliveryChallans.length > 0 ? 'Deselect All' : 'Select All'}
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                {errors.deliveryChallan && <span className="error-text">{errors.deliveryChallan}</span>}
                {loadingDCs ? (
                  <div className="error-text">Loading delivery challans...</div>
                ) : deliveryChallans.length === 0 ? (
                  <div className="error-text">No submitted delivery challans found for this customer.</div>
                ) : (
                  <div className="dc-list">
                    {deliveryChallans.map(dc => (
                      <div 
                        key={dc.id} 
                        className={`dc-item ${selectedDCs.includes(dc.id) ? 'selected' : ''}`}
                        onClick={() => toggleDCSelection(dc.id)}
                      >
                        <span className="dc-checkbox">
                          {selectedDCs.includes(dc.id) ? <FaCheckSquare /> : <FaSquare />}
                        </span>
                        <div className="dc-info">
                          <div className="dc-name">{dc.name}</div>
                          <div className="dc-details">
                            {dc.posting_date} • ₹{dc.grand_total?.toFixed(2) || 0} • {dc.items?.length || 0} items
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                  Selected: <strong>{selectedDCs.length}</strong> of <strong>{deliveryChallans.length}</strong> challans
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== CUSTOMER INFORMATION ===== */}
        {selectedCustomer && (
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                <FaInfoCircle className="section-icon" />
                Customer Information
              </h3>
              <span className="readonly-badge" style={{ fontSize: '11px', color: '#94a3b8' }}>Auto-loaded</span>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Code</label>
                <input type="text" value={formData.customer} disabled className="disabled-input" />
              </div>
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className={errors.customerName ? 'error' : ''}
                  ref={el => { inputRefs.current['customerName'] = el; }}
                />
                {errors.customerName && <span className="error-text">{errors.customerName}</span>}
              </div>
              <div className="form-group">
                <label>GST Number</label>
                <input
                  type="text"
                  name="customerGstin"
                  value={formData.customerGstin}
                  onChange={handleInputChange}
                  ref={el => { inputRefs.current['customerGstin'] = el; }}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  ref={el => { inputRefs.current['customerEmail'] = el; }}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  ref={el => { inputRefs.current['customerPhone'] = el; }}
                />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <input
                  type="text"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleInputChange}
                  ref={el => { inputRefs.current['customerAddress'] = el; }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== ITEMS ===== */}
        <div className="form-section">
          <div className="items-header">
            <h3 className="section-title">
              <FaBox className="section-icon" />
              Items
            </h3>
            <button type="button" className="add-item-btn" onClick={addItemRow}>
              <FaPlus size={12} /> Add Item
            </button>
          </div>
          {errors.items && <div className="error-text">{errors.items}</div>}
          
          <div className="items-table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '90px' }}>Code</th>
                  <th style={{ minWidth: '100px' }}><FaFolder size={11} /> Category</th>
                  <th style={{ minWidth: '120px' }}>Item Name</th>
                  <th style={{ width: '55px' }}>Qty</th>
                  <th style={{ width: '75px' }}>Rate</th>
                  <th style={{ width: '60px' }}>Tax %</th>
                  <th style={{ width: '80px' }}>Amount</th>
                  <th style={{ width: '80px' }}>Total</th>
                  <th style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.length > 0 ? (
                  formData.items.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="text"
                          value={item.itemCode}
                          onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                          placeholder="Code"
                          className={errors[`item_${index}_code`] ? 'error' : ''}
                          ref={el => {
                            const key = `item_${index}_itemCode`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCode')}
                        />
                        {errors[`item_${index}_code`] && <span className="error-text">{errors[`item_${index}_code`]}</span>}
                      </td>
                      <td>
                        <select
                          value={item.itemCategory}
                          onChange={(e) => handleItemChange(index, 'itemCategory', e.target.value)}
                          ref={el => {
                            const key = `item_${index}_itemCategory`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemCategory')}
                        >
                          <option value="">Select</option>
                          {itemCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          placeholder="Item name"
                          ref={el => {
                            const key = `item_${index}_itemName`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'itemName')}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          min="1"
                          className={errors[`item_${index}_quantity`] ? 'error' : ''}
                          ref={el => {
                            const key = `item_${index}_quantity`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'quantity')}
                        />
                        {errors[`item_${index}_quantity`] && <span className="error-text">{errors[`item_${index}_quantity`]}</span>}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          className={errors[`item_${index}_rate`] ? 'error' : ''}
                          ref={el => {
                            const key = `item_${index}_rate`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'rate')}
                        />
                        {errors[`item_${index}_rate`] && <span className="error-text">{errors[`item_${index}_rate`]}</span>}
                      </td>
                      <td>
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', Number(e.target.value))}
                          min="0"
                          max="100"
                          step="0.1"
                          ref={el => {
                            const key = `item_${index}_tax`;
                            itemInputRefs.current[key] = el;
                            inputRefs.current[key] = el;
                          }}
                          onKeyDown={(e) => handleItemKeyDown(e, index, 'tax')}
                        />
                      </td>
                      <td className="amount-cell">₹{item.amount.toFixed(2)}</td>
                      <td className="amount-cell total-item">₹{item.total.toFixed(2)}</td>
                      <td>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => removeItemRow(index)}
                            title="Delete item"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      No items loaded. Please select a Delivery Challan to auto-load items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="keyboard-tips">
            <span><kbd>Enter</kbd> Next field</span>
            <span><kbd>Ctrl+Shift+A</kbd> Add item</span>
            <span><kbd>Alt+↓</kbd> Category dropdown</span>
          </div>
        </div>

        {/* ===== INVOICE DETAILS ===== */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <FaInfoCircle className="section-icon" />
              Invoice Details
            </h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Invoice #</label>
              <input type="text" value={formData.invoiceNumber} disabled className="disabled-input" />
            </div>
            <div className="form-group">
              <label>Invoice Date *</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className={errors.date ? 'error' : ''}
                  ref={el => { inputRefs.current['date'] = el; }}
                />
              </div>
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label>Due Date *</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className={errors.dueDate ? 'error' : ''}
                  ref={el => { inputRefs.current['dueDate'] = el; }}
                />
              </div>
              {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                name="paymentTerms"
                value={formData.paymentTerms}
                onChange={handleInputChange}
                ref={el => { inputRefs.current['paymentTerms'] = el; }}
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===== SUMMARY ===== */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <FaRupeeSign className="section-icon" />
              Summary
            </h3>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div className="summary-item" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Subtotal</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>₹{formData.subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-item" style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
              <span style={{ fontSize: '11px', color: '#6b7280' }}>Tax ({formData.taxPercent}%)</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>₹{formData.taxAmount.toFixed(2)}</span>
            </div>
            <div className="summary-item" style={{ padding: '8px 12px', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #6ee7b7' }}>
              <span style={{ fontSize: '11px', color: '#065f46' }}>Grand Total</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#065f46' }}>₹{formData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-item" style={{ padding: '8px 12px', background: '#fffbeb', borderRadius: '6px', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '11px', color: '#92400e' }}>Outstanding</span>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#92400e' }}>₹{formData.outstandingAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ===== NOTES ===== */}
        <div className="form-section">
          <div className="section-header">
            <h3 className="section-title">
              <FaInfoCircle className="section-icon" />
              Notes & Terms
            </h3>
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Additional notes..."
                rows={2}
                ref={el => { inputRefs.current['notes'] = el; }}
              />
            </div>
            <div className="form-group full-width">
              <label>Terms & Conditions</label>
              <textarea
                name="termsConditions"
                value={formData.termsConditions}
                onChange={handleInputChange}
                placeholder="Terms and conditions..."
                rows={2}
                ref={el => { inputRefs.current['termsConditions'] = el; }}
              />
            </div>
          </div>
        </div>

        {/* ===== FORM ACTIONS ===== */}
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading && <FaSpinner className="spinning" />}
            <FaSave /> Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}