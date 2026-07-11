import { useState, useEffect, useRef } from 'react';
import {
  FaPlus, FaSave, FaSpinner, FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle, FaTag, FaBuilding, FaMoneyBillWave,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaReceipt, FaClock, FaSearch, FaCheckCircle,
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseInvoiceForm.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface POItem {
  id: number;            // PO item row id — used as the join key with GRN item_id
  item_code: string;
  item_name: string;
  qty: number;           // ordered qty
  uom: string;
  rate: number;
  amount: number;
  received_qty: number;  // as on PO record (may lag; we recalculate from GRNs)
  billed_amt: number;
  item_tax_rate?: string;
}

interface PODetail {
  id: number;
  name: string;
  supplier: string;
  supplier_name: string;
  currency: string;
  company: string;
  status: string;
  taxes_and_charges?: string;
  tax_category?: string;
  total_taxes_and_charges?: number;
  base_total_taxes_and_charges?: number;
  items: POItem[];
}

interface GRNItem {
  id: number;
  grn_id: number;
  item_id: number;       // maps to POItem.id
  item_code: string;
  item_name: string;
  ordered_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  uom: string;
  rate: number;
  amount: number;
}

interface GRNRecord {
  id: number;
  grn_number: string;
  grn_date: string;
  purchase_order_id: number;
  purchase_order_number: string;
  supplier_name: string;
  warehouse_name: string;
  status: string;
  total_received_qty: number;
  items: GRNItem[];
}

// What gets billed — one row per PO item, aggregated across all GRNs
interface InvoiceItem {
  po_item_id: number;     // POItem.id
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  ordered_qty: number;
  total_received_qty: number;   // sum across all GRNs
  unbilled_qty: number;         // received − already billed
  bill_qty: number;             // editable — what user wants to bill now
  amount: number;               // bill_qty × rate (computed)
  grn_refs: string[];           // GRN numbers that contributed to received qty
  tax_rate: number;
}

interface ValidationError { field: string; label: string; message: string; }

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];
const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PurchaseInvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const { theme } = useAdminTheme();

  // ── Core form state ────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    status: 'Draft' as typeof statusOptions[number],
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    currency: 'INR',
    notes: '',
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // ── PO selection state ─────────────────────────────────────────────────────
  const [poList, setPoList] = useState<{ id: number; name: string; supplier_name: string; status: string }[]>([]);
  const [selectedPO, setSelectedPO] = useState<PODetail | null>(null);
  const [loadingPOList, setLoadingPOList] = useState(false);
  const [loadingPODetail, setLoadingPODetail] = useState(false);

  // ── GRN state ──────────────────────────────────────────────────────────────
  const [grnsForPO, setGrnsForPO] = useState<GRNRecord[]>([]);
  const [loadingGRNs, setLoadingGRNs] = useState(false);

  // ── Supplier state (for display only, derived from PO) ────────────────────
  const [supplierName, setSupplierName] = useState('');
  const [supplierCode, setSupplierCode] = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── PO search ──────────────────────────────────────────────────────────────
  const [poSearch, setPoSearch] = useState('');
  const [showPODropdown, setShowPODropdown] = useState(false);
  const poSearchRef = useRef<HTMLDivElement>(null);

  // ─── Fetch PO list on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchPOList();
    if (isEdit && id) loadExistingInvoice(id);

    const handleOutsideClick = (e: MouseEvent) => {
      if (poSearchRef.current && !poSearchRef.current.contains(e.target as Node)) {
        setShowPODropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchPOList = async () => {
    setLoadingPOList(true);
    try {
      const res = await api.get('/purchase-order?limit=200');
      if (res.data?.success === 1) {
        setPoList(res.data.data?.records || []);
      }
    } catch (err) {
      console.error('Error fetching PO list:', err);
    } finally {
      setLoadingPOList(false);
    }
  };

  // ─── When a PO is selected — fetch PO detail + all GRNs for that PO ───────
  const handleSelectPO = async (po: { id: number; name: string; supplier_name: string }) => {
    setPoSearch(po.name);
    setShowPODropdown(false);
    setSelectedPO(null);
    setGrnsForPO([]);
    setItems([]);
    setSupplierName('');
    setSupplierCode('');

    setLoadingPODetail(true);
    setLoadingGRNs(true);

    try {
      // Fetch PO detail and GRNs in parallel
      const [poRes, grnRes] = await Promise.all([
        api.get(`/purchase-order/${po.id}`),
        api.get(`/grn?purchase_order_id=${po.id}&limit=200`),
      ]);

      let poDetail: PODetail | null = null;
      let grns: GRNRecord[] = [];

      if (poRes.data?.success === 1) {
        poDetail = poRes.data.data as PODetail;
        setSelectedPO(poDetail);
        setSupplierName(poDetail.supplier_name || '');
        setSupplierCode(poDetail.supplier || '');
        setFormData(prev => ({ ...prev, currency: poDetail!.currency || 'INR' }));
      } else {
        toast.error('Failed to load PO details');
      }

      // GRN list response — handle both array and paginated shape
      if (grnRes.data?.success === 1) {
        const raw = grnRes.data.data;
        grns = Array.isArray(raw) ? raw : (raw?.records || []);
        setGrnsForPO(grns);
      }

      // If we got PO items, build the invoice rows
      if (poDetail?.items?.length) {
        buildInvoiceItems(poDetail.items, grns);
      }
    } catch (err) {
      console.error('Error loading PO/GRN:', err);
      toast.error('Error loading PO data');
    } finally {
      setLoadingPODetail(false);
      setLoadingGRNs(false);
    }
  };

  /**
   * Core logic: for each PO item, sum received_qty across all GRNs where
   * grn.items[].item_id === poItem.id, then subtract billed_amt/rate to get
   * unbilled qty. The user can then edit bill_qty up to unbilled_qty.
   */
  const buildInvoiceItems = (poItems: POItem[], grns: GRNRecord[]) => {
    // Build a map: po_item_id → { total_received, grn_refs }
    const receivedMap: Record<number, { qty: number; grnNums: string[] }> = {};

    grns.forEach(grn => {
      grn.items?.forEach(gi => {
        if (!receivedMap[gi.item_id]) {
          receivedMap[gi.item_id] = { qty: 0, grnNums: [] };
        }
        receivedMap[gi.item_id].qty += gi.received_qty;
        if (!receivedMap[gi.item_id].grnNums.includes(grn.grn_number)) {
          receivedMap[gi.item_id].grnNums.push(grn.grn_number);
        }
      });
    });

    const invoiceRows: InvoiceItem[] = poItems.map(pi => {
      const rec = receivedMap[pi.id] || { qty: 0, grnNums: [] };
      const totalReceived = rec.qty;

      // Already billed amount → convert to qty
      const alreadyBilledQty = pi.rate > 0 ? (pi.billed_amt || 0) / pi.rate : 0;
      const unbilledQty = Math.max(0, totalReceived - alreadyBilledQty);
      const taxRate = parseFloat(pi.item_tax_rate || '0') || 0;

      return {
        po_item_id: pi.id,
        item_code: pi.item_code,
        item_name: pi.item_name,
        uom: pi.uom,
        rate: pi.rate,
        ordered_qty: pi.qty,
        total_received_qty: totalReceived,
        unbilled_qty: Math.round(unbilledQty * 1000) / 1000,
        bill_qty: Math.round(unbilledQty * 1000) / 1000,  // default = bill all unbilled
        amount: Math.round(unbilledQty * pi.rate * 100) / 100,
        grn_refs: rec.grnNums,
        tax_rate: taxRate,
      };
    });

    setItems(invoiceRows);
  };

  // ─── Edit bill_qty for a row ───────────────────────────────────────────────
  const handleBillQtyChange = (index: number, val: number) => {
    setItems(prev => prev.map((row, i) => {
      if (i !== index) return row;
      const safeQty = Math.min(Math.max(0, val), row.unbilled_qty);
      return {
        ...row,
        bill_qty: safeQty,
        amount: Math.round(safeQty * row.rate * 100) / 100,
      };
    }));
  };

  // ─── Load existing invoice (edit mode) ────────────────────────────────────
  const loadExistingInvoice = async (invoiceId: string) => {
    setPageLoading(true);
    try {
      const res = await api.get(`/purchase-invoice/${invoiceId}`);
      if (res.data?.success === 1) {
        const inv = res.data.data;
        setFormData({
          invoiceNumber: inv.name || '',
          status: inv.status || 'Draft',
          date: inv.posting_date?.split('T')[0] || '',
          dueDate: inv.due_date?.split('T')[0] || '',
          currency: inv.currency || 'INR',
          notes: inv.remarks || '',
        });
        setSupplierName(inv.supplier_name || '');
        setPoSearch(inv.purchase_order || '');
        // Rebuild items from saved invoice
        if (inv.items?.length) {
          const rows: InvoiceItem[] = inv.items.map((it: any) => ({
            po_item_id: it.po_detail || 0,
            item_code: it.item_code,
            item_name: it.item_name,
            uom: it.uom,
            rate: it.rate,
            ordered_qty: it.qty,
            total_received_qty: it.qty,
            unbilled_qty: it.qty,
            bill_qty: it.qty,
            amount: it.amount,
            grn_refs: [],
            tax_rate: 0,
          }));
          setItems(rows);
        }
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      toast.error('Failed to load invoice');
    } finally {
      setPageLoading(false);
    }
  };

  // ─── Computed totals ───────────────────────────────────────────────────────
  const subTotal = items.reduce((s, r) => s + r.amount, 0);
  const taxAmount = items.reduce((s, r) => s + (r.amount * r.tax_rate) / 100, 0);
  const grandTotal = subTotal + taxAmount;

  // ─── Filtered PO list for search ──────────────────────────────────────────
  const filteredPOs = poList.filter(po =>
    po.name.toLowerCase().includes(poSearch.toLowerCase()) ||
    po.supplier_name?.toLowerCase().includes(poSearch.toLowerCase())
  );

  // ─── Validation ───────────────────────────────────────────────────────────
  const validate = (): ValidationError[] => {
    const errs: ValidationError[] = [];
    if (!selectedPO && !isEdit) errs.push({ field: 'po', label: 'Purchase Order', message: 'Select a Purchase Order' });
    if (!formData.date) errs.push({ field: 'date', label: 'Invoice Date', message: 'Invoice date is required' });
    if (!formData.dueDate) errs.push({ field: 'dueDate', label: 'Due Date', message: 'Due date is required' });
    const billableItems = items.filter(r => r.bill_qty > 0);
    if (billableItems.length === 0) errs.push({ field: 'items', label: 'Items', message: 'At least one item must have billing quantity > 0' });
    return errs;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const errs = validate();
    if (errs.length) {
      setValidationErrors(errs);
      setShowValidationSummary(true);
      return;
    }

    setLoading(true);

    const billableItems = items.filter(r => r.bill_qty > 0);

    const payload: any = {
      name: formData.invoiceNumber || undefined,
      naming_series: 'PINV-.YYYY.-',
      supplier: supplierCode,
      supplier_name: supplierName,
      purchase_order: selectedPO?.name || poSearch,
      posting_date: formData.date,
      due_date: formData.dueDate,
      currency: formData.currency,
      status: formData.status,
      remarks: formData.notes || '',
      company: selectedPO?.company || 'SculptorTech Pvt Ltd',

      // Totals
      total_qty: billableItems.reduce((s, r) => s + r.bill_qty, 0),
      total: subTotal,
      net_total: subTotal,
      grand_total: grandTotal,
      rounded_total: Math.round(grandTotal),
      base_total: subTotal,
      base_net_total: subTotal,
      base_grand_total: grandTotal,
      base_rounded_total: Math.round(grandTotal),
      outstanding_amount: grandTotal,
      total_taxes_and_charges: taxAmount,
      base_total_taxes_and_charges: taxAmount,

      // Items — one row per billable PO item
      items: billableItems.map(r => ({
        item_code: r.item_code,
        item_name: r.item_name,
        qty: r.bill_qty,
        uom: r.uom,
        rate: r.rate,
        amount: r.amount,
        net_rate: r.rate,
        net_amount: r.amount,
        base_rate: r.rate,
        base_amount: r.amount,
        base_net_rate: r.rate,
        base_net_amount: r.amount,
        received_qty: r.total_received_qty,
        po_detail: r.po_item_id,        // links back to PO item row
        purchase_order: selectedPO?.name || poSearch,
      })),

      // Standard defaults
      docstatus: 0,
      idx: 1,
      set_posting_time: 1,
      is_paid: 0,
      is_return: 0,
      update_stock: 1,
      conversion_rate: 1,
      buying_price_list: 'Standard Buying',
      price_list_currency: formData.currency,
      plc_conversion_rate: 1,
      apply_discount_on: 'Grand Total',
      base_discount_amount: 0,
      additional_discount_percentage: 0,
      discount_amount: 0,
      total_advance: 0,
      base_paid_amount: 0,
      paid_amount: 0,
      write_off_amount: 0,
      base_write_off_amount: 0,
      per_received: 0,
      per_billed: 0,
      owner: 'Administrator',
      modified_by: 'Administrator',
    };

    if (isEdit && id) payload.id = id;

    try {
      const res = isEdit
        ? await api.put('/purchase-invoice', payload)
        : await api.post('/purchase-invoice', payload);

      if (res.data?.success === 1) {
        toast.success(isEdit ? 'Invoice updated!' : 'Invoice created!');
        navigate('/purchase-invoice');
      } else {
        setApiError(res.data?.message || 'Failed to save invoice');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className={`pif-page ${theme}`}>
        <div className="pif-inner pif-loading">
          <FaSpinner className="spinning" size={24} />
          <span>Loading invoice…</span>
        </div>
      </div>
    );
  }

  const hasErrors = validate().length > 0;
  const allGrnNumbers = [...new Set(grnsForPO.map(g => g.grn_number))];

  return (
    <div className={`pif-page ${theme}`}>
      <div className="pif-inner">

        {/* Validation Modal */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FaExclamationTriangle /> Missing Required Fields</h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="validation-errors-list">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="validation-error-item">
                      <div className="error-header"><FaTimesCircle className="error-icon" /><strong>{err.label}</strong></div>
                      <div className="error-message">{err.message}</div>
                    </div>
                  ))}
                </div>
                <div className="validation-tip"><FaInfoCircle className="tip-icon" /> Fix the errors above before submitting</div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="pif-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="pif-header">
          <button type="button" onClick={() => navigate('/purchase-invoice')} className="back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            <h1>{isEdit ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h1>
          </div>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {validate().length} missing field{validate().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pif-card">

            {/* ── Section 1: Invoice Info ──────────────────────────────── */}
            <span className="pif-section-title">
              <FaReceipt className="pif-section-icon" /> Invoice Information
            </span>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label"><FaTag className="pif-label-icon" />Invoice Number</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  disabled
                  className="form-field"
                  placeholder="Auto-generated on save"
                  style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                />
              </div>
              <div className="pif-field">
                <label className="pif-label"><FaClipboardList className="pif-label-icon" />Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                  className="form-field"
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label"><FaCalendarAlt className="pif-label-icon" />Invoice Date <span className="pif-required">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'date') ? 'field-error' : ''}`}
                />
              </div>
              <div className="pif-field">
                <label className="pif-label"><FaClock className="pif-label-icon" />Due Date <span className="pif-required">*</span></label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                  className={`form-field ${validationErrors.some(e => e.field === 'dueDate') ? 'field-error' : ''}`}
                />
              </div>
            </div>

            <div className="pif-grid-2">
              <div className="pif-field">
                <label className="pif-label"><FaMoneyBillWave className="pif-label-icon" />Currency</label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData(p => ({ ...p, currency: e.target.value }))}
                  className="form-field"
                >
                  {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="pif-divider" />

            {/* ── Section 2: Purchase Order Selection ──────────────────── */}
            <span className="pif-section-title">
              <FaFileAlt className="pif-section-icon" /> Purchase Order &amp; GRN
            </span>

            <div className="pif-grid-2">
              {/* PO search/select */}
              <div className="pif-field" ref={poSearchRef} style={{ position: 'relative' }}>
                <label className="pif-label">
                  <FaSearch className="pif-label-icon" />
                  Purchase Order <span className="pif-required">*</span>
                </label>
                <div className="warehouse-search-input-wrap">
                  <FaSearch className="warehouse-search-icon" />
                  <input
                    type="text"
                    className={`form-field warehouse-search-input ${validationErrors.some(e => e.field === 'po') ? 'field-error' : ''}`}
                    value={poSearch}
                    onChange={e => { setPoSearch(e.target.value); setShowPODropdown(true); }}
                    onFocus={() => setShowPODropdown(true)}
                    placeholder={loadingPOList ? 'Loading…' : 'Search PO number or supplier…'}
                    disabled={loadingPOList || isEdit}
                  />
                  {loadingPODetail && <FaSpinner className="warehouse-loading-spinner spinning" />}
                  {selectedPO && !loadingPODetail && (
                    <FaCheckCircle style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: 14 }} />
                  )}
                </div>
                {showPODropdown && filteredPOs.length > 0 && (
                  <div className="warehouse-dropdown">
                    <ul className="warehouse-dropdown-list">
                      {filteredPOs.map(po => (
                        <li key={po.id} className="warehouse-dropdown-item" onClick={() => handleSelectPO(po)}>
                          <div className="warehouse-item-name">{po.name}</div>
                          <div className="warehouse-item-company">{po.supplier_name} · {po.status}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {showPODropdown && filteredPOs.length === 0 && poSearch && (
                  <div className="warehouse-dropdown">
                    <div className="warehouse-dropdown-empty">No POs found</div>
                  </div>
                )}
              </div>

              {/* Supplier — auto-filled from PO */}
              <div className="pif-field">
                <label className="pif-label"><FaBuilding className="pif-label-icon" />Supplier</label>
                <input
                  type="text"
                  value={supplierName}
                  disabled
                  className="form-field"
                  placeholder="Auto-filled from PO"
                  style={{ background: 'var(--layout-bg, #f3f4f6)', cursor: 'not-allowed' }}
                />
              </div>
            </div>

            {/* GRN summary strip */}
            {(loadingGRNs || grnsForPO.length > 0) && (
              <div className="pif-grn-strip">
                {loadingGRNs ? (
                  <span className="pif-loading-msg">
                    <FaSpinner className="spinning" size={10} /> Loading GRNs for this PO…
                  </span>
                ) : (
                  <>
                    <span className="pif-grn-label">
                      {grnsForPO.length} GRN{grnsForPO.length !== 1 ? 's' : ''} linked to this PO:
                    </span>
                    <div className="pif-grn-badges">
                      {grnsForPO.map(g => (
                        <span key={g.id} className={`pif-grn-badge pif-grn-badge--${g.status.toLowerCase()}`}>
                          {g.grn_number}
                          <span className="pif-grn-badge-qty"> · {g.total_received_qty} rcvd</span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {selectedPO && grnsForPO.length === 0 && !loadingGRNs && (
              <div className="pif-grn-strip pif-grn-strip--warn">
                <FaExclamationTriangle size={12} />
                No GRNs found for this PO. Create a GRN first to receive material before billing.
              </div>
            )}

            <div className="pif-divider" />

            {/* ── Section 3: Items (from PO + GRN aggregation) ─────────── */}
            <div className="pif-table-header-row">
              <span className="pif-section-title" style={{ margin: 0 }}>
                <FaBoxes className="pif-section-icon" /> Items to Bill
              </span>
              {items.length > 0 && (
                <span className="pif-items-hint">
                  Quantities pulled from PO + GRNs. Edit "Bill Qty" if needed.
                </span>
              )}
            </div>

            {(loadingPODetail || loadingGRNs) && (
              <div className="pif-loading-msg" style={{ padding: '12px 0' }}>
                <FaSpinner className="spinning" size={14} /> Building invoice from GRN data…
              </div>
            )}

            {!loadingPODetail && !loadingGRNs && items.length > 0 && (
              <>
                <div className="pif-table-block">
                  <table className="pif-inline-table">
                    <thead>
                      <tr>
                        <th className="pif-ith pif-ith-no">#</th>
                        <th className="pif-ith">Item Code</th>
                        <th className="pif-ith">Item Name</th>
                        <th className="pif-ith pif-ith-num">Ordered</th>
                        <th className="pif-ith pif-ith-num">Total Rcvd</th>
                        <th className="pif-ith pif-ith-num">Unbilled</th>
                        <th className="pif-ith pif-ith-num">
                          Bill Qty <span className="pif-required">*</span>
                        </th>
                        <th className="pif-ith">UOM</th>
                        <th className="pif-ith pif-ith-num">Rate</th>
                        <th className="pif-ith pif-ith-num">Amount</th>
                        <th className="pif-ith pif-ith-num">Tax%</th>
                        <th className="pif-ith">GRN Refs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, i) => (
                        <tr key={row.po_item_id} className={`pif-itr ${row.unbilled_qty === 0 ? 'pif-itr--zero' : ''}`}>
                          <td className="pif-itd pif-itd-no">{i + 1}</td>
                          <td className="pif-itd">
                            <span className="pif-cell-readonly">{row.item_code}</span>
                          </td>
                          <td className="pif-itd">
                            <span className="pif-cell-readonly">{row.item_name}</span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">{row.ordered_qty}</span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className={`pif-cell-readonly ${row.total_received_qty > 0 ? 'pif-qty--received' : 'pif-qty--zero'}`}>
                              {row.total_received_qty}
                            </span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className={`pif-cell-readonly ${row.unbilled_qty > 0 ? 'pif-qty--unbilled' : 'pif-qty--zero'}`}>
                              {row.unbilled_qty}
                            </span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <input
                              type="number"
                              className="pif-cell-input pif-cell-number pif-bill-qty-input"
                              value={row.bill_qty}
                              min={0}
                              max={row.unbilled_qty}
                              step="any"
                              onChange={e => handleBillQtyChange(i, Number(e.target.value))}
                              disabled={row.unbilled_qty === 0}
                              title={row.unbilled_qty === 0 ? 'Already fully billed' : `Max: ${row.unbilled_qty}`}
                            />
                          </td>
                          <td className="pif-itd">
                            <span className="pif-cell-readonly">{row.uom}</span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">{row.rate.toFixed(2)}</span>
                          </td>
                          <td className="pif-itd pif-itd-num pif-amount">
                            {formData.currency} {row.amount.toFixed(2)}
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">{row.tax_rate}%</span>
                          </td>
                          <td className="pif-itd">
                            <div className="pif-grn-refs">
                              {row.grn_refs.length > 0
                                ? row.grn_refs.map(g => <span key={g} className="pif-grn-ref-chip">{g}</span>)
                                : <span className="pif-qty--zero">No GRN</span>
                              }
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals summary */}
                <div className="pif-totals-block">
                  <div className="pif-totals-row">
                    <span>Sub Total</span>
                    <span>{formData.currency} {subTotal.toFixed(2)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="pif-totals-row">
                      <span>Tax</span>
                      <span>{formData.currency} {taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pif-totals-row pif-totals-grand">
                    <span>Grand Total</span>
                    <span>{formData.currency} {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {!loadingPODetail && !loadingGRNs && !selectedPO && items.length === 0 && (
              <div className="pif-empty-items">
                <FaFileAlt size={32} style={{ opacity: 0.3 }} />
                <p>Select a Purchase Order above to load items and GRN receipts.</p>
              </div>
            )}

            {validationErrors.some(e => e.field === 'items') && (
              <div className="pif-error-msg" style={{ marginTop: 8 }}>
                <FaExclamationCircle size={10} /> At least one item must have billing quantity &gt; 0
              </div>
            )}

            <div className="pif-divider" />

            {/* Notes */}
            <div className="pif-field">
              <label className="pif-label"><FaFileAlt className="pif-label-icon" />Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="form-field pif-textarea"
                placeholder="Additional notes…"
                rows={3}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pif-footer">
            <button type="button" onClick={() => navigate('/purchase-invoice')} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isEdit ? 'Update' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}