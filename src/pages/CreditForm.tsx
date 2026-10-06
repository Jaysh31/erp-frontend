import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./CreditForm.css";
import api from "../services/api";

/* ----------------------------- Interfaces ----------------------------- */

interface Customer {
  id: number;
  name: string;
  customer_name: string;
  customer_group?: string;
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

interface ReferenceRecord {
  id: number;
  refNo: string;
  grandTotal: number;
  date: string;
  customer: string;
  customerName: string;
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

type ReferenceType = "Sales Invoice" | "Sales Order";

interface CreditFormData {
  entryNo: string;
  entryType: "Credit" | "Debit";
  referenceNoTop: string;
  grandTotal: number | "";
  narrationTop: string;

  creditDate: string;
  companyId: number | "";
  customerId: number | "";
  customerName: string;
  /** ✅ NEW — party name returned by the API (used in edit/view) */
  partyName: string;
  referenceType: ReferenceType;
  referenceId: number | "";
  referenceNo: string;
  referenceDate: string;
  salesOrderNo: string;
  deliveryNoteNo: string;
  paymentType: string;
  bankId: number | "";
  transactionId: string;
  transactionDate: string;
  amount: string;
}

/* ----------------------------- Constants ------------------------------ */

const initialFormData: CreditFormData = {
  entryNo: "",
  entryType: "Credit",
  referenceNoTop: "",
  grandTotal: "",
  narrationTop: "",

  creditDate: new Date().toISOString().split("T")[0],
  companyId: "",
  customerId: "",
  customerName: "",
  partyName: "",
  referenceType: "Sales Invoice",
  referenceId: "",
  referenceNo: "",
  referenceDate: "",
  salesOrderNo: "",
  deliveryNoteNo: "",
  paymentType: "NEFT",
  bankId: "",
  transactionId: "",
  transactionDate: new Date().toISOString().split("T")[0],
  amount: "",
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

const REFERENCE_TYPES: ReferenceType[] = ["Sales Invoice", "Sales Order"];
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

const normalizeReference = (raw: any, type: ReferenceType): ReferenceRecord => {
  const isOrder = type === "Sales Order";

  let refNo = "";
  if (isOrder) {
    const prefix = (raw?.naming_series ?? "SO-").toString();
    refNo = raw?.id != null ? `${prefix}${raw.id}` : "";
    if (!refNo && raw?.name) refNo = String(raw.name);
  } else {
    refNo =
      raw?.name ??
      raw?.invoice_no ??
      raw?.sales_invoice_no ??
      (raw?.id != null ? `SINV-${raw.id}` : "");
    refNo = String(refNo);
  }

  const total =
    raw?.grand_total ?? raw?.rounded_total ?? raw?.total ?? raw?.net_total ?? 0;

  const date = isOrder
    ? raw?.transaction_date ?? raw?.delivery_date ?? ""
    : raw?.posting_date ?? raw?.date ?? "";

  const customer =
    raw?.customer ??
    (raw?.customer_id != null ? String(raw.customer_id) : "");

  return {
    id: Number(raw?.id ?? 0),
    refNo,
    grandTotal: Number(total) || 0,
    date: String(date),
    customer: String(customer ?? ""),
    customerName: String(raw?.customer_name ?? ""),
    company: String(raw?.company ?? ""),
    currency: String(raw?.currency ?? "INR"),
  };
};

/* --------------------------- Component -------------------------------- */

const CreditForm: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const entryId = searchParams.get("id");
  const referenceTypeParam = searchParams.get("referenceType");
  const referenceIdParam = searchParams.get("referenceId");

  const isEditOrView = !!entryId && (mode === "edit" || mode === "view");
  const isReadOnly = mode === "view";

  const [formData, setFormData] = useState<CreditFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [loadingTransaction, setLoadingTransaction] = useState(false);
  const [saving, setSaving] = useState(false);

  const [history, setHistory] = useState<TransactionHistoryRow[]>([]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreditFormData, string>>
  >({});

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [refSearch, setRefSearch] = useState("");
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const customerRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLDivElement>(null);

  /* ----------------------------- Effects ----------------------------- */

  useEffect(() => {
    fetchCustomers();
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
    if (formData.customerId) {
      fetchReferences(formData.customerId as number, formData.referenceType);
    } else {
      setReferences([]);
    }
  }, [formData.customerId, formData.referenceType, isEditOrView]);

  useEffect(() => {
    if (formData.paymentType === "Cash") setShowBankDetails(false);
  }, [formData.paymentType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerRef.current &&
        !customerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (refRef.current && !refRef.current.contains(e.target as Node)) {
        setShowRefDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

          /* ✅ Resolve the party_name coming from the API.
                Fall back to customer_name, then party_id. */
          const resolvedPartyName =
            current.party_name ??
            current.customer_name ??
            (current.party_id != null ? String(current.party_id) : "");

          setFormData((prev) => ({
            ...prev,

            entryNo: current.entry_no ?? prev.entryNo,
            entryType:
              (current.entry_type as "Credit" | "Debit") ?? prev.entryType,
            referenceNoTop: current.reference_no ?? prev.referenceNoTop,
            grandTotal:
              current.total_amount != null
                ? current.total_amount
                : prev.grandTotal,
            narrationTop: current.narration ?? prev.narrationTop,

            creditDate: toYMD(current.entry_date) || prev.creditDate,
            companyId: current.company_id ?? prev.companyId,
            customerId: current.party_id ?? prev.customerId,
            customerName:
              current.customer_name ?? current.party_name ?? prev.customerName,
            /* ✅ NEW — persist party_name in form state */
            partyName: resolvedPartyName || prev.partyName,
            referenceType:
              (current.reference_type as ReferenceType) ?? prev.referenceType,
            referenceId: current.reference_id ?? prev.referenceId,
            referenceNo: current.reference_no ?? prev.referenceNo,
            referenceDate:
              toYMD(current.reference_date) || prev.referenceDate,
            salesOrderNo: current.sales_order_no ?? prev.salesOrderNo,
            deliveryNoteNo: current.delivery_note_no ?? prev.deliveryNoteNo,
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
          }));

          /* ✅ Customer search input shows party_name when available */
          setCustomerSearch(resolvedPartyName);

          /* ✅ Show reference_id (e.g. 102) in the Invoice No. field */
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

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get("/customer?limit=1000");
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];
        const normalized: Customer[] = records.map((c) => ({
          id: Number(c?.id ?? 0),
          name: String(c?.name ?? ""),
          customer_name: String(c?.customer_name ?? c?.name ?? ""),
          customer_group: c?.customer_group ?? "",
          mobile_no: c?.mobile_no ?? "",
          email_id: c?.email_id ?? "",
          primary_address: c?.primary_address ?? "",
          country: c?.country ?? "",
        }));
        setCustomers(normalized);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
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
    customerId: number,
    type: ReferenceType
  ) => {
    setLoadingReferences(true);
    try {
      const endpoint =
        type === "Sales Order"
          ? "/sales-order?page=1&limit=10"
          : "/sales-invoice?page=1&limit=10";

      const response = await api.get(endpoint);
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];

        const normalized = records.map((r) => normalizeReference(r, type));

        const selectedCustomer = customers.find((c) => c.id === customerId);
        const customerName =
          selectedCustomer?.customer_name || selectedCustomer?.name || "";
        const cid = String(customerId);

        const filtered = normalized.filter(
          (r) =>
            r.customer === cid ||
            r.customer === customerName ||
            r.customerName === customerName
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

  const handleChange = (
    field: keyof CreditFormData,
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
      salesOrderNo: "",
      deliveryNoteNo: "",
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
      customerId: "",
      customerName: "",
      partyName: "",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setCustomerSearch("");
    setRefSearch("");
    setReferences([]);
    setErrors((prev) => ({ ...prev, companyId: "" }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    const displayName = customer.customer_name || customer.name || "";
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: displayName,
      /* ✅ When the user picks a customer, also mirror into partyName
            so downstream save/summary logic has a consistent value */
      partyName: displayName,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setCustomerSearch(displayName);
    setShowCustomerDropdown(false);
    setErrors((prev) => ({ ...prev, customerId: "" }));
  };

  const handleReferenceSelect = (ref: ReferenceRecord) => {
    setFormData((prev) => ({
      ...prev,
      referenceId: ref.id,
      referenceNo: ref.refNo,
      referenceNoTop: ref.refNo,
      referenceDate: toYMD(ref.date),
      grandTotal: ref.grandTotal || "",
      salesOrderNo:
        prev.referenceType === "Sales Order" ? ref.refNo : prev.salesOrderNo,
      deliveryNoteNo: "",
      amount: ref.grandTotal ? String(ref.grandTotal) : "",
    }));
    setRefSearch(ref.refNo);
    setShowRefDropdown(false);
    setErrors((prev) => ({ ...prev, referenceId: "", amount: "" }));
  };

  const clearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: "",
      customerName: "",
      partyName: "",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setCustomerSearch("");
    setRefSearch("");
    setReferences([]);
  };

  const clearReference = () => {
    setFormData((prev) => ({
      ...prev,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
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
    navigate(`/receivables/new-credits?${params.toString()}`);
  };

  /* ---------------------------- Filters ------------------------------ */

  const filteredCustomers = customers.filter((c) =>
    safeLower(c.customer_name || c.name).includes(safeLower(customerSearch))
  );

  const filteredReferences = references.filter((r) => {
    const label = `${safeLower(r.refNo)} ${safeLower(r.grandTotal)}`;
    return label.includes(safeLower(refSearch));
  });

  /* -------------------------- Validation ----------------------------- */

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreditFormData, string>> = {};

    if (!formData.creditDate) newErrors.creditDate = "Credit date is required";
    if (!formData.companyId) newErrors.companyId = "Company is required";
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (!formData.referenceType)
      newErrors.referenceType = "Reference type is required";
    if (!formData.referenceId)
      newErrors.referenceId = `${formData.referenceType} is required`;
    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (formData.paymentType !== "Cash" && !formData.bankId)
      newErrors.bankId = "Please select a receiving bank account";
    if (formData.paymentType !== "Cash" && !formData.transactionId.trim())
      newErrors.transactionId =
        "Transaction ID is required for non-cash payments";
    if (!formData.grandTotal || Number(formData.grandTotal) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narrationTop.trim())
      newErrors.narrationTop = "Narration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ------------------------------ Save ------------------------------- */

  const saveCreditDetails = async () => {
    const isSO = formData.referenceType === "Sales Order";

    const payload = {
      entry_no: formData.entryNo || undefined,
      entry_type: formData.entryType,

      entry_date: toYMD(formData.creditDate),
      company_id: formData.companyId || company?.id || 1,
      bank_detail_id: formData.bankId || null,
      transaction_id: formData.transactionId.trim(),
      transaction_date: toYMD(formData.transactionDate),
      party_type: "Customer",
      party_id: formData.customerId,
      /* ✅ Send party_name along with the rest of the payload */
      party_name: formData.partyName || formData.customerName || "",
      reference_type: formData.referenceType,
      reference_id: formData.referenceId,
      reference_no: formData.referenceNo || formData.referenceNoTop,
      reference_date: toYMD(formData.referenceDate),
      purchase_invoice_no: isSO ? null : formData.referenceNo,
      sales_invoice_no: isSO ? null : formData.referenceNo,
      purchase_order_no: null,
      sales_order_no: isSO ? formData.referenceNo : formData.salesOrderNo,
      grn_no: null,
      delivery_note_no: formData.deliveryNoteNo,
      currency: company?.default_currency?.toUpperCase() || "INR",
      total_amount: Number(formData.grandTotal || formData.amount) || 0,
      payment_type: formData.paymentType,
      narration: formData.narrationTop,
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
      const result = await saveCreditDetails();
      const entryNo =
        result?.data?.entry_no || formData.entryNo || "ACC-XXXXX";

      setSuccessMessage(
        isEditOrView
          ? `✅ Account entry ${entryNo} updated successfully.`
          : `✅ Account entry ${entryNo} created successfully.`
      );

      if (!isEditOrView) {
        const defaultBankId =
          company?.bank_details?.find((b) => b.is_primary === 1)?.id ||
          company?.bank_details?.[0]?.id ||
          "";

        setFormData({
          ...initialFormData,
          creditDate: new Date().toISOString().split("T")[0],
          transactionDate: new Date().toISOString().split("T")[0],
          companyId: formData.companyId,
          referenceType: formData.referenceType,
          bankId: defaultBankId,
        });
        setCustomerSearch("");
        setRefSearch("");
        setReferences([]);
        setErrors({});
        setShowBankDetails(false);
      }

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save credit details");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ Derived ---------------------------- */

  const selectedBank =
    company?.bank_details?.find((b) => b.id === formData.bankId) || null;

  const isSalesOrder = formData.referenceType === "Sales Order";
  const refLabel = isSalesOrder ? "Sales Order No." : "Invoice No.";
  const refPlaceholder = !formData.customerId
    ? "Select customer first"
    : loadingReferences
    ? `Loading ${isSalesOrder ? "sales orders" : "invoices"}...`
    : `Search ${isSalesOrder ? "sales order" : "invoice"}`;

  const getUpiQrUrl = () => {
    if (!selectedBank?.upi_id) return "";
    const upiId = selectedBank.upi_id;
    const name =
      selectedBank.account_holder_name || company?.company_name || "";
    const amount = formData.grandTotal || formData.amount || "0";
    const note = `Payment for ${formData.referenceNo || "Invoice"}`;
    const upiString = `upi://pay?pa=${encodeURIComponent(
      upiId
    )}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(
      note
    )}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
      upiString
    )}`;
  };

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
      <div className="rd-credit-card">
        <div className="rd-credit-header">
          <h2>
            REFERENCE DETAILS – CREDIT FORM
            {isReadOnly ? " (View)" : isEditOrView ? " (Edit)" : ""}
          </h2>
        </div>

        {successMessage && (
          <div className="rd-credit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-credit-form">
          {/* ═══ ROW 1 — Entry No | Entry Type | Credit Date | Company ═══ */}
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
                Credit Date <span>*</span>
              </label>
              <input
                type="date"
                value={formData.creditDate}
                onChange={(e) => handleChange("creditDate", e.target.value)}
                disabled={isReadOnly}
              />
              {errors.creditDate && (
                <small className="rd-credit-error">{errors.creditDate}</small>
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

          {/* ═══ ROW 2 — Customer | Reference Type | Reference No ═══ */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Customer <span>*</span>
              </label>
              <div className="rd-credit-searchable" ref={customerRef}>
                <div className="rd-credit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      loadingCustomers
                        ? "Loading customers..."
                        : "Search or select customer"
                    }
                    /* ✅ In edit/view, show the resolved party_name from API */
                    value={
                      isEditOrView && formData.partyName
                        ? formData.partyName
                        : customerSearch
                    }
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    disabled={loadingCustomers || isReadOnly}
                  />
                  {((isEditOrView && formData.partyName) ||
                    (!isEditOrView && customerSearch)) &&
                    !isReadOnly && (
                      <button
                        type="button"
                        className="rd-credit-searchable-clear"
                        onClick={clearCustomer}
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                  <span className="rd-credit-searchable-chevron">▾</span>
                </div>

                {showCustomerDropdown && !isReadOnly && (
                  <div className="rd-credit-searchable-menu">
                    {filteredCustomers.length === 0 ? (
                      <div className="rd-credit-searchable-empty">
                        No customers found
                      </div>
                    ) : (
                      filteredCustomers.slice(0, 100).map((customer) => (
                        <div
                          key={customer.id}
                          className={`rd-credit-searchable-item ${
                            formData.customerId === customer.id ? "active" : ""
                          }`}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <span className="rd-credit-searchable-name">
                            {customer.customer_name || customer.name || "—"}
                          </span>
                          {customer.customer_group && (
                            <span className="rd-credit-searchable-tag">
                              {customer.customer_group}
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {errors.customerId && (
                <small className="rd-credit-error">{errors.customerId}</small>
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

            <div className="rd-credit-field">
              <label>Reference No</label>
              <input
                type="text"
                value={formData.referenceNoTop}
                placeholder="e.g. SINV-63"
                onChange={(e) =>
                  handleChange("referenceNoTop", e.target.value)
                }
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* ═══ ROW 3 — Invoice No. | Payment Mode | Total Amount ═══ */}
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
                      !formData.customerId || loadingReferences || isReadOnly
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
                              isSalesOrder ? "sales orders" : "invoices"
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

            <div className="rd-credit-field">
              <label>
                Total Amount <span>*</span>
              </label>
              <div className="rd-credit-amount">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.grandTotal}
                  onChange={(e) => {
                    const v =
                      e.target.value === "" ? "" : Number(e.target.value);
                    setFormData((prev) => ({
                      ...prev,
                      grandTotal: v,
                      amount: v === "" ? "" : String(v),
                    }));
                    setErrors((prev) => ({ ...prev, amount: "" }));
                  }}
                  disabled={isReadOnly}
                />
              </div>
              {errors.amount && (
                <small className="rd-credit-error">{errors.amount}</small>
              )}
            </div>
          </div>

          {/* ═══ ROW 4 — Receiving Bank | Transaction ID | Transaction Date ═══ */}
          <div className="rd-credit-row three-column">
            {formData.paymentType !== "Cash" && (
              <div className="rd-credit-field">
                <label>
                  Receiving Bank <span>*</span>
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
          </div>

          {/* ═══ ROW 5 — Narration ═══ */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Narration <span>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. wooden stool"
                value={formData.narrationTop}
                onChange={(e) =>
                  handleChange("narrationTop", e.target.value)
                }
                disabled={isReadOnly}
              />
              {errors.narrationTop && (
                <small className="rd-credit-error">
                  {errors.narrationTop}
                </small>
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
                        {selectedBank.upi_id && (
                          <div className="rd-credit-bank-item">
                            <span className="rd-credit-bank-label">
                              UPI ID
                            </span>
                            <span className="rd-credit-bank-value">
                              {selectedBank.upi_id}
                            </span>
                          </div>
                        )}
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

          {/* ✅ UPI QR — HIDDEN in view/edit; shown only on new-entry form */}
          {!isEditOrView &&
            formData.paymentType === "UPI" &&
            selectedBank?.upi_id && (
              <div className="rd-credit-row">
                <div className="rd-credit-upi-section">
                  <h4>Scan &amp; Pay via UPI</h4>
                  <div className="rd-credit-upi-content">
                    <div className="rd-credit-qr-box">
                      <img
                        src={getUpiQrUrl()}
                        alt="UPI QR Code"
                        className="rd-credit-qr-image"
                      />
                      <p className="rd-credit-qr-hint">
                        Scan with any UPI app
                      </p>
                    </div>
                    <div className="rd-credit-upi-info">
                      <div className="rd-credit-upi-item">
                        <span className="rd-credit-upi-label">UPI ID</span>
                        <span className="rd-credit-upi-value">
                          {selectedBank.upi_id}
                        </span>
                        <button
                          type="button"
                          className="rd-credit-copy-btn"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selectedBank.upi_id || ""
                            );
                            alert("UPI ID copied!");
                          }}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="rd-credit-upi-item">
                        <span className="rd-credit-upi-label">
                          Payee Name
                        </span>
                        <span className="rd-credit-upi-value">
                          {selectedBank.account_holder_name}
                        </span>
                      </div>
                      {formData.grandTotal && (
                        <div className="rd-credit-upi-item">
                          <span className="rd-credit-upi-label">Amount</span>
                          <span className="rd-credit-upi-value rd-credit-upi-amount">
                            ₹{formatMoney(formData.grandTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* UPI error — only on new entry form */}
          {!isEditOrView &&
            formData.paymentType === "UPI" &&
            !selectedBank?.upi_id && (
              <div className="rd-credit-row">
                <div className="rd-credit-upi-error">
                  ⚠️ No UPI ID configured for the selected bank. Please choose
                  another bank or a different payment mode.
                </div>
              </div>
            )}

          {/* ═══ TRANSACTION HISTORY ═══ */}
          {isEditOrView && (
            <div className="rd-credit-history">
              <h4 className="rd-credit-history-title">
                Transaction History — {formData.referenceType}{" "}
                {formData.referenceNoTop || formData.referenceNo || "—"}
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

export default CreditForm;