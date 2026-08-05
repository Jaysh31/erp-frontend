import React, { useState, useEffect } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaUniversity, FaCheckCircle,
  FaFileUpload, FaShieldAlt, FaFilePdf, FaCloudUploadAlt, FaTrashAlt,
  FaExternalLinkAlt, FaDownload, FaPlus, FaCopy,
  FaUser, FaPhone, FaEnvelope, FaMoneyBillWave,
} from "react-icons/fa";
import "./BankDetailsForm.css";
import api from "../../src/services/api";
import toast from "react-hot-toast";

// ─── interfaces ───────────────────────────────────────────────────────────

interface BankAccountEntry {
  _key: string; // client-side only, used for React keys / lookups
  recordId: number | string | null;
  docName: string | null;

  account_holder_name: string;
  account_type: string;

  bank_name: string;
  branch_name: string;

  account_number: string;
  confirm_account_number: string;
  currency: string;

  ifsc_code: string;
  micr_code: string;
  swift_code: string;
  iban: string;

  upi_id: string;

  cancelled_cheque: string; // holds the uploaded file's URL once /uploadmedia succeeds
  passbook_copy: string;

  verified: boolean;
  verified_by: string;
  verified_on: string;

  is_primary: boolean;

  remarks: string;

  contact_person_name: string; // first name
  contact_person_last_name: string;
  contact_person_phone: string;
  contact_person_email: string;
  contact_person_department: string;
  contact_person_remarks: string;
  contact_is_primary: boolean;
  contact_is_billing: boolean;
  contact_is_purchase: boolean;

  cash_in_hand: string;
  cash_in_account: string;

  // transient, UI-only upload state
  _cancelledChequeUploading: boolean;
  _passbookUploading: boolean;
  _cancelledChequeError: string | null;
  _passbookError: string | null;
}

interface ValidationError {
  key: string; // "company_id" or "<accountIndex>:<field>"
  label: string;
  message: string;
}

type FieldStatus = "idle" | "valid" | "error";

interface EmbedContext {
  returnPath: string;
  partyType: string;
  partyId: string;
  companyId?: number | null;
  supplierName?: string;
  editIndex?: number;
  prefill?: any; 
  isPendingSupplier?: boolean;
}

let keyCounter = 0;
const nextKey = (): string => {
  keyCounter += 1;
  return `acct-${Date.now().toString(36)}-${keyCounter}`;
};

const defaultAccount = (): BankAccountEntry => ({
  _key: nextKey(),
  recordId: null,
  docName: null,

  account_holder_name: "",
  account_type: "Savings",

  bank_name: "",
  branch_name: "",

  account_number: "",
  confirm_account_number: "",
  currency: "INR",

  ifsc_code: "",
  micr_code: "",
  swift_code: "",
  iban: "",

  upi_id: "",

  cancelled_cheque: "",
  passbook_copy: "",

  verified: false,
  verified_by: "",
  verified_on: "",

  is_primary: false,

  remarks: "",

  contact_person_name: "",
  contact_person_last_name: "",
  contact_person_phone: "",
  contact_person_email: "",
  contact_person_department: "",
  contact_person_remarks: "",
  contact_is_primary: true,
  contact_is_billing: false,
  contact_is_purchase: false,

  cash_in_hand: "",
  cash_in_account: "",

  _cancelledChequeUploading: false,
  _passbookUploading: false,
  _cancelledChequeError: null,
  _passbookError: null,
});

const accountFromPrefill = (p: any): BankAccountEntry => ({
  _key: p._key || nextKey(),
  recordId: p.recordId ?? null,
  docName: p.docName ?? null,

  account_holder_name: p.account_holder_name || "",
  account_type: p.account_type || "Savings",

  bank_name: p.bank_name || "",
  branch_name: p.branch_name || "",

  account_number: p.account_number || "",
  confirm_account_number: p.account_number || "",
  currency: p.currency || "INR",

  ifsc_code: p.ifsc_code || "",
  micr_code: p.micr_code || "",
  swift_code: p.swift_code || "",
  iban: p.iban || "",

  upi_id: p.upi_id || "",

  cancelled_cheque: p.cancelled_cheque || "",
  passbook_copy: p.passbook_copy || "",

  verified: !!p.verified,
  verified_by: p.verified_by || "",
  verified_on: p.verified_on || "",

  is_primary: !!p.is_primary,

  remarks: p.remarks || "",

  contact_person_name: p.contact_person_name || "",
  contact_person_last_name: p.contact_person_last_name || "",
  contact_person_phone: p.contact_person_phone || "",
  contact_person_email: p.contact_person_email || "",
  contact_person_department: p.contact_person_department || "",
  contact_person_remarks: p.contact_person_remarks || "",
  contact_is_primary: p.contact_is_primary === undefined ? true : !!p.contact_is_primary,
  contact_is_billing: !!p.contact_is_billing,
  contact_is_purchase: !!p.contact_is_purchase,

  cash_in_hand: p.cash_in_hand !== undefined && p.cash_in_hand !== null ? String(p.cash_in_hand) : "",
  cash_in_account: p.cash_in_account !== undefined && p.cash_in_account !== null ? String(p.cash_in_account) : "",

  _cancelledChequeUploading: false,
  _passbookUploading: false,
  _cancelledChequeError: null,
  _passbookError: null,
});

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPE = "application/pdf";
const UPLOAD_MEDIA_URL = "/uploadmedia";
const GET_IMAGE_BASE_URL = "/getimage/account";

const DEFAULT_COMPANY_ID_KEY = "default_company_id";
const getDefaultCompanyId = (): number | null => {
  const stored = localStorage.getItem(DEFAULT_COMPANY_ID_KEY);
  return stored ? Number(stored) : null;
};

type UploadFieldName = "cancelled_cheque" | "passbook_copy";

const fileNameFromUrl = (url: string): string => {
  try {
    const clean = url.split("?")[0];
    const parts = clean.split("/");
    return decodeURIComponent(parts[parts.length - 1] || url);
  } catch {
    return url;
  }
};

const uploadDocumentToServer = async (file: File, accountId: string): Promise<string> => {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("accountID", accountId);
  fd.append("type", "account");

  const response = await api.post(UPLOAD_MEDIA_URL, fd);

  if (response.data?.success !== 1 || !response.data?.fileUrl) {
    throw new Error(response.data?.message || "File upload failed");
  }
  return response.data.fileUrl as string;
};

// Field labels for the shared "Linked To" block.
const TOP_LEVEL_FIELD_LABELS: Record<string, string> = {
  company_id: "Company",
};

// Field labels for fields that live inside each bank account section.
const ACCOUNT_FIELD_LABELS: Record<string, string> = {
  account_holder_name: "Account Holder Name",
  bank_name: "Bank Name",
  branch_name: "Branch Name",
  account_number: "Account Number",
  confirm_account_number: "Confirm Account Number",
  ifsc_code: "IFSC Code",
};

const TOP_LEVEL_VALIDATABLE_FIELDS = Object.keys(TOP_LEVEL_FIELD_LABELS);
const ACCOUNT_VALIDATABLE_FIELDS = Object.keys(ACCOUNT_FIELD_LABELS);

const sanitizeTopLevelField = (name: string, value: string): string => {
  switch (name) {
    case "company_id":
    case "party_id":
      return value.replace(/[^0-9]/g, "").slice(0, 12);
    default:
      return value;
  }
};

const sanitizeAccountField = (name: string, value: string): string => {
  switch (name) {
    case "account_holder_name":
      return value.replace(/[^A-Za-z\s.'-]/g, "");
    case "bank_name":
      return value.replace(/[^A-Za-z\s.&'-]/g, "").slice(0, 100);
    case "branch_name":
      return value.replace(/[^A-Za-z0-9\s.,'-]/g, "").slice(0, 100);
    case "account_number":
    case "confirm_account_number":
      return value.replace(/[^0-9]/g, "").slice(0, 20);
    case "ifsc_code":
      return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
    case "micr_code":
      return value.replace(/[^0-9]/g, "").slice(0, 9);
    case "swift_code":
      return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
    case "iban":
      return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 34);
    case "contact_person_phone":
      return value.replace(/[^0-9+\-\s]/g, "").slice(0, 15);
    case "cash_in_hand":
    case "cash_in_account":
      // digits + a single decimal point, max 2 decimal places
      return value
        .replace(/[^0-9.]/g, "")
        .replace(/(\..*)\./g, "$1")
        .replace(/^(\d*\.\d{0,2}).*$/, "$1");
    default:
      return value;
  }
};

// Sanitization for the fields inside the Contact Person modal — kept
// separate from sanitizeAccountField since these aren't top-level
// account inputs and a couple of names overlap in meaning but not rules.
const sanitizeContactField = (
  field: "firstName" | "lastName" | "phone" | "email" | "department" | "remarks",
  value: string
): string => {
  switch (field) {
    case "firstName":
    case "lastName":
      return value.replace(/[^A-Za-z\s.'-]/g, "");
    case "phone":
      return value.replace(/[^0-9+\-\s]/g, "").slice(0, 15);
    case "department":
      return value.replace(/[^A-Za-z0-9\s.&'-]/g, "").slice(0, 60);
    case "remarks":
      return value.slice(0, 300);
    default:
      return value;
  }
};

const validateTopLevelField = (name: string, rawValue: string): string => {
  const v = (rawValue ?? "").trim();
  switch (name) {
    case "company_id":
      if (!v) return "Company is required";
      if (!/^\d+$/.test(v)) return "Company must be a valid ID";
      return "";
    default:
      return "";
  }
};

const validateAccountField = (
  name: string,
  rawValue: string,
  account: BankAccountEntry
): string => {
  const v = (rawValue ?? "").trim();

  switch (name) {
    case "account_holder_name":
      if (!v) return "Account Holder Name is required";
      if (!/^[A-Za-z\s.'-]+$/.test(v)) return "Only letters are allowed";
      if (v.length < 2) return "Must be at least 2 characters";
      return "";

    case "bank_name":
      if (!v) return "Bank Name is required";
      if (!/^[A-Za-z\s.&'-]+$/.test(v)) return "Only letters are allowed";
      if (v.length < 2) return "Must be at least 2 characters";
      return "";

    case "branch_name":
      if (!v) return "Branch Name is required";
      if (!/^[A-Za-z0-9\s.,'-]+$/.test(v)) return "Only letters and numbers are allowed";
      return "";

    case "account_number":
      if (!v) return "Account Number is required";
      if (!/^\d+$/.test(v)) return "Only numbers are allowed";
      if (v.length < 6 || v.length > 20) return "Account Number must be 6–20 digits";
      return "";

    case "confirm_account_number":
      if (!v) return "Please confirm the Account Number";
      if (!/^\d+$/.test(v)) return "Only numbers are allowed";
      if (v !== account.account_number.trim()) return "Account numbers do not match";
      return "";

    case "ifsc_code":
      if (!v) return "IFSC Code is required";
      if (!/^[A-Za-z0-9]+$/.test(v)) return "Only letters and numbers are allowed";
      if (!IFSC_REGEX.test(v.toUpperCase())) return "Invalid IFSC format (e.g. HDFC0001234)";
      return "";

    default:
      return "";
  }
};

const StatusIcon: React.FC<{ status: FieldStatus }> = ({ status }) => {
  if (status === "valid") return <FaCheckCircle className="bdf-status-icon bdf-status-icon-valid" />;
  if (status === "error") return <FaTimesCircle className="bdf-status-icon bdf-status-icon-error" />;
  return null;
};

const FieldFeedback: React.FC<{ status: FieldStatus; error?: string; hint?: string; validText?: string }> = ({
  status,
  error,
  hint,
  validText,
}) => {
  if (status === "error" && error) {
    return (
      <span className="bdf-error-text">
        <FaTimesCircle className="bdf-feedback-icon" size={10} /> {error}
      </span>
    );
  }
  if (status === "valid") {
    return (
      <span className="bdf-valid-text">
        <FaCheckCircle className="bdf-feedback-icon" size={10} /> {validText || "Looks good"}
      </span>
    );
  }
  if (hint) {
    return <span className="bdf-hint-text">{hint}</span>;
  }
  return null;
};

const PdfUploadField: React.FC<{
  fieldId: string;
  fileUrl: string;
  accountId: string;
  uploading: boolean;
  error: string | null;
  onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}> = ({ fieldId, fileUrl, accountId, uploading, error, onSelect, onRemove }) => {
  const inputId = `bdf-file-input-${fieldId}`;

  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  
  useEffect(() => {
    setPreviewError(null);
    setPopupBlocked(false);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [fileUrl]);

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
  }, [previewBlobUrl]);

  const displayName = fileUrl ? fileNameFromUrl(fileUrl) : "";
  const hasAttachment = !!fileUrl;

  /** Fetches the file as a blob (reusing a cached one if we already have it). */
  const getBlobUrl = async (): Promise<string> => {
    if (previewBlobUrl) return previewBlobUrl;
    const fileName = fileNameFromUrl(fileUrl);
    const response = await api.get(
      `${GET_IMAGE_BASE_URL}/${encodeURIComponent(accountId)}/${encodeURIComponent(fileName)}`,
      { responseType: "blob" }
    );
    const blobUrl = URL.createObjectURL(response.data);
    setPreviewBlobUrl(blobUrl);
    return blobUrl;
  };

  const openPreview = async () => {
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(
        "<title>Loading document…</title><body style=\"font-family:sans-serif;padding:40px;color:#555\">Loading document…</body>"
      );
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setPopupBlocked(false);

    try {
      const blobUrl = await getBlobUrl();
      if (newTab) {
        newTab.location.href = blobUrl;
      } else {
        // Browser blocked the popup despite opening it synchronously.
        setPopupBlocked(true);
      }
    } catch (err) {
      console.error("Error fetching preview:", err);
      if (newTab) newTab.close();
      setPreviewError("Failed to load preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFile = async () => {
    setDownloading(true);
    setPreviewError(null);
    try {
      const blobUrl = await getBlobUrl();
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = displayName || "document.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Error downloading file:", err);
      setPreviewError("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {uploading ? (
        <div className="bdf-file-dropzone bdf-file-dropzone-uploading">
          <FaSpinner className="bdf-spinning" />
          <span className="bdf-file-dropzone-text">Uploading document…</span>
        </div>
      ) : hasAttachment ? (
        <>
          <div className="bdf-file-chip">
            <FaFilePdf className="bdf-file-chip-icon" />
            <span className="bdf-file-chip-name" title={displayName}>
              {displayName}
            </span>
            <button
              type="button"
              className="bdf-file-chip-view"
              onClick={openPreview}
              disabled={previewLoading}
              title="Open in new tab"
            >
              {previewLoading ? (
                <FaSpinner className="bdf-spinning" size={11} />
              ) : (
                <FaExternalLinkAlt size={11} />
              )}
            </button>
            <button
              type="button"
              className="bdf-file-chip-view"
              onClick={downloadFile}
              disabled={downloading}
              title="Download"
            >
              {downloading ? (
                <FaSpinner className="bdf-spinning" size={11} />
              ) : (
                <FaDownload size={11} />
              )}
            </button>
            <button
              type="button"
              className="bdf-file-chip-remove"
              onClick={onRemove}
              title="Remove file"
            >
              <FaTrashAlt size={11} />
            </button>
          </div>

          {popupBlocked && previewBlobUrl && (
            <span className="bdf-hint-text">
              Your browser blocked the preview tab.{" "}
              <a
                href={previewBlobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bdf-preview-fallback-link"
              >
                Click here to open it
              </a>
              , or use Download instead.
            </span>
          )}

          {previewError && (
            <span className="bdf-error-text">
              <FaTimesCircle className="bdf-feedback-icon" size={10} /> {previewError}
            </span>
          )}
        </>
      ) : (
        <div>
          <label htmlFor={inputId} className="bdf-file-dropzone">
            <FaCloudUploadAlt className="bdf-file-dropzone-icon" />
            <span className="bdf-file-dropzone-text">
              <strong>Click to select</strong> a PDF (max 5 MB) — uploads immediately
            </span>
          </label>
          <input
            id={inputId}
            type="file"
            accept="application/pdf"
            onChange={onSelect}
            className="bdf-file-input-hidden"
          />
        </div>
      )}

      {error && (
        <span className="bdf-error-text">
          <FaTimesCircle className="bdf-feedback-icon" size={10} /> {error}
        </span>
      )}
    </div>
  );
};

const nowAsFrappeDatetime = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const generateClientDocName = (): string => {
  const year = new Date().getFullYear();
  const suffix = Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 36).toString(36);
  return `BANK-${year}-${suffix}`.toUpperCase();
};

const BankDetailsForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isEditMode = !!id && id !== "new";


  const embedContext = (location.state as any)?.embedContext as EmbedContext | undefined;

  const isPendingParty = !!embedContext && (embedContext.isPendingSupplier || !embedContext.partyId);

  // shared, company-level fields
  const [companyId, setCompanyId] = useState("");
  const [partyType, setPartyType] = useState("");
  const [partyId, setPartyId] = useState("");

// one entry per bank account for this company / party
const [accounts, setAccounts] = useState<BankAccountEntry[]>(() => {
  if (embedContext?.prefill) {
    const prefillArray = Array.isArray(embedContext.prefill)
      ? embedContext.prefill
      : [embedContext.prefill];
    if (prefillArray.length > 0) {
      return prefillArray.map(accountFromPrefill);
    }
  }
  return [defaultAccount()];
});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Contact-person modal: holds a draft copy of the fields for whichever
  // account index is currently being edited, or null when closed.
  const [contactModal, setContactModal] = useState<{
    idx: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    department: string;
    remarks: string;
    isPrimary: boolean;
    isBilling: boolean;
    isPurchase: boolean;
  } | null>(null);

  // Pre-fill the party linkage when embedded.
  useEffect(() => {
    if (embedContext) {
      setPartyType(embedContext.partyType || "Supplier");
      setPartyId(embedContext.partyId || "");
      if (embedContext.companyId) setCompanyId(String(embedContext.companyId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const forceRepaintOnFocus = () => {
      const el = document.body;
      const prevDisplay = el.style.display;
      el.style.display = "none";
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      el.offsetHeight; // reading a layout property forces a synchronous reflow
      el.style.display = prevDisplay;
    };
    window.addEventListener("focus", forceRepaintOnFocus);
    return () => window.removeEventListener("focus", forceRepaintOnFocus);
  }, []);

  useEffect(() => {
    if (isEditMode && id && !embedContext) {
      const state = location.state as { bankDetails?: any };
      if (state?.bankDetails) {
        loadBankDetailsIntoForm(state.bankDetails);
      } else {
        fetchBankDetailsById(id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBankDetailsById = async (bankDetailsId: string) => {
    try {
      const response = await api.get(`/bank-detail/${bankDetailsId}?_=${Date.now()}`);
      console.log("Bank Detail response:", response.data);

      const record =
        response.data?.data ??
        response.data?.result ??
        response.data;

      if (response.data?.success === 1 || record) {
        loadBankDetailsIntoForm(record);
      } else {
        setApiError("Failed to load bank details");
      }
    } catch (err: any) {
      console.error("Error fetching bank details:", err);
      setApiError(err.response?.data?.message || "Failed to load bank details");
    }
  };


  const loadBankDetailsIntoForm = (bd: any) => {
    const derivedPartyType = bd.employee_id
      ? "Employee"
      : bd.supplier_id
      ? "Supplier"
      : bd.customer_id
      ? "Customer"
      : "";
    const derivedPartyId = bd.employee_id ?? bd.supplier_id ?? bd.customer_id ?? "";

    setCompanyId(bd.company_id !== undefined && bd.company_id !== null ? String(bd.company_id) : "");
    setPartyType(derivedPartyType);
    setPartyId(derivedPartyId !== null && derivedPartyId !== undefined ? String(derivedPartyId) : "");

    const toAccount = (row: any): BankAccountEntry => ({
      _key: nextKey(),
      recordId: row.id ?? null,
      docName: row.name ?? null,

      account_holder_name: row.account_holder_name || "",
      account_type: row.account_type || "Savings",

      bank_name: row.bank_name || "",
      branch_name: row.branch_name || "",

      account_number: row.account_number || "",
      confirm_account_number: row.account_number || "",
      currency: row.currency || "INR",

      ifsc_code: row.ifsc_code || "",
      micr_code: row.micr_code || "",
      swift_code: row.swift_code || "",
      iban: row.iban || "",

      upi_id: row.upi_id || "",

      cancelled_cheque: row.cancelled_cheque || "",
      passbook_copy: row.passbook_copy || "",

      verified: row.verified === undefined ? false : !!row.verified,
      verified_by: row.verified_by || "",
      verified_on: row.verified_on || "",

      is_primary: !!row.is_primary,

      remarks: row.remarks || "",

      contact_person_name: row.contact_person_name || "",
      contact_person_last_name: row.contact_person_last_name || "",
      contact_person_phone: row.contact_person_phone || "",
      contact_person_email: row.contact_person_email || "",
      contact_person_department: row.contact_person_department || "",
      contact_person_remarks: row.contact_person_remarks || "",
      contact_is_primary: row.contact_is_primary === undefined ? true : !!row.contact_is_primary,
      contact_is_billing: !!row.contact_is_billing,
      contact_is_purchase: !!row.contact_is_purchase,

      cash_in_hand: row.cash_in_hand !== undefined && row.cash_in_hand !== null ? String(row.cash_in_hand) : "",
      cash_in_account: row.cash_in_account !== undefined && row.cash_in_account !== null ? String(row.cash_in_account) : "",

      _cancelledChequeUploading: false,
      _passbookUploading: false,
      _cancelledChequeError: null,
      _passbookError: null,
    });

    const siblingRows: any[] = Array.isArray(bd.accounts)
      ? bd.accounts
      : Array.isArray(bd.other_accounts)
      ? bd.other_accounts
      : [];

    const allRows = [bd, ...siblingRows.filter((r) => r && r.id !== bd.id)];
    setAccounts(allRows.map(toAccount));
  };

  // ── validation helpers ──────────────────────────────────────────────

  const getAllValidationErrors = (): ValidationError[] => {
    const allErrors: ValidationError[] = [];

    // Company/party linkage is not editable (or required) in embedded mode —
    // the linkage is already known (embedContext.partyId / embedContext.companyId).
    if (!embedContext) {
      TOP_LEVEL_VALIDATABLE_FIELDS.forEach((field) => {
        const value = field === "company_id" ? companyId : "";
        const message = validateTopLevelField(field, value);
        if (message) {
          allErrors.push({ key: field, label: TOP_LEVEL_FIELD_LABELS[field], message });
        }
      });
    }

    // Every bank account row gets validated — embedded mode now supports
    // adding more than one account for the supplier in a single visit.
    accounts.forEach((account, idx) => {
      ACCOUNT_VALIDATABLE_FIELDS.forEach((field) => {
        const value = (account as any)[field] as string;
        const message = validateAccountField(field, value, account);
        if (message) {
          const prefix = accounts.length > 1 ? `Bank Account ${idx + 1} – ` : "";
          allErrors.push({
            key: `${idx}:${field}`,
            label: `${prefix}${ACCOUNT_FIELD_LABELS[field]}`,
            message,
          });
        }
      });
    });

    return allErrors;
  };

  const getTopLevelStatus = (name: string): FieldStatus => {
    if (errors[name]) return "error";
    const value = name === "company_id" ? companyId : "";
    if (touched[name] && value.trim()) return "valid";
    return "idle";
  };

  const getAccountStatus = (idx: number, name: string): FieldStatus => {
    const key = `${idx}:${name}`;
    if (errors[key]) return "error";
    const value = String((accounts[idx] as any)?.[name] ?? "");
    if (touched[key] && value.trim()) return "valid";
    return "idle";
  };

  const jumpToError = (key: string) => {
    setShowValidationSummary(false);
    const el = document.querySelector(`[data-field-key="${key}"]`) as HTMLElement | null;
    el?.focus();
  };

  // ── top-level field handlers ────────────────────────────────────────

  const handleCompanyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeTopLevelField("company_id", e.target.value);
    setCompanyId(sanitized);
    setTouched((prev) => (prev.company_id ? prev : { ...prev, company_id: true }));
    setErrors((prev) => ({ ...prev, company_id: validateTopLevelField("company_id", sanitized) }));
    if (saveSuccess) setSaveSuccess(false);
  };

  const handleCompanyIdBlur = () => {
    setTouched((prev) => ({ ...prev, company_id: true }));
    setErrors((prev) => ({ ...prev, company_id: validateTopLevelField("company_id", companyId) }));
  };

  const handlePartyTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPartyType(e.target.value);
    setPartyId("");
  };

  const handlePartyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPartyId(sanitizeTopLevelField("party_id", e.target.value));
  };

  // ── per-account field handlers ──────────────────────────────────────

  const updateAccount = (idx: number, patch: Partial<BankAccountEntry>) => {
    setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, ...patch } : acc)));
  };

  const handleAccountInputChange = (
    idx: number,
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      if (name === "is_primary") {
        // only one account per company can be primary
        setAccounts((prev) =>
          prev.map((acc, i) => ({ ...acc, is_primary: i === idx ? checked : checked ? false : acc.is_primary }))
        );
        return;
      }

      if (name === "verified") {
        setAccounts((prev) =>
          prev.map((acc, i) => {
            if (i !== idx) return acc;
            if (checked && !acc.verified_on) {
              return {
                ...acc,
                verified: true,
                verified_on: nowAsFrappeDatetime(),
                verified_by: acc.verified_by || "Administrator",
              };
            }
            if (!checked) return { ...acc, verified: false, verified_on: "" };
            return { ...acc, verified: checked };
          })
        );
        return;
      }
    }

    const sanitized = sanitizeAccountField(name, value);
    const key = `${idx}:${name}`;

    setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, [name]: sanitized } : acc)));

    if (ACCOUNT_VALIDATABLE_FIELDS.includes(name)) {
      setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

      setAccounts((current) => {
        const updatedAccount = { ...current[idx], [name]: sanitized };
        const fieldError = validateAccountField(name, sanitized, updatedAccount);
        setErrors((prevErrors) => {
          const updatedErrors = { ...prevErrors, [key]: fieldError };
          if (name === "account_number" && updatedAccount.confirm_account_number) {
            updatedErrors[`${idx}:confirm_account_number`] = validateAccountField(
              "confirm_account_number",
              updatedAccount.confirm_account_number,
              updatedAccount
            );
          }
          return updatedErrors;
        });
        return current;
      });
    }

    if (saveSuccess) setSaveSuccess(false);
  };

  const handleAccountBlur = (
    idx: number,
    e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (!ACCOUNT_VALIDATABLE_FIELDS.includes(name)) return;
    const key = `${idx}:${name}`;
    setTouched((prev) => ({ ...prev, [key]: true }));
    const fieldError = validateAccountField(name, value, accounts[idx]);
    setErrors((prev) => ({ ...prev, [key]: fieldError }));
  };

  const handleAddAccount = () => {
    setAccounts((prev) => [...prev, defaultAccount()]);
  };

  const handleDuplicateAccount = (idx: number) => {
    setAccounts((prev) => {
      const source = prev[idx];
      const copy: BankAccountEntry = {
        ...defaultAccount(),
        bank_name: source.bank_name,
        branch_name: source.branch_name,
        ifsc_code: source.ifsc_code,
        currency: source.currency,
        account_type: source.account_type,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const handleRemoveAccount = (idx: number) => {
    setAccounts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
    setErrors((prev) => {
      const cleaned: { [key: string]: string } = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (!k.startsWith(`${idx}:`)) cleaned[k] = v;
      });
      return cleaned;
    });
  };

  // ── contact person modal ─────────────────────────────────────────────


  const closeContactModal = () => setContactModal(null);

  const handleContactModalTextChange = (
    field: "firstName" | "lastName" | "phone" | "email" | "department" | "remarks",
    value: string
  ) => {
    setContactModal((prev) => {
      if (!prev) return prev;
      const sanitized = field === "email" ? value : sanitizeContactField(field, value);
      return { ...prev, [field]: sanitized };
    });
  };

  const handleContactModalCheckChange = (
    field: "isPrimary" | "isBilling" | "isPurchase",
    checked: boolean
  ) => {
    setContactModal((prev) => (prev ? { ...prev, [field]: checked } : prev));
  };

  const contactModalIsValid = !!(
    contactModal &&
    contactModal.firstName.trim() &&
    contactModal.lastName.trim() &&
    contactModal.email.trim() &&
    contactModal.phone.trim()
  );

  const saveContactModal = () => {
    if (!contactModal || !contactModalIsValid) return;
    updateAccount(contactModal.idx, {
      contact_person_name: contactModal.firstName.trim(),
      contact_person_last_name: contactModal.lastName.trim(),
      contact_person_phone: contactModal.phone.trim(),
      contact_person_email: contactModal.email.trim(),
      contact_person_department: contactModal.department.trim(),
      contact_person_remarks: contactModal.remarks.trim(),
      contact_is_primary: contactModal.isPrimary,
      contact_is_billing: contactModal.isBilling,
      contact_is_purchase: contactModal.isPurchase,
    });
    setContactModal(null);
  };





  // ── file handlers (upload happens immediately via /uploadmedia) ────

  const resolveAccountId = (account: BankAccountEntry): string =>
    account?.recordId
      ? String(account.recordId)
      : embedContext?.partyId || companyId.trim() || account?._key || "new";

  const handleFileSelect = async (idx: number, field: UploadFieldName, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const errorKey = field === "cancelled_cheque" ? "_cancelledChequeError" : "_passbookError";
    const uploadingKey = field === "cancelled_cheque" ? "_cancelledChequeUploading" : "_passbookUploading";

    if (file.type !== ALLOWED_FILE_TYPE) {
      updateAccount(idx, { [errorKey]: "Only PDF files are allowed" } as any);
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      updateAccount(idx, { [errorKey]: "File must be under 5 MB" } as any);
      return;
    }

    updateAccount(idx, { [errorKey]: null, [uploadingKey]: true } as any);

    const account = accounts[idx];
    const accountId = resolveAccountId(account);

    try {
      const fileUrl = await uploadDocumentToServer(file, accountId);
      updateAccount(idx, { [field]: fileUrl, [uploadingKey]: false, [errorKey]: null } as any);
    } catch (err: any) {
      console.error(`Error uploading ${field} for account ${idx}:`, err);
      updateAccount(idx, {
        [uploadingKey]: false,
        [errorKey]: err.message || "Upload failed. Please try again.",
      } as any);
    }
  };

  const handleRemoveFile = (idx: number, field: UploadFieldName) => {
    const errorKey = field === "cancelled_cheque" ? "_cancelledChequeError" : "_passbookError";
    updateAccount(idx, { [field]: "", [errorKey]: null } as any);
  };

  // ── payload builders ────────────────────────────────────────────────
  const buildAccountApiPayload = (account: BankAccountEntry) => {
    const trimmedPartyId = partyId.trim() ? Number(partyId.trim()) : (embedContext?.partyId ? Number(embedContext.partyId) : null);
    const resolvedCompanyId = embedContext ? (embedContext.companyId ?? getDefaultCompanyId()) : (companyId ? Number(companyId) : null);
    const type = embedContext?.partyType || partyType || "Supplier";

    const payload: any = {
      modified_by: "Administrator",

      company_id: resolvedCompanyId,
      employee_id: type === "Employee" ? trimmedPartyId : null,
      supplier_id: type === "Supplier" ? trimmedPartyId : null,
      customer_id: type === "Customer" ? trimmedPartyId : null,

      account_holder_name: account.account_holder_name.trim(),
      account_type: account.account_type,

      bank_name: account.bank_name.trim(),
      branch_name: account.branch_name.trim(),
      account_number: account.account_number.trim(),
      ifsc_code: account.ifsc_code.trim().toUpperCase(),
      micr_code: account.micr_code.trim() || null,
      swift_code: account.swift_code.trim().toUpperCase() || null,
      iban: account.iban.trim() ? account.iban.trim().toUpperCase() : null,

      upi_id: account.upi_id || null,
      currency: account.currency || "INR",

      // documents are uploaded up-front via /uploadmedia; only their URLs travel here
      cancelled_cheque: account.cancelled_cheque || null,
      passbook_copy: account.passbook_copy || null,

      verified: account.verified ? 1 : 0,
      verified_by: account.verified ? account.verified_by || "Administrator" : null,
      verified_on: account.verified ? account.verified_on || nowAsFrappeDatetime() : null,

      is_primary: account.is_primary ? 1 : 0,
      is_deleted: 0,

      remarks: account.remarks || null,

      // contact_person_name: account.contact_person_name.trim() || null,
      contact_person_last_name: account.contact_person_last_name.trim() || null,
      contact_person_phone: account.contact_person_phone.trim() || null,
      contact_person_email: account.contact_person_email.trim() || null,
      contact_person_department: account.contact_person_department.trim() || null,
      contact_person_remarks: account.contact_person_remarks.trim() || null,
      contact_is_primary: account.contact_person_name ? (account.contact_is_primary ? 1 : 0) : 0,
      contact_is_billing: account.contact_is_billing ? 1 : 0,
      contact_is_purchase: account.contact_is_purchase ? 1 : 0,

      cash_in_hand: account.cash_in_hand.trim() ? Number(account.cash_in_hand.trim()) : 0,
      cash_in_account: account.cash_in_account.trim() ? Number(account.cash_in_account.trim()) : 0,

      // created_by: 1,
      // updated_by: 1,
    };

    if (account.docName) {
      payload.name = account.docName;
    } else {
      payload.name = generateClientDocName();
    }
    if (account.recordId) payload.id = Number(account.recordId);

    return payload;
  };


  const buildBankDetailEntry = (account: BankAccountEntry) => ({
    account_holder_name: account.account_holder_name.trim(),
    account_type: account.account_type,

    bank_name: account.bank_name.trim(),
    branch_name: account.branch_name.trim(),
    account_number: account.account_number.trim(),
    ifsc_code: account.ifsc_code.trim().toUpperCase(),
    micr_code: account.micr_code.trim() || null,
    swift_code: account.swift_code.trim() ? account.swift_code.trim().toUpperCase() : null,
    iban: account.iban.trim() ? account.iban.trim().toUpperCase() : null,

    upi_id: account.upi_id || null,
    currency: account.currency || "INR",

    cancelled_cheque: account.cancelled_cheque || null,
    passbook_copy: account.passbook_copy || null,

    verified: account.verified ? 1 : 0,
    verified_by: account.verified ? account.verified_by || "Administrator" : null,
    verified_on: account.verified ? account.verified_on || nowAsFrappeDatetime() : null,

    is_primary: account.is_primary ? 1 : 0,
    is_deleted: 0,
    remarks: account.remarks || null,

    contact_person_name: account.contact_person_name.trim() || null,
    contact_person_last_name: account.contact_person_last_name.trim() || null,
    contact_person_phone: account.contact_person_phone.trim() || null,
    contact_person_email: account.contact_person_email.trim() || null,
    contact_person_department: account.contact_person_department.trim() || null,
    contact_person_remarks: account.contact_person_remarks.trim() || null,
    contact_is_primary: account.contact_person_name ? (account.contact_is_primary ? 1 : 0) : 0,
    contact_is_billing: account.contact_is_billing ? 1 : 0,
    contact_is_purchase: account.contact_is_purchase ? 1 : 0,

    cash_in_hand: account.cash_in_hand.trim() ? Number(account.cash_in_hand.trim()) : 0,
    cash_in_account: account.cash_in_account.trim() ? Number(account.cash_in_account.trim()) : 0,
  });
  
  const buildBatchCreatePayload = (accountsToSave: BankAccountEntry[]) => {
    const type = embedContext?.partyType || partyType || "Supplier";
    const trimmedPartyId = embedContext?.partyId
      ? Number(embedContext.partyId)
      : partyId.trim()
      ? Number(partyId.trim())
      : null;
    const resolvedCompanyId = embedContext
      ? (embedContext.companyId ?? getDefaultCompanyId())
      : (companyId ? Number(companyId) : getDefaultCompanyId());

    const payload: any = {
      company_id: resolvedCompanyId,
      created_by: 1,
      updated_by: 1,
      bank_details: accountsToSave.map(buildBankDetailEntry),
    };

    if (type === "Employee") payload.employee_id = trimmedPartyId;
    else if (type === "Customer") payload.customer_id = trimmedPartyId;
    else payload.supplier_id = trimmedPartyId;

    return payload;
  };

 
  const saveAccounts = async (accountsToSave: BankAccountEntry[]): Promise<BankAccountEntry[]> => {
    const results: BankAccountEntry[] = [];

    const existingAccounts = accountsToSave.filter((a) => !!(a.recordId || a.docName));
    const newAccounts = accountsToSave.filter((a) => !(a.recordId || a.docName));

    for (const account of existingAccounts) {
      const jsonPayload = buildAccountApiPayload(account);
      const response = await api.put(`/bank-detail`, jsonPayload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data?.success !== undefined && response.data.success !== 1) {
        throw new Error(response.data?.message || `Failed to update ${account.bank_name || "bank account"}`);
      }
      results.push({ ...account, docName: account.docName || jsonPayload.name || null });
    }

    if (newAccounts.length > 0) {
      const batchPayload = buildBatchCreatePayload(newAccounts);
      console.log(`Creating ${newAccounts.length} bank account(s) with payload:`, batchPayload);

      const response = await api.post("/bank-detail", batchPayload, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.data?.success !== undefined && response.data.success !== 1) {
        throw new Error(response.data?.message || "Failed to save bank account(s)");
      }

      const createdRows = response.data?.data;
      const createdArray: any[] = Array.isArray(createdRows) ? createdRows : createdRows ? [createdRows] : [];

      newAccounts.forEach((account, idx) => {
        const createdRow = createdArray[idx] || {};
        const newId = createdRow.id ?? createdRow.insertId ?? null;
        results.push({ ...account, recordId: newId, docName: createdRow.name ?? null });
      });
    }

    return results;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const allErrors = getAllValidationErrors();
    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      setShowValidationSummary(true);

      const fieldErrors: { [key: string]: string } = {};
      const touchedAll: { [key: string]: boolean } = embedContext ? {} : { company_id: true };
      accounts.forEach((_, idx) => {
        ACCOUNT_VALIDATABLE_FIELDS.forEach((f) => {
          touchedAll[`${idx}:${f}`] = true;
        });
      });
      allErrors.forEach((err) => {
        fieldErrors[err.key] = err.message;
      });

      setTouched((prev) => ({ ...prev, ...touchedAll }));
      setErrors((prev) => ({ ...prev, ...fieldErrors }));
      return;
    }

    const stillUploading = accounts.some((a) => a._cancelledChequeUploading || a._passbookUploading);
    if (stillUploading) {
      setApiError("Please wait for document uploads to finish before saving.");
      return;
    }

    if (embedContext) {
      if (isPendingParty) {
        navigate(embedContext.returnPath, {
          state: {
            bankAccountsUpdated: true,
            updatedAccounts: accounts,
          },
        });
        return;
      }

      setSaving(true);
      setApiError(null);

      try {
        const savedAccounts = await saveAccounts(accounts);
        toast.success(
          savedAccounts.length > 1
            ? "Bank accounts saved."
            : typeof embedContext.editIndex === "number"
            ? "Bank account updated."
            : "Bank account added."
        );

        navigate(embedContext.returnPath, {
          state: {
            bankAccountsUpdated: true,
            updatedAccounts: savedAccounts,
          },
        });
      } catch (err: any) {
        console.error("Error saving embedded bank account(s):", err);
        setApiError(err.response?.data?.message || err.message || "Failed to save bank account(s)");
      } finally {
        setSaving(false);
      }
      return;
    }

    setSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    try {
      await saveAccounts(accounts);
      setSaveSuccess(true);
      navigate("/bank-details");
    } catch (err: any) {
      console.error("Error saving bank details:", err);
      if (err.response) {
        setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setApiError("Network error. Please check your connection.");
      } else {
        setApiError(err.message || "Failed to save bank details");
      }
    } finally {
      setSaving(false);
    }
  };

  const allValidationErrors = getAllValidationErrors();
  const hasAnyErrors = showValidationSummary && allValidationErrors.length > 0;

  const handleBack = () => navigate(embedContext ? embedContext.returnPath : "/bank-details");

  // ── shared JSX for a single bank account's fields ───────────────────
  const renderAccountFields = (idx: number) => {
    const account = accounts[idx];
    const accountId = resolveAccountId(account);

    return (
      <>
        <div className="bdf-section-title bdf-section-title-first">
          <FaUniversity size={12} /> Account Holder
        </div>

        <div className="bdf-grid-2">
          <div>
            <label className="bdf-label">Account Holder Name *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                name="account_holder_name"
                data-field-key={`${idx}:account_holder_name`}
                value={account.account_holder_name}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="As per bank records"
                autoComplete="off"
                className={`bdf-input bdf-input-has-icon ${
                  getAccountStatus(idx, "account_holder_name") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "account_holder_name") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "account_holder_name")} />
            </div>
            <FieldFeedback
              status={getAccountStatus(idx, "account_holder_name")}
              error={errors[`${idx}:account_holder_name`]}
              hint="Letters only"
            />
          </div>
          <div>
            <label className="bdf-label">Account Type *</label>
            <select
              name="account_type"
              value={account.account_type}
              onChange={(e) => handleAccountInputChange(idx, e)}
              className="bdf-input"
            >
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
              <option value="Cash Credit">Cash Credit</option>
              <option value="Overdraft">Overdraft</option>
              <option value="NRE">NRE</option>
              <option value="NRO">NRO</option>
            </select>
          </div>
        </div>

        {/* <div className="bdf-section-title">
          <FaUser size={12} /> Contact Persons
        </div>

        <div className="bdf-contacts-row">
          {!account.contact_person_name && (
            <button
              type="button"
              className="bdf-contact-add-circle"
              onClick={() => openContactModal(idx)}
            >
              <span className="bdf-contact-add-circle-icon">
                <FaPlus size={16} />
              </span>
              <span className="bdf-contact-add-circle-label">Add</span>
            </button>
          )}

          {account.contact_person_name && (
            <div className="bdf-contact-item">
              <div
                className="bdf-contact-avatar-wrap"
                onClick={() => openContactModal(idx)}
                title="Click to edit"
              >
                <div
                  className="bdf-contact-avatar-circle"
                  style={{ background: getContactAvatarColor(contactFullName) }}
                >
                  {getContactInitials(contactFullName)}
                </div>
                {account.contact_is_primary && (
                  <span className="bdf-contact-primary-check" title="Primary contact">
                    <FaCheckCircle size={11} />
                  </span>
                )}
                <button
                  type="button"
                  className="bdf-contact-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeContactPerson(idx);
                  }}
                  title="Remove contact"
                >
                  ×
                </button>
              </div>
              <span className="bdf-contact-name-label" title={contactFullName}>
                {contactFullName}
              </span>
            </div>
          )}
        </div>

        {!account.contact_person_name && (
          <div className="bdf-contact-empty-state">
            <FaUser className="bdf-contact-empty-icon" />
            <span>No contact person added. Click &quot;Add&quot; to add one.</span>
          </div>
        )}

        {account.contact_person_name && (
          <div className="bdf-contact-hint-row">
            <FaInfoCircle size={11} />
            Click the avatar to edit this contact, or use the × to remove it.
          </div>
        )} */}

        <div className="bdf-section-title">
          <FaUniversity size={12} /> Bank &amp; Account
        </div>

        <div className="bdf-grid-2">
          <div>
            <label className="bdf-label">Bank Name *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                name="bank_name"
                data-field-key={`${idx}:bank_name`}
                value={account.bank_name}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="e.g. HDFC Bank"
                autoComplete="off"
                className={`bdf-input bdf-input-has-icon ${
                  getAccountStatus(idx, "bank_name") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "bank_name") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "bank_name")} />
            </div>
            <FieldFeedback status={getAccountStatus(idx, "bank_name")} error={errors[`${idx}:bank_name`]} hint="Letters only" />
          </div>
          <div>
            <label className="bdf-label">Branch Name *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                name="branch_name"
                data-field-key={`${idx}:branch_name`}
                value={account.branch_name}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="e.g. MG Road Branch"
                autoComplete="off"
                className={`bdf-input bdf-input-has-icon ${
                  getAccountStatus(idx, "branch_name") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "branch_name") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "branch_name")} />
            </div>
            <FieldFeedback
              status={getAccountStatus(idx, "branch_name")}
              error={errors[`${idx}:branch_name`]}
              hint="Letters and numbers"
            />
          </div>
        </div>

        <div className="bdf-grid-2">
          <div>
            <label className="bdf-label">Account Number *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                inputMode="numeric"
                name="account_number"
                data-field-key={`${idx}:account_number`}
                value={account.account_number}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="Enter account number"
                autoComplete="off"
                maxLength={20}
                className={`bdf-input bdf-input-has-icon ${
                  getAccountStatus(idx, "account_number") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "account_number") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "account_number")} />
            </div>
            <FieldFeedback
              status={getAccountStatus(idx, "account_number")}
              error={errors[`${idx}:account_number`]}
              hint="Numbers only, 6–20 digits"
            />
          </div>
          <div>
            <label className="bdf-label">Confirm Account Number *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                inputMode="numeric"
                name="confirm_account_number"
                data-field-key={`${idx}:confirm_account_number`}
                value={account.confirm_account_number}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="Re-enter account number"
                autoComplete="off"
                maxLength={20}
                className={`bdf-input bdf-input-has-icon ${
                  getAccountStatus(idx, "confirm_account_number") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "confirm_account_number") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "confirm_account_number")} />
            </div>
            <FieldFeedback
              status={getAccountStatus(idx, "confirm_account_number")}
              error={errors[`${idx}:confirm_account_number`]}
              hint="Numbers only"
              validText="Matches"
            />
          </div>
        </div>

        <div className="bdf-section-title">
          <FaUniversity size={12} /> Codes &amp; Currency
        </div>

        <div className="bdf-grid-3">
          <div>
            <label className="bdf-label">IFSC Code *</label>
            <div className="bdf-field-control">
              <input
                type="text"
                name="ifsc_code"
                data-field-key={`${idx}:ifsc_code`}
                value={account.ifsc_code}
                onChange={(e) => handleAccountInputChange(idx, e)}
                onBlur={(e) => handleAccountBlur(idx, e)}
                placeholder="e.g. HDFC0001234"
                autoComplete="off"
                maxLength={11}
                className={`bdf-input bdf-uppercase-input bdf-input-has-icon ${
                  getAccountStatus(idx, "ifsc_code") === "error" ? "bdf-input-error" : ""
                } ${getAccountStatus(idx, "ifsc_code") === "valid" ? "bdf-input-valid" : ""}`}
              />
              <StatusIcon status={getAccountStatus(idx, "ifsc_code")} />
            </div>
            <FieldFeedback
              status={getAccountStatus(idx, "ifsc_code")}
              error={errors[`${idx}:ifsc_code`]}
              hint="4 letters + 0 + 6 alphanumeric"
            />
          </div>
          <div>
            <label className="bdf-label">
              MICR Code <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              name="micr_code"
              value={account.micr_code}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="9-digit MICR"
              autoComplete="off"
              maxLength={9}
              className="bdf-input"
            />
          </div>
          <div>
            <label className="bdf-label">
              SWIFT Code <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              name="swift_code"
              value={account.swift_code}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="e.g. HDFCINBB"
              autoComplete="off"
              maxLength={11}
              className="bdf-input bdf-uppercase-input"
            />
          </div>
        </div>

        <div className="bdf-grid-3">
          <div>
            <label className="bdf-label">
              IBAN <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              name="iban"
              value={account.iban}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="International account number"
              autoComplete="off"
              maxLength={34}
              className="bdf-input bdf-uppercase-input"
            />
          </div>
          <div>
            <label className="bdf-label">
              UPI ID <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              name="upi_id"
              value={account.upi_id}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="e.g. name@bank"
              autoComplete="off"
              className="bdf-input"
            />
          </div>
          <div>
            <label className="bdf-label">Currency</label>
            <select
              name="currency"
              value={account.currency}
              onChange={(e) => handleAccountInputChange(idx, e)}
              className="bdf-input"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>

        <div className="bdf-section-title">
          <FaMoneyBillWave size={12} /> Opening Balances
        </div>

        <div className="bdf-grid-2 bdf-mb-20">
          <div>
            <label className="bdf-label">
              Cash in Hand <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="cash_in_hand"
              value={account.cash_in_hand}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="0.00"
              autoComplete="off"
              className="bdf-input"
            />
          </div>
          <div>
            <label className="bdf-label">
              Cash in Account <span className="bdf-label-optional">(optional)</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              name="cash_in_account"
              value={account.cash_in_account}
              onChange={(e) => handleAccountInputChange(idx, e)}
              placeholder="0.00"
              autoComplete="off"
              className="bdf-input"
            />
          </div>
        </div>

        <div className="bdf-section-title">
          <FaFileUpload size={12} /> Documents
        </div>

        <div className="bdf-grid-2">
          <div>
            <label className="bdf-label">
              Cancelled Cheque <span className="bdf-label-optional">(PDF, optional)</span>
            </label>
            <PdfUploadField
              fieldId={`${account._key}-cancelled_cheque`}
              fileUrl={account.cancelled_cheque}
              accountId={accountId}
              uploading={account._cancelledChequeUploading}
              error={account._cancelledChequeError}
              onSelect={(e) => handleFileSelect(idx, "cancelled_cheque", e)}
              onRemove={() => handleRemoveFile(idx, "cancelled_cheque")}
            />
          </div>
          <div>
            <label className="bdf-label">
              Passbook Copy <span className="bdf-label-optional">(PDF, optional)</span>
            </label>
            <PdfUploadField
              fieldId={`${account._key}-passbook_copy`}
              fileUrl={account.passbook_copy}
              accountId={accountId}
              uploading={account._passbookUploading}
              error={account._passbookError}
              onSelect={(e) => handleFileSelect(idx, "passbook_copy", e)}
              onRemove={() => handleRemoveFile(idx, "passbook_copy")}
            />
          </div>
        </div>

        <div className="bdf-section-title">
          <FaShieldAlt size={12} /> Verification &amp; Status
        </div>

        <div className="bdf-grid-2 bdf-mb-20">
          <div className="bdf-checkbox-row">
            <label className="bdf-checkbox-label">
              <input
                type="checkbox"
                name="verified"
                checked={account.verified}
                onChange={(e) => handleAccountInputChange(idx, e)}
                className="bdf-checkbox"
              />
              Mark this bank account as verified
            </label>
          </div>
          <div className="bdf-checkbox-row">
            <label className="bdf-checkbox-label">
              <input
                type="checkbox"
                name="is_primary"
                checked={account.is_primary}
                onChange={(e) => handleAccountInputChange(idx, e)}
                className="bdf-checkbox"
              />
              Set as primary bank account
            </label>
          </div>
        </div>

        {account.verified && (
          <div className="bdf-grid-2">
            <div>
              <label className="bdf-label">Verified By</label>
              <input
                type="text"
                name="verified_by"
                value={account.verified_by}
                onChange={(e) => handleAccountInputChange(idx, e)}
                placeholder="Administrator"
                autoComplete="off"
                className="bdf-input"
              />
            </div>
            <div>
              <label className="bdf-label">Verified On</label>
              <input
                type="text"
                name="verified_on"
                value={account.verified_on}
                readOnly
                className="bdf-input"
              />
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bdf-page">

      {showValidationSummary && validationErrors.length > 0 && (
        <div className="bdf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
          <div className="bdf-validation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bdf-modal-header">
              <h2 className="bdf-modal-title-warning">
                <FaExclamationTriangle /> Missing or Invalid Fields
              </h2>
              <button className="bdf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
            </div>
            <div className="bdf-modal-body">
              <p className="bdf-modal-intro">
                Please fix the following fields before submitting:
              </p>
              <div className="bdf-error-list">
                {validationErrors.map((error, idx) => (
                  <div key={idx} className="bdf-validation-error-item" onClick={() => jumpToError(error.key)}>
                    <div className="bdf-error-header">
                      <FaTimesCircle className="bdf-error-icon" />
                      <strong className="bdf-error-label">{error.label}</strong>
                    </div>
                    <div className="bdf-error-message">{error.message}</div>
                  </div>
                ))}
              </div>
              <div className="bdf-hint-banner">
                <FaInfoCircle className="bdf-hint-icon" />
                Click on any error to jump to that field
              </div>
            </div>
            <div className="bdf-modal-footer">
              <button className="bdf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {contactModal && (
        <div className="bdf-modal-overlay" onClick={closeContactModal}>
          <div className="bdf-contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bdf-modal-header bdf-modal-header-plain">
              <h2 className="bdf-modal-title">
                <FaUser size={14} /> Contact Person
              </h2>
              <button className="bdf-modal-close" onClick={closeContactModal}>×</button>
            </div>
            <div className="bdf-modal-body">
              <div className="bdf-grid-2">
                <div>
                  <label className="bdf-label">First Name *</label>
                  <input
                    type="text"
                    value={contactModal.firstName}
                    onChange={(e) => handleContactModalTextChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                    autoComplete="off"
                    className="bdf-input"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="bdf-label">Last Name *</label>
                  <input
                    type="text"
                    value={contactModal.lastName}
                    onChange={(e) => handleContactModalTextChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                    autoComplete="off"
                    className="bdf-input"
                  />
                </div>
              </div>

              <div className="bdf-grid-2">
                <div>
                  <label className="bdf-label">
                    <FaEnvelope size={10} /> Email *
                  </label>
                  <input
                    type="email"
                    value={contactModal.email}
                    onChange={(e) => handleContactModalTextChange("email", e.target.value)}
                    placeholder="Enter email"
                    autoComplete="off"
                    className="bdf-input"
                  />
                </div>
                <div>
                  <label className="bdf-label">
                    <FaPhone size={10} /> Phone *
                  </label>
                  <input
                    type="text"
                    inputMode="tel"
                    value={contactModal.phone}
                    onChange={(e) => handleContactModalTextChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                    autoComplete="off"
                    className="bdf-input"
                  />
                </div>
              </div>

              <div>
                <label className="bdf-label">
                  Department <span className="bdf-label-optional">(optional)</span>
                </label>
                <input
                  type="text"
                  value={contactModal.department}
                  onChange={(e) => handleContactModalTextChange("department", e.target.value)}
                  placeholder="Enter department"
                  autoComplete="off"
                  className="bdf-input"
                />
              </div>

              <div>
                <label className="bdf-label">
                  Remarks <span className="bdf-label-optional">(optional)</span>
                </label>
                <textarea
                  value={contactModal.remarks}
                  onChange={(e) => handleContactModalTextChange("remarks", e.target.value)}
                  placeholder="Enter any remarks about this contact"
                  className="bdf-input bdf-textarea"
                  rows={3}
                />
              </div>

              <div className="bdf-contact-modal-checks">
                <label className="bdf-checkbox-label">
                  <input
                    type="checkbox"
                    className="bdf-checkbox"
                    checked={contactModal.isPrimary}
                    onChange={(e) => handleContactModalCheckChange("isPrimary", e.target.checked)}
                  />
                  Set as Primary Contact
                </label>
                <label className="bdf-checkbox-label">
                  <input
                    type="checkbox"
                    className="bdf-checkbox"
                    checked={contactModal.isBilling}
                    onChange={(e) => handleContactModalCheckChange("isBilling", e.target.checked)}
                  />
                  Billing Contact
                </label>
                <label className="bdf-checkbox-label">
                  <input
                    type="checkbox"
                    className="bdf-checkbox"
                    checked={contactModal.isPurchase}
                    onChange={(e) => handleContactModalCheckChange("isPurchase", e.target.checked)}
                  />
                  Purchase Contact
                </label>
              </div>
            </div>
            <div className="bdf-modal-footer">
              <button type="button" className="bdf-btn-cancel" onClick={closeContactModal}>
                Cancel
              </button>
              <button
                type="button"
                className="bdf-btn-primary"
                onClick={saveContactModal}
                disabled={!contactModalIsValid}
                style={{ opacity: contactModalIsValid ? 1 : 0.6 }}
              >
                <FaSave size={12} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bdf-header-wrap">
        <div className="bdf-header-row">
          <button type="button" onClick={handleBack} className="bdf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="bdf-title">
            {embedContext
              ? `Bank Account — ${embedContext.supplierName || "Supplier"}`
              : isEditMode
              ? "Edit Bank Details"
              : "Add Bank Details"}
          </h1>

          {apiError && (
            <div className="bdf-error-pill">
              <FaExclamationTriangle size={11} />
              {apiError}
            </div>
          )}

          {saveSuccess && (
            <div className="bdf-success-pill">
              <FaCheckCircle size={11} />
              Saved successfully
            </div>
          )}

          {hasAnyErrors && (
            <div className="bdf-error-pill">
              <FaExclamationTriangle size={11} />
              {allValidationErrors.length} field(s) need attention
            </div>
          )}
        </div>
      </div>

      <div className="bdf-container">
        <form onSubmit={handleSubmit} noValidate>
          <div className="bdf-fade-in">
            <div className="bdf-card">

              {embedContext ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "color-mix(in srgb, var(--primary-color, #6366f1) 8%, transparent)",
                    border: "1px solid var(--border-color, #e5e7eb)",
                    fontSize: 12.5,
                    color: "var(--text-secondary, #6b7280)",
                    marginBottom: 16,
                  }}
                >
                  <FaUniversity size={13} style={{ color: "var(--primary-color, #6366f1)", flexShrink: 0 }} />
                  <span>
                    Adding bank account(s) for supplier{" "}
                    <strong style={{ color: "var(--text-primary, #111827)" }}>
                      {embedContext.supplierName || "this supplier"}
                    </strong>
                    .{" "}
                    {isPendingParty
                      ? "These will be saved when you save the supplier."
                      : "These are saved immediately."}
                  </span>
                </div>
              ) : (
                <>
                  <div className="bdf-section-title bdf-section-title-first">
                    <FaUniversity size={12} /> Linked To
                  </div>

                  <div className="bdf-grid-3">
                    <div>
                      <label className="bdf-label">Company *</label>
                      <div className="bdf-field-control">
                        <input
                          type="text"
                          inputMode="numeric"
                          name="company_id"
                          data-field-key="company_id"
                          value={companyId}
                          onChange={handleCompanyIdChange}
                          onBlur={handleCompanyIdBlur}
                          placeholder="Company ID"
                          autoComplete="off"
                          className={`bdf-input bdf-input-has-icon ${
                            getTopLevelStatus("company_id") === "error" ? "bdf-input-error" : ""
                          } ${getTopLevelStatus("company_id") === "valid" ? "bdf-input-valid" : ""}`}
                        />
                        <StatusIcon status={getTopLevelStatus("company_id")} />
                      </div>
                      <FieldFeedback status={getTopLevelStatus("company_id")} error={errors.company_id} hint="Numeric company ID" />
                    </div>
                    <div>
                      <label className="bdf-label">
                        Party Type <span className="bdf-label-optional">(optional)</span>
                      </label>
                      <select
                        name="party_type"
                        value={partyType}
                        onChange={handlePartyTypeChange}
                        className="bdf-input"
                      >
                        <option value="">None</option>
                        <option value="Employee">Employee</option>
                        <option value="Supplier">Supplier</option>
                        <option value="Customer">Customer</option>
                      </select>
                    </div>
                    <div>
                      <label className="bdf-label">
                        Party ID <span className="bdf-label-optional">(optional)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        name="party_id"
                        value={partyId}
                        onChange={handlePartyIdChange}
                        placeholder={partyType ? `${partyType} ID` : "Select party type first"}
                        autoComplete="off"
                        disabled={!partyType}
                        className="bdf-input"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* First bank account — rendered plainly, same as the original single-account form */}
              {renderAccountFields(0)}

              {/* Any extra bank accounts for this party */}
              {accounts.slice(1).map((account, i) => {
                const idx = i + 1;
                return (
                  <div key={account._key} className="bdf-account-card">
                    <div className="bdf-account-card-header">
                      <span className="bdf-account-card-title">
                        <FaUniversity size={12} /> Bank Account #{idx + 1}
                        {account.is_primary && <span className="bdf-primary-badge">Primary</span>}
                      </span>
                      <div className="bdf-account-card-actions">
                        <button
                          type="button"
                          className="bdf-icon-btn"
                          onClick={() => handleDuplicateAccount(idx)}
                          title="Duplicate this account's bank details"
                        >
                          <FaCopy size={12} /> Duplicate
                        </button>
                        <button
                          type="button"
                          className="bdf-icon-btn bdf-icon-btn-danger"
                          onClick={() => handleRemoveAccount(idx)}
                          title="Remove this bank account"
                        >
                          <FaTrashAlt size={12} /> Remove
                        </button>
                      </div>
                    </div>
                    {renderAccountFields(idx)}
                  </div>
                );
              })}

              <button type="button" className="bdf-btn-add-account" onClick={handleAddAccount}>
                <FaPlus size={12} /> Add Another Bank Account
              </button>

            </div>
          </div>

          <div className="bdf-footer-row">
            <button type="button" onClick={handleBack} className="bdf-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bdf-btn-primary bdf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving && <FaSpinner className="bdf-spinning" />}
              <FaSave />{" "}
              {embedContext
                ? accounts.length > 1
                  ? "Save Bank Accounts"
                  : typeof embedContext.editIndex === "number"
                  ? "Update Bank Account"
                  : "Add Bank Account"
                : isEditMode
                ? "Update Bank Details"
                : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsForm;