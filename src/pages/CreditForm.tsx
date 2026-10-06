import React, { useState, useEffect, useRef } from "react";
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

/**
 * Unified reference record — used for BOTH Sales Invoice and Sales Order.
 * We normalize both API shapes into this one interface.
 */
interface ReferenceRecord {
  id: number;
  refNo: string;          // display: "SINV-62" or "SO-78"
  grandTotal: number;
  date: string;           // posting_date or transaction_date
  customer: string;       // customer id as string (from either API)
  customerName: string;
  company: string;
  currency: string;
}

type ReferenceType = "Sales Invoice" | "Sales Order";

interface CreditFormData {
  creditDate: string;
  companyId: number | "";
  customerId: number | "";
  customerName: string;
  referenceType: ReferenceType;
  referenceId: number | "";       // generic (was salesInvoiceId)
  referenceNo: string;            // generic (was salesInvoiceNo)
  referenceDate: string;          // generic (was salesInvoiceDate)
  grandTotal: number | "";
  salesOrderNo: string;           // extra field for SO (kept from before)
  deliveryNoteNo: string;
  paymentType: string;
  bankId: number | "";
  transactionId: string;
  transactionDate: string;
  amount: string;
  narration: string;
}

/* ----------------------------- Constants ------------------------------ */

const initialFormData: CreditFormData = {
  creditDate: new Date().toISOString().split("T")[0],
  companyId: "",
  customerId: "",
  customerName: "",
  referenceType: "Sales Invoice",
  referenceId: "",
  referenceNo: "",
  referenceDate: "",
  grandTotal: "",
  salesOrderNo: "",
  deliveryNoteNo: "",
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

const REFERENCE_TYPES: ReferenceType[] = ["Sales Invoice", "Sales Order"];

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

/**
 * Normalize a raw record from /sales-invoice OR /sales-order into
 * the unified ReferenceRecord shape.
 */
const normalizeReference = (raw: any, type: ReferenceType): ReferenceRecord => {
  const isOrder = type === "Sales Order";

  // Number: prefer naming_series + id for SO, name for SI
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
    raw?.grand_total ??
    raw?.rounded_total ??
    raw?.total ??
    raw?.net_total ??
    0;

  const date = isOrder
    ? raw?.transaction_date ?? raw?.delivery_date ?? ""
    : raw?.posting_date ?? raw?.date ?? "";

  // Customer field name differs between the two APIs
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
  const [formData, setFormData] = useState<CreditFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Sync bankId when company's bank list changes
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

  // Re-fetch references whenever customer OR reference type changes
  useEffect(() => {
    if (formData.customerId) {
      fetchReferences(formData.customerId as number, formData.referenceType);
    } else {
      setReferences([]);
    }
  }, [formData.customerId, formData.referenceType]);

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

  /**
   * Fetch Sales Invoices OR Sales Orders depending on the current
   * referenceType, then normalize both into ReferenceRecord[].
   */
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

  /**
   * Changing the reference type resets the selected reference
   * but keeps the customer, so the user can pick the same customer's
   * invoice vs sales order.
   */
  const handleReferenceTypeChange = (type: ReferenceType) => {
    setFormData((prev) => ({
      ...prev,
      referenceType: type,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
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
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
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
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
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
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
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
      grandTotal: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setRefSearch("");
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
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narration.trim())
      newErrors.narration = "Narration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ------------------------------ Save ------------------------------- */

  const saveCreditDetails = async () => {
    const isSO = formData.referenceType === "Sales Order";

    const payload = {
      entry_date: toYMD(formData.creditDate),
      entry_type: "Credit",
      company_id: formData.companyId || company?.id || 1,
      bank_detail_id: formData.bankId || null,
      transaction_id: formData.transactionId.trim(),
      transaction_date: toYMD(formData.transactionDate),
      party_type: "Customer",
      party_id: formData.customerId,
      reference_type: formData.referenceType,
      reference_id: formData.referenceId,
      reference_no: formData.referenceNo,
      reference_date: toYMD(formData.referenceDate),
      // Backwards-compatible keys (kept for API)
      purchase_invoice_no: isSO ? null : formData.referenceNo,
      sales_invoice_no: isSO ? null : formData.referenceNo,
      purchase_order_no: null,
      sales_order_no: isSO ? formData.referenceNo : formData.salesOrderNo,
      grn_no: null,
      delivery_note_no: formData.deliveryNoteNo,
      currency: company?.default_currency?.toUpperCase() || "INR",
      total_amount: Number(formData.amount),
      payment_type: formData.paymentType,
      narration: formData.narration,
      status: "Draft",
      created_by: 1,
      modified_by: 1,
    };

    console.log("Account Entry Payload:", payload);
    const response = await api.post("/account_entry", payload);
    console.log("Account entry saved:", response.data);
    return response.data;
  };

  const handleSaveContinue = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const result = await saveCreditDetails();

      const entryNo = result?.data?.entry_no || "ACC-XXXXX";
      setSuccessMessage(
        `✅ Account entry ${entryNo} created successfully for ${formData.referenceType} ${formData.referenceNo}.`
      );

      const defaultBankId =
        company?.bank_details?.find((b) => b.is_primary === 1)?.id ||
        company?.bank_details?.[0]?.id ||
        "";

      setFormData({
        ...initialFormData,
        creditDate: new Date().toISOString().split("T")[0],
        transactionDate: new Date().toISOString().split("T")[0],
        companyId: formData.companyId,
        referenceType: formData.referenceType, // keep the user's choice
        bankId: defaultBankId,
      });
      setCustomerSearch("");
      setRefSearch("");
      setReferences([]);
      setErrors({});
      setShowBankDetails(false);

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
    const amount = formData.amount || "0";
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

  return (
    <div className="rd-credit-page">
       <div className="rd-credit-top-bar">
      <button
        type="button"
        className="rd-credit-back-btn"
        onClick={() => window.history.back()}
      >
        <span className="rd-credit-back-icon">←</span>
        <span>Back</span>
      </button>
    </div>
      <div className="rd-credit-card">
        <div className="rd-credit-header">
          <h2>REFERENCE DETAILS – CREDIT FORM</h2>
        </div>

        {successMessage && (
          <div className="rd-credit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-credit-form">
          {/* ROW 1 — Credit Date | Company | Customer | Reference Type */}
          <div className="rd-credit-row four-column">
            <div className="rd-credit-field">
              <label>
                Credit Date <span>*</span>
              </label>
              <input
                type="date"
                value={formData.creditDate}
                onChange={(e) => handleChange("creditDate", e.target.value)}
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
                disabled={loadingCompany}
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
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    disabled={loadingCustomers}
                  />
                  {customerSearch && (
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

                {showCustomerDropdown && (
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

          {/* ROW 2 — Reference No. | Payment Mode | Receiving Bank */}
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
                    disabled={!formData.customerId || loadingReferences}
                  />
                  {refSearch && (
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

                {showRefDropdown && (
                  <div className="rd-credit-searchable-menu">
                    {filteredReferences.length === 0 ? (
                      <div className="rd-credit-searchable-empty">
                        {references.length === 0
                          ? `No ${isSalesOrder ? "sales orders" : "invoices"} found`
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

          {/* ROW 3 — Transaction ID | Transaction Date | Amount */}
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
                disabled={formData.paymentType === "Cash"}
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
              />
              {errors.narration && (
                <small className="rd-credit-error">{errors.narration}</small>
              )}
            </div>
          </div>

          {/* DRILL-DOWN: Bank Details */}
          {formData.paymentType !== "Cash" && selectedBank && (
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
                        <span className="rd-credit-bank-label">Bank Name</span>
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
                        <span className="rd-credit-bank-label">IFSC Code</span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.ifsc_code}
                        </span>
                      </div>
                      {selectedBank.upi_id && (
                        <div className="rd-credit-bank-item">
                          <span className="rd-credit-bank-label">UPI ID</span>
                          <span className="rd-credit-bank-value">
                            {selectedBank.upi_id}
                          </span>
                        </div>
                      )}
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">Currency</span>
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

          {/* UPI QR */}
          {formData.paymentType === "UPI" && selectedBank?.upi_id && (
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
                      <span className="rd-credit-upi-label">Payee Name</span>
                      <span className="rd-credit-upi-value">
                        {selectedBank.account_holder_name}
                      </span>
                    </div>
                    {formData.amount && (
                      <div className="rd-credit-upi-item">
                        <span className="rd-credit-upi-label">Amount</span>
                        <span className="rd-credit-upi-value rd-credit-upi-amount">
                          ₹{formatMoney(formData.amount)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.paymentType === "UPI" && !selectedBank?.upi_id && (
            <div className="rd-credit-row">
              <div className="rd-credit-upi-error">
                ⚠️ No UPI ID configured for the selected bank. Please choose
                another bank or a different payment mode.
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="rd-credit-actions">
            <button
              type="button"
              className="rd-credit-save-continue"
              onClick={handleSaveContinue}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditForm;