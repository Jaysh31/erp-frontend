import React, { useMemo, useState } from "react";
import "./GAEForm.css";

type AccountRow = {
  id: number;
  account: string;
  type: string;
  party: string;
  reference: string;
  debit: number;
  credit: number;
  costCenter: string;
  remarks: string;
};

const GAEForm: React.FC = () => {
  const [rows, setRows] = useState<AccountRow[]>([
    {
      id: 1,
      account: "Purchase Account",
      type: "Supplier",
      party: "ABC Supplier",
      reference: "PI-000123",
      debit: 10000,
      credit: 0,
      costCenter: "Main",
      remarks: "Purchase",
    },
    {
      id: 2,
      account: "Cash Account",
      type: "-",
      party: "-",
      reference: "-",
      debit: 0,
      credit: 10000,
      costCenter: "Main",
      remarks: "Cash paid",
    },
  ]);

  const [form, setForm] = useState({
    entryNo: "JV-000012",
    postingDate: "09/09/2026",
    company: "SculptorTech",
    voucherType: "General Entry",
    referenceNo: "",
    referenceDate: "",
    remarks: "",
    currency: "INR",
    exchangeRate: "1",
    status: "Draft",

    debitEntryType: "Debit",
    debitReferenceType: "Purchase Invoice",
    purchaseInvoice: "PI-000123",
    supplier: "ABC Suppliers",
    purchaseInvoiceDate: "09/09/2026",
    purchaseInvoiceAmount: "50000",

    creditEntryType: "Credit",
    creditReferenceType: "Sales Invoice",
    salesInvoice: "SI-000456",
    customer: "XYZ Customer",
    salesInvoiceDate: "09/09/2026",
    salesInvoiceAmount: "75000",

    bottomEntryType: "Credit",
  });

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateRow = (
    id: number,
    field: keyof AccountRow,
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        account: "",
        type: "-",
        party: "-",
        reference: "-",
        debit: 0,
        credit: 0,
        costCenter: "Main",
        remarks: "",
      },
    ]);
  };

  const deleteRow = (id: number) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  const totalDebit = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.debit || 0), 0),
    [rows]
  );

  const totalCredit = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row.credit || 0), 0),
    [rows]
  );

  const difference = Math.abs(totalDebit - totalCredit);

  const formatAmount = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSaveDraft = () => {
    console.log("Saving Draft:", {
      form,
      rows,
      totalDebit,
      totalCredit,
      difference,
    });
  };

  const handleSubmit = () => {
    if (difference !== 0) {
      alert("Debit and Credit totals must be equal before submitting.");
      return;
    }

    console.log("Submitting:", {
      form,
      rows,
      totalDebit,
      totalCredit,
    });
  };

  return (
    <div className="gae-page">
      <div className="gae-container">
        {/* ================= HEADER ================= */}
        <div className="gae-header">
          <h1>GENERAL ACCOUNT ENTRY</h1>
        </div>

        {/* ================= BASIC DETAILS ================= */}
        <div className="gae-basic-section">
          <div className="gae-field">
            <label>Entry No.</label>
            <input
              value={form.entryNo}
              disabled
              onChange={(e) => updateForm("entryNo", e.target.value)}
            />
          </div>

          <div className="gae-field">
            <label>Posting Date</label>
            <div className="gae-input-icon">
              <input
                type="date"
                value="2026-09-09"
                onChange={(e) => updateForm("postingDate", e.target.value)}
              />
            </div>
          </div>

          <div className="gae-field">
            <label>Company</label>
            <select
              value={form.company}
              onChange={(e) => updateForm("company", e.target.value)}
            >
              <option>SculptorTech</option>
              <option>ABC Company</option>
              <option>XYZ Pvt Ltd</option>
            </select>
          </div>

          <div className="gae-field">
            <label>Voucher Type</label>
            <select
              value={form.voucherType}
              onChange={(e) => updateForm("voucherType", e.target.value)}
            >
              <option>General Entry</option>
              <option>Payment</option>
              <option>Receipt</option>
              <option>Adjustment</option>
            </select>
          </div>

          <div className="gae-field">
            <label>Reference No.</label>
            <input
              value={form.referenceNo}
              placeholder=""
              onChange={(e) => updateForm("referenceNo", e.target.value)}
            />
          </div>

          <div className="gae-field">
            <label>Reference Date</label>
            <input
              type="date"
              value={form.referenceDate}
              onChange={(e) => updateForm("referenceDate", e.target.value)}
            />
          </div>

          <div className="gae-field gae-remarks-field">
            <label>Remarks</label>
            <textarea
              value={form.remarks}
              placeholder="Enter remarks..."
              onChange={(e) => updateForm("remarks", e.target.value)}
            />
          </div>
        </div>

        {/* ================= ACCOUNT ENTRIES ================= 
        <section className="gae-section">
          <div className="gae-section-title">ACCOUNT ENTRIES</div>

          <div className="gae-table-wrapper">
            <table className="gae-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th>Reference</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Cost Center</th>
                  <th>Remarks</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select
                        value={row.account}
                        onChange={(e) =>
                          updateRow(row.id, "account", e.target.value)
                        }
                      >
                        <option value="">Select Account</option>
                        <option>Purchase Account</option>
                        <option>Cash Account</option>
                        <option>Bank Account</option>
                        <option>Sales Account</option>
                        <option>Expense Account</option>
                        <option>Customer Account</option>
                        <option>Supplier Account</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={row.type}
                        onChange={(e) =>
                          updateRow(row.id, "type", e.target.value)
                        }
                      >
                        <option>-</option>
                        <option>Customer</option>
                        <option>Supplier</option>
                        <option>Employee</option>
                        <option>Other</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={row.party}
                        onChange={(e) =>
                          updateRow(row.id, "party", e.target.value)
                        }
                      >
                        <option>-</option>
                        <option>ABC Supplier</option>
                        <option>ABC Suppliers</option>
                        <option>XYZ Customer</option>
                        <option>XYZ Customers</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={row.reference}
                        onChange={(e) =>
                          updateRow(row.id, "reference", e.target.value)
                        }
                      >
                        <option>-</option>
                        <option>PI-000123</option>
                        <option>PI-000124</option>
                        <option>SI-000456</option>
                        <option>SI-000457</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.debit}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "debit",
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.credit}
                        onChange={(e) =>
                          updateRow(
                            row.id,
                            "credit",
                            Number(e.target.value) || 0
                          )
                        }
                      />
                    </td>

                    <td>
                      <select
                        value={row.costCenter}
                        onChange={(e) =>
                          updateRow(row.id, "costCenter", e.target.value)
                        }
                      >
                        <option>Main</option>
                        <option>Sales</option>
                        <option>Purchase</option>
                        <option>Admin</option>
                        <option>Production</option>
                      </select>
                    </td>

                    <td>
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) =>
                          updateRow(row.id, "remarks", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <button
                        type="button"
                        className="gae-delete-btn"
                        onClick={() => deleteRow(row.id)}
                        title="Delete row"
                      >
                        <svg
                          width="17"
                          height="17"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v5" />
                          <path d="M14 11v5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER 
          <div className="gae-table-footer">
            <button
              type="button"
              className="gae-add-row-btn"
              onClick={addRow}
            >
              <span>+</span>
              Add Row
            </button>

            <div className="gae-totals">
              <div className="gae-total-item">
                <span>Total Debit:</span>
                <strong>₹ {formatAmount(totalDebit)}</strong>
              </div>

              <div className="gae-total-item">
                <span>Total Credit:</span>
                <strong>₹ {formatAmount(totalCredit)}</strong>
              </div>

              <div
                className={`gae-total-item gae-difference ${
                  difference === 0 ? "balanced" : "unbalanced"
                }`}
              >
                <span>Difference:</span>
                <strong>₹ {formatAmount(difference)}</strong>
              </div>
            </div>
          </div>
        </section>

        {/* ================= REFERENCE DETAILS ================= 
        <section className="gae-section reference-section">
          <div className="gae-section-title">REFERENCE DETAILS</div>

          <div className="gae-reference-grid">
            {/* DEBIT 
            <div className="gae-reference-card">
              <div className="gae-ref-field">
                <label>Entry Type</label>
                <select
                  value={form.debitEntryType}
                  onChange={(e) =>
                    updateForm("debitEntryType", e.target.value)
                  }
                >
                  <option>Debit</option>
                  <option>Credit</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Reference Type</label>
                <select
                  value={form.debitReferenceType}
                  onChange={(e) =>
                    updateForm("debitReferenceType", e.target.value)
                  }
                >
                  <option>Purchase Invoice</option>
                  <option>Payment</option>
                  <option>Expense</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Purchase Invoice</label>
                <select
                  value={form.purchaseInvoice}
                  onChange={(e) =>
                    updateForm("purchaseInvoice", e.target.value)
                  }
                >
                  <option>PI-000123</option>
                  <option>PI-000124</option>
                  <option>PI-000125</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Supplier</label>
                <input
                  value={form.supplier}
                  onChange={(e) => updateForm("supplier", e.target.value)}
                />
              </div>

              <div className="gae-ref-field">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value="2026-09-09"
                  onChange={(e) =>
                    updateForm("purchaseInvoiceDate", e.target.value)
                  }
                />
              </div>

              <div className="gae-ref-field">
                <label>Invoice Amount</label>
                <div className="gae-amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    value={form.purchaseInvoiceAmount}
                    onChange={(e) =>
                      updateForm("purchaseInvoiceAmount", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* CREDIT 
            <div className="gae-reference-card">
              <div className="gae-ref-field">
                <label>Entry Type</label>
                <select
                  value={form.creditEntryType}
                  onChange={(e) =>
                    updateForm("creditEntryType", e.target.value)
                  }
                >
                  <option>Credit</option>
                  <option>Debit</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Reference Type</label>
                <select
                  value={form.creditReferenceType}
                  onChange={(e) =>
                    updateForm("creditReferenceType", e.target.value)
                  }
                >
                  <option>Sales Invoice</option>
                  <option>Receipt</option>
                  <option>Income</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Sales Invoice</label>
                <select
                  value={form.salesInvoice}
                  onChange={(e) =>
                    updateForm("salesInvoice", e.target.value)
                  }
                >
                  <option>SI-000456</option>
                  <option>SI-000457</option>
                  <option>SI-000458</option>
                </select>
              </div>

              <div className="gae-ref-field">
                <label>Customer</label>
                <input
                  value={form.customer}
                  onChange={(e) => updateForm("customer", e.target.value)}
                />
              </div>

              <div className="gae-ref-field">
                <label>Invoice Date</label>
                <input
                  type="date"
                  value="2026-09-09"
                  onChange={(e) =>
                    updateForm("salesInvoiceDate", e.target.value)
                  }
                />
              </div>

              <div className="gae-ref-field">
                <label>Invoice Amount</label>
                <div className="gae-amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    value={form.salesInvoiceAmount}
                    onChange={(e) =>
                      updateForm("salesInvoiceAmount", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOOTER ================= */}
        <div className="gae-footer">
          <div className="gae-actions">
            <button
              type="button"
              className="gae-btn gae-save-btn"
              onClick={handleSaveDraft}
            >
              Save Draft
            </button>

            <button
              type="button"
              className="gae-btn gae-submit-btn"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>

          <div className="gae-bottom-entry-type">
            <label>Entry Type</label>

            <select
              value={form.bottomEntryType}
              onChange={(e) =>
                updateForm("bottomEntryType", e.target.value)
              }
            >
              <option>Credit</option>
              <option>Debit</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GAEForm;