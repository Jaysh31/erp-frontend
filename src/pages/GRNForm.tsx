// GRNForm.tsx
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
  FaPlus,
  FaTrash,
  FaWarehouse,
  FaTruck,
  FaFileInvoice,
  FaUser,
  FaCalendar,
  FaHashtag,
  FaBuilding,
  FaBox,
} from 'react-icons/fa';
import "./GRNForm.css";
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import api from '../services/api';

interface GRNItem {
  id: string;
  itemCode: string;
  itemName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  uom: string;
  rate: number;
  batchNo: string;
  expiryDate: string;
  remarks: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

interface GRNData {
  id?: string;
  grnNo: string;
  grnDate: string;
  supplier: string;
  purchaseOrder: string;
  warehouse: string;
  receivedBy: string;
  vehicleNo: string;
  deliveryChallanNo: string;
  invoiceNo: string;
  status: 'draft' | 'submitted' | 'completed' | 'rejected';
  items: GRNItem[];
}

export default function GRNForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = id === "new";
  const isEditMode = !isNew && Boolean(id);

  // ─── Form State ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<GRNData>({
    grnNo: '',
    grnDate: new Date().toISOString().split('T')[0],
    supplier: '',
    purchaseOrder: '',
    warehouse: '',
    receivedBy: '',
    vehicleNo: '',
    deliveryChallanNo: '',
    invoiceNo: '',
    status: 'draft',
    items: [],
  });

  const [, setIsDirty] = useState(isNew);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(isEditMode);

  // ─── Fetch GRN data for edit mode ────────────────────────────────────
  useEffect(() => {
    if (isEditMode && id) {
      fetchGRNData(id);
    }
  }, [id, isEditMode]);

  const fetchGRNData = async (grnId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/grn/${grnId}`);
      if (response.data.success === 1) {
        const data = response.data.data;
        setFormData({
          grnNo: data.grn_no || '',
          grnDate: data.grn_date || new Date().toISOString().split('T')[0],
          supplier: data.supplier || '',
          purchaseOrder: data.purchase_order || '',
          warehouse: data.warehouse || '',
          receivedBy: data.received_by || '',
          vehicleNo: data.vehicle_no || '',
          deliveryChallanNo: data.delivery_challan_no || '',
          invoiceNo: data.invoice_no || '',
          status: data.status || 'draft',
          items: data.items || [],
        });
      }
    } catch (err) {
      console.error('Error fetching GRN:', err);
      setApiError('Failed to load GRN data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Validation ──────────────────────────────────────────────────────
  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.supplier.trim()) {
      allErrors.push({ field: 'supplier', label: 'Supplier', message: 'Supplier is required' });
    }
    if (!formData.purchaseOrder.trim()) {
      allErrors.push({ field: 'purchaseOrder', label: 'Purchase Order', message: 'Purchase Order is required' });
    }
    if (!formData.warehouse.trim()) {
      allErrors.push({ field: 'warehouse', label: 'Warehouse', message: 'Warehouse is required' });
    }
    if (!formData.receivedBy.trim()) {
      allErrors.push({ field: 'receivedBy', label: 'Received By', message: 'Received By is required' });
    }
    if (formData.items.length === 0) {
      allErrors.push({ field: 'items', label: 'Items', message: 'At least one item is required' });
    }

    formData.items.forEach((item, index) => {
      if (!item.itemCode.trim()) {
        allErrors.push({ field: `items[${index}].itemCode`, label: `Item ${index + 1} Code`, message: 'Item code is required' });
      }
      if (!item.itemName.trim()) {
        allErrors.push({ field: `items[${index}].itemName`, label: `Item ${index + 1} Name`, message: 'Item name is required' });
      }
      if (item.receivedQty <= 0) {
        allErrors.push({ field: `items[${index}].receivedQty`, label: `Item ${index + 1} Received Qty`, message: 'Received quantity must be greater than 0' });
      }
      if (item.acceptedQty < 0) {
        allErrors.push({ field: `items[${index}].acceptedQty`, label: `Item ${index + 1} Accepted Qty`, message: 'Accepted quantity cannot be negative' });
      }
      if (item.rejectedQty < 0) {
        allErrors.push({ field: `items[${index}].rejectedQty`, label: `Item ${index + 1} Rejected Qty`, message: 'Rejected quantity cannot be negative' });
      }
      if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
        allErrors.push({ field: `items[${index}].acceptedQty`, label: `Item ${index + 1} Quantities`, message: 'Accepted + Rejected cannot exceed Received quantity' });
      }
    });

    return allErrors;
  };

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleFieldChange = (field: keyof GRNData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleItemChange = (index: number, field: keyof GRNItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Auto-calculate accepted/rejected if needed
    if (field === 'receivedQty' || field === 'acceptedQty' || field === 'rejectedQty') {
      const item = updatedItems[index];
      // If received qty changes and accepted+rejected > received, adjust
      if (item.acceptedQty + item.rejectedQty > item.receivedQty) {
        if (field === 'receivedQty') {
          // Keep accepted and rejected as is, but they'll be validated
        }
      }
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
    setIsDirty(true);
  };

  const addItem = () => {
    const newItem: GRNItem = {
      id: Date.now().toString(),
      itemCode: '',
      itemName: '',
      orderedQty: 0,
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      uom: '',
      rate: 0,
      batchNo: '',
      expiryDate: '',
      remarks: '',
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setIsDirty(true);
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  };

  const fetchPOItems = async () => {
    if (!formData.purchaseOrder) {
      setApiError('Please select a Purchase Order first');
      return;
    }

    try {
      const response = await api.get(`/purchase-order/${formData.purchaseOrder}/items`);
      if (response.data.success === 1) {
        const items = response.data.data.map((item: any) => ({
          id: Date.now().toString() + Math.random(),
          itemCode: item.item_code || '',
          itemName: item.item_name || '',
          orderedQty: item.quantity || 0,
          receivedQty: 0,
          acceptedQty: 0,
          rejectedQty: 0,
          uom: item.uom || '',
          rate: item.rate || 0,
          batchNo: '',
          expiryDate: '',
          remarks: '',
        }));
        setFormData(prev => ({ ...prev, items }));
        setIsDirty(true);
      }
    } catch (err) {
      console.error('Error fetching PO items:', err);
      setApiError('Failed to fetch PO items');
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
        grn_no: formData.grnNo || `GRN-${Date.now()}`,
        grn_date: formData.grnDate,
        supplier: formData.supplier,
        purchase_order: formData.purchaseOrder,
        warehouse: formData.warehouse,
        received_by: formData.receivedBy,
        vehicle_no: formData.vehicleNo,
        delivery_challan_no: formData.deliveryChallanNo,
        invoice_no: formData.invoiceNo,
        status: formData.status,
        items: formData.items.map(item => ({
          item_code: item.itemCode,
          item_name: item.itemName,
          ordered_qty: item.orderedQty,
          received_qty: item.receivedQty,
          accepted_qty: item.acceptedQty,
          rejected_qty: item.rejectedQty,
          uom: item.uom,
          rate: item.rate,
          batch_no: item.batchNo,
          expiry_date: item.expiryDate,
          remarks: item.remarks,
        })),
      };

      let response;
      if (isEditMode && id) {
        response = await api.put(`/grn/${id}`, payload);
      } else {
        response = await api.post('/grn', payload);
      }

      if (response.data && response.data.success === 1) {
        console.log('GRN saved successfully:', response.data);
        setIsDirty(false);
        navigate('/grn');
      } else {
        setApiError(response.data?.message || 'Failed to save GRN');
      }
    } catch (err: any) {
      console.error('Error saving GRN:', err);

      if (err.response) {
        if (err.response.status === 409) {
          setApiError('A GRN with this number already exists');
        } else if (err.response.status === 400) {
          setApiError(err.response.data?.message || 'Invalid data provided');
        } else {
          setApiError(err.response.data?.message || 'Failed to save GRN');
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
      <div className="grnf-page">
        <div className="grnf-inner">
          <div className="grnf-loading">Loading GRN data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`grnf-page ${theme}`}>
      <div className="grnf-inner">

        {/* ─── Validation Summary Modal ────────────────────────────── */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="grnf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="grnf-validation-modal" onClick={(e) => e.stopPropagation()}>
              <div className="grnf-modal-header">
                <h2>
                  <FaExclamationTriangle /> Missing Required Fields
                </h2>
                <button className="grnf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="grnf-modal-body">
                <p className="grnf-modal-description">
                  Please fill in the following required fields before submitting:
                </p>
                <div className="grnf-validation-errors-list">
                  {validationErrors.map((error, idx) => (
                    <div key={idx} className="grnf-validation-error-item">
                      <div className="grnf-error-header">
                        <FaTimesCircle className="grnf-error-icon" />
                        <strong>{error.label}</strong>
                      </div>
                      <div className="grnf-error-message">{error.message}</div>
                    </div>
                  ))}
                </div>
                <div className="grnf-validation-tip">
                  <FaInfoCircle className="grnf-tip-icon" />
                  Please fix the errors above before submitting
                </div>
              </div>
              <div className="grnf-modal-footer">
                <button className="grnf-btn-cancel" onClick={() => setShowValidationSummary(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── API Error Display ────────────────────────────────────── */}
        {apiError && (
          <div className="grnf-api-error">
            <FaExclamationCircle className="grnf-error-icon" />
            <span>{apiError}</span>
            <button className="grnf-error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* ─── Header ────────────────────────────────────────────────── */}
        <div className="grnf-header">
          <button onClick={() => navigate('/grn')} className="grnf-back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="grnf-header-title">
            <h1>{isNew ? 'New Goods Receipt Note' : `Edit: ${formData.grnNo}`}</h1>
          </div>
          {hasErrors && (
            <div className="grnf-error-badge">
              <FaExclamationTriangle size={12} />
              {getAllValidationErrors().length} missing field{getAllValidationErrors().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSave}>

          {/* ─── Main Form Card ────────────────────────────────────────── */}
          <div className="grnf-card">

            {/* Header Info */}
            <span className="grnf-section-title">Receipt Information</span>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />GRN Number
                </label>
                <input
                  type="text"
                  value={formData.grnNo}
                  onChange={(e) => handleFieldChange('grnNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Auto-generated"
                  disabled={!isNew || submitting}
                />
                {isNew && <p className="grnf-field-hint">Auto-generated on save</p>}
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaCalendar className="grnf-label-icon" />GRN Date <span className="grnf-required">*</span>
                </label>
                <input
                  type="date"
                  value={formData.grnDate}
                  onChange={(e) => handleFieldChange('grnDate', e.target.value)}
                  className={`grnf-form-field${errors.grnDate ? ' grnf-field-error' : ''}`}
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaUser className="grnf-label-icon" />Received By <span className="grnf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => handleFieldChange('receivedBy', e.target.value)}
                  className={`grnf-form-field${errors.receivedBy ? ' grnf-field-error' : ''}`}
                  placeholder="Enter employee name"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaBuilding className="grnf-label-icon" />Supplier <span className="grnf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => handleFieldChange('supplier', e.target.value)}
                  className={`grnf-form-field${errors.supplier ? ' grnf-field-error' : ''}`}
                  placeholder="Select or enter supplier name"
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />Purchase Order <span className="grnf-required">*</span>
                </label>
                <div className="grnf-field-with-button">
                  <input
                    type="text"
                    value={formData.purchaseOrder}
                    onChange={(e) => handleFieldChange('purchaseOrder', e.target.value)}
                    className={`grnf-form-field${errors.purchaseOrder ? ' grnf-field-error' : ''}`}
                    placeholder="Enter PO number"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="grnf-fetch-btn"
                    onClick={fetchPOItems}
                    disabled={submitting || !formData.purchaseOrder}
                  >
                    Fetch Items
                  </button>
                </div>
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaWarehouse className="grnf-label-icon" />Warehouse <span className="grnf-required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.warehouse}
                  onChange={(e) => handleFieldChange('warehouse', e.target.value)}
                  className={`grnf-form-field${errors.warehouse ? ' grnf-field-error' : ''}`}
                  placeholder="Select warehouse"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grnf-divider" />

            {/* Delivery Details */}
            <span className="grnf-section-title">Delivery Details</span>

            <div className="grnf-grid-3">
              <div className="grnf-field">
                <label className="grnf-label">
                  <FaTruck className="grnf-label-icon" />Vehicle Number
                </label>
                <input
                  type="text"
                  value={formData.vehicleNo}
                  onChange={(e) => handleFieldChange('vehicleNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter vehicle number"
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaHashtag className="grnf-label-icon" />Delivery Challan No.
                </label>
                <input
                  type="text"
                  value={formData.deliveryChallanNo}
                  onChange={(e) => handleFieldChange('deliveryChallanNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter delivery challan number"
                  disabled={submitting}
                />
              </div>

              <div className="grnf-field">
                <label className="grnf-label">
                  <FaFileInvoice className="grnf-label-icon" />Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoiceNo}
                  onChange={(e) => handleFieldChange('invoiceNo', e.target.value)}
                  className="grnf-form-field"
                  placeholder="Enter supplier invoice number"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="grnf-divider" />

            {/* Status */}
            <div className="grnf-field">
              <label className="grnf-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleFieldChange('status', e.target.value as any)}
                className="grnf-form-field"
                disabled={submitting}
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="grnf-divider" />

            {/* Items Table */}
            <div className="grnf-items-section">
              <div className="grnf-items-header">
                <span className="grnf-section-title" style={{ marginBottom: 0, borderBottom: 'none' }}>Items</span>
                <button type="button" className="grnf-add-item-btn" onClick={addItem} disabled={submitting}>
                  <FaPlus size={12} /> Add Item
                </button>
              </div>

              {formData.items.length === 0 ? (
                <div className="grnf-empty-items">
                  <FaBox size={32} />
                  <p>No items added</p>
                  <span>Click "Add Item" or fetch from PO</span>
                </div>
              ) : (
                <div className="grnf-table-block">
                  <table className="grnf-items-table">
                    <thead>
                      <tr>
                        <th className="grnf-ith">#</th>
                        <th className="grnf-ith">Item Code <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Item Name <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Ordered</th>
                        <th className="grnf-ith">Received <span className="grnf-required">*</span></th>
                        <th className="grnf-ith">Accepted</th>
                        <th className="grnf-ith">Rejected</th>
                        <th className="grnf-ith">UOM</th>
                        <th className="grnf-ith">Rate</th>
                        <th className="grnf-ith">Batch</th>
                        <th className="grnf-ith">Expiry</th>
                        <th className="grnf-ith">Remarks</th>
                        <th className="grnf-ith grnf-ith-action">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={item.id} className="grnf-itr">
                          <td className="grnf-itd grnf-itd-no">{index + 1}</td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.itemCode}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              placeholder="Code"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              placeholder="Name"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.orderedQty}
                              onChange={(e) => handleItemChange(index, 'orderedQty', parseFloat(e.target.value) || 0)}
                              disabled
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.receivedQty}
                              onChange={(e) => handleItemChange(index, 'receivedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.acceptedQty}
                              onChange={(e) => handleItemChange(index, 'acceptedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.rejectedQty}
                              onChange={(e) => handleItemChange(index, 'rejectedQty', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, 'uom', e.target.value)}
                              placeholder="UOM"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="number"
                              className="grnf-cell-input"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.batchNo}
                              onChange={(e) => handleItemChange(index, 'batchNo', e.target.value)}
                              placeholder="Batch"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              type="date"
                              className="grnf-cell-input"
                              value={item.expiryDate}
                              onChange={(e) => handleItemChange(index, 'expiryDate', e.target.value)}
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <input
                              className="grnf-cell-input"
                              value={item.remarks}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Remarks"
                              disabled={submitting}
                            />
                          </td>
                          <td className="grnf-itd">
                            <button
                              className="grnf-remove-item"
                              onClick={() => removeItem(index)}
                              type="button"
                              disabled={submitting || formData.items.length <= 1}
                            >
                              <FaTrash size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <div className="grnf-footer">
            <button
              type="button"
              onClick={() => navigate('/grn')}
              className="grnf-cancel-btn"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="grnf-submit-btn"
            >
              {submitting && <FaSpinner className="grnf-spinning" />}
              <FaSave size={12} />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}