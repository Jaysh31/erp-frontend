import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaDownload,
  FaPrint,
  FaFolder,
  FaFileAlt,
  FaWallet,
  FaCreditCard,
  FaBalanceScale,
  FaChartLine,
  FaMoneyBillWave,
  FaEye,
  FaHistory,
  FaBook,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import './LedgerAccounts.css';
import api from '../services/api'; // adjust path if needed

/* ───────────────── Types ───────────────── */

interface AccountEntry {
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
  status: string;
  creation: string;
}

interface AccountEntryResponse {
  success: number;
  data: {
    total: number;
    page: number;
    limit: number;
    records: AccountEntry[];
  };
}

interface BankDetail {
  id: number;
  account_holder_name: string;
  account_type: string;
  bank_name: string;
  branch_name: string;
  account_number: string;
  ifsc_code: string;
  currency: string;
  opening_balance: number;
  current_balance: string | number | null;
  is_primary: number;
}

interface BankDetailResponse {
  success: number;
  data: {
    data: Array<{
      party_type?: string;
      total_bank_accounts?: number;
      bank_details?: BankDetail[];
    }>;
    totalRecords?: number;
    page?: number;
    limit?: number;
  };
}

/* ───────────────── Date helpers ───────────────── */

/** Format a Date object as YYYY-MM-DD (local time, no timezone drift) */
const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** First day of the current month, as YYYY-MM-DD */
const firstDayOfCurrentMonth = (): string => {
  const now = new Date();
  return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
};

/** Today, as YYYY-MM-DD */
const todayISO = (): string => toISODate(new Date());

/* ───────────────── Component ───────────────── */

const LedgerAccounts: React.FC = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<AccountEntry | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ✅ Date range filter — defaults to the current month (1st → today)
  const [fromDate, setFromDate] = useState<string>(firstDayOfCurrentMonth());
  const [toDate, setToDate] = useState<string>(todayISO());

  const [entries, setEntries] = useState<AccountEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bankSummary, setBankSummary] = useState({
    total: 0,
    banks: [] as BankDetail[],
  });

  /* ───────────────── Fetchers ───────────────── */

  const fetchEntries = async (opts?: { from?: string; to?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '1000');

      const from = opts?.from ?? fromDate;
      const to = opts?.to ?? toDate;
      if (from) params.set('from_date', from);
      if (to) params.set('to_date', to);

      const res = await api.get<AccountEntryResponse>(
        `/account_entry?${params.toString()}`
      );
      if (res.data?.success === 1) {
        setEntries(res.data.data?.records ?? []);
      } else {
        setError('Failed to load account entries.');
      }
    } catch (err: any) {
      console.error('account_entry fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load account entries.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankSummary = async () => {
    try {
      const res = await api.get<BankDetailResponse>('/bank-detail');
      if (res.data?.success === 1) {
        const groups = res.data.data?.data ?? [];
        const allBanks: BankDetail[] = groups.flatMap((g) => g.bank_details ?? []);
        const total = allBanks.reduce(
          (sum, b) => sum + Number(b.current_balance ?? b.opening_balance ?? 0),
          0
        );
        setBankSummary({ total, banks: allBanks });
      }
    } catch (err) {
      console.error('bank-detail fetch error:', err);
    }
  };

  // Initial load + whenever the date range changes
  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchBankSummary();
  }, []);

  /* ───────────────── Bank lookup map ───────────────── */

  const bankMap = useMemo(() => {
    const m = new Map<number, BankDetail>();
    bankSummary.banks.forEach((b) => m.set(b.id, b));
    return m;
  }, [bankSummary.banks]);

  const getBankLabel = (bankId: number | null | undefined) => {
    if (bankId == null) return '—';
    const b = bankMap.get(bankId);
    if (!b) return `#${bankId}`;
    return `${b.bank_name} · ${b.account_number}`;
  };

  /* ───────────────── Derived ───────────────── */

  const getGroup = (e: AccountEntry) => (e.entry_type === 'Credit' ? 'Income' : 'Expenses');
  const getType = (e: AccountEntry) => (e.entry_type === 'Credit' ? 'Income' : 'Expense');

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return entries.filter((e) => {
      const matchesSearch =
        !term ||
        e.entry_no?.toLowerCase().includes(term) ||
        e.reference_no?.toLowerCase().includes(term) ||
        e.narration?.toLowerCase().includes(term) ||
        String(e.total_amount).includes(term);

      const matchesGroup = selectedGroup === 'all' || getGroup(e) === selectedGroup;
      const matchesType = selectedType === 'all' || getType(e) === selectedType;
      const matchesBank =
        selectedBank === 'all' || String(e.bank_detail_id ?? '') === selectedBank;

      return matchesSearch && matchesGroup && matchesType && matchesBank;
    });
  }, [entries, searchTerm, selectedGroup, selectedType, selectedBank]);

  const grouped = useMemo(() => {
    const g: Record<string, AccountEntry[]> = {};
    filtered.forEach((e) => {
      const key = getGroup(e);
      if (!g[key]) g[key] = [];
      g[key].push(e);
    });
    return g;
  }, [filtered]);

  const totals = useMemo(() => {
    let credit = 0;
    let debit = 0;
    filtered.forEach((e) => {
      const amt = Number(e.total_amount || 0);
      if (e.entry_type === 'Credit') credit += amt;
      else debit += amt;
    });
    return {
      credit,
      debit,
      net: credit - debit,
    };
  }, [filtered]);

  const bankBalance = useMemo(() => {
    if (selectedBank === 'all') return bankSummary.total;
    const b = bankMap.get(Number(selectedBank));
    return b ? Number(b.current_balance ?? b.opening_balance ?? 0) : 0;
  }, [selectedBank, bankMap, bankSummary.total]);

  const bankCount = useMemo(() => {
    if (selectedBank === 'all') return bankSummary.banks.length;
    return selectedBank ? 1 : 0;
  }, [selectedBank, bankSummary.banks.length]);

  /* ───────────────── Helpers ───────────────── */

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

  // ✅ Entry type badge — replaces the old status badge in the listing.
  const getEntryTypeBadge = (type: 'Credit' | 'Debit') => {
    if (type === 'Credit') {
      return (
        <span className="entry-type-badge entry-type-credit">
          <FaArrowUp size={8} /> Credit
        </span>
      );
    }
    return (
      <span className="entry-type-badge entry-type-debit">
        <FaArrowDown size={8} /> Debit
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Asset':     return <FaWallet className="type-icon asset" />;
      case 'Liability': return <FaCreditCard className="type-icon liability" />;
      case 'Equity':    return <FaBalanceScale className="type-icon equity" />;
      case 'Income':    return <FaChartLine className="type-icon income" />;
      case 'Expense':   return <FaMoneyBillWave className="type-icon expense" />;
      default:          return null;
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'Assets':      return <FaWallet />;
      case 'Liabilities': return <FaCreditCard />;
      case 'Equity':      return <FaBalanceScale />;
      case 'Income':      return <FaChartLine />;
      case 'Expenses':    return <FaMoneyBillWave />;
      default:            return <FaFolder />;
    }
  };

  const getGroupColor = (group: string) => {
    switch (group) {
      case 'Assets':      return '#10b981';
      case 'Liabilities': return '#ef4444';
      case 'Equity':      return '#6366f1';
      case 'Income':      return '#f59e0b';
      case 'Expenses':    return '#8b5cf6';
      default:            return '#64748b';
    }
  };

  const openDetails = (entry: AccountEntry) => {
    navigate(`/account-entry/${entry.id}`);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedGroup('all');
    setSelectedType('all');
    setSelectedBank('all');
    setFromDate(firstDayOfCurrentMonth());
    setToDate(todayISO());
  };

  const hasActiveFilters =
    searchTerm ||
    selectedGroup !== 'all' ||
    selectedType !== 'all' ||
    selectedBank !== 'all' ||
    fromDate !== firstDayOfCurrentMonth() ||
    toDate !== todayISO();

  /* ───────────────── Views ───────────────── */

  const renderListView = () => (
    <div className="ledger-list-view">
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Entry No</th>
            <th>Date</th>
            <th>Party</th>
            <th>Reference</th>
            <th>Bank</th>
            <th>Mode</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((entry) => (
            <tr
              key={entry.id}
              className={selectedAccount?.id === entry.id ? 'selected' : ''}
              onClick={() => setSelectedAccount(entry)}
            >
              <td className="code-cell">{entry.entry_no}</td>
              <td>{formatDate(entry.entry_date)}</td>
              <td>
                {entry.party_name
                  ? entry.party_name
                  : `${entry.party_type} #${entry.party_id}`}
              </td>
              <td>
                <div className="ref-cell">
                  <span className="ref-type">{entry.reference_type}</span>
                  <span className="ref-no">{entry.reference_no}</span>
                </div>
              </td>
              <td>
                <span className="bank-cell" title={getBankLabel(entry.bank_detail_id)}>
                  {getBankLabel(entry.bank_detail_id)}
                </span>
              </td>
              <td>
                <span className="type-badge">{entry.payment_type}</span>
              </td>
              <td>{getEntryTypeBadge(entry.entry_type)}</td>
              <td
                className={`balance-cell ${
                  entry.entry_type === 'Credit' ? 'amount-credit' : 'amount-debit'
                }`}
              >
                {entry.entry_type === 'Credit' ? '+' : '−'}
                {formatCurrency(entry.total_amount)}
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className="action-btn-small"
                    title="View Details"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetails(entry);
                    }}
                  >
                    <FaEye />
                  </button>
                  <button className="action-btn-small" title="Edit" onClick={(e) => e.stopPropagation()}>
                    <FaEdit />
                  </button>
                  <button className="action-btn-small" title="Delete" onClick={(e) => e.stopPropagation()}>
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={9} className="empty-row">
                {loading ? 'Loading…' : 'No account entries found.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCardView = () => (
    <div className="ledger-card-view">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="ledger-group-section">
          <div className="ledger-group-header" style={{ borderLeftColor: getGroupColor(group) }}>
            <span className="ledger-group-icon" style={{ color: getGroupColor(group) }}>
              {getGroupIcon(group)}
            </span>
            <span className="ledger-group-name">{group}</span>
            <span className="ledger-group-count">({items.length})</span>
            <span className="ledger-group-total">
              {formatCurrency(items.reduce((s, i) => s + Number(i.total_amount || 0), 0))}
            </span>
          </div>
          <div className="ledger-card-grid">
            {items.map((entry) => (
              <div
                key={entry.id}
                className={`ledger-card ${selectedAccount?.id === entry.id ? 'selected' : ''}`}
                onClick={() => setSelectedAccount(entry)}
              >
                <div className="ledger-card-header">
                  <div className="ledger-card-title">
                    <span className="ledger-card-icon">{getTypeIcon(getType(entry))}</span>
                    <span className="ledger-card-name">{entry.entry_no}</span>
                  </div>
                  <span className="ledger-card-code">{entry.payment_type}</span>
                </div>
                <div className="ledger-card-body">
                  <div className="ledger-card-detail">
                    <span className="detail-label">Reference</span>
                    <span className="detail-value">
                      {entry.reference_type} · {entry.reference_no}
                    </span>
                  </div>
                  <div className="ledger-card-detail">
                    <span className="detail-label">Date</span>
                    <span className="detail-value">{formatDate(entry.entry_date)}</span>
                  </div>
                  <div className="ledger-card-detail">
                    <span className="detail-label">Bank</span>
                    <span className="detail-value">{getBankLabel(entry.bank_detail_id)}</span>
                  </div>
                  <div className="ledger-card-detail">
                    <span className="detail-label">Amount</span>
                    <span
                      className={`detail-value balance ${
                        entry.entry_type === 'Credit' ? 'amount-credit' : 'amount-debit'
                      }`}
                    >
                      {entry.entry_type === 'Credit' ? '+' : '−'}
                      {formatCurrency(entry.total_amount)}
                    </span>
                  </div>
                  <div className="ledger-card-detail">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">
                      {getEntryTypeBadge(entry.entry_type)}
                    </span>
                  </div>
                </div>
                <div className="ledger-card-footer">
                  <button
                    className="card-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetails(entry);
                    }}
                  >
                    <FaEye /> View Details
                  </button>
                  <button className="card-action-btn" onClick={(e) => e.stopPropagation()}>
                    <FaEdit />
                  </button>
                  <button className="card-action-btn" onClick={(e) => e.stopPropagation()}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  /* ───────────────── Render ───────────────── */

  return (
    <div className="ledger-accounts-page">
      {error && (
        <div className="ledger-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="ledger-header">
        <div className="ledger-header-left">
          <h1 className="ledger-page-title">
            <FaBook className="title-icon" />
            Ledger Accounts
          </h1>
          <p className="ledger-page-subtitle">
            Manage all your ledger accounts and their details
          </p>
        </div>
        <div className="ledger-header-right">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> New Ledger
          </button>
          <button className="btn-secondary">
            <FaDownload /> Export
          </button>
          <button className="btn-secondary">
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="ledger-stats-bar ledger-stats-bar--five">
        <div className="ledger-stat-item">
          <span className="ledger-stat-label">
            {selectedBank === 'all' ? 'Current Bank Balance' : 'Selected Bank Balance'}
          </span>
          <span className="ledger-stat-value text-green">
            {formatCurrency(bankBalance)}
          </span>
        </div>
        <div className="ledger-stat-item">
          <span className="ledger-stat-label">Total Credit</span>
          <span className="ledger-stat-value text-green">
            +{formatCurrency(totals.credit)}
          </span>
        </div>
        <div className="ledger-stat-item">
          <span className="ledger-stat-label">Total Debit</span>
          <span className="ledger-stat-value text-red">
            −{formatCurrency(totals.debit)}
          </span>
        </div>
        <div className="ledger-stat-item">
          <span className="ledger-stat-label">Net Balance</span>
          <span
            className={`ledger-stat-value ${
              totals.net >= 0 ? 'text-blue' : 'text-red'
            }`}
          >
            {formatCurrency(totals.net)}
          </span>
        </div>
        <div className="ledger-stat-item">
          <span className="ledger-stat-label">
            {selectedBank === 'all' ? 'Bank Accounts' : 'Selected Accounts'}
          </span>
          <span className="ledger-stat-value text-purple">{bankCount}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ledger-toolbar">
        <div className="ledger-toolbar-left">
          <div className="ledger-search-box">
            <FaSearch className="ledger-search-icon" />
            <input
              type="text"
              placeholder="Search by entry no, reference no, narration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ledger-search-input"
            />
            {searchTerm && (
              <button className="ledger-clear-search" onClick={() => setSearchTerm('')}>
                ×
              </button>
            )}
          </div>

          <div className="ledger-filter-group">
            <select
              className="ledger-filter-select"
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
            >
              <option value="all">All Groups</option>
              <option value="Income">Income (Credit)</option>
              <option value="Expenses">Expenses (Debit)</option>
            </select>

            {/* <select
              className="ledger-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select> */}

            <select
              className="ledger-filter-select"
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
            >
              <option value="all">All Banks</option>
              {bankSummary.banks.map((bank) => (
                <option key={bank.id} value={String(bank.id)}>
                  {bank.bank_name} · {bank.account_number}
                  {bank.is_primary === 1 ? ' (P)' : ''}
                </option>
              ))}
            </select>

            {/* ✅ Date range filter — native picker fixes applied */}
            <div className="ledger-date-filter">
              <FaCalendarAlt className="ledger-date-icon" />

              {/* FROM */}
              <input
                type="date"
                className="ledger-date-input"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                onClick={(e) => {
                  // ✅ Force the native picker to open (Chromium).
                  const input = e.currentTarget as HTMLInputElement & {
                    showPicker?: () => void;
                  };
                  if (typeof input.showPicker === 'function') {
                    try { input.showPicker(); } catch { /* ignore */ }
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                aria-label="From date"
              />

              <span className="ledger-date-sep">→</span>

              {/* TO */}
              <input
                type="date"
                className="ledger-date-input"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                onClick={(e) => {
                  const input = e.currentTarget as HTMLInputElement & {
                    showPicker?: () => void;
                  };
                  if (typeof input.showPicker === 'function') {
                    try { input.showPicker(); } catch { /* ignore */ }
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                aria-label="To date"
              />
            </div>

            {hasActiveFilters && (
              <button className="btn-secondary" onClick={clearAllFilters}>
                <FaFilter /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="ledger-toolbar-right">
          <div className="ledger-view-toggle">
            <button
              className={`ledger-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <FaFileAlt />
            </button>
            <button
              className={`ledger-view-btn ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              title="Card View"
            >
              <FaFolder />
            </button>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="ledger-active-filters">
          {searchTerm && (
            <span className="ledger-chip">
              Search: "{searchTerm}"
              <button onClick={() => setSearchTerm('')}>×</button>
            </span>
          )}
          {selectedGroup !== 'all' && (
            <span className="ledger-chip">
              Group: {selectedGroup}
              <button onClick={() => setSelectedGroup('all')}>×</button>
            </span>
          )}
          {selectedType !== 'all' && (
            <span className="ledger-chip">
              Type: {selectedType}
              <button onClick={() => setSelectedType('all')}>×</button>
            </span>
          )}
          {selectedBank !== 'all' && (
            <span className="ledger-chip">
              Bank: {getBankLabel(Number(selectedBank))}
              <button onClick={() => setSelectedBank('all')}>×</button>
            </span>
          )}
          {(fromDate !== firstDayOfCurrentMonth() || toDate !== todayISO()) && (
            <span className="ledger-chip">
              Date: {fromDate || '…'} → {toDate || '…'}
              <button
                onClick={() => {
                  setFromDate(firstDayOfCurrentMonth());
                  setToDate(todayISO());
                }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="ledger-content">
        <div className="ledger-main">
          {viewMode === 'list' && renderListView()}
          {viewMode === 'card' && renderCardView()}
        </div>

        {/* Sidebar */}
        {selectedAccount && (
          <div className="ledger-sidebar">
            <div className="ledger-sidebar-header">
              <h3>Entry Details</h3>
              <button
                className="ledger-close-sidebar"
                onClick={() => setSelectedAccount(null)}
              >
                ×
              </button>
            </div>
            <div className="ledger-sidebar-content">
              <div className="ledger-detail-field">
                <label>Entry No</label>
                <span className="ledger-detail-value">{selectedAccount.entry_no}</span>
              </div>
              <div className="ledger-detail-field">
                <label>Entry Date</label>
                <span className="ledger-detail-value">
                  {formatDate(selectedAccount.entry_date)}
                </span>
              </div>
              <div className="ledger-detail-field">
                <label>Entry Type</label>
                <span className="ledger-detail-value">
                  {getEntryTypeBadge(selectedAccount.entry_type)}
                </span>
              </div>
              <div className="ledger-detail-field">
                <label>Party</label>
                <span className="ledger-detail-value">
                  {selectedAccount.party_name ||
                    `${selectedAccount.party_type} #${selectedAccount.party_id}`}
                </span>
              </div>
              <div className="ledger-detail-field">
                <label>Reference</label>
                <span className="ledger-detail-value">
                  {selectedAccount.reference_type} · {selectedAccount.reference_no}
                </span>
              </div>
              <div className="ledger-detail-field">
                <label>Bank</label>
                <span className="ledger-detail-value">
                  {getBankLabel(selectedAccount.bank_detail_id)}
                </span>
              </div>
              <div className="ledger-detail-field">
                <label>Payment Mode</label>
                <span className="ledger-detail-value">{selectedAccount.payment_type}</span>
              </div>
              <div className="ledger-detail-field">
                <label>Amount</label>
                <span
                  className={`ledger-detail-value balance-large ${
                    selectedAccount.entry_type === 'Credit'
                      ? 'amount-credit'
                      : 'amount-debit'
                  }`}
                >
                  {selectedAccount.entry_type === 'Credit' ? '+' : '−'}
                  {formatCurrency(selectedAccount.total_amount)}
                </span>
              </div>
              {selectedAccount.narration && (
                <div className="ledger-detail-field">
                  <label>Narration</label>
                  <span className="ledger-detail-value">{selectedAccount.narration}</span>
                </div>
              )}
              <div className="ledger-sidebar-actions">
                <button
                  className="btn-primary full-width"
                  onClick={() => openDetails(selectedAccount)}
                >
                  <FaHistory /> View Full Details
                </button>
                <button className="btn-secondary full-width">
                  <FaEdit /> Edit Entry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal (unchanged) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Ledger</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ledger Name *</label>
                <input type="text" className="form-input" placeholder="Enter ledger name" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ledger Code *</label>
                  <input type="text" className="form-input" placeholder="e.g., 101" />
                </div>
                <div className="form-group">
                  <label>Group *</label>
                  <select className="form-select">
                    <option value="">Select Group</option>
                    <option value="Assets">Assets</option>
                    <option value="Liabilities">Liabilities</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expenses">Expenses</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Enter ledger description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary">
                <FaPlus /> Create Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerAccounts;