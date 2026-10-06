import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./DebitForm.css";
import api from "../services/api";
import { FaArrowLeft, FaExclamationTriangle, FaEye } from "react-icons/fa";

/* ----------------------------- Interfaces ----------------------------- */

interface Supplier {
  id: number;
  name: string;
  supplier_name: string;
  supplier_group?: string;
  mobile_no?: string;
  email_id?: string;
  primary_address?: string;
  country?: string;
}

interface BankDetails {
  id: number;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  micr_code: string | null;
  swift_code: string | null;
  iban: string | null;
  upi_id: string | null;
  currency: string;
  opening_balance: number;
  verified: number;
  is_primary: number;
}

interface Company {
  id: number;
  company_name: string;
  abbr: string;
  default_currency: string;
  country: string;
  bank_details: BankDetails[];
}

/**
 * Unified reference record — used for BOTH Purchase Invoice (bill)
 * and Purchase Order.
 */
interface ReferenceRecord {
  id: number;
  refNo: string;          // display: "PINV-102" or "PO-2026-368"
  grandTotal: number;
  date: string;           // posting_date or transaction_date
  supplier: string;       // supplier id as string
  supplierName: string;
  company: string;
  currency: string;
}

interface TransactionHistoryRow {
  id: number;
  entry_no: string;
  entry_date: string;
  entry_type: "Credit" | "Debit";
  payment_type: string;
  total_amount: number;
  narration: string;
  status: string;
  transaction_id: string | number | null;
}

type ReferenceType = "Purchase Bill" | "Purchase Order";

interface DebitFormData {
  entryNo: string;
  entryType: "Credit" | "Debit";
  debitDate: string;
  companyId: number | "";
  supplierId: number | "";
  supplierName: string;
  /** ✅ party_name returned by the API (used in edit/view) */
  partyName: string;
  referenceType: ReferenceType;
  referenceId: number | "";
  referenceNo: string;
  referenceDate: string;
  grandTotal: number | "";
  purchaseOrderNo: string;
  grnNo: string;
  paymentType: string;
  bankId: number | "";
  transactionId: string;
  transactionDate: string;
  amount: string;
  narration: string;
}

/* ----------------------------- Constants ------------------------------ */

const initialFormData: DebitFormData = {
  entryNo: "",
  entryType: "Debit",
  debitDate: new Date().toISOString().split("T")[0],
  companyId: "",
  supplierId: "",
  supplierName: "",
  partyName: "",
  referenceType: "Purchase Bill",
  referenceId: "",
  referenceNo: "",
  referenceDate: "",
  grandTotal: "",
  purchaseOrderNo: "",
  grnNo: "",
  paymentType: "NEFT",
  bankId: "",
  transactionId: "",
  transactionDate: new Date().toISOString().split("T")[0],
  amount: "",
  narration: "",
};

const TRANSFER_MODES = [
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "RTGS", label: "RTGS" },
  { value: "SWIFT", label: "SWIFT" },
  { value: "Net Banking", label: "Net Banking" },
  { value: "Card Payment", label: "Card Payment" },
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Cheque", label: "Cheque" },
  { value: "Other", label: "Other" },
];

const REFERENCE_TYPES: ReferenceType[] = ["Purchase Bill", "Purchase Order"];
const ENTRY_TYPE_OPTIONS: Array<"Credit" | "Debit"> = ["Credit", "Debit"];

/* ----------------------------- Helpers -------------------------------- */

const toYMD = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const safeLower = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).toLowerCase();

const formatMoney = (v: unknown): string => {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-IN");
};

const formatDateDisplay = (value: string | null | undefined): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Normalize a raw record from /purchase-invoice OR /purchase-order
 * into the unified ReferenceRecord shape.
 */
const normalizeReference = (raw: any, type: ReferenceType): ReferenceRecord => {
  const isOrder = type === "Purchase Order";

  let refNo = "";
  if (isOrder) {
    refNo = String(raw?.name ?? (raw?.id != null ? `PO-${raw.id}` : ""));
  } else {
    const prefix = (raw?.naming_series ?? "PINV-").toString();
    refNo =
      raw?.name && raw.name !== prefix.replace(/-$/, "")
        ? `${raw.name}`
        : `${prefix}${raw?.id ?? ""}`;
    if (!refNo || refNo === prefix) {
      refNo = `PINV-${raw?.id ?? ""}`;
    }
  }

  const total =
    raw?.grand_total ??
    raw?.rounded_total ??
    raw?.total ??
    raw?.net_total ??
    0;

  const date = isOrder
    ? raw?.transaction_date ?? raw?.schedule_date ?? ""
    : raw?.posting_date ?? raw?.bill_date ?? raw?.date ?? "";

  const supplier =
    raw?.supplier ?? (raw?.supplier_id != null ? String(raw.supplier_id) : "");

  return {
    id: Number(raw?.id ?? 0),
    refNo,
    grandTotal: Number(total) || 0,
    date: String(date),
    supplier: String(supplier ?? ""),
    supplierName: String(raw?.supplier_name ?? ""),
    company: String(raw?.company ?? ""),
    currency: String(raw?.currency ?? "INR"),
  };
};

/* --------------------------- Component -------------------------------- */

const DebitForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const entryId = searchParams.get("id");
  const referenceTypeParam = searchParams.get("referenceType");
  const referenceIdParam = searchParams.get("referenceId");

  const isEditOrView = !!entryId && (mode === "edit" || mode === "view");
  const isReadOnly = mode === "view";

  const [formData, setFormData] = useState<DebitFormData>(initialFormData);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<TransactionHistoryRow[]>([]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DebitFormData, string>>
  >({});

  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [refSearch, setRefSearch] = useState("");
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const supplierRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLDivElement>(null);

  /* ----------------------------- Effects ----------------------------- */

  useEffect(() => {
    fetchSuppliers();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (company?.bank_details?.length) {
      const primary =
        company.bank_details.find((b) => b.is_primary === 1) ||
        company.bank_details[0];
      setFormData((prev) => ({
        ...prev,
        bankId: prev.bankId || primary.id,
      }));
    }
  }, [company]);

  useEffect(() => {
    if (isEditOrView) return;
    if (formData.supplierId) {
      fetchReferences(formData.supplierId as number, formData.referenceType);
    } else {
      setReferences([]);
    }
  }, [formData.supplierId, formData.referenceType, isEditOrView]);

  useEffect(() => {
    if (formData.paymentType === "Cash") setShowBankDetails(false);
  }, [formData.paymentType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        supplierRef.current &&
        !supplierRef.current.contains(e.target as Node)
      ) {
        setShowSupplierDropdown(false);
      }
      if (refRef.current && !refRef.current.contains(e.target as Node)) {
        setShowRefDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ✅ Load transaction details for edit/view */
  useEffect(() => {
    if (!referenceTypeParam || !referenceIdParam) return;

    const fetchTransactionDetails = async () => {
      setLoadingTransaction(true);
      try {
        const url = `/account_entry/transactions/${encodeURIComponent(
          referenceTypeParam
        )}/${referenceIdParam}`;

        const response = await api.get(url);

        if (response.data?.success === 1) {
          const rawData = response.data.data;
          const records: any[] = Array.isArray(rawData)
            ? rawData
            : rawData?.records ?? [];

          const current =
            records.find((r) => String(r.id) === String(entryId)) ||
            records[0] ||
            {};

          /* ✅ Resolve party_name — API returns it directly for Debit */
          const resolvedPartyName =
            current.party_name ??
            current.supplier_name ??
            (current.party_id != null ? String(current.party_id) : "");

          const isPO = current.reference_type === "Purchase Order";

          setFormData((prev) => ({
            ...prev,

            entryNo: current.entry_no ?? prev.entryNo,
            entryType:
              (current.entry_type as "Credit" | "Debit") ?? prev.entryType,
            debitDate: toYMD(current.entry_date) || prev.debitDate,
            companyId: current.company_id ?? prev.companyId,
            supplierId: current.party_id ?? prev.supplierId,
            supplierName:
              current.supplier_name ??
              current.party_name ??
              prev.supplierName,
            /* ✅ NEW — persist party_name */
            partyName: resolvedPartyName || prev.partyName,
            referenceType:
              (current.reference_type as ReferenceType) ?? prev.referenceType,
            referenceId: current.reference_id ?? prev.referenceId,
            referenceNo: current.reference_no ?? prev.referenceNo,
            referenceDate:
              toYMD(current.reference_date) || prev.referenceDate,
            grandTotal:
              current.total_amount != null
                ? current.total_amount
                : prev.grandTotal,
            purchaseOrderNo:
              current.purchase_order_no ??
              (isPO ? current.reference_no : prev.purchaseOrderNo),
            grnNo: current.grn_no ?? prev.grnNo,
            paymentType: current.payment_type ?? prev.paymentType,
            bankId: current.bank_detail_id ?? prev.bankId,
            transactionId:
              current.transaction_id != null
                ? String(current.transaction_id)
                : prev.transactionId,
            transactionDate:
              toYMD(current.transaction_date) || prev.transactionDate,
            amount:
              current.total_amount != null
                ? String(current.total_amount)
                : prev.amount,
            narration: current.narration ?? prev.narration,
          }));

          /* ✅ Supplier input shows party_name when available */
          setSupplierSearch(resolvedPartyName);

          /* ✅ Show reference_id (e.g. 95) in the PO/PBill field */
          setRefSearch(
            current.reference_id != null
              ? String(current.reference_id)
              : current.reference_no ?? ""
          );

          const historyRows: TransactionHistoryRow[] = records
            .filter((r) => String(r.id) !== String(entryId))
            .map((r) => ({
              id: r.id,
              entry_no: r.entry_no,
              entry_date: r.entry_date,
              entry_type: r.entry_type,
              payment_type: r.payment_type,
              total_amount: r.total_amount,
              narration: r.narration,
              status: r.status,
              transaction_id: r.transaction_id,
            }));

          setHistory(historyRows);
        }
      } catch (err: any) {
        console.error("Failed to load transaction details:", err);
        alert(
          err.response?.data?.message || "Failed to load transaction details"
        );
      } finally {
        setLoadingTransaction(false);
      }
    };

    fetchTransactionDetails();
  }, [referenceTypeParam, referenceIdParam, entryId]);

  /* ---------------------------- Fetchers ----------------------------- */

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get("/supplier?limit=1000");
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];
        const normalized: Supplier[] = records.map((s) => ({
          id: Number(s?.id ?? 0),
          name: String(s?.name ?? ""),
          supplier_name: String(s?.supplier_name ?? s?.name ?? ""),
          supplier_group: s?.supplier_group ?? "",
          mobile_no: s?.mobile_no ?? "",
          email_id: s?.email_id ?? "",
          primary_address: s?.primary_address ?? "",
          country: s?.country ?? "",
        }));
        setSuppliers(normalized);
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompany(true);
    try {
      const response = await api.get("/company");
      if (
        response.data?.success === 1 &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        const list: Company[] = response.data.data;
        setCompanies(list);
        const first = list[0];
        setCompany(first);
        setFormData((prev) => ({
          ...prev,
          companyId: prev.companyId || first.id,
        }));
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const fetchReferences = async (
    supplierId: number,
    type: ReferenceType
  ) => {
    setLoadingReferences(true);
    try {
      const endpoint =
        type === "Purchase Order"
          ? "/purchase-order?page=1&limit=10000"
          : "/purchase-invoice?page=1&limit=10000";

      const response = await api.get(endpoint);
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];

        const normalized = records.map((r) => normalizeReference(r, type));

        const selectedSupplier = suppliers.find((s) => s.id === supplierId);
        const supplierName =
          selectedSupplier?.supplier_name || selectedSupplier?.name || "";
        const sid = String(supplierId);

        const filtered = normalized.filter(
          (r) =>
            r.supplier === sid ||
            r.supplier === supplierName ||
            r.supplierName === supplierName
        );

        setReferences(filtered.length > 0 ? filtered : normalized);
      } else {
        setReferences([]);
      }
    } catch (err) {
      console.error(`Error fetching ${type}:`, err);
      setReferences([]);
    } finally {
      setLoadingReferences(false);
    }
  };

  /* ---------------------------- Handlers ----------------------------- */

  const handleCancel = () => {
    window.history.back();
  };

  const handleChange = (
    field: keyof DebitFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleReferenceTypeChange = (type: ReferenceType) => {
    setFormData((prev) => ({
      ...prev,
      referenceType: type,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setRefSearch("");
    setReferences([]);
  };

  const handleCompanyChange = (id: number) => {
    const selected = companies.find((c) => c.id === id) || null;
    setCompany(selected);
    const primary =
      selected?.bank_details?.find((b) => b.is_primary === 1) ||
      selected?.bank_details?.[0];

    setFormData((prev) => ({
      ...prev,
      companyId: id,
      bankId: primary?.id || "",
      supplierId: "",
      supplierName: "",
      partyName: "",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setSupplierSearch("");
    setRefSearch("");
    setReferences([]);
    setErrors((prev) => ({ ...prev, companyId: "" }));
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    const displayName = supplier.supplier_name || supplier.name || "";
    setFormData((prev) => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: displayName,
      /* ✅ mirror into partyName so save/payload is consistent */
      partyName: displayName,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setSupplierSearch(displayName);
    setShowSupplierDropdown(false);
    setErrors((prev) => ({ ...prev, supplierId: "" }));
  };

  const handleReferenceSelect = (ref: ReferenceRecord) => {
    setFormData((prev) => ({
      ...prev,
      referenceId: ref.id,
      referenceNo: ref.refNo,
      referenceDate: toYMD(ref.date),
      grandTotal: ref.grandTotal || "",
      purchaseOrderNo:
        prev.referenceType === "Purchase Order"
          ? ref.refNo
          : prev.purchaseOrderNo,
      grnNo: "",
      amount: ref.grandTotal ? String(ref.grandTotal) : "",
    }));
    setRefSearch(ref.refNo);
    setShowRefDropdown(false);
    setErrors((prev) => ({ ...prev, referenceId: "", amount: "" }));
  };

  const clearSupplier = () => {
    setFormData((prev) => ({
      ...prev,
      supplierId: "",
      supplierName: "",
      partyName: "",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setSupplierSearch("");
    setRefSearch("");
    setReferences([]);
  };

  const clearReference = () => {
    setFormData((prev) => ({
      ...prev,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setRefSearch("");
  };

  const openHistoryEntry = (row: TransactionHistoryRow) => {
    const params = new URLSearchParams({
      id: String(row.id),
      mode: isReadOnly ? "view" : "edit",
      referenceType: referenceTypeParam || formData.referenceType,
      referenceId: String(referenceIdParam || formData.referenceId),
    });
    navigate(`/receivables/new-debits?${params.toString()}`);
  };

  /* ---------------------------- Filters ------------------------------ */

  const filteredSuppliers = suppliers.filter((s) =>
    safeLower(s.supplier_name || s.name).includes(safeLower(supplierSearch))
  );

  const filteredReferences = references.filter((r) => {
    const label = `${safeLower(r.refNo)} ${safeLower(r.grandTotal)}`;
    return label.includes(safeLower(refSearch));
  });

  /* -------------------------- Validation ----------------------------- */

  const validateForm = () => {
    const newErrors: Partial<Record<keyof DebitFormData, string>> = {};

    if (!formData.debitDate) newErrors.debitDate = "Debit date is required";
    if (!formData.companyId) newErrors.companyId = "Company is required";
    if (!formData.supplierId) newErrors.supplierId = "Supplier is required";
    if (!formData.referenceType)
      newErrors.referenceType = "Reference type is required";
    if (!formData.referenceId)
      newErrors.referenceId = `${formData.referenceType} is required`;
    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (formData.paymentType !== "Cash" && !formData.bankId)
      newErrors.bankId = "Please select a paying bank account";
    if (formData.paymentType !== "Cash" && !formData.transactionId.trim())
      newErrors.transactionId =
        "Transaction ID is required for non-cash payments";
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narration.trim())
      newErrors.narration = "Narration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ------------------------------ Save ------------------------------- */

  const saveDebitDetails = async () => {
    const isPO = formData.referenceType === "Purchase Order";

    const payload = {
      entry_no: formData.entryNo || undefined,
      entry_date: toYMD(formData.debitDate),
      entry_type: formData.entryType || "Debit",
      company_id: formData.companyId || company?.id || 1,
      bank_detail_id: formData.bankId || null,
      transaction_id: formData.transactionId.trim(),
      transaction_date: toYMD(formData.transactionDate),
      party_type: "Supplier",
      party_id: formData.supplierId,
      /* ✅ Send party_name along with the rest of the payload */
      party_name: formData.partyName || formData.supplierName || "",
      reference_type: formData.referenceType,
      reference_id: formData.referenceId,
      reference_no: formData.referenceNo,
      reference_date: toYMD(formData.referenceDate),
      purchase_invoice_no: isPO ? null : formData.referenceNo,
      sales_invoice_no: null,
      purchase_order_no: isPO ? formData.referenceNo : formData.purchaseOrderNo,
      sales_order_no: null,
      grn_no: formData.grnNo || null,
      delivery_note_no: null,
      currency: company?.default_currency?.toUpperCase() || "INR",
      total_amount: Number(formData.amount),
      payment_type: formData.paymentType,
      narration: formData.narration,
      status: "Draft",
      created_by: 1,
      modified_by: 1,
    };

    if (isEditOrView && entryId) {
      const response = await api.put(`/account_entry/${entryId}`, payload);
      return response.data;
    }
    const response = await api.post("/account_entry", payload);
    return response.data;
  };

  const handleSaveContinue = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const result = await saveDebitDetails();
      const entryNo =
        result?.data?.entry_no || formData.entryNo || "ACC-XXXXX";

      setSuccessMessage(
        isEditOrView
          ? `✅ Account entry ${entryNo} updated successfully.`
          : `✅ Account entry ${entryNo} created successfully for ${formData.referenceType} ${formData.referenceNo}.`
      );

      if (!isEditOrView) {
        const defaultBankId =
          company?.bank_details?.find((b) => b.is_primary === 1)?.id ||
          company?.bank_details?.[0]?.id ||
          "";

        setFormData({
          ...initialFormData,
          debitDate: new Date().toISOString().split("T")[0],
          transactionDate: new Date().toISOString().split("T")[0],
          companyId: formData.companyId,
          referenceType: formData.referenceType,
          bankId: defaultBankId,
        });
        setSupplierSearch("");
        setRefSearch("");
        setReferences([]);
        setErrors({});
        setShowBankDetails(false);
      }

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save debit details");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ Derived ---------------------------- */

  const selectedBank =
    company?.bank_details?.find((b) => b.id === formData.bankId) || null;

  const isViewMode = false;
  const isEdit = false;
  const isPurchaseOrder = formData.referenceType === "Purchase Order";
  const refLabel = isPurchaseOrder
    ? "Purchase Order No."
    : "Purchase Bill No.";
  const refPlaceholder = !formData.supplierId
    ? "Select supplier first"
    : loadingReferences
    ? `Loading ${isPurchaseOrder ? "purchase orders" : "purchase bills"}...`
    : `Search ${isPurchaseOrder ? "purchase order" : "purchase bill"}`;

  /* ------------------------------ Render ----------------------------- */

  if (loadingTransaction) {
    return (
      <div className="rd-credit-page">
        <div className="rd-credit-card">
          <div style={{ padding: 40, textAlign: "center" }}>
            Loading transaction details…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rd-credit-page">
      <div className="rd-credit-top-bar">
      <div className="pof-header">
                <button onClick={handleCancel} className="pof-back-btn">
                  <FaArrowLeft size={9} /> Back
                </button>
                <div className="pof-header-title">
                  <h1>
                    {isViewMode ? 'View Debit Entry' : isEdit ? 'Edit Debit Entry' : 'Debit Details'}
                  </h1>
                  {/*{isViewMode && (
                    <span className="pof-view-mode-badge" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#6366f1',
                      color: '#ffffff',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 500,
                      marginLeft: '12px',
                    }}>/
                      <FaEye size={12} />
                      View Mode
                    </span>
                  )*/}
                  {isEdit && !isViewMode && <span className="pof-status-badge">{formData.referenceType}</span>}
                </div>
                {!isViewMode && Object.keys(errors).length > 0 && (
                  <div className="pof-error-badge">
                    <FaExclamationTriangle size={12} />
                    {Object.keys(errors).length} missing field{Object.keys(errors).length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
      </div>
      <div className="rd-credit-card">
        <div className="rd-credit-header">
          <h2>
            REFERENCE DETAILS – DEBIT FORM
            {isReadOnly ? " (View)" : isEditOrView ? " (Edit)" : ""}
          </h2>
        </div>

        {successMessage && (
          <div className="rd-credit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-credit-form">
          {/* ROW 1 — Entry No | Entry Type | Debit Date | Company */}
          <div className="rd-credit-row four-column">
            <div className="rd-credit-field">
              <label>Entry No</label>
              <input
                type="text"
                value={formData.entryNo}
                placeholder="Auto-generated"
                disabled
              />
            </div>

            <div className="rd-credit-field">
              <label>Entry Type</label>
              <select
                value={formData.entryType}
                onChange={(e) =>
                  handleChange(
                    "entryType",
                    e.target.value as "Credit" | "Debit"
                  )
                }
                disabled={isReadOnly}
              >
                {ENTRY_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="rd-credit-field">
              <label>
                Debit Date <span>*</span>
              </label>
              <input
                type="date"
                value={formData.debitDate}
                onChange={(e) => handleChange("debitDate", e.target.value)}
                disabled={isReadOnly}
              />
              {errors.debitDate && (
                <small className="rd-credit-error">{errors.debitDate}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Company <span>*</span>
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => handleCompanyChange(Number(e.target.value))}
                disabled={loadingCompany || isReadOnly}
              >
                <option value="">
                  {loadingCompany
                    ? "Loading companies..."
                    : "-- Select Company --"}
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.abbr})
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <small className="rd-credit-error">{errors.companyId}</small>
              )}
            </div>
          </div>

          {/* ROW 2 — Supplier | Reference Type */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Supplier <span>*</span>
              </label>
              <div className="rd-credit-searchable" ref={supplierRef}>
                <div className="rd-credit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      loadingSuppliers
                        ? "Loading suppliers..."
                        : "Search or select supplier"
                    }
                    /* ✅ In edit/view, show the resolved party_name from API */
                    value={
                      isEditOrView && formData.partyName
                        ? formData.partyName
                        : supplierSearch
                    }
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    disabled={loadingSuppliers || isReadOnly}
                  />
                  {((isEditOrView && formData.partyName) ||
                    (!isEditOrView && supplierSearch)) &&
                    !isReadOnly && (
                      <button
                        type="button"
                        className="rd-credit-searchable-clear"
                        onClick={clearSupplier}
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  <span className="rd-credit-searchable-chevron">▾</span>
                </div>

                {showSupplierDropdown && !isReadOnly && (
                  <div className="rd-credit-searchable-menu">
                    {filteredSuppliers.length === 0 ? (
                      <div className="rd-credit-searchable-empty">
                        No suppliers found
                      </div>
                    ) : (
                      filteredSuppliers.slice(0, 100).map((supplier) => (
                        <div
                          key={supplier.id}
                          className={`rd-credit-searchable-item ${
                            formData.supplierId === supplier.id ? "active" : ""
                          }`}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <span className="rd-credit-searchable-name">
                            {supplier.supplier_name || supplier.name || "—"}
                          </span>
                          {supplier.supplier_group && (
                            <span className="rd-credit-searchable-tag">
                              {supplier.supplier_group}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.supplierId && (
                <small className="rd-credit-error">{errors.supplierId}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Reference Type <span>*</span>
              </label>
              <select
                value={formData.referenceType}
                onChange={(e) =>
                  handleReferenceTypeChange(e.target.value as ReferenceType)
                }
                disabled={isReadOnly}
              >
                {REFERENCE_TYPES.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
              {errors.referenceType && (
                <small className="rd-credit-error">{errors.referenceType}</small>
              )}
            </div>
          </div>

          {/* ROW 3 — Reference No. | Payment Mode | Paying Bank */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                {refLabel} <span>*</span>
              </label>
              <div className="rd-credit-searchable" ref={refRef}>
                <div className="rd-credit-searchable-input">
                  <input
                    type="text"
                    placeholder={refPlaceholder}
                    value={refSearch}
                    onChange={(e) => {
                      setRefSearch(e.target.value);
                      setShowRefDropdown(true);
                    }}
                    onFocus={() => setShowRefDropdown(true)}
                    disabled={
                      !formData.supplierId || loadingReferences || isReadOnly
                    }
                  />
                  {refSearch && !isReadOnly && (
                    <button
                      type="button"
                      className="rd-credit-searchable-clear"
                      onClick={clearReference}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <span className="rd-credit-searchable-chevron">▾</span>
                </div>

                {showRefDropdown && !isReadOnly && (
                  <div className="rd-credit-searchable-menu">
                    {filteredReferences.length === 0 ? (
                      <div className="rd-credit-searchable-empty">
                        {references.length === 0
                          ? `No ${
                              isPurchaseOrder
                                ? "purchase orders"
                                : "purchase bills"
                            } found`
                          : "No matching results"}
                      </div>
                    ) : (
                      filteredReferences.slice(0, 100).map((r) => (
                        <div
                          key={r.id}
                          className={`rd-credit-searchable-item ${
                            formData.referenceId === r.id ? "active" : ""
                          }`}
                          onClick={() => handleReferenceSelect(r)}
                        >
                          <div className="rd-credit-searchable-row">
                            <span className="rd-credit-searchable-name">
                              {r.refNo || `#${r.id}`}
                            </span>
                            <span className="rd-credit-searchable-amount">
                              ₹{formatMoney(r.grandTotal)}
                            </span>
                          </div>
                          {r.date && (
                            <span className="rd-credit-searchable-sub">
                              {new Date(r.date).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.referenceId && (
                <small className="rd-credit-error">{errors.referenceId}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Payment Mode <span>*</span>
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => handleChange("paymentType", e.target.value)}
                disabled={isReadOnly}
              >
                {TRANSFER_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
              {errors.paymentType && (
                <small className="rd-credit-error">{errors.paymentType}</small>
              )}
            </div>

            {formData.paymentType !== "Cash" && (
              <div className="rd-credit-field">
                <label>
                  Paying Bank <span>*</span>
                </label>
                {loadingCompany ? (
                  <select disabled>
                    <option>Loading banks...</option>
                  </select>
                ) : company && company.bank_details?.length ? (
                  <>
                    <select
                      value={formData.bankId}
                      onChange={(e) =>
                        handleChange(
                          "bankId",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                      disabled={isReadOnly}
                    >
                      <option value="">-- Select --</option>
                      {company.bank_details.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bank_name} · {bank.account_number}
                          {bank.is_primary === 1 ? " (P)" : ""}
                        </option>
                      ))}
                    </select>
                    {errors.bankId && (
                      <small className="rd-credit-error">{errors.bankId}</small>
                    )}
                  </>
                ) : (
                  <select disabled>
                    <option>No banks configured</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* ROW 4 — Transaction ID | Transaction Date | Amount */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Transaction ID / UTR{" "}
                {formData.paymentType !== "Cash" && <span>*</span>}
              </label>
              <input
                type="text"
                placeholder={
                  formData.paymentType === "Cash"
                    ? "Optional for cash"
                    : "e.g. UTR / UPI Ref No."
                }
                value={formData.transactionId}
                onChange={(e) =>
                  handleChange("transactionId", e.target.value)
                }
                disabled={formData.paymentType === "Cash" || isReadOnly}
              />
              {errors.transactionId && (
                <small className="rd-credit-error">
                  {errors.transactionId}
                </small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>Transaction Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  handleChange("transactionDate", e.target.value)
                }
                disabled={isReadOnly}
              />
            </div>

            <div className="rd-credit-field">
              <label>
                Amount <span>*</span>
              </label>
              <div className="rd-credit-amount">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter amount"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              {errors.amount && (
                <small className="rd-credit-error">{errors.amount}</small>
              )}
            </div>
          </div>

          {/* Narration */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Narration <span>*</span>
              </label>
              <textarea
                placeholder="Add narration"
                value={formData.narration}
                onChange={(e) => handleChange("narration", e.target.value)}
                disabled={isReadOnly}
              />
              {errors.narration && (
                <small className="rd-credit-error">{errors.narration}</small>
              )}
            </div>
          </div>

          {/* DRILL-DOWN: Bank Details — hidden in view mode */}
          {!isReadOnly &&
            formData.paymentType !== "Cash" &&
            selectedBank && (
              <div className="rd-credit-row">
                <div className="rd-credit-bank-drill">
                  <button
                    type="button"
                    className="rd-credit-bank-drill-toggle"
                    onClick={() => setShowBankDetails((v) => !v)}
                    aria-expanded={showBankDetails}
                  >
                    <span className="rd-credit-bank-drill-icon">
                      {showBankDetails ? "▾" : "▸"}
                    </span>
                    <span>Bank Details for Payment</span>
                    <span className="rd-credit-bank-drill-sub">
                      {selectedBank.bank_name} · {selectedBank.account_number}
                    </span>
                  </button>

                  {showBankDetails && (
                    <div className="rd-credit-bank-drill-body">
                      <div className="rd-credit-bank-grid">
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            Account Holder
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.account_holder_name}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            Account Type
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.account_type}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            Bank Name
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.bank_name}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">Branch</span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.branch_name}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            Account Number
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.account_number}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            IFSC Code
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.ifsc_code}
                          </span>
                        </div>
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">
                            Currency
                          </span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ═══ TRANSACTION HISTORY ═══ */}
          {isEditOrView && (
            <div className="rd-credit-history">
              <h4 className="rd-credit-history-title">
                Transaction History — {formData.referenceType}{" "}
                {formData.referenceNo || "—"}
              </h4>

              {history.length === 0 ? (
                <div className="rd-credit-history-empty">
                  No previous transactions for this reference.
                </div>
              ) : (
                <div className="rd-credit-history-table-wrap">
                  <table className="rd-credit-history-table">
                    <thead>
                      <tr>
                        <th>Entry No</th>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Payment Mode</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Narration</th>
                        <th>Status</th>
                        <th className="rd-credit-history-actions-col">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((row) => (
                        <tr key={row.id}>
                          <td className="rd-credit-history-no">
                            {row.entry_no}
                          </td>
                          <td>{formatDateDisplay(row.entry_date)}</td>
                          <td>
                            <span
                              className={`rd-credit-history-badge ${
                                row.entry_type === "Credit"
                                  ? "rd-credit-history-badge--credit"
                                  : "rd-credit-history-badge--debit"
                              }`}
                            >
                              {row.entry_type}
                            </span>
                          </td>
                          <td>
                            <span className="rd-credit-history-mode">
                              {row.payment_type || "—"}
                            </span>
                          </td>
                          <td className="rd-credit-history-txn">
                            {row.transaction_id || "—"}
                          </td>
                          <td className="rd-credit-history-amount">
                            ₹{formatMoney(row.total_amount)}
                          </td>
                          <td className="rd-credit-history-narration">
                            {row.narration || "—"}
                          </td>
                          <td>
                            <span
                              className={`rd-credit-history-status rd-credit-history-status--${(
                                row.status || "Draft"
                              ).toLowerCase()}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="rd-credit-history-actions">
                            <button
                              type="button"
                              className="rd-credit-history-btn rd-credit-history-btn--view"
                              onClick={() => openHistoryEntry(row)}
                              title={isReadOnly ? "View" : "Open"}
                            >
                              {isReadOnly ? "View" : "Open"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ACTIONS */}
          {!isReadOnly && (
            <div className="rd-credit-actions">
              <button
                type="button"
                className="rd-credit-save-continue"
                onClick={handleSaveContinue}
                disabled={saving}
              >
                {saving ? "Saving..." : isEditOrView ? "Update" : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebitForm;