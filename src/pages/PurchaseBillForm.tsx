import { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaSave, FaSpinner, FaArrowLeft,
  FaExclamationCircle, FaExclamationTriangle, FaInfoCircle,
  FaTimesCircle,  FaBuilding, FaMoneyBillWave,
  FaCalendarAlt, FaFileAlt, FaBoxes, FaClipboardList,
  FaReceipt, FaClock, FaSearch, FaCheckCircle,
  FaPrint, FaPlus, FaTrash, FaTruck, FaHandshake,
  FaPercent, FaUser, FaUsers, FaWarehouse, FaPhone, FaEnvelope, FaGlobeAsia,
  FaStickyNote,
} from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './PurchaseBillForm.css';
import { getUserRole } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface POItem {
  id: number;
  item_code: string;
  item_name: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  received_qty: number;
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
  item_id: number;
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
  purchase_order_id: number | null;
  purchase_order_number?: string;
  supplier_name: string;
  warehouse_name: string;
  status: string;
  total_received_qty: number;
  items: GRNItem[];
}

interface GRNSummary {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  purchase_order_id: number | null;
  purchase_order_number?: string;
  warehouse_id?: number;
  warehouse_name?: string;
  status: string;
  total_ordered_qty: number;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  total_items?: number;
}

interface InvoiceItem {
  id?: string;
  po_item_id?: number;
  item_id?: number;
  item_code: string;
  item_name: string;
  uom: string;
  rate: number;
  ordered_rate: number;
  ordered_qty: number;
  total_received_qty: number;
  unbilled_qty: number;
  bill_qty: number;
  amount: number;
  grn_refs: string[];
  tax_rate: number;
  HSN?: string;
  tax_id?: number;
  note?: string;
}

interface Supplier {
  id: number;
  supplier_name: string;
  supplier_type: string;
  supplier_group: string;
  country: string;
  mobile_no: string;
  email_id: string;
  disabled: number;
}

interface Item {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  tax_id: number;
  description: string;
  HSN: string;
}

interface Tax {
  tax_id: number;
  tax_type: string;
}

interface Warehouse {
  id: number;
  warehouse_name: string;
}

interface ValidationError { field: string; label: string; message: string; }

const statusOptions = ['Draft', 'Submitted', 'Partially Paid', 'Fully Paid', 'Overdue', 'Cancelled'];
const billSourceOptions = ['GRN', 'Without GRN'] as const;
type BillSource = typeof billSourceOptions[number];

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
    billNo: '',
    billDate: '',
    notes: '',
    billSource: 'GRN' as BillSource,
    paymentTerms: '',
    buyerOrderNumber: '',
    deliveryDate: '',
    vehicleNumber: '',
    deliveryTerms: 'Free' as 'Free' | 'Paid',
    deliveryCharges: 0,
    cgst: 0,
    sgst: 0,
    gstTotal: 0,
    grandTotal: 0,
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  // ── Supplier state ──────────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const supplierSearchRef = useRef<HTMLDivElement>(null);

  // ── PO + GRN linked state (GRN bill source) ─────────────────────────────────
  const [allGRNs, setAllGRNs] = useState<GRNSummary[]>([]);
  const [loadingGRNList, setLoadingGRNList] = useState(false);
  const [grnSearch, setGrnSearch] = useState('');
  const [showGrnDropdown, setShowGrnDropdown] = useState(false);
  const grnSearchRef = useRef<HTMLDivElement>(null);

  const [poList, setPoList] = useState<{ id: number; name: string; supplier_name: string; status: string }[]>([]);
  const [selectedPO, setSelectedPO] = useState<PODetail | null>(null);
  const [loadingPOList, setLoadingPOList] = useState(false);
  const [loadingPODetail, setLoadingPODetail] = useState(false);
  const [poSearch, setPoSearch] = useState('');
  const [showPoDropdown, setShowPoDropdown] = useState(false);
  const poSearchRef = useRef<HTMLDivElement>(null);

  // GRNs currently linked to the selected PO (badge strip, multi-select)
  const [linkedGRNsForPO, setLinkedGRNsForPO] = useState<GRNSummary[]>([]);
  // Multi-select of GRN ids actually included in this invoice
  const [selectedGRNIds, setSelectedGRNIds] = useState<Set<number>>(new Set());
  // Cache of full GRN detail (items) keyed by grn id, fetched lazily
  const [grnDetailCache, setGrnDetailCache] = useState<Record<number, GRNRecord>>({});
  const [loadingGRNs, setLoadingGRNs] = useState(false);

  // ── Manual / Without-GRN mode state ─────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');

  // ── Item state ──────────────────────────────────────────────────────────────
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [, setLoadingItems] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const itemSearchRef = useRef<HTMLDivElement>(null);

  // ── Note popover state ───────────────────────────────────────────────────────
  const [notePopoverIndex, setNotePopoverIndex] = useState<number | null>(null);

  // ── Tax state ───────────────────────────────────────────────────────────────
  const [taxes, setTaxes] = useState<Tax[]>([]);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ── Success modal state ─────────────────────────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedInvoiceNumber, setSavedInvoiceNumber] = useState<string>('');

  // ─── Fetch data on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchPOList();
    fetchSuppliers();
    fetchItems();
    fetchTaxes();
    fetchWarehouses();
    if (isEdit && id) loadExistingInvoice(id);

    const handleOutsideClick = (e: MouseEvent) => {
      if (supplierSearchRef.current && !supplierSearchRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (itemSearchRef.current && !itemSearchRef.current.contains(e.target as Node)) {
        setShowItemDropdown(false);
      }
      if (grnSearchRef.current && !grnSearchRef.current.contains(e.target as Node)) {
        setShowGrnDropdown(false);
      }
      if (poSearchRef.current && !poSearchRef.current.contains(e.target as Node)) {
        setShowPoDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // ─── Calculate GST ──────────────────────────────────────────────────────────
  useEffect(() => {
    calculateGST();
  }, [items, formData.cgst, formData.sgst, formData.deliveryCharges]);

  const calculateGST = () => {
    const subTotal = items.reduce((s, r) => s + r.amount, 0);
    const cgstAmount = (subTotal * formData.cgst) / 100;
    const sgstAmount = (subTotal * formData.sgst) / 100;
    const gstTotal = cgstAmount + sgstAmount;
    const grandTotal = subTotal + gstTotal + formData.deliveryCharges;

    setFormData(prev => ({
      ...prev,
      gstTotal,
      grandTotal,
    }));
  };

  // ─── Rebuild items whenever the PO / selected-GRN set changes (GRN mode) ───
  useEffect(() => {
    if (formData.billSource !== 'GRN') return;
    if (!selectedPO && selectedGRNIds.size === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingGRNs(true);
      try {
        const ids = Array.from(selectedGRNIds);
        const missingIds = ids.filter(gid => !grnDetailCache[gid]);
        let cache = grnDetailCache;
        if (missingIds.length) {
          const fetched = await Promise.all(missingIds.map(gid => fetchGRNDetail(gid)));
          const nextCache = { ...cache };
          fetched.forEach(g => { if (g) nextCache[g.id] = g; });
          cache = nextCache;
          if (!cancelled) setGrnDetailCache(nextCache);
        }
        if (cancelled) return;
        const grnRecords = ids.map(gid => cache[gid]).filter((g): g is GRNRecord => Boolean(g));
        buildInvoiceItemsCombined(selectedPO, grnRecords);
      } finally {
        if (!cancelled) setLoadingGRNs(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGRNIds, selectedPO, formData.billSource]);

  // ─── Fetch PO list ──────────────────────────────────────────────────────────
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

  // ─── Fetch Suppliers ────────────────────────────────────────────────────────
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await api.get('/supplier?limit=200');
      if (res.data?.success === 1) {
        const records = res.data.data?.records || res.data.data || [];
        setSuppliers(records);
      }
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // ─── Fetch Items ────────────────────────────────────────────────────────────
  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.get('/item?limit=200');
      if (res.data?.success === 1) {
        const records = res.data.data?.records || res.data.data || [];
        setItemsList(records);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      toast.error('Failed to load items');
    } finally {
      setLoadingItems(false);
    }
  };

  // ─── Fetch Taxes ────────────────────────────────────────────────────────────
  const fetchTaxes = async () => {
    try {
      const res = await api.get('/item/get-tax');
      if (res.data?.success === 1) {
        setTaxes(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching taxes:', err);
    }
  };

  // ─── Fetch Warehouses ───────────────────────────────────────────────────────
  const fetchWarehouses = async () => {
    setLoadingWarehouses(true);
    try {
      const res = await api.get('/warehouse?limit=200');
      if (res.data?.success === 1) {
        const records = res.data.data?.records || res.data.data || [];
        setWarehouses(records);
        if (records.length && selectedWarehouseId === '') {
          setSelectedWarehouseId(records[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
    } finally {
      setLoadingWarehouses(false);
    }
  };

  // ─── Fetch all GRNs ─────────────────────────────────────────────────────────
  const fetchGRNList = async () => {
    setLoadingGRNList(true);
    try {
      const res = await api.get('/grn?page=1&limit=200&is_completed=0');
      if (res.data?.success === 1) {
        const raw = res.data.data;
        const records: GRNSummary[] = Array.isArray(raw) ? raw : (raw?.data || raw?.records || []);
        setAllGRNs(records);
      }
    } catch (err) {
      console.error('Error fetching GRN list:', err);
      toast.error('Failed to load GRNs');
    } finally {
      setLoadingGRNList(false);
    }
  };

  // ─── Fetch GRNs linked to a specific PO ────────────────────────────────────
  const fetchGRNsForPurchaseOrder = async (poId: number): Promise<GRNSummary[]> => {
    try {
      const res = await api.get(`/grn/get-grn-by-purchase-order/${poId}`);
      if (res.data?.success === 1) {
        return res.data.data || [];
      }
    } catch (err) {
      console.error('Error fetching GRNs for PO:', err);
      toast.error('Failed to load GRNs for this PO');
    }
    return [];
  };

  // ─── Fetch full detail for a single GRN ─────────────────────────────────────
  const fetchGRNDetail = async (grnId: number): Promise<GRNRecord | null> => {
    try {
      const res = await api.get(`/grn/${grnId}`);
      if (res.data?.success === 1) {
        return res.data.data as GRNRecord;
      }
    } catch (err) {
      console.error('Error fetching GRN detail:', err);
      toast.error('Failed to load GRN details');
    }
    return null;
  };

  // ─── Fetch full PO detail (used to compare ordered vs received qty) ───────
  const fetchPODetail = async (poId: number): Promise<PODetail | null> => {
    try {
      const res = await api.get(`/purchase-order/${poId}`);
      if (res.data?.success === 1) {
        return res.data.data as PODetail;
      }
    } catch (err) {
      console.error('Error fetching PO detail:', err);
      toast.error('Failed to load Purchase Order details');
    }
    return null;
  };

  // ─── Reset all downstream selections ───────────────────────────────────────
  const resetSelections = () => {
    setSelectedPO(null);
    setLinkedGRNsForPO([]);
    setSelectedGRNIds(new Set());
    setGrnDetailCache({});
    setItems([]);
    setGrnSearch('');
    setPoSearch('');
  };

  // ─── When supplier is selected ─────────────────────────────────────────────
  const handleSelectSupplier = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearch(supplier.supplier_name);
    setShowSupplierDropdown(false);
    resetSelections();

    if (allGRNs.length === 0) {
      fetchGRNList();
    }
  };

  // ─── When bill source changes ──────────────────────────────────────────────
  const handleBillSourceChange = (source: BillSource) => {
    setFormData(p => ({ ...p, billSource: source }));
    resetSelections();
    if (selectedSupplier && allGRNs.length === 0) {
      fetchGRNList();
    }
  };

  // ─── Toggle a GRN's inclusion (used by both the search dropdown & badges) ──
  const toggleGRNSelection = (grnId: number) => {
    setSelectedGRNIds(prev => {
      const next = new Set(prev);
      if (next.has(grnId)) next.delete(grnId); else next.add(grnId);
      return next;
    });
  };

  // ─── When a PO is selected (GRN mode) — auto-loads its linked GRNs ────────
  const handleSelectPO = async (po: { id: number; name: string; supplier_name: string }) => {
    setPoSearch(po.name);
    setShowPoDropdown(false);
    setLoadingPODetail(true);
    try {
      const [poDetail, grnSummaries] = await Promise.all([
        fetchPODetail(po.id),
        fetchGRNsForPurchaseOrder(po.id),
      ]);
      if (poDetail) {
        setSelectedPO(poDetail);
      } else {
        toast.error('Failed to load PO details');
      }
      setLinkedGRNsForPO(grnSummaries);
      // auto-include every GRN linked to this PO; user can uncheck any of them
      setSelectedGRNIds(new Set(grnSummaries.map(g => g.id)));
    } catch (err) {
      console.error('Error loading PO/GRN:', err);
      toast.error('Error loading PO data');
    } finally {
      setLoadingPODetail(false);
    }
  };

  // ─── When a PO with NO GRN is selected (Without GRN mode) ─────────────────
  const handleSelectPOWithoutGRN = async (po: { id: number; name: string; supplier_name: string }) => {
    setPoSearch(po.name);
    setShowPoDropdown(false);
    setLoadingPODetail(true);
    try {
      const poDetail = await fetchPODetail(po.id);
      if (poDetail) {
        setSelectedPO(poDetail);
        buildInvoiceItemsFromPOOnly(poDetail);
      } else {
        toast.error('Failed to load PO details');
      }
    } finally {
      setLoadingPODetail(false);
    }
  };

  // ─── When a GRN is picked from the search dropdown (multi-select) ─────────
  const handleSelectGRN = async (grn: GRNSummary) => {
    const wasSelected = selectedGRNIds.has(grn.id);
    toggleGRNSelection(grn.id);
    setShowGrnDropdown(false);
    setGrnSearch('');

    // auto-load & display the PO this GRN belongs to, by comparing purchase_order_id
    if (!wasSelected && grn.purchase_order_id && (!selectedPO || selectedPO.id !== grn.purchase_order_id)) {
      setLoadingPODetail(true);
      try {
        const [poDetail, grnSummaries] = await Promise.all([
          fetchPODetail(grn.purchase_order_id),
          fetchGRNsForPurchaseOrder(grn.purchase_order_id),
        ]);
        if (poDetail) {
          setSelectedPO(poDetail);
          setPoSearch(poDetail.name);
        }
        setLinkedGRNsForPO(grnSummaries);
      } catch (err) {
        console.error('Error auto-loading PO for GRN:', err);
      } finally {
        setLoadingPODetail(false);
      }
    }
  };

  // ─── Build invoice items from PO items + all selected GRNs' received qty ──
  const buildInvoiceItemsCombined = (poDetail: PODetail | null, grns: GRNRecord[]) => {
    if (poDetail?.items?.length) {
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

      const invoiceRows: InvoiceItem[] = poDetail.items.map(pi => {
        const rec = receivedMap[pi.id] || { qty: 0, grnNums: [] };
        const totalReceived = rec.qty;
        const alreadyBilledQty = pi.rate > 0 ? (pi.billed_amt || 0) / pi.rate : 0;
        const unbilledQty = Math.max(0, totalReceived - alreadyBilledQty);
        const taxRate = parseFloat(pi.item_tax_rate || '0') || 0;

        const tax = taxes.find(t => {
          const rate = parseInt(t.tax_type.replace('GST', ''));
          return rate === taxRate;
        });

        return {
          po_item_id: pi.id,
          item_code: pi.item_code,
          item_name: pi.item_name,
          uom: pi.uom,
          rate: pi.rate,
          ordered_rate: pi.rate,
          ordered_qty: pi.qty,
          total_received_qty: totalReceived,
          unbilled_qty: Math.round(unbilledQty * 1000) / 1000,
          bill_qty: Math.round(unbilledQty * 1000) / 1000,
          amount: Math.round(unbilledQty * pi.rate * 100) / 100,
          grn_refs: rec.grnNums,
          tax_rate: taxRate,
          tax_id: tax?.tax_id || 1,
          note: '',
        };
      });

      setItems(invoiceRows);
      return;
    }

    // No PO on record for these GRNs — build directly from GRN items, merging
    // duplicate items across multiple selected GRNs.
    const merged: Record<string, InvoiceItem> = {};
    grns.forEach(grn => {
      grn.items?.forEach(gi => {
        const billableQty = gi.accepted_qty || gi.received_qty;
        const key = gi.item_code;
        if (!merged[key]) {
          const tax = taxes.find(t => t.tax_id === 1);
          merged[key] = {
            item_code: gi.item_code,
            item_name: gi.item_name,
            uom: gi.uom,
            rate: gi.rate,
            ordered_rate: gi.rate,
            ordered_qty: gi.ordered_qty,
            total_received_qty: gi.received_qty,
            unbilled_qty: billableQty,
            bill_qty: billableQty,
            amount: Math.round(billableQty * gi.rate * 100) / 100,
            grn_refs: [grn.grn_number],
            tax_rate: 0,
            tax_id: tax?.tax_id || 1,
            note: '',
          };
        } else {
          merged[key].ordered_qty += gi.ordered_qty;
          merged[key].total_received_qty += gi.received_qty;
          merged[key].unbilled_qty += billableQty;
          merged[key].bill_qty += billableQty;
          merged[key].amount = Math.round(merged[key].bill_qty * merged[key].rate * 100) / 100;
          if (!merged[key].grn_refs.includes(grn.grn_number)) merged[key].grn_refs.push(grn.grn_number);
        }
      });
    });
    setItems(Object.values(merged));
  };

  // ─── Build invoice items straight from a PO that has no GRN yet ───────────
  const buildInvoiceItemsFromPOOnly = (poDetail: PODetail) => {
    const invoiceRows: InvoiceItem[] = poDetail.items.map(pi => {
      const taxRate = parseFloat(pi.item_tax_rate || '0') || 0;
      const tax = taxes.find(t => parseInt(t.tax_type.replace('GST', '')) === taxRate);
      return {
        po_item_id: pi.id,
        item_code: pi.item_code,
        item_name: pi.item_name,
        uom: pi.uom,
        rate: pi.rate,
        ordered_rate: pi.rate,
        ordered_qty: pi.qty,
        total_received_qty: 0,
        unbilled_qty: pi.qty,
        bill_qty: pi.qty,
        amount: Math.round(pi.qty * pi.rate * 100) / 100,
        grn_refs: [],
        tax_rate: taxRate,
        tax_id: tax?.tax_id || 1,
        note: '',
      };
    });
    setItems(invoiceRows);
  };

  // ─── Manual entry functions ────────────────────────────────────────────────
  const handleAddManualItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      item_code: '',
      item_name: '',
      uom: 'Nos',
      rate: 0,
      ordered_rate: 0,
      ordered_qty: 1,
      total_received_qty: 1,
      unbilled_qty: 1,
      bill_qty: 1,
      amount: 0,
      grn_refs: [],
      tax_rate: 0,
      tax_id: 1,
      note: '',
    };
    setItems([...items, newItem]);
    setTimeout(() => {
      const inputs = document.querySelectorAll('.pif-cell-input');
      if (inputs.length > 0) {
        (inputs[inputs.length - 1] as HTMLInputElement).focus();
      }
    }, 100);
  };

  const handleRemoveManualItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemFieldChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'bill_qty' || field === 'rate') {
        updated.amount = updated.bill_qty * updated.rate;
      }
      return updated;
    }));
  };

  const handleSelectItem = (item: Item, index: number) => {
    const tax = taxes.find(t => t.tax_id === item.tax_id);
    const taxRate = tax ? parseInt(tax.tax_type.replace('GST', '')) : 0;

    setItems(prev => prev.map((row, i) => {
      if (i !== index) return row;
      return {
        ...row,
        item_id: item.id,
        item_code: item.item_code,
        item_name: item.item_name,
        HSN: item.HSN,
        uom: item.stock_uom || 'Nos',
        rate: item.standard_rate || 0,
        ordered_rate: item.standard_rate || 0,
        tax_rate: taxRate,
        tax_id: item.tax_id,
        amount: row.bill_qty * (item.standard_rate || 0),
      };
    }));
    setShowItemDropdown(false);
    setItemSearch('');
    setSelectedItemIndex(null);
  };

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

  // ─── Load existing invoice ──────────────────────────────────────────────────
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
          billNo: inv.bill_no || '',
          billDate: inv.bill_date?.split('T')[0] || '',
          notes: inv.remarks || '',
          billSource: (inv.buyer_order_type === 'Without GRN' ? 'Without GRN' : 'GRN') as BillSource,
          paymentTerms: inv.payment_terms || '',
          buyerOrderNumber: inv.buyer_order_number || '',
          deliveryDate: inv.delivery_date?.split('T')[0] || '',
          vehicleNumber: inv.vehicle_number || '',
          deliveryTerms: inv.delivery_terms || 'Free',
          deliveryCharges: inv.delivery_charges || 0,
          cgst: inv.cgst_rate || 0,
          sgst: inv.sgst_rate || 0,
          gstTotal: inv.gst_total || 0,
          grandTotal: inv.grand_total || 0,
        });

        if (inv.supplier_name) {
          const supplier = suppliers.find(s => s.supplier_name === inv.supplier_name);
          if (supplier) {
            setSelectedSupplier(supplier);
            setSupplierSearch(supplier.supplier_name);
          }
        }

        if (inv.items?.length) {
          const rows: InvoiceItem[] = inv.items.map((it: any) => ({
            id: it.id || Date.now().toString(),
            po_item_id: it.po_detail || 0,
            item_id: it.item_id || undefined,
            item_code: it.item_code,
            item_name: it.item_name,
            uom: it.uom,
            rate: it.rate,
            ordered_rate: it.ordered_rate ?? it.rate,
            ordered_qty: it.qty,
            total_received_qty: it.qty,
            unbilled_qty: it.qty,
            bill_qty: it.qty,
            amount: it.amount,
            grn_refs: it.grn_refs || [],
            tax_rate: it.tax_rate || 0,
            tax_id: it.tax_id || 1,
            hsn_code: it.hsn_code || '',
            note: it.note || '',
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

  // ─── Computed totals ────────────────────────────────────────────────────────
  const subTotal = items.reduce((s, r) => s + r.amount, 0);
  const cgstAmount = (subTotal * formData.cgst) / 100;
  const sgstAmount = (subTotal * formData.sgst) / 100;
  const totalTax = cgstAmount + sgstAmount;
  const grandTotal = subTotal + totalTax + formData.deliveryCharges;

  // ─── Filtered lists ────────────────────────────────────────────────────────
  const filteredSuppliers = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
    s.mobile_no?.includes(supplierSearch)
  );

  const posForSelectedSupplier = selectedSupplier
    ? poList.filter(po => po.supplier_name === selectedSupplier.supplier_name)
    : [];

  const grnsForSelectedSupplier = selectedSupplier
    ? allGRNs.filter(g => g.supplier_id === selectedSupplier.id)
    : [];

  // POs (for this supplier) that don't have any GRN linked to them at all —
  // these are the ones eligible to be billed "Without GRN".
  const poIdsWithGRN = useMemo(
    () => new Set(allGRNs.filter(g => g.purchase_order_id).map(g => g.purchase_order_id as number)),
    [allGRNs]
  );
  const posWithoutGRNForSupplier = posForSelectedSupplier.filter(po => !poIdsWithGRN.has(po.id));

  const filteredPOs = (formData.billSource === 'Without GRN' ? posWithoutGRNForSupplier : posForSelectedSupplier)
    .filter(po => po.name.toLowerCase().includes(poSearch.toLowerCase()));

  const filteredGRNs = grnsForSelectedSupplier.filter(g =>
    g.grn_number.toLowerCase().includes(grnSearch.toLowerCase()) ||
    (g.purchase_order_number && g.purchase_order_number.toLowerCase().includes(grnSearch.toLowerCase()))
  );

  const filteredItems = itemsList.filter(item =>
    item.item_code.toLowerCase().includes(itemSearch.toLowerCase()) ||
    item.item_name.toLowerCase().includes(itemSearch.toLowerCase())
  );

  const isManual = formData.billSource === 'Without GRN';
  const isGRNMode = formData.billSource === 'GRN';

  // GRNs shown as removable chips — linked-to-PO list first, else supplier-wide list
  const selectedGRNSummaries: GRNSummary[] = Array.from(selectedGRNIds).map(gid =>
    linkedGRNsForPO.find(g => g.id === gid) || grnsForSelectedSupplier.find(g => g.id === gid)
  ).filter((g): g is GRNSummary => Boolean(g));

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = (): ValidationError[] => {
    const errs: ValidationError[] = [];

    if (!selectedSupplier && !isEdit) {
      errs.push({ field: 'supplier', label: 'Supplier', message: 'Please select a supplier' });
    }

    if (isGRNMode && !selectedPO && selectedGRNIds.size === 0 && !isEdit) {
      errs.push({ field: 'grn', label: 'GRN / PO', message: 'Please select a Purchase Order or at least one GRN' });
    }

    if (isManual && selectedWarehouseId === '' && !isEdit) {
      errs.push({ field: 'warehouse', label: 'Warehouse', message: 'Please select a warehouse' });
    }

    if (!formData.date) errs.push({ field: 'date', label: 'Invoice Date', message: 'Invoice date is required' });

    const billableItems = items.filter(r => r.bill_qty > 0);
    if (billableItems.length === 0) errs.push({ field: 'items', label: 'Items', message: 'At least one item must have quantity > 0' });

    if (isManual) {
      items.forEach((item, index) => {
        if (!item.item_code) errs.push({ field: `item_code_${index}`, label: `Item ${index + 1} Code`, message: 'Item code is required' });
        if (!item.item_name) errs.push({ field: `item_name_${index}`, label: `Item ${index + 1} Name`, message: 'Item name is required' });
        if (item.rate <= 0) errs.push({ field: `rate_${index}`, label: `Item ${index + 1} Rate`, message: 'Rate must be greater than 0' });
      });
    }
    return errs;
  };

  // ─── Print function ────────────────────────────────────────────────────────
  const handlePrint = () => {
    const printContent = document.getElementById('print-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow pop-ups for printing');
      return;
    }

    const styles = document.querySelector('style')?.innerHTML || '';

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Invoice ${formData.invoiceNumber || 'New'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .invoice-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .invoice-title { font-size: 24px; font-weight: bold; }
            .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; }
            .invoice-info div { flex: 1; min-width: 200px; padding: 4px 0; }
            .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .invoice-table th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .totals { margin-top: 20px; text-align: right; }
            .totals div { padding: 4px 0; }
            .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
            .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            .gst-breakdown { margin-top: 10px; }
            .delivery-info { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px; }
            ${styles}
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Printed on: ${new Date().toLocaleString()}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Sync manual / Without-GRN inventory ───────────────────────────────────
  const syncManualInventory = async (billableItems: InvoiceItem[]) => {
    const warehouseId = selectedWarehouseId === '' ? 0 : selectedWarehouseId;
    await Promise.all(billableItems.map(async (item) => {
      const invPayload = {
        item_Id: item.item_id || 0,
        item_code: item.item_code,
        warehouse_Id: warehouseId,
        actual_qty: item.bill_qty,
        planned_qty: 0,
        indented_qty: 0,
        ordered_qty: item.bill_qty,
        reserved_qty: 0,
        reserved_qty_for_production: 0,
        reserved_qty_for_sub_contract: 0,
        reserved_qty_for_production_plan: 0,
        reserved_stock: 0,
        stock_uom: item.uom,
        company: selectedPO?.company || 'SculptorTech Pvt Ltd',
        valuation_rate: item.rate,
        modified_by: 'Administrator',
        type: 'Internal',
      };
      try {
        await api.post('/inventory', invPayload);
      } catch (err) {
        console.error('Error syncing inventory for item', item.item_code, err);
        toast.error(`Failed to update stock for ${item.item_code}`);
      }
    }));
  };

  // ─── Mark included GRNs as completed once the invoice is saved ────────────
  // NOTE: endpoint/payload assumed as PUT /grn/:id { isdeleted: 1, status: 'Completed' }.
  // Adjust here if your backend expects a different route or field name.
  const role = getUserRole();
  const markGRNsCompleted = async (grnIds: number[]) => {
    await Promise.all(grnIds.map(async (grnId) => {
      try {
        await api.put(`/grn/grn-status`, {
          id: grnId,
          is_completed: 1,
          modified_by: role?.id,
        });
      } catch (error) {
        console.error(error);
      }
    }));
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
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

    const resolvedWarehouseId: number | undefined =
      selectedWarehouseId !== '' ? selectedWarehouseId : undefined;
      console.log(billableItems)

    const now = new Date();
    const postingTime = now.toTimeString().slice(0, 8);
    const payload: any = {
      ...(isEdit && id ? { name: formData.invoiceNumber } : {}),
      name: 'PINV-',
      modified_by: 'Administrator',
      owner: 'Administrator',
      naming_series: 'PINV-',
      supplier: selectedSupplier?.id,
      supplier_name: selectedSupplier?.supplier_name || '',
      company: selectedPO?.company || 'My Company',
      posting_date: formData.date,
      posting_time: postingTime,
      bill_no: formData.billNo || undefined,
      bill_date: formData.billDate || undefined,
      currency: 'INR',
      conversion_rate: 1,
      update_stock: 1,
      set_warehouse: resolvedWarehouseId,
      total_qty: billableItems.reduce((s, r) => s + r.bill_qty, 0),
      base_total: subTotal,
      base_net_total: subTotal,
      total: subTotal,
      net_total: subTotal,
      grand_total: grandTotal,
      base_grand_total: grandTotal,
      rounded_total: Math.round(grandTotal),
      outstanding_amount: grandTotal,
      status: formData.status,
      remarks: formData.notes || '',

      items: billableItems.map((r, idx) => ({
        
        name: `item-${idx + 1}`,
        item_id: r.id,
        item_code: r.item_code,
        item_name: r.item_name,
        warehouse: resolvedWarehouseId,
        qty: r.bill_qty,
        uom: r.uom,
        rate: r.rate,
        ordered_rate: r.ordered_rate,
        amount: r.amount,
        note: r.note || undefined,
      })),
    };

    try {
      const res = isEdit
        ? await api.put('/purchase-invoice', payload)
        : await api.post('/purchase-invoice', payload);

      if (res.data?.success === 1) {
        if (isManual) {
          await syncManualInventory(billableItems);
        }
        if (isGRNMode && selectedGRNIds.size > 0) {
          await markGRNsCompleted(Array.from(selectedGRNIds));
        }
        const generatedNumber = res.data?.data?.name || formData.invoiceNumber || 'New Invoice';
        setSavedInvoiceNumber(generatedNumber);
        setShowSuccessModal(true);
      } else {
        setApiError(res.data?.message || 'Failed to save invoice');
      }
    } catch (err: any) {
      setApiError(err.response?.data?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessModalOk = () => {
    setShowSuccessModal(false);
    navigate('/purchase-invoice');
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

  return (
    <div className={`pif-page ${theme}`}>
      <div className="pif-inner">

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="pif-success-modal" onClick={e => e.stopPropagation()}>
              <div className="pif-success-icon-circle">
                <FaCheckCircle size={48} />
              </div>
              <h2>{isEdit ? 'Invoice Updated Successfully!' : 'Invoice Created Successfully!'}</h2>
              <p className="pif-success-message">
                Your Purchase Invoice has been saved successfully.
              </p>
              <div className="pif-success-number-box">
                <span className="pif-success-label">Invoice Number</span>
                <span className="pif-success-number">{savedInvoiceNumber}</span>
              </div>
              <div className="pif-success-actions">
                <button className="pif-success-btn pif-success-btn-primary" onClick={handleSuccessModalOk}>
                  View All Invoices
                </button>
                <button className="pif-success-btn pif-success-btn-secondary" onClick={() => setShowSuccessModal(false)}>
                  Continue Editing
                </button>
              </div>
            </div>
          </div>
        )}

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
            <h1>{isEdit ? `${formData.invoiceNumber || 'Edit Purchase Bill'}` : 'New Purchase Bill'}</h1>
          </div>
          <button type="button" onClick={handlePrint} className="print-btn" disabled={items.length === 0}>
            <FaPrint size={12} /> Print
          </button>
          {hasErrors && (
            <div className="error-badge">
              <FaExclamationTriangle size={12} />
              {validate().length} missing field{validate().length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Print Content */}
        <div id="print-content" style={{ display: 'none' }}>
          <div className="invoice-header">
            <div className="invoice-title">Purchase Invoice</div>
            <div>Invoice #: {formData.invoiceNumber || 'New Invoice'}</div>
            <div>Date: {formData.date}</div>
            <div>
              Source: {formData.billSource}
              {selectedPO ? ` via PO ${selectedPO.name}` : ''}
              {selectedGRNSummaries.length ? ` (${selectedGRNSummaries.map(g => g.grn_number).join(', ')})` : ''}
            </div>
          </div>
          <div className="invoice-info">
            <div>
              <strong>Supplier:</strong> {selectedSupplier?.supplier_name || 'N/A'}
            </div>
            <div>
              <strong>PO:</strong> {selectedPO?.name || 'N/A'}
            </div>
            {formData.buyerOrderNumber && (
              <div>
                <strong>Buyer Order:</strong> {formData.buyerOrderNumber}
              </div>
            )}
          </div>
          {(formData.deliveryDate || formData.vehicleNumber) && (
            <div className="delivery-info">
              <strong>Delivery:</strong> {formData.deliveryDate || 'N/A'}
              {formData.vehicleNumber && ` | Vehicle: ${formData.vehicleNumber}`}
              {formData.deliveryTerms && ` | Terms: ${formData.deliveryTerms}`}
            </div>
          )}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>HSN</th>
                <th>Ordered Qty</th>
                <th>Received Qty</th>
                <th>Bill Qty</th>
                <th>UOM</th>
                <th>Ordered Rate</th>
                <th>Rate</th>
                <th>Amount</th>
                <th>Tax%</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{item.item_code}</td>
                  <td>{item.item_name}</td>
                  <td>{item.HSN || '-'}</td>
                  <td className="text-right">{item.ordered_qty}</td>
                  <td className="text-right">{item.total_received_qty}</td>
                  <td className="text-right">{item.bill_qty}</td>
                  <td>{item.uom}</td>
                  <td className="text-right">{item.ordered_rate ? item.ordered_rate.toFixed(2) : '-'}</td>
                  <td className="text-right">{item.rate.toFixed(2)}</td>
                  <td className="text-right">{item.amount.toFixed(2)}</td>
                  <td className="text-right">{item.tax_rate}%</td>
                  <td>{item.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <div>Sub Total: ₹ {subTotal.toFixed(2)}</div>
            {(formData.cgst > 0 || formData.sgst > 0) && (
              <div className="gst-breakdown">
                <div>CGST ({formData.cgst}%): ₹ {cgstAmount.toFixed(2)}</div>
                <div>SGST ({formData.sgst}%): ₹ {sgstAmount.toFixed(2)}</div>
                <div>Total GST: ₹ {totalTax.toFixed(2)}</div>
              </div>
            )}
            {formData.deliveryCharges > 0 && (
              <div>Delivery Charges: ₹ {formData.deliveryCharges.toFixed(2)}</div>
            )}
            <div className="grand-total">Grand Total: ₹ {grandTotal.toFixed(2)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pif-card">

            {/* ── Bill Source Selection ─────────────────────────────────── */}
            <div className="pif-invoice-type-section">
              <label className="pif-label" style={{ marginBottom: 8 }}>Create Bill From</label>
              <div className="pif-radio-group">
                {billSourceOptions.map(source => (
                  <label key={source} className="pif-radio-label">
                    <input
                      type="radio"
                      name="billSource"
                      value={source}
                      checked={formData.billSource === source}
                      onChange={() => handleBillSourceChange(source)}
                    />
                    {source === 'GRN' ? 'GRN' : source}
                  </label>
                ))}
              </div>
            </div>

            <div className="pif-divider" />

          
      

            {/* ── Invoice Info + Side Cards ─────────────────────────────── */}
            <div className="pif-compact-layout">
              {/* Left Column */}
              <div className="pif-left-column">

                {/* ── Supplier Section (TOP) ────────────────────────────────── */}
                <div className="pif-supplier-top-section">
                  <span className="pif-section-title">
                    <FaBuilding className="pif-section-icon" /> Supplier
                  </span>

                  <div className="pif-fields-row">
                    {/* Supplier */}
                    <div
                      className="pif-field"
                      ref={supplierSearchRef}
                      style={{ position: "relative" }}
                    >
                      <label className="pif-label">
                        <FaUsers className="pif-label-icon" />
                        Select Supplier <span className="pif-required">*</span>
                      </label>

                      <div className="warehouse-search-input-wrap">
                        <FaSearch className="warehouse-search-icon" />

                        <input
                          type="text"
                          className={`form-field warehouse-search-input ${
                            validationErrors.some(e => e.field === "supplier")
                              ? "field-error"
                              : ""
                          }`}
                          value={supplierSearch}
                          onChange={(e) => {
                            setSupplierSearch(e.target.value);
                            setShowSupplierDropdown(true);
                          }}
                          onFocus={() => setShowSupplierDropdown(true)}
                          placeholder={
                            loadingSuppliers
                              ? "Loading…"
                              : "Search supplier by name or mobile…"
                          }
                          disabled={loadingSuppliers || isEdit}
                        />

                        {selectedSupplier && (
                          <FaCheckCircle
                            style={{
                              position: "absolute",
                              right: 10,
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "#22c55e",
                              fontSize: 14,
                            }}
                          />
                        )}
                      </div>

                      {showSupplierDropdown && filteredSuppliers.length > 0 && (
                        <div className="warehouse-dropdown">
                          <ul className="warehouse-dropdown-list">
                            {filteredSuppliers.map((s) => (
                              <li
                                key={s.id}
                                className="warehouse-dropdown-item"
                                onClick={() => handleSelectSupplier(s)}
                              >
                                <div className="warehouse-item-name">
                                  {s.supplier_name}
                                </div>
                                <div className="warehouse-item-company">
                                  {s.mobile_no} · {s.supplier_group}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {showSupplierDropdown &&
                        filteredSuppliers.length === 0 &&
                        supplierSearch && (
                          <div className="warehouse-dropdown">
                            <div className="warehouse-dropdown-empty">
                              No suppliers found
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
      {/* ── PO Selection Section (Without GRN mode — POs with no GRN) ── */}
      {selectedSupplier && isManual && (
              <>
                <div className="pif-grn-po-section">
                  <div className="pif-field" ref={poSearchRef} style={{ position: 'relative', maxWidth: 500 }}>
                    <label className="pif-label">
                      <FaFileAlt className="pif-label-icon" />
                      Select Purchase Order (not yet received)
                    </label>
                    <div className="warehouse-search-input-wrap">
                      <FaSearch className="warehouse-search-icon" />
                      <input
                        type="text"
                        className="form-field warehouse-search-input"
                        value={poSearch}
                        onChange={e => { setPoSearch(e.target.value); setShowPoDropdown(true); }}
                        onFocus={() => setShowPoDropdown(true)}
                        placeholder={loadingPOList ? 'Loading…' : 'Search Purchase Order without a GRN…'}
                        disabled={loadingPOList}
                      />
                      {selectedPO && (
                        <FaCheckCircle style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: 14 }} />
                      )}
                    </div>
                    {showPoDropdown && (
                      <div className="warehouse-dropdown">
                        {filteredPOs.length > 0 ? (
                          <ul className="warehouse-dropdown-list">
                            {filteredPOs.map(po => (
                              <li
                                key={po.id}
                                className={`warehouse-dropdown-item ${selectedPO?.id === po.id ? 'warehouse-dropdown-item--selected' : ''}`}
                                onClick={() => handleSelectPOWithoutGRN(po)}
                              >
                                <div className="warehouse-item-name">
                                  {po.name}
                                  {selectedPO?.id === po.id && <FaCheckCircle style={{ color: '#22c55e', marginLeft: 6 }} />}
                                </div>
                                <div className="warehouse-item-company">{po.status}</div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="warehouse-dropdown-empty">
                            {poSearch ? 'No matching POs' : 'This supplier has no POs pending a GRN'}
                          </div>
                        )}
                      </div>
                    )}
                    <small style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4, display: 'block' }}>
                      Optional — pick this to pull in a PO's items directly (no GRN exists for it yet), or skip and add items manually below.
                    </small>
                  </div>
                </div>
                <div className="pif-divider" />
              </>
            )}
                <div className="pif-grid-2">
                  <div className="pif-field">
                    <label className="pif-label">
                      <FaCalendarAlt className="pif-label-icon" />
                      Invoice Date <span className="pif-required">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                      className={`form-field ${validationErrors.some(e => e.field === 'date') ? 'field-error' : ''}`}
                    />
                  </div>

                  <div className="pif-field">
                    <label className="pif-label">
                      <FaCalendarAlt className="pif-label-icon" />
                      Delivery Date
                    </label>
                    <input
                      type="date"
                      value={formData.deliveryDate}
                      onChange={e => setFormData(p => ({ ...p, deliveryDate: e.target.value }))}
                      className="form-field"
                    />
                  </div>
                </div>

                <div className="pif-grid-2">
                  <div className="pif-field">
                    <label className="pif-label"><FaFileAlt className="pif-label-icon" />This Bill No.</label>
                    <input
                      type="text"
                      value={formData.billNo}
                      onChange={e => setFormData(p => ({ ...p, billNo: e.target.value }))}
                      className="form-field"
                      placeholder="e.g., INV-1001"
                    />
                  </div>
                  <div className="pif-field">
                    <label className="pif-label"><FaFileAlt className="pif-label-icon" />Buyer Order Number</label>
                    <input
                      type="text"
                      value={formData.buyerOrderNumber}
                      onChange={e => setFormData(p => ({ ...p, buyerOrderNumber: e.target.value }))}
                      className="form-field"
                      placeholder="Enter buyer order number"
                    />
                  </div>
                </div>

                <div className="pif-grid-2">
                  <div className="pif-field">
                    <label className="pif-label"><FaUser className="pif-label-icon" />Payment Terms</label>
                    <input
                      type="text"
                      value={formData.paymentTerms}
                      onChange={e => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}
                      className="form-field"
                      placeholder="e.g., Net 30, COD, etc."
                    />
                  </div>
                  <div className="pif-field">
                    <label className="pif-label"><FaTruck className="pif-label-icon" />Vehicle Number</label>
                    <input
                      type="text"
                      value={formData.vehicleNumber}
                      onChange={e => setFormData(p => ({ ...p, vehicleNumber: e.target.value }))}
                      className="form-field"
                      placeholder="Optional"
                    />
                  </div>
  {/* ── PO + GRN Selection Section (GRN mode) ─────────────────── */}
  {selectedSupplier && isGRNMode && (
              <>
                <div className="pif-grn-po-section">
                  <div className="pif-fields-row">
                    {/* Purchase Order */}
                    <div className="pif-field" ref={poSearchRef} style={{ position: 'relative' }}>
                      <label className="pif-label">
                        <FaFileAlt className="pif-label-icon" />
                        Select Purchase Order
                      </label>
                      <div className="warehouse-search-input-wrap">
                        <FaSearch className="warehouse-search-icon" />
                        <input
                          type="text"
                          className={`form-field warehouse-search-input ${validationErrors.some(e => e.field === 'grn') ? 'field-error' : ''}`}
                          value={poSearch}
                          onChange={e => { setPoSearch(e.target.value); setShowPoDropdown(true); }}
                          onFocus={() => setShowPoDropdown(true)}
                          placeholder={loadingPOList ? 'Loading…' : 'Search Purchase Order…'}
                          disabled={loadingPOList}
                        />
                        {selectedPO && (
                          <FaCheckCircle style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: 14 }} />
                        )}
                      </div>
                      {showPoDropdown && (
                        <div className="warehouse-dropdown">
                          {filteredPOs.length > 0 ? (
                            <ul className="warehouse-dropdown-list">
                              {filteredPOs.map(po => (
                                <li
                                  key={po.id}
                                  className={`warehouse-dropdown-item ${selectedPO?.id === po.id ? 'warehouse-dropdown-item--selected' : ''}`}
                                  onClick={() => handleSelectPO(po)}
                                >
                                  <div className="warehouse-item-name">
                                    {po.name}
                                    {selectedPO?.id === po.id && <FaCheckCircle style={{ color: '#22c55e', marginLeft: 6 }} />}
                                  </div>
                                  <div className="warehouse-item-company">{po.status}</div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="warehouse-dropdown-empty">
                              {poSearch ? 'No POs found' : 'No Purchase Orders available for this supplier'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* GRN (multi-select) */}
                    <div className="pif-field" ref={grnSearchRef} style={{ position: 'relative' }}>
                      <label className="pif-label">
                        <FaClipboardList className="pif-label-icon" />
                        Select GRN(s) <span className="pif-required">*</span>
                      </label>
                      <div className="warehouse-search-input-wrap">
                        <FaSearch className="warehouse-search-icon" />
                        <input
                          type="text"
                          className={`form-field warehouse-search-input ${validationErrors.some(e => e.field === 'grn') ? 'field-error' : ''}`}
                          value={grnSearch}
                          onChange={e => { setGrnSearch(e.target.value); setShowGrnDropdown(true); }}
                          onFocus={() => setShowGrnDropdown(true)}
                          placeholder={loadingGRNList ? 'Loading…' : `Search GRN by number or PO… (${selectedGRNIds.size} selected)`}
                          disabled={loadingGRNList}
                        />
                      </div>
                      {showGrnDropdown && (
                        <div className="warehouse-dropdown">
                          {filteredGRNs.length > 0 ? (
                            <ul className="warehouse-dropdown-list">
                              {filteredGRNs.map(g => (
                                <li
                                  key={g.id}
                                  className={`warehouse-dropdown-item ${selectedGRNIds.has(g.id) ? 'warehouse-dropdown-item--selected' : ''}`}
                                  onMouseDown={(e) => { e.preventDefault(); handleSelectGRN(g); }}
                                >
                                  <div className="warehouse-item-name">
                                    {g.grn_number}
                                    {selectedGRNIds.has(g.id) && <FaCheckCircle style={{ color: '#22c55e', marginLeft: 6 }} />}
                                  </div>
                                  <div className="warehouse-item-company">
                                    {g.purchase_order_number || 'No PO'} · {g.total_received_qty} received · {g.status}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="warehouse-dropdown-empty">
                              {grnSearch ? 'No GRNs found' : 'No GRNs available for this supplier'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected GRN chips */}
                  {selectedGRNSummaries.length > 0 && (
                    <div className="pif-grn-chip-row">
                      {selectedGRNSummaries.map(g => (
                        <span key={g.id} className={`pif-grn-chip pif-grn-chip--${g.status.toLowerCase()}`}>
                          {g.grn_number}
                          <span className="pif-grn-badge-qty"> · {g.total_received_qty} rcvd</span>
                          <button type="button" onClick={() => toggleGRNSelection(g.id)} title="Remove">
                            <FaTimesCircle size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Badge strip of GRNs linked to the selected PO, for quick toggling */}
                  {linkedGRNsForPO.length > 0 && (
                    <div className="pif-grn-strip">
                      <span className="pif-grn-label">
                        GRNs linked to {selectedPO?.name} ({selectedGRNIds.size}/{linkedGRNsForPO.length} selected):
                      </span>
                      <div className="pif-grn-badges">
                        {linkedGRNsForPO.map(g => (
                          <label
                            key={g.id}
                            className={`pif-grn-badge pif-grn-badge--${g.status.toLowerCase()}`}
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedGRNIds.has(g.id)}
                              onChange={() => toggleGRNSelection(g.id)}
                            />
                            {g.grn_number}
                            <span className="pif-grn-badge-qty"> · {g.total_received_qty} rcvd</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pif-divider" />
              </>
            )}

                  {/* ── Warehouse picker (Manual / Without-GRN mode) ─────────── */}
                  {selectedSupplier && isManual && (
                    <>
                      <div className="pif-divider" />
                      <div className="pif-field" style={{ maxWidth: '500px' }}>
                        <label className="pif-label">
                          <FaWarehouse className="pif-label-icon" />
                          Warehouse <span className="pif-required">*</span>
                        </label>
                        <select
                          value={selectedWarehouseId}
                          onChange={e => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : '')}
                          className={`form-field ${validationErrors.some(e => e.field === 'warehouse') ? 'field-error' : ''}`}
                          disabled={loadingWarehouses}
                        >
                          <option value="">{loadingWarehouses ? 'Loading…' : 'Select warehouse'}</option>
                          {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.warehouse_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="pif-right-column">
                {/* Supplier detail card */}
                {selectedSupplier ? (
                  <div className="pif-party-detail-card">
                    <div className="pif-party-card-header">
                      <FaBuilding size={14} />
                      <span>Supplier Details</span>
                    </div>
                    <div className="pif-party-card-content">
                      <h3>{selectedSupplier.supplier_name}</h3>
                      <div className="pif-party-card-info">
                        {selectedSupplier.supplier_type && (
                          <div className="pif-party-info-item">
                            <span className="pif-party-info-label">Type</span>
                            <span className="pif-party-info-value">{selectedSupplier.supplier_type}</span>
                          </div>
                        )}
                        {selectedSupplier.supplier_group && (
                          <div className="pif-party-info-item">
                            <span className="pif-party-info-label">Group</span>
                            <span className="pif-party-info-value">{selectedSupplier.supplier_group}</span>
                          </div>
                        )}
                        {selectedSupplier.country && (
                          <div className="pif-party-info-item">
                            <span className="pif-party-info-label">Country</span>
                            <span className="pif-party-info-value"><FaGlobeAsia size={10} /> {selectedSupplier.country}</span>
                          </div>
                        )}
                        {selectedSupplier.mobile_no && (
                          <div className="pif-party-info-item">
                            <span className="pif-party-info-label">Mobile</span>
                            <span className="pif-party-info-value"><FaPhone size={10} /> {selectedSupplier.mobile_no}</span>
                          </div>
                        )}
                        {selectedSupplier.email_id && (
                          <div className="pif-party-info-item">
                            <span className="pif-party-info-label">Email</span>
                            <span className="pif-party-info-value"><FaEnvelope size={10} /> {selectedSupplier.email_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pif-party-detail-card pif-party-empty-card">
                    <div className="pif-party-card-header">
                      <FaBuilding size={14} />
                      <span>Supplier Details</span>
                    </div>
                    <div className="pif-party-card-content">
                      <div className="pif-party-empty-state">
                        <FaInfoCircle size={24} />
                        <p>Select a supplier to view details</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Charges */}
                <div className="pif-party-detail-card">
                  <div className="pif-party-card-header">
                    <FaMoneyBillWave size={14} />
                    <span>Delivery Charges</span>
                  </div>
                  <div className="pif-party-card-content">
                    <div className="pif-delivery-toggle" style={{ display: 'flex', gap: 6, marginBottom: formData.deliveryTerms === 'Paid' ? 10 : 0 }}>
                      <button
                        type="button"
                        style={{
                          flex: 1, textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 8,
                          background: formData.deliveryTerms === 'Free' ? '#7c3aed' : 'var(--card-bg)',
                          color: formData.deliveryTerms === 'Free' ? '#fff' : 'var(--text-secondary)',
                          padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                        onClick={() => setFormData(p => ({ ...p, deliveryTerms: 'Free', deliveryCharges: 0 }))}
                      >
                        Free
                      </button>
                      <button
                        type="button"
                        style={{
                          flex: 1, textAlign: 'center', border: '1px solid var(--border-color)', borderRadius: 8,
                          background: formData.deliveryTerms === 'Paid' ? '#7c3aed' : 'var(--card-bg)',
                          color: formData.deliveryTerms === 'Paid' ? '#fff' : 'var(--text-secondary)',
                          padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                        onClick={() => setFormData(p => ({ ...p, deliveryTerms: 'Paid' }))}
                      >
                        Paid
                      </button>
                    </div>
                    {formData.deliveryTerms === 'Paid' && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                          Amount
                        </label>
                        <input
                          type="number"
                          value={formData.deliveryCharges}
                          onChange={e => setFormData(p => ({ ...p, deliveryCharges: parseFloat(e.target.value) || 0 }))}
                          className="form-field"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="pif-party-detail-card">
                  <div className="pif-party-card-header">
                    <FaClipboardList size={14} />
                    <span>Status</span>
                  </div>
                  <div className="pif-party-card-content">
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      className="form-field"
                    >
                      {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="pif-divider" />

            {/* ── Items ────────────────────────────────────────────────── */}
            <div className="pif-table-header-row">
              <span className="pif-section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                <FaBoxes className="pif-section-icon" /> Items
              </span>
              {isManual && (
                <button type="button" onClick={handleAddManualItem} className="pif-add-item-btn">
                  <FaPlus /> Add Item
                </button>
              )}
            </div>

            {(loadingPODetail || loadingGRNs) && (
              <div className="pif-loading-msg" style={{ padding: '12px 0' }}>
                <FaSpinner className="spinning" size={14} /> Building invoice from GRN/PO data…
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
                        <th className="pif-ith">HSN</th>
                        <th className="pif-ith pif-ith-num">Ordered Qty</th>
                        <th className="pif-ith pif-ith-num">Received Qty</th>
                        <th className="pif-ith pif-ith-num">Bill Qty</th>
                        <th className="pif-ith">UOM</th>
                        <th className="pif-ith pif-ith-num">Ordered Rate</th>
                        <th className="pif-ith pif-ith-num">Rate</th>
                        <th className="pif-ith pif-ith-num">Amount</th>
                        <th className="pif-ith pif-ith-num">Tax%</th>
                        <th className="pif-ith pif-ith-note">Note</th>
                        {isManual && <th className="pif-ith">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((row, i) => (
                        <tr key={row.id || i} className={`pif-itr ${row.unbilled_qty === 0 ? 'pif-itr--zero' : ''}`}>
                          <td className="pif-itd pif-itd-no">{i + 1}</td>
                          <td className="pif-itd" style={{ position: 'relative', overflow: 'visible' }}>
                            {isManual ? (
                              <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                  type="text"
                                  value={row.item_code}
                                  onChange={e => {
                                    setItemSearch(e.target.value);
                                    setSelectedItemIndex(i);
                                    setShowItemDropdown(true);
                                    handleItemFieldChange(i, 'item_code', e.target.value);
                                  }}
                                  onFocus={() => {
                                    setSelectedItemIndex(i);
                                    setShowItemDropdown(true);
                                    setItemSearch(row.item_code);
                                  }}
                                  onBlur={() => {
                                    setTimeout(() => {
                                      setShowItemDropdown(false);
                                    }, 200);
                                  }}
                                  className="pif-cell-input"
                                  placeholder="Search item..."
                                  autoComplete="off"
                                />
                                {showItemDropdown && selectedItemIndex === i && (
                                  <div className="pif-dropdown-wrapper">
                                    <div className="pif-dropdown-down">
                                      {filteredItems.length > 0 ? (
                                        <ul className="pif-dropdown-list">
                                          {filteredItems.map(item => (
                                            <li
                                              key={item.id}
                                              className="pif-dropdown-item"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleSelectItem(item, i);
                                              }}
                                            >
                                              <div className="pif-dropdown-item-code">
                                                <span className="pif-item-code-highlight">{item.item_code}</span>
                                              </div>
                                              <div className="pif-dropdown-item-name">{item.item_name}</div>
                                              <div className="pif-dropdown-item-details">
                                                <span className="pif-item-rate">₹{item.standard_rate}</span>
                                                <span className="pif-item-uom">{item.stock_uom}</span>
                                                <span className="pif-item-group">{item.item_group}</span>
                                              </div>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <div className="pif-dropdown-empty">
                                          {itemSearch ? 'No items found' : 'Type to search items...'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={row.item_code}
                                onChange={e => handleItemFieldChange(i, 'item_code', e.target.value)}
                                className="pif-cell-input"
                                placeholder="Item code"
                              />
                            )}
                          </td>
                          <td className="pif-itd">
                            <input
                              type="text"
                              value={row.item_name}
                              onChange={e => handleItemFieldChange(i, 'item_name', e.target.value)}
                              className="pif-cell-input"
                              placeholder="Item name"
                            />
                          </td>
                          <td className="pif-itd">
                            <input
                              type="text"
                              value={row.HSN || ''}
                              onChange={e => handleItemFieldChange(i, 'HSN', e.target.value)}
                              className="pif-cell-input"
                              placeholder="HSN"
                            />
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">{row.ordered_qty}</span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">{row.total_received_qty}</span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            {isManual ? (
                              <input
                                type="number"
                                value={row.bill_qty}
                                onChange={e => handleItemFieldChange(i, 'bill_qty', parseFloat(e.target.value) || 0)}
                                className="pif-cell-input pif-cell-number"
                                min="0"
                                step="any"
                              />
                            ) : (
                              <input
                                type="number"
                                className="pif-cell-input pif-cell-number"
                                value={row.bill_qty}
                                min={0}
                                max={row.unbilled_qty}
                                step="any"
                                onChange={e => handleBillQtyChange(i, Number(e.target.value))}
                                disabled={row.unbilled_qty === 0}
                                title={row.unbilled_qty === 0 ? 'Already fully billed' : `Max: ${row.unbilled_qty}`}
                              />
                            )}
                          </td>
                          <td className="pif-itd">
                            <select
                              value={row.uom}
                              onChange={e => handleItemFieldChange(i, 'uom', e.target.value)}
                              className="pif-cell-input"
                            >
                              <option value="Nos">Nos</option>
                              <option value="Kg">Kg</option>
                              <option value="Ltr">Ltr</option>
                              <option value="Mtr">Mtr</option>
                              <option value="Pcs">Pcs</option>
                              <option value="Meter">Meter</option>
                              <option value="Gram">Gram</option>
                            </select>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <span className="pif-cell-readonly">
                              {row.ordered_rate ? row.ordered_rate.toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <input
                              type="number"
                              value={row.rate}
                              onChange={e => handleItemFieldChange(i, 'rate', parseFloat(e.target.value) || 0)}
                              className="pif-cell-input pif-cell-number"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="pif-itd pif-itd-num pif-amount">
                            ₹ {row.amount.toFixed(2)}
                          </td>
                          <td className="pif-itd pif-itd-num">
                            <select
                              value={row.tax_rate}
                              onChange={e => handleItemFieldChange(i, 'tax_rate', parseFloat(e.target.value) || 0)}
                              className="pif-cell-input"
                            >
                              {taxes.map(tax => {
                                const rate = parseInt(tax.tax_type.replace('GST', ''));
                                return (
                                  <option key={tax.tax_id} value={rate}>
                                    {tax.tax_type}
                                  </option>
                                );
                              })}
                            </select>
                          </td>
                          <td className="pif-itd pif-itd-note" style={{ position: 'relative' }}>
                            <button
                              type="button"
                              className={`pif-note-btn ${row.note ? 'pif-note-btn--filled' : ''}`}
                              onClick={() => setNotePopoverIndex(notePopoverIndex === i ? null : i)}
                              title={row.note || 'Add note'}
                            >
                              <FaStickyNote size={12} />
                            </button>
                            {notePopoverIndex === i && (
                              <div className="pif-note-popover">
                                <textarea
                                  className="pif-note-textarea"
                                  value={row.note || ''}
                                  onChange={e => handleItemFieldChange(i, 'note', e.target.value)}
                                  onBlur={() => setTimeout(() => setNotePopoverIndex(null), 150)}
                                  placeholder="e.g. Received 100kg metal of 3 roll"
                                  rows={3}
                                  autoFocus
                                />
                              </div>
                            )}
                          </td>
                          {isManual && (
                            <td className="pif-itd">
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(i)}
                                className="pif-remove-item-btn"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals summary */}
                <div className="pif-totals-block">
                  <div className="pif-totals-row">
                    <span>Sub Total</span>
                    <span>₹ {subTotal.toFixed(2)}</span>
                  </div>
                  {(formData.cgst > 0 || formData.sgst > 0) && (
                    <>
                      <div className="pif-totals-row">
                        <span>CGST ({formData.cgst}%)</span>
                        <span>₹ {cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="pif-totals-row">
                        <span>SGST ({formData.sgst}%)</span>
                        <span>₹ {sgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="pif-totals-row">
                        <span>Total GST</span>
                        <span>₹ {totalTax.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {formData.deliveryCharges > 0 && (
                    <div className="pif-totals-row">
                      <span>Delivery Charges</span>
                      <span>₹ {formData.deliveryCharges.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pif-totals-row pif-totals-grand">
                    <span>Grand Total</span>
                    <span>₹ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            {isGRNMode && !loadingGRNs && !loadingPODetail && !selectedPO && selectedGRNIds.size === 0 && items.length === 0 && (
              <div className="pif-empty-items">
                <FaClipboardList size={32} style={{ opacity: 0.3 }} />
                <p>{selectedSupplier ? 'Select a Purchase Order or GRN above to load items.' : 'Select a supplier to see their POs and GRNs.'}</p>
              </div>
            )}

            {isManual && items.length === 0 && (
              <div className="pif-empty-items">
                <FaBoxes size={32} style={{ opacity: 0.3 }} />
                <p>Select a PO above, or click "Add Item" and search the item catalog.</p>
              </div>
            )}

            {validationErrors.some(e => e.field === 'items') && (
              <div className="pif-error-msg" style={{ marginTop: 8 }}>
                <FaExclamationCircle size={10} /> At least one item must have quantity &gt; 0
              </div>
            )}

            {/* Notes */}
            <div className="pif-field" style={{ marginTop: 4 }}>
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
            <button type="button" onClick={handlePrint} className="print-btn" disabled={items.length === 0}>
              <FaPrint /> Print
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