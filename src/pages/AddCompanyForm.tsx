import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaFileAlt, FaShoppingCart, FaIndustry, FaPercentage,
  FaUniversity, FaArrowRight, FaFileInvoiceDollar,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddCompanyForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";

// ─── interfaces ───────────────────────────────────────────────────────────

interface CompanyFormData {
  // Company Details
  company: string;
  default_letter_head: string;
  abbr: string;
  tax_id: string;
  default_currency: string;
  domain: string;
  country: string;
  date_of_establishment: Date | null;
  default_gst_rate: number;
  parent_company: string;
  is_group: boolean;
  default_holiday_list: string;
  gstin_uin: string;
  gst_category: string;
  pan: string;
  registration_details: string;

  // Buying and Selling
  default_buying_terms: string;
  default_selling_terms: string;
  monthly_sales_target: number;
  default_sales_contact: string;
  default_warehouse_for_sales_return: string;
  purchase_expense_account: string;
  purchase_expense_contra_account: string;
  service_expense_account: string;

  // Stock and Manufacturing
  default_operating_cost_account: string;
  default_work_in_progress_warehouse: string;
  default_finished_goods_warehouse: string;
  default_scrap_warehouse: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
  sectionKey: SectionKey;
}

type SectionKey = "details" | "buy-sell" | "stock" | "bank";

const GST_CATEGORY_OPTIONS = [
  "Unregistered", "Registered Regular", "Registered Composition", "SEZ",
  "Overseas", "Deemed Export", "UIN Holders", "Tax Deductor", "Tax Collector",
];

const defaultFormData = (): CompanyFormData => ({
  company: "",
  default_letter_head: "",
  abbr: "",
  tax_id: "",
  default_currency: "",
  domain: "",
  country: "",
  date_of_establishment: null,
  default_gst_rate: 18,
  parent_company: "",
  is_group: false,
  default_holiday_list: "",
  gstin_uin: "",
  gst_category: "Unregistered",
  pan: "",
  registration_details: "",

  default_buying_terms: "",
  default_selling_terms: "",
  monthly_sales_target: 0,
  default_sales_contact: "",
  default_warehouse_for_sales_return: "",
  purchase_expense_account: "",
  purchase_expense_contra_account: "",
  service_expense_account: "",

  default_operating_cost_account: "",
  default_work_in_progress_warehouse: "",
  default_finished_goods_warehouse: "",
  default_scrap_warehouse: "",
});

const SECTIONS: { key: SectionKey; name: string }[] = [
  { key: "details", name: "Company Details" },
  { key: "buy-sell", name: "Buying and Selling" },
  { key: "stock", name: "Stock and Manufacturing" },
  { key: "bank", name: "Bank Account" },
];

const AddCompanyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();

  const isEditMode = !!id && id !== "new";

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData());

  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    details: null,
    "buy-sell": null,
    stock: null,
    bank: null,
  });

  // ─── load existing company when editing (from navigation state only) ────
  useEffect(() => {
    if (isEditMode) {
      const state = location.state as { company?: any };
      if (state?.company) {
        loadCompanyIntoForm(state.company);
      }
    }
  }, [id]);

  const loadCompanyIntoForm = (c: any) => {
    setFormData((prev) => ({
      ...prev,
      ...c,
      date_of_establishment: c.date_of_establishment ? new Date(c.date_of_establishment) : null,
    }));
  };

  const scrollToSection = (key: SectionKey) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ─── validation ────────────────────────────────────────────────────────

  const getAllValidationErrors = useCallback((): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.company.trim())
      allErrors.push({ field: "company", label: "Company", message: "Company is required", sectionKey: "details" });
    if (!formData.abbr.trim())
      allErrors.push({ field: "abbr", label: "Abbr", message: "Abbr is required", sectionKey: "details" });
    if (!formData.default_currency.trim())
      allErrors.push({ field: "default_currency", label: "Default Currency", message: "Default Currency is required", sectionKey: "details" });
    if (!formData.country.trim())
      allErrors.push({ field: "country", label: "Country", message: "Country is required", sectionKey: "details" });
    if (!formData.gst_category.trim())
      allErrors.push({ field: "gst_category", label: "GST Category", message: "GST Category is required", sectionKey: "details" });

    return allErrors;
  }, [formData]);

  const jumpToError = (error: ValidationError) => {
    setShowValidationSummary(false);
    scrollToSection(error.sectionKey);
  };

  // ─── field handlers ────────────────────────────────────────────────────

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;
    if (type === "number") {
      processedValue = value === "" ? 0 : parseFloat(value) || 0;
    }
    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    }
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleDateChange = (field: keyof CompanyFormData, date: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  // ─── submit (no API — local only for now) ─────────────────────────────

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      scrollToSection(allErrors[0].sectionKey);
      return;
    }

    setSaving(true);
    // No API call yet — this is where the create/update request will go.
    console.log(isEditMode ? "Update company:" : "Create company:", formData);

    setTimeout(() => {
      setSaving(false);
      navigate("/company");
    }, 400);
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  const setSectionRef = (key: SectionKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  };

  return (
    <div className={`acf-page ${theme}`}>

      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="acf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="acf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="acf-modal-header acf-modal-header-warning">
              <h2 className="acf-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="acf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="acf-modal-body">
              <p className="acf-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="acf-error-list">
                {validationErrors.map((error, idx) => {
                  const section = SECTIONS.find((s) => s.key === error.sectionKey);
                  return (
                    <div key={idx} className="acf-validation-error-item" onClick={() => jumpToError(error)}>
                      <div className="acf-error-header">
                        <FaTimesCircle className="acf-error-icon" />
                        <strong className="acf-error-label">{error.label}</strong>
                        <span className="acf-error-tab">{section?.name}</span>
                      </div>
                      <div className="acf-error-message">{error.message}</div>
                    </div>
                  );
                })}
              </div>
              <div className="acf-hint-banner">
                <FaInfoCircle className="acf-hint-icon" />
                Click on any error to jump to that section
              </div>
            </div>
            <div className="acf-modal-footer">
              <button className="acf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="acf-header-wrap">
        <div className="acf-header-row">
          <button type="button" onClick={() => navigate("/company")} className="acf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="acf-title">
            {isEditMode ? "Edit Company" : "New Company"}
          </h1>

          {hasAnyErrors && (
            <div className="acf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} missing field(s)
            </div>
          )}

          <button
            type="submit"
            form="acf-company-form"
            disabled={saving}
            className="acf-btn-primary acf-btn-submit acf-header-save"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving && <FaSpinner className="acf-spinning" />}
            <FaSave /> {isEditMode ? "Update Company" : "Create Company"}
          </button>
        </div>
      </div>

      {/* Main content — single card, single page scroll (no nested
          scroll containers anywhere below) */}
      <div className="acf-container">
        <form id="acf-company-form" onSubmit={handleSubmit}>
          <div className="acf-card">

            {/* ── Company Details ───────────────────────────────────── */}
            <div ref={setSectionRef("details")} data-section-key="details">
              <div className="acf-section-title acf-section-title-first">
                <FaFileAlt size={12} /> Company Details
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Company *</label>
                  <input
                    type="text" name="company" value={formData.company} onChange={handleInputChange}
                    placeholder="e.g. Acme Industries"
                    className={`acf-input ${errors.company ? "acf-input-error" : ""}`}
                  />
                  {errors.company && <span className="acf-error-text">{errors.company}</span>}
                </div>
                <div>
                  <label className="acf-label">Abbr *</label>
                  <input
                    type="text" name="abbr" value={formData.abbr} onChange={handleInputChange}
                    placeholder="e.g. ACME"
                    className={`acf-input ${errors.abbr ? "acf-input-error" : ""}`}
                  />
                  {errors.abbr && <span className="acf-error-text">{errors.abbr}</span>}
                </div>
                {/* <div>
                  <label className="acf-label">Default Currency *</label>
                  <input
                    type="text" name="default_currency" value={formData.default_currency} onChange={handleInputChange}
                    placeholder="e.g. INR"
                    className={`acf-input ${errors.default_currency ? "acf-input-error" : ""}`}
                  />
                  {errors.default_currency && <span className="acf-error-text">{errors.default_currency}</span>}
                </div> */}
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Country *</label>
                  <input
                    type="text" name="country" value={formData.country} onChange={handleInputChange}
                    placeholder="e.g. India"
                    className={`acf-input ${errors.country ? "acf-input-error" : ""}`}
                  />
                  {errors.country && <span className="acf-error-text">{errors.country}</span>}
                </div>
                <div>
                  <label className="acf-label">Domain</label>
                  <input type="text" name="domain" value={formData.domain} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Letter Head</label>
                  <input type="text" name="default_letter_head" value={formData.default_letter_head} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Tax ID</label>
                  <input type="text" name="tax_id" value={formData.tax_id} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Date of Establishment</label>
                  <DatePicker
                    selected={formData.date_of_establishment}
                    onChange={(date: Date | null) => handleDateChange("date_of_establishment", date)}
                    dateFormat="dd-MM-yyyy" placeholderText="Select date" className="acf-date-input"
                  />
                </div>
                <div>
                  <label className="acf-label">Default GST Rate</label>
                  <input type="number" name="default_gst_rate" value={formData.default_gst_rate || ""} onChange={handleInputChange} placeholder="0" className="acf-input" />
                </div>
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Parent Company</label>
                  <input type="text" name="parent_company" value={formData.parent_company} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Holiday List</label>
                  <input type="text" name="default_holiday_list" value={formData.default_holiday_list} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div className="acf-checkbox-cell">
                  <label className="acf-checkbox-label">
                    <input type="checkbox" name="is_group" checked={formData.is_group} onChange={handleInputChange} className="acf-checkbox" />
                    Is Group
                  </label>
                </div>
              </div>

              <div className="acf-section-title"><FaPercentage size={12} /> Tax Details</div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">GSTIN / UIN</label>
                  <input type="text" name="gstin_uin" value={formData.gstin_uin} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">GST Category *</label>
                  <select
                    name="gst_category" value={formData.gst_category} onChange={handleInputChange}
                    className={`acf-input ${errors.gst_category ? "acf-input-error" : ""}`}
                  >
                    {GST_CATEGORY_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.gst_category && <span className="acf-error-text">{errors.gst_category}</span>}
                </div>
                <div>
                  <label className="acf-label">PAN</label>
                  <input type="text" name="pan" value={formData.pan} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
              </div>

              <div className="acf-field-block">
                <label className="acf-label">Registration Details</label>
                <textarea
                  name="registration_details" value={formData.registration_details} onChange={handleInputChange}
                  rows={3} placeholder="Company registration numbers for your reference. Tax numbers etc."
                  className="acf-input acf-textarea"
                />
              </div>
            </div>

            {/* ── Buying and Selling ─────────────────────────────────── */}
            <div ref={setSectionRef("buy-sell")} data-section-key="buy-sell">
              <div className="acf-section-title">
                <FaShoppingCart size={12} /> Buying and Selling
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Default Buying Terms</label>
                  <input type="text" name="default_buying_terms" value={formData.default_buying_terms} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Selling Terms</label>
                  <input type="text" name="default_selling_terms" value={formData.default_selling_terms} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Monthly Sales Target</label>
                  <input type="number" name="monthly_sales_target" value={formData.monthly_sales_target || ""} onChange={handleInputChange} placeholder="0" className="acf-input" />
                </div>
              </div>
              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Default Sales Contact</label>
                  <input type="text" name="default_sales_contact" value={formData.default_sales_contact} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Warehouse for Sales Return</label>
                  <input type="text" name="default_warehouse_for_sales_return" value={formData.default_warehouse_for_sales_return} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Purchase Expense Account</label>
                  <input type="text" name="purchase_expense_account" value={formData.purchase_expense_account} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
              </div>

              <div className="acf-section-title"><FaFileInvoiceDollar size={12} /> Purchase &amp; Service Expense</div>
              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Purchase Expense Contra Account</label>
                  <input type="text" name="purchase_expense_contra_account" value={formData.purchase_expense_contra_account} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Service Expense Account</label>
                  <input type="text" name="service_expense_account" value={formData.service_expense_account} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                  <span className="acf-field-note">For service item</span>
                </div>
              </div>
            </div>

            {/* ── Stock and Manufacturing ────────────────────────────── */}
            {/* <div ref={setSectionRef("stock")} data-section-key="stock">
              <div className="acf-section-title">
                <FaIndustry size={12} /> Stock and Manufacturing
              </div>

              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Default Operating Cost Account</label>
                  <input type="text" name="default_operating_cost_account" value={formData.default_operating_cost_account} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Work In Progress Warehouse</label>
                  <input type="text" name="default_work_in_progress_warehouse" value={formData.default_work_in_progress_warehouse} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
                <div>
                  <label className="acf-label">Default Finished Goods Warehouse</label>
                  <input type="text" name="default_finished_goods_warehouse" value={formData.default_finished_goods_warehouse} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
              </div>
              <div className="acf-grid-3">
                <div>
                  <label className="acf-label">Default Scrap Warehouse</label>
                  <input type="text" name="default_scrap_warehouse" value={formData.default_scrap_warehouse} onChange={handleInputChange} placeholder="Optional" className="acf-input" />
                </div>
              </div>
            </div> */}

            {/* ── Bank Account (navigates out) ───────────────────────── */}
            <div ref={setSectionRef("bank")} data-section-key="bank">
              <div className="acf-section-title">
                <FaUniversity size={12} /> Bank Account
              </div>
              <div className="acf-nav-card" onClick={() => navigate("/bank-details")}>
                <div className="acf-nav-card-icon"><FaUniversity size={16} /></div>
                <div className="acf-nav-card-text">
                  <div className="acf-nav-card-title">Manage Bank Account</div>
                  <div className="acf-nav-card-sub">Add and edit the company's bank accounts used on invoices and payment vouchers.</div>
                </div>
                <FaArrowRight size={13} className="acf-nav-card-arrow" />
              </div>
            </div>

          </div>

          {/* Bottom actions (mirrors the header button for long pages) */}
          <div className="acf-footer-row">
            <button type="button" onClick={() => navigate("/company")} className="acf-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="acf-btn-primary acf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving && <FaSpinner className="acf-spinning" />}
              <FaSave /> {isEditMode ? "Update Company" : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyForm;