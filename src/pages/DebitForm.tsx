import React, { useState, useEffect, useRef } from "react";
import "./DebitForm.css";
import api from "../services/api";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";

interface Customer {
  id: number;
  customer_name: string;
  customer_type?: string;
  customer_group?: string;
  territory?: string;
  mobile_no?: string;
  email_id?: string;
  default_currency?: string | null;
  disabled?: number;
  is_frozen?: number;
  creation?: string;
}

interface SalesInvoice {
  id: number;
  customer?: string;
  customer_name?: string;
  company?: string;
  posting_date?: string;
  due_date?: string;
  currency?: string;
  grand_total?: number;
  outstanding_amount?: number;
  status?: string;
  total?: number;
  rounded_total?: number;
  // Optional alternate field names
  name?: string;
  invoice_no?: string;
  invoice_number?: string;
  sales_invoice_no?: string;
  bill_no?: string;
  sales_order?: string;
  sales_order_no?: string;
  delivery_note?: string;
  delivery_note_no?: string;
}

interface DebitFormData {
  entryDate: string;
  customerId: number | "";
  customerName: string;
  referenceType: string;
  salesInvoiceId: number | "";
  salesInvoiceNo: string;
  salesInvoiceDate: string;
  grandTotal: number | "";
  salesOrderNo: string;
  deliveryNoteNo: string;
  paymentType: string;
  amount: string;
  narration: string;
}

const initialFormData: DebitFormData = {
  entryDate: new Date().toISOString().split("T")[0],
  customerId: "",
  customerName: "",
  referenceType: "Sales Invoice",
  salesInvoiceId: "",
  salesInvoiceNo: "",
  salesInvoiceDate: "",
  grandTotal: "",
  salesOrderNo: "",
  deliveryNoteNo: "",
  paymentType: "Credit",
  amount: "",
  narration: "",
};

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

// ✅ Use id as fallback label since your API has no "name"
const getInvoiceLabel = (invoice: SalesInvoice): string => {
  if (!invoice) return "";
  return (
    invoice.name ||
    invoice.invoice_no ||
    invoice.invoice_number ||
    invoice.sales_invoice_no ||
    invoice.bill_no ||
    String(invoice.id)
  );
};

const DebitForm: React.FC = () => {
  const { theme } = useAdminTheme();

  const [formData, setFormData] = useState<DebitFormData>(initialFormData);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<SalesInvoice[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof DebitFormData, string>>
  >({});

  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  const customerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (formData.customerId) {
      fetchSalesInvoices(formData.customerId as number);
    } else {
      setSalesInvoices([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.customerId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerRef.current &&
        !customerRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
      if (
        invoiceRef.current &&
        !invoiceRef.current.contains(e.target as Node)
      ) {
        setShowInvoiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const response = await api.get("/customer?page=1&limit=5000");
      if (response.data.success === 1) {
        const data = response.data.data;
        let records: Customer[] = [];
        if (Array.isArray(data)) records = data;
        else if (data && typeof data === "object" && data.records)
          records = data.records;
        setCustomers(
          records.filter((r) => r && typeof r === "object" && r.id != null)
        );
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const fetchSalesInvoices = async (customerId: number) => {
    setLoadingInvoices(true);
    try {
      const response = await api.get("/sales-invoice?page=1&limit=1000");
      if (response.data.success === 1) {
        const data = response.data.data;
        let records: SalesInvoice[] = [];
        if (Array.isArray(data)) records = data;
        else if (data && typeof data === "object" && data.records)
          records = data.records;

        const clean = records.filter(
          (r) => r && typeof r === "object" && r.id != null
        );

        const selectedCustomer = customers.find((c) => c.id === customerId);
        const customerName = selectedCustomer?.customer_name || "";

        // ✅ Match by customer ID (string) OR customer_name
        const filtered = clean.filter(
          (inv) =>
            String(inv.customer) === String(customerId) ||
            inv.customer_name === customerName
        );

        setSalesInvoices(filtered.length > 0 ? filtered : clean);
      }
    } catch (err: any) {
      console.error("Error fetching sales invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleChange = (
    field: keyof DebitFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCustomerSelect = (customer: Customer) => {
    const name = customer.customer_name || `Customer #${customer.id}`;
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: name,
      salesInvoiceId: "",
      salesInvoiceNo: "",
      salesInvoiceDate: "",
      grandTotal: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setCustomerSearch(name);
    setInvoiceSearch("");
    setShowCustomerDropdown(false);
    setErrors((prev) => ({ ...prev, customerId: "" }));
  };

  const handleInvoiceSelect = (invoice: SalesInvoice) => {
    const invNo = getInvoiceLabel(invoice);
    setFormData((prev) => ({
      ...prev,
      salesInvoiceId: invoice.id,
      salesInvoiceNo: invNo,
      salesInvoiceDate: toYMD(invoice.posting_date),
      grandTotal: invoice.grand_total || "",
      salesOrderNo: invoice.sales_order_no || invoice.sales_order || "",
      deliveryNoteNo: invoice.delivery_note_no || invoice.delivery_note || "",
      amount: invoice.grand_total?.toString() || "",
    }));
    setInvoiceSearch(invNo);
    setShowInvoiceDropdown(false);
    setErrors((prev) => ({
      ...prev,
      salesInvoiceId: "",
      amount: "",
      salesOrderNo: "",
    }));
  };

  const clearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: "",
      customerName: "",
      salesInvoiceId: "",
      salesInvoiceNo: "",
      salesInvoiceDate: "",
      grandTotal: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setCustomerSearch("");
    setInvoiceSearch("");
    setSalesInvoices([]);
  };

  const clearInvoice = () => {
    setFormData((prev) => ({
      ...prev,
      salesInvoiceId: "",
      salesInvoiceNo: "",
      salesInvoiceDate: "",
      grandTotal: "",
      salesOrderNo: "",
      deliveryNoteNo: "",
      amount: "",
    }));
    setInvoiceSearch("");
  };

  const filteredCustomers = customers.filter((c) => {
    const name = String(c?.customer_name ?? "").toLowerCase();
    const id = String(c?.id ?? "");
    const q = customerSearch.toLowerCase().trim();
    if (!q) return true;
    return name.includes(q) || id.includes(q);
  });

  const filteredInvoices = salesInvoices.filter((inv) => {
    const label = getInvoiceLabel(inv);
    const haystack = `${label} ${inv?.customer_name ?? ""} ${
      inv?.grand_total ?? ""
    }`.toLowerCase();
    const q = invoiceSearch.toLowerCase().trim();
    if (!q) return true;
    return haystack.includes(q);
  });

  const validateForm = () => {
    const newErrors: Partial<Record<keyof DebitFormData, string>> = {};

    if (!formData.entryDate) newErrors.entryDate = "Entry date is required";
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (!formData.referenceType)
      newErrors.referenceType = "Reference type is required";
    if (!formData.salesInvoiceId)
      newErrors.salesInvoiceId = "Sales invoice is required";
    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narration.trim())
      newErrors.narration = "Narration is required";

    if (
      formData.referenceType === "Sales Order" &&
      !formData.salesOrderNo.trim()
    ) {
      newErrors.salesOrderNo = "Sales Order No. is required";
    }

    if (
      formData.referenceType === "Delivery Note" &&
      !formData.deliveryNoteNo.trim()
    ) {
      newErrors.deliveryNoteNo = "Delivery Note No. is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveDebitDetails = async () => {
    const payload: Record<string, any> = {
      entry_date: toYMD(formData.entryDate),
      entry_type: "Credit",
      company_id: 1,
      party_type: "Customer",
      party_id: formData.customerId,
      reference_type: formData.referenceType,
      reference_id: formData.salesInvoiceId,
      reference_no: formData.salesInvoiceNo,
      reference_date: toYMD(formData.salesInvoiceDate),
      sales_invoice_no: formData.salesInvoiceNo,
      currency: "INR",
      total_amount: Number(formData.amount),
      payment_type: formData.paymentType,
      narration: formData.narration,
      status: "Draft",
      created_by: 1,
      modified_by: 1,
    };

    if (formData.salesOrderNo.trim()) {
      payload.sales_order_no = formData.salesOrderNo.trim();
    }
    if (formData.deliveryNoteNo.trim()) {
      payload.delivery_note_no = formData.deliveryNoteNo.trim();
    }

    console.log("➡️ Sending payload:", JSON.stringify(payload, null, 2));
    const response = await api.post("/account_entry", payload);
    console.log("Account entry saved:", response.data);
    return response.data;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const result = await saveDebitDetails();
      const entryNo = result?.data?.entry_no || "ACC-XXXXX";
      setSuccessMessage(
        `✅ Account entry ${entryNo} created successfully for invoice #${formData.salesInvoiceNo}.`
      );

      setFormData({
        ...initialFormData,
        entryDate: new Date().toISOString().split("T")[0],
      });
      setCustomerSearch("");
      setInvoiceSearch("");
      setSalesInvoices([]);
      setErrors({});

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save debit entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`rd-debit-page ${theme}`}>
      <div className="rd-debit-card">
        <div className="rd-debit-header">
          <h2>REFERENCE DETAILS – DEBIT FORM</h2>
        </div>

        {successMessage && (
          <div className="rd-debit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-debit-form">
          {/* Entry Date */}
          <div className="rd-debit-row">
            <div className="rd-debit-field">
              <label>
                Entry Date <span>*</span>
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => handleChange("entryDate", e.target.value)}
              />
              {errors.entryDate && (
                <small className="rd-debit-error">{errors.entryDate}</small>
              )}
            </div>
          </div>

          {/* Customer + Reference Type */}
          <div className="rd-debit-row two-column">
            <div className="rd-debit-field">
              <label>
                Customer <span>*</span>
              </label>

              <div className="rd-debit-searchable" ref={customerRef}>
                <div className="rd-debit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      loadingCustomers
                        ? "Loading customers..."
                        : "Search or select customer"
                    }
                    value={
                      formData.customerId
                        ? formData.customerName
                        : customerSearch
                    }
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    disabled={loadingCustomers}
                  />
                  {formData.customerId && (
                    <button
                      type="button"
                      className="rd-debit-searchable-clear"
                      onClick={clearCustomer}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <span className="rd-debit-searchable-chevron">▾</span>
                </div>

                {showCustomerDropdown && (
                  <div className="rd-debit-searchable-menu">
                    {filteredCustomers.length === 0 ? (
                      <div className="rd-debit-searchable-empty">
                        No customers found
                      </div>
                    ) : (
                      filteredCustomers.slice(0, 100).map((customer) => (
                        <div
                          key={customer.id}
                          className={`rd-debit-searchable-item ${
                            formData.customerId === customer.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleCustomerSelect(customer)}
                        >
                          <span className="rd-debit-searchable-name">
                            {customer?.customer_name ||
                              `Customer #${customer?.id ?? "-"}`}
                          </span>
                          {customer?.customer_group && (
                            <span className="rd-debit-searchable-tag">
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
                <small className="rd-debit-error">{errors.customerId}</small>
              )}
            </div>

            <div className="rd-debit-field">
              <label>
                Reference Type <span>*</span>
              </label>
              <select
                value={formData.referenceType}
                onChange={(e) => handleChange("referenceType", e.target.value)}
              >
                <option value="Sales Invoice">Sales Invoice</option>
                <option value="Sales Order">Sales Order</option>
                <option value="Delivery Note">Delivery Note</option>
                <option value="Payment">Payment</option>
                <option value="Other">Other</option>
              </select>
              {errors.referenceType && (
                <small className="rd-debit-error">{errors.referenceType}</small>
              )}
            </div>
          </div>

          {/* Sales Invoice */}
          <div className="rd-debit-row">
            <div className="rd-debit-field">
              <label>
                Sales Invoice <span>*</span>
              </label>

              <div className="rd-debit-searchable" ref={invoiceRef}>
                <div className="rd-debit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      !formData.customerId
                        ? "Select customer first"
                        : loadingInvoices
                        ? "Loading invoices..."
                        : "Search or select sales invoice"
                    }
                    value={
                      formData.salesInvoiceId
                        ? formData.salesInvoiceNo ||
                          String(formData.salesInvoiceId)
                        : invoiceSearch
                    }
                    onChange={(e) => {
                      setInvoiceSearch(e.target.value);
                      setShowInvoiceDropdown(true);
                    }}
                    onFocus={() => setShowInvoiceDropdown(true)}
                    disabled={!formData.customerId || loadingInvoices}
                  />
                  {formData.salesInvoiceId && (
                    <button
                      type="button"
                      className="rd-debit-searchable-clear"
                      onClick={clearInvoice}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <span className="rd-debit-searchable-chevron">▾</span>
                </div>

                {showInvoiceDropdown && (
                  <div className="rd-debit-searchable-menu">
                    {filteredInvoices.length === 0 ? (
                      <div className="rd-debit-searchable-empty">
                        {salesInvoices.length === 0
                          ? "No invoices found for this customer"
                          : "No matching invoices"}
                      </div>
                    ) : (
                      filteredInvoices.slice(0, 100).map((invoice) => (
                        <div
                          key={invoice.id}
                          className={`rd-debit-searchable-item ${
                            formData.salesInvoiceId === invoice.id
                              ? "active"
                              : ""
                          }`}
                          onClick={() => handleInvoiceSelect(invoice)}
                        >
                          <div className="rd-debit-searchable-row">
                            <span className="rd-debit-searchable-name">
                              #{invoice.id}
                              {invoice.customer_name
                                ? ` · ${invoice.customer_name}`
                                : ""}
                            </span>
                            <span className="rd-debit-searchable-amount">
                              ₹
                              {Number(
                                invoice?.grand_total ?? 0
                              ).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <span className="rd-debit-searchable-sub">
                            {invoice?.posting_date
                              ? new Date(
                                  invoice.posting_date
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {errors.salesInvoiceId && (
                <small className="rd-debit-error">
                  {errors.salesInvoiceId}
                </small>
              )}
            </div>
          </div>

          {/* Sales Order No. (conditional) */}
          {formData.referenceType === "Sales Order" && (
            <div className="rd-debit-row">
              <div className="rd-debit-field">
                <label>
                  Sales Order No. <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter sales order number"
                  value={formData.salesOrderNo}
                  onChange={(e) =>
                    handleChange("salesOrderNo", e.target.value)
                  }
                />
                {errors.salesOrderNo && (
                  <small className="rd-debit-error">
                    {errors.salesOrderNo}
                  </small>
                )}
              </div>
            </div>
          )}

          {/* Delivery Note No. (conditional) */}
          {formData.referenceType === "Delivery Note" && (
            <div className="rd-debit-row">
              <div className="rd-debit-field">
                <label>
                  Delivery Note No. <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter delivery note number"
                  value={formData.deliveryNoteNo}
                  onChange={(e) =>
                    handleChange("deliveryNoteNo", e.target.value)
                  }
                />
                {errors.deliveryNoteNo && (
                  <small className="rd-debit-error">
                    {errors.deliveryNoteNo}
                  </small>
                )}
              </div>
            </div>
          )}

          {/* Payment Type */}
          <div className="rd-debit-row">
            <div className="rd-debit-field payment-field">
              <label>
                Payment Type <span>*</span>
              </label>
              <div className="rd-debit-radio-group">
             
                <label className="rd-debit-radio">
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
                <label className="rd-debit-radio">
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
                <label className="rd-debit-radio">
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
                <small className="rd-debit-error">{errors.paymentType}</small>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="rd-debit-row">
            <div className="rd-debit-field">
              <label>
                Amount <span>*</span>
              </label>
              <div className="rd-debit-amount">
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
                <small className="rd-debit-error">{errors.amount}</small>
              )}
            </div>
          </div>

          {/* Narration */}
          <div className="rd-debit-row">
            <div className="rd-debit-field">
              <label>
                Narration <span>*</span>
              </label>
              <textarea
                placeholder="Add narration"
                value={formData.narration}
                onChange={(e) => handleChange("narration", e.target.value)}
              />
              {errors.narration && (
                <small className="rd-debit-error">{errors.narration}</small>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="rd-debit-actions">
            <button
              type="button"
              className="rd-debit-submit"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebitForm;