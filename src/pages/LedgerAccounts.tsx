import React, { useState } from 'react';
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
  FaBook
} from 'react-icons/fa';

interface LedgerAccount {
  id: string;
  name: string;
  code: string;
  group: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  balance: number;
  openingBalance: number;
  currentBalance: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
  description?: string;
  parentGroup?: string;
  taxRate?: number;
  bankDetails?: {
    accountNumber?: string;
    bankName?: string;
    ifscCode?: string;
  };
}

const LedgerAccounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<LedgerAccount | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Sample data - In real app, this would come from API
  const ledgerAccounts: LedgerAccount[] = [
    // Assets
    { 
      id: '1', 
      name: 'Cash in Hand', 
      code: '101', 
      group: 'Assets',
      type: 'Asset',
      balance: 150000,
      openingBalance: 100000,
      currentBalance: 150000,
      status: 'Active',
      createdAt: '2024-01-01',
      description: 'Physical cash available at office',
      parentGroup: 'Current Assets'
    },
    { 
      id: '2', 
      name: 'SBI Current Account', 
      code: '102-01', 
      group: 'Assets',
      type: 'Asset',
      balance: 300000,
      openingBalance: 250000,
      currentBalance: 300000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Bank Accounts',
      bankDetails: {
        accountNumber: '12345678901',
        bankName: 'State Bank of India',
        ifscCode: 'SBIN0001234'
      }
    },
    { 
      id: '3', 
      name: 'HDFC Savings Account', 
      code: '102-02', 
      group: 'Assets',
      type: 'Asset',
      balance: 200000,
      openingBalance: 200000,
      currentBalance: 200000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Bank Accounts',
      bankDetails: {
        accountNumber: '98765432109',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0005678'
      }
    },
    { 
      id: '4', 
      name: 'Accounts Receivable', 
      code: '103', 
      group: 'Assets',
      type: 'Asset',
      balance: 250000,
      openingBalance: 200000,
      currentBalance: 250000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Current Assets'
    },
    { 
      id: '5', 
      name: 'Inventory - Raw Materials', 
      code: '104-01', 
      group: 'Assets',
      type: 'Asset',
      balance: 500000,
      openingBalance: 450000,
      currentBalance: 500000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Inventory'
    },
    { 
      id: '6', 
      name: 'Inventory - Finished Goods', 
      code: '104-02', 
      group: 'Assets',
      type: 'Asset',
      balance: 300000,
      openingBalance: 300000,
      currentBalance: 300000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Inventory'
    },
    { 
      id: '7', 
      name: 'Office Equipment', 
      code: '105-01', 
      group: 'Assets',
      type: 'Asset',
      balance: 500000,
      openingBalance: 450000,
      currentBalance: 500000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Fixed Assets'
    },
    { 
      id: '8', 
      name: 'Vehicles', 
      code: '105-02', 
      group: 'Assets',
      type: 'Asset',
      balance: 700000,
      openingBalance: 650000,
      currentBalance: 700000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Fixed Assets'
    },

    // Liabilities
    { 
      id: '9', 
      name: 'Accounts Payable', 
      code: '201', 
      group: 'Liabilities',
      type: 'Liability',
      balance: 180000,
      openingBalance: 150000,
      currentBalance: 180000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Current Liabilities'
    },
    { 
      id: '10', 
      name: 'Bank Loan - SBI', 
      code: '202-01', 
      group: 'Liabilities',
      type: 'Liability',
      balance: 600000,
      openingBalance: 700000,
      currentBalance: 600000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Long Term Liabilities'
    },
    { 
      id: '11', 
      name: 'Bank Loan - HDFC', 
      code: '202-02', 
      group: 'Liabilities',
      type: 'Liability',
      balance: 400000,
      openingBalance: 500000,
      currentBalance: 400000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Long Term Liabilities'
    },
    { 
      id: '12', 
      name: 'GST Payable', 
      code: '203-01', 
      group: 'Liabilities',
      type: 'Liability',
      balance: 45000,
      openingBalance: 30000,
      currentBalance: 45000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Tax Liabilities',
      taxRate: 18
    },
    { 
      id: '13', 
      name: 'TDS Payable', 
      code: '203-02', 
      group: 'Liabilities',
      type: 'Liability',
      balance: 30000,
      openingBalance: 20000,
      currentBalance: 30000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Tax Liabilities',
      taxRate: 10
    },

    // Equity
    { 
      id: '14', 
      name: 'Capital Account', 
      code: '301', 
      group: 'Equity',
      type: 'Equity',
      balance: 2000000,
      openingBalance: 2000000,
      currentBalance: 2000000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Owners Equity'
    },
    { 
      id: '15', 
      name: 'Retained Earnings', 
      code: '302', 
      group: 'Equity',
      type: 'Equity',
      balance: 500000,
      openingBalance: 400000,
      currentBalance: 500000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Owners Equity'
    },

    // Income
    { 
      id: '16', 
      name: 'Sales Revenue', 
      code: '401', 
      group: 'Income',
      type: 'Income',
      balance: 1500000,
      openingBalance: 1200000,
      currentBalance: 1500000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Operating Income'
    },
    { 
      id: '17', 
      name: 'Service Revenue', 
      code: '402', 
      group: 'Income',
      type: 'Income',
      balance: 400000,
      openingBalance: 350000,
      currentBalance: 400000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Operating Income'
    },
    { 
      id: '18', 
      name: 'Interest Income', 
      code: '403', 
      group: 'Income',
      type: 'Income',
      balance: 25000,
      openingBalance: 20000,
      currentBalance: 25000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Non-Operating Income'
    },

    // Expenses
    { 
      id: '19', 
      name: 'Rent Expense', 
      code: '501', 
      group: 'Expenses',
      type: 'Expense',
      balance: 120000,
      openingBalance: 100000,
      currentBalance: 120000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Operating Expenses'
    },
    { 
      id: '20', 
      name: 'Salary Expense', 
      code: '502', 
      group: 'Expenses',
      type: 'Expense',
      balance: 600000,
      openingBalance: 550000,
      currentBalance: 600000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Operating Expenses'
    },
    { 
      id: '21', 
      name: 'Utilities Expense', 
      code: '503', 
      group: 'Expenses',
      type: 'Expense',
      balance: 45000,
      openingBalance: 40000,
      currentBalance: 45000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Operating Expenses'
    },
    { 
      id: '22', 
      name: 'Depreciation Expense', 
      code: '504', 
      group: 'Expenses',
      type: 'Expense',
      balance: 80000,
      openingBalance: 70000,
      currentBalance: 80000,
      status: 'Active',
      createdAt: '2024-01-01',
      parentGroup: 'Non-Operating Expenses'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active' 
      ? <span className="status-badge active">● Active</span>
      : <span className="status-badge inactive">● Inactive</span>;
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Asset': return <FaWallet className="type-icon asset" />;
      case 'Liability': return <FaCreditCard className="type-icon liability" />;
      case 'Equity': return <FaBalanceScale className="type-icon equity" />;
      case 'Income': return <FaChartLine className="type-icon income" />;
      case 'Expense': return <FaMoneyBillWave className="type-icon expense" />;
      default: return null;
    }
  };

  const getGroupIcon = (group: string) => {
    switch(group) {
      case 'Assets': return <FaWallet />;
      case 'Liabilities': return <FaCreditCard />;
      case 'Equity': return <FaBalanceScale />;
      case 'Income': return <FaChartLine />;
      case 'Expenses': return <FaMoneyBillWave />;
      default: return <FaFolder />;
    }
  };

  const getGroupColor = (group: string) => {
    switch(group) {
      case 'Assets': return '#10b981';
      case 'Liabilities': return '#ef4444';
      case 'Equity': return '#6366f1';
      case 'Income': return '#f59e0b';
      case 'Expenses': return '#8b5cf6';
      default: return '#64748b';
    }
  };

  const filteredAccounts = ledgerAccounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          account.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === 'all' || account.group === selectedGroup;
    const matchesType = selectedType === 'all' || account.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || account.status === selectedStatus;
    return matchesSearch && matchesGroup && matchesType && matchesStatus;
  });

  const getGroupedAccounts = () => {
    const groups: { [key: string]: LedgerAccount[] } = {};
    filteredAccounts.forEach(account => {
      if (!groups[account.group]) {
        groups[account.group] = [];
      }
      groups[account.group].push(account);
    });
    return groups;
  };

  const groupedAccounts = getGroupedAccounts();

  const getTotalBalance = () => {
    return filteredAccounts.reduce((sum, account) => sum + account.balance, 0);
  };

  const renderListView = () => {
    return (
      <div className="ledger-list-view">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Account Name</th>
              <th>Group</th>
              <th>Type</th>
              <th>Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.map(account => (
              <tr 
                key={account.id}
                className={selectedAccount?.id === account.id ? 'selected' : ''}
                onClick={() => setSelectedAccount(account)}
              >
                <td className="code-cell">{account.code}</td>
                <td className="name-cell">
                  <span className="account-name-with-icon">
                    {getTypeIcon(account.type)}
                    {account.name}
                  </span>
                </td>
                <td>
                  <span className="group-badge" style={{ background: getGroupColor(account.group) + '20', color: getGroupColor(account.group) }}>
                    {account.group}
                  </span>
                </td>
                <td>
                  <span className="type-badge">
                    {getTypeIcon(account.type)}
                    {account.type}
                  </span>
                </td>
                <td className="balance-cell">{formatCurrency(account.balance)}</td>
                <td>{getStatusBadge(account.status)}</td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn-small" title="View Ledger" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccount(account);
                      setShowLedgerModal(true);
                    }}>
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
          </tbody>
        </table>
      </div>
    );
  };

  const renderCardView = () => {
    return (
      <div className="ledger-card-view">
        {Object.entries(groupedAccounts).map(([group, accounts]) => (
          <div key={group} className="ledger-group-section">
            <div className="ledger-group-header" style={{ borderLeftColor: getGroupColor(group) }}>
              <span className="ledger-group-icon" style={{ color: getGroupColor(group) }}>
                {getGroupIcon(group)}
              </span>
              <span className="ledger-group-name">{group}</span>
              <span className="ledger-group-count">({accounts.length})</span>
              <span className="ledger-group-total">{formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}</span>
            </div>
            <div className="ledger-card-grid">
              {accounts.map(account => (
                <div 
                  key={account.id}
                  className={`ledger-card ${selectedAccount?.id === account.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="ledger-card-header">
                    <div className="ledger-card-title">
                      <span className="ledger-card-icon">{getTypeIcon(account.type)}</span>
                      <span className="ledger-card-name">{account.name}</span>
                    </div>
                    <span className="ledger-card-code">{account.code}</span>
                  </div>
                  <div className="ledger-card-body">
                    <div className="ledger-card-detail">
                      <span className="detail-label">Group</span>
                      <span className="detail-value">{account.group}</span>
                    </div>
                    <div className="ledger-card-detail">
                      <span className="detail-label">Type</span>
                      <span className="detail-value">{account.type}</span>
                    </div>
                    <div className="ledger-card-detail">
                      <span className="detail-label">Balance</span>
                      <span className="detail-value balance">{formatCurrency(account.balance)}</span>
                    </div>
                    <div className="ledger-card-detail">
                      <span className="detail-label">Status</span>
                      <span className="detail-value">{getStatusBadge(account.status)}</span>
                    </div>
                  </div>
                  <div className="ledger-card-footer">
                    <button className="card-action-btn" title="View Ledger" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAccount(account);
                      setShowLedgerModal(true);
                    }}>
                      <FaEye /> View Ledger
                    </button>
                    <button className="card-action-btn" title="Edit" onClick={(e) => e.stopPropagation()}>
                      <FaEdit />
                    </button>
                    <button className="card-action-btn" title="Delete" onClick={(e) => e.stopPropagation()}>
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
  };

  return (
    <>
      <style>{`
        /* ===== LEDGER ACCOUNTS PAGE ===== */
        .ledger-accounts-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .ledger-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .ledger-header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ledger-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .ledger-page-title .title-icon {
          color: #2c7a8a;
        }

        .ledger-page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .ledger-header-right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        /* ===== BUTTONS ===== */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2c7a8a;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #1f5f6b;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(44, 122, 138, 0.3);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
          border-color: #2c7a8a;
          color: #2c7a8a;
        }

        /* ===== STATS BAR ===== */
        .ledger-stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .ledger-stat-item {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .ledger-stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .ledger-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }

        .ledger-stat-value.text-green {
          color: #10b981;
        }
        .ledger-stat-value.text-red {
          color: #ef4444;
        }
        .ledger-stat-value.text-blue {
          color: #3b82f6;
        }
        .ledger-stat-value.text-purple {
          color: #8b5cf6;
        }

        /* ===== TOOLBAR ===== */
        .ledger-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .ledger-toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }

        .ledger-search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .ledger-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .ledger-search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
        }

        .ledger-search-input:focus {
          outline: none;
          border-color: #2c7a8a;
          box-shadow: 0 0 0 3px rgba(44, 122, 138, 0.1);
          background: #ffffff;
        }

        .ledger-clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 18px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .ledger-clear-search:hover {
          color: #1e293b;
        }

        .ledger-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ledger-filter-select {
          padding: 10px 36px 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .ledger-filter-select:focus {
          outline: none;
          border-color: #2c7a8a;
        }

        .ledger-toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ledger-view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .ledger-view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .ledger-view-btn:hover {
          color: #64748b;
        }

        .ledger-view-btn.active {
          background: #ffffff;
          color: #2c7a8a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* ===== CONTENT ===== */
        .ledger-content {
          display: flex;
          gap: 24px;
        }

        .ledger-main {
          flex: 1;
          min-width: 0;
        }

        /* ===== LIST VIEW ===== */
        .ledger-list-view {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .ledger-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ledger-table thead {
          background: #f8fafc;
        }

        .ledger-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .ledger-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .ledger-table tbody tr {
          cursor: pointer;
          transition: background 0.15s;
        }

        .ledger-table tbody tr:hover {
          background: #f8fafc;
        }

        .ledger-table tbody tr.selected {
          background: #f0f9ff;
        }

        .code-cell {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #94a3b8;
        }

        .name-cell {
          font-weight: 500;
        }

        .account-name-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .balance-cell {
          font-weight: 600;
        }

        .group-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #64748b;
        }

        .type-icon {
          font-size: 12px;
        }

        .type-icon.asset { color: #10b981; }
        .type-icon.liability { color: #ef4444; }
        .type-icon.equity { color: #6366f1; }
        .type-icon.income { color: #f59e0b; }
        .type-icon.expense { color: #8b5cf6; }

        .table-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn-small {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }

        .action-btn-small:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        /* ===== CARD VIEW ===== */
        .ledger-card-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .ledger-group-section {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .ledger-group-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-left: 4px solid;
          background: #f8fafc;
        }

        .ledger-group-icon {
          font-size: 18px;
        }

        .ledger-group-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .ledger-group-count {
          font-size: 13px;
          color: #94a3b8;
        }

        .ledger-group-total {
          margin-left: auto;
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .ledger-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          padding: 16px;
        }

        .ledger-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ledger-card:hover {
          border-color: #2c7a8a;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .ledger-card.selected {
          border-color: #2c7a8a;
          background: #f0f9ff;
        }

        .ledger-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }

        .ledger-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ledger-card-icon {
          font-size: 14px;
        }

        .ledger-card-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .ledger-card-code {
          font-size: 12px;
          color: #94a3b8;
          font-family: 'Courier New', monospace;
          padding: 2px 8px;
          background: #f1f5f9;
          border-radius: 4px;
        }

        .ledger-card-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
        }

        .ledger-card-detail {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ledger-card-detail .detail-label {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ledger-card-detail .detail-value {
          font-size: 13px;
          color: #1e293b;
        }

        .ledger-card-detail .detail-value.balance {
          font-weight: 600;
          color: #2c7a8a;
        }

        .ledger-card-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f1f5f9;
        }

        .card-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #ffffff;
          color: #64748b;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .card-action-btn:hover {
          background: #f1f5f9;
          border-color: #2c7a8a;
          color: #2c7a8a;
        }

        /* ===== STATUS BADGE ===== */
        .status-badge {
          font-size: 12px;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .status-badge.active {
          color: #10b981;
          background: #ecfdf5;
        }

        .status-badge.inactive {
          color: #ef4444;
          background: #fef2f2;
        }

        /* ===== SIDEBAR ===== */
        .ledger-sidebar {
          width: 340px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          padding: 0;
          max-height: calc(100vh - 320px);
          position: sticky;
          top: 24px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .ledger-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .ledger-sidebar-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .ledger-close-sidebar {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .ledger-close-sidebar:hover {
          color: #1e293b;
        }

        .ledger-sidebar-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .ledger-detail-field {
          margin-bottom: 16px;
        }

        .ledger-detail-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .ledger-detail-value {
          font-size: 14px;
          color: #1e293b;
          display: block;
        }

        .ledger-detail-value.balance-large {
          font-size: 24px;
          font-weight: 700;
          color: #2c7a8a;
        }

        .ledger-sidebar-actions {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-width {
          width: 100%;
          justify-content: center;
        }

        /* ===== LEDGER VIEW MODAL ===== */
        .ledger-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .ledger-modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .ledger-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .ledger-modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .ledger-modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .ledger-modal-close:hover {
          color: #1e293b;
        }

        .ledger-modal-body {
          padding: 24px;
        }

        .ledger-transaction-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }

        .ledger-transaction-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          border-bottom: 2px solid #e2e8f0;
        }

        .ledger-transaction-table td {
          padding: 10px 12px;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .ledger-transaction-table .credit {
          color: #10b981;
        }

        .ledger-transaction-table .debit {
          color: #ef4444;
        }

        /* ===== MODAL ===== */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .modal-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .modal-close:hover {
          color: #1e293b;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 6px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .form-input,
        .form-select,
        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #1e293b;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2c7a8a;
          box-shadow: 0 0 0 3px rgba(44, 122, 138, 0.1);
          background: #ffffff;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .ledger-sidebar {
            width: 280px;
          }
        }

        @media (max-width: 992px) {
          .ledger-content {
            flex-direction: column;
          }
          
          .ledger-sidebar {
            width: 100%;
            max-height: 400px;
            position: relative;
            top: 0;
          }
          
          .ledger-stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .ledger-accounts-page {
            padding: 16px;
          }
          
          .ledger-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .ledger-header-right {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .ledger-header-right .btn-primary,
          .ledger-header-right .btn-secondary {
            flex: 1;
            justify-content: center;
          }
          
          .ledger-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .ledger-toolbar-left {
            flex-direction: column;
            align-items: stretch;
          }
          
          .ledger-search-box {
            min-width: auto;
          }
          
          .ledger-filter-group {
            flex-wrap: wrap;
          }
          
          .ledger-filter-select {
            flex: 1;
          }
          
          .ledger-toolbar-right {
            justify-content: center;
          }
          
          .ledger-stats-bar {
            grid-template-columns: 1fr 1fr;
          }
          
          .ledger-table {
            font-size: 13px;
          }
          
          .ledger-table th,
          .ledger-table td {
            padding: 8px 10px;
          }
          
          .ledger-card-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-content,
          .ledger-modal-content {
            margin: 16px;
            max-height: 95vh;
          }
        }

        @media (max-width: 480px) {
          .ledger-stats-bar {
            grid-template-columns: 1fr;
          }
          
          .ledger-table {
            display: block;
            overflow-x: auto;
          }
          
          .ledger-header-right .btn-primary,
          .ledger-header-right .btn-secondary {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="ledger-accounts-page">
        {/* Page Header */}
        <div className="ledger-header">
          <div className="ledger-header-left">
            <h1 className="ledger-page-title">
              <FaBook className="title-icon" />
              Ledger Accounts
            </h1>
            <p className="ledger-page-subtitle">Manage all your ledger accounts and their details</p>
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
        <div className="ledger-stats-bar">
          <div className="ledger-stat-item">
            <span className="ledger-stat-label">Total Ledgers</span>
            <span className="ledger-stat-value">{filteredAccounts.length}</span>
          </div>
          <div className="ledger-stat-item">
            <span className="ledger-stat-label">Total Balance</span>
            <span className="ledger-stat-value text-blue">{formatCurrency(getTotalBalance())}</span>
          </div>
          <div className="ledger-stat-item">
            <span className="ledger-stat-label">Active</span>
            <span className="ledger-stat-value text-green">{filteredAccounts.filter(a => a.status === 'Active').length}</span>
          </div>
          <div className="ledger-stat-item">
            <span className="ledger-stat-label">Inactive</span>
            <span className="ledger-stat-value text-red">{filteredAccounts.filter(a => a.status === 'Inactive').length}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ledger-toolbar">
          <div className="ledger-toolbar-left">
            <div className="ledger-search-box">
              <FaSearch className="ledger-search-icon" />
              <input
                type="text"
                placeholder="Search ledgers by name, code, or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ledger-search-input"
              />
              {searchTerm && (
                <button 
                  className="ledger-clear-search"
                  onClick={() => setSearchTerm('')}
                >
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
                <option value="Assets">Assets</option>
                <option value="Liabilities">Liabilities</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expenses">Expenses</option>
              </select>
              <select 
                className="ledger-filter-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Asset">Asset</option>
                <option value="Liability">Liability</option>
                <option value="Equity">Equity</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              <select 
                className="ledger-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <button className="btn-secondary">
                <FaFilter /> Filter
              </button>
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

        {/* Main Content */}
        <div className="ledger-content">
          <div className="ledger-main">
            {viewMode === 'list' && renderListView()}
            {viewMode === 'card' && renderCardView()}
          </div>

          {/* Sidebar - Ledger Details */}
          {selectedAccount && !showLedgerModal && (
            <div className="ledger-sidebar">
              <div className="ledger-sidebar-header">
                <h3>Ledger Details</h3>
                <button 
                  className="ledger-close-sidebar"
                  onClick={() => setSelectedAccount(null)}
                >
                  ×
                </button>
              </div>
              <div className="ledger-sidebar-content">
                <div className="ledger-detail-field">
                  <label>Account Name</label>
                  <span className="ledger-detail-value">{selectedAccount.name}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Account Code</label>
                  <span className="ledger-detail-value">{selectedAccount.code}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Group</label>
                  <span className="ledger-detail-value">{selectedAccount.group}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Type</label>
                  <span className="ledger-detail-value">{selectedAccount.type}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Parent Group</label>
                  <span className="ledger-detail-value">{selectedAccount.parentGroup || 'N/A'}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Balance</label>
                  <span className="ledger-detail-value balance-large">
                    {formatCurrency(selectedAccount.balance)}
                  </span>
                </div>
                <div className="ledger-detail-field">
                  <label>Opening Balance</label>
                  <span className="ledger-detail-value">{formatCurrency(selectedAccount.openingBalance)}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Current Balance</label>
                  <span className="ledger-detail-value">{formatCurrency(selectedAccount.currentBalance)}</span>
                </div>
                {selectedAccount.taxRate && (
                  <div className="ledger-detail-field">
                    <label>Tax Rate</label>
                    <span className="ledger-detail-value">{selectedAccount.taxRate}%</span>
                  </div>
                )}
                <div className="ledger-detail-field">
                  <label>Status</label>
                  <span className="ledger-detail-value">{getStatusBadge(selectedAccount.status)}</span>
                </div>
                <div className="ledger-detail-field">
                  <label>Created Date</label>
                  <span className="ledger-detail-value">{selectedAccount.createdAt}</span>
                </div>
                {selectedAccount.bankDetails && (
                  <>
                    <div className="ledger-detail-field">
                      <label>Bank Name</label>
                      <span className="ledger-detail-value">{selectedAccount.bankDetails.bankName}</span>
                    </div>
                    <div className="ledger-detail-field">
                      <label>Account Number</label>
                      <span className="ledger-detail-value">{selectedAccount.bankDetails.accountNumber}</span>
                    </div>
                    <div className="ledger-detail-field">
                      <label>IFSC Code</label>
                      <span className="ledger-detail-value">{selectedAccount.bankDetails.ifscCode}</span>
                    </div>
                  </>
                )}
                {selectedAccount.description && (
                  <div className="ledger-detail-field">
                    <label>Description</label>
                    <span className="ledger-detail-value">{selectedAccount.description}</span>
                  </div>
                )}
                <div className="ledger-sidebar-actions">
                  <button className="btn-primary full-width" onClick={() => setShowLedgerModal(true)}>
                    <FaHistory /> View Ledger
                  </button>
                  <button className="btn-secondary full-width">
                    <FaEdit /> Edit Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Ledger Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Ledger</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
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
                <div className="form-row">
                  <div className="form-group">
                    <label>Type *</label>
                    <select className="form-select">
                      <option value="Asset">Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                      <option value="Equity">Equity</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Opening Balance</label>
                    <input type="number" className="form-input" placeholder="0.00" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Parent Group</label>
                  <input type="text" className="form-input" placeholder="e.g., Current Assets" />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-textarea" rows={3} placeholder="Enter ledger description" />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
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

        {/* View Ledger Modal */}
        {showLedgerModal && selectedAccount && (
          <div className="ledger-modal-overlay" onClick={() => setShowLedgerModal(false)}>
            <div className="ledger-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="ledger-modal-header">
                <h2>
                  <FaBook style={{ marginRight: '8px', color: '#2c7a8a' }} />
                  Ledger: {selectedAccount.name}
                </h2>
                <button className="ledger-modal-close" onClick={() => setShowLedgerModal(false)}>×</button>
              </div>
              <div className="ledger-modal-body">
                <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Code</span>
                    <div style={{ fontWeight: '600' }}>{selectedAccount.code}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Group</span>
                    <div style={{ fontWeight: '600' }}>{selectedAccount.group}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Balance</span>
                    <div style={{ fontWeight: '700', color: '#2c7a8a' }}>{formatCurrency(selectedAccount.balance)}</div>
                  </div>
                </div>
                
                <table className="ledger-transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Voucher Type</th>
                      <th>Voucher No.</th>
                      <th>Particulars</th>
                      <th style={{ textAlign: 'right' }}>Debit</th>
                      <th style={{ textAlign: 'right' }}>Credit</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>01-Jan-2024</td>
                      <td>Opening</td>
                      <td>-</td>
                      <td>Opening Balance</td>
                      <td className="debit" style={{ textAlign: 'right' }}>{formatCurrency(selectedAccount.openingBalance)}</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(selectedAccount.openingBalance)}</td>
                    </tr>
                    <tr>
                      <td>15-Jan-2024</td>
                      <td>Journal</td>
                      <td>J-001</td>
                      <td>Purchase transaction</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td className="credit" style={{ textAlign: 'right' }}>{formatCurrency(25000)}</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(selectedAccount.openingBalance - 25000)}</td>
                    </tr>
                    <tr>
                      <td>20-Jan-2024</td>
                      <td>Payment</td>
                      <td>P-002</td>
                      <td>Payment to vendor</td>
                      <td className="debit" style={{ textAlign: 'right' }}>{formatCurrency(15000)}</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(selectedAccount.openingBalance - 25000 + 15000)}</td>
                    </tr>
                    <tr>
                      <td>31-Jan-2024</td>
                      <td>Closing</td>
                      <td>-</td>
                      <td>Closing Balance</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ textAlign: 'right' }}>-</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#2c7a8a' }}>{formatCurrency(selectedAccount.balance)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LedgerAccounts;