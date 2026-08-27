import React, { useState, useEffect, useCallback } from "react";
import type { ChangeEvent, FormEvent,  } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaFileAlt, FaImage, FaCode, FaEye, FaEyeSlash,
  FaAlignLeft, FaAlignCenter, FaAlignRight, FaLayerGroup,
  FaPhone, FaGlobe, FaEnvelope, FaMapMarkerAlt,
} from "react-icons/fa";
import "./AddLetterHeadForm.css";
import { useAdminTheme } from "../admin-theme/AdminThemeContext";

// ─── types ────────────────────────────────────────────────────────────────

type LetterHeadBasis = "Image" | "HTML";
type FooterBasis = "HTML" | "Image" | "Text";
type AlignOption = "Left" | "Center" | "Right";
type HeaderLayout = "split" | "centered" | "minimal";
type FooterStyle = "band" | "rule" | "none";

interface LetterHeadFormData {
  letter_head_name: string;
  disabled: boolean;
  is_default: boolean;
  letter_head_based_on: LetterHeadBasis;
  footer_based_on: FooterBasis;
  // image tab
  image_url: string;
  image_height: number | "";
  image_width: number | "";
  align: AlignOption;
  // html tab
  letter_head_html: string;
  // footer
  footer_html: string;
  footer_image_url: string;
  footer_image_height: number | "";
  footer_image_width: number | "";
  footer_align: AlignOption;
  // design params (for built-in preview generation)
  accent_color: string;
  header_layout: HeaderLayout;
  footer_style: FooterStyle;
  company_initials: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  gst: string;
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

// ─── localStorage helpers ──────────────────────────────────────────────────

const LS_KEY = "letterHeads";

export interface LetterHeadRecord {
  id: string;          // same as letter_head_name — used as PK
  isDefault: boolean;
  disabled: boolean;
  createdOn: string;   // relative label, e.g. "just now"
  createdAt: number;   // timestamp for sorting
  formData: LetterHeadFormData;
}

function loadLetterHeads(): LetterHeadRecord[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLetterHead(record: LetterHeadRecord): void {
  const existing = loadLetterHeads();
  const idx = existing.findIndex((r) => r.id === record.id);
  if (idx !== -1) {
    existing[idx] = record;
  } else {
    existing.unshift(record);
  }
  localStorage.setItem(LS_KEY, JSON.stringify(existing));
}

// ─── helpers ──────────────────────────────────────────────────────────────

const ALIGN_OPTIONS: AlignOption[] = ["Left", "Center", "Right"];
const LETTER_HEAD_BASIS_OPTIONS: LetterHeadBasis[] = ["Image", "HTML"];
const FOOTER_BASIS_OPTIONS: FooterBasis[] = ["HTML", "Image", "Text"];

const defaultFormData = (): LetterHeadFormData => ({
  letter_head_name: "",
  disabled: false,
  is_default: false,
  letter_head_based_on: "Image",
  footer_based_on: "HTML",
  image_url: "",
  image_height: "",
  image_width: "",
  align: "Left",
  letter_head_html: "",
  footer_html: "",
  footer_image_url: "",
  footer_image_height: "",
  footer_image_width: "",
  footer_align: "Left",
  accent_color: "#1d4ed8",
  header_layout: "split",
  footer_style: "band",
  company_initials: "",
  tagline: "Built to last",
  phone: "+91 98765 43210",
  email: "info@company.com",
  website: "www.company.com",
  address: "123, Business Park, Mumbai — 400001",
  gst: "27AABCU9603R1ZX",
});

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}
function lighten(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amt));
  return "#" + [mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function darken(hex: string, amt: number): string {
  const { r, g, b } = hexToRgb(hex);
  const mix = (c: number) => Math.max(0, Math.round(c * (1 - amt)));
  return "#" + [mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase() || "?";
}

// ─── Preview component ────────────────────────────────────────────────────

const LetterHeadPreview: React.FC<{ data: LetterHeadFormData; previewDate: string; formatDate: (iso: string) => string }> = ({ data, previewDate, formatDate }) => {
  const name = data.letter_head_name || "Company Name";
  const tag = data.tagline || "Your tagline here";
  const init = data.company_initials || initials(name);
  const c = data.accent_color || "#1d4ed8";
  const light = lighten(c, 0.88);
  const dark = darken(c, 0.2);

  // ── header variants ───────────────────────────────────────────
  const renderHeader = () => {
    if (data.letter_head_based_on === "HTML" && data.letter_head_html) {
      return (
        <div
          className="alhf-paper-hdr-html"
          dangerouslySetInnerHTML={{ __html: data.letter_head_html }}
        />
      );
    }
    if (data.letter_head_based_on === "Image" && data.image_url) {
      return (
        <div
          className="alhf-paper-hdr-img"
          style={{ textAlign: data.align.toLowerCase() as "left" | "center" | "right" }}
        >
          <img
            src={data.image_url}
            alt="header"
            style={{
              height: data.image_height ? `${data.image_height}px` : "auto",
              width: data.image_width ? `${data.image_width}px` : "auto",
              maxWidth: "100%",
            }}
          />
        </div>
      );
    }

    // generated preview
    if (data.header_layout === "split") {
      return (
        <>
          <div className="alhf-hdr-band" style={{ background: light }}>
            <div className="alhf-hdr-logo-box" style={{ background: c }}>
              <div className="alhf-hdr-logo-inner" style={{ background: dark, color: "#fff" }}>
                {init}
              </div>
            </div>
            <div className="alhf-hdr-info">
              <div className="alhf-hdr-company" style={{ color: dark }}>{name}</div>
              <div className="alhf-hdr-tagline" style={{ color: c }}>{tag}</div>
            </div>
            <div className="alhf-hdr-contact" style={{ color: dark }}>
              <span><FaPhone size={8} /> {data.phone}</span>
              <span><FaGlobe size={8} /> {data.website}</span>
              <span><FaEnvelope size={8} /> {data.email}</span>
            </div>
          </div>
          <div className="alhf-hdr-slogan-bar" style={{ background: c }}>
            <span className="alhf-hdr-slogan-text">{tag}</span>
          </div>
        </>
      );
    }

    if (data.header_layout === "centered") {
      return (
        <>
          <div className="alhf-hdr-center-top" style={{ background: c }}>
            <div className="alhf-hdr-logo-inner alhf-hdr-logo-center" style={{ background: dark, color: "#fff" }}>
              {init}
            </div>
            <div className="alhf-hdr-company-center">{name}</div>
            <div className="alhf-hdr-tagline-center">{tag}</div>
          </div>
          <div className="alhf-hdr-center-contact" style={{ background: light, color: dark }}>
            <span><FaPhone size={7} /> {data.phone}</span>
            <span><FaGlobe size={7} /> {data.website}</span>
            <span><FaEnvelope size={7} /> {data.email}</span>
            <span><FaMapMarkerAlt size={7} /> {data.address}</span>
          </div>
        </>
      );
    }

    // minimal
    return (
      <div className="alhf-hdr-minimal" style={{ borderBottomColor: c }}>
        <div>
          <div className="alhf-hdr-company" style={{ color: dark }}>{name}</div>
          <div className="alhf-hdr-tagline" style={{ color: c }}>{tag}</div>
        </div>
        <div className="alhf-hdr-contact" style={{ color: "#666" }}>
          <span><FaPhone size={8} /> {data.phone}</span>
          <span><FaEnvelope size={8} /> {data.email}</span>
        </div>
      </div>
    );
  };

  // ── footer variants ───────────────────────────────────────────
  const renderFooter = () => {
    if (data.footer_based_on === "HTML" && data.footer_html) {
      return (
        <div
          className="alhf-paper-ftr-html"
          dangerouslySetInnerHTML={{ __html: data.footer_html }}
        />
      );
    }
    if (data.footer_based_on === "Image" && data.footer_image_url) {
      return (
        <div
          className="alhf-paper-ftr-img"
          style={{ textAlign: data.footer_align.toLowerCase() as "left" | "center" | "right" }}
        >
          <img src={data.footer_image_url} alt="footer"
            style={{
              height: data.footer_image_height ? `${data.footer_image_height}px` : "auto",
              width: data.footer_image_width ? `${data.footer_image_width}px` : "auto",
              maxWidth: "100%",
            }}
          />
        </div>
      );
    }
    if (data.footer_style === "band") {
      return (
        <div className="alhf-ftr-band" style={{ background: c }}>
          <span>{name}</span>
          <span className="alhf-ftr-mid">{data.address}</span>
          <span>GST: {data.gst}</span>
        </div>
      );
    }
    if (data.footer_style === "rule") {
      return (
        <div className="alhf-ftr-rule" style={{ borderTopColor: c }}>
          <span>{name} | {data.address}</span>
          <span>{data.email} | GST: {data.gst}</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="alhf-paper">
      <div className="alhf-paper-header">{renderHeader()}</div>
      <div className="alhf-paper-body">
        <p className="alhf-paper-date">Date: {formatDate(previewDate)}</p>
        <p className="alhf-paper-ref">Ref. No.: {name.replace(/\s+/g, "-").toUpperCase()}/2026/001</p>
        <p className="alhf-paper-para">To,<br />The Manager,<br />Accounts &amp; Finance Department</p>
        <p className="alhf-paper-para">Subject: <strong>Use of Official Letter Head — {name}</strong></p>
        <p className="alhf-paper-para">Dear Sir / Madam,</p>
        <p className="alhf-paper-para">
          This is to confirm that this document has been prepared on the official letter head of{" "}
          <strong>{name}</strong>. All correspondence, purchase orders, quotations, and formal
          communications issued by this organisation shall bear this letter head along with the
          authorised signatory's signature and company seal wherever applicable.
        </p>
        <p className="alhf-paper-para">
          Kindly ensure that any outgoing documents referencing this letter head are routed
          through the appropriate department head for review and approval prior to dispatch.
          Unauthorised reproduction or misuse of this letter head is strictly prohibited and
          may attract disciplinary action under company policy.
        </p>
        <p className="alhf-paper-para">
          For queries regarding the usage or printing specifications of this letter head, please
          contact the Administration department at <em>{data.email}</em> or reach us at{" "}
          <em>{data.phone}</em>.
        </p>
        <p className="alhf-paper-para">Thanking you,<br />Yours faithfully,</p>
        <div className="alhf-paper-sig">
          <div className="alhf-sig-line" />
          <p className="alhf-sig-name">{name}</p>
          <p className="alhf-sig-role">Authorized Signatory</p>
          {data.gst && <p className="alhf-sig-gst">GSTIN: {data.gst}</p>}
        </div>
      </div>
      <div className="alhf-paper-footer">{renderFooter()}</div>
      <div className="alhf-paper-pgnum">Page 1 of 1</div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

const AddLetterHeadForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAdminTheme();

  // "new" is the route for a blank form; anything else is an edit/view by name
  const isEditMode = !!id && id !== "new";

  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [warnings, setWarnings] = useState<TabWarning>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<LetterHeadFormData>(defaultFormData());

  // preview date — defaults to today, user can override from the preview panel
  const todayISO = new Date().toISOString().split("T")[0];
  const [previewDate, setPreviewDate] = useState<string>(todayISO);

  const formatPreviewDate = (iso: string): string => {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    const months = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  const tabs = [
    { id: 0, name: "Details", icon: <FaFileAlt size={14} /> },
    { id: 1, name: "Letter Head", icon: <FaImage size={14} /> },
    { id: 2, name: "Footer", icon: <FaLayerGroup size={14} /> },
    { id: 3, name: "Design", icon: <FaCode size={14} /> },
  ];

  // ─── load existing record on edit ──────────────────────────────────────

  useEffect(() => {
    if (!isEditMode) return;

    // 1) prefer router state (fast path — list passes it)
    const state = location.state as { letterHead?: LetterHeadRecord } | null;
    if (state?.letterHead?.formData) {
      setFormData({ ...defaultFormData(), ...state.letterHead.formData });
      return;
    }

    // 2) fallback: look up by id in localStorage
    const decodedId = decodeURIComponent(id!);
    const records = loadLetterHeads();
    const found = records.find((r) => r.id === decodedId);
    if (found?.formData) {
      setFormData({ ...defaultFormData(), ...found.formData });
    }
  }, [id]);

  // ─── validation ────────────────────────────────────────────────────────

  const getValidationErrors = (step: number): { [key: string]: string } => {
    const e: { [key: string]: string } = {};
    if (step === 0 && !formData.letter_head_name.trim())
      e.letter_head_name = "Letter Head Name is required";
    return e;
  };

  const getAllValidationErrors = useCallback((): ValidationError[] => {
    const all: ValidationError[] = [];
    if (!formData.letter_head_name.trim())
      all.push({ field: "letter_head_name", label: "Letter Head Name", message: "Letter Head Name is required", tabIndex: 0 });
    return all;
  }, [formData.letter_head_name]);

  const getTabErrorCount = (tabId: number) =>
    getAllValidationErrors().filter((e) => e.tabIndex === tabId).length;

  const jumpToTab = (tabIndex: number) => {
    setActiveTab(tabIndex);
    setShowValidationSummary(false);
    setErrors({});
  };

  const checkTabWarnings = (step: number) => {
    const hasWarnings = Object.keys(getValidationErrors(step)).length > 0;
    setWarnings((prev) => ({ ...prev, [step]: hasWarnings }));
    return hasWarnings;
  };

  const getTabStatus = (tabId: number) => (warnings[tabId] ? "warning" : "ok");

  const handleTabChange = (tabId: number) => {
    checkTabWarnings(tabId);
    setActiveTab(tabId);
    setErrors({});
    setShowValidationSummary(false);
  };

  const handleNext = () => {
    const next = activeTab + 1;
    if (next <= 3) { checkTabWarnings(next); setActiveTab(next); setErrors({}); setShowValidationSummary(false); }
  };

  const handlePrevious = () => { setActiveTab(activeTab - 1); setErrors({}); setShowValidationSummary(false); };

  // ─── field handlers ────────────────────────────────────────────────────

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let v: string | number | boolean | "" = value;
    if (type === "number") v = value === "" ? "" : parseFloat(value) || 0;
    if (type === "checkbox") v = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: v }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    checkTabWarnings(activeTab);
  };

  const setAlign = (field: "align" | "footer_align", value: AlignOption) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const setEnumField = <K extends keyof LetterHeadFormData>(field: K, value: LetterHeadFormData[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ─── submit ────────────────────────────────────────────────────────────

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) { setValidationErrors(allErrors); setShowValidationSummary(true); return; }

    setSaving(true);

    // Build and persist the record
    const existingRecords = loadLetterHeads();
    const existing = existingRecords.find((r) => r.id === formData.letter_head_name);

    const record: LetterHeadRecord = {
      id: formData.letter_head_name,
      isDefault: formData.is_default,
      disabled: formData.disabled,
      createdOn: existing?.createdOn ?? "just now",
      createdAt: existing?.createdAt ?? Date.now(),
      formData: { ...formData },
    };

    saveLetterHead(record);

    // If this was set as default, clear default flag on all others
    if (formData.is_default) {
      const all = loadLetterHeads().map((r) =>
        r.id !== record.id ? { ...r, isDefault: false, formData: { ...r.formData, is_default: false } } : r
      );
      localStorage.setItem(LS_KEY, JSON.stringify(all));
    }

    setTimeout(() => {
      setSaving(false);
      navigate("/letter-head");
    }, 400);
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = allValidationErrors.length > 0;

  // ─── layout helpers ────────────────────────────────────────────────────

  const HeaderLayoutBtn = ({ v, label }: { v: HeaderLayout; label: string }) => (
    <button
      type="button"
      onClick={() => setEnumField("header_layout", v)}
      className={`alhf-layout-btn ${formData.header_layout === v ? "alhf-layout-btn-active" : ""}`}
    >{label}</button>
  );

  const FooterStyleBtn = ({ v, label }: { v: FooterStyle; label: string }) => (
    <button
      type="button"
      onClick={() => setEnumField("footer_style", v)}
      className={`alhf-layout-btn ${formData.footer_style === v ? "alhf-layout-btn-active" : ""}`}
    >{label}</button>
  );

  return (
    <div className={`alhf-page ${theme}`}>

      {/* Validation Modal */}
      {showValidationSummary && validationErrors.length > 0 && (
        <div className="alhf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="alhf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="alhf-modal-header alhf-modal-header-warning">
              <h2 className="alhf-modal-title-warning"><FaExclamationTriangle /> Missing Required Fields</h2>
              <button className="alhf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="alhf-modal-body">
              <p className="alhf-modal-intro">Please fill in the following required fields before submitting:</p>
              <div className="alhf-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="alhf-validation-error-item" onClick={() => jumpToTab(error.tabIndex)}>
                    <div className="alhf-error-header">
                      <FaTimesCircle className="alhf-error-icon" />
                      <strong className="alhf-error-label">{error.label}</strong>
                      <span className="alhf-error-tab">Tab {error.tabIndex + 1}: {tabs[error.tabIndex].name}</span>
                    </div>
                    <div className="alhf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="alhf-hint-banner"><FaInfoCircle className="alhf-hint-icon" /> Click on any error to jump to that section</div>
            </div>
            <div className="alhf-modal-footer">
              <button className="alhf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="alhf-header-wrap">
        <div className="alhf-header-row">
          <button type="button" onClick={() => navigate("/letter-head")} className="alhf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="alhf-title">{isEditMode ? "Edit Letter Head" : "New Letter Head"}</h1>
          {hasAnyErrors && (
            <div className="alhf-error-pill"><FaExclamationTriangle size={11} />{allValidationErrors.length} missing field(s)</div>
          )}
          <button type="button" className={`alhf-preview-toggle ${showPreview ? "alhf-preview-toggle-active" : ""}`} onClick={() => setShowPreview((v) => !v)}>
            {showPreview ? <FaEyeSlash size={12} /> : <FaEye size={12} />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>
        </div>
      </div>

      {/* Workspace */}
      <div className={`alhf-workspace ${showPreview ? "alhf-workspace-split" : ""}`}>

        {/* Form */}
        <div className="alhf-form-area">
          <form onSubmit={handleSubmit}>
            {/* Tabs */}
            <div className="alhf-tabs-wrap">
              <div className="alhf-tabs-row">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const tabStatus = getTabStatus(tab.id);
                  const errorCount = getTabErrorCount(tab.id);
                  return (
                    <button key={tab.id} type="button" onClick={() => handleTabChange(tab.id)}
                      className={`alhf-tab-btn ${isActive ? "alhf-tab-btn-active" : ""}`}>
                      <div className={`alhf-tab-circle ${isActive ? "alhf-tab-circle-active" : ""} ${tabStatus === "warning" && !isActive ? "alhf-tab-circle-warning" : ""}`}>
                        {tabStatus === "warning" && !isActive ? <FaExclamationTriangle size={14} /> : tab.id + 1}
                        {errorCount > 0 && !isActive && <div className="alhf-tab-error-badge">{errorCount}</div>}
                      </div>
                      <div className="alhf-tab-label-wrap">
                        <div className={`alhf-tab-step ${isActive ? "alhf-tab-step-active" : ""} ${tabStatus === "warning" && !isActive ? "alhf-tab-step-warning" : ""}`}>Step {tab.id + 1}</div>
                        <div className={`alhf-tab-name ${isActive ? "alhf-tab-name-active" : ""}`}>{tab.name}</div>
                      </div>
                      {isActive && <div className="alhf-tab-underline" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {warnings[activeTab] && (
              <div className="alhf-tab-warning-banner">
                <FaExclamationTriangle size={12} />
                <span>This tab has incomplete or missing information.</span>
              </div>
            )}

            {/* Tab 0 — Details */}
            {activeTab === 0 && (
              <div className="alhf-fade-in">
                <div className="alhf-card">
                  <div className="alhf-section-title alhf-section-title-first"><FaFileAlt size={12} /> Basic Details</div>
                  <div className="alhf-grid-2">
                    <div>
                      <label className="alhf-label">Letter Head Name *</label>
                      <input type="text" name="letter_head_name" value={formData.letter_head_name} onChange={handleInputChange}
                        placeholder="e.g. Company Letterhead - Grey"
                        className={`alhf-input ${errors.letter_head_name ? "alhf-input-error" : ""}`} />
                      {errors.letter_head_name && <span className="alhf-error-text">{errors.letter_head_name}</span>}
                    </div>
                    <div className="alhf-checkbox-col">
                      <label className="alhf-checkbox-label">
                        <input type="checkbox" name="disabled" checked={formData.disabled} onChange={handleInputChange} className="alhf-checkbox" />
                        Disabled
                      </label>
                      <label className="alhf-checkbox-label" style={{ marginTop: 12 }}>
                        <input type="checkbox" name="is_default" checked={formData.is_default} onChange={handleInputChange} className="alhf-checkbox" />
                        Default Letter Head
                      </label>
                    </div>
                  </div>
                  <div className="alhf-grid-2">
                    <div>
                      <label className="alhf-label">Letter Head Based On</label>
                      <select name="letter_head_based_on" value={formData.letter_head_based_on} onChange={handleInputChange} className="alhf-input">
                        {LETTER_HEAD_BASIS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <span className="alhf-field-note">Choose "Image" to upload a logo/banner, or "HTML" for a custom header.</span>
                    </div>
                    <div>
                      <label className="alhf-label">Footer Based On</label>
                      <select name="footer_based_on" value={formData.footer_based_on} onChange={handleInputChange} className="alhf-input">
                        {FOOTER_BASIS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1 — Letter Head */}
            {activeTab === 1 && (
              <div className="alhf-fade-in">
                <div className="alhf-card">
                  {formData.letter_head_based_on === "Image" ? (
                    <>
                      <div className="alhf-section-title alhf-section-title-first"><FaImage size={12} /> Letter Head Image</div>
                      <div className="alhf-field-block">
                        <label className="alhf-label">Image URL</label>
                        <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange}
                          placeholder="https://example.com/logo.png" className="alhf-input" />
                        <span className="alhf-field-note">Paste an image URL or file path.</span>
                      </div>
                      {formData.image_url && (
                        <div className="alhf-image-preview-wrap">
                          <img src={formData.image_url} alt="Preview" className="alhf-image-preview" />
                        </div>
                      )}
                      <div className="alhf-grid-2">
                        <div>
                          <label className="alhf-label">Image Height (px)</label>
                          <input type="number" name="image_height" value={formData.image_height} onChange={handleInputChange} placeholder="e.g. 80" className="alhf-input" />
                        </div>
                        <div>
                          <label className="alhf-label">Image Width (px)</label>
                          <input type="number" name="image_width" value={formData.image_width} onChange={handleInputChange} placeholder="e.g. 300" className="alhf-input" />
                        </div>
                      </div>
                      <div className="alhf-field-block">
                        <label className="alhf-label">Align</label>
                        <div className="alhf-align-group">
                          {ALIGN_OPTIONS.map((opt) => (
                            <button key={opt} type="button" onClick={() => setAlign("align", opt)}
                              className={`alhf-align-btn ${formData.align === opt ? "alhf-align-btn-active" : ""}`}>
                              {opt === "Left" && <FaAlignLeft size={13} />}
                              {opt === "Center" && <FaAlignCenter size={13} />}
                              {opt === "Right" && <FaAlignRight size={13} />}
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="alhf-section-title alhf-section-title-first"><FaCode size={12} /> Letter Head HTML</div>
                      <div className="alhf-field-block">
                        <label className="alhf-label">HTML Content</label>
                        <textarea name="letter_head_html" value={formData.letter_head_html} onChange={handleInputChange} rows={14}
                          placeholder={`<div style="display:flex; justify-content:space-between; align-items:center; padding:12px 0; border-bottom:2px solid #1d4ed8;">\n  <div>\n    <h2 style="margin:0; color:#1d4ed8;">Company Name</h2>\n    <p style="margin:0; color:#64748b;">Your Tagline</p>\n  </div>\n  <div style="text-align:right; font-size:12px; color:#64748b;">\n    <div>📞 123 456 789</div>\n    <div>🌐 www.website.com</div>\n  </div>\n</div>`}
                          className="alhf-input alhf-textarea alhf-code-area" />
                        <span className="alhf-field-note">Write custom HTML. Use inline styles for best print compatibility.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2 — Footer */}
            {activeTab === 2 && (
              <div className="alhf-fade-in">
                <div className="alhf-card">
                  {formData.footer_based_on === "HTML" && (
                    <>
                      <div className="alhf-section-title alhf-section-title-first"><FaCode size={12} /> Footer HTML</div>
                      <textarea name="footer_html" value={formData.footer_html} onChange={handleInputChange} rows={10}
                        placeholder={`<div style="border-top:2px solid #1d4ed8; padding:8px 0; text-align:center; font-size:11px; color:#64748b;">\n  Company Name | Address | Phone | www.website.com\n</div>`}
                        className="alhf-input alhf-textarea alhf-code-area" />
                      <span className="alhf-field-note">Write custom HTML for the footer.</span>
                    </>
                  )}
                  {formData.footer_based_on === "Image" && (
                    <>
                      <div className="alhf-section-title alhf-section-title-first"><FaImage size={12} /> Footer Image</div>
                      <div className="alhf-field-block">
                        <label className="alhf-label">Image URL</label>
                        <input type="text" name="footer_image_url" value={formData.footer_image_url} onChange={handleInputChange}
                          placeholder="https://example.com/footer.png" className="alhf-input" />
                      </div>
                      {formData.footer_image_url && (
                        <div className="alhf-image-preview-wrap">
                          <img src={formData.footer_image_url} alt="Footer preview" className="alhf-image-preview" />
                        </div>
                      )}
                      <div className="alhf-grid-2">
                        <div>
                          <label className="alhf-label">Image Height (px)</label>
                          <input type="number" name="footer_image_height" value={formData.footer_image_height} onChange={handleInputChange} placeholder="e.g. 60" className="alhf-input" />
                        </div>
                        <div>
                          <label className="alhf-label">Image Width (px)</label>
                          <input type="number" name="footer_image_width" value={formData.footer_image_width} onChange={handleInputChange} placeholder="e.g. 300" className="alhf-input" />
                        </div>
                      </div>
                      <div className="alhf-field-block">
                        <label className="alhf-label">Align</label>
                        <div className="alhf-align-group">
                          {ALIGN_OPTIONS.map((opt) => (
                            <button key={opt} type="button" onClick={() => setAlign("footer_align", opt)}
                              className={`alhf-align-btn ${formData.footer_align === opt ? "alhf-align-btn-active" : ""}`}>
                              {opt === "Left" && <FaAlignLeft size={13} />}
                              {opt === "Center" && <FaAlignCenter size={13} />}
                              {opt === "Right" && <FaAlignRight size={13} />}
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  {formData.footer_based_on === "Text" && (
                    <>
                      <div className="alhf-section-title alhf-section-title-first"><FaFileAlt size={12} /> Footer Text</div>
                      <div className="alhf-info-banner"><FaInfoCircle size={12} /> Text footers use the company's default address and contact details automatically.</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3 — Design */}
            {activeTab === 3 && (
              <div className="alhf-fade-in">
                <div className="alhf-card">
                  <div className="alhf-section-title alhf-section-title-first"><FaCode size={12} /> Preview Design Controls</div>
                  <div className="alhf-info-banner" style={{ marginBottom: 20 }}>
                    <FaInfoCircle size={12} />
                    These settings control the live preview only. They won't affect the actual document unless you export the generated HTML.
                  </div>

                  <div className="alhf-grid-2">
                    <div>
                      <label className="alhf-label">Company Initials (logo placeholder)</label>
                      <input type="text" name="company_initials" value={formData.company_initials} onChange={handleInputChange}
                        maxLength={3} placeholder="e.g. AI" className="alhf-input" />
                    </div>
                    <div>
                      <label className="alhf-label">Accent Colour</label>
                      <div className="alhf-color-row">
                        <input type="color" name="accent_color" value={formData.accent_color} onChange={handleInputChange} className="alhf-color-input" />
                        <input type="text" name="accent_color" value={formData.accent_color} onChange={handleInputChange} placeholder="#1d4ed8" className="alhf-input" style={{ flex: 1 }} />
                      </div>
                    </div>
                  </div>

                  <div className="alhf-grid-2">
                    <div>
                      <label className="alhf-label">Tagline / Slogan</label>
                      <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} placeholder="Built to last" className="alhf-input" />
                    </div>
                    <div>
                      <label className="alhf-label">Phone</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91 98765 43210" className="alhf-input" />
                    </div>
                  </div>

                  <div className="alhf-grid-2">
                    <div>
                      <label className="alhf-label">Email</label>
                      <input type="text" name="email" value={formData.email} onChange={handleInputChange} placeholder="info@company.com" className="alhf-input" />
                    </div>
                    <div>
                      <label className="alhf-label">Website</label>
                      <input type="text" name="website" value={formData.website} onChange={handleInputChange} placeholder="www.company.com" className="alhf-input" />
                    </div>
                  </div>

                  <div className="alhf-field-block">
                    <label className="alhf-label">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="123, Business Park, Mumbai — 400001" className="alhf-input" />
                  </div>

                  <div className="alhf-field-block">
                    <label className="alhf-label">GST Number</label>
                    <input type="text" name="gst" value={formData.gst} onChange={handleInputChange} placeholder="27AABCU9603R1ZX" className="alhf-input" />
                  </div>

                  <div className="alhf-section-title"><FaImage size={12} /> Header Layout</div>
                  <div className="alhf-layout-group">
                    <HeaderLayoutBtn v="split" label="Split" />
                    <HeaderLayoutBtn v="centered" label="Centred" />
                    <HeaderLayoutBtn v="minimal" label="Minimal" />
                  </div>
                  <div className="alhf-layout-preview-hints">
                    <span className={formData.header_layout === "split" ? "alhf-hint-active" : ""}>Split — logo + name left, contacts right, accent slogan bar</span>
                    <span className={formData.header_layout === "centered" ? "alhf-hint-active" : ""}>Centred — centred logo & name on solid colour band</span>
                    <span className={formData.header_layout === "minimal" ? "alhf-hint-active" : ""}>Minimal — text only with accent border-bottom</span>
                  </div>

                  <div className="alhf-section-title"><FaLayerGroup size={12} /> Footer Style</div>
                  <div className="alhf-layout-group">
                    <FooterStyleBtn v="band" label="Colour band" />
                    <FooterStyleBtn v="rule" label="Rule line" />
                    <FooterStyleBtn v="none" label="None" />
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="alhf-footer-row">
              {activeTab > 0 && (
                <button type="button" onClick={handlePrevious} className="alhf-btn-secondary">← Previous</button>
              )}
              {activeTab < 3 && (
                <button type="button" onClick={handleNext} className="alhf-btn-primary">Next →</button>
              )}
              {activeTab === 3 && (
                <button type="submit" disabled={saving} className="alhf-btn-primary alhf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
                  {saving && <FaSpinner className="alhf-spinning" />}
                  <FaSave /> {isEditMode ? "Update Letter Head" : "Save Letter Head"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Live Preview */}
        {showPreview && (
          <div className="alhf-preview-panel">
            <div className="alhf-preview-panel-header">
              <FaEye size={12} />
              <span>Live Preview</span>
              <div className="alhf-preview-date-wrap">
                <label className="alhf-preview-date-label" htmlFor="preview-date-input">
                  Date
                </label>
                <input
                  id="preview-date-input"
                  type="date"
                  value={previewDate}
                  onChange={(e) => setPreviewDate(e.target.value)}
                  className="alhf-preview-date-input"
                />
              </div>
              <span className="alhf-preview-live-badge">Auto-updating</span>
            </div>
            <div className="alhf-preview-scroll">
              <div className="alhf-paper-stage">
                <LetterHeadPreview data={formData} previewDate={previewDate} formatDate={formatPreviewDate} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddLetterHeadForm;