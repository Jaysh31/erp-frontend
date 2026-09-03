// EmployeeForm.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaUniversity,
  FaUserFriends,
  FaPassport,
} from "react-icons/fa";
import "./EmployeeForm.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from '../../services/api';
import toast from "react-hot-toast";

interface EmployeeData {
  id?: number;
  naming_series: string;
  employee: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  employee_name: string;
  gender: string;
  salutation: string;
  date_of_birth: string;
  date_of_joining: string;
  status: string;
  company: string;
  department: string;
  designation: string;
  branch: string;
  employee_number: string;
  reports_to: string;
  cell_number: string;
  company_email: string;
  personal_email: string;
  prefered_contact_email: string;
  prefered_email: string;
  current_address: string;
  permanent_address: string;
  current_accommodation_type: string;
  permanent_accommodation_type: string;
  person_to_be_contacted: string;
  emergency_phone_number: string;
  relation: string;
  attendance_device_id: string;
  holiday_list: string;
  ctc: number;
  salary_currency: string;
  salary_mode: string;
  bank_name: string;
  bank_ac_no: string;
  iban: string;
  marital_status: string;
  blood_group: string;
  family_background: string;
  health_details: string;
  passport_number: string;
  date_of_issue: string;
  valid_upto: string;
  place_of_issue: string;
  bio: string;
  scheduled_confirmation_date: string;
  final_confirmation_date: string;
  contract_end_date: string;
  notice_number_of_days: number;
  modified_by: string;
  owner: string;
}

interface ValidationError {
  field: string;
  label: string;
  message: string;
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const STATUS_OPTIONS = ["Active", "Inactive", "On Leave", "Terminated"];
const SALUTATION_OPTIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
const MARITAL_STATUS_OPTIONS = ["Single", "Married", "Divorced", "Widowed"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ACCOMMODATION_OPTIONS = ["Rented", "Owned", "Leased", "Company Provided"];
const RELATION_OPTIONS = ["Father", "Mother", "Spouse", "Sibling", "Child", "Other"];
const SALARY_MODE_OPTIONS = ["Bank Transfer", "Cash", "Cheque"];
const SALARY_CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"];
const CONTACT_EMAIL_OPTIONS = ["Company Email", "Personal Email"];
const DEPARTMENTS = ["Production", "Engineering", "Quality", "Maintenance", "HR", "Finance", "Sales", "IT", "R&D"];
const DESIGNATIONS = ["Production Engineer", "Senior Engineer", "Manager", "Supervisor", "Technician", "Operator", "Analyst", "Executive"];

const emptyEmployee = (): EmployeeData => ({
  naming_series: "EMP-",
  employee: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  employee_name: "",
  gender: "Male",
  salutation: "Mr.",
  date_of_birth: "",
  date_of_joining: new Date().toISOString().split("T")[0],
  status: "Active",
  company: "SculptorTech Pvt Ltd",
  department: "",
  designation: "",
  branch: "",
  employee_number: "",
  reports_to: "",
  cell_number: "",
  company_email: "",
  personal_email: "",
  prefered_contact_email: "Company Email",
  prefered_email: "",
  current_address: "",
  permanent_address: "",
  current_accommodation_type: "",
  permanent_accommodation_type: "",
  person_to_be_contacted: "",
  emergency_phone_number: "",
  relation: "",
  attendance_device_id: "",
  holiday_list: "",
  ctc: 0,
  salary_currency: "INR",
  salary_mode: "Bank Transfer",
  bank_name: "",
  bank_ac_no: "",
  iban: "",
  marital_status: "Single",
  blood_group: "",
  family_background: "",
  health_details: "",
  passport_number: "",
  date_of_issue: "",
  valid_upto: "",
  place_of_issue: "",
  bio: "",
  scheduled_confirmation_date: "",
  final_confirmation_date: "",
  contract_end_date: "",
  notice_number_of_days: 30,
  modified_by: "Administrator",
  owner: "Administrator",
});

export default function EmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const isNew = !id || id === "new";

  const [formData, setFormData] = useState<EmployeeData>(emptyEmployee());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeTab, setActiveTab] = useState<"personal" | "contact" | "employment" | "bank" | "emergency" | "documents">("personal");

  // const disabled = submitting || loading;

  // Fetch employee data if editing
  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      api.get(`/employee/${id}`)
        .then(r => {
          if (r.data.success === 1) {
            const d = r.data.data;
            setFormData({
              ...d,
              id: d.id || parseInt(id),
              date_of_birth: d.date_of_birth ? d.date_of_birth.split("T")[0] : "",
              date_of_joining: d.date_of_joining ? d.date_of_joining.split("T")[0] : "",
              scheduled_confirmation_date: d.scheduled_confirmation_date ? d.scheduled_confirmation_date.split("T")[0] : "",
              final_confirmation_date: d.final_confirmation_date ? d.final_confirmation_date.split("T")[0] : "",
              contract_end_date: d.contract_end_date ? d.contract_end_date.split("T")[0] : "",
              date_of_issue: d.date_of_issue ? d.date_of_issue.split("T")[0] : "",
              valid_upto: d.valid_upto ? d.valid_upto.split("T")[0] : "",
            });
          }
        })
        .catch(() => setApiError("Failed to load employee data"))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleChange = (field: keyof EmployeeData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-generate employee_name
    if (field === "first_name" || field === "last_name") {
      const firstName = field === "first_name" ? value : formData.first_name;
      const lastName = field === "last_name" ? value : formData.last_name;
      const middleName = formData.middle_name || "";
      const name = [firstName, middleName, lastName].filter(Boolean).join(" ");
      setFormData(prev => ({ ...prev, employee_name: name }));
    }
  };

  const handleCancel = () => {
    navigate("/employee");
  };

  const validate = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    if (!formData.first_name.trim()) errors.push({ field: "first_name", label: "First Name", message: "First name is required" });
    if (!formData.last_name.trim()) errors.push({ field: "last_name", label: "Last Name", message: "Last name is required" });
    if (!formData.date_of_birth) errors.push({ field: "date_of_birth", label: "Date of Birth", message: "Date of birth is required" });
    if (!formData.date_of_joining) errors.push({ field: "date_of_joining", label: "Date of Joining", message: "Date of joining is required" });
    if (!formData.department) errors.push({ field: "department", label: "Department", message: "Department is required" });
    if (!formData.designation) errors.push({ field: "designation", label: "Designation", message: "Designation is required" });
    if (!formData.cell_number) errors.push({ field: "cell_number", label: "Mobile Number", message: "Mobile number is required" });
    if (!formData.company_email && !formData.personal_email) {
      errors.push({ field: "company_email", label: "Email", message: "At least one email is required" });
    }
    return errors;
  };

  const handleSubmit = async () => {
    setApiError(null);
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationSummary(true);
      return;
    }

    setSubmitting(true);
    try {
      // Create payload with all form data
      const payload = { ...formData };
      
      let response;
      if (isNew) {
        // CREATE - POST without ID in URL
        response = await api.post("/employee", payload);
      } else {
        // UPDATE - POST with ID in payload body, not in URL
        // Add the ID to the payload
        payload.id = parseInt(id);
        response = await api.post("/employee", payload);
      }
      
      if (response.data.success === 1) {
        toast.success(isNew ? "Employee created successfully!" : "Employee updated successfully!");
        navigate("/employee");
      } else {
        setApiError(response.data.message || "Failed to save employee");
      }
    } catch (err: any) {
      console.error("Error saving employee:", err);
      setApiError(err.response?.data?.message || "Failed to save employee");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`empf-page ${theme}`}>
        <div className="empf-loading"><FaSpinner className="spinning" /> Loading employee data...</div>
      </div>
    );
  }

  return (
    <div className={`empf-page ${theme}`}>
      <div className="empf-inner">
        {/* Validation Modal */}
        {showValidationSummary && validationErrors.length > 0 && (
          <div className="modal-overlay" onClick={() => setShowValidationSummary(false)}>
            <div className="validation-summary-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2><FaExclamationTriangle /> Missing Required Fields</h2>
                <button className="modal-close" onClick={() => setShowValidationSummary(false)}>×</button>
              </div>
              <div className="modal-body">
                {validationErrors.map((e, i) => (
                  <div key={i} className="validation-error-item">
                    <div className="error-header"><FaTimesCircle className="error-icon" /><strong>{e.label}</strong></div>
                    <div className="error-message">{e.message}</div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowValidationSummary(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="empf-api-error">
            <FaExclamationCircle className="error-icon" />
            <span>{apiError}</span>
            <button className="error-close" onClick={() => setApiError(null)}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="empf-header">
          <button onClick={handleCancel} className="pof-back-btn">
            <FaArrowLeft size={9} /> Back
          </button>
          <div className="header-title">
            {/*<h1>{isNew ? "Add New Employee" : `Edit: ${formData.employee_name || formData.employee}`}</h1>*/}
            {!isNew && <span className="empf-status-badge">{formData.status}</span>}
          </div>
        </div>

        {/* Tabs */}
        <div className="empf-tabs">
          <button className={`empf-tab ${activeTab === "personal" ? "active" : ""}`} onClick={() => setActiveTab("personal")}>
            <FaUser /> Personal
          </button>
          <button className={`empf-tab ${activeTab === "contact" ? "active" : ""}`} onClick={() => setActiveTab("contact")}>
            <FaEnvelope /> Contact
          </button>
          <button className={`empf-tab ${activeTab === "employment" ? "active" : ""}`} onClick={() => setActiveTab("employment")}>
            <FaBriefcase /> Employment
          </button>
          <button className={`empf-tab ${activeTab === "bank" ? "active" : ""}`} onClick={() => setActiveTab("bank")}>
            <FaUniversity /> Bank
          </button>
          <button className={`empf-tab ${activeTab === "emergency" ? "active" : ""}`} onClick={() => setActiveTab("emergency")}>
            <FaUserFriends /> Emergency
          </button>
          <button className={`empf-tab ${activeTab === "documents" ? "active" : ""}`} onClick={() => setActiveTab("documents")}>
            <FaPassport /> Documents
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="empf-card">
            {/* Personal Tab */}
            {activeTab === "personal" && (
              <>
                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Salutation</label>
                    <select value={formData.salutation} onChange={e => handleChange("salutation", e.target.value)} className="form-field">
                      {SALUTATION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Gender</label>
                    <select value={formData.gender} onChange={e => handleChange("gender", e.target.value)} className="form-field">
                      {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-grid-3">
                  <div className="empf-field">
                    <label className="empf-label">First Name <span className="empf-required">*</span></label>
                    <input type="text" value={formData.first_name} onChange={e => handleChange("first_name", e.target.value)} className="form-field" placeholder="First name" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Middle Name</label>
                    <input type="text" value={formData.middle_name} onChange={e => handleChange("middle_name", e.target.value)} className="form-field" placeholder="Middle name" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Last Name <span className="empf-required">*</span></label>
                    <input type="text" value={formData.last_name} onChange={e => handleChange("last_name", e.target.value)} className="form-field" placeholder="Last name" />
                  </div>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Employee Name</label>
                  <input type="text" value={formData.employee_name} className="form-field" disabled style={{ background: "var(--bg-secondary)", cursor: "not-allowed" }} />
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Date of Birth <span className="empf-required">*</span></label>
                    <input type="date" value={formData.date_of_birth} onChange={e => handleChange("date_of_birth", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Blood Group</label>
                    <select value={formData.blood_group} onChange={e => handleChange("blood_group", e.target.value)} className="form-field">
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUP_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Marital Status</label>
                    <select value={formData.marital_status} onChange={e => handleChange("marital_status", e.target.value)} className="form-field">
                      {MARITAL_STATUS_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Employee Number</label>
                    <input type="text" value={formData.employee_number} onChange={e => handleChange("employee_number", e.target.value)} className="form-field" placeholder="EMP1001" />
                  </div>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Bio</label>
                  <textarea value={formData.bio} onChange={e => handleChange("bio", e.target.value)} className="form-field" rows={3} placeholder="Brief description about the employee..." />
                </div>
              </>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <>
                <div className="empf-field">
                  <label className="empf-label">Mobile Number <span className="empf-required">*</span></label>
                  <input type="tel" value={formData.cell_number} onChange={e => handleChange("cell_number", e.target.value)} className="form-field" placeholder="9876543210" />
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Company Email</label>
                    <input type="email" value={formData.company_email} onChange={e => handleChange("company_email", e.target.value)} className="form-field" placeholder="name@company.com" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Personal Email</label>
                    <input type="email" value={formData.personal_email} onChange={e => handleChange("personal_email", e.target.value)} className="form-field" placeholder="name@gmail.com" />
                  </div>
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Preferred Contact Email</label>
                    <select value={formData.prefered_contact_email} onChange={e => handleChange("prefered_contact_email", e.target.value)} className="form-field">
                      {CONTACT_EMAIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Preferred Email</label>
                    <input type="email" value={formData.prefered_email} onChange={e => handleChange("prefered_email", e.target.value)} className="form-field" placeholder="Preferred email" />
                  </div>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Current Address</label>
                  <input type="text" value={formData.current_address} onChange={e => handleChange("current_address", e.target.value)} className="form-field" placeholder="Current address" />
                </div>

                <div className="empf-field">
                  <label className="empf-label">Permanent Address</label>
                  <input type="text" value={formData.permanent_address} onChange={e => handleChange("permanent_address", e.target.value)} className="form-field" placeholder="Permanent address" />
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Current Accommodation</label>
                    <select value={formData.current_accommodation_type} onChange={e => handleChange("current_accommodation_type", e.target.value)} className="form-field">
                      <option value="">Select Type</option>
                      {ACCOMMODATION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Permanent Accommodation</label>
                    <select value={formData.permanent_accommodation_type} onChange={e => handleChange("permanent_accommodation_type", e.target.value)} className="form-field">
                      <option value="">Select Type</option>
                      {ACCOMMODATION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Employment Tab */}
            {activeTab === "employment" && (
              <>
                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Department <span className="empf-required">*</span></label>
                    <select value={formData.department} onChange={e => handleChange("department", e.target.value)} className="form-field">
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Designation <span className="empf-required">*</span></label>
                    <select value={formData.designation} onChange={e => handleChange("designation", e.target.value)} className="form-field">
                      <option value="">Select Designation</option>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Branch</label>
                    <input type="text" value={formData.branch} onChange={e => handleChange("branch", e.target.value)} className="form-field" placeholder="Branch location" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Reports To</label>
                    <input type="text" value={formData.reports_to} onChange={e => handleChange("reports_to", e.target.value)} className="form-field" placeholder="Manager ID" />
                  </div>
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Date of Joining <span className="empf-required">*</span></label>
                    <input type="date" value={formData.date_of_joining} onChange={e => handleChange("date_of_joining", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Status</label>
                    <select value={formData.status} onChange={e => handleChange("status", e.target.value)} className="form-field">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-grid-3">
                  <div className="empf-field">
                    <label className="empf-label">Scheduled Confirmation</label>
                    <input type="date" value={formData.scheduled_confirmation_date} onChange={e => handleChange("scheduled_confirmation_date", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Final Confirmation</label>
                    <input type="date" value={formData.final_confirmation_date} onChange={e => handleChange("final_confirmation_date", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Contract End Date</label>
                    <input type="date" value={formData.contract_end_date} onChange={e => handleChange("contract_end_date", e.target.value)} className="form-field" />
                  </div>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Notice Period (Days)</label>
                  <input type="number" value={formData.notice_number_of_days} onChange={e => handleChange("notice_number_of_days", Number(e.target.value))} className="form-field" min="0" />
                </div>

                <div className="empf-field">
                  <label className="empf-label">Attendance Device ID</label>
                  <input type="text" value={formData.attendance_device_id} onChange={e => handleChange("attendance_device_id", e.target.value)} className="form-field" placeholder="Device ID" />
                </div>

                <div className="empf-field">
                  <label className="empf-label">Holiday List</label>
                  <input type="text" value={formData.holiday_list} onChange={e => handleChange("holiday_list", e.target.value)} className="form-field" placeholder="Holiday list name" />
                </div>
              </>
            )}

            {/* Bank Tab */}
            {activeTab === "bank" && (
              <>
                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">CTC (Annual)</label>
                    <input type="number" value={formData.ctc || ""} onChange={e => handleChange("ctc", Number(e.target.value))} className="form-field" min="0" placeholder="650000" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Salary Currency</label>
                    <select value={formData.salary_currency} onChange={e => handleChange("salary_currency", e.target.value)} className="form-field">
                      {SALARY_CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Salary Mode</label>
                  <select value={formData.salary_mode} onChange={e => handleChange("salary_mode", e.target.value)} className="form-field">
                    {SALARY_MODE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="empf-field">
                  <label className="empf-label">Bank Name</label>
                  <input type="text" value={formData.bank_name} onChange={e => handleChange("bank_name", e.target.value)} className="form-field" placeholder="Bank name" />
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Bank Account Number</label>
                    <input type="text" value={formData.bank_ac_no} onChange={e => handleChange("bank_ac_no", e.target.value)} className="form-field" placeholder="Account number" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">IBAN</label>
                    <input type="text" value={formData.iban} onChange={e => handleChange("iban", e.target.value)} className="form-field" placeholder="IBAN (optional)" />
                  </div>
                </div>
              </>
            )}

            {/* Emergency Tab */}
            {activeTab === "emergency" && (
              <>
                <div className="empf-field">
                  <label className="empf-label">Person to Contact</label>
                  <input type="text" value={formData.person_to_be_contacted} onChange={e => handleChange("person_to_be_contacted", e.target.value)} className="form-field" placeholder="Emergency contact name" />
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Emergency Phone</label>
                    <input type="tel" value={formData.emergency_phone_number} onChange={e => handleChange("emergency_phone_number", e.target.value)} className="form-field" placeholder="9876500000" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Relation</label>
                    <select value={formData.relation} onChange={e => handleChange("relation", e.target.value)} className="form-field">
                      <option value="">Select Relation</option>
                      {RELATION_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="empf-grid-2">
                  <div className="empf-field">
                    <label className="empf-label">Family Background</label>
                    <input type="text" value={formData.family_background} onChange={e => handleChange("family_background", e.target.value)} className="form-field" placeholder="Family background" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Health Details</label>
                    <input type="text" value={formData.health_details} onChange={e => handleChange("health_details", e.target.value)} className="form-field" placeholder="Health details" />
                  </div>
                </div>
              </>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <>
                <div className="empf-field">
                  <label className="empf-label">Passport Number</label>
                  <input type="text" value={formData.passport_number} onChange={e => handleChange("passport_number", e.target.value)} className="form-field" placeholder="Passport number" />
                </div>

                <div className="empf-grid-3">
                  <div className="empf-field">
                    <label className="empf-label">Date of Issue</label>
                    <input type="date" value={formData.date_of_issue} onChange={e => handleChange("date_of_issue", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Valid Upto</label>
                    <input type="date" value={formData.valid_upto} onChange={e => handleChange("valid_upto", e.target.value)} className="form-field" />
                  </div>
                  <div className="empf-field">
                    <label className="empf-label">Place of Issue</label>
                    <input type="text" value={formData.place_of_issue} onChange={e => handleChange("place_of_issue", e.target.value)} className="form-field" placeholder="Place of issue" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="empf-footer">
            <button type="button" onClick={() => navigate("/employee")} className="cancel-btn" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={submitting}>
              {submitting && <FaSpinner className="spinning" />}
              <FaSave size={12} />
              {isNew ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}