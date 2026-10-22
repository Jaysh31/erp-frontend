import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import "./DebitForm.css";
import api from "../services/api";

/* ----------------------------- Interfaces ----------------------------- */

interface Party {
  id: number;
  name: string;
  display_name: string;
  group?: string;
}

interface NewPartyFormData {
  customer_name: string; // Used for both supplier_name and customer_name payloads
  territory: string;
  email_id: string;
  mobile_no: string;
  customer_primary_address: string;
  primary_address: string;
}

interface BankDetails {
  id: number;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  micr_code: string | null;
  swift_code: string | null;
  iban: string | null;
  upi_id: string | null;
  currency: string;
  opening_balance: number;
  verified: number;
  is_primary: number;
}

interface Company {
  id: number;
  company_name: string;
  abbr: string;
  default_currency: string;
  country: string;
  bank_details: BankDetails[];
}

interface ReferenceRecord {
  id: number;
  refNo: string;
  grandTotal: number;
  date: string;
  party: string;
  partyName: string;
  company: string;
  currency: string;
}

type EntryType = "Credit" | "Debit";
type PartyType = "Supplier" | "Customer";
/* ✅ "Miscellaneous" renamed to "General" */
type SupplierRefType = "Purchase Bill" | "Purchase Order" | "General";
type CustomerRefType = "Sales Invoice" | "Sales Order" | "General";
type ReferenceType = SupplierRefType | CustomerRefType;

interface GAEFormData {
  entryDate: string;
  entryType: EntryType;

  companyId: number | "";
  bankId: number | "";

  partyType: PartyType;
  partyId: number | "";
  partyName: string;

  referenceType: ReferenceType;
  referenceId: number | "";
  referenceNo: string;
  referenceDate: string;
  grandTotal: number | "";

  // free-text for General reference type
  miscReference: string;

  paymentType: string;
  transactionId: string;
  transactionDate: string;

  amount: string;
  narration: string;
}

/* ----------------------------- Constants ------------------------------ */

/* ✅ Default reference type is now "General" */
const initialFormData: GAEFormData = {
  entryDate: new Date().toISOString().split("T")[0],
  entryType: "Debit",

  companyId: "",
  bankId: "",

  partyType: "Supplier",
  partyId: "",
  partyName: "",

  referenceType: "General",
  referenceId: "",
  referenceNo: "",
  referenceDate: "",
  grandTotal: "",

  miscReference: "",

  paymentType: "NEFT",
  transactionId: "",
  transactionDate: new Date().toISOString().split("T")[0],

  amount: "",
  narration: "",
};

const initialNewParty: NewPartyFormData = {
  customer_name: "",
  territory: "",
  email_id: "",
  mobile_no: "",
  customer_primary_address: "",
  primary_address: "",
};

const TRANSFER_MODES = [
  { value: "NEFT", label: "NEFT" },
  { value: "IMPS", label: "IMPS" },
  { value: "RTGS", label: "RTGS" },
  { value: "SWIFT", label: "SWIFT" },
  { value: "Net Banking", label: "Net Banking" },
  { value: "Card Payment", label: "Card Payment" },
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Cheque", label: "Cheque" },
  { value: "Other", label: "Other" },
];

/* ✅ Supplier ref types: General first, then Purchase Bill / Purchase Order */
const SUPPLIER_REF_TYPES: SupplierRefType[] = [
  "General",
  "Purchase Bill",
  "Purchase Order",
];

/* ✅ Customer ref types: General first, then Sales Invoice / Sales Order */
const CUSTOMER_REF_TYPES: CustomerRefType[] = [
  "General",
  "Sales Invoice",
  "Sales Order",
];

const ENTRY_TYPES: EntryType[] = ["Debit", "Credit"];
const PARTY_TYPES: PartyType[] = ["Supplier", "Customer"];

/* ----------------------------- Helpers -------------------------------- */

const toYMD = (value: string | Date | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const safeLower = (v: unknown): string =>
  v === null || v === undefined ? "" : String(v).toLowerCase();

const formatMoney = (v: unknown): string => {
  const n = Number(v);
  if (!isFinite(n)) return "—";
  return n.toLocaleString("en-IN");
};

const normalizeReference = (
  raw: any,
  refType: ReferenceType
): ReferenceRecord => {
  const isOrder =
    refType === "Purchase Order" || refType === "Sales Order";
  const isSupplierDoc =
    refType === "Purchase Bill" || refType === "Purchase Order";

  let refNo = "";
  if (isOrder) {
    refNo = String(raw?.name ?? (raw?.id != null ? `ORD-${raw.id}` : ""));
  } else {
    const prefix = (raw?.naming_series ?? "").toString();
    if (raw?.name && raw.name !== prefix.replace(/-$/, "")) {
      refNo = `${raw.name}`;
    } else if (prefix) {
      refNo = `${prefix}${raw?.id ?? ""}`;
    } else {
      refNo = `DOC-${raw?.id ?? ""}`;
    }
  }

  const total =
    raw?.grand_total ??
    raw?.rounded_total ??
    raw?.total ??
    raw?.net_total ??
    0;

  const date = isOrder
    ? raw?.transaction_date ?? raw?.schedule_date ?? ""
    : raw?.posting_date ?? raw?.date ?? "";

  const party = isSupplierDoc
    ? raw?.supplier ?? ""
    : raw?.customer ??
      (raw?.customer_id != null ? String(raw.customer_id) : "");

  return {
    id: Number(raw?.id ?? 0),
    refNo,
    grandTotal: Number(total) || 0,
    date: String(date),
    party: String(party ?? ""),
    partyName: String(
      isSupplierDoc ? raw?.supplier_name ?? "" : raw?.customer_name ?? ""
    ),
    company: String(raw?.company ?? ""),
    currency: String(raw?.currency ?? "INR"),
  };
};

const referenceEndpoint = (refType: ReferenceType): string | null => {
  switch (refType) {
    case "Purchase Bill":
      return "/purchase-invoice?page=1&limit=10000";
    case "Purchase Order":
      return "/purchase-order?page=1&limit=10";
    case "Sales Invoice":
      return "/sales-invoice?page=1&limit=10";
    case "Sales Order":
      return "/sales-order?page=1&limit=10";
    case "General":
      return null;
  }
};

/* --------------------------- Component -------------------------------- */

const GAEForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<GAEFormData>(initialFormData);
  const [parties, setParties] = useState<Party[]>([]);
  const [references, setReferences] = useState<ReferenceRecord[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);

  const [loadingParties, setLoadingParties] = useState(false);
  const [loadingReferences, setLoadingReferences] = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof GAEFormData, string>>
  >({});

  const [partySearch, setPartySearch] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [refSearch, setRefSearch] = useState("");
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  /* ----------------------- Party modal state ---------------------- */
  const [partyModalOpen, setPartyModalOpen] = useState(false);
  const [newParty, setNewParty] = useState<NewPartyFormData>(initialNewParty);
  const [creatingParty, setCreatingParty] = useState(false);

  const partyRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLDivElement>(null);

  /* ----------------------------- Effects ----------------------------- */

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchParties(formData.partyType);
    setFormData((prev) => ({
      ...prev,
      partyId: "",
      partyName: "",
      /* ✅ Default reference type is "General" for both Supplier and Customer */
      referenceType: "General",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setPartySearch("");
    setRefSearch("");
    setReferences([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.partyType]);

  useEffect(() => {
    if (company?.bank_details?.length) {
      const primary =
        company.bank_details.find((b) => b.is_primary === 1) ||
        company.bank_details[0];
      setFormData((prev) => ({
        ...prev,
        bankId: prev.bankId || primary.id,
      }));
    }
  }, [company]);

  useEffect(() => {
    if (
      formData.partyId &&
      /* ✅ Only fetch references for non-General types */
      formData.referenceType !== "General"
    ) {
      fetchReferences(
        formData.partyId as number,
        formData.referenceType,
        formData.partyType
      );
    } else {
      setReferences([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.partyId, formData.referenceType]);

  useEffect(() => {
    if (formData.paymentType === "Cash") setShowBankDetails(false);
  }, [formData.paymentType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (partyRef.current && !partyRef.current.contains(e.target as Node)) {
        setShowPartyDropdown(false);
      }
      if (refRef.current && !refRef.current.contains(e.target as Node)) {
        setShowRefDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---------------------------- Fetchers ----------------------------- */

  const fetchParties = async (type: PartyType) => {
    setLoadingParties(true);
    try {
      const endpoint =
        type === "Supplier" ? "/supplier?limit=1000" : "/customer?limit=1000";
      const response = await api.get(endpoint);
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];
        const normalized: Party[] = records.map((p) => ({
          id: Number(p?.id ?? 0),
          name: String(p?.name ?? ""),
          display_name: String(
            type === "Supplier"
              ? p?.supplier_name ?? p?.name ?? ""
              : p?.customer_name ?? p?.name ?? ""
          ),
          group:
            type === "Supplier"
              ? p?.supplier_group ?? ""
              : p?.customer_group ?? "",
        }));
        setParties(normalized);
      } else {
        setParties([]);
      }
    } catch (err) {
      console.error(`Error fetching ${type}s:`, err);
      setParties([]);
    } finally {
      setLoadingParties(false);
    }
  };

  const fetchCompanies = async () => {
    setLoadingCompany(true);
    try {
      const response = await api.get("/company");
      if (
        response.data?.success === 1 &&
        Array.isArray(response.data.data) &&
        response.data.data.length > 0
      ) {
        const list: Company[] = response.data.data;
        setCompanies(list);
        const first = list[0];
        setCompany(first);
        setFormData((prev) => ({
          ...prev,
          companyId: prev.companyId || first.id,
        }));
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoadingCompany(false);
    }
  };

  const fetchReferences = async (
    partyId: number,
    refType: ReferenceType,
    partyType: PartyType
  ) => {
    const endpoint = referenceEndpoint(refType);
    if (!endpoint) {
      setReferences([]);
      return;
    }

    setLoadingReferences(true);
    try {
      const response = await api.get(endpoint);
      if (response.data?.success === 1) {
        const data = response.data.data;
        const records: any[] = Array.isArray(data) ? data : data?.records ?? [];
        const normalized = records.map((r) => normalizeReference(r, refType));

        const selected = parties.find((p) => p.id === partyId);
        const name = selected?.display_name || selected?.name || "";
        const pid = String(partyId);

        const filtered = normalized.filter(
          (r) =>
            r.party === pid || r.party === name || r.partyName === name
        );

        setReferences(filtered.length > 0 ? filtered : normalized);
      } else {
        setReferences([]);
      }
    } catch (err) {
      console.error(`Error fetching ${refType}:`, err);
      setReferences([]);
    } finally {
      setLoadingReferences(false);
    }
    void partyType;
  };

  /* ---------------------------- Handlers ----------------------------- */

  const handleChange = (field: keyof GAEFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handlePartyTypeChange = (type: PartyType) => {
    setFormData((prev) => ({
      ...prev,
      partyType: type,
      partyId: "",
      partyName: "",
      /* ✅ When party type changes, reset to "General" reference */
      referenceType: "General",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setPartySearch("");
    setRefSearch("");
    setReferences([]);
    setErrors((prev) => ({ ...prev, partyType: "", partyId: "" }));
  };

  const handleReferenceTypeChange = (type: ReferenceType) => {
    setFormData((prev) => ({
      ...prev,
      referenceType: type,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setRefSearch("");
    setReferences([]);
  };

  const handleCompanyChange = (id: number) => {
    const selected = companies.find((c) => c.id === id) || null;
    setCompany(selected);
    const primary =
      selected?.bank_details?.find((b) => b.is_primary === 1) ||
      selected?.bank_details?.[0];

    setFormData((prev) => ({
      ...prev,
      companyId: id,
      bankId: primary?.id || "",
    }));
    setErrors((prev) => ({ ...prev, companyId: "" }));
  };

  const handlePartySelect = (party: Party) => {
    const displayName = party.display_name || party.name || "";
    setFormData((prev) => ({
      ...prev,
      partyId: party.id,
      partyName: displayName,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setPartySearch(displayName);
    setShowPartyDropdown(false);
    setErrors((prev) => ({ ...prev, partyId: "" }));
  };

  /* ✅ For Customer, allow typing a free-text name (no ID needed) */
  const handlePartyNameTyped = (value: string) => {
    setPartySearch(value);
    setShowPartyDropdown(true);
    setFormData((prev) => ({
      ...prev,
      partyName: value,
      // if user is typing, clear the picked id so it's treated as free-text
      partyId: "",
    }));
    setErrors((prev) => ({ ...prev, partyId: "" }));
  };

  const handleReferenceSelect = (ref: ReferenceRecord) => {
    setFormData((prev) => ({
      ...prev,
      referenceId: ref.id,
      referenceNo: ref.refNo,
      referenceDate: toYMD(ref.date),
      grandTotal: ref.grandTotal || "",
      amount: ref.grandTotal ? String(ref.grandTotal) : "",
    }));
    setRefSearch(ref.refNo);
    setShowRefDropdown(false);
    setErrors((prev) => ({
      ...prev,
      referenceId: "",
      amount: "",
    }));
  };

  const clearParty = () => {
    setFormData((prev) => ({
      ...prev,
      partyId: "",
      partyName: "",
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setPartySearch("");
    setRefSearch("");
    setReferences([]);
  };

  const clearReference = () => {
    setFormData((prev) => ({
      ...prev,
      referenceId: "",
      referenceNo: "",
      referenceDate: "",
      grandTotal: "",
      miscReference: "",
      amount: "",
    }));
    setRefSearch("");
  };

  /* --------- Add-New Party Handler (ALWAYS Opens Popup) --------- */

  const openAddParty = () => {
    setShowPartyDropdown(false);
    setNewParty(initialNewParty);
    setPartyModalOpen(true);
  };

  const handleNewPartyChange = (
    field: keyof NewPartyFormData,
    value: string
  ) => {
    setNewParty((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateParty = async () => {
    if (!newParty.customer_name.trim()) {
      alert(`${formData.partyType} Name is required`);
      return;
    }
    setCreatingParty(true);
    try {
      const isCustomer = formData.partyType === "Customer";
      const endpoint = isCustomer ? "/customer" : "/supplier";
      
      const payload: any = { ...newParty };
      if (!isCustomer) {
        // For Supplier, the API expects supplier_name
        payload.supplier_name = newParty.customer_name;
      }

      const response = await api.post(endpoint, payload);
      
      if (response.data?.success === 1 || response.data?.id) {
        const created = response.data.data || response.data;
        const createdParty: Party = {
          id: Number(created.id),
          name: String(created.customer_name || created.supplier_name || created.name),
          display_name: String(created.customer_name || created.supplier_name || created.name),
          group: isCustomer ? (created.customer_group || "") : (created.supplier_group || ""),
        };

        // Automatically select the new party in the main form
        handlePartySelect(createdParty);

        // Reset modal state and close
        setPartyModalOpen(false);
        setNewParty(initialNewParty);

        // Refresh the dropdown list
        fetchParties(formData.partyType);
      } else {
        alert(`Failed to create ${formData.partyType.toLowerCase()}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || `Error creating ${formData.partyType.toLowerCase()}`);
    } finally {
      setCreatingParty(false);
    }
  };

  /* ---------------------------- Filters ------------------------------ */

  const filteredParties = parties.filter((p) =>
    safeLower(p.display_name || p.name).includes(safeLower(partySearch))
  );

  const filteredReferences = references.filter((r) => {
    const label = `${safeLower(r.refNo)} ${safeLower(r.grandTotal)}`;
    return label.includes(safeLower(refSearch));
  });

  /* ✅ "isMisc" is now "isGeneral" — refers to the free-text reference mode */
  const isGeneral = formData.referenceType === "General";
  const isCustomer = formData.partyType === "Customer";
  const isSupplier = formData.partyType === "Supplier";

  /* -------------------------- Validation ----------------------------- */

  const validateForm = () => {
    const newErrors: Partial<Record<keyof GAEFormData, string>> = {};

    if (!formData.entryDate) newErrors.entryDate = "Entry date is required";
    if (!formData.entryType) newErrors.entryType = "Entry type is required";
    if (!formData.companyId) newErrors.companyId = "Company is required";

    /* ✅ Party is required, but for Customer either ID or typed name works */
    if (isCustomer) {
      if (!formData.partyId && !formData.partyName.trim()) {
        newErrors.partyId = "Enter a customer name";
      }
    } else {
      // Supplier still requires picking from the dropdown
      if (!formData.partyId) {
        newErrors.partyId = `${formData.partyType} is required`;
      }
    }

    if (!formData.referenceType)
      newErrors.referenceType = "Reference type is required";

    /* ✅ Reference is NO LONGER mandatory except for General */
    if (isGeneral && !formData.miscReference.trim()) {
      newErrors.miscReference = "Please enter a reference";
    }

    if (!formData.paymentType)
      newErrors.paymentType = "Payment type is required";
    if (formData.paymentType !== "Cash" && !formData.bankId)
      newErrors.bankId = "Please select a bank account";
    if (formData.paymentType !== "Cash" && !formData.transactionId.trim())
      newErrors.transactionId =
        "Transaction ID is required for non-cash payments";
    if (!formData.amount || Number(formData.amount) <= 0)
      newErrors.amount = "Enter a valid amount";
    if (!formData.narration.trim())
      newErrors.narration = "Narration is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ------------------------------ Save ------------------------------- */

  const saveEntry = async () => {
    const isOrder =
      formData.referenceType === "Purchase Order" ||
      formData.referenceType === "Sales Order";
    const isSupplierDoc =
      formData.referenceType === "Purchase Bill" ||
      formData.referenceType === "Purchase Order";

    const referenceNo = isGeneral
      ? formData.miscReference.trim()
      : formData.referenceNo || "";
    const referenceId = isGeneral ? 0 : formData.referenceId || 0;

    /* ✅ For Customer with typed name (no pick), party_id can be null */
    const partyId = formData.partyId ? formData.partyId : null;
    const partyName = formData.partyName || "";

    const payload = {
      entry_date: toYMD(formData.entryDate),
      entry_type: formData.entryType,
      company_id: formData.companyId || company?.id || 1,
      bank_detail_id: formData.bankId || null,
      transaction_id: formData.transactionId.trim(),
      transaction_date: toYMD(formData.transactionDate),

      party_type: formData.partyType,
      party_id: partyId,
      /* ✅ send party_name so backend can store free-text customers */
      party_name: partyName,

      reference_type: formData.referenceType,
      reference_id: referenceId,
      reference_no: referenceNo,
      reference_date: toYMD(formData.referenceDate),

      purchase_invoice_no: isSupplierDoc && !isOrder ? referenceNo || null : null,
      purchase_order_no: isSupplierDoc && isOrder ? referenceNo || null : null,
      sales_invoice_no: !isSupplierDoc && !isOrder ? referenceNo || null : null,
      sales_order_no: !isSupplierDoc && isOrder ? referenceNo || null : null,
      grn_no: null,
      delivery_note_no: null,

      currency: company?.default_currency?.toUpperCase() || "INR",
      total_amount: Number(formData.amount),
      payment_type: formData.paymentType,
      narration: formData.narration,
      status: "Draft",
      created_by: 1,
      modified_by: 1,
    };

    console.log("GAE Entry Payload:", payload);
    const response = await api.post("/account_entry", payload);
    console.log("GAE entry saved:", response.data);
    return response.data;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    setSuccessMessage(null);
    try {
      const result = await saveEntry();
      const entryNo = result?.data?.entry_no || "ACC-XXXXX";
      const refDisplay = isGeneral
        ? formData.miscReference
        : formData.referenceNo || "(no reference)";
      setSuccessMessage(
        `✅ ${formData.entryType} entry ${entryNo} created for ${formData.referenceType} ${refDisplay}.`
      );

      const defaultBankId =
        company?.bank_details?.find((b) => b.is_primary === 1)?.id ||
        company?.bank_details?.[0]?.id ||
        "";

      setFormData({
        ...initialFormData,
        entryDate: new Date().toISOString().split("T")[0],
        transactionDate: new Date().toISOString().split("T")[0],
        companyId: formData.companyId,
        entryType: formData.entryType,
        partyType: formData.partyType,
        referenceType: formData.referenceType,
        bankId: defaultBankId,
      });
      setPartySearch("");
      setRefSearch("");
      setReferences([]);
      setErrors({});
      setShowBankDetails(false);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error("Failed to save:", err);
      alert(err.response?.data?.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ Derived ---------------------------- */

  const selectedBank =
    company?.bank_details?.find((b) => b.id === formData.bankId) || null;

  const referenceTypes: ReferenceType[] = isSupplier
    ? SUPPLIER_REF_TYPES
    : CUSTOMER_REF_TYPES;

  const refPlaceholder = !formData.partyId
    ? `Select ${formData.partyType.toLowerCase()} first`
    : loadingReferences
    ? `Loading ${formData.referenceType.toLowerCase()}s...`
    : `Search ${formData.referenceType.toLowerCase()}`;

  const partyLabel = formData.partyType;

  /* ------------------------------ Render ----------------------------- */

  return (
    <div className="rd-credit-page">
      <div className="pof-header">
        <button onClick={() => navigate("/GeneralAccountEntry")} className="pof-back-btn">
          <FaArrowLeft size={9} /> Back
        </button>
        <div className="pof-header-title">
          <h1>
            Create Journal Entry
          </h1>
          
        </div>
        {Object.keys(errors).length > 0 && (
          <div className="pof-error-badge">
            <FaExclamationTriangle size={12} />
            {Object.keys(errors).length} missing field{Object.keys(errors).length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="rd-credit-card">
        <div className="rd-credit-header">
          <h2>GENERAL ACCOUNT ENTRY</h2>
        </div>

        {successMessage && (
          <div className="rd-credit-success">
            <span>{successMessage}</span>
          </div>
        )}

        <div className="rd-credit-form">
          {/* ROW 1 — Entry Date | Entry Type | Company */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Entry Date <span>*</span>
              </label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => handleChange("entryDate", e.target.value)}
              />
              {errors.entryDate && (
                <small className="rd-credit-error">{errors.entryDate}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Entry Type <span>*</span>
              </label>
              <select
                value={formData.entryType}
                onChange={(e) =>
                  handleChange("entryType", e.target.value as EntryType)
                }
              >
                {ENTRY_TYPES.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
              {errors.entryType && (
                <small className="rd-credit-error">{errors.entryType}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Company <span>*</span>
              </label>
              <select
                value={formData.companyId}
                onChange={(e) => handleCompanyChange(Number(e.target.value))}
                disabled={loadingCompany}
              >
                <option value="">
                  {loadingCompany
                    ? "Loading companies..."
                    : "-- Select Company --"}
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.abbr})
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <small className="rd-credit-error">{errors.companyId}</small>
              )}
            </div>
          </div>

          {/* ROW 2 — Party Type | Party | Reference Type */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Party Type <span>*</span>
              </label>
              <select
                value={formData.partyType}
                onChange={(e) =>
                  handlePartyTypeChange(e.target.value as PartyType)
                }
              >
                {PARTY_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
              {errors.partyType && (
                <small className="rd-credit-error">{errors.partyType}</small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                {partyLabel} <span>*</span>
              </label>
              <div className="rd-credit-searchable" ref={partyRef}>
                <div className="rd-credit-searchable-input">
                  <input
                    type="text"
                    placeholder={
                      loadingParties
                        ? `Loading ${formData.partyType.toLowerCase()}s...`
                        : isCustomer
                        ? `Search or type a customer name`
                        : `Search or select ${formData.partyType.toLowerCase()}`
                    }
                    value={partySearch}
                    onChange={(e) => {
                      if (isCustomer) {
                        handlePartyNameTyped(e.target.value);
                      } else {
                        setPartySearch(e.target.value);
                        setShowPartyDropdown(true);
                      }
                    }}
                    onFocus={() => setShowPartyDropdown(true)}
                    disabled={loadingParties && !isCustomer}
                  />
                  {partySearch && (
                    <button
                      type="button"
                      className="rd-credit-searchable-clear"
                      onClick={clearParty}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                  <span className="rd-credit-searchable-chevron">▾</span>
                </div>

                {showPartyDropdown && (
                  <div 
                    className="rd-credit-searchable-menu"
                    style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                  >
                    {/* Scrollable List Area */}
                    <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
                      {filteredParties.length === 0 ? (
                        <div className="rd-credit-searchable-empty">
                          {isCustomer && partySearch.trim()
                            ? `Use "${partySearch.trim()}" as customer name`
                            : `No ${formData.partyType.toLowerCase()}s found`}
                        </div>
                      ) : (
                        filteredParties.slice(0, 100).map((party) => (
                          <div
                            key={party.id}
                            className={`rd-credit-searchable-item ${
                              formData.partyId === party.id ? "active" : ""
                            }`}
                            onClick={() => handlePartySelect(party)}
                          >
                            <span className="rd-credit-searchable-name">
                              {party.display_name || party.name || "—"}
                            </span>
                            {party.group && (
                              <span className="rd-credit-searchable-tag">
                                {party.group}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* ✅ + Add Party button inside the dropdown - ONLY FOR SUPPLIER and stable at bottom */}
                    {isSupplier && (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={openAddParty}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            openAddParty();
                          }
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "10px 12px",
                          borderTop: "1px solid #e5e7eb",
                          cursor: "pointer",
                          color: "#4f46e5",
                          fontWeight: 600,
                          fontSize: 12,
                          background: "#fff",
                          flexShrink: 0, // Prevents the button from shrinking when list is long
                          borderRadius: "0 0 10px 10px" // Match dropdown bottom corners
                        }}
                        title={`Add ${formData.partyType}`}
                      >
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            background: "#4f46e5",
                            color: "#fff",
                            fontSize: 10,
                            flexShrink: 0,
                          }}
                        >
                          <FaPlus size={8} />
                        </span>
                        <span>Add New {formData.partyType}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.partyId && (
                <small className="rd-credit-error">{errors.partyId}</small>
              )}
              {isCustomer && !formData.partyId && formData.partyName && (
                <small
                  style={{
                    display: "block",
                    marginTop: 4,
                    color: "#64748b",
                    fontSize: 11,
                  }}
                >
                  Using typed name "{formData.partyName}" (no ID)
                </small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>
                Reference Type <span>*</span>
              </label>
              <select
                value={formData.referenceType}
                onChange={(e) =>
                  handleReferenceTypeChange(e.target.value as ReferenceType)
                }
              >
                {referenceTypes.map((rt) => (
                  <option key={rt} value={rt}>
                    {rt}
                  </option>
                ))}
              </select>
              {errors.referenceType && (
                <small className="rd-credit-error">{errors.referenceType}</small>
              )}
            </div>
          </div>

          {/* ROW 3 — Reference | Payment Mode | Bank (conditional) */}
          <div className="rd-credit-row three-column">
            {isGeneral ? (
              <div className="rd-credit-field">
                <label>
                  Reference <span>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter a reference (bill no., note, etc.)"
                  value={formData.miscReference}
                  onChange={(e) =>
                    handleChange("miscReference", e.target.value)
                  }
                />
                {errors.miscReference && (
                  <small className="rd-credit-error">
                    {errors.miscReference}
                  </small>
                )}
              </div>
            ) : (
              <div className="rd-credit-field">
                <label>
                  {formData.referenceType} No.{" "}
                  {/* ✅ no longer mandatory */}
                  <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                    (optional)
                  </span>
                </label>
                <div className="rd-credit-searchable" ref={refRef}>
                  <div className="rd-credit-searchable-input">
                    <input
                      type="text"
                      placeholder={refPlaceholder}
                      value={refSearch}
                      onChange={(e) => {
                        setRefSearch(e.target.value);
                        setShowRefDropdown(true);
                      }}
                      onFocus={() => setShowRefDropdown(true)}
                      disabled={!formData.partyId || loadingReferences}
                    />
                    {refSearch && (
                      <button
                        type="button"
                        className="rd-credit-searchable-clear"
                        onClick={clearReference}
                        title="Clear"
                      >
                        ✕
                      </button>
                    )}
                    <span className="rd-credit-searchable-chevron">▾</span>
                  </div>

                  {showRefDropdown && (
                    <div className="rd-credit-searchable-menu">
                      {filteredReferences.length === 0 ? (
                        <div className="rd-credit-searchable-empty">
                          {references.length === 0
                            ? `No ${formData.referenceType.toLowerCase()}s found`
                            : "No matching results"}
                        </div>
                      ) : (
                        filteredReferences.slice(0, 100).map((r) => (
                          <div
                            key={r.id}
                            className={`rd-credit-searchable-item ${
                              formData.referenceId === r.id ? "active" : ""
                            }`}
                            onClick={() => handleReferenceSelect(r)}
                          >
                            <div className="rd-credit-searchable-row">
                              <span className="rd-credit-searchable-name">
                                {r.refNo || `#${r.id}`}
                              </span>
                              <span className="rd-credit-searchable-amount">
                                ₹{formatMoney(r.grandTotal)}
                              </span>
                            </div>
                            {r.date && (
                              <span className="rd-credit-searchable-sub">
                                {new Date(r.date).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="rd-credit-field">
              <label>
                Payment Mode <span>*</span>
              </label>
              <select
                value={formData.paymentType}
                onChange={(e) => handleChange("paymentType", e.target.value)}
              >
                {TRANSFER_MODES.map((mode) => (
                  <option key={mode.value} value={mode.value}>
                    {mode.label}
                  </option>
                ))}
              </select>
              {errors.paymentType && (
                <small className="rd-credit-error">{errors.paymentType}</small>
              )}
            </div>

            {formData.paymentType !== "Cash" && (
              <div className="rd-credit-field">
                <label>
                  Bank Account <span>*</span>
                </label>
                {loadingCompany ? (
                  <select disabled>
                    <option>Loading banks...</option>
                  </select>
                ) : company && company.bank_details?.length ? (
                  <>
                    <select
                      value={formData.bankId}
                      onChange={(e) =>
                        handleChange(
                          "bankId",
                          e.target.value ? Number(e.target.value) : ""
                        )
                      }
                    >
                      <option value="">-- Select --</option>
                      {company.bank_details.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          {bank.bank_name} · {bank.account_number}
                          {bank.is_primary === 1 ? " (P)" : ""}
                        </option>
                      ))}
                    </select>
                    {errors.bankId && (
                      <small className="rd-credit-error">{errors.bankId}</small>
                    )}
                  </>
                ) : (
                  <select disabled>
                    <option>No banks configured</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* ROW 4 — Transaction ID | Transaction Date | Amount */}
          <div className="rd-credit-row three-column">
            <div className="rd-credit-field">
              <label>
                Transaction ID / UTR{" "}
                {formData.paymentType !== "Cash" && <span>*</span>}
              </label>
              <input
                type="text"
                placeholder={
                  formData.paymentType === "Cash"
                    ? "Optional for cash"
                    : "e.g. UTR / UPI Ref No."
                }
                value={formData.transactionId}
                onChange={(e) =>
                  handleChange("transactionId", e.target.value)
                }
                disabled={formData.paymentType === "Cash"}
              />
              {errors.transactionId && (
                <small className="rd-credit-error">
                  {errors.transactionId}
                </small>
              )}
            </div>

            <div className="rd-credit-field">
              <label>Transaction Date</label>
              <input
                type="date"
                value={formData.transactionDate}
                onChange={(e) =>
                  handleChange("transactionDate", e.target.value)
                }
              />
            </div>

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
                  onChange={(e) => handleChange("amount", e.target.value)}
                />
              </div>
              {errors.amount && (
                <small className="rd-credit-error">{errors.amount}</small>
              )}
            </div>
          </div>

          {/* Narration */}
          <div className="rd-credit-row">
            <div className="rd-credit-field">
              <label>
                Narration <span>*</span>
              </label>
              <textarea
                placeholder="Add narration"
                value={formData.narration}
                onChange={(e) => handleChange("narration", e.target.value)}
              />
              {errors.narration && (
                <small className="rd-credit-error">{errors.narration}</small>
              )}
            </div>
          </div>

          {/* Bank drill-down */}
          {formData.paymentType !== "Cash" && selectedBank && (
            <div className="rd-credit-row">
              <div className="rd-credit-bank-drill">
                <button
                  type="button"
                  className="rd-credit-bank-drill-toggle"
                  onClick={() => setShowBankDetails((v) => !v)}
                  aria-expanded={showBankDetails}
                >
                  <span className="rd-credit-bank-drill-icon">
                    {showBankDetails ? "▾" : "▸"}
                  </span>
                  <span>Bank Details</span>
                  <span className="rd-credit-bank-drill-sub">
                    {selectedBank.bank_name} · {selectedBank.account_number}
                  </span>
                </button>

                {showBankDetails && (
                  <div className="rd-credit-bank-drill-body">
                    <div className="rd-credit-bank-grid">
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">
                          Account Holder
                        </span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.account_holder_name}
                        </span>
                      </div>
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">Bank Name</span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.bank_name}
                        </span>
                      </div>
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">
                          Account Number
                        </span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.account_number}
                        </span>
                      </div>
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">IFSC Code</span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.ifsc_code}
                        </span>
                      </div>
                      <div className="rd-credit-bank-item">
                        <span className="rd-credit-bank-label">Currency</span>
                        <span className="rd-credit-bank-value">
                          {selectedBank.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ACTIONS */}
          <div className="rd-credit-actions">
            <button
              type="button"
              className="rd-credit-save-continue"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ ADD PARTY MODAL (For Both Customer & Supplier) ═══ */}
      {partyModalOpen && (
        <div
          onClick={() => setPartyModalOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(760px, 100%)",
              maxHeight: "85vh",
              background: "#fff",
              borderRadius: 12,
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #e5e7eb",
                background: "#fff"
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Create New {formData.partyType}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "#6b7280",
                  }}
                >
                  Fill in the details to create a new {formData.partyType.toLowerCase()}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPartyModalOpen(false)}
                title="Close"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#6b7280",
                  padding: 4,
                  display: "inline-flex",
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Create New Party Form */}
            <div style={{ overflowY: "auto", padding: "20px", background: "#fff" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {formData.partyType} Name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={newParty.customer_name}
                    onChange={(e) =>
                      handleNewPartyChange("customer_name", e.target.value)
                    }
                    placeholder={`Enter ${formData.partyType.toLowerCase()} name`}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Territory
                  </label>
                  <input
                    type="text"
                    value={newParty.territory}
                    onChange={(e) =>
                      handleNewPartyChange("territory", e.target.value)
                    }
                    placeholder="Enter territory"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={newParty.email_id}
                    onChange={(e) =>
                      handleNewPartyChange("email_id", e.target.value)
                    }
                    placeholder="Enter email"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Mobile
                  </label>
                  <input
                    type="text"
                    value={newParty.mobile_no}
                    onChange={(e) =>
                      handleNewPartyChange("mobile_no", e.target.value)
                    }
                    placeholder="Enter mobile"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    {formData.partyType} Primary Address
                  </label>
                  <input
                    type="text"
                    value={newParty.customer_primary_address}
                    onChange={(e) =>
                      handleNewPartyChange(
                        "customer_primary_address",
                        e.target.value
                      )
                    }
                    placeholder={`Enter ${formData.partyType.toLowerCase()} primary address`}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 12,
                      marginBottom: 4,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Primary Address
                  </label>
                  <input
                    type="text"
                    value={newParty.primary_address}
                    onChange={(e) =>
                      handleNewPartyChange(
                        "primary_address",
                        e.target.value
                      )
                    }
                    placeholder="Enter primary address"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px 12px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      background: "#ffffff",
                      color: "#111827"
                    }}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 24,
                  paddingTop: 16,
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  type="button"
                  onClick={() => setPartyModalOpen(false)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: "pointer",
                    color: "#374151",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateParty}
                  disabled={creatingParty}
                  style={{
                    padding: "8px 16px",
                    border: "none",
                    background: "#4f46e5",
                    borderRadius: 6,
                    fontSize: 13,
                    cursor: creatingParty ? "not-allowed" : "pointer",
                    color: "#fff",
                    fontWeight: 600,
                    opacity: creatingParty ? 0.7 : 1,
                  }}
                >
                  {creatingParty ? "Saving..." : `Save ${formData.partyType}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GAEForm;