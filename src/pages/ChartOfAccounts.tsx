import React, { useState } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaDownload, 
  FaPrint,
  FaEllipsisV,
  FaChevronDown,
  FaChevronRight,
  FaFolder,
  FaFolderOpen,
  FaFileAlt,
  FaWallet,
  FaCreditCard,
  FaBalanceScale,
  FaChartLine,
  FaMoneyBillWave,
 
  FaBook
} from 'react-icons/fa';

interface Account {
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
  children?: Account[];
}

interface AccountGroup {
  name: string;
  icon: React.ReactNode;
  color: string;
  accounts: Account[];
}

const ChartOfAccounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Assets', 'Liabilities', 'Equity']));
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'summary'>('tree');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Sample data - In real app, this would come from API
  const accountGroups: AccountGroup[] = [
    {
      name: 'Assets',
      icon: <FaWallet />,
      color: '#10b981',
      accounts: [
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
          description: 'Physical cash available at office'
        },
        { 
          id: '2', 
          name: 'Bank Accounts', 
          code: '102', 
          group: 'Assets',
          type: 'Asset',
          balance: 500000,
          openingBalance: 450000,
          currentBalance: 500000,
          status: 'Active',
          createdAt: '2024-01-01',
          children: [
            {
              id: '2a',
              name: 'SBI Current Account',
              code: '102-01',
              group: 'Assets',
              type: 'Asset',
              balance: 300000,
              openingBalance: 250000,
              currentBalance: 300000,
              status: 'Active',
              createdAt: '2024-01-01'
            },
            {
              id: '2b',
              name: 'HDFC Savings Account',
              code: '102-02',
              group: 'Assets',
              type: 'Asset',
              balance: 200000,
              openingBalance: 200000,
              currentBalance: 200000,
              status: 'Active',
              createdAt: '2024-01-01'
            }
          ]
        },
        { 
          id: '3', 
          name: 'Accounts Receivable', 
          code: '103', 
          group: 'Assets',
          type: 'Asset',
          balance: 250000,
          openingBalance: 200000,
          currentBalance: 250000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '4', 
          name: 'Inventory', 
          code: '104', 
          group: 'Assets',
          type: 'Asset',
          balance: 800000,
          openingBalance: 750000,
          currentBalance: 800000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '5', 
          name: 'Fixed Assets', 
          code: '105', 
          group: 'Assets',
          type: 'Asset',
          balance: 1200000,
          openingBalance: 1100000,
          currentBalance: 1200000,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ]
    },
    {
      name: 'Liabilities',
      icon: <FaCreditCard />,
      color: '#ef4444',
      accounts: [
        { 
          id: '6', 
          name: 'Accounts Payable', 
          code: '201', 
          group: 'Liabilities',
          type: 'Liability',
          balance: 180000,
          openingBalance: 150000,
          currentBalance: 180000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '7', 
          name: 'Bank Loans', 
          code: '202', 
          group: 'Liabilities',
          type: 'Liability',
          balance: 1000000,
          openingBalance: 1200000,
          currentBalance: 1000000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '8', 
          name: 'Tax Payable', 
          code: '203', 
          group: 'Liabilities',
          type: 'Liability',
          balance: 75000,
          openingBalance: 50000,
          currentBalance: 75000,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ]
    },
    {
      name: 'Equity',
      icon: <FaBalanceScale />,
      color: '#6366f1',
      accounts: [
        { 
          id: '9', 
          name: 'Capital Account', 
          code: '301', 
          group: 'Equity',
          type: 'Equity',
          balance: 2000000,
          openingBalance: 2000000,
          currentBalance: 2000000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '10', 
          name: 'Retained Earnings', 
          code: '302', 
          group: 'Equity',
          type: 'Equity',
          balance: 500000,
          openingBalance: 400000,
          currentBalance: 500000,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ]
    },
    {
      name: 'Income',
      icon: <FaChartLine />,
      color: '#f59e0b',
      accounts: [
        { 
          id: '11', 
          name: 'Sales Revenue', 
          code: '401', 
          group: 'Income',
          type: 'Income',
          balance: 1500000,
          openingBalance: 1200000,
          currentBalance: 1500000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '12', 
          name: 'Service Revenue', 
          code: '402', 
          group: 'Income',
          type: 'Income',
          balance: 400000,
          openingBalance: 350000,
          currentBalance: 400000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '13', 
          name: 'Interest Income', 
          code: '403', 
          group: 'Income',
          type: 'Income',
          balance: 25000,
          openingBalance: 20000,
          currentBalance: 25000,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ]
    },
    {
      name: 'Expenses',
      icon: <FaMoneyBillWave />,
      color: '#8b5cf6',
      accounts: [
        { 
          id: '14', 
          name: 'Rent Expense', 
          code: '501', 
          group: 'Expenses',
          type: 'Expense',
          balance: 120000,
          openingBalance: 100000,
          currentBalance: 120000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '15', 
          name: 'Salary Expense', 
          code: '502', 
          group: 'Expenses',
          type: 'Expense',
          balance: 600000,
          openingBalance: 550000,
          currentBalance: 600000,
          status: 'Active',
          createdAt: '2024-01-01'
        },
        { 
          id: '16', 
          name: 'Utilities Expense', 
          code: '503', 
          group: 'Expenses',
          type: 'Expense',
          balance: 45000,
          openingBalance: 40000,
          currentBalance: 45000,
          status: 'Active',
          createdAt: '2024-01-01'
        }
      ]
    }
  ];

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const getTotalBalance = () => {
    let total = 0;
    accountGroups.forEach(group => {
      group.accounts.forEach(account => {
        total += account.balance;
        if (account.children) {
          account.children.forEach(child => {
            total += child.balance;
          });
        }
      });
    });
    return total;
  };

  const getGroupTotal = (group: AccountGroup) => {
    let total = 0;
    group.accounts.forEach(account => {
      total += account.balance;
      if (account.children) {
        account.children.forEach(child => {
          total += child.balance;
        });
      }
    });
    return total;
  };

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

  const renderAccountItem = (account: Account, level: number = 0) => {
    const hasChildren = account.children && account.children.length > 0;
    
    return (
      <div key={account.id} className="account-item-wrapper">
        <div 
          className={`account-item ${selectedAccount?.id === account.id ? 'selected' : ''}`}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
          onClick={() => setSelectedAccount(account)}
        >
          <div className="account-item-left">
            <span className="account-icon">
              {hasChildren ? <FaFolderOpen /> : <FaFileAlt />}
            </span>
            <div className="account-info">
              <span className="account-name">{account.name}</span>
              <span className="account-code">{account.code}</span>
              <span className="account-type">{account.type}</span>
            </div>
          </div>
          <div className="account-item-right">
            <span className="account-balance">{formatCurrency(account.balance)}</span>
            {getStatusBadge(account.status)}
            <div className="account-actions">
              <button className="action-btn" title="Edit">
                <FaEdit />
              </button>
              <button className="action-btn" title="Delete">
                <FaTrash />
              </button>
              <button className="action-btn" title="More">
                <FaEllipsisV />
              </button>
            </div>
          </div>
        </div>
        {hasChildren && (
          <div className="account-children">
            {account.children!.map(child => renderAccountItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderTreeView = () => {
    return (
      <div className="accounts-tree">
        {accountGroups.map(group => {
          const isExpanded = expandedGroups.has(group.name);
          const filteredAccounts = group.accounts.filter(account =>
            account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            account.code.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (searchTerm && filteredAccounts.length === 0) return null;

          return (
            <div key={group.name} className="group-section">
              <div 
                className="group-header"
                onClick={() => toggleGroup(group.name)}
                style={{ borderLeftColor: group.color }}
              >
                <div className="group-header-left">
                  <span className="group-icon" style={{ color: group.color }}>
                    {group.icon}
                  </span>
                  <span className="group-name">{group.name}</span>
                  <span className="group-count">({group.accounts.length})</span>
                </div>
                <div className="group-header-right">
                  <span className="group-total">{formatCurrency(getGroupTotal(group))}</span>
                  <span className="group-toggle">
                    {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </div>
              </div>
              {isExpanded && (
                <div className="group-content">
                  {filteredAccounts.map(account => renderAccountItem(account))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderListView = () => {
    const allAccounts = accountGroups.flatMap(group => 
      group.accounts.flatMap(account => 
        account.children ? [account, ...account.children] : [account]
      )
    );

    const filtered = allAccounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="accounts-list-view">
        <table className="accounts-table">
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
            {filtered.map(account => (
              <tr 
                key={account.id}
                className={selectedAccount?.id === account.id ? 'selected' : ''}
                onClick={() => setSelectedAccount(account)}
              >
                <td className="code-cell">{account.code}</td>
                <td className="name-cell">{account.name}</td>
                <td>{account.group}</td>
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
                    <button className="action-btn-small" title="Edit">
                      <FaEdit />
                    </button>
                    <button className="action-btn-small" title="Delete">
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

  const renderSummaryView = () => {
    const summaryData = accountGroups.map(group => ({
      name: group.name,
      icon: group.icon,
      color: group.color,
      count: group.accounts.length,
      total: getGroupTotal(group),
      children: group.accounts.map(account => ({
        name: account.name,
        balance: account.balance
      }))
    }));

    return (
      <div className="accounts-summary-view">
        <div className="summary-cards">
          {summaryData.map((item, index) => (
            <div key={index} className="summary-card" style={{ borderTopColor: item.color }}>
              <div className="summary-card-header">
                <span className="summary-icon" style={{ color: item.color }}>
                  {item.icon}
                </span>
                <span className="summary-name">{item.name}</span>
                <span className="summary-count">{item.count} accounts</span>
              </div>
              <div className="summary-amount">{formatCurrency(item.total)}</div>
              <div className="summary-breakdown">
                {item.children.map((child, idx) => (
                  <div key={idx} className="summary-item">
                    <span className="summary-item-name">{child.name}</span>
                    <span className="summary-item-amount">{formatCurrency(child.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* ===== CHART OF ACCOUNTS PAGE ===== */
        .chart-of-accounts-page {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ===== HEADER ===== */
        .accounts-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding: 20px 24px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0;
        }

        .title-icon {
          color: #2c7a8a;
        }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
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
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          background: #ffffff;
          padding: 16px 20px;
          border-radius: 10px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #1e293b;
        }

        .stat-value.text-green {
          color: #10b981;
        }

        .stat-value.text-red {
          color: #ef4444;
        }

        /* ===== TOOLBAR ===== */
        .accounts-toolbar {
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

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 10px 40px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
        }

        .search-input:focus {
          outline: none;
          border-color: #2c7a8a;
          box-shadow: 0 0 0 3px rgba(44, 122, 138, 0.1);
          background: #ffffff;
        }

        .clear-search {
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

        .clear-search:hover {
          color: #1e293b;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-select {
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

        .filter-select:focus {
          outline: none;
          border-color: #2c7a8a;
        }

        .filter-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #ffffff;
          color: #64748b;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .filter-btn:hover {
          background: #f1f5f9;
          border-color: #2c7a8a;
          color: #2c7a8a;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 8px;
        }

        .view-btn {
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

        .view-btn:hover {
          color: #64748b;
        }

        .view-btn.active {
          background: #ffffff;
          color: #2c7a8a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* ===== CONTENT ===== */
        .accounts-content {
          display: flex;
          gap: 24px;
        }

        .accounts-main {
          flex: 1;
          min-width: 0;
        }

        /* ===== TREE VIEW ===== */
        .accounts-tree {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .group-section {
          border-bottom: 1px solid #e2e8f0;
        }

        .group-section:last-child {
          border-bottom: none;
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 20px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 4px solid transparent;
        }

        .group-header:hover {
          background: #f8fafc;
        }

        .group-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .group-icon {
          font-size: 18px;
        }

        .group-name {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .group-count {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 400;
        }

        .group-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .group-total {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
        }

        .group-toggle {
          color: #94a3b8;
          font-size: 12px;
        }

        .group-content {
          padding: 4px 0;
        }

        /* ===== ACCOUNT ITEMS ===== */
        .account-item-wrapper {
          border-bottom: 1px solid #f1f5f9;
        }

        .account-item-wrapper:last-child {
          border-bottom: none;
        }

        .account-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.15s;
          border-left: 3px solid transparent;
        }

        .account-item:hover {
          background: #f8fafc;
        }

        .account-item.selected {
          background: #f0f9ff;
          border-left-color: #2c7a8a;
        }

        .account-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .account-icon {
          color: #94a3b8;
          font-size: 14px;
          width: 20px;
          text-align: center;
        }

        .account-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .account-name {
          font-size: 14px;
          font-weight: 500;
          color: #1e293b;
        }

        .account-code {
          font-size: 12px;
          color: #94a3b8;
          font-family: 'Courier New', monospace;
          padding: 2px 8px;
          background: #f1f5f9;
          border-radius: 4px;
        }

        .account-type {
          font-size: 12px;
          color: #94a3b8;
          padding: 2px 10px;
          background: #f1f5f9;
          border-radius: 12px;
        }

        .account-item-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .account-balance {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          min-width: 100px;
          text-align: right;
        }

        .account-children {
          padding-left: 20px;
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

        /* ===== ACTION BUTTONS ===== */
        .account-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .account-item:hover .account-actions {
          opacity: 1;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;
        }

        .action-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
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

        /* ===== LIST VIEW ===== */
        .accounts-list-view {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          overflow: hidden;
        }

        .accounts-table {
          width: 100%;
          border-collapse: collapse;
        }

        .accounts-table thead {
          background: #f8fafc;
        }

        .accounts-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #e2e8f0;
        }

        .accounts-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .accounts-table tbody tr {
          cursor: pointer;
          transition: background 0.15s;
        }

        .accounts-table tbody tr:hover {
          background: #f8fafc;
        }

        .accounts-table tbody tr.selected {
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

        .balance-cell {
          font-weight: 600;
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

        /* ===== SUMMARY VIEW ===== */
        .accounts-summary-view {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          padding: 20px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .summary-card {
          border-top: 4px solid;
          padding: 20px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          transition: all 0.2s;
        }

        .summary-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .summary-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .summary-icon {
          font-size: 20px;
        }

        .summary-name {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }

        .summary-count {
          font-size: 12px;
          color: #94a3b8;
          background: #f1f5f9;
          padding: 2px 10px;
          border-radius: 12px;
        }

        .summary-amount {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }

        .summary-breakdown {
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          font-size: 13px;
        }

        .summary-item-name {
          color: #64748b;
        }

        .summary-item-amount {
          font-weight: 500;
          color: #1e293b;
        }

        /* ===== SIDEBAR ===== */
        .accounts-sidebar {
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

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sidebar-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .close-sidebar {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          padding: 0 4px;
        }

        .close-sidebar:hover {
          color: #1e293b;
        }

        .sidebar-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .detail-field {
          margin-bottom: 16px;
        }

        .detail-field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .detail-value {
          font-size: 14px;
          color: #1e293b;
          display: block;
        }

        .detail-value.balance-large {
          font-size: 24px;
          font-weight: 700;
          color: #2c7a8a;
        }

        .sidebar-actions {
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
          .accounts-sidebar {
            width: 280px;
          }
        }

        @media (max-width: 992px) {
          .accounts-content {
            flex-direction: column;
          }
          
          .accounts-sidebar {
            width: 100%;
            max-height: 400px;
            position: relative;
            top: 0;
          }
          
          .stats-bar {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .chart-of-accounts-page {
            padding: 16px;
          }
          
          .accounts-header {
            flex-direction: column;
            gap: 16px;
          }
          
          .header-right {
            width: 100%;
            flex-wrap: wrap;
          }
          
          .header-right .btn-primary,
          .header-right .btn-secondary {
            flex: 1;
            justify-content: center;
          }
          
          .accounts-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
          
          .toolbar-left {
            flex-direction: column;
            align-items: stretch;
          }
          
          .search-box {
            min-width: auto;
          }
          
          .filter-group {
            flex-wrap: wrap;
          }
          
          .filter-select {
            flex: 1;
          }
          
          .toolbar-right {
            justify-content: center;
          }
          
          .stats-bar {
            grid-template-columns: 1fr 1fr;
          }
          
          .accounts-table {
            font-size: 13px;
          }
          
          .accounts-table th,
          .accounts-table td {
            padding: 8px 10px;
          }
          
          .account-item {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .account-item-right {
            width: 100%;
            justify-content: flex-start;
            padding-left: 32px;
          }
          
          .account-actions {
            opacity: 1;
          }
          
          .summary-cards {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            margin: 16px;
            max-height: 95vh;
          }
        }

        @media (max-width: 480px) {
          .stats-bar {
            grid-template-columns: 1fr;
          }
          
          .accounts-table {
            display: block;
            overflow-x: auto;
          }
          
          .header-right .btn-primary,
          .header-right .btn-secondary {
            font-size: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="chart-of-accounts-page">
        {/* Page Header */}
        <div className="accounts-header">
          <div className="header-left">
            <h1 className="page-title">
              <FaBook className="title-icon" />
              Chart of Accounts
            </h1>
            <p className="page-subtitle">Manage your chart of accounts and ledger groups</p>
          </div>
          <div className="header-right">
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <FaPlus /> New Account
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
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-label">Total Accounts</span>
            <span className="stat-value">16</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Balance</span>
            <span className="stat-value">{formatCurrency(getTotalBalance())}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value text-green">16</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Inactive</span>
            <span className="stat-value text-red">0</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="accounts-toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search accounts by name, code, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </button>
              )}
            </div>
            <div className="filter-group">
              <select 
                className="filter-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="all">All Groups</option>
                {accountGroups.map(group => (
                  <option key={group.name} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </select>
              <button className="filter-btn">
                <FaFilter /> More Filters
              </button>
            </div>
          </div>
          <div className="toolbar-right">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'tree' ? 'active' : ''}`}
                onClick={() => setViewMode('tree')}
                title="Tree View"
              >
                <FaFolder />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaFileAlt />
              </button>
              <button 
                className={`view-btn ${viewMode === 'summary' ? 'active' : ''}`}
                onClick={() => setViewMode('summary')}
                title="Summary View"
              >
                <FaChartLine />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="accounts-content">
          <div className="accounts-main">
            {viewMode === 'tree' && renderTreeView()}
            {viewMode === 'list' && renderListView()}
            {viewMode === 'summary' && renderSummaryView()}
          </div>

          {/* Sidebar - Account Details */}
          {selectedAccount && (
            <div className="accounts-sidebar">
              <div className="sidebar-header">
                <h3>Account Details</h3>
                <button 
                  className="close-sidebar"
                  onClick={() => setSelectedAccount(null)}
                >
                  ×
                </button>
              </div>
              <div className="sidebar-content">
                <div className="detail-field">
                  <label>Account Name</label>
                  <span className="detail-value">{selectedAccount.name}</span>
                </div>
                <div className="detail-field">
                  <label>Account Code</label>
                  <span className="detail-value">{selectedAccount.code}</span>
                </div>
                <div className="detail-field">
                  <label>Group</label>
                  <span className="detail-value">{selectedAccount.group}</span>
                </div>
                <div className="detail-field">
                  <label>Type</label>
                  <span className="detail-value">{selectedAccount.type}</span>
                </div>
                <div className="detail-field">
                  <label>Balance</label>
                  <span className="detail-value balance-large">
                    {formatCurrency(selectedAccount.balance)}
                  </span>
                </div>
                <div className="detail-field">
                  <label>Opening Balance</label>
                  <span className="detail-value">{formatCurrency(selectedAccount.openingBalance)}</span>
                </div>
                <div className="detail-field">
                  <label>Current Balance</label>
                  <span className="detail-value">{formatCurrency(selectedAccount.currentBalance)}</span>
                </div>
                <div className="detail-field">
                  <label>Status</label>
                  <span className="detail-value">{getStatusBadge(selectedAccount.status)}</span>
                </div>
                <div className="detail-field">
                  <label>Created Date</label>
                  <span className="detail-value">{selectedAccount.createdAt}</span>
                </div>
                {selectedAccount.description && (
                  <div className="detail-field">
                    <label>Description</label>
                    <span className="detail-value">{selectedAccount.description}</span>
                  </div>
                )}
                <div className="sidebar-actions">
                  <button className="btn-primary full-width">
                    <FaEdit /> Edit Account
                  </button>
                  <button className="btn-secondary full-width">
                    <FaChartLine /> View Ledger
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Account Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Account</h2>
                <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Account Name *</label>
                  <input type="text" className="form-input" placeholder="Enter account name" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Code *</label>
                    <input type="text" className="form-input" placeholder="e.g., 101" />
                  </div>
                  <div className="form-group">
                    <label>Group *</label>
                    <select className="form-select">
                      <option value="">Select Group</option>
                      {accountGroups.map(group => (
                        <option key={group.name} value={group.name}>
                          {group.name}
                        </option>
                      ))}
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
                  <label>Description</label>
                  <textarea className="form-textarea" rows={3} placeholder="Enter account description" />
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
                  <FaPlus /> Create Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChartOfAccounts;