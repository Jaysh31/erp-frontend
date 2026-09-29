import React, { useState } from "react";
import "./DebitForm.css";

interface DebitFormData {
  entryType: string;
  referenceType: string;
  purchaseInvoice: string;
  supplier: string;
  invoiceDate: string;
  invoiceAmount: string;
}

const DebitForm: React.FC = () => {
  const [formData, setFormData] = useState<DebitFormData>({
    entryType: "Debit",
    referenceType: "Purchase Invoice",
    purchaseInvoice: "PI-000123",
    supplier: "ABC Suppliers",
    invoiceDate: "2026-09-09",
    invoiceAmount: "50000.00",
  });

  const handleChange = (
    field: keyof DebitFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveDraft = () => {
    console.log("Debit form saved as draft:", formData);
  };

  const handleSubmit = () => {
    console.log("Debit form submitted:", formData);
  };

  return (
    <div className="rd-debit-page">
      <div className="rd-debit-card">

        {/* Header */}
        <div className="rd-debit-header">
          <h2>REFERENCE DETAILS – DEBIT FORM</h2>
        </div>

        {/* Form */}
        <div className="rd-debit-form">

          {/* Entry Type */}
          <div className="rd-debit-field">
            <label>Entry Type</label>

            <select
              value={formData.entryType}
              onChange={(e) =>
                handleChange("entryType", e.target.value)
              }
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
            </select>
          </div>

          {/* Reference Type */}
          <div className="rd-debit-field">
            <label>Reference Type</label>

            <select
              value={formData.referenceType}
              onChange={(e) =>
                handleChange("referenceType", e.target.value)
              }
            >
              <option value="Purchase Invoice">
                Purchase Invoice
              </option>
              <option value="Payment">Payment</option>
              <option value="Expense">Expense</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Purchase Invoice */}
          <div className="rd-debit-field">
            <label>Purchase Invoice</label>

            <select
              value={formData.purchaseInvoice}
              onChange={(e) =>
                handleChange(
                  "purchaseInvoice",
                  e.target.value
                )
              }
            >
              <option value="PI-000123">PI-000123</option>
              <option value="PI-000124">PI-000124</option>
              <option value="PI-000125">PI-000125</option>
            </select>
          </div>

          {/* Supplier */}
          <div className="rd-debit-field">
            <label>Supplier</label>

            <input
              type="text"
              value={formData.supplier}
              onChange={(e) =>
                handleChange("supplier", e.target.value)
              }
            />
          </div>

          {/* Invoice Date */}
          <div className="rd-debit-field">
            <label>Invoice Date</label>

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
          </div>

          {/* Invoice Amount */}
          <div className="rd-debit-field">
            <label>Invoice Amount</label>

            <div className="rd-debit-amount">
              <span>₹</span>

              <input
                type="number"
                value={formData.invoiceAmount}
                onChange={(e) =>
                  handleChange(
                    "invoiceAmount",
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="rd-debit-actions">
            <button
              type="button"
              className="rd-debit-save"
              onClick={handleSaveDraft}
            >
              Save Draft
            </button>

            <button
              type="button"
              className="rd-debit-submit"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DebitForm;