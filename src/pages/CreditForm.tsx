import React, { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaChevronDown, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import "./CreditForm.css";

interface SalesInvoice {
  id: string | number;
  customer: string;
  customer_name: string;
  posting_date: string;
  due_date?: string;
  currency?: string;
  total?: number;
  net_total?: number;
  grand_total: number;
  outstanding_amount?: number;
  paid_amount?: number;
  status?: string;
  company?: string;
  creation?: string;
  modified?: string;
}


interface SalesBillDraftPayload {
  selectedCustomer: string;
  selectedSalesOrder: string;
  isService: boolean;
  hasDeliveryChallan: boolean;
  billDate: string;
  dueDate: string;
  warehouse: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentMode: string;
  invoiceStatus: string;
  remarks: string;
  customerData: Customer | null;
  isCustomerDisabled: boolean;
  selectedPaymentTemplate: string;
}

interface CustomerDropdownProps {
  value: string;
  onChange: (value: string, customerData?: Customer) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  presetCustomer?: Customer | null;

  onAddNew: (searchTerm: string) => void;
}

interface ApiResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: SalesInvoice[];
  };
}

interface CustomerOption {
  customerId: string;
  customerName: string;
  invoice: SalesInvoice;
}

type Customer = Record<string, unknown>;

const formatInvoiceNumber = (id: string | number) => {
  const numId = typeof id === "string" ? parseInt(id, 10) : id;

  if (Number.isNaN(numId)) {
    return String(id);
  }

  return `SINV-${String(numId).padStart(5, "0")}`;
};

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return "";

  return dateString.substring(0, 10);
};

const formatDateForDisplay = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-GB");
};

const CreditForm: React.FC = () => {
  const navigate = useNavigate();

  // ============================================================
  // SALES INVOICES
  // ============================================================

  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // ============================================================
  // FORM STATE
  // ============================================================

  const [receiptNo, setReceiptNo] = useState("");
  const [creditDate, setCreditDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [customer, setCustomer] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [amount, setAmount] = useState("");

  const [referenceType, setReferenceType] = useState("");
  const [referenceNo, setReferenceNo] = useState("");

  const [paymentType, setPaymentType] = useState("Bank Transfer");

  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [narration, setNarration] = useState("");

  const [saving, setSaving] = useState(false);

  // ============================================================
  // FETCH SALES INVOICES
  // ============================================================

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);

      const response = await api.get<ApiResponse>(
        "/sales-invoice?page=1&limit=1000"
      );

      if (
        response.data?.success === 1 &&
        response.data?.data?.records
      ) {
        setInvoices(response.data.data.records);
      } else {
        setInvoices([]);
        toast.error("No sales invoices found");
      }
    } catch (error) {
      console.error("Error fetching sales invoices:", error);
      toast.error("Failed to load customers");
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // ============================================================
  // CUSTOMER DROPDOWN
  // ============================================================

  const customers = useMemo<CustomerOption[]>(() => {
    const map = new Map<string, CustomerOption>();

    invoices.forEach((invoice) => {
      const customerId = String(
        invoice.customer || invoice.customer_name || ""
      ).trim();

      const customerName = String(
        invoice.customer_name || invoice.customer || ""
      ).trim();

      if (!customerId || !customerName) return;

      /*
       * If one customer has multiple invoices,
       * keep the latest invoice for auto-fill.
       */
      const existing = map.get(customerId);

      if (!existing) {
        map.set(customerId, {
          customerId,
          customerName,
          invoice,
        });
        return;
      }

      const existingDate = new Date(
        existing.invoice.posting_date || existing.invoice.creation || ""
      ).getTime();

      const currentDate = new Date(
        invoice.posting_date || invoice.creation || ""
      ).getTime();

      if (currentDate > existingDate) {
        map.set(customerId, {
          customerId,
          customerName,
          invoice,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.customerName.localeCompare(b.customerName)
    );
  }, [invoices]);

  // ============================================================
  // CUSTOMER CHANGE
  // ============================================================

  const handleCustomerChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const customerId = event.target.value;

    setCustomer(customerId);

    if (!customerId) {
      setInvoiceNo("");
      setInvoiceDate("");
      setAmount("");
      setReferenceNo("");
      return;
    }

    const selectedCustomer = customers.find(
      (item) => item.customerId === customerId
    );

    if (!selectedCustomer) {
      return;
    }

    const invoice = selectedCustomer.invoice;

    // Auto-fill invoice number
    setInvoiceNo(formatInvoiceNumber(invoice.id));

    // Auto-fill invoice date
    setInvoiceDate(formatDateForInput(invoice.posting_date));

    // Auto-fill amount
    const invoiceAmount =
      invoice.grand_total ??
      invoice.net_total ??
      invoice.total ??
      0;

    setAmount(String(invoiceAmount));

    // Auto-fill reference number
    setReferenceNo(formatInvoiceNumber(invoice.id));

    // Default reference type
    setReferenceType("Sales Invoice");
  };

  // ============================================================
  // REFERENCE TYPE
  // ============================================================

  const handleReferenceTypeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setReferenceType(event.target.value);
  };

  // ============================================================
  // PAYMENT TYPE
  // ============================================================

  const handlePaymentTypeChange = (type: string) => {
    setPaymentType(type);

    if (type !== "Bank Transfer") {
      setBankName("");
      setAccountNo("");
      setIfscCode("");
    }
  };

  // ============================================================
  // SAVE DATA
  // ============================================================

  const validateForm = () => {
    if (!receiptNo.trim()) {
      toast.error("Receipt No. is required");
      return false;
    }

    if (!creditDate) {
      toast.error("Date is required");
      return false;
    }

    if (!customer) {
      toast.error("Please select customer");
      return false;
    }

    if (!referenceType) {
      toast.error("Please select reference type");
      return false;
    }

    if (!referenceNo.trim()) {
      toast.error("Reference No. is required");
      return false;
    }

    if (!invoiceDate) {
      toast.error("Invoice Date is required");
      return false;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return false;
    }

    if (!narration.trim()) {
      toast.error("Narration is required");
      return false;
    }

    if (paymentType === "Bank Transfer") {
      if (!bankName.trim()) {
        toast.error("Bank Name is required");
        return false;
      }

      if (!accountNo.trim()) {
        toast.error("Account No. is required");
        return false;
      }

      if (!ifscCode.trim()) {
        toast.error("IFSC Code is required");
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    return {
      receipt_no: receiptNo,
      credit_date: creditDate,

      customer,

      reference_type: referenceType,
      reference_no: referenceNo,

      invoice_no: invoiceNo,
      invoice_date: invoiceDate,

      payment_type: paymentType,

      bank_name:
        paymentType === "Bank Transfer" ? bankName : null,

      account_no:
        paymentType === "Bank Transfer" ? accountNo : null,

      ifsc_code:
        paymentType === "Bank Transfer" ? ifscCode : null,

      amount: Number(amount),

      narration,
    };
  };

  const saveCredit = async (closeAfterSave: boolean) => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      console.log("Credit Payload:", payload);

      /*
       * Change this endpoint if your backend uses another
       * Credit Entry API endpoint.
       */
      await api.post("/credit-note", payload);

      toast.success("Credit Entry saved successfully");

      if (closeAfterSave) {
        navigate(-1);
      } else {
        // Reset form for next entry
        setReceiptNo("");
        setCustomer("");
        setInvoiceNo("");
        setInvoiceDate("");
        setReferenceNo("");
        setReferenceType("");
        setAmount("");
        setBankName("");
        setAccountNo("");
        setIfscCode("");
        setNarration("");

        setCreditDate(
          new Date().toISOString().split("T")[0]
        );
      }
    } catch (error: any) {
      console.error("Error saving credit entry:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to save Credit Entry"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="credit-page">

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="credit-header">
        <h2>CREDIT ENTRY</h2>
      </div>

      {/* ========================================================
          MAIN FORM
      ======================================================== */}

      <div className="credit-form-card">

        <div className="credit-form-grid">

          {/* Receipt No */}
          <div className="credit-field">
            <label>
              Receipt No. <span>*</span>
            </label>

            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              placeholder="Enter receipt number"
            />
          </div>

          {/* Date */}
          <div className="credit-field">
            <label>
              Date <span>*</span>
            </label>

            <div className="credit-date-input">
              <input
                type="date"
                value={creditDate}
                onChange={(e) => setCreditDate(e.target.value)}
              />

              <FaCalendarAlt />
            </div>
          </div>

          {/* Customer */}
          <div className="credit-field">
            <label>
              Customer <span>*</span>
            </label>

            {/*<div className="credit-select-wrapper">
              <select
                value={customer}
                onChange={handleCustomerChange}
                disabled={loadingInvoices}
              >
                <option value="">
                  {loadingInvoices
                    ? "Loading customers..."
                    : "Select customer"}
                </option>

                {customers.map((item) => (
                  <option
                    key={item.customerId}
                    value={item.customerId}
                  >
                    {item.customerName}
                  </option>
                ))}
              </select>

              <FaChevronDown />*/}

                  <div className="credit-select-wrapper">
                    <select
                      value={customer}
                      onChange={handleCustomerChange}
                      disabled={loadingInvoices}
                    >
                      <option value="">
                        {loadingInvoices ? "Loading customers..." : "Select customer"}
                      </option>
                      {customers.map((item) => (
                        <option key={item.customerId} value={item.customerId}>
                          {item.customerName}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown />
                  </div>

            </div>
          

          {/* Reference Type */}
          <div className="credit-field">
            <label>
              Reference Type <span>*</span>
            </label>

            <div className="credit-select-wrapper">
              <select
                value={referenceType}
                onChange={handleReferenceTypeChange}
              >
                <option value="">
                  Select reference type
                </option>
                <option value="Sales Invoice">
                  Sales Invoice
                </option>
                <option value="Credit Note">
                  Credit Note
                </option>
                <option value="Journal Entry">
                  Journal Entry
                </option>
              </select>

              <FaChevronDown />
            </div>
          </div>

          {/* Invoice No 
          <div className="credit-field">
            <label>
              Invoice No. <span>*</span>
            </label>

            <input
              type="text"
              value={invoiceNo}
              readOnly
              placeholder="Auto-filled invoice number"
            />
          </div>*/}

           {/* Reference No */}
          <div className="credit-field">
            <label>
              Reference No. <span>*</span>
            </label>

            <input
              type="text"
              value={referenceNo}
              onChange={(e) =>
                setReferenceNo(e.target.value)
              }
              placeholder="Enter reference number"
            />
          </div>

      


          {/* Invoice Date */}
          <div className="credit-field">
            <label>
              Invoice Date <span>*</span>
            </label>

            <div className="credit-date-input">
              <input
                type="date"
                value={invoiceDate}
                readOnly
              />

              <FaCalendarAlt />
            </div>
          </div>
</div>
         
        {/* ======================================================
            PAYMENT TYPE
        ====================================================== */}

        <div className="payment-type-row">

          <label>
            Payment Type <span>*</span>
          </label>

          <div className="payment-options">

            <label className="payment-option">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === "Bank Transfer"}
                onChange={() =>
                  handlePaymentTypeChange("Bank Transfer")
                }
              />
              <span>Bank Transfer</span>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === "Cash"}
                onChange={() =>
                  handlePaymentTypeChange("Cash")
                }
              />
              <span>Cash</span>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="paymentType"
                checked={paymentType === "UPI"}
                onChange={() =>
                  handlePaymentTypeChange("UPI")
                }
              />
              <span>UPI</span>
            </label>

          </div>
        </div>

        {/* ======================================================
            BANK DETAILS
        ====================================================== */}

        {paymentType === "Bank Transfer" && (
          <div className="bank-details">

            <div className="bank-details-header">
              Bank Details
            </div>

            <div className="bank-details-body">

              {/* Bank Name */}
              <div className="credit-field">
                <label>
                  Bank Name <span>*</span>
                </label>

                <div className="credit-select-wrapper">
                  <select
                    value={bankName}
                    onChange={(e) =>
                      setBankName(e.target.value)
                    }
                  >
                    <option value="">
                      Select bank
                    </option>
                    <option value="State Bank of India">
                      State Bank of India
                    </option>
                    <option value="HDFC Bank">
                      HDFC Bank
                    </option>
                    <option value="ICICI Bank">
                      ICICI Bank
                    </option>
                    <option value="Axis Bank">
                      Axis Bank
                    </option>
                    <option value="Kotak Mahindra Bank">
                      Kotak Mahindra Bank
                    </option>
                  </select>

                  <FaChevronDown />
                </div>
              </div>

              {/* Account No */}
              <div className="credit-field">
                <label>
                  Account No. <span>*</span>
                </label>

                <input
                  type="text"
                  value={accountNo}
                  onChange={(e) =>
                    setAccountNo(e.target.value)
                  }
                  placeholder="Enter account number"
                />
              </div>

              {/* IFSC */}
              <div className="credit-field">
                <label>
                  IFSC Code <span>*</span>
                </label>

                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) =>
                    setIfscCode(
                      e.target.value.toUpperCase()
                    )
                  }
                  placeholder="Enter IFSC code"
                />
              </div>

            </div>
          </div>
        )}

        {/* ======================================================
            AMOUNT + NARRATION
        ====================================================== */}

        <div className="credit-bottom-section">

          {/* Amount */}
          <div className="credit-field amount-field">

            <label>
              Amount <span>*</span>
            </label>

            <div className="amount-input-wrapper">

              <span className="rupee-symbol">
                ₹
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="Enter amount"
              />

            </div>

          </div>

          {/* Narration */}
          <div className="credit-field narration-field">

            <label>
              Narration <span>*</span>
            </label>

            <textarea
              value={narration}
              onChange={(e) =>
                setNarration(e.target.value)
              }
              placeholder="Add narration"
              rows={4}
            />

          </div>

        </div>

        {/* ======================================================
            BUTTONS
        ====================================================== */}

        <div className="credit-footer">

          <button
            type="button"
            className="credit-btn credit-btn-primary"
            disabled={saving}
            onClick={() => saveCredit(false)}
          >
            <FaSave />

            {saving
              ? "Saving..."
              : "Save Continue"}
          </button>

          <button
            type="button"
            className="credit-btn credit-btn-primary"
            disabled={saving}
            onClick={() => saveCredit(true)}
          >
            <FaSave />

            {saving
              ? "Saving..."
              : "Save Close"}
          </button>

        </div>

      </div>
    </div>
  );
};

export default CreditForm;
