// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { 
//   FaArrowLeft, FaSave, FaSpinner,  FaPlus, FaTrash,
//   FaInfoCircle,  FaDollarSign, FaPercent,
//     FaListAlt, 
// } from 'react-icons/fa';
// import { useAdminTheme } from '../admin-theme/AdminThemeContext';
// import toast from 'react-hot-toast';

// interface PurchaseInvoiceItem {
//   id: string;
//   itemCode: string;
//   itemName: string;
//   quantity: number;
//   uom: string;
//   rate: number;
//   amount: number;
//   warehouse: string;
//   receivedQty: number;
//   billedQty: number;
// }

// interface TaxRow {
//   id: string;
//   type: string;
//   accountHead: string;
//   taxRate: number;
//   netAmount: number;
//   amount: number;
//   total: number;
// }

// interface PurchaseInvoiceForm {
//   namingSeries: string;
//   supplier: string;
//   supplierCode: string;
//   purchaseOrder: string;
//   status: string;
//   date: string;
//   dueDate: string;
//   currency: string;
//   exchangeRate: number;
//   items: PurchaseInvoiceItem[];
//   taxCategory: string;
//   taxesAndCharges: string;
//   shippingRule: string;
//   incoterm: string;
//   taxes: TaxRow[];
//   additionalDiscount: number;
//   notes: string;
//   paymentTerms: string;
//   bankAccount: string;
//   referenceNumber: string;
// }

// export default function NewPurchaseInvoice() {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const isEditMode = !!id;
  
//   let theme = 'light';
//   try {
//     const context = useAdminTheme();
//     theme = context.theme;
//   } catch (error) {
//     console.log('Using default light theme');
//   }

//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState<{ [key: string]: string }>({});

//   const [formData, setFormData] = useState<PurchaseInvoiceForm>({
//     namingSeries: 'PI-.YYYY.-',
//     supplier: '',
//     supplierCode: '',
//     purchaseOrder: '',
//     status: 'Draft',
//     date: new Date().toISOString().split('T')[0],
//     dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//     currency: 'INR',
//     exchangeRate: 1.0,
//     items: [
//       { id: '1', itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, warehouse: '', receivedQty: 0, billedQty: 0 }
//     ],
//     taxCategory: '',
//     taxesAndCharges: '',
//     shippingRule: '',
//     incoterm: '',
//     taxes: [],
//     additionalDiscount: 0,
//     notes: '',
//     paymentTerms: 'Net 30',
//     bankAccount: '',
//     referenceNumber: ''
//   });

//   const suppliers = ['ABC Manufacturing Co.', 'XYZ Electronics Ltd.', 'PQR Packaging Solutions'];
//   const purchaseOrders = ['PO-2026-001', 'PO-2026-002', 'PO-2026-003'];
//   const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];
//   const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
//   const uomOptions = ['NOS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'ROL', 'SQM', 'CBM'];
//   const warehouses = ['Main Warehouse', 'Raw Material Store', 'Packaging Store', 'Finished Goods Store'];
//   const taxCategories = ['Standard', 'Export', 'SEZ', 'GST', 'VAT'];
//   const shippingRules = ['Free Shipping', 'Flat Rate', 'Weight Based', 'Price Based'];
//   const incoterms = ['EXW', 'FCA', 'FAS', 'FOB', 'CFR', 'CIF', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP'];
//   const taxTypes = ['Tax', 'Charge', 'Cess', 'Surcharge'];
//   const accountHeads = ['GST - 18%', 'GST - 12%', 'GST - 5%', 'Service Tax', 'VAT', 'Customs Duty'];
//   const paymentTermsOptions = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'];

//   useEffect(() => {
//     if (isEditMode) {
//       setLoading(true);
//       setTimeout(() => {
//         setFormData({
//           namingSeries: 'PI-.YYYY.-',
//           supplier: 'ABC Manufacturing Co.',
//           supplierCode: 'SUP-001',
//           purchaseOrder: 'PO-2026-001',
//           status: 'Draft',
//           date: '2026-06-26',
//           dueDate: '2026-07-26',
//           currency: 'INR',
//           exchangeRate: 1.0,
//           items: [
//             { id: '1', itemCode: 'RM-001', itemName: 'Steel Sheets 2mm', quantity: 100, uom: 'NOS', rate: 350, amount: 35000, warehouse: 'Main Warehouse', receivedQty: 100, billedQty: 100 },
//             { id: '2', itemCode: 'RM-002', itemName: 'Aluminum Bars', quantity: 50, uom: 'KG', rate: 250, amount: 12500, warehouse: 'Main Warehouse', receivedQty: 50, billedQty: 50 }
//           ],
//           taxCategory: '',
//           taxesAndCharges: '',
//           shippingRule: '',
//           incoterm: '',
//           taxes: [],
//           additionalDiscount: 0,
//           notes: 'Initial invoice draft',
//           paymentTerms: 'Net 30',
//           bankAccount: 'HDFC Bank - 1234567890',
//           referenceNumber: 'REF-001'
//         });
//         setLoading(false);
//       }, 1000);
//     }
//   }, [isEditMode]);

//   const calculateTotals = () => {
//     const totalQty = formData.items.reduce((sum, item) => sum + item.quantity, 0);
//     const total = formData.items.reduce((sum, item) => sum + item.amount, 0);
//     const taxTotal = formData.taxes.reduce((sum, tax) => sum + tax.amount, 0);
//     const grandTotal = total + taxTotal - formData.additionalDiscount;
//     return { totalQty, total, taxTotal, grandTotal };
//   };

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const handleItemChange = (index: number, field: keyof PurchaseInvoiceItem, value: string | number) => {
//     const updatedItems = [...formData.items];
//     updatedItems[index] = { ...updatedItems[index], [field]: value };
    
//     if (field === 'quantity' || field === 'rate') {
//       const quantity = field === 'quantity' ? Number(value) : updatedItems[index].quantity;
//       const rate = field === 'rate' ? Number(value) : updatedItems[index].rate;
//       updatedItems[index].amount = quantity * rate;
//     }
    
//     setFormData(prev => ({ ...prev, items: updatedItems }));
//   };

//   const addItemRow = () => {
//     const newId = String(formData.items.length + 1);
//     setFormData(prev => ({
//       ...prev,
//       items: [...prev.items, { id: newId, itemCode: '', itemName: '', quantity: 1, uom: 'NOS', rate: 0, amount: 0, warehouse: '', receivedQty: 0, billedQty: 0 }]
//     }));
//   };

//   const removeItemRow = (index: number) => {
//     if (formData.items.length <= 1) return;
//     setFormData(prev => ({
//       ...prev,
//       items: prev.items.filter((_, i) => i !== index)
//     }));
//   };

//   const addTaxRow = () => {
//     const newId = String(formData.taxes.length + 1);
//     setFormData(prev => ({
//       ...prev,
//       taxes: [...prev.taxes, { id: newId, type: 'Tax', accountHead: '', taxRate: 0, netAmount: 0, amount: 0, total: 0 }]
//     }));
//   };

//   const removeTaxRow = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       taxes: prev.taxes.filter((_, i) => i !== index)
//     }));
//   };

//   const handleTaxChange = (index: number, field: keyof TaxRow, value: string | number) => {
//     const updatedTaxes = [...formData.taxes];
//     updatedTaxes[index] = { ...updatedTaxes[index], [field]: value };
//     setFormData(prev => ({ ...prev, taxes: updatedTaxes }));
//   };

//   const validateForm = (): boolean => {
//     const newErrors: { [key: string]: string } = {};
    
//     if (!formData.supplier.trim()) {
//       newErrors.supplier = 'Supplier is required';
//     }
//     if (!formData.date) {
//       newErrors.date = 'Invoice date is required';
//     }
//     if (!formData.dueDate) {
//       newErrors.dueDate = 'Due date is required';
//     }
    
//     let hasValidItem = false;
//     formData.items.forEach((item, index) => {
//       if (item.itemCode || item.itemName) {
//         if (!item.itemCode) {
//           newErrors[`item_${index}_code`] = 'Item code required';
//         }
//         if (item.quantity <= 0) {
//           newErrors[`item_${index}_quantity`] = 'Quantity must be > 0';
//         }
//         if (item.rate <= 0) {
//           newErrors[`item_${index}_rate`] = 'Rate must be > 0';
//         }
//         hasValidItem = true;
//       }
//     });
//     if (!hasValidItem) {
//       newErrors.items = 'At least one item is required';
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!validateForm()) {
//       toast.error('Please fix the errors before submitting');
//       return;
//     }
//     setLoading(true);
//     try {
//       console.log('Purchase Invoice Data:', formData);
//       await new Promise(resolve => setTimeout(resolve, 1500));
//       toast.success(isEditMode ? 'Purchase Invoice updated successfully!' : 'Purchase Invoice created successfully!');
//       navigate('/purchase-invoice');
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to save purchase invoice');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (window.confirm('Are you sure you want to cancel? All unsaved data will be lost.')) {
//       navigate('/purchase-invoice');
//     }
//   };

//   const totals = calculateTotals();

//   return (
//     <div className={`new-purchase-invoice-page ${theme}-theme`}>
//       <style>{`
//         .new-purchase-invoice-page {
//           display: flex;
//           flex-direction: column;
//           height: 100%;
//           background: var(--layout-bg, #f5f7fb);
//           padding: 16px 24px;
//           gap: 16px;
//           overflow-y: auto;
//           font-family: -apple-system, "Inter", "Segoe UI", Roboto, sans-serif;
//           color: var(--text-primary, #1f2433);
//         }

//         .new-purchase-invoice-page::-webkit-scrollbar { width: 4px; }
//         .new-purchase-invoice-page::-webkit-scrollbar-track { background: transparent; }
//         .new-purchase-invoice-page::-webkit-scrollbar-thumb { background: var(--border-color, #e5e7eb); border-radius: 2px; }

//         .page-header {
//           display: flex;
//           align-items: center;
//           justify-content: space-between;
//           flex-wrap: wrap;
//           gap: 8px;
//           flex-shrink: 0;
//           padding-bottom: 12px;
//           border-bottom: 1px solid var(--border-color, #e5e7eb);
//         }

//         .header-left {
//           display: flex;
//           align-items: center;
//           gap: 12px;
//         }

//         .back-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 34px;
//           height: 34px;
//           border-radius: 6px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           background: var(--card-bg, #ffffff);
//           color: var(--text-secondary, #6b7280);
//           cursor: pointer;
//           transition: all 0.2s ease;
//         }

//         .back-btn:hover {
//           background: var(--nav-hover, #f3f4f6);
//           border-color: var(--primary-color, #6366f1);
//           color: var(--primary-color, #6366f1);
//         }

//         .page-title {
//           font-size: 20px;
//           font-weight: 600;
//           color: var(--text-primary, #1f2433);
//           margin: 0;
//         }

//         .header-actions {
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }

//         .btn-primary {
//           display: inline-flex;
//           align-items: center;
//           gap: 5px;
//           padding: 6px 16px;
//           background: var(--primary-color, #6366f1);
//           color: white;
//           border: none;
//           border-radius: 6px;
//           font-size: 12px;
//           font-weight: 500;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .btn-primary:hover {
//           background: var(--primary-hover, #4f46e5);
//           transform: translateY(-1px);
//         }

//         .btn-primary:disabled {
//           opacity: 0.6;
//           cursor: not-allowed;
//           transform: none;
//         }

//         .btn-secondary {
//           display: inline-flex;
//           align-items: center;
//           gap: 5px;
//           padding: 6px 14px;
//           background: var(--card-bg, #ffffff);
//           color: var(--text-primary, #1f2433);
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 6px;
//           font-size: 12px;
//           font-weight: 500;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .btn-secondary:hover {
//           background: var(--layout-bg, #f3f4f6);
//         }

//         .form-section {
//           background: var(--card-bg, #ffffff);
//           border-radius: 10px;
//           padding: 16px 20px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           margin-bottom: 12px;
//         }

//         .form-section:last-child {
//           margin-bottom: 0;
//         }

//         .section-title {
//           font-size: 13px;
//           font-weight: 600;
//           color: var(--text-primary, #1f2433);
//           margin: 0 0 12px 0;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }

//         .section-title .badge-info {
//           font-size: 10px;
//           font-weight: 400;
//           color: var(--text-secondary, #6b7280);
//           background: var(--layout-bg, #f3f4f6);
//           padding: 2px 10px;
//           border-radius: 10px;
//         }

//         .form-grid {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 14px 20px;
//         }

//         .form-group {
//           display: flex;
//           flex-direction: column;
//           gap: 4px;
//         }

//         .form-group.full-width {
//           grid-column: 1 / -1;
//         }

//         .form-group label {
//           font-size: 12px;
//           font-weight: 500;
//           color: var(--text-secondary, #6b7280);
//           display: flex;
//           align-items: center;
//           gap: 4px;
//         }

//         .form-group label .required {
//           color: #ef4444;
//           font-weight: 600;
//         }

//         .form-group input,
//         .form-group select,
//         .form-group textarea {
//           width: 100%;
//           padding: 8px 12px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 6px;
//           font-size: 13px;
//           color: var(--text-primary, #374151);
//           transition: all 0.2s ease;
//           background: var(--input-bg, #ffffff);
//           font-family: inherit;
//         }

//         .form-group input:focus,
//         .form-group select:focus,
//         .form-group textarea:focus {
//           outline: none;
//           border-color: var(--primary-color, #6366f1);
//           box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
//         }

//         .form-group input.error {
//           border-color: var(--danger-color, #ef4444);
//         }

//         .form-group input::placeholder,
//         .form-group textarea::placeholder {
//           color: var(--text-secondary, #9ca3af);
//         }

//         .error-text {
//           font-size: 10px;
//           color: var(--danger-color, #ef4444);
//           margin-top: 2px;
//           display: block;
//         }

//         .field-hint {
//           font-size: 10px;
//           color: var(--text-secondary, #6b7280);
//           margin-top: 3px;
//           display: flex;
//           align-items: center;
//           gap: 4px;
//         }

//         .items-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin: 8px 0 4px 0;
//         }

//         .items-header label {
//           font-size: 12px;
//           font-weight: 500;
//           color: var(--text-secondary, #6b7280);
//         }

//         .add-item-btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 4px;
//           padding: 3px 10px;
//           background: color-mix(in srgb, var(--primary-color) 12%, transparent);
//           color: var(--primary-color, #6366f1);
//           border: none;
//           border-radius: 4px;
//           font-size: 11px;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .add-item-btn:hover {
//           background: color-mix(in srgb, var(--primary-color) 25%, transparent);
//         }

//         .items-table-wrapper {
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 6px;
//           overflow: hidden;
//           margin-top: 4px;
//         }

//         .items-table {
//           width: 100%;
//           border-collapse: collapse;
//           font-size: 12px;
//         }

//         .items-table thead {
//           background: var(--layout-bg, #f8f9fa);
//         }

//         .items-table th {
//           padding: 6px 10px;
//           text-align: left;
//           font-weight: 500;
//           color: var(--text-secondary, #6b7280);
//           border-bottom: 1px solid var(--border-color, #e5e7eb);
//           font-size: 10px;
//           text-transform: uppercase;
//         }

//         .items-table td {
//           padding: 4px 8px;
//           border-bottom: 1px solid var(--border-color, #f3f4f6);
//           vertical-align: middle;
//         }

//         .items-table input,
//         .items-table select {
//           width: 100%;
//           padding: 4px 6px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 4px;
//           font-size: 12px;
//           background: var(--input-bg, #ffffff);
//           color: var(--text-primary, #374151);
//           height: 28px;
//         }

//         .items-table input:focus,
//         .items-table select:focus {
//           outline: none;
//           border-color: var(--primary-color, #6366f1);
//         }

//         .items-table input[type="number"] {
//           width: 70px;
//         }

//         .items-table .amount-cell {
//           font-weight: 500;
//           color: var(--text-primary, #1f2433);
//         }

//         .items-table tfoot {
//           background: var(--layout-bg, #f8f9fa);
//         }

//         .items-table .total-label {
//           text-align: right;
//           font-weight: 600;
//           padding: 6px 10px;
//         }

//         .items-table .total-amount {
//           font-weight: 700;
//           color: var(--primary-color, #6366f1);
//           padding: 6px 10px;
//         }

//         .remove-item-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 24px;
//           height: 24px;
//           background: rgba(239,68,68,0.08);
//           color: var(--danger-color, #ef4444);
//           border: none;
//           border-radius: 4px;
//           font-size: 11px;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .remove-item-btn:hover {
//           background: rgba(239,68,68,0.2);
//         }

//         .tax-table-wrapper {
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 6px;
//           overflow: hidden;
//           margin-top: 4px;
//         }

//         .tax-table {
//           width: 100%;
//           border-collapse: collapse;
//           font-size: 12px;
//         }

//         .tax-table thead {
//           background: var(--layout-bg, #f8f9fa);
//         }

//         .tax-table th {
//           padding: 6px 10px;
//           text-align: left;
//           font-weight: 500;
//           color: var(--text-secondary, #6b7280);
//           border-bottom: 1px solid var(--border-color, #e5e7eb);
//           font-size: 10px;
//           text-transform: uppercase;
//         }

//         .tax-table td {
//           padding: 4px 8px;
//           border-bottom: 1px solid var(--border-color, #f3f4f6);
//           vertical-align: middle;
//         }

//         .tax-table input,
//         .tax-table select {
//           width: 100%;
//           padding: 4px 6px;
//           border: 1px solid var(--border-color, #e5e7eb);
//           border-radius: 4px;
//           font-size: 12px;
//           background: var(--input-bg, #ffffff);
//           color: var(--text-primary, #374151);
//           height: 28px;
//         }

//         .tax-table input:focus,
//         .tax-table select:focus {
//           outline: none;
//           border-color: var(--primary-color, #6366f1);
//         }

//         .tax-table input[type="number"] {
//           width: 80px;
//         }

//         .empty-tax-row {
//           text-align: center;
//           color: var(--text-secondary, #6b7280);
//           padding: 20px !important;
//         }

//         .tax-table tfoot {
//           background: var(--layout-bg, #f8f9fa);
//         }

//         .tax-table .total-label {
//           text-align: right;
//           font-weight: 600;
//           padding: 6px 10px;
//         }

//         .tax-table .total-amount {
//           font-weight: 700;
//           color: var(--primary-color, #6366f1);
//           padding: 6px 10px;
//         }

//         .add-tax-btn {
//           display: inline-flex;
//           align-items: center;
//           gap: 4px;
//           padding: 3px 10px;
//           background: color-mix(in srgb, var(--primary-color) 12%, transparent);
//           color: var(--primary-color, #6366f1);
//           border: none;
//           border-radius: 4px;
//           font-size: 11px;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .add-tax-btn:hover {
//           background: color-mix(in srgb, var(--primary-color) 25%, transparent);
//         }

//         .remove-tax-btn {
//           display: inline-flex;
//           align-items: center;
//           justify-content: center;
//           width: 24px;
//           height: 24px;
//           background: rgba(239,68,68,0.08);
//           color: var(--danger-color, #ef4444);
//           border: none;
//           border-radius: 4px;
//           font-size: 11px;
//           cursor: pointer;
//           transition: all 0.15s ease;
//         }

//         .remove-tax-btn:hover {
//           background: rgba(239,68,68,0.2);
//         }

//         .tax-header {
//           display: flex;
//           justify-content: space-between;
//           align-items: center;
//           margin: 8px 0 4px 0;
//         }

//         .tax-header label {
//           font-size: 12px;
//           font-weight: 500;
//           color: var(--text-secondary, #6b7280);
//         }

//         .totals-grid {
//           display: grid;
//           grid-template-columns: repeat(4, 1fr);
//           gap: 12px;
//         }

//         .total-item {
//           display: flex;
//           flex-direction: column;
//           gap: 2px;
//           padding: 8px 12px;
//           background: var(--layout-bg, #f8f9fa);
//           border-radius: 6px;
//         }

//         .total-item span {
//           font-size: 10px;
//           color: var(--text-secondary, #6b7280);
//         }

//         .total-item strong {
//           font-size: 14px;
//           color: var(--text-primary, #1f2433);
//         }

//         .total-item.grand-total {
//           background: color-mix(in srgb, var(--primary-color) 10%, transparent);
//           border: 1px solid var(--primary-color, #6366f1);
//         }

//         .total-item.grand-total strong {
//           color: var(--primary-color, #6366f1);
//         }

//         .form-actions {
//           display: flex;
//           justify-content: flex-end;
//           gap: 10px;
//           padding-top: 12px;
//           border-top: 1px solid var(--border-color, #e5e7eb);
//           margin-top: 4px;
//         }

//         .spinning {
//           animation: spin 1s linear infinite;
//         }

//         @keyframes spin {
//           to { transform: rotate(360deg); }
//         }

//         @media (max-width: 768px) {
//           .new-purchase-invoice-page { padding: 12px 16px; }
//           .page-header { flex-direction: column; align-items: stretch; }
//           .header-actions { flex-wrap: wrap; }
//           .form-grid { grid-template-columns: 1fr; }
//           .form-section { padding: 14px 16px; }
//           .totals-grid { grid-template-columns: 1fr 1fr; }
//           .items-table { min-width: 500px; }
//           .tax-table { min-width: 500px; }
//         }

//         @media (max-width: 480px) {
//           .new-purchase-invoice-page { padding: 8px 12px; }
//           .page-title { font-size: 18px; }
//           .form-section { padding: 12px; }
//           .totals-grid { grid-template-columns: 1fr; }
//           .form-group input, .form-group select { font-size: 14px; padding: 10px 12px; }
//         }

//         .dark-theme .new-purchase-invoice-page { background: var(--layout-bg, #0f172a); }
//         .dark-theme .page-header { border-bottom-color: var(--border-color, #334155); }
//         .dark-theme .page-title { color: var(--text-primary, #f8fafc); }
//         .dark-theme .back-btn { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-secondary, #94a3b8); }
//         .dark-theme .back-btn:hover { background: var(--nav-hover, rgba(255,255,255,0.05)); border-color: var(--primary-color, #818cf8); color: var(--primary-color, #818cf8); }
//         .dark-theme .form-section { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); }
//         .dark-theme .section-title { color: var(--text-primary, #f8fafc); }
//         .dark-theme .section-title .badge-info { background: var(--layout-bg, #0f172a); color: var(--text-secondary, #94a3b8); }
//         .dark-theme .form-group label { color: var(--text-primary, #e2e8f0); }
//         .dark-theme .form-group input, .dark-theme .form-group select, .dark-theme .form-group textarea { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .form-group input:focus, .dark-theme .form-group select:focus, .dark-theme .form-group textarea:focus { border-color: var(--primary-color, #818cf8); }
//         .dark-theme .form-group input::placeholder, .dark-theme .form-group textarea::placeholder { color: var(--text-secondary, #64748b); }
//         .dark-theme .error-text { color: #f87171; }
//         .dark-theme .form-group input.error { border-color: #f87171; }
//         .dark-theme .btn-secondary { background: var(--card-bg, #1e293b); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .btn-secondary:hover { background: var(--layout-bg, #0f172a); }
//         .dark-theme .btn-primary { background: var(--primary-color, #3b82f6); }
//         .dark-theme .btn-primary:hover { background: var(--primary-hover, #2563eb); }
//         .dark-theme .items-table thead { background: var(--layout-bg, #0f172a); }
//         .dark-theme .items-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
//         .dark-theme .items-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .items-table input, .dark-theme .items-table select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .items-table tfoot { background: var(--layout-bg, #0f172a); }
//         .dark-theme .items-table .amount-cell { color: var(--text-primary, #f8fafc); }
//         .dark-theme .add-item-btn { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
//         .dark-theme .add-item-btn:hover { background: rgba(99,102,241,0.3); }
//         .dark-theme .remove-item-btn { background: rgba(239,68,68,0.15); color: #f87171; }
//         .dark-theme .remove-item-btn:hover { background: rgba(239,68,68,0.25); }
//         .dark-theme .tax-table thead { background: var(--layout-bg, #0f172a); }
//         .dark-theme .tax-table th { color: var(--text-secondary, #94a3b8); border-bottom-color: var(--border-color, #334155); }
//         .dark-theme .tax-table td { border-bottom-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .tax-table input, .dark-theme .tax-table select { background: var(--input-bg, #0f172a); border-color: var(--border-color, #334155); color: var(--text-primary, #f8fafc); }
//         .dark-theme .tax-table tfoot { background: var(--layout-bg, #0f172a); }
//         .dark-theme .add-tax-btn { background: rgba(99,102,241,0.2); color: var(--primary-color, #818cf8); }
//         .dark-theme .add-tax-btn:hover { background: rgba(99,102,241,0.3); }
//         .dark-theme .remove-tax-btn { background: rgba(239,68,68,0.15); color: #f87171; }
//         .dark-theme .remove-tax-btn:hover { background: rgba(239,68,68,0.25); }
//         .dark-theme .empty-tax-row { color: var(--text-secondary, #64748b); }
//         .dark-theme .total-item { background: var(--layout-bg, #0f172a); }
//         .dark-theme .total-item strong { color: var(--text-primary, #f8fafc); }
//         .dark-theme .total-item.grand-total { background: rgba(99,102,241,0.12); }
//         .dark-theme .total-item.grand-total strong { color: var(--primary-color, #818cf8); }
//         .dark-theme .form-actions { border-top-color: var(--border-color, #334155); }
//         .dark-theme .field-hint { color: var(--text-secondary, #64748b); }
//       `}</style>

//       {/* Header */}
//       <div className="page-header">
//         <div className="header-left">
//           <button className="back-btn" onClick={handleCancel}>
//             <FaArrowLeft size={16} />
//           </button>
//           <h1 className="page-title">{isEditMode ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h1>
//         </div>
//         <div className="header-actions">
//           <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
//           <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
//             {loading && <FaSpinner className="spinning" />}
//             <FaSave size={14} /> {isEditMode ? 'Update' : 'Save'}
//           </button>
//         </div>
//       </div>

//       <form onSubmit={handleSubmit}>
//         {/* Basic Details */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaInfoCircle size={14} /> Basic Details
//           </div>
//           <div className="form-grid">
//             <div className="form-group">
//               <label>Series</label>
//               <input type="text" name="namingSeries" value={formData.namingSeries} disabled style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }} />
//             </div>
//             <div className="form-group">
//               <label>Supplier <span className="required">*</span></label>
//               <select name="supplier" value={formData.supplier} onChange={handleInputChange} className={errors.supplier ? 'error' : ''}>
//                 <option value="">Begin typing for results...</option>
//                 {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//               {errors.supplier && <span className="error-text">{errors.supplier}</span>}
//             </div>
//             <div className="form-group">
//               <label>Supplier Code</label>
//               <input type="text" name="supplierCode" value={formData.supplierCode} onChange={handleInputChange} placeholder="SUP-001" />
//             </div>
//             <div className="form-group">
//               <label>Purchase Order</label>
//               <select name="purchaseOrder" value={formData.purchaseOrder} onChange={handleInputChange}>
//                 <option value="">Select PO...</option>
//                 {purchaseOrders.map(po => <option key={po} value={po}>{po}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Status</label>
//               <select name="status" value={formData.status} onChange={handleInputChange}>
//                 {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Invoice Date <span className="required">*</span></label>
//               <input type="date" name="date" value={formData.date} onChange={handleInputChange} className={errors.date ? 'error' : ''} />
//               {errors.date && <span className="error-text">{errors.date}</span>}
//             </div>
//             <div className="form-group">
//               <label>Due Date <span className="required">*</span></label>
//               <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} className={errors.dueDate ? 'error' : ''} />
//               {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
//             </div>
//           </div>
//         </div>

//         {/* Currency and Payment */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaDollarSign size={14} /> Currency and Payment
//           </div>
//           <div className="form-grid">
//             <div className="form-group">
//               <label>Currency</label>
//               <select name="currency" value={formData.currency} onChange={handleInputChange}>
//                 {currencies.map(c => <option key={c} value={c}>{c}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Exchange Rate</label>
//               <input type="number" name="exchangeRate" value={formData.exchangeRate} onChange={handleInputChange} step="0.000000001" min="0" />
//             </div>
//             <div className="form-group">
//               <label>Payment Terms</label>
//               <select name="paymentTerms" value={formData.paymentTerms} onChange={handleInputChange}>
//                 {paymentTermsOptions.map(p => <option key={p} value={p}>{p}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Reference Number</label>
//               <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleInputChange} placeholder="REF-001" />
//             </div>
//             <div className="form-group full-width">
//               <label>Bank Account</label>
//               <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} placeholder="Bank Name - Account Number" />
//             </div>
//           </div>
//         </div>

//         {/* Items */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaListAlt size={14} /> Items
//           </div>
//           {errors.items && <span className="error-text">{errors.items}</span>}
//           <div className="items-header">
//             <label>Items</label>
//             <button type="button" className="add-item-btn" onClick={addItemRow}>
//               <FaPlus size={11} /> Add Item
//             </button>
//           </div>
//           <div className="items-table-wrapper">
//             <table className="items-table">
//               <thead>
//                 <tr>
//                   <th>No.</th>
//                   <th>Item Code</th>
//                   <th>Quantity</th>
//                   <th>UOM</th>
//                   <th>Rate</th>
//                   <th>Amount</th>
//                   <th>Warehouse</th>
//                   <th>Received</th>
//                   <th>Billed</th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {formData.items.map((item, index) => (
//                   <tr key={item.id}>
//                     <td className="text-center">{index + 1}</td>
//                     <td>
//                       <input type="text" value={item.itemCode} onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)} placeholder="Code" className={errors[`item_${index}_code`] ? 'error' : ''} />
//                       {errors[`item_${index}_code`] && <span className="error-text">{errors[`item_${index}_code`]}</span>}
//                     </td>
//                     <td>
//                       <input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))} min="1" className={errors[`item_${index}_quantity`] ? 'error' : ''} />
//                       {errors[`item_${index}_quantity`] && <span className="error-text">{errors[`item_${index}_quantity`]}</span>}
//                     </td>
//                     <td>
//                       <select value={item.uom} onChange={(e) => handleItemChange(index, 'uom', e.target.value)}>
//                         {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
//                       </select>
//                     </td>
//                     <td>
//                       <input type="number" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))} min="0" step="0.01" className={errors[`item_${index}_rate`] ? 'error' : ''} />
//                       {errors[`item_${index}_rate`] && <span className="error-text">{errors[`item_${index}_rate`]}</span>}
//                     </td>
//                     <td className="amount-cell">{formData.currency} {item.amount.toFixed(2)}</td>
//                     <td>
//                       <select value={item.warehouse} onChange={(e) => handleItemChange(index, 'warehouse', e.target.value)}>
//                         <option value="">Select</option>
//                         {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
//                       </select>
//                     </td>
//                     <td>
//                       <input type="number" value={item.receivedQty} onChange={(e) => handleItemChange(index, 'receivedQty', Number(e.target.value))} min="0" />
//                     </td>
//                     <td>
//                       <input type="number" value={item.billedQty} onChange={(e) => handleItemChange(index, 'billedQty', Number(e.target.value))} min="0" />
//                     </td>
//                     <td>
//                       {formData.items.length > 1 && (
//                         <button type="button" className="remove-item-btn" onClick={() => removeItemRow(index)}>
//                           <FaTrash size={11} />
//                         </button>
//                       )}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan={3} className="total-label">Total Quantity</td>
//                   <td className="total-amount">{totals.totalQty}</td>
//                   <td></td>
//                   <td className="total-amount">{formData.currency} {totals.total.toFixed(2)}</td>
//                   <td></td><td></td><td></td><td></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>

//         {/* Taxes */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaPercent size={14} /> Taxes and Charges
//           </div>
//           <div className="form-grid">
//             <div className="form-group">
//               <label>Tax Category</label>
//               <select name="taxCategory" value={formData.taxCategory} onChange={handleInputChange}>
//                 <option value="">Begin typing for results...</option>
//                 {taxCategories.map(t => <option key={t} value={t}>{t}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Purchase Taxes and Charges Template</label>
//               <select name="taxesAndCharges" value={formData.taxesAndCharges} onChange={handleInputChange}>
//                 <option value="">Begin typing for results...</option>
//                 <option value="GST-18">GST 18%</option>
//                 <option value="GST-12">GST 12%</option>
//                 <option value="GST-5">GST 5%</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Shipping Rule</label>
//               <select name="shippingRule" value={formData.shippingRule} onChange={handleInputChange}>
//                 <option value="">Begin typing for results...</option>
//                 {shippingRules.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Incoterm</label>
//               <select name="incoterm" value={formData.incoterm} onChange={handleInputChange}>
//                 <option value="">Begin typing for results...</option>
//                 {incoterms.map(i => <option key={i} value={i}>{i}</option>)}
//               </select>
//             </div>
//           </div>

//           <div className="tax-header">
//             <label>Purchase Taxes and Charges</label>
//             <button type="button" className="add-tax-btn" onClick={addTaxRow}>
//               <FaPlus size={11} /> Add Tax
//             </button>
//           </div>
//           <div className="tax-table-wrapper">
//             <table className="tax-table">
//               <thead>
//                 <tr>
//                   <th>No.</th>
//                   <th>Type</th>
//                   <th>Account Head</th>
//                   <th>Tax Rate %</th>
//                   <th>Net Amount</th>
//                   <th>Amount</th>
//                   <th>Total</th>
//                   <th></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {formData.taxes.length === 0 ? (
//                   <tr><td colSpan={8} className="empty-tax-row">No rows</td></tr>
//                 ) : (
//                   formData.taxes.map((tax, index) => (
//                     <tr key={tax.id}>
//                       <td className="text-center">{index + 1}</td>
//                       <td>
//                         <select value={tax.type} onChange={(e) => handleTaxChange(index, 'type', e.target.value)}>
//                           {taxTypes.map(t => <option key={t} value={t}>{t}</option>)}
//                         </select>
//                       </td>
//                       <td>
//                         <select value={tax.accountHead} onChange={(e) => handleTaxChange(index, 'accountHead', e.target.value)}>
//                           <option value="">Select...</option>
//                           {accountHeads.map(a => <option key={a} value={a}>{a}</option>)}
//                         </select>
//                       </td>
//                       <td>
//                         <input type="number" value={tax.taxRate} onChange={(e) => handleTaxChange(index, 'taxRate', Number(e.target.value))} min="0" step="0.01" />
//                       </td>
//                       <td>{formData.currency} 0.00</td>
//                       <td>{formData.currency} 0.00</td>
//                       <td>{formData.currency} 0.00</td>
//                       <td>
//                         <button type="button" className="remove-tax-btn" onClick={() => removeTaxRow(index)}>
//                           <FaTrash size={10} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//               <tfoot>
//                 <tr>
//                   <td colSpan={6} className="total-label">Total Taxes and Charges</td>
//                   <td className="total-amount">{formData.currency} {totals.taxTotal.toFixed(2)}</td>
//                   <td></td>
//                 </tr>
//               </tfoot>
//             </table>
//           </div>
//         </div>

//         {/* Additional Discount */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaPercent size={14} /> Additional Discount
//           </div>
//           <div className="form-grid">
//             <div className="form-group">
//               <label>Additional Discount</label>
//               <input type="number" name="additionalDiscount" value={formData.additionalDiscount} onChange={handleInputChange} min="0" step="0.01" placeholder="0.00" />
//             </div>
//           </div>
//         </div>

//         {/* Totals */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaDollarSign size={14} /> Totals
//           </div>
//           <div className="totals-grid">
//             <div className="total-item">
//               <span>Total</span>
//               <strong>{formData.currency} {totals.total.toFixed(2)}</strong>
//             </div>
//             <div className="total-item">
//               <span>Net Total</span>
//               <strong>{formData.currency} {totals.total.toFixed(2)}</strong>
//             </div>
//             <div className="total-item">
//               <span>Taxes & Charges</span>
//               <strong>{formData.currency} {totals.taxTotal.toFixed(2)}</strong>
//             </div>
//             <div className="total-item grand-total">
//               <span>Grand Total</span>
//               <strong>{formData.currency} {totals.grandTotal.toFixed(2)}</strong>
//             </div>
//           </div>
//         </div>

//         {/* Notes */}
//         <div className="form-section">
//           <div className="section-title">
//             <FaInfoCircle size={14} /> Notes
//           </div>
//           <div className="form-grid">
//             <div className="form-group full-width">
//               <label>Notes</label>
//               <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Add any additional notes..." rows={3} />
//             </div>
//           </div>
//         </div>

//         {/* Form Actions */}
//         <div className="form-actions">
//           <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
//           <button type="submit" className="btn-primary" disabled={loading}>
//             {loading && <FaSpinner className="spinning" />}
//             <FaSave size={14} /> {isEditMode ? 'Update Invoice' : 'Create Invoice'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }