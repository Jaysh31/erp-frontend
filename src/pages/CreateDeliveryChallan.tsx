import React, { useState, useEffect } from 'react';
import { 
  FaSave, 
  FaTimes, 
  FaPrint,
  FaPaperPlane,
  FaWarehouse,
  FaTruck,
  FaRoad,
  FaUserTie,
  FaCalendarAlt,
  FaIdCard,
  FaHashtag,
  FaBox,
  FaInfoCircle,
  FaFileContract,
  FaPhone,
  FaSpinner,
  FaChevronLeft,
  FaUser,
  FaPlus,
  FaTrash,
  FaCogs,
  FaHands,
  FaFileInvoice
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

// ===== INTERFACES =====

interface Customer {
  id: string;
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  shippingAddress: string;
  gstin: string;
  contactPerson?: string;
  contactMobile?: string;
}

interface SalesOrder {
  id: string;
  name: string;
  customer: string;
  customer_name: string;
  po_no?: string;
  po_date?: string;
  total: number;
  items?: Array<{
    item_code: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
  }>;
}

interface Product {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  rate: number;
  tax: number;
  type: 'product' | 'service';
}

interface DeliveryChallanItem {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
  type: 'product' | 'service';
}

interface DeliveryNotePayload {
  name: string;
  naming_series: string;
  customer: string;
  customer_name: string;
  posting_date: string;
  company: string;
  set_warehouse: string;
  transporter: string;
  vehicle_no: string;
  driver_name: string;
  lr_no: string;
  lr_date: string;
  po_no: string;
  po_date: string;
  sales_order: string;
  instructions: string;
  status: string;
  dc_type: string;
  items: Array<{
    item_code: string;
    description: string;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    warehouse: string;
    type: string;
  }>;
}

// ===== MOCK DATA =====
const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: 'ABC Traders Pvt Ltd',
    code: 'CUST001',
    email: 'info@abctraders.com',
    phone: '+91 98765 43210',
    contactPerson: 'Rajesh Sharma',
    contactMobile: '+91 98765 43211',
    address: '123, Business Park, Mumbai - 400001',
    shippingAddress: '123, Business Park, Mumbai - 400001',
    gstin: '27AABCU1234D1Z1'
  },
  {
    id: '2',
    name: 'XYZ Enterprises',
    code: 'CUST002',
    email: 'contact@xyzent.com',
    phone: '+91 87654 32109',
    contactPerson: 'Priya Patel',
    contactMobile: '+91 87654 32110',
    address: '456, Industrial Estate, Pune - 411001',
    shippingAddress: '456, Industrial Estate, Pune - 411001',
    gstin: '27BXYZU5678D1Z1'
  },
  {
    id: '3',
    name: 'PQR Solutions Ltd',
    code: 'CUST003',
    email: 'info@pqrsolutions.com',
    phone: '+91 76543 21098',
    contactPerson: 'Amit Singh',
    contactMobile: '+91 76543 21099',
    address: '789, Tech Park, Bangalore - 560001',
    shippingAddress: '789, Tech Park, Bangalore - 560001',
    gstin: '27CPQRU9012D1Z1'
  }
];

const MOCK_SALES_ORDERS: SalesOrder[] = [
  {
    id: '1',
    name: 'SO-2026-001',
    customer: '1',
    customer_name: 'ABC Traders Pvt Ltd',
    po_no: 'PO-1001',
    po_date: '2026-07-01',
    total: 150000,
    items: [
      { item_code: 'PRD-P001', description: 'Industrial Pump - 5 HP', qty: 10, uom: 'pcs', rate: 1500, amount: 15000 },
      { item_code: 'PRD-S001', description: 'Submersible Pump - 2 HP', qty: 5, uom: 'pcs', rate: 2000, amount: 10000 }
    ]
  },
  {
    id: '2',
    name: 'SO-2026-002',
    customer: '1',
    customer_name: 'ABC Traders Pvt Ltd',
    po_no: 'PO-1002',
    po_date: '2026-07-05',
    total: 75000,
    items: [
      { item_code: 'PRD-C001', description: 'Centrifugal Pump - 3 HP', qty: 3, uom: 'pcs', rate: 2500, amount: 7500 },
      { item_code: 'PRD-M001', description: 'Motor Assembly - 7.5 HP', qty: 2, uom: 'pcs', rate: 5000, amount: 10000 }
    ]
  },
  {
    id: '3',
    name: 'SO-2026-003',
    customer: '2',
    customer_name: 'XYZ Enterprises',
    po_no: 'PO-2001',
    po_date: '2026-07-08',
    total: 94400,
    items: [
      { item_code: 'PRD-G001', description: 'Gear Box - 10:1 Ratio', qty: 4, uom: 'pcs', rate: 3000, amount: 12000 },
      { item_code: 'PRD-P002', description: 'Hydraulic Pump - 10 HP', qty: 2, uom: 'pcs', rate: 4500, amount: 9000 }
    ]
  },
  {
    id: '4',
    name: 'SO-2026-004',
    customer: '3',
    customer_name: 'PQR Solutions Ltd',
    po_no: 'PO-3001',
    po_date: '2026-07-10',
    total: 53100,
    items: [
      { item_code: 'SVC-C001', description: 'Consulting Services - Hourly', qty: 10, uom: 'hrs', rate: 1500, amount: 15000 },
      { item_code: 'SVC-M001', description: 'Maintenance Services - Monthly', qty: 1, uom: 'month', rate: 25000, amount: 25000 }
    ]
  }
];

const NewDeliveryChallan: React.FC = () => {
  const navigate = useNavigate();
  
  // ===== STATE =====
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string>('');
  const [dcType, setDcType] = useState<string>('Products');
  const [dcDate, setDcDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [warehouse, setWarehouse] = useState<string>('');
  const [transporter, setTransporter] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [lrNumber, setLrNumber] = useState<string>('');
  const [lrDate, setLrDate] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [items, setItems] = useState<DeliveryChallanItem[]>([]);
  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dcNumber, setDcNumber] = useState<string>(`DN-${new Date().getFullYear()}-001`);

  // ===== GET CUSTOMER SALES ORDERS =====
  const getCustomerSalesOrders = (customerId: string): SalesOrder[] => {
    return MOCK_SALES_ORDERS.filter(so => so.customer === customerId);
  };

  // ===== LOAD CUSTOMER DATA =====
  const loadCustomerData = (customerId: string) => {
    const customer = MOCK_CUSTOMERS.find(c => c.id === customerId);
    if (customer) {
      setCustomerData(customer);
      // Reset sales order when customer changes
      setSelectedSalesOrder('');
      // Reset items
      setItems([{
        id: '1',
        itemCode: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        type: dcType === 'Products' ? 'product' : 'service'
      }]);
      toast.success(`Selected ${customer.name}`);
    }
  };

  // ===== LOAD SALES ORDER =====
  const loadSalesOrder = (soId: string) => {
    const so = MOCK_SALES_ORDERS.find(s => s.id === soId);
    if (so) {
      // Auto-populate PO details
      setPoNumber(so.po_no || '');
      setPoDate(so.po_date || '');
      
      // Auto-populate items from Sales Order
      const initialItems: DeliveryChallanItem[] = (so.items || []).map((item, index) => ({
        id: `so-${index}`,
        itemCode: item.item_code || '',
        description: item.description || '',
        quantity: item.qty || 0,
        unit: item.uom || 'pcs',
        rate: item.rate || 0,
        amount: (item.qty || 0) * (item.rate || 0),
        type: dcType === 'Products' ? 'product' : 'service'
      }));
      
      // If no items, add one default row
      if (initialItems.length === 0) {
        initialItems.push({
          id: '1',
          itemCode: '',
          description: '',
          quantity: 1,
          unit: 'pcs',
          rate: 0,
          amount: 0,
          type: dcType === 'Products' ? 'product' : 'service'
        });
      }
      
      setItems(initialItems);
      setErrors({});
      toast.success(`Loaded ${so.name} successfully!`);
    }
  };

  // ===== HANDLE CUSTOMER CHANGE =====
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setSelectedCustomer(customerId);
    if (customerId) {
      loadCustomerData(customerId);
    } else {
      setCustomerData(null);
      setSelectedSalesOrder('');
      setPoNumber('');
      setPoDate('');
      setItems([{
        id: '1',
        itemCode: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        type: dcType === 'Products' ? 'product' : 'service'
      }]);
    }
  };

  // ===== HANDLE SALES ORDER CHANGE =====
  const handleSalesOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const soId = e.target.value;
    setSelectedSalesOrder(soId);
    if (soId) {
      loadSalesOrder(soId);
    } else {
      // Reset items when sales order is deselected
      setItems([{
        id: '1',
        itemCode: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        type: dcType === 'Products' ? 'product' : 'service'
      }]);
      setPoNumber('');
      setPoDate('');
    }
  };

  useEffect(() => {
    if (dcType) {
      setItems(prev => prev.map(item => ({
        ...item,
        type: dcType === 'Products' ? 'product' : 'service'
      })));
    }
  }, [dcType]);

  // ===== ITEM MANAGEMENT =====
  const addItem = () => {
    const newItem: DeliveryChallanItem = {
      id: Date.now().toString(),
      itemCode: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      rate: 0,
      amount: 0,
      type: dcType === 'Products' ? 'product' : 'service'
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) {
      toast.error('At least one item is required');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof DeliveryChallanItem, value: any) => {
    setItems(prevItems => 
      prevItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updated.amount = (updated.quantity || 0) * (updated.rate || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // ===== GET PRODUCTS LIST =====
  const getProducts = (): Product[] => {
    if (dcType === 'Products') {
      return [
        { id: 'p1', itemCode: 'PRD-P001', description: 'Industrial Pump - 5 HP', unit: 'pcs', rate: 1500, tax: 18, type: 'product' },
        { id: 'p2', itemCode: 'PRD-S001', description: 'Submersible Pump - 2 HP', unit: 'pcs', rate: 2000, tax: 18, type: 'product' },
        { id: 'p3', itemCode: 'PRD-C001', description: 'Centrifugal Pump - 3 HP', unit: 'pcs', rate: 2500, tax: 12, type: 'product' },
        { id: 'p4', itemCode: 'PRD-M001', description: 'Motor Assembly - 7.5 HP', unit: 'pcs', rate: 5000, tax: 18, type: 'product' },
        { id: 'p5', itemCode: 'PRD-G001', description: 'Gear Box - 10:1 Ratio', unit: 'pcs', rate: 3000, tax: 12, type: 'product' }
      ];
    } else {
      return [
        { id: 's1', itemCode: 'SVC-C001', description: 'Consulting Services - Hourly', unit: 'hrs', rate: 1500, tax: 18, type: 'service' },
        { id: 's2', itemCode: 'SVC-M001', description: 'Maintenance Services - Monthly', unit: 'month', rate: 25000, tax: 18, type: 'service' },
        { id: 's3', itemCode: 'SVC-I001', description: 'Installation Services', unit: 'job', rate: 15000, tax: 18, type: 'service' },
        { id: 's4', itemCode: 'SVC-T001', description: 'Training Services - Per Session', unit: 'session', rate: 5000, tax: 12, type: 'service' },
        { id: 's5', itemCode: 'SVC-D001', description: 'Design Services - Hourly', unit: 'hrs', rate: 2000, tax: 18, type: 'service' }
      ];
    }
  };

  const products = getProducts();

  // ===== CALCULATIONS =====
  const getTotalQty = (): number => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const getTotalAmount = (): number => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  // ===== BUILD PAYLOAD =====
  const buildPayload = (status: 'Draft' | 'Submitted'): DeliveryNotePayload => {
    return {
      name: dcNumber,
      naming_series: "DN-.YYYY.-",
      customer: customerData?.code || '',
      customer_name: customerData?.name || '',
      posting_date: dcDate,
      company: 'SculptERP Pvt Ltd',
      set_warehouse: warehouse || '',
      transporter: transporter || '',
      vehicle_no: vehicleNumber || '',
      driver_name: driverName || '',
      lr_no: lrNumber || '',
      lr_date: lrDate || dcDate,
      po_no: poNumber || '',
      po_date: poDate || '',
      sales_order: selectedSalesOrder || '',
      instructions: remarks || '',
      status: status,
      dc_type: dcType,
      items: items
        .filter(item => item.itemCode && item.quantity > 0)
        .map(item => ({
          item_code: item.itemCode,
          description: item.description,
          qty: item.quantity,
          uom: item.unit,
          rate: item.rate,
          amount: item.amount,
          warehouse: warehouse || '',
          type: item.type
        }))
    };
  };

  // ===== VALIDATION =====
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (!dcDate) newErrors.dcDate = 'DC Date is required';
    if (!warehouse) newErrors.warehouse = 'Warehouse is required';
    
    const hasItems = items.some(item => item.itemCode && item.quantity > 0);
    if (!hasItems) newErrors.items = 'At least one item is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== API CALLS =====
  const createDeliveryNote = async (payload: DeliveryNotePayload) => {
    const response = await api.post('/delivery-note', payload);
    return response.data;
  };

  const submitDeliveryNote = async (name: string) => {
    const response = await api.post(`/delivery-note/${name}/submit`, {});
    return response.data;
  };

  // ===== SUBMIT HANDLERS =====
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload('Submitted');
      const created = await createDeliveryNote(payload);
      if (created && created.name) {
        await submitDeliveryNote(created.name);
        toast.success('Delivery Challan created and submitted successfully!');
        navigate('/delivery-challans');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create Delivery Challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const payload = buildPayload('Draft');
      await createDeliveryNote(payload);
      toast.success('Delivery Challan saved as Draft!');
      navigate('/delivery-challans');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save Draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Unsaved data will be lost.')) {
      navigate('/delivery-challans');
    }
  };

  const handlePrint = () => window.print();
  const handleBack = () => navigate('/delivery-challans');

  const getDcTypeIcon = () => dcType === 'Products' ? <FaCogs /> : <FaHands />;

  // ===== INITIALIZE WITH ONE DEFAULT ITEM =====
  useEffect(() => {
    if (items.length === 0) {
      setItems([{
        id: '1',
        itemCode: '',
        description: '',
        quantity: 1,
        unit: 'pcs',
        rate: 0,
        amount: 0,
        type: dcType === 'Products' ? 'product' : 'service'
      }]);
    }
  }, []);

  return (
    <div className="new-dc-page">
      <style>{`
        .new-dc-page {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
        }

        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37,99,235,0.3);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #fff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }
        .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 14px 20px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .page-header-left { display: flex; flex-direction: column; gap: 2px; }
        .breadcrumb { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94a3b8; }
        .breadcrumb .separator { color: #e2e8f0; }
        .breadcrumb .active { color: #1e293b; font-weight: 500; }
        .page-title { font-size: 20px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px; margin: 0; }
        .page-title .title-icon { color: #2c7a8a; }
        .page-subtitle { font-size: 13px; color: #64748b; margin: 0; }

        .form-body { display: flex; flex-direction: column; gap: 16px; }
        .form-section {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          padding: 16px 20px;
        }
        .form-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .form-section-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .required-label { font-size: 11px; color: #94a3b8; }
        .readonly-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }
        .dc-type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
          background: #eff6ff;
          color: #2563eb;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }
        .form-grid .full-width { grid-column: 1 / -1; }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .form-group label {
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
        }
        .form-group label .required { color: #ef4444; }

        .input-with-icon { position: relative; }
        .input-with-icon .input-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 13px;
        }
        .input-with-icon .form-input,
        .input-with-icon .form-select { padding-left: 32px; }

        .form-input, .form-select, .form-textarea {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 13px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
          width: 100%;
          font-family: inherit;
          height: 34px;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          background: #fff;
        }
        .form-input:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
          opacity: 0.8;
        }
        .form-input.error, .form-select.error { border-color: #ef4444; }
        .form-textarea { resize: vertical; min-height: 40px; height: auto; }
        .form-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 32px;
        }

        .error-text { font-size: 11px; color: #ef4444; margin-top: 2px; }
        .error-banner {
          padding: 8px 14px;
          background: #fef2f2;
          border: 1px solid #ef4444;
          border-radius: 6px;
          color: #ef4444;
          font-size: 13px;
          margin-bottom: 10px;
        }

        .customer-details {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }
        .customer-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 8px;
        }
        .info-group {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .info-group label {
          font-size: 10px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .info-group .info-value { font-size: 13px; color: #1e293b; }

        .items-table-container { overflow-x: auto; }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 600px;
        }
        .items-table th {
          padding: 6px 8px;
          text-align: left;
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 2px solid #e2e8f0;
        }
        .items-table td {
          padding: 4px 6px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .items-table .form-input, .items-table .form-select {
          padding: 4px 6px;
          font-size: 12px;
          height: 30px;
        }
        .items-table .form-input[type="number"] { width: 55px; text-align: right; }
        .item-amount { font-weight: 600; font-size: 13px; color: #1e293b; text-align: right; padding-right: 10px; }

        .remove-item-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }
        .remove-item-btn:hover { background: #fef2f2; color: #ef4444; }

        .empty-items { padding: 30px 20px !important; text-align: center !important; }
        .empty-items-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 13px;
        }
        .empty-icon-small { font-size: 20px; }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .summary-left h4 {
          font-size: 13px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 13px;
          color: #1e293b;
        }
        .summary-row.grand-total {
          font-size: 16px;
          font-weight: 700;
          border-top: 2px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 4px;
          color: #2563eb;
        }
        .text-blue { color: #2563eb; }
        .text-red { color: #ef4444; }
        .text-green { color: #10b981; }

        .status-card {
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .status-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        .status-row:last-child { border-bottom: none; }
        .status-label { font-size: 12px; color: #64748b; }
        .status-value { font-size: 13px; font-weight: 500; color: #1e293b; }
        .status-value.draft { color: #94a3b8; }

        .form-footer {
          display: flex;
          justify-content: flex-end;
          padding: 12px 0 0 0;
          border-top: 1px solid #e2e8f0;
          margin-top: 4px;
          flex-wrap: wrap;
          gap: 8px;
        }
        .form-footer-right { display: flex; gap: 8px; flex-wrap: wrap; }
        .form-footer-right button { min-width: 90px; justify-content: center; }
        .form-footer-right button:disabled { opacity: 0.6; cursor: not-allowed; }

        .so-hint {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 2px;
        }

        @media (max-width: 992px) {
          .form-grid { grid-template-columns: 1fr 1fr; }
          .summary-grid { grid-template-columns: 1fr; }
          .customer-info-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .new-dc-page { padding: 12px; }
          .form-grid { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; gap: 8px; align-items: flex-start; }
          .customer-info-grid { grid-template-columns: 1fr; }
          .form-footer { flex-direction: column; align-items: stretch; }
          .form-footer-right { width: 100%; flex-direction: column; }
          .form-footer-right button { width: 100%; min-width: unset; }
          .items-table { font-size: 12px; min-width: 500px; }
          .items-table th, .items-table td { padding: 4px 6px; }
        }
        @media (max-width: 480px) {
          .page-title { font-size: 17px; }
          .page-header { padding: 10px 14px; }
          .form-section { padding: 12px 14px; }
        }
        @media print {
          .form-footer, .btn-secondary, .btn-primary, .back-btn { display: none !important; }
          .new-dc-page { padding: 0 !important; background: #fff !important; }
          .form-section { box-shadow: none !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; }
          .page-header { box-shadow: none !important; border-bottom: 2px solid #e2e8f0; }
          .form-input:disabled, .form-select:disabled { background: transparent !important; opacity: 1 !important; }
        }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <span className="active">New Delivery Challan</span>
          </div>
          <h1 className="page-title">
            <FaTruck className="title-icon" />
            Create Delivery Challan
          </h1>
          <p className="page-subtitle">Create a new delivery challan for a customer</p>
        </div>
      </div>

      {/* ===== FORM BODY ===== */}
      <div className="form-body">
        {/* Customer Information */}
        <div className="form-section">
          <div className="form-section-header">
            <h3><FaUser style={{ color: '#2563eb', fontSize: '15px' }} /> Customer Information</h3>
            <span className="required-label">* Required fields</span>
          </div>
          <div className="form-grid">
            {/* Customer Dropdown - FIRST & WORKING */}
            <div className="form-group">
              <label>Customer <span className="required">*</span></label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <select 
                  className={`form-select ${errors.customer ? 'error' : ''}`}
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                >
                  <option value="">Select Customer</option>
                  {MOCK_CUSTOMERS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              {errors.customer && <span className="error-text">{errors.customer}</span>}
            </div>

            {/* Sales Order Dropdown - Filtered by Customer */}
            <div className="form-group">
              <label>Sales Order</label>
              <div className="input-with-icon">
                <FaFileInvoice className="input-icon" />
                <select 
                  className="form-select"
                  value={selectedSalesOrder}
                  onChange={handleSalesOrderChange}
                  disabled={!selectedCustomer}
                >
                  <option value="">Select Sales Order</option>
                  {getCustomerSalesOrders(selectedCustomer).map(so => (
                    <option key={so.id} value={so.id}>
                      {so.name} - ₹{so.total.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              {!selectedCustomer && <span className="so-hint">Select customer first</span>}
              {selectedCustomer && getCustomerSalesOrders(selectedCustomer).length === 0 && (
                <span className="so-hint">No sales orders for this customer</span>
              )}
            </div>

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label>DC Number</label>
              <input type="text" className="form-input" value={dcNumber} disabled />
            </div>

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label>DC Date <span className="required">*</span></label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  className={`form-input ${errors.dcDate ? 'error' : ''}`}
                  value={dcDate}
                  onChange={(e) => setDcDate(e.target.value)}
                />
              </div>
              {errors.dcDate && <span className="error-text">{errors.dcDate}</span>}
            </div>

            <div className="form-group" style={{ maxWidth: '180px' }}>
              <label>Type of DC <span className="required">*</span></label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '13px' }}>
                  {getDcTypeIcon()}
                </span>
                <select 
                  className="form-select"
                  value={dcType}
                  onChange={(e) => setDcType(e.target.value)}
                  style={{ paddingLeft: '32px' }}
                >
                  <option value="Products">📦 Products</option>
                  <option value="Services">🛠️ Services</option>
                </select>
              </div>
            </div>

            {/* PO Number - Compact */}
            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label>PO Number</label>
              <div className="input-with-icon">
                <FaFileContract className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="PO-1001"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label>PO Date</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  className="form-input"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Details - Compact */}
        {customerData && (
          <div className="form-section customer-details">
            <div className="form-section-header">
              <h3><FaInfoCircle style={{ color: '#6b7280', fontSize: '13px' }} /> Customer Details</h3>
              <span className="readonly-badge"><FaInfoCircle /> Auto-populated</span>
            </div>
            <div className="customer-info-grid">
              <div className="info-group">
                <label>Code</label>
                <div className="info-value">{customerData.code}</div>
              </div>
              <div className="info-group">
                <label>Contact Person</label>
                <div className="info-value">{customerData.contactPerson || 'N/A'}</div>
              </div>
              <div className="info-group">
                <label>Phone</label>
                <div className="info-value">{customerData.phone}</div>
              </div>
              <div className="info-group">
                <label>Email</label>
                <div className="info-value">{customerData.email}</div>
              </div>
              <div className="info-group">
                <label>GST</label>
                <div className="info-value">{customerData.gstin}</div>
              </div>
              <div className="info-group">
                <label>Address</label>
                <div className="info-value">{customerData.address}</div>
              </div>
            </div>
          </div>
        )}

        {/* Products/Services - Compact */}
        <div className="form-section">
          <div className="form-section-header">
            <h3>
              {dcType === 'Products' ? <FaBox style={{ color: '#2563eb', fontSize: '15px' }} /> : <FaHands style={{ color: '#2563eb', fontSize: '15px' }} />}
              {dcType === 'Products' ? 'Products' : 'Services'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="dc-type-badge">{getDcTypeIcon()} {dcType}</span>
              <button className="btn-secondary" onClick={addItem} style={{ padding: '4px 10px', fontSize: '12px' }}>
                <FaPlus size={10} /> Add
              </button>
            </div>
          </div>
          {errors.items && <div className="error-banner">{errors.items}</div>}
          <div className="items-table-container">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>Item</th>
                  <th style={{ width: '24%' }}>Description</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Qty</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Unit</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Rate</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>Amount</th>
                  <th style={{ width: '8%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <select 
                        className="form-select"
                        value={item.itemCode}
                        onChange={(e) => updateItem(item.id, 'itemCode', e.target.value)}
                      >
                        <option value="">Select</option>
                        {products.map(p => (
                          <option key={p.id} value={p.itemCode}>
                            {p.itemCode}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Description"
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="1"
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="form-input"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-input"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        style={{ textAlign: 'right' }}
                      />
                    </td>
                    <td className="item-amount">₹{item.amount.toFixed(2)}</td>
                    <td>
                      <button 
                        className="remove-item-btn"
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispatch Information - Compact */}
        <div className="form-section">
          <div className="form-section-header">
            <h3><FaTruck style={{ color: '#2563eb', fontSize: '15px' }} /> Dispatch Information</h3>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ maxWidth: '220px' }}>
              <label>Warehouse <span className="required">*</span></label>
              <div className="input-with-icon">
                <FaWarehouse className="input-icon" />
                <select 
                  className={`form-select ${errors.warehouse ? 'error' : ''}`}
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="Main Warehouse">Main Warehouse</option>
                  <option value="Secondary Warehouse">Secondary Warehouse</option>
                  <option value="Store Front">Store Front</option>
                </select>
              </div>
              {errors.warehouse && <span className="error-text">{errors.warehouse}</span>}
            </div>

            <div className="form-group" style={{ maxWidth: '180px' }}>
              <label>Transporter</label>
              <div className="input-with-icon">
                <FaTruck className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Transporter"
                  value={transporter}
                  onChange={(e) => setTransporter(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label>Vehicle No.</label>
              <div className="input-with-icon">
                <FaHashtag className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="MH-01-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label>Driver</label>
              <div className="input-with-icon">
                <FaUserTie className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="Driver name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '160px' }}>
              <label>LR Number</label>
              <div className="input-with-icon">
                <FaIdCard className="input-icon" />
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="LR-123456"
                  value={lrNumber}
                  onChange={(e) => setLrNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '140px' }}>
              <label>LR Date</label>
              <div className="input-with-icon">
                <FaCalendarAlt className="input-icon" />
                <input 
                  type="date" 
                  className="form-input"
                  value={lrDate}
                  onChange={(e) => setLrDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea 
                className="form-textarea"
                rows={1}
                placeholder="Additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Summary - Compact */}
        <div className="form-section">
          <div className="summary-grid">
            <div className="summary-left">
              <h4>Summary</h4>
              <div className="summary-row">
                <span>Total Items</span>
                <span>{items.filter(i => i.itemCode && i.quantity > 0).length}</span>
              </div>
              <div className="summary-row">
                <span>Total Quantity</span>
                <span>{getTotalQty()}</span>
              </div>
              <div className="summary-row grand-total">
                <span>Grand Total</span>
                <span>₹{getTotalAmount().toFixed(2)}</span>
              </div>
            </div>
            <div className="summary-right">
              <div className="status-card">
                <div className="status-row">
                  <span className="status-label">DC Status</span>
                  <span className="status-value draft">Draft</span>
                </div>
                <div className="status-row">
                  <span className="status-label">DC Type</span>
                  <span className="status-value">{dcType}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Sales Order</span>
                  <span className="status-value">{selectedSalesOrder || 'N/A'}</span>
                </div>
                <div className="status-row">
                  <span className="status-label">Customer</span>
                  <span className="status-value">{customerData?.name || 'Not Selected'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FOOTER ===== */}
        <div className="form-footer">
          <div className="form-footer-right">
            <button className="btn-secondary" onClick={handlePrint}>
              <FaPrint /> Print
            </button>
            <button className="btn-secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
              {isSubmitting ? <FaSpinner className="spinning" /> : <FaSave />}
              {isSubmitting ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button className="btn-secondary" onClick={handleCancel}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDeliveryChallan;