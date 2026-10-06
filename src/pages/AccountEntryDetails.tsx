import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';
import './AccountEntryDetails.css';
import api from '../services/api'; // adjust path

interface BankDetail {
  id: number;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string | null;
  currency: string;
  current_balance: string | number | null;
  is_primary: number;
}

interface AccountEntryDetail {
  id: number;
  entry_no: string;
  entry_date: string;
  entry_type: 'Credit' | 'Debit';
  company_id: number;
  bank_detail_id: number | null;
  transaction_id: string | number | null;
  transaction_date: string | null;
  party_type: 'Customer' | 'Supplier';
  party_id: number;
  party_name?: string | null;
  reference_type: string;
  reference_id: number;
  reference_no: string;
  reference_date: string;
  purchase_invoice_no: string | null;
  purchase_order_no: string | null;
  grn_no: string | null;
  sales_invoice_no: string | null;
  sales_order_no: string | null;
  delivery_note_no: string | null;
  payment_type: string;
  currency: string;
  total_amount: number;
  narration: string;
  remarks: string | null;
  status: string;
  creation: string;
  modified: string;
  bank_details?: BankDetail | null;
}

interface AccountEntryDetailResponse {
  success: number;
  data: AccountEntryDetail;
}

const AccountEntryDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<AccountEntryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntry = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AccountEntryDetailResponse>(`/account_entry/${id}`);
      if (res.data?.success === 1) {
        setEntry(res.data.data);
      } else {
        setError('Failed to load entry details.');
      }
    } catch (err: any) {
      console.error('account_entry/:id fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load entry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  const formatDate = (v: string | null | undefined) => {
    if (!v) return '—';
    const d = new Date(v);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const s = (status || 'Draft').toLowerCase();
    if (s === 'submitted') return <span className="aed-status aed-status--submitted">● Submitted</span>;
    if (s === 'cancelled') return <span className="aed-status aed-status--cancelled">● Cancelled</span>;
    return <span className="aed-status aed-status--draft">● Draft</span>;
  };

  if (loading) {
    return (
      <div className="aed-page">
        <div className="aed-loading">Loading entry details…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aed-page">
        <div className="aed-error">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={fetchEntry}>
            <FaSyncAlt /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!entry) return null;

  return (
    <div className="aed-page">
      {/* Header */}
      <div className="aed-header">
        <button className="aed-back" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <div className="aed-header-main">
          <h1 className="aed-title">
            Account Entry <span className="aed-title-no">{entry.entry_no}</span>
          </h1>
          <p className="aed-subtitle">
            {entry.reference_type} · {entry.reference_no} · Created {formatDate(entry.creation)}
          </p>
        </div>
        <div className="aed-header-right">{getStatusBadge(entry.status)}</div>
      </div>

      {/* Summary Stats */}
      <div className="aed-stats">
        <div className="aed-stat">
          <span className="aed-stat-label">Amount</span>
          <span className="aed-stat-value aed-stat-value--blue">
            {formatCurrency(entry.total_amount)}
          </span>
        </div>
        <div className="aed-stat">
          <span className="aed-stat-label">Entry Type</span>
          <span className="aed-stat-value">{entry.entry_type}</span>
        </div>
        <div className="aed-stat">
          <span className="aed-stat-label">Payment Mode</span>
          <span className="aed-stat-value">{entry.payment_type}</span>
        </div>
        <div className="aed-stat">
          <span className="aed-stat-label">Entry Date</span>
          <span className="aed-stat-value">{formatDate(entry.entry_date)}</span>
        </div>
      </div>

      {/* Details Card */}
      <div className="aed-card">
        <h2 className="aed-card-title">Entry Details</h2>
        <div className="aed-grid">
          <Field label="Entry No" value={entry.entry_no} />
          <Field label="Entry Type" value={entry.entry_type} />
          <Field label="Entry Date" value={formatDate(entry.entry_date)} />
          <Field label="Company ID" value={entry.company_id} />
          <Field
            label="Party"
            value={entry.party_name || `${entry.party_type} #${entry.party_id}`}
          />
          <Field label="Party Type" value={entry.party_type} />
          <Field label="Payment Mode" value={entry.payment_type} />
          <Field label="Currency" value={entry.currency} />
          <Field label="Total Amount" value={formatCurrency(entry.total_amount)} />
          <Field label="Transaction ID" value={entry.transaction_id ?? '—'} />
          <Field label="Transaction Date" value={formatDate(entry.transaction_date)} />
          <Field label="Status" value={entry.status} />
        </div>
      </div>

      {/* Reference Card */}
      <div className="aed-card">
        <h2 className="aed-card-title">Reference</h2>
        <div className="aed-grid">
          <Field label="Reference Type" value={entry.reference_type} />
          <Field label="Reference No" value={entry.reference_no} />
          <Field label="Reference ID" value={entry.reference_id} />
          <Field label="Reference Date" value={formatDate(entry.reference_date)} />
          <Field label="Sales Invoice No" value={entry.sales_invoice_no ?? '—'} />
          <Field label="Sales Order No" value={entry.sales_order_no ?? '—'} />
          <Field label="Purchase Invoice No" value={entry.purchase_invoice_no ?? '—'} />
          <Field label="Purchase Order No" value={entry.purchase_order_no ?? '—'} />
          <Field label="GRN No" value={entry.grn_no ?? '—'} />
          <Field label="Delivery Note No" value={entry.delivery_note_no ?? '—'} />
        </div>
      </div>

      {/* Bank Card */}
      {entry.bank_details && (
        <div className="aed-card">
          <h2 className="aed-card-title">Bank Details</h2>
          <div className="aed-grid">
            <Field label="Account Holder" value={entry.bank_details.account_holder_name} />
            <Field label="Account Type" value={entry.bank_details.account_type} />
            <Field label="Bank Name" value={entry.bank_details.bank_name} />
            <Field label="Branch" value={entry.bank_details.branch_name} />
            <Field label="Account Number" value={entry.bank_details.account_number} />
            <Field label="IFSC Code" value={entry.bank_details.ifsc_code} />
            <Field label="UPI ID" value={entry.bank_details.upi_id ?? '—'} />
            <Field
              label="Current Balance"
              value={formatCurrency(Number(entry.bank_details.current_balance ?? 0))}
            />
            <Field label="Currency" value={entry.bank_details.currency} />
          </div>
        </div>
      )}

      {/* Narration */}
      {entry.narration && (
        <div className="aed-card">
          <h2 className="aed-card-title">Narration</h2>
          <p className="aed-narration">{entry.narration}</p>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="aed-field">
    <span className="aed-field-label">{label}</span>
    <span className="aed-field-value">{value}</span>
  </div>
);

export default AccountEntryDetails;