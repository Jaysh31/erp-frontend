import React, { useState, useEffect, useRef } from "react";
import "./CreditForm.css";
import api from "../services/api";

interface Supplier {
  id: number;
  name: string;
  supplier_name: string;
  supplier_group: string;
  mobile_no: string;
  email_id: string;
  primary_address: string;
  country: string;
}

interface PurchaseInvoice {
  id: number;
  name: string;
  grand_total: number;
  posting_date: string;
  supplier: string;
  supplier_name: string;
  company: string;
  currency: string;
  purchase_order?: string;
  grn_no?: string;
}

interface CreditFormData {
  creditDate: string;
  supplierId: number | "";
  supplierName: string;
  referenceType: string;
  purchaseInvoiceId: number | "";
  purchaseInvoiceNo: string;
  purchaseInvoiceDate: string;
  grandTotal: number | "";
  purchaseOrderNo: string;
  grnNo: string;
  paymentType: string;
  amount: string;
  narration: string;
}

const initialFormData: CreditFormData = {
  creditDate: new Date().toISOString().split("T")[0],
  supplierId: "",
  supplierName: "",
  referenceType: "Purchase Invoice",
  purchaseInvoiceId: "",
  purchaseInvoiceNo: "",
  purchaseInvoiceDate: "",
  grandTotal: "",
  purchaseOrderNo: "",
  grnNo: "",
  paymentType: "Bank Transfer",
  amount: "",
  narration: "",
};

// ─── Helper: convert any date to YYYY-MM-DD ────────────────────────
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

const CreditForm: React.FC = () => {
  const [formData, setFormData] = useState<CreditFormData>(initialFormData);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreditFormData, string>>
  >({});

  // ─── Searchable dropdown state ────────────────────────────────
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  const supplierRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // ─── Fetch suppliers on mount ─────────────────────────────────
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // ─── Fetch purchase invoices when supplier changes ────────────
  useEffect(() => {
    if (formData.supplierId) {
      fetchPurchaseInvoices(formData.supplierId as number);
    } else {
      setPurchaseInvoices([]);
    }
  }, [formData.supplierId]);

  // ─── Close dropdowns on outside click ─────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (invoiceRef.current && !invoiceRef.current.contains(e.target as Node)) {
        setShowInvoiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get("/supplier?limit=1000");
      if (response.data.success === 1) {
        const data = response.data.data;
        let records: Supplier[] = [];
        if (Array.isArray(data)) records = data;
        else if (data && typeof data === "object" && data.records)
          records = data.records;
        setSuppliers(records);
      }
    } catch (err: any) {
      console.error("Error fetching suppliers:", err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const fetchPurchaseInvoices = async (supplierId: number) => {
    setLoadingInvoices(true);
    try {
      const response = await api.get("/purchase-invoice?page=1&limit=10");
      if (response.data.success === 1) {
        const data = response.data.data;
        let records: PurchaseInvoice[] = [];
        if (Array.isArray(data)) records = data;
        else if (data && typeof data === "object" && data.records)
          records = data.records;

        const selectedSupplier = suppliers.find((s) => s.id === supplierId);
        const supplierName =
          selectedSupplier?.supplier_name || selectedSupplier?.name || "";

        const filtered = records.filter(
          (inv) =>
            inv.supplier === supplierName || inv.supplier_name === supplierName
        );

        setPurchaseInvoices(filtered.length > 0 ? filtered : records);
      }
    } catch (err: any) {
      console.error("Error fetching purchase invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleChange = (
    field: keyof CreditFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSupplierSelect = (supplier: Supplier) => {
    setFormData((prev) => ({
      ...prev,
      supplierId: supplier.id,
      supplierName: supplier.supplier_name || supplier.name,
      purchaseInvoiceId: "",
      purchaseInvoiceNo: "",
      purchaseInvoiceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setSupplierSearch(supplier.supplier_name || supplier.name);
    setShowSupplierDropdown(false);
    setErrors((prev) => ({ ...prev, supplierId: "" }));
  };

  const handleInvoiceSelect = (invoice: PurchaseInvoice) => {
    setFormData((prev) => ({
      ...prev,
      purchaseInvoiceId: invoice.id,
      purchaseInvoiceNo: invoice.name,
      purchaseInvoiceDate: toYMD(invoice.posting_date),
      grandTotal: invoice.grand_total || "",
      purchaseOrderNo: invoice.purchase_order || "",
      grnNo: invoice.grn_no || "",
      amount: invoice.grand_total?.toString() || "",
    }));
    setInvoiceSearch(invoice.name);
    setShowInvoiceDropdown(false);
    setErrors((prev) => ({
      ...prev,
      purchaseInvoiceId: "",
      amount: "",
    }));
  };

  const clearSupplier = () => {
    setFormData((prev) => ({
      ...prev,
      supplierId: "",
      supplierName: "",
      purchaseInvoiceId: "",
      purchaseInvoiceNo: "",
      purchaseInvoiceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setSupplierSearch("");
    setInvoiceSearch("");
    setPurchaseInvoices([]);
  };

  const clearInvoice = () => {
    setFormData((prev) => ({
      ...prev,
      purchaseInvoiceId: "",
      purchaseInvoiceNo: "",
      purchaseInvoiceDate: "",
      grandTotal: "",
      purchaseOrderNo: "",
      grnNo: "",
      amount: "",
    }));
    setInvoiceSearch("");
  };

  // ─── Filtered lists for dropdowns ─────────────────────────────
  const filteredSuppliers = suppliers.filter((s) => {
    const label = (s.supplier_name || s.name || "").toLowerCase();
    return label.includes(supplierSearch.toLowerCase());
  });

  const filteredInvoices = purchaseInvoices.filter((inv) => {
    const label = `${inv.name} ${inv.grand_total}`.toLowerCase();
    return label.includes(invoiceSearch.toLowerCase());
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreditFormData, string>> = {};

    if (!formData.creditDate) newErrors.creditDate = "Credit date is required";
    if (!formData.supplierId) newErrors.supplierId = "Supplier is required";
    if (!formData.referenceType)
      newErrors.referenceType = "Reference type is required";
    if (!formData.purchaseInvoiceId)
      newErrors.purchaseInvoiceId = "Purchase invoice is required";
    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narration.trim())
      newErrors.narration = "Narration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCreditDetails = async () => {
    const payload = {
      entry_date: toYMD(formData.creditDate),
      entry_type: "Debit",
      company_id: 1,
      party_type: "Supplier",
      party_id: formData.supplierId,
      reference_type: formData.referenceType,
      reference_id: formData.purchaseInvoiceId,
      reference_no: formData.purchaseInvoiceNo,
      reference_date: toYMD(formData.purchaseInvoiceDate),
      purchase_invoice_no: formData.purchaseInvoiceNo,
      purchase_order_no: formData.purchaseOrderNo,
      grn_no: formData.grnNo,
      currency: "INR",
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

      // ✅ Show success message
      const entryNo = result?.data?.entry_no || "ACC-XXXXX";
      setSuccessMessage(
        `✅ Account entry ${entryNo} created successfully for invoice ${formData.purchaseInvoiceNo}.`
      );

      // Reset form
      setFormData({
        ...initialFormData,
        creditDate: new Date().toISOString().split("T")[0],
      });
      setSupplierSearch("");
      setInvoiceSearch("");
      setPurchaseInvoices([]);
      setErrors({});

      // Auto hide success message after 5s
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save credit details");
    } finally {
      setSaving(false);
    }
  };

  

  return (
    <div className="rd-credit-page">
      <div className="rd-credit-card">
        {/* HEADER */}
        <div className="rd-credit-header">
          <h2>REFERENCE DETAILS – CREDIT FORM</h2>
        </div>

        {/* SUCCESS MESSAGE */}
        {successMessage && (
          <div className="rd-credit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-credit-form">
          {/* ROW 1 - Credit Date */}
          <div className="rd-credit-row">
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
          </div>

          {/* ROW 2 - Supplier + Reference Type */}
          <div className="rd-credit-row two-column">
            {/* Supplier Searchable Dropdown */}
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
                    value={supplierSearch}
                    onChange={(e) => {
                      setSupplierSearch(e.target.value);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    disabled={loadingSuppliers}
                  />
                  {supplierSearch && (
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

                {showSupplierDropdown && (
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
                            formData.supplierId === supplier.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleSupplierSelect(supplier)}
                        >
                          <span className="rd-credit-searchable-name">
                            {supplier.supplier_name || supplier.name}
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

            {/* Reference Type */}
            <div className="rd-credit-field">
              <label>
                Reference Type <span>*</span>
              </label>
              <select
                value={formData.referenceType}
                onChange={(e) => handleChange("referenceType", e.target.value)}
              >
                <option value="Purchase Invoice">Purchase Invoice</option>
                <option value="Purchase Order">Purchase Order</option>
                <option value="Payment">Payment</option>
                <option value="Expense">Expense</option>
                <option value="Other">Other</option>
              </select>
              {errors.referenceType && (
                <small className="rd-credit-error">{errors.referenceType}</small>
              )}
            </div>
          </div>

          {/* ROW 3 - Invoice Searchable Dropdown */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Invoice Number (Purchase Bill) <span>*</span>
              </label>

              <div className="rd-credit-searchable" ref={invoiceRef}>
                <div className="rd-credit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      !formData.supplierId
                        ? "Select supplier first"
                        : loadingInvoices
                        ? "Loading invoices..."
                        : "Search or select purchase invoice"
                    }
                    value={invoiceSearch}
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      setShowInvoiceDropdown(true);
                    }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    disabled={!formData.supplierId || loadingInvoices}
                  />
                  {invoiceSearch && (
                    <button
                      type="button"
                      className="rd-credit-searchable-clear"
                      onClick={clearInvoice}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <span className="rd-credit-searchable-chevron">▾</span>
                </div>

                {showInvoiceDropdown && (
                  <div className="rd-credit-searchable-menu">
                    {filteredInvoices.length === 0 ? (
                      <div className="rd-credit-searchable-empty">
                        {purchaseInvoices.length === 0
                          ? "No invoices found"
                          : "No matching invoices"}
                      </div>
                    ) : (
                      filteredInvoices.slice(0, 100).map((invoice) => (
                        <div
                          key={invoice.id}
                          className={`rd-credit-searchable-item ${
                            formData.purchaseInvoiceId === invoice.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleInvoiceSelect(invoice)}
                        >
                          <div className="rd-credit-searchable-row">
                            <span className="rd-credit-searchable-name">
                              {invoice.name}
                            </span>
                            <span className="rd-credit-searchable-amount">
                              ₹
                              {invoice.grand_total?.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <span className="rd-credit-searchable-sub">
                            {new Date(invoice.posting_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {errors.purchaseInvoiceId && (
                <small className="rd-credit-error">
                  {errors.purchaseInvoiceId}
                </small>
              )}
            </div>
          </div>

          {/* ROW 4 - Payment Type */}
          <div className="rd-credit-row">
            <div className="rd-credit-field payment-field">
              <label>
                Payment Type <span>*</span>
              </label>
              <div className="rd-credit-radio-group">
                <label className="rd-credit-radio">
                  <input
                    type="radio"
                    name="paymentType"
                    value="Bank Transfer"
                    checked={formData.paymentType === "Bank Transfer"}
                    onChange={(e) =>
                      handleChange("paymentType", e.target.value)
                    }
                  />
                  <span>Bank Transfer</span>
                </label>

                <label className="rd-credit-radio">
                  <input
                    type="radio"
                    name="paymentType"
                    value="Cash"
                    checked={formData.paymentType === "Cash"}
                    onChange={(e) =>
                      handleChange("paymentType", e.target.value)
                    }
                  />
                  <span>Cash</span>
                </label>

                <label className="rd-credit-radio">
                  <input
                    type="radio"
                    name="paymentType"
                    value="UPI"
                    checked={formData.paymentType === "UPI"}
                    onChange={(e) =>
                      handleChange("paymentType", e.target.value)
                    }
                  />
                  <span>UPI</span>
                </label>
              </div>
              {errors.paymentType && (
                <small className="rd-credit-error">{errors.paymentType}</small>
              )}
            </div>
          </div>

          {/* ROW 5 - Amount */}
          <div className="rd-credit-row">
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

          {/* ROW 6 - Narration */}
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

            {/* <button
              type="button"
              className="rd-credit-save-close"
              onClick={handleSaveClose}
              disabled={saving}
            > */}
              {/* {saving ? "Saving..." : ""} */}
            {/* </button> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditForm;