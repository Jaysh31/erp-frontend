import React, { useState } from "react";
import "./CreditForm.css";

interface CreditFormData {
  creditDate: string;
  customer: string;
  referenceType: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentType: string;
  amount: string;
  narration: string;
}

const initialFormData: CreditFormData = {
  creditDate: "2026-09-09",
  customer: "XYZ Customer",
  referenceType: "Sales Invoice",
  invoiceNumber: "SI-000456",
  invoiceDate: "2026-09-09",
  paymentType: "Bank Transfer",
  amount: "75000.00",
  narration: "",
};

const CreditForm: React.FC = () => {
  const [formData, setFormData] =
    useState<CreditFormData>(initialFormData);

  const [errors, setErrors] = useState<
    Partial<Record<keyof CreditFormData, string>>
  >({});

  const handleChange = (
    field: keyof CreditFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const newErrors: Partial<
      Record<keyof CreditFormData, string>
    > = {};

    if (!formData.creditDate) {
      newErrors.creditDate = "Credit date is required";
    }

    if (!formData.customer.trim()) {
      newErrors.customer = "Customer is required";
    }

    if (!formData.referenceType) {
      newErrors.referenceType = "Reference type is required";
    }

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = "Invoice number is required";
    }

    if (!formData.invoiceDate) {
      newErrors.invoiceDate = "Invoice date is required";
    }

    if (!formData.paymentType) {
      newErrors.paymentType = "Payment type is required";
    }

    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "Enter a valid amount";
    }

    if (!formData.narration.trim()) {
      newErrors.narration = "Narration is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const saveCreditDetails = () => {
    console.log("Credit details saved:", formData);

    // Add your API call here
    // Example:
    // await axios.post("/api/reference-details/credit", formData);
  };

  const handleSaveContinue = () => {
    if (!validateForm()) {
      return;
    }

    saveCreditDetails();

    // Refresh / reset form after successful save
    setFormData({
      ...initialFormData,
      creditDate: new Date().toISOString().split("T")[0],
      customer: "",
      invoiceNumber: "",
      invoiceDate: "",
      amount: "",
      narration: "",
    });

    setErrors({});

    console.log("Credit details saved. Form refreshed.");
  };

  const handleSaveClose = () => {
    if (!validateForm()) {
      return;
    }

    saveCreditDetails();

    console.log("Credit details saved. Closing form.");

    // If using React Router:
    // navigate(-1);

    window.history.back();
  };

  return (
    <div className="rd-credit-page">
      <div className="rd-credit-card">

        {/* ================= HEADER ================= */}
        <div className="rd-credit-header">
          <h2>REFERENCE DETAILS – CREDIT FORM</h2>
        </div>

        {/* ================= FORM ================= */}
        <div className="rd-credit-form">

          {/* ================= ROW 1 ================= */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Credit Date <span>*</span>
              </label>

              <input
                type="date"
                value={formData.creditDate}
                onChange={(e) =>
                  handleChange(
                    "creditDate",
                    e.target.value
                  )
                }
              />

              {errors.creditDate && (
                <small className="rd-credit-error">
                  {errors.creditDate}
                </small>
              )}
            </div>
          </div>

          {/* ================= ROW 2 ================= */}
          <div className="rd-credit-row two-column">

            {/* Customer */}
            <div className="rd-credit-field">
              <label>
                Customer <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Enter customer"
                value={formData.customer}
                onChange={(e) =>
                  handleChange(
                    "customer",
                    e.target.value
                  )
                }
              />

              {errors.customer && (
                <small className="rd-credit-error">
                  {errors.customer}
                </small>
              )}
            </div>

            {/* Reference Type */}
            <div className="rd-credit-field">
              <label>
                Reference Type <span>*</span>
              </label>

              <select
                value={formData.referenceType}
                onChange={(e) =>
                  handleChange(
                    "referenceType",
                    e.target.value
                  )
                }
              >
                <option value="Sales Invoice">
                  Sales Invoice
                </option>
                <option value="Sales Order">
                  Sales Order
                </option>
                <option value="Receipt">
                  Receipt
                </option>
                <option value="Income">
                  Income
                </option>
                <option value="Other">
                  Other
                </option>
              </select>

              {errors.referenceType && (
                <small className="rd-credit-error">
                  {errors.referenceType}
                </small>
              )}
            </div>

          </div>

          {/* ================= ROW 3 ================= */}
          <div className="rd-credit-row two-column">

            {/* Invoice Number */}
            <div className="rd-credit-field">
              <label>
                Invoice Number <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Enter invoice number"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  handleChange(
                    "invoiceNumber",
                    e.target.value
                  )
                }
              />

              {errors.invoiceNumber && (
                <small className="rd-credit-error">
                  {errors.invoiceNumber}
                </small>
              )}
            </div>

            {/* Invoice Date */}
            <div className="rd-credit-field">
              <label>
                Invoice Date <span>*</span>
              </label>

              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  handleChange(
                    "invoiceDate",
                    e.target.value
                  )
                }
              />

              {errors.invoiceDate && (
                <small className="rd-credit-error">
                  {errors.invoiceDate}
                </small>
              )}
            </div>

          </div>

          {/* ================= ROW 4 ================= */}
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
                    checked={
                      formData.paymentType ===
                      "Bank Transfer"
                    }
                    onChange={(e) =>
                      handleChange(
                        "paymentType",
                        e.target.value
                      )
                    }
                  />
                  <span>Bank Transfer</span>
                </label>

                <label className="rd-credit-radio">
                  <input
                    type="radio"
                    name="paymentType"
                    value="Cash"
                    checked={
                      formData.paymentType === "Cash"
                    }
                    onChange={(e) =>
                      handleChange(
                        "paymentType",
                        e.target.value
                      )
                    }
                  />
                  <span>Cash</span>
                </label>

                <label className="rd-credit-radio">
                  <input
                    type="radio"
                    name="paymentType"
                    value="UPI"
                    checked={
                      formData.paymentType === "UPI"
                    }
                    onChange={(e) =>
                      handleChange(
                        "paymentType",
                        e.target.value
                      )
                    }
                  />
                  <span>UPI</span>
                </label>

              </div>

              {errors.paymentType && (
                <small className="rd-credit-error">
                  {errors.paymentType}
                </small>
              )}

            </div>
          </div>

          {/* ================= ROW 5 ================= */}
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
                  onChange={(e) =>
                    handleChange(
                      "amount",
                      e.target.value
                    )
                  }
                />
              </div>

              {errors.amount && (
                <small className="rd-credit-error">
                  {errors.amount}
                </small>
              )}
            </div>
          </div>

          {/* ================= ROW 6 ================= */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Narration <span>*</span>
              </label>

              <textarea
                placeholder="Add narration"
                value={formData.narration}
                onChange={(e) =>
                  handleChange(
                    "narration",
                    e.target.value
                  )
                }
              />

              {errors.narration && (
                <small className="rd-credit-error">
                  {errors.narration}
                </small>
              )}
            </div>
          </div>

          {/* ================= ACTIONS ================= */}
          <div className="rd-credit-actions">

            <button
              type="button"
              className="rd-credit-save-continue"
              onClick={handleSaveContinue}
            >
              Save Continue
            </button>

            <button
              type="button"
              className="rd-credit-save-close"
              onClick={handleSaveClose}
            >
              Save Close
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};


export default CreditForm;