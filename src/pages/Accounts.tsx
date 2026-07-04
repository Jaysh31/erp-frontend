
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
  FaCog,
  FaChartPie,
  FaBalanceScale,
  FaBook,
  FaUsers,
  FaBuilding,
  FaWallet,
  FaShoppingCart,
  FaDollarSign,
  FaCreditCard,
  FaMoneyBillWave,
  FaChartLine,
  FaCalendarAlt
} from 'react-icons/fa';
import './Accounts.css';

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

const Accounts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Assets', 'Liabilities', 'Equity']));
  const [viewMode, setViewMode] = useState<'list' | 'tree' | 'summary'>('tree');
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
          description: 'Physical cash available'
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
        }
      ]
    },
    {
      name: 'Liabilities',
      icon: <FaCreditCard />,
      color: '#ef4444',
      accounts: [
        { 
          id: '5', 
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
          id: '6', 
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
          id: '7', 
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
          id: '8', 
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
          id: '9', 
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
          id: '10', 
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
          id: '11', 
          name: 'Service Revenue', 
          code: '402', 
          group: 'Income',
          type: 'Income',
          balance: 400000,
          openingBalance: 350000,
          currentBalance: 400000,
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
          id: '12', 
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
          id: '13', 
          name: 'Salary Expense', 
          code: '502', 
          group: 'Expenses',
          type: 'Expense',
          balance: 600000,
          openingBalance: 550000,
          currentBalance: 600000,
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
    <div className="accounts-page">
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
          <span className="stat-value">13</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Balance</span>
          <span className="stat-value">{formatCurrency(getTotalBalance())}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active</span>
          <span className="stat-value text-green">13</span>
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
              <FaChartPie />
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
                  <FaChartPie /> View Ledger
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
  );
};

export default Accounts;