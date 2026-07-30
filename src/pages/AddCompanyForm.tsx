import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaFileAlt, FaShoppingCart, FaIndustry, FaPercentage,
  FaUniversity, FaArrowRight, FaFileInvoiceDollar, FaCheckCircle,
} from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AddCompanyForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";
import api from "../../src/services/api";
import toast from "react-hot-toast";

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

// Formats a Date as YYYY-MM-DD for the API (no timezone surprises).
const formatDateForApi = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const AddCompanyForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();

  const isEditMode = !!id && id !== "new";

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData());

  // Bank accounts collected via the "Manage Bank Account" sub-flow. These
  // travel with the company payload on submit rather than being saved
  // independently — see the embedContext handoff below.
  const [bankAccounts, setBankAccounts] = useState<Record<string, any>[]>([]);

  // Draft cache key — same pattern as AddSupplier. Navigating to
  // /bank-details/... and back unmounts this component, which would wipe
  // React state; we persist to localStorage right before leaving and
  // restore it when we detect we've come back.
  const [formDraftKey, setFormDraftKey] = useState<string>("");

  const sectionRefs = useRef<Record<SectionKey, HTMLDivElement | null>>({
    details: null,
    "buy-sell": null,
    stock: null,
    bank: null,
  });

  // ─── set up the draft key, and load company data (from nav state,
  //     from a saved draft, or start fresh) ──────────────────────────────
  useEffect(() => {
    if (isEditMode && id) {
      const formKey = `company_form_draft_edit_${id}`;
      setFormDraftKey(formKey);

      const returningFromBankDetails = !!(location.state as any)?.bankAccountsUpdated;

      if (returningFromBankDetails) {
        restoreFormDraft(formKey);
        return;
      }

      const state = location.state as { company?: any };
      if (state?.company) {
        loadCompanyIntoForm(state.company);
        // Seed the draft immediately — router state gets replaced the
        // moment we come back from Bank Details, so this is what a
        // subsequent round trip will restore from.
        try {
          localStorage.setItem(
            formKey,
            JSON.stringify({
              formData: {
                ...state.company,
                date_of_establishment: state.company.date_of_establishment || null,
              },
            })
          );
        } catch {
          /* ignore quota errors etc. */
        }
      } else {
        // No company passed via nav state — fall back to whatever was
        // last saved to the draft for this company id, if anything.
        restoreFormDraft(formKey);
      }
    } else {
      const returningFromBankDetails = !!(location.state as any)?.bankAccountsUpdated;
      const oldDraftId = sessionStorage.getItem("new_company_draft_id");

      if (returningFromBankDetails && oldDraftId) {
        const formKey = `company_form_draft_new_${oldDraftId}`;
        setFormDraftKey(formKey);
        restoreFormDraft(formKey);
        return;
      }

      // Fresh "New Company" visit — clear any stale draft and start over.
      const oldDraftIdToClear = sessionStorage.getItem("new_company_draft_id");
      if (oldDraftIdToClear) {
        localStorage.removeItem(`company_form_draft_new_${oldDraftIdToClear}`);
      }

      const draftId = `tmp-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      sessionStorage.setItem("new_company_draft_id", draftId);

      const formKey = `company_form_draft_new_${draftId}`;
      setFormDraftKey(formKey);

      setFormData(defaultFormData());
      setBankAccounts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode]);

  // ─── pick up bank accounts handed back from the Bank Details sub-flow ───
  useEffect(() => {
    const state = location.state as { bankAccountsUpdated?: boolean; updatedAccounts?: any[] } | undefined;
    if (!state?.bankAccountsUpdated) return;

    if (Array.isArray(state.updatedAccounts) && state.updatedAccounts.length > 0) {
      setBankAccounts((prev) => {
        const merged = [...prev];
        let primaryKeepIdx: number | null = null;

        state.updatedAccounts!.forEach((row) => {
          const existingIdx =
            row.recordId != null
              ? merged.findIndex((a) => a.recordId === row.recordId)
              : merged.findIndex((a) => a._key === row._key);

          let idx: number;
          if (existingIdx >= 0) {
            merged[existingIdx] = row;
            idx = existingIdx;
          } else {
            merged.push(row);
            idx = merged.length - 1;
          }

          if (row.is_primary) primaryKeepIdx = idx;
        });

        if (primaryKeepIdx === null) return merged;
        const keepIdx: number = primaryKeepIdx;
        return merged.map((acc, i) => (i !== keepIdx && acc.is_primary ? { ...acc, is_primary: false } : acc));
      });
    }

    // Clear the flag so navigating away and back doesn't re-trigger this.
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const restoreFormDraft = (formKey: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem(formKey) || "null");
      if (stored?.formData) {
        setFormData((prev) => ({
          ...prev,
          ...stored.formData,
          date_of_establishment: stored.formData.date_of_establishment
            ? new Date(stored.formData.date_of_establishment)
            : null,
        }));
      }
    } catch {
      /* ignore */
    }
  };

  const persistFormDraft = () => {
    if (!formDraftKey) return;
    try {
      localStorage.setItem(
        formDraftKey,
        JSON.stringify({
          formData: {
            ...formData,
            date_of_establishment: formData.date_of_establishment
              ? formatDateForApi(formData.date_of_establishment)
              : null,
          },
        })
      );
    } catch {
      /* ignore quota errors etc. */
    }
  };

  const loadCompanyIntoForm = (c: any) => {
    setFormData((prev) => ({
      ...prev,
      ...c,
      date_of_establishment: c.date_of_establishment ? new Date(c.date_of_establishment) : null,
    }));
    if (Array.isArray(c.bank_details)) {
      setBankAccounts(c.bank_details);
    }
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
    if (apiError) setApiError(null);
  };

  const handleDateChange = (field: keyof CompanyFormData, date: Date | null) => {
    setFormData((prev) => ({ ...prev, [field]: date }));
  };

  // ─── bank details sub-flow ─────────────────────────────────────────────

  const openBankDetails = () => {
    // Save what's on screen right now — navigating away unmounts this
    // component, so React state alone won't survive the round trip.
    persistFormDraft();

    navigate("/bank-details", {
      state: {
        embedContext: {
          returnPath: location.pathname,
          partyType: "Company",
          partyId: isEditMode && id ? id : "",
          companyId: isEditMode && id ? Number(id) : null,
          supplierName: formData.company || "New Company",
          // Always true: the company (and its bank accounts) is only
          // persisted when the Company form itself is submitted.
          isPendingSupplier: true,
          prefill: bankAccounts.length > 0 ? bankAccounts : undefined,
        },
      },
    });
  };

  const removeBankAccount = (idx: number) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== idx));
  };

  // ─── payload builder ────────────────────────────────────────────────────

  const buildBankDetailPayload = (account: Record<string, any>) => ({
    account_holder_name: (account.account_holder_name || "").trim(),
    account_type: account.account_type || "Savings",

    bank_name: (account.bank_name || "").trim(),
    branch_name: (account.branch_name || "").trim(),
    account_number: (account.account_number || "").trim(),
    ifsc_code: account.ifsc_code ? String(account.ifsc_code).trim().toUpperCase() : "",
    micr_code: account.micr_code ? String(account.micr_code).trim() : null,
    swift_code: account.swift_code ? String(account.swift_code).trim().toUpperCase() : null,
    iban: account.iban ? String(account.iban).trim().toUpperCase() : null,

    upi_id: account.upi_id || null,
    currency: account.currency || "INR",

    // Not yet collected in the Bank Account form — sent as null for now.
    address: null,
    city: null,
    district: null,
    state: null,
    country: null,
    pincode: null,

    cancelled_cheque: account.cancelled_cheque || null,
    passbook_copy: account.passbook_copy || null,

    verified: account.verified ? 1 : 0,
    verified_by: account.verified ? account.verified_by || "Administrator" : null,
    verified_on: account.verified ? account.verified_on || null : null,

    is_primary: account.is_primary ? 1 : 0,
    remarks: account.remarks || null,
  });

  const buildCompanyApiPayload = () => {
    const payload: any = {
      // Company Details
      company_name: formData.company.trim(),
      abbr: formData.abbr.trim(),
      default_currency: formData.default_currency.trim(),
      country: formData.country.trim(),
      default_holiday_list: formData.default_holiday_list || null,
      tax_id: formData.tax_id || null,
      domain: formData.domain || null,
      date_of_establishment: formData.date_of_establishment
        ? formatDateForApi(formData.date_of_establishment)
        : null,
      default_letter_head: formData.default_letter_head || null,
      default_gst_rate: formData.default_gst_rate,
      parent_company: formData.parent_company || null,
      is_group: formData.is_group ? 1 : 0,
      gstin_uin: formData.gstin_uin || null,
      gst_category: formData.gst_category,
      pan: formData.pan || null,
      registration_details: formData.registration_details || null,

      // Fields the backend expects but that don't have UI here yet.
      reporting_currency: formData.default_currency.trim() || null,
      company_logo: null,
      date_of_incorporation: null,
      phone_no: null,
      email: null,
      company_description: null,
      date_of_commencement: null,
      fax: null,
      website: null,

      modified_by: "Administrator",

      // Buying and Selling
      default_buying_terms: formData.default_buying_terms || null,
      default_selling_terms: formData.default_selling_terms || null,
      monthly_sales_target: formData.monthly_sales_target || 0,
      default_sales_contact: formData.default_sales_contact || null,
      default_warehouse_for_sales_return: formData.default_warehouse_for_sales_return || null,
      purchase_expense_account: formData.purchase_expense_account || null,
      purchase_expense_contra_account: formData.purchase_expense_contra_account || null,
      service_expense_account: formData.service_expense_account || null,

      // Stock and Manufacturing
      default_operating_cost_account: formData.default_operating_cost_account || null,
      default_work_in_progress_warehouse: formData.default_work_in_progress_warehouse || null,
      default_finished_goods_warehouse: formData.default_finished_goods_warehouse || null,
      default_scrap_warehouse: formData.default_scrap_warehouse || null,

      bank_details: bankAccounts.map(buildBankDetailPayload),
    };

    if (isEditMode && id) {
      payload.id = Number(id);
    }

    return payload;
  };

  // ─── submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      scrollToSection(allErrors[0].sectionKey);
      return;
    }

    setSaving(true);
    setApiError(null);

    const payload = buildCompanyApiPayload();

    try {
      if (isEditMode) {
        const response = await api.put("/company", payload, {
          headers: { "Content-Type": "application/json" },
        });
        if (response.data?.success !== undefined && response.data.success !== 1) {
          throw new Error(response.data?.message || "Failed to update company");
        }
        toast.success("Company updated successfully.");
      } else {
        const response = await api.post("/company", payload, {
          headers: { "Content-Type": "application/json" },
        });
        if (response.data?.success !== undefined && response.data.success !== 1) {
          throw new Error(response.data?.message || "Failed to create company");
        }
        toast.success("Company created successfully.");
      }

      if (formDraftKey) localStorage.removeItem(formDraftKey);
      if (!isEditMode) sessionStorage.removeItem("new_company_draft_id");

      navigate("/company");
    } catch (err: any) {
      console.error("Error saving company:", err);
      let message = "Failed to save company";
      if (err.response) {
        message = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        message = "Network error. Please check your connection.";
      } else if (err.message) {
        message = err.message;
      }
      setApiError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isEditMode && formDraftKey) {
      localStorage.removeItem(formDraftKey);
      sessionStorage.removeItem("new_company_draft_id");
    }
    navigate("/company");
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
          <button type="button" onClick={handleCancel} className="acf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="acf-title">
            {isEditMode ? "Edit Company" : "New Company"}
          </h1>

          {apiError && (
            <div className="acf-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </div>
          )}

          {hasAnyErrors && (
            <div className="acf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} missing field(s)
            </div>
          )}

          
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
                <div>
                  <label className="acf-label">Default Currency *</label>
                  <input
                    type="text" name="default_currency" value={formData.default_currency} onChange={handleInputChange}
                    placeholder="e.g. INR"
                    className={`acf-input ${errors.default_currency ? "acf-input-error" : ""}`}
                  />
                  {errors.default_currency && <span className="acf-error-text">{errors.default_currency}</span>}
                </div>
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

            {/* ── Bank Account (navigates out, returns via embedContext) ─ */}
            <div ref={setSectionRef("bank")} data-section-key="bank">
              <div className="acf-section-title">
                <FaUniversity size={12} /> Bank Account
              </div>

              {bankAccounts.length === 0 ? (
                <div className="acf-nav-card" onClick={openBankDetails}>
                  <div className="acf-nav-card-icon"><FaUniversity size={16} /></div>
                  <div className="acf-nav-card-text">
                    <div className="acf-nav-card-title">Manage Bank Account</div>
                    <div className="acf-nav-card-sub">
                      Add and edit the company's bank accounts used on invoices and payment vouchers.
                    </div>
                  </div>
                  <FaArrowRight size={13} className="acf-nav-card-arrow" />
                </div>
              ) : (
                <>
                  <div className="acf-bank-accounts-list">
                    {bankAccounts.map((acc, idx) => (
                      <div
                        key={acc._key || acc.recordId || idx}
                        className="acf-bank-account-card"
                        onClick={openBankDetails}
                      >
                        <div className="acf-bank-account-icon">
                          <FaUniversity size={15} />
                        </div>
                        <div className="acf-bank-account-info">
                          <div className="acf-bank-account-top">
                            <strong className="acf-bank-account-name">{acc.bank_name || "Bank account"}</strong>
                            <div className="acf-bank-account-badges">
                              {acc.is_primary && (
                                <span className="acf-bank-badge acf-bank-badge-primary">Primary</span>
                              )}
                              {acc.verified && (
                                <span className="acf-bank-badge acf-bank-badge-verified">
                                  <FaCheckCircle size={9} /> Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="acf-bank-account-details">
                            {acc.account_holder_name && <span>{acc.account_holder_name}</span>}
                            {acc.account_number && (
                              <span>•••• {String(acc.account_number).slice(-4)}</span>
                            )}
                            {acc.branch_name && <span>{acc.branch_name}</span>}
                            {acc.ifsc_code && <span>{acc.ifsc_code}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="acf-bank-remove-btn"
                          onClick={(e) => { e.stopPropagation(); removeBankAccount(idx); }}
                          title="Remove"
                        >
                          <FaTimesCircle size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button type="button" className="acf-add-bank-btn" onClick={openBankDetails}>
                    <FaUniversity size={11} /> Add Another Bank Account
                  </button>
                  <p className="acf-bank-hint">
                    <FaInfoCircle size={11} />
                    Bank account details are saved together when you submit this form.
                  </p>
                </>
              )}
            </div>

          </div>

          {/* Bottom actions (mirrors the header button for long pages) */}
          <div className="acf-footer-row">
            <button type="button" onClick={handleCancel} className="acf-btn-secondary">
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