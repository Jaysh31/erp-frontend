import React, { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaUser, FaBuilding, FaAddressBook,
} from "react-icons/fa";
import "./LeadForm.css";
import api from "../../src/services/api";

// ─── types ──────────────────────────────────────────────────────────────

type LeadStatus = "Lead" | "Contacted" | "Qualified" | "Unqualified" | "Converted";

interface LeadFormData {
  firstName: string;
  lastName: string;
  organizationName: string;
  jobTitle: string;
  status: LeadStatus;
  leadType: string;
  source: string;

  email: string;
  mobileNo: string;
  phone: string;
  website: string;

  industry: string;
  employees: string;
  annualRevenue: string;

  city: string;
  state: string;
  country: string;

  qualificationStatus: string;
  qualifiedBy: string;
  qualifiedOn: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
  tabIndex: number;
}

interface TabWarning {
  [key: number]: boolean;
}

const defaultFormData = (): LeadFormData => ({
  firstName: "",
  lastName: "",
  organizationName: "",
  jobTitle: "",

  status: "Lead",
  leadType: "",
  source: "",

  email: "",
  mobileNo: "",
  phone: "",
  website: "",

  industry: "",
  employees: "",
  annualRevenue: "",

  city: "",
  state: "",
  country: "",

  qualificationStatus: "Lead",
  qualifiedBy: "",
  qualifiedOn: "",
});

// ─── mapping: form <-> /lead API payload ───────────────────────────────

function buildApiPayload(formData: LeadFormData) {
  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ");

  return {
    naming_series: "LEAD-.YYYY.-",
    salutation: "",
    first_name: formData.firstName,
    middle_name: "",
    last_name: formData.lastName,
    lead_name: fullName,
    job_title: formData.jobTitle,
    gender: "",
    lead_owner: "Administrator",
    status: formData.status,
    customer: null,
    type: formData.leadType,
    request_type: formData.source,
    email_id: formData.email,
    website: formData.website,
    mobile_no: formData.mobileNo,
    whatsapp_no: formData.mobileNo,
    phone: formData.phone,
    phone_ext: "",
    company_name: formData.organizationName,
    no_of_employees: formData.employees ? parseInt(formData.employees.replace(/\D/g, ""), 10) || 0 : 0,
    annual_revenue: formData.annualRevenue ? Number(formData.annualRevenue) || 0 : 0,
    industry: formData.industry,
    market_segment: "",
    territory: formData.country,
    fax: "",
    city: formData.city,
    state: formData.state,
    country: formData.country,
    utm_source: formData.source,
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    qualification_status: formData.qualificationStatus,
    qualified_by: formData.qualifiedBy,
    qualified_on: formData.qualifiedOn || null,
    company: "My Company",
    language: "en",
    image: "",
    title: fullName ? `Lead for ${fullName}` : "New Lead",
    disabled: 0,
    unsubscribed: 0,
    blog_subscriber: 0,
    modified_by: "Administrator",
    owner: "Administrator",
    docstatus: 0,
    idx: 0,
  };
}

function mapApiLeadToForm(jc: any): LeadFormData {
  let firstName = jc.first_name || "";
  let lastName = jc.last_name || "";

  // Fallback: some responses (especially trimmed list-view records) only
  // include the combined `lead_name` and omit first_name/last_name. Split
  // it so the form isn't blank even when the detail fields are missing.
  if (!firstName && !lastName && jc.lead_name) {
    const parts = String(jc.lead_name).trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName = parts.slice(1).join(" ") || "";
  }

  return {
    firstName,
    lastName,
    organizationName: jc.company_name || "",
    jobTitle: jc.job_title || "",
    status: (jc.status as LeadStatus) || "Lead",
    leadType: jc.type || "",
    source: jc.utm_source || jc.request_type || "",
    email: jc.email_id || "",
    mobileNo: jc.mobile_no || "",
    phone: jc.phone || "",
    website: jc.website || "",
    industry: jc.industry || "",
    employees: jc.no_of_employees != null ? String(jc.no_of_employees) : "",
    annualRevenue: jc.annual_revenue != null ? String(jc.annual_revenue) : "",
    city: jc.city || "",
    state: jc.state || "",
    country: jc.country || "",
    qualificationStatus: jc.qualification_status || "Lead",
    qualifiedBy: jc.qualified_by || "",
    qualifiedOn: jc.qualified_on || "",
  };
}

function extractList(raw: any): any[] {
  const list = raw?.data?.records ?? raw?.data ?? raw?.leads ?? raw?.results ?? raw;
  return Array.isArray(list) ? list : [];
}

const LeadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = !!id && id !== "new";

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [warnings, setWarnings] = useState<TabWarning>({});
  const [saving, setSaving] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

 
  const [recordId, setRecordId] = useState<number | null>(null);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<LeadFormData>(defaultFormData());

  const tabs = [
    { id: 0, name: "Lead Details & Contact", icon: <FaUser size={14} /> },
    { id: 1, name: "Organization & Address", icon: <FaBuilding size={14} /> },
  ];

  // ─── load existing lead when editing ──────────────────────────────────
 
  useEffect(() => {
    if (!isEditMode || !id) return;

    setFormData(defaultFormData());
    setNotFound(false);
    setApiError(null);
    setRecordId(null);

    const state = location.state as { lead?: any } | null;
    if (state?.lead) {
      setFormData(mapApiLeadToForm(state.lead));
      if (state.lead.id != null) setRecordId(Number(state.lead.id));
    }

    fetchLeadById(id);
  }, [id]);

  const fetchLeadById = async (leadId: string) => {
    setLoadingRecord(true);
    setApiError(null);
    try {
      let found: any = null;

      
      try {
        const detailResp = await api.get(`/lead/${encodeURIComponent(leadId)}`);
        const detailData = detailResp.data?.data ?? detailResp.data;
        if (detailData && !Array.isArray(detailData)) {
          found = detailData;
        }
      } catch (detailErr) {
        // Detail endpoint may not exist on this backend — fall back below.
        console.log("Detail endpoint /lead/:id not available, falling back to list scan");
      }

      // Fallback: scan the list endpoint for a matching record.
      if (!found) {
        const response = await api.get("/lead");
        const all = extractList(response.data);
        found = all.find((l: any) => String(l.name ?? l.id) === leadId);
      }

      if (found) {
        console.log("Full lead record loaded for edit:", found);
        setFormData(mapApiLeadToForm(found));
        if (found.id != null) setRecordId(Number(found.id));
      } else if (!formData.organizationName) {
        // only flag not-found if we don't already have nav-state data shown
        setNotFound(true);
        setApiError("Lead not found");
      }
    } catch (err: any) {
      console.error("Error fetching lead:", err);
      if (err.response) {
        setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError(err.message || "Failed to load lead");
      }
    } finally {
      setLoadingRecord(false);
    }
  };

  // ─── validation ────────────────────────────────────────────────────────

  const getValidationErrors = (step: number): { [key: string]: string } => {
    const newErrors: { [key: string]: string } = {};
    if (step === 0) {
      if (!formData.firstName.trim()) newErrors.firstName = "First Name is required";
      if (!formData.organizationName.trim()) newErrors.organizationName = "Organization Name is required";
    }
    return newErrors;
  };

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    if (!formData.firstName.trim())
      allErrors.push({ field: "firstName", label: "First Name", message: "First Name is required", tabIndex: 0 });

    if (!formData.organizationName.trim())
      allErrors.push({ field: "organizationName", label: "Organization Name", message: "Organization Name is required", tabIndex: 0 });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      allErrors.push({ field: "email", label: "Email", message: "Enter a valid email address", tabIndex: 1 });

    return allErrors;
  };

  const getTabErrorCount = (tabId: number): number => {
    return getAllValidationErrors().filter((e) => e.tabIndex === tabId).length;
  };

  const jumpToTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowValidationSummary(false);
    setErrors({});
  };

  const checkTabWarnings = (step: number): boolean => {
    const stepErrors = getValidationErrors(step);
    const hasWarnings = Object.keys(stepErrors).length > 0;
    setWarnings((prev) => ({ ...prev, [step]: hasWarnings }));
    return hasWarnings;
  };

  const getTabStatus = (tabId: number) => {
    return warnings[tabId] ? "warning" : "ok";
  };

  const handleTabChange = (tabId: number) => {
    checkTabWarnings(tabId);
    setActiveTab(tabId);
    setErrors({});
    setShowValidationSummary(false);
  };

  const handleNext = () => {
    const nextTab = activeTab + 1;
    if (nextTab <= 1) {
      checkTabWarnings(nextTab);
      setActiveTab(nextTab);
      setErrors({});
      setShowValidationSummary(false);
    }
  };

  const handlePrevious = () => {
    setActiveTab(activeTab - 1);
    setErrors({});
    setShowValidationSummary(false);
  };

  // ─── field handlers ────────────────────────────────────────────────────

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    checkTabWarnings(activeTab);
  };

  // ─── submit — POST on create, PUT on edit ──────────────────────────────
 
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);
      return;
    }

    setSaving(true);
    setApiError(null);

    try {
      const payload = buildApiPayload(formData);

      let response;
      if (isEditMode && id) {
        const identifier = recordId ?? id;
        response = await api.put("/lead", { id: identifier, ...payload });
      } else {
        response = await api.post("/lead", payload);
      }

      if (response.data?.success !== undefined && response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to save lead");
      }

      navigate("/lead");
    } catch (err: any) {
      console.error("Error saving lead:", err);
      if (err.response) {
        setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError(err.message || "Failed to save lead");
      }
    } finally {
      setSaving(false);
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  return (
    <div className="jcf-page">

      {/* Validation Summary Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="jcf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="jcf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="jcf-modal-header jcf-modal-header-warning">
              <h2 className="jcf-modal-title-warning">
                <FaExclamationTriangle /> Missing Required Fields
              </h2>
              <button className="jcf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="jcf-modal-body">
              <p className="jcf-modal-intro">
                Please fill in the following required fields before submitting:
              </p>
              <div className="jcf-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="jcf-validation-error-item" onClick={() => jumpToTab(error.tabIndex)}>
                    <div className="jcf-error-header">
                      <FaTimesCircle className="jcf-error-icon" />
                      <strong className="jcf-error-label">{error.label}</strong>
                      <span className="jcf-error-tab">
                        Tab {error.tabIndex + 1}: {tabs[error.tabIndex].name}
                      </span>
                    </div>
                    <div className="jcf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="jcf-hint-banner">
                <FaInfoCircle className="jcf-hint-icon" />
                Click on any error to jump to that section
              </div>
            </div>
            <div className="jcf-modal-footer">
              <button className="jcf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="jcf-header-wrap">
        <div className="jcf-header-row">
          <button type="button" onClick={() => navigate("/lead")} className="jcf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="jcf-title">
            {isEditMode ? "Edit Lead" : "New Lead"}
          </h1>

          {apiError && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </div>
          )}

          {hasAnyErrors && (
            <div className="jcf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} missing field(s)
            </div>
          )}
        </div>
      </div>

      <div className="jcf-container">
        {loadingRecord && !formData.organizationName ? (
          <div className="jcf-card" style={{ textAlign: "center", padding: "40px" }}>
            <FaSpinner className="jcf-spinning" /> Loading lead...
          </div>
        ) : notFound ? (
          <div className="jcf-card" style={{ textAlign: "center", padding: "40px" }}>
            <FaExclamationTriangle style={{ marginBottom: 8 }} />
            <p>Lead not found.</p>
            <button type="button" className="jcf-btn-secondary" onClick={() => navigate("/lead")}>Back to Leads</button>
          </div>
        ) : (
        <form onSubmit={handleSubmit}>

          {/* Tabs */}
          <div className="jcf-tabs-wrap">
            <div className="jcf-tabs-row">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const tabStatus = getTabStatus(tab.id);
                const errorCount = getTabErrorCount(tab.id);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`jcf-tab-btn ${isActive ? "jcf-tab-btn-active" : ""}`}
                  >
                    <div
                      className={`jcf-tab-circle ${isActive ? "jcf-tab-circle-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-circle-warning" : ""
                        }`}
                    >
                      {tabStatus === "warning" && !isActive ? <FaExclamationTriangle size={14} /> : tab.id + 1}

                      {errorCount > 0 && !isActive && (
                        <div className="jcf-tab-error-badge">{errorCount}</div>
                      )}
                    </div>

                    <div className="jcf-tab-label-wrap">
                      <div className={`jcf-tab-step ${isActive ? "jcf-tab-step-active" : ""} ${tabStatus === "warning" && !isActive ? "jcf-tab-step-warning" : ""
                        }`}>
                        Step {tab.id + 1}
                      </div>
                      <div className={`jcf-tab-name ${isActive ? "jcf-tab-name-active" : ""}`}>
                        {tab.name}
                      </div>
                    </div>

                    {isActive && <div className="jcf-tab-underline" />}
                  </button>
                );
              })}
            </div>
          </div>

          {warnings[activeTab] && (
            <div className="jcf-tab-warning-banner">
              <FaExclamationTriangle size={12} />
              <span>This tab has incomplete or missing information. You can proceed but please review before submitting.</span>
            </div>
          )}

          <div>

            {/* Tab 0 — Lead Details */}
            {activeTab === 0 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-section-title jcf-section-title-first"><FaUser size={12} /> Basic Info</div>

                  <div className="jcf-grid-3">
                    <div>
                      <label className="jcf-label">First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="e.g. John"
                        className={`jcf-input ${errors.firstName ? "jcf-input-error" : ""}`}
                      />
                      {errors.firstName && <span className="jcf-error-text">{errors.firstName}</span>}
                    </div>
                    <div>
                      <label className="jcf-label">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="e.g. Doe"
                        className="jcf-input"
                      />
                    </div>
                    <div>
                      <label className="jcf-label">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleInputChange}
                        placeholder="e.g. Purchase Manager"
                        className="jcf-input"
                      />
                    </div>
                  </div>

                  <div className="jcf-section-title"><FaBuilding size={12} /> Organization</div>

                  <div className="jcf-grid-3">
                    <div>
                      <label className="jcf-label">Organization Name *</label>
                      <input
                        type="text"
                        name="organizationName"
                        value={formData.organizationName}
                        onChange={handleInputChange}
                        placeholder="e.g. Acme Manufacturing"
                        className={`jcf-input ${errors.organizationName ? "jcf-input-error" : ""}`}
                      />
                      {errors.organizationName && <span className="jcf-error-text">{errors.organizationName}</span>}
                    </div>
                    <div>
                      <label className="jcf-label">Status *</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >
                        <option value="Lead">Lead</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Unqualified">Unqualified</option>
                        <option value="Converted">Converted</option>
                      </select>
                    </div>

                  </div>


                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Lead Type</label>
                      <select
                        name="leadType"
                        value={formData.leadType}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >
                        <option value="">Select Lead Type</option>
                        <option value="Customer">Customer</option>
                        <option value="Partner">Partner</option>
                        <option value="Reseller">Reseller</option>
                        <option value="Consultant">Consultant</option>
                        <option value="Investor">Investor</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="jcf-label">Source</label>
                      <select
                        name="source"
                        value={formData.source}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >
                        <option value="">Select Source</option>
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Email Campaign">Email Campaign</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Trade Show">Trade Show</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Tab 1 — Contact Info */}
            {activeTab === 1 && (
              <div className="jcf-fade-in">
                <div className="jcf-card">
                  <div className="jcf-section-title jcf-section-title-first"><FaAddressBook size={12} /> Contact Info</div>

                  <div className="jcf-grid-2">
                    <div>
                      <label className="jcf-label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@example.com"
                        className={`jcf-input ${errors.email ? "jcf-input-error" : ""}`}
                      />
                      {errors.email && <span className="jcf-error-text">{errors.email}</span>}
                    </div>
                    <div>
                      <label className="jcf-label">Mobile No</label>
                      <input
                        type="text"
                        name="mobileNo"
                        value={formData.mobileNo}
                        onChange={handleInputChange}
                        placeholder="e.g. +91 98765 43210"
                        className="jcf-input"
                      />
                    </div>
                    <div className="jcf-grid-2">

                      <div>
                        <label className="jcf-label">Phone</label>

                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="jcf-input"
                        />

                      </div>

                      <div>

                        <label className="jcf-label">Website</label>

                        <input
                          type="text"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="jcf-input"
                        />

                      </div>

                    </div>
                  </div>
                  <div className="jcf-section-title">
                    <FaBuilding size={12} />
                    Organization
                  </div>

                  <div className="jcf-grid-3">

                    <div>

                      <label className="jcf-label">
                        Industry
                      </label>

                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >

                        <option value="">Select</option>

                        <option>IT</option>
                        <option>Healthcare</option>
                        <option>Manufacturing</option>
                        <option>Education</option>
                        <option>Finance</option>
                        <option>Retail</option>
                        <option>Construction</option>
                        <option>Real Estate</option>
                        <option>Hospitality</option>
                        <option>Other</option>

                      </select>

                    </div>

                    <div>

                      <label className="jcf-label">
                        No. of Employees
                      </label>

                      <select
                        name="employees"
                        value={formData.employees}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >

                        <option value="">Select</option>

                        <option>1-10</option>
                        <option>11-50</option>
                        <option>51-200</option>
                        <option>201-500</option>
                        <option>501-1000</option>
                        <option>1000+</option>

                      </select>

                    </div>

                    <div>

                      <label className="jcf-label">
                        Annual Revenue
                      </label>

                      <input
                        name="annualRevenue"
                        value={formData.annualRevenue}
                        onChange={handleInputChange}
                        className="jcf-input"
                      />

                    </div>

                  </div>
                  <div className="jcf-section-title">Address</div>

                  <div className="jcf-grid-3">
                    <div>
                      <label className="jcf-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="e.g. Mumbai"
                        className="jcf-input"
                      />
                    </div>
                    <div>

                      <label className="jcf-label">
                        State
                      </label>

                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="jcf-input"
                      />

                    </div>
                    <div>
                      <label className="jcf-label">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="e.g. India"
                        className="jcf-input"
                      />
                    </div>
                  </div>
                  <div className="jcf-section-title">
                    Qualification
                  </div>

                  <div className="jcf-grid-3">

                    <div>

                      <label className="jcf-label">
                        Qualification Status
                      </label>

                      <select
                        name="qualificationStatus"
                        value={formData.qualificationStatus}
                        onChange={handleInputChange}
                        className="jcf-input"
                      >

                        <option>Lead</option>
                        <option>Contacted</option>
                        <option>Qualified</option>
                        <option>Unqualified</option>
                        <option>Converted</option>

                      </select>

                    </div>

                    <div>

                      <label className="jcf-label">
                        Qualified By
                      </label>

                      <input
                        name="qualifiedBy"
                        value={formData.qualifiedBy}
                        onChange={handleInputChange}
                        className="jcf-input"
                      />

                    </div>

                    <div>

                      <label className="jcf-label">
                        Qualified On
                      </label>

                      <input
                        type="date"
                        name="qualifiedOn"
                        value={formData.qualifiedOn}
                        onChange={handleInputChange}
                        className="jcf-input"
                      />

                    </div>

                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="jcf-footer-row">
            {activeTab > 0 && (
              <button type="button" onClick={handlePrevious} className="jcf-btn-secondary">
                ← Previous
              </button>
            )}
            {activeTab < 1 && (
              <button type="button" onClick={handleNext} className="jcf-btn-primary">
                Next →
              </button>
            )}
            {activeTab === 1 && (
              <button type="submit" disabled={saving} className="jcf-btn-primary jcf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
                {saving && <FaSpinner className="jcf-spinning" />}
                <FaSave /> {isEditMode ? "Update Lead" : "Create Lead"}
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default LeadForm;