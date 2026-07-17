// import React, { useState, useEffect } from "react";
// import type { ChangeEvent, FocusEvent, FormEvent } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import {
//   FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
//   FaTimesCircle, FaUniversity, FaCheckCircle,
//   FaFileUpload, FaShieldAlt, FaFilePdf, FaCloudUploadAlt, FaTrashAlt,
//   FaExternalLinkAlt, FaDownload, FaPlus, FaCopy,
// } from "react-icons/fa";
// import "./BankDetailsForm.css";
// import api from "../../src/services/api";

// // ─── interfaces ───────────────────────────────────────────────────────────

// /** One bank account row. A single company may have several of these. */
// interface BankAccountEntry {
//   _key: string; // client-side only, used for React keys / lookups
//   recordId: number | string | null;
//   docName: string | null;

//   account_holder_name: string;
//   account_type: string;

//   bank_name: string;
//   branch_name: string;

//   account_number: string;
//   confirm_account_number: string;
//   currency: string;

//   ifsc_code: string;
//   micr_code: string;
//   swift_code: string;
//   iban: string;

//   upi_id: string;

//   cancelled_cheque: string; // holds the uploaded file's URL once /uploadmedia succeeds
//   passbook_copy: string;

//   verified: boolean;
//   verified_by: string;
//   verified_on: string;

//   is_primary: boolean;

//   remarks: string;

//   // transient, UI-only upload state
//   _cancelledChequeUploading: boolean;
//   _passbookUploading: boolean;
//   _cancelledChequeError: string | null;
//   _passbookError: string | null;
// }

// interface ValidationError {
//   key: string; // "company_id" or "<accountIndex>:<field>"
//   label: string;
//   message: string;
// }

// type FieldStatus = "idle" | "valid" | "error";

// let keyCounter = 0;
// const nextKey = (): string => {
//   keyCounter += 1;
//   return `acct-${Date.now().toString(36)}-${keyCounter}`;
// };

// const defaultAccount = (): BankAccountEntry => ({
//   _key: nextKey(),
//   recordId: null,
//   docName: null,

//   account_holder_name: "",
//   account_type: "Savings",

//   bank_name: "",
//   branch_name: "",

//   account_number: "",
//   confirm_account_number: "",
//   currency: "INR",

//   ifsc_code: "",
//   micr_code: "",
//   swift_code: "",
//   iban: "",

//   upi_id: "",

//   cancelled_cheque: "",
//   passbook_copy: "",

//   verified: false,
//   verified_by: "",
//   verified_on: "",

//   is_primary: false,

//   remarks: "",

//   _cancelledChequeUploading: false,
//   _passbookUploading: false,
//   _cancelledChequeError: null,
//   _passbookError: null,
// });

// const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// const ALLOWED_FILE_TYPE = "application/pdf";

// // Media upload endpoint (see Postman reference: POST /api/uploadmedia,
// // form-data { file, itemID, type }). The backend derives the expected ID
// // field name from `type` (e.g. type="item" -> "itemID"), so for
// // type="account" it expects "accountID" instead.
// //
// // The SAME base path also serves previews: GET /uploadmedia?fileUrl=<url>
// // streams the file back as a blob, so the browser never has to hit MinIO
// // directly (which would otherwise trigger MinIO's own login prompt).
// const UPLOAD_MEDIA_URL = "/uploadmedia";

// // Preview endpoint: GET /api/getimage/account/<accountId>/<fileName>
// // streams the PDF back directly (no fileUrl query param needed), keyed off
// // the same accountId that was used when the file was originally uploaded.
// const GET_IMAGE_BASE_URL = "/getimage/account";

// type UploadFieldName = "cancelled_cheque" | "passbook_copy";

// const fileNameFromUrl = (url: string): string => {
//   try {
//     const clean = url.split("?")[0];
//     const parts = clean.split("/");
//     return decodeURIComponent(parts[parts.length - 1] || url);
//   } catch {
//     return url;
//   }
// };

// const uploadDocumentToServer = async (file: File, accountId: string): Promise<string> => {
//   const fd = new FormData();
//   fd.append("file", file);
//   fd.append("accountID", accountId);
//   fd.append("type", "account");

//   const response = await api.post(UPLOAD_MEDIA_URL, fd);

//   if (response.data?.success !== 1 || !response.data?.fileUrl) {
//     throw new Error(response.data?.message || "File upload failed");
//   }
//   return response.data.fileUrl as string;
// };

// // Field labels for the shared "Linked To" block.
// const TOP_LEVEL_FIELD_LABELS: Record<string, string> = {
//   company_id: "Company",
// };

// // Field labels for fields that live inside each bank account section.
// const ACCOUNT_FIELD_LABELS: Record<string, string> = {
//   account_holder_name: "Account Holder Name",
//   bank_name: "Bank Name",
//   branch_name: "Branch Name",
//   account_number: "Account Number",
//   confirm_account_number: "Confirm Account Number",
//   ifsc_code: "IFSC Code",
// };

// const TOP_LEVEL_VALIDATABLE_FIELDS = Object.keys(TOP_LEVEL_FIELD_LABELS);
// const ACCOUNT_VALIDATABLE_FIELDS = Object.keys(ACCOUNT_FIELD_LABELS);

// const sanitizeTopLevelField = (name: string, value: string): string => {
//   switch (name) {
//     case "company_id":
//     case "party_id":
//       return value.replace(/[^0-9]/g, "").slice(0, 12);
//     default:
//       return value;
//   }
// };

// const sanitizeAccountField = (name: string, value: string): string => {
//   switch (name) {
//     case "account_holder_name":
//       return value.replace(/[^A-Za-z\s.'-]/g, "");
//     case "bank_name":
//       return value.replace(/[^A-Za-z\s.&'-]/g, "").slice(0, 100);
//     case "branch_name":
//       return value.replace(/[^A-Za-z0-9\s.,'-]/g, "").slice(0, 100);
//     case "account_number":
//     case "confirm_account_number":
//       return value.replace(/[^0-9]/g, "").slice(0, 20);
//     case "ifsc_code":
//       return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
//     case "micr_code":
//       return value.replace(/[^0-9]/g, "").slice(0, 9);
//     case "swift_code":
//       return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 11);
//     case "iban":
//       return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 34);
//     default:
//       return value;
//   }
// };

// const validateTopLevelField = (name: string, rawValue: string): string => {
//   const v = (rawValue ?? "").trim();
//   switch (name) {
//     case "company_id":
//       if (!v) return "Company is required";
//       if (!/^\d+$/.test(v)) return "Company must be a valid ID";
//       return "";
//     default:
//       return "";
//   }
// };

// const validateAccountField = (
//   name: string,
//   rawValue: string,
//   account: BankAccountEntry
// ): string => {
//   const v = (rawValue ?? "").trim();

//   switch (name) {
//     case "account_holder_name":
//       if (!v) return "Account Holder Name is required";
//       if (!/^[A-Za-z\s.'-]+$/.test(v)) return "Only letters are allowed";
//       if (v.length < 2) return "Must be at least 2 characters";
//       return "";

//     case "bank_name":
//       if (!v) return "Bank Name is required";
//       if (!/^[A-Za-z\s.&'-]+$/.test(v)) return "Only letters are allowed";
//       if (v.length < 2) return "Must be at least 2 characters";
//       return "";

//     case "branch_name":
//       if (!v) return "Branch Name is required";
//       if (!/^[A-Za-z0-9\s.,'-]+$/.test(v)) return "Only letters and numbers are allowed";
//       return "";

//     case "account_number":
//       if (!v) return "Account Number is required";
//       if (!/^\d+$/.test(v)) return "Only numbers are allowed";
//       if (v.length < 6 || v.length > 20) return "Account Number must be 6–20 digits";
//       return "";

//     case "confirm_account_number":
//       if (!v) return "Please confirm the Account Number";
//       if (!/^\d+$/.test(v)) return "Only numbers are allowed";
//       if (v !== account.account_number.trim()) return "Account numbers do not match";
//       return "";

//     case "ifsc_code":
//       if (!v) return "IFSC Code is required";
//       if (!/^[A-Za-z0-9]+$/.test(v)) return "Only letters and numbers are allowed";
//       if (!IFSC_REGEX.test(v.toUpperCase())) return "Invalid IFSC format (e.g. HDFC0001234)";
//       return "";

//     default:
//       return "";
//   }
// };

// const StatusIcon: React.FC<{ status: FieldStatus }> = ({ status }) => {
//   if (status === "valid") return <FaCheckCircle className="bdf-status-icon bdf-status-icon-valid" />;
//   if (status === "error") return <FaTimesCircle className="bdf-status-icon bdf-status-icon-error" />;
//   return null;
// };

// const FieldFeedback: React.FC<{ status: FieldStatus; error?: string; hint?: string; validText?: string }> = ({
//   status,
//   error,
//   hint,
//   validText,
// }) => {
//   if (status === "error" && error) {
//     return (
//       <span className="bdf-error-text">
//         <FaTimesCircle className="bdf-feedback-icon" size={10} /> {error}
//       </span>
//     );
//   }
//   if (status === "valid") {
//     return (
//       <span className="bdf-valid-text">
//         <FaCheckCircle className="bdf-feedback-icon" size={10} /> {validText || "Looks good"}
//       </span>
//     );
//   }
//   if (hint) {
//     return <span className="bdf-hint-text">{hint}</span>;
//   }
//   return null;
// };

// /**
//  * Preview is fetched through our own backend (GET /getimage/account/<accountId>/<fileName>)
//  * and opened in a NEW BROWSER TAB rather than an inline popup modal.
//  *
//  * Why a new tab instead of a modal:
//  *  - The browser's native PDF viewer handles zoom/print/download/search for
//  *    free — an <embed>/<iframe> inside a modal has to reimplement or forgo
//  *    all of that, and renders inconsistently across browsers.
//  *  - It can never resize or push around the surrounding form, which was a
//  *    real problem this form has already had to work around elsewhere.
//  *
//  * Why we can't just do `window.open(url, '_blank')` directly:
//  *  - The URL requires an auth header (it's proxied through our backend, not
//  *    a public MinIO URL), so it has to be fetched via `api.get(...)` as a
//  *    blob first.
//  *  - `window.open()` called *after* an `await` is no longer considered
//  *    "triggered by a user gesture" by most browsers and gets silently
//  *    popup-blocked. To avoid that we open a blank tab SYNCHRONOUSLY inside
//  *    the click handler, then redirect that tab to the blob URL once the
//  *    fetch resolves.
//  *  - If the browser still blocks the popup (some are stricter than others),
//  *    we show a fallback link the user can click manually, and a separate
//  *    "Download" button that saves the file directly without needing to
//  *    open a new tab at all.
//  */
// const PdfUploadField: React.FC<{
//   fieldId: string;
//   fileUrl: string;
//   accountId: string;
//   uploading: boolean;
//   error: string | null;
//   onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
//   onRemove: () => void;
// }> = ({ fieldId, fileUrl, accountId, uploading, error, onSelect, onRemove }) => {
//   const inputId = `bdf-file-input-${fieldId}`;

//   const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
//   const [previewLoading, setPreviewLoading] = useState(false);
//   const [previewError, setPreviewError] = useState<string | null>(null);
//   const [popupBlocked, setPopupBlocked] = useState(false);
//   const [downloading, setDownloading] = useState(false);

//   // Reset preview state whenever the underlying file changes (new upload,
//   // removal, or loading a different record).
//   useEffect(() => {
//     setPreviewError(null);
//     setPopupBlocked(false);
//     setPreviewBlobUrl((prev) => {
//       if (prev) URL.revokeObjectURL(prev);
//       return null;
//     });
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [fileUrl]);

//   // Revoke the blob URL on unmount so we don't leak memory.
//   useEffect(() => {
//     return () => {
//       if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [previewBlobUrl]);

//   const displayName = fileUrl ? fileNameFromUrl(fileUrl) : "";
//   const hasAttachment = !!fileUrl;

//   /** Fetches the file as a blob (reusing a cached one if we already have it). */
//   const getBlobUrl = async (): Promise<string> => {
//     if (previewBlobUrl) return previewBlobUrl;
//     const fileName = fileNameFromUrl(fileUrl);
//     const response = await api.get(
//       `${GET_IMAGE_BASE_URL}/${encodeURIComponent(accountId)}/${encodeURIComponent(fileName)}`,
//       { responseType: "blob" }
//     );
//     const blobUrl = URL.createObjectURL(response.data);
//     setPreviewBlobUrl(blobUrl);
//     return blobUrl;
//   };

//   const openPreview = async () => {
//     // Open the tab synchronously, in direct response to the click, so the
//     // browser still counts it as user-initiated and won't block it. We
//     // point it at the file itself first (fine even before auth) then swap
//     // it to the blob URL once ready; if it fails we just show a message.
//     const newTab = window.open("", "_blank");
//     if (newTab) {
//       newTab.document.write(
//         "<title>Loading document…</title><body style=\"font-family:sans-serif;padding:40px;color:#555\">Loading document…</body>"
//       );
//     }

//     setPreviewLoading(true);
//     setPreviewError(null);
//     setPopupBlocked(false);

//     try {
//       const blobUrl = await getBlobUrl();
//       if (newTab) {
//         newTab.location.href = blobUrl;
//       } else {
//         // Browser blocked the popup despite opening it synchronously.
//         setPopupBlocked(true);
//       }
//     } catch (err) {
//       console.error("Error fetching preview:", err);
//       if (newTab) newTab.close();
//       setPreviewError("Failed to load preview");
//     } finally {
//       setPreviewLoading(false);
//     }
//   };

//   const downloadFile = async () => {
//     setDownloading(true);
//     setPreviewError(null);
//     try {
//       const blobUrl = await getBlobUrl();
//       const a = document.createElement("a");
//       a.href = blobUrl;
//       a.download = displayName || "document.pdf";
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//     } catch (err) {
//       console.error("Error downloading file:", err);
//       setPreviewError("Failed to download file");
//     } finally {
//       setDownloading(false);
//     }
//   };

//   return (
//     <div>
//       {uploading ? (
//         <div className="bdf-file-dropzone bdf-file-dropzone-uploading">
//           <FaSpinner className="bdf-spinning" />
//           <span className="bdf-file-dropzone-text">Uploading document…</span>
//         </div>
//       ) : hasAttachment ? (
//         <>
//           <div className="bdf-file-chip">
//             <FaFilePdf className="bdf-file-chip-icon" />
//             <span className="bdf-file-chip-name" title={displayName}>
//               {displayName}
//             </span>
//             <button
//               type="button"
//               className="bdf-file-chip-view"
//               onClick={openPreview}
//               disabled={previewLoading}
//               title="Open in new tab"
//             >
//               {previewLoading ? (
//                 <FaSpinner className="bdf-spinning" size={11} />
//               ) : (
//                 <FaExternalLinkAlt size={11} />
//               )}
//             </button>
//             <button
//               type="button"
//               className="bdf-file-chip-view"
//               onClick={downloadFile}
//               disabled={downloading}
//               title="Download"
//             >
//               {downloading ? (
//                 <FaSpinner className="bdf-spinning" size={11} />
//               ) : (
//                 <FaDownload size={11} />
//               )}
//             </button>
//             <button
//               type="button"
//               className="bdf-file-chip-remove"
//               onClick={onRemove}
//               title="Remove file"
//             >
//               <FaTrashAlt size={11} />
//             </button>
//           </div>

//           {popupBlocked && previewBlobUrl && (
//             <span className="bdf-hint-text">
//               Your browser blocked the preview tab.{" "}
//               <a
//                 href={previewBlobUrl}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="bdf-preview-fallback-link"
//               >
//                 Click here to open it
//               </a>
//               , or use Download instead.
//             </span>
//           )}

//           {previewError && (
//             <span className="bdf-error-text">
//               <FaTimesCircle className="bdf-feedback-icon" size={10} /> {previewError}
//             </span>
//           )}
//         </>
//       ) : (
//         <div>
//           <label htmlFor={inputId} className="bdf-file-dropzone">
//             <FaCloudUploadAlt className="bdf-file-dropzone-icon" />
//             <span className="bdf-file-dropzone-text">
//               <strong>Click to select</strong> a PDF (max 5 MB) — uploads immediately
//             </span>
//           </label>
//           <input
//             id={inputId}
//             type="file"
//             accept="application/pdf"
//             onChange={onSelect}
//             className="bdf-file-input-hidden"
//           />
//         </div>
//       )}

//       {error && (
//         <span className="bdf-error-text">
//           <FaTimesCircle className="bdf-feedback-icon" size={10} /> {error}
//         </span>
//       )}
//     </div>
//   );
// };

// const nowAsFrappeDatetime = (): string => {
//   const d = new Date();
//   const pad = (n: number) => String(n).padStart(2, "0");
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
//     d.getHours()
//   )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
// };

// const generateClientDocName = (): string => {
//   const year = new Date().getFullYear();
//   const suffix = Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 36).toString(36);
//   return `BANK-${year}-${suffix}`.toUpperCase();
// };

// const BankDetailsForm: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const isEditMode = !!id && id !== "new";

//   // shared, company-level fields
//   const [companyId, setCompanyId] = useState("");
//   const [partyType, setPartyType] = useState("");
//   const [partyId, setPartyId] = useState("");

//   // one entry per bank account for this company
//   const [accounts, setAccounts] = useState<BankAccountEntry[]>([defaultAccount()]);

//   const [errors, setErrors] = useState<{ [key: string]: string }>({});
//   const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
//   const [saving, setSaving] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   const [showValidationSummary, setShowValidationSummary] = useState(false);
//   const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

//   // ── Workaround for a known Chromium/Windows rendering bug ───────────
//   // After the native OS file-picker dialog (opened by <input type="file">)
//   // closes and focus returns to the tab, Chromium sometimes fails to fully
//   // repaint the page: the area near the dialog redraws, but content below
//   // it is left in a stale/unstyled paint state until something forces a
//   // reflow (e.g. manually scrolling or resizing the window). This is a
//   // browser compositor glitch, not a layout bug — nothing in this
//   // component's CSS is actually broken. Forcing a synchronous reflow on
//   // window focus reliably fixes the stale paint.
//   useEffect(() => {
//     const forceRepaintOnFocus = () => {
//       const el = document.body;
//       const prevDisplay = el.style.display;
//       el.style.display = "none";
//       // eslint-disable-next-line @typescript-eslint/no-unused-expressions
//       el.offsetHeight; // reading a layout property forces a synchronous reflow
//       el.style.display = prevDisplay;
//     };
//     window.addEventListener("focus", forceRepaintOnFocus);
//     return () => window.removeEventListener("focus", forceRepaintOnFocus);
//   }, []);

//   useEffect(() => {
//     if (isEditMode && id) {
//       const state = location.state as { bankDetails?: any };
//       if (state?.bankDetails) {
//         loadBankDetailsIntoForm(state.bankDetails);
//       } else {
//         fetchBankDetailsById(id);
//       }
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [id]);

//   const fetchBankDetailsById = async (bankDetailsId: string) => {
//     try {
//       const response = await api.get(`/bank-detail/${bankDetailsId}?_=${Date.now()}`);
//       console.log("Bank Detail response:", response.data);

//       const record =
//         response.data?.data ??
//         response.data?.result ??
//         response.data;

//       if (response.data?.success === 1 || record) {
//         loadBankDetailsIntoForm(record);
//       } else {
//         setApiError("Failed to load bank details");
//       }
//     } catch (err: any) {
//       console.error("Error fetching bank details:", err);
//       setApiError(err.response?.data?.message || "Failed to load bank details");
//     }
//   };

//   /**
//    * Loads a single bank-detail record (as returned by the backend today) into
//    * the form as the company's first account. If the backend response ever
//    * starts returning an array of sibling accounts for the same company under
//    * e.g. `bd.accounts` / `bd.other_accounts`, those are picked up too.
//    */
//   const loadBankDetailsIntoForm = (bd: any) => {
//     const derivedPartyType = bd.employee_id
//       ? "Employee"
//       : bd.supplier_id
//       ? "Supplier"
//       : bd.customer_id
//       ? "Customer"
//       : "";
//     const derivedPartyId = bd.employee_id ?? bd.supplier_id ?? bd.customer_id ?? "";

//     setCompanyId(bd.company_id !== undefined && bd.company_id !== null ? String(bd.company_id) : "");
//     setPartyType(derivedPartyType);
//     setPartyId(derivedPartyId !== null && derivedPartyId !== undefined ? String(derivedPartyId) : "");

//     const toAccount = (row: any): BankAccountEntry => ({
//       _key: nextKey(),
//       recordId: row.id ?? null,
//       docName: row.name ?? null,

//       account_holder_name: row.account_holder_name || "",
//       account_type: row.account_type || "Savings",

//       bank_name: row.bank_name || "",
//       branch_name: row.branch_name || "",

//       account_number: row.account_number || "",
//       confirm_account_number: row.account_number || "",
//       currency: row.currency || "INR",

//       ifsc_code: row.ifsc_code || "",
//       micr_code: row.micr_code || "",
//       swift_code: row.swift_code || "",
//       iban: row.iban || "",

//       upi_id: row.upi_id || "",

//       cancelled_cheque: row.cancelled_cheque || "",
//       passbook_copy: row.passbook_copy || "",

//       verified: row.verified === undefined ? false : !!row.verified,
//       verified_by: row.verified_by || "",
//       verified_on: row.verified_on || "",

//       is_primary: !!row.is_primary,

//       remarks: row.remarks || "",

//       _cancelledChequeUploading: false,
//       _passbookUploading: false,
//       _cancelledChequeError: null,
//       _passbookError: null,
//     });

//     const siblingRows: any[] = Array.isArray(bd.accounts)
//       ? bd.accounts
//       : Array.isArray(bd.other_accounts)
//       ? bd.other_accounts
//       : [];

//     const allRows = [bd, ...siblingRows.filter((r) => r && r.id !== bd.id)];
//     setAccounts(allRows.map(toAccount));
//   };

//   // ── validation helpers ──────────────────────────────────────────────

//   const getAllValidationErrors = (): ValidationError[] => {
//     const allErrors: ValidationError[] = [];

//     TOP_LEVEL_VALIDATABLE_FIELDS.forEach((field) => {
//       const value = field === "company_id" ? companyId : "";
//       const message = validateTopLevelField(field, value);
//       if (message) {
//         allErrors.push({ key: field, label: TOP_LEVEL_FIELD_LABELS[field], message });
//       }
//     });

//     accounts.forEach((account, idx) => {
//       ACCOUNT_VALIDATABLE_FIELDS.forEach((field) => {
//         const value = (account as any)[field] as string;
//         const message = validateAccountField(field, value, account);
//         if (message) {
//           const prefix = accounts.length > 1 ? `Bank Account ${idx + 1} – ` : "";
//           allErrors.push({
//             key: `${idx}:${field}`,
//             label: `${prefix}${ACCOUNT_FIELD_LABELS[field]}`,
//             message,
//           });
//         }
//       });
//     });

//     return allErrors;
//   };

//   const getTopLevelStatus = (name: string): FieldStatus => {
//     if (errors[name]) return "error";
//     const value = name === "company_id" ? companyId : "";
//     if (touched[name] && value.trim()) return "valid";
//     return "idle";
//   };

//   const getAccountStatus = (idx: number, name: string): FieldStatus => {
//     const key = `${idx}:${name}`;
//     if (errors[key]) return "error";
//     const value = String((accounts[idx] as any)?.[name] ?? "");
//     if (touched[key] && value.trim()) return "valid";
//     return "idle";
//   };

//   const jumpToError = (key: string) => {
//     setShowValidationSummary(false);
//     const el = document.querySelector(`[data-field-key="${key}"]`) as HTMLElement | null;
//     el?.focus();
//   };

//   // ── top-level field handlers ────────────────────────────────────────

//   const handleCompanyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
//     const sanitized = sanitizeTopLevelField("company_id", e.target.value);
//     setCompanyId(sanitized);
//     setTouched((prev) => (prev.company_id ? prev : { ...prev, company_id: true }));
//     setErrors((prev) => ({ ...prev, company_id: validateTopLevelField("company_id", sanitized) }));
//     if (saveSuccess) setSaveSuccess(false);
//   };

//   const handleCompanyIdBlur = () => {
//     setTouched((prev) => ({ ...prev, company_id: true }));
//     setErrors((prev) => ({ ...prev, company_id: validateTopLevelField("company_id", companyId) }));
//   };

//   const handlePartyTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
//     setPartyType(e.target.value);
//     setPartyId("");
//   };

//   const handlePartyIdChange = (e: ChangeEvent<HTMLInputElement>) => {
//     setPartyId(sanitizeTopLevelField("party_id", e.target.value));
//   };

//   // ── per-account field handlers ──────────────────────────────────────

//   const updateAccount = (idx: number, patch: Partial<BankAccountEntry>) => {
//     setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, ...patch } : acc)));
//   };

//   const handleAccountInputChange = (
//     idx: number,
//     e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value, type } = e.target;

//     if (type === "checkbox") {
//       const checked = (e.target as HTMLInputElement).checked;

//       if (name === "is_primary") {
//         // only one account per company can be primary
//         setAccounts((prev) =>
//           prev.map((acc, i) => ({ ...acc, is_primary: i === idx ? checked : checked ? false : acc.is_primary }))
//         );
//         return;
//       }

//       if (name === "verified") {
//         setAccounts((prev) =>
//           prev.map((acc, i) => {
//             if (i !== idx) return acc;
//             if (checked && !acc.verified_on) {
//               return {
//                 ...acc,
//                 verified: true,
//                 verified_on: nowAsFrappeDatetime(),
//                 verified_by: acc.verified_by || "Administrator",
//               };
//             }
//             if (!checked) return { ...acc, verified: false, verified_on: "" };
//             return { ...acc, verified: checked };
//           })
//         );
//         return;
//       }
//     }

//     const sanitized = sanitizeAccountField(name, value);
//     const key = `${idx}:${name}`;

//     setAccounts((prev) => prev.map((acc, i) => (i === idx ? { ...acc, [name]: sanitized } : acc)));

//     if (ACCOUNT_VALIDATABLE_FIELDS.includes(name)) {
//       setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

//       setAccounts((current) => {
//         const updatedAccount = { ...current[idx], [name]: sanitized };
//         const fieldError = validateAccountField(name, sanitized, updatedAccount);
//         setErrors((prevErrors) => {
//           const updatedErrors = { ...prevErrors, [key]: fieldError };
//           if (name === "account_number" && updatedAccount.confirm_account_number) {
//             updatedErrors[`${idx}:confirm_account_number`] = validateAccountField(
//               "confirm_account_number",
//               updatedAccount.confirm_account_number,
//               updatedAccount
//             );
//           }
//           return updatedErrors;
//         });
//         return current;
//       });
//     }

//     if (saveSuccess) setSaveSuccess(false);
//   };

//   const handleAccountBlur = (
//     idx: number,
//     e: FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     if (!ACCOUNT_VALIDATABLE_FIELDS.includes(name)) return;
//     const key = `${idx}:${name}`;
//     setTouched((prev) => ({ ...prev, [key]: true }));
//     const fieldError = validateAccountField(name, value, accounts[idx]);
//     setErrors((prev) => ({ ...prev, [key]: fieldError }));
//   };

//   const handleAddAccount = () => {
//     setAccounts((prev) => [...prev, defaultAccount()]);
//   };

//   const handleDuplicateAccount = (idx: number) => {
//     setAccounts((prev) => {
//       const source = prev[idx];
//       const copy: BankAccountEntry = {
//         ...defaultAccount(),
//         bank_name: source.bank_name,
//         branch_name: source.branch_name,
//         ifsc_code: source.ifsc_code,
//         currency: source.currency,
//         account_type: source.account_type,
//       };
//       const next = [...prev];
//       next.splice(idx + 1, 0, copy);
//       return next;
//     });
//   };

//   const handleRemoveAccount = (idx: number) => {
//     setAccounts((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
//     setErrors((prev) => {
//       const cleaned: { [key: string]: string } = {};
//       Object.entries(prev).forEach(([k, v]) => {
//         if (!k.startsWith(`${idx}:`)) cleaned[k] = v;
//       });
//       return cleaned;
//     });
//   };

//   // ── file handlers (upload happens immediately via /uploadmedia) ────

//   const resolveAccountId = (account: BankAccountEntry): string =>
//     account?.recordId ? String(account.recordId) : companyId.trim() || account?._key || "new";

//   const handleFileSelect = async (idx: number, field: UploadFieldName, e: ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     e.target.value = "";
//     if (!file) return;

//     const errorKey = field === "cancelled_cheque" ? "_cancelledChequeError" : "_passbookError";
//     const uploadingKey = field === "cancelled_cheque" ? "_cancelledChequeUploading" : "_passbookUploading";

//     if (file.type !== ALLOWED_FILE_TYPE) {
//       updateAccount(idx, { [errorKey]: "Only PDF files are allowed" } as any);
//       return;
//     }
//     if (file.size > MAX_FILE_SIZE_BYTES) {
//       updateAccount(idx, { [errorKey]: "File must be under 5 MB" } as any);
//       return;
//     }

//     updateAccount(idx, { [errorKey]: null, [uploadingKey]: true } as any);

//     const account = accounts[idx];
//     const accountId = resolveAccountId(account);

//     try {
//       const fileUrl = await uploadDocumentToServer(file, accountId);
//       updateAccount(idx, { [field]: fileUrl, [uploadingKey]: false, [errorKey]: null } as any);
//     } catch (err: any) {
//       console.error(`Error uploading ${field} for account ${idx}:`, err);
//       updateAccount(idx, {
//         [uploadingKey]: false,
//         [errorKey]: err.message || "Upload failed. Please try again.",
//       } as any);
//     }
//   };

//   const handleRemoveFile = (idx: number, field: UploadFieldName) => {
//     const errorKey = field === "cancelled_cheque" ? "_cancelledChequeError" : "_passbookError";
//     updateAccount(idx, { [field]: "", [errorKey]: null } as any);
//   };

//   // ── payload builders ────────────────────────────────────────────────

//   const buildAccountApiPayload = (account: BankAccountEntry) => {
//     const trimmedPartyId = partyId.trim() ? Number(partyId.trim()) : null;

//     const payload: any = {
//       modified_by: "Administrator",

//       company_id: companyId ? Number(companyId) : null,
//       employee_id: partyType === "Employee" ? trimmedPartyId : null,
//       supplier_id: partyType === "Supplier" ? trimmedPartyId : null,
//       customer_id: partyType === "Customer" ? trimmedPartyId : null,

//       account_holder_name: account.account_holder_name.trim(),
//       account_type: account.account_type,

//       bank_name: account.bank_name.trim(),
//       branch_name: account.branch_name.trim(),
//       account_number: account.account_number.trim(),
//       ifsc_code: account.ifsc_code.trim().toUpperCase(),
//       micr_code: account.micr_code.trim() || null,
//       swift_code: account.swift_code.trim().toUpperCase() || null,
//       iban: account.iban.trim() ? account.iban.trim().toUpperCase() : null,

//       upi_id: account.upi_id || null,
//       currency: account.currency || "INR",

//       // documents are uploaded up-front via /uploadmedia; only their URLs travel here
//       cancelled_cheque: account.cancelled_cheque || null,
//       passbook_copy: account.passbook_copy || null,

//       verified: account.verified ? 1 : 0,
//       verified_by: account.verified ? account.verified_by || "Administrator" : null,
//       verified_on: account.verified ? account.verified_on || nowAsFrappeDatetime() : null,

//       is_primary: account.is_primary ? 1 : 0,
//       is_deleted: 0,

//       remarks: account.remarks || null,

//       created_by: 1,
//       updated_by: 1,
//     };

//     // "name" is the backend's own primary/doc-name column — it's NOT NULL
//     // with no default and no server-side auto-generation, so a value must
//     // be supplied on every insert. On edit we send the record's real docname;
//     // on create we generate one client-side (see generateClientDocName).
//     if (account.docName) {
//       payload.name = account.docName;
//     } else {
//       payload.name = generateClientDocName();
//     }
//     if (account.recordId) payload.id = Number(account.recordId);

//     return payload;
//   };

//   /**
//    * Saves every bank account for this company.
//    *
//    * - Existing accounts (already have a recordId/docName) are updated one at
//    *   a time via PUT /bank-detail/:id, since each edit targets its own
//    *   specific record and there's no batch-update endpoint.
//    * - NEW accounts (added via "Add Another Bank Account") are batched: if
//    *   there's only one, it's posted as a single object exactly as before.
//    *   If there are two or more, they're combined into a single array and
//    *   sent as ONE POST /bank-detail call instead of one call per account.
//    *
//    * Returns a flat list of { response, label } so the caller can check each
//    * result for success/failure and report which account(s) failed.
//    */
//   const saveAllAccounts = async (): Promise<{ response: any; label: string }[]> => {
//     const results: { response: any; label: string }[] = [];

//     const existingAccounts = accounts.filter((a) => !!(a.recordId || a.docName));
//     const newAccounts = accounts.filter((a) => !(a.recordId || a.docName));

//     // Existing accounts: individual updates.
//     for (let i = 0; i < existingAccounts.length; i += 1) {
//       const account = existingAccounts[i];
//       const jsonPayload = buildAccountApiPayload(account);
//       console.log("Updating bank account with payload:", jsonPayload);

//       const response = await api.put(`/bank-detail/${account.docName || account.recordId}`, jsonPayload, {
//         headers: { "Content-Type": "application/json" },
//       });
//       results.push({ response, label: account.bank_name || `account "${account.docName || account.recordId}"` });
//     }

//     // New accounts: batch into one array payload when there's more than one.
//     if (newAccounts.length === 1) {
//       const account = newAccounts[0];
//       const jsonPayload = buildAccountApiPayload(account);
//       console.log("Creating bank account with payload:", jsonPayload);

//       const response = await api.post("/bank-detail", jsonPayload, {
//         headers: { "Content-Type": "application/json" },
//       });
//       results.push({ response, label: account.bank_name || "new account" });
//     } else if (newAccounts.length > 1) {
//       const jsonPayloadArray = newAccounts.map((account) => buildAccountApiPayload(account));
//       console.log(`Creating ${jsonPayloadArray.length} bank accounts in a single batch request:`, jsonPayloadArray);

//       const response = await api.post("/bank-detail", jsonPayloadArray, {
//         headers: { "Content-Type": "application/json" },
//       });
//       results.push({
//         response,
//         label: newAccounts.map((a) => a.bank_name || "new account").join(", "),
//       });
//     }

//     return results;
//   };

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();

//     const allErrors = getAllValidationErrors();
//     if (allErrors.length > 0) {
//       setValidationErrors(allErrors);
//       setShowValidationSummary(true);

//       const fieldErrors: { [key: string]: string } = {};
//       const touchedAll: { [key: string]: boolean } = { company_id: true };
//       accounts.forEach((_, idx) => {
//         ACCOUNT_VALIDATABLE_FIELDS.forEach((f) => {
//           touchedAll[`${idx}:${f}`] = true;
//         });
//       });
//       allErrors.forEach((err) => {
//         fieldErrors[err.key] = err.message;
//       });

//       setTouched((prev) => ({ ...prev, ...touchedAll }));
//       setErrors((prev) => ({ ...prev, ...fieldErrors }));
//       return;
//     }

//     const stillUploading = accounts.some((a) => a._cancelledChequeUploading || a._passbookUploading);
//     if (stillUploading) {
//       setApiError("Please wait for document uploads to finish before saving.");
//       return;
//     }

//     setSaving(true);
//     setApiError(null);
//     setSaveSuccess(false);

//     try {
//       const results = await saveAllAccounts();

//       results.forEach(({ response, label }) => {
//         console.log(`Bank account save response (${label}):`, response.data);

//         if (response.data?.success !== undefined && response.data.success !== 1) {
//           throw new Error(response.data?.message || `Failed to save ${label}`);
//         }
//       });

//       setSaveSuccess(true);
//       navigate("/bank-details");
//     } catch (err: any) {
//       console.error("Error saving bank details:", err);
//       if (err.response) {
//         setApiError(err.response.data?.message || `Server error: ${err.response.status}`);
//       } else if (err.request) {
//         setApiError("Network error. Please check your connection.");
//       } else {
//         setApiError(err.message || "Failed to save bank details");
//       }
//     } finally {
//       setSaving(false);
//     }
//   };

//   const allValidationErrors = getAllValidationErrors();
//   const hasAnyErrors = showValidationSummary && allValidationErrors.length > 0;

//   // ── shared JSX for a single bank account's fields ───────────────────
//   const renderAccountFields = (idx: number) => {
//     const account = accounts[idx];
//     const accountId = resolveAccountId(account);
//     return (
//       <>
//         <div className="bdf-section-title bdf-section-title-first">
//           <FaUniversity size={12} /> Account Holder
//         </div>

//         <div className="bdf-grid-2">
//           <div>
//             <label className="bdf-label">Account Holder Name *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 name="account_holder_name"
//                 data-field-key={`${idx}:account_holder_name`}
//                 value={account.account_holder_name}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="As per bank records"
//                 autoComplete="off"
//                 className={`bdf-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "account_holder_name") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "account_holder_name") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "account_holder_name")} />
//             </div>
//             <FieldFeedback
//               status={getAccountStatus(idx, "account_holder_name")}
//               error={errors[`${idx}:account_holder_name`]}
//               hint="Letters only"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">Account Type *</label>
//             <select
//               name="account_type"
//               value={account.account_type}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               className="bdf-input"
//             >
//               <option value="Savings">Savings</option>
//               <option value="Current">Current</option>
//               <option value="Cash Credit">Cash Credit</option>
//               <option value="Overdraft">Overdraft</option>
//               <option value="NRE">NRE</option>
//               <option value="NRO">NRO</option>
//             </select>
//           </div>
//         </div>

//         <div className="bdf-section-title">
//           <FaUniversity size={12} /> Bank &amp; Account
//         </div>

//         <div className="bdf-grid-2">
//           <div>
//             <label className="bdf-label">Bank Name *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 name="bank_name"
//                 data-field-key={`${idx}:bank_name`}
//                 value={account.bank_name}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="e.g. HDFC Bank"
//                 autoComplete="off"
//                 className={`bdf-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "bank_name") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "bank_name") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "bank_name")} />
//             </div>
//             <FieldFeedback status={getAccountStatus(idx, "bank_name")} error={errors[`${idx}:bank_name`]} hint="Letters only" />
//           </div>
//           <div>
//             <label className="bdf-label">Branch Name *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 name="branch_name"
//                 data-field-key={`${idx}:branch_name`}
//                 value={account.branch_name}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="e.g. MG Road Branch"
//                 autoComplete="off"
//                 className={`bdf-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "branch_name") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "branch_name") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "branch_name")} />
//             </div>
//             <FieldFeedback
//               status={getAccountStatus(idx, "branch_name")}
//               error={errors[`${idx}:branch_name`]}
//               hint="Letters and numbers"
//             />
//           </div>
//         </div>

//         <div className="bdf-grid-2">
//           <div>
//             <label className="bdf-label">Account Number *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 name="account_number"
//                 data-field-key={`${idx}:account_number`}
//                 value={account.account_number}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="Enter account number"
//                 autoComplete="off"
//                 maxLength={20}
//                 className={`bdf-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "account_number") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "account_number") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "account_number")} />
//             </div>
//             <FieldFeedback
//               status={getAccountStatus(idx, "account_number")}
//               error={errors[`${idx}:account_number`]}
//               hint="Numbers only, 6–20 digits"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">Confirm Account Number *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 name="confirm_account_number"
//                 data-field-key={`${idx}:confirm_account_number`}
//                 value={account.confirm_account_number}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="Re-enter account number"
//                 autoComplete="off"
//                 maxLength={20}
//                 className={`bdf-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "confirm_account_number") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "confirm_account_number") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "confirm_account_number")} />
//             </div>
//             <FieldFeedback
//               status={getAccountStatus(idx, "confirm_account_number")}
//               error={errors[`${idx}:confirm_account_number`]}
//               hint="Numbers only"
//               validText="Matches"
//             />
//           </div>
//         </div>

//         <div className="bdf-section-title">
//           <FaUniversity size={12} /> Codes &amp; Currency
//         </div>

//         <div className="bdf-grid-3">
//           <div>
//             <label className="bdf-label">IFSC Code *</label>
//             <div className="bdf-field-control">
//               <input
//                 type="text"
//                 name="ifsc_code"
//                 data-field-key={`${idx}:ifsc_code`}
//                 value={account.ifsc_code}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 onBlur={(e) => handleAccountBlur(idx, e)}
//                 placeholder="e.g. HDFC0001234"
//                 autoComplete="off"
//                 maxLength={11}
//                 className={`bdf-input bdf-uppercase-input bdf-input-has-icon ${
//                   getAccountStatus(idx, "ifsc_code") === "error" ? "bdf-input-error" : ""
//                 } ${getAccountStatus(idx, "ifsc_code") === "valid" ? "bdf-input-valid" : ""}`}
//               />
//               <StatusIcon status={getAccountStatus(idx, "ifsc_code")} />
//             </div>
//             <FieldFeedback
//               status={getAccountStatus(idx, "ifsc_code")}
//               error={errors[`${idx}:ifsc_code`]}
//               hint="4 letters + 0 + 6 alphanumeric"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">
//               MICR Code <span className="bdf-label-optional">(optional)</span>
//             </label>
//             <input
//               type="text"
//               inputMode="numeric"
//               name="micr_code"
//               value={account.micr_code}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               placeholder="9-digit MICR"
//               autoComplete="off"
//               maxLength={9}
//               className="bdf-input"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">
//               SWIFT Code <span className="bdf-label-optional">(optional)</span>
//             </label>
//             <input
//               type="text"
//               name="swift_code"
//               value={account.swift_code}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               placeholder="e.g. HDFCINBB"
//               autoComplete="off"
//               maxLength={11}
//               className="bdf-input bdf-uppercase-input"
//             />
//           </div>
//         </div>

//         <div className="bdf-grid-3">
//           <div>
//             <label className="bdf-label">
//               IBAN <span className="bdf-label-optional">(optional)</span>
//             </label>
//             <input
//               type="text"
//               name="iban"
//               value={account.iban}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               placeholder="International account number"
//               autoComplete="off"
//               maxLength={34}
//               className="bdf-input bdf-uppercase-input"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">
//               UPI ID <span className="bdf-label-optional">(optional)</span>
//             </label>
//             <input
//               type="text"
//               name="upi_id"
//               value={account.upi_id}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               placeholder="e.g. name@bank"
//               autoComplete="off"
//               className="bdf-input"
//             />
//           </div>
//           <div>
//             <label className="bdf-label">Currency</label>
//             <select
//               name="currency"
//               value={account.currency}
//               onChange={(e) => handleAccountInputChange(idx, e)}
//               className="bdf-input"
//             >
//               <option value="INR">INR</option>
//               <option value="USD">USD</option>
//               <option value="EUR">EUR</option>
//               <option value="GBP">GBP</option>
//               <option value="AED">AED</option>
//             </select>
//           </div>
//         </div>

//         <div className="bdf-section-title">
//           <FaFileUpload size={12} /> Documents
//         </div>

//         <div className="bdf-grid-2">
//           <div>
//             <label className="bdf-label">
//               Cancelled Cheque <span className="bdf-label-optional">(PDF, optional)</span>
//             </label>
//             <PdfUploadField
//               fieldId={`${account._key}-cancelled_cheque`}
//               fileUrl={account.cancelled_cheque}
//               accountId={accountId}
//               uploading={account._cancelledChequeUploading}
//               error={account._cancelledChequeError}
//               onSelect={(e) => handleFileSelect(idx, "cancelled_cheque", e)}
//               onRemove={() => handleRemoveFile(idx, "cancelled_cheque")}
//             />
//           </div>
//           <div>
//             <label className="bdf-label">
//               Passbook Copy <span className="bdf-label-optional">(PDF, optional)</span>
//             </label>
//             <PdfUploadField
//               fieldId={`${account._key}-passbook_copy`}
//               fileUrl={account.passbook_copy}
//               accountId={accountId}
//               uploading={account._passbookUploading}
//               error={account._passbookError}
//               onSelect={(e) => handleFileSelect(idx, "passbook_copy", e)}
//               onRemove={() => handleRemoveFile(idx, "passbook_copy")}
//             />
//           </div>
//         </div>

//         <div className="bdf-section-title">
//           <FaShieldAlt size={12} /> Verification &amp; Status
//         </div>

//         <div className="bdf-grid-2 bdf-mb-20">
//           <div className="bdf-checkbox-row">
//             <label className="bdf-checkbox-label">
//               <input
//                 type="checkbox"
//                 name="verified"
//                 checked={account.verified}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 className="bdf-checkbox"
//               />
//               Mark this bank account as verified
//             </label>
//           </div>
//           <div className="bdf-checkbox-row">
//             <label className="bdf-checkbox-label">
//               <input
//                 type="checkbox"
//                 name="is_primary"
//                 checked={account.is_primary}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 className="bdf-checkbox"
//               />
//               Set as primary bank account
//             </label>
//           </div>
//         </div>

//         {account.verified && (
//           <div className="bdf-grid-2">
//             <div>
//               <label className="bdf-label">Verified By</label>
//               <input
//                 type="text"
//                 name="verified_by"
//                 value={account.verified_by}
//                 onChange={(e) => handleAccountInputChange(idx, e)}
//                 placeholder="Administrator"
//                 autoComplete="off"
//                 className="bdf-input"
//               />
//             </div>
//             <div>
//               <label className="bdf-label">Verified On</label>
//               <input
//                 type="text"
//                 name="verified_on"
//                 value={account.verified_on}
//                 readOnly
//                 className="bdf-input"
//               />
//             </div>
//           </div>
//         )}

//         <div className="bdf-field-block">
//           <label className="bdf-label">
//             Remarks <span className="bdf-label-optional">(optional)</span>
//           </label>
//           <textarea
//             name="remarks"
//             value={account.remarks}
//             onChange={(e) => handleAccountInputChange(idx, e)}
//             placeholder="Any additional notes about this bank account"
//             rows={3}
//             className="bdf-input bdf-textarea"
//           />
//         </div>
//       </>
//     );
//   };

//   return (
//     <div className="bdf-page">

//       {showValidationSummary && validationErrors.length > 0 && (
//         <div className="bdf-modal-overlay" onClick={() => setShowValidationSummary(false)}>
//           <div className="bdf-validation-modal" onClick={(e) => e.stopPropagation()}>
//             <div className="bdf-modal-header">
//               <h2 className="bdf-modal-title-warning">
//                 <FaExclamationTriangle /> Missing or Invalid Fields
//               </h2>
//               <button className="bdf-modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
//             </div>
//             <div className="bdf-modal-body">
//               <p className="bdf-modal-intro">
//                 Please fix the following fields before submitting:
//               </p>
//               <div className="bdf-error-list">
//                 {validationErrors.map((error, idx) => (
//                   <div key={idx} className="bdf-validation-error-item" onClick={() => jumpToError(error.key)}>
//                     <div className="bdf-error-header">
//                       <FaTimesCircle className="bdf-error-icon" />
//                       <strong className="bdf-error-label">{error.label}</strong>
//                     </div>
//                     <div className="bdf-error-message">{error.message}</div>
//                   </div>
//                 ))}
//               </div>
//               <div className="bdf-hint-banner">
//                 <FaInfoCircle className="bdf-hint-icon" />
//                 Click on any error to jump to that field
//               </div>
//             </div>
//             <div className="bdf-modal-footer">
//               <button className="bdf-btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="bdf-header-wrap">
//         <div className="bdf-header-row">
//           <button type="button" onClick={() => navigate("/bank-details")} className="bdf-back-btn">
//             <FaArrowLeft size={12} /> Back
//           </button>
//           <h1 className="bdf-title">
//             {isEditMode ? "Edit Bank Details" : "Add Bank Details"}
//           </h1>

//           {apiError && (
//             <div className="bdf-error-pill">
//               <FaExclamationTriangle size={11} />
//               {apiError}
//             </div>
//           )}

//           {saveSuccess && (
//             <div className="bdf-success-pill">
//               <FaCheckCircle size={11} />
//               Saved successfully
//             </div>
//           )}

//           {hasAnyErrors && (
//             <div className="bdf-error-pill">
//               <FaExclamationTriangle size={11} />
//               {allValidationErrors.length} field(s) need attention
//             </div>
//           )}
//         </div>
//       </div>

//       <div className="bdf-container">
//         <form onSubmit={handleSubmit} noValidate>
//           <div className="bdf-fade-in">
//             <div className="bdf-card">

//               <div className="bdf-section-title bdf-section-title-first">
//                 <FaUniversity size={12} /> Linked To
//               </div>

//               <div className="bdf-grid-3">
//                 <div>
//                   <label className="bdf-label">Company *</label>
//                   <div className="bdf-field-control">
//                     <input
//                       type="text"
//                       inputMode="numeric"
//                       name="company_id"
//                       data-field-key="company_id"
//                       value={companyId}
//                       onChange={handleCompanyIdChange}
//                       onBlur={handleCompanyIdBlur}
//                       placeholder="Company ID"
//                       autoComplete="off"
//                       className={`bdf-input bdf-input-has-icon ${
//                         getTopLevelStatus("company_id") === "error" ? "bdf-input-error" : ""
//                       } ${getTopLevelStatus("company_id") === "valid" ? "bdf-input-valid" : ""}`}
//                     />
//                     <StatusIcon status={getTopLevelStatus("company_id")} />
//                   </div>
//                   <FieldFeedback status={getTopLevelStatus("company_id")} error={errors.company_id} hint="Numeric company ID" />
//                 </div>
//                 <div>
//                   <label className="bdf-label">
//                     Party Type <span className="bdf-label-optional">(optional)</span>
//                   </label>
//                   <select
//                     name="party_type"
//                     value={partyType}
//                     onChange={handlePartyTypeChange}
//                     className="bdf-input"
//                   >
//                     <option value="">None</option>
//                     <option value="Employee">Employee</option>
//                     <option value="Supplier">Supplier</option>
//                     <option value="Customer">Customer</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="bdf-label">
//                     Party ID <span className="bdf-label-optional">(optional)</span>
//                   </label>
//                   <input
//                     type="text"
//                     inputMode="numeric"
//                     name="party_id"
//                     value={partyId}
//                     onChange={handlePartyIdChange}
//                     placeholder={partyType ? `${partyType} ID` : "Select party type first"}
//                     autoComplete="off"
//                     disabled={!partyType}
//                     className="bdf-input"
//                   />
//                 </div>
//               </div>

//               {/* First bank account — rendered plainly, same as the original single-account form */}
//               {renderAccountFields(0)}

//               {/* Any extra bank accounts added for this company */}
//               {accounts.slice(1).map((account, i) => {
//                 const idx = i + 1;
//                 return (
//                   <div key={account._key} className="bdf-account-card">
//                     <div className="bdf-account-card-header">
//                       <span className="bdf-account-card-title">
//                         <FaUniversity size={12} /> Bank Account #{idx + 1}
//                         {account.is_primary && <span className="bdf-primary-badge">Primary</span>}
//                       </span>
//                       <div className="bdf-account-card-actions">
//                         <button
//                           type="button"
//                           className="bdf-icon-btn"
//                           onClick={() => handleDuplicateAccount(idx)}
//                           title="Duplicate this account's bank details"
//                         >
//                           <FaCopy size={12} /> Duplicate
//                         </button>
//                         <button
//                           type="button"
//                           className="bdf-icon-btn bdf-icon-btn-danger"
//                           onClick={() => handleRemoveAccount(idx)}
//                           title="Remove this bank account"
//                         >
//                           <FaTrashAlt size={12} /> Remove
//                         </button>
//                       </div>
//                     </div>
//                     {renderAccountFields(idx)}
//                   </div>
//                 );
//               })}

//               <button type="button" className="bdf-btn-add-account" onClick={handleAddAccount}>
//                 <FaPlus size={12} /> Add Another Bank Account
//               </button>

//             </div>
//           </div>

//           <div className="bdf-footer-row">
//             <button type="button" onClick={() => navigate("/bank-details")} className="bdf-btn-secondary">
//               Cancel
//             </button>
//             <button type="submit" disabled={saving} className="bdf-btn-primary bdf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
//               {saving && <FaSpinner className="bdf-spinning" />}
//               <FaSave /> {isEditMode ? "Update Bank Details" : "Save Bank Details"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default BankDetailsForm;

import React, { useState, useEffect } from "react";
import type { ChangeEvent, FocusEvent, FormEvent } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FaArrowLeft, FaSave, FaSpinner, FaInfoCircle, FaExclamationTriangle,
  FaTimesCircle, FaUniversity, FaCheckCircle,
  FaFileUpload, FaShieldAlt, FaFilePdf, FaCloudUploadAlt, FaTrashAlt,
  FaExternalLinkAlt, FaDownload, FaPlus, FaCopy,
} from "react-icons/fa";
import "./BankDetailsForm.css";
import api from "../../src/services/api";

// ─── interfaces ───────────────────────────────────────────────────────────

/** One bank account row. A single company may have several of these. */
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

  _cancelledChequeUploading: false,
  _passbookUploading: false,
  _cancelledChequeError: null,
  _passbookError: null,
});

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPE = "application/pdf";

// Media upload endpoint (see Postman reference: POST /api/uploadmedia,
// form-data { file, itemID, type }). The backend derives the expected ID
// field name from `type` (e.g. type="item" -> "itemID"), so for
// type="account" it expects "accountID" instead.
//
// The SAME base path also serves previews: GET /uploadmedia?fileUrl=<url>
// streams the file back as a blob, so the browser never has to hit MinIO
// directly (which would otherwise trigger MinIO's own login prompt).
const UPLOAD_MEDIA_URL = "/uploadmedia";

// Preview endpoint: GET /api/getimage/account/<accountId>/<fileName>
// streams the PDF back directly (no fileUrl query param needed), keyed off
// the same accountId that was used when the file was originally uploaded.
const GET_IMAGE_BASE_URL = "/getimage/account";

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

/**
 * Preview is fetched through our own backend (GET /getimage/account/<accountId>/<fileName>)
 * and opened in a NEW BROWSER TAB rather than an inline popup modal.
 *
 * Why a new tab instead of a modal:
 *  - The browser's native PDF viewer handles zoom/print/download/search for
 *    free — an <embed>/<iframe> inside a modal has to reimplement or forgo
 *    all of that, and renders inconsistently across browsers.
 *  - It can never resize or push around the surrounding form, which was a
 *    real problem this form has already had to work around elsewhere.
 *
 * Why we can't just do `window.open(url, '_blank')` directly:
 *  - The URL requires an auth header (it's proxied through our backend, not
 *    a public MinIO URL), so it has to be fetched via `api.get(...)` as a
 *    blob first.
 *  - `window.open()` called *after* an `await` is no longer considered
 *    "triggered by a user gesture" by most browsers and gets silently
 *    popup-blocked. To avoid that we open a blank tab SYNCHRONOUSLY inside
 *    the click handler, then redirect that tab to the blob URL once the
 *    fetch resolves.
 *  - If the browser still blocks the popup (some are stricter than others),
 *    we show a fallback link the user can click manually, and a separate
 *    "Download" button that saves the file directly without needing to
 *    open a new tab at all.
 */
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

  // Reset preview state whenever the underlying file changes (new upload,
  // removal, or loading a different record).
  useEffect(() => {
    setPreviewError(null);
    setPopupBlocked(false);
    setPreviewBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl]);

  // Revoke the blob URL on unmount so we don't leak memory.
  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Open the tab synchronously, in direct response to the click, so the
    // browser still counts it as user-initiated and won't block it. We
    // point it at the file itself first (fine even before auth) then swap
    // it to the blob URL once ready; if it fails we just show a message.
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

  // shared, company-level fields
  const [companyId, setCompanyId] = useState("");
  const [partyType, setPartyType] = useState("");
  const [partyId, setPartyId] = useState("");

  // one entry per bank account for this company
  const [accounts, setAccounts] = useState<BankAccountEntry[]>([defaultAccount()]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // ── Workaround for a known Chromium/Windows rendering bug ───────────
  // After the native OS file-picker dialog (opened by <input type="file">)
  // closes and focus returns to the tab, Chromium sometimes fails to fully
  // repaint the page: the area near the dialog redraws, but content below
  // it is left in a stale/unstyled paint state until something forces a
  // reflow (e.g. manually scrolling or resizing the window). This is a
  // browser compositor glitch, not a layout bug — nothing in this
  // component's CSS is actually broken. Forcing a synchronous reflow on
  // window focus reliably fixes the stale paint.
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
    if (isEditMode && id) {
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

  /**
   * Loads a single bank-detail record (as returned by the backend today) into
   * the form as the company's first account. If the backend response ever
   * starts returning an array of sibling accounts for the same company under
   * e.g. `bd.accounts` / `bd.other_accounts`, those are picked up too.
   */
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

    TOP_LEVEL_VALIDATABLE_FIELDS.forEach((field) => {
      const value = field === "company_id" ? companyId : "";
      const message = validateTopLevelField(field, value);
      if (message) {
        allErrors.push({ key: field, label: TOP_LEVEL_FIELD_LABELS[field], message });
      }
    });

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

  // ── file handlers (upload happens immediately via /uploadmedia) ────

  const resolveAccountId = (account: BankAccountEntry): string =>
    account?.recordId ? String(account.recordId) : companyId.trim() || account?._key || "new";

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

  /**
   * Payload for a SINGLE bank account, used for:
   *  - updating an existing account (PUT /bank-detail/:id)
   *  - creating exactly one new account (POST /bank-detail)
   * Carries the company/party linkage fields alongside the account's own
   * fields, since those endpoints expect one flat object per account.
   */
  const buildAccountApiPayload = (account: BankAccountEntry) => {
    const trimmedPartyId = partyId.trim() ? Number(partyId.trim()) : null;

    const payload: any = {
      modified_by: "Administrator",

      company_id: companyId ? Number(companyId) : null,
      employee_id: partyType === "Employee" ? trimmedPartyId : null,
      supplier_id: partyType === "Supplier" ? trimmedPartyId : null,
      customer_id: partyType === "Customer" ? trimmedPartyId : null,

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

      created_by: 1,
      updated_by: 1,
    };

    // "name" is the backend's own primary/doc-name column — it's NOT NULL
    // with no default and no server-side auto-generation, so a value must
    // be supplied on every insert. On edit we send the record's real docname;
    // on create we generate one client-side (see generateClientDocName).
    if (account.docName) {
      payload.name = account.docName;
    } else {
      payload.name = generateClientDocName();
    }
    if (account.recordId) payload.id = Number(account.recordId);

    return payload;
  };

  /**
   * Payload for ONE ENTRY inside a batch `bank_details` array. Unlike
   * buildAccountApiPayload, this does NOT repeat the company/party linkage
   * fields (those live once at the top level of the batch payload) and does
   * NOT send `name`/`id`, since batch creation is for brand-new accounts
   * only and the backend is expected to assign docnames for the whole batch
   * itself.
   */
  const buildAccountBatchEntry = (account: BankAccountEntry) => ({
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

    cancelled_cheque: account.cancelled_cheque || null,
    passbook_copy: account.passbook_copy || null,

    verified: account.verified ? 1 : 0,
    verified_by: account.verified ? account.verified_by || "Administrator" : null,
    verified_on: account.verified ? account.verified_on || nowAsFrappeDatetime() : null,

    is_primary: account.is_primary ? 1 : 0,
    remarks: account.remarks || null,
  });

  /**
   * Saves every bank account for this company.
   *
   * - Existing accounts (already have a recordId/docName) are updated one at
   *   a time via PUT /bank-detail/:id, since each edit targets its own
   *   specific record and there's no batch-update endpoint.
   * - NEW accounts (added via "Add Another Bank Account") are batched: if
   *   there's only one, it's posted as a single flat object exactly as
   *   before (buildAccountApiPayload). If there are two or more, they're
   *   sent as ONE POST /bank-detail call with the company/party linkage
   *   fields at the top level and each account's own fields nested under
   *   a `bank_details` array, e.g.:
   *     {
   *       company_id, employee_id, supplier_id, customer_id,
   *       created_by, updated_by,
   *       bank_details: [ { account_holder_name, bank_name, ... }, ... ]
   *     }
   *
   * Returns a flat list of { response, label } so the caller can check each
   * result for success/failure and report which account(s) failed.
   */
  const saveAllAccounts = async (): Promise<{ response: any; label: string }[]> => {
    const results: { response: any; label: string }[] = [];

    const existingAccounts = accounts.filter((a) => !!(a.recordId || a.docName));
    const newAccounts = accounts.filter((a) => !(a.recordId || a.docName));

    // Existing accounts: individual updates.
    for (let i = 0; i < existingAccounts.length; i += 1) {
      const account = existingAccounts[i];
      const jsonPayload = buildAccountApiPayload(account);
      console.log("Updating bank account with payload:", jsonPayload);

      const response = await api.put(`/bank-detail/${account.docName || account.recordId}`, jsonPayload, {
        headers: { "Content-Type": "application/json" },
      });
      results.push({ response, label: account.bank_name || `account "${account.docName || account.recordId}"` });
    }

    // New accounts: single object as before, or batched into `bank_details`
    // when there's more than one.
    if (newAccounts.length === 1) {
      const account = newAccounts[0];
      const jsonPayload = buildAccountApiPayload(account);
      console.log("Creating bank account with payload:", jsonPayload);

      const response = await api.post("/bank-detail", jsonPayload, {
        headers: { "Content-Type": "application/json" },
      });
      results.push({ response, label: account.bank_name || "new account" });
    } else if (newAccounts.length > 1) {
      const trimmedPartyId = partyId.trim() ? Number(partyId.trim()) : null;

      const batchPayload = {
        company_id: companyId ? Number(companyId) : null,
        employee_id: partyType === "Employee" ? trimmedPartyId : null,
        supplier_id: partyType === "Supplier" ? trimmedPartyId : null,
        customer_id: partyType === "Customer" ? trimmedPartyId : null,
        created_by: 1,
        updated_by: 1,
        bank_details: newAccounts.map((account) => buildAccountBatchEntry(account)),
      };

      console.log(
        `Creating ${newAccounts.length} bank accounts in a single batch request:`,
        batchPayload
      );

      const response = await api.post("/bank-detail", batchPayload, {
        headers: { "Content-Type": "application/json" },
      });
      results.push({
        response,
        label: newAccounts.map((a) => a.bank_name || "new account").join(", "),
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
      const touchedAll: { [key: string]: boolean } = { company_id: true };
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

    setSaving(true);
    setApiError(null);
    setSaveSuccess(false);

    try {
      const results = await saveAllAccounts();

      results.forEach(({ response, label }) => {
        console.log(`Bank account save response (${label}):`, response.data);

        if (response.data?.success !== undefined && response.data.success !== 1) {
          throw new Error(response.data?.message || `Failed to save ${label}`);
        }
      });

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

        {/* <div className="bdf-field-block">
          <label className="bdf-label">
            Remarks <span className="bdf-label-optional">(optional)</span>
          </label>
          <textarea
            name="remarks"
            value={account.remarks}
            onChange={(e) => handleAccountInputChange(idx, e)}
            placeholder="Any additional notes about this bank account"
            rows={3}
            className="bdf-input bdf-textarea"
          />
        </div> */}
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

      <div className="bdf-header-wrap">
        <div className="bdf-header-row">
          <button type="button" onClick={() => navigate("/bank-details")} className="bdf-back-btn">
            <FaArrowLeft size={12} /> Back
          </button>
          <h1 className="bdf-title">
            {isEditMode ? "Edit Bank Details" : "Add Bank Details"}
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

              {/* First bank account — rendered plainly, same as the original single-account form */}
              {renderAccountFields(0)}

              {/* Any extra bank accounts added for this company */}
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
            <button type="button" onClick={() => navigate("/bank-details")} className="bdf-btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="bdf-btn-primary bdf-btn-submit" style={{ opacity: saving ? 0.6 : 1 }}>
              {saving && <FaSpinner className="bdf-spinning" />}
              <FaSave /> {isEditMode ? "Update Bank Details" : "Save Bank Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BankDetailsForm;