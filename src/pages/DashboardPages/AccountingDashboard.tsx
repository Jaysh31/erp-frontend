// AccountingDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaMoneyBillWave, FaChartPie, FaWallet, FaBuilding,
  FaPlus, FaArrowRight, FaChartLine,
  FaFileInvoice, FaCreditCard, 
  FaCalculator, FaBalanceScale, 
  FaPercent, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaDownload} from "react-icons/fa";
import "./AccountingDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface AccountingStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  accountsReceivable: number;
  accountsPayable: number;
  pendingInvoices: number;
  overdueInvoices: number;
  bankBalance: number;
}

interface RecentTransaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
  status: string;
}

export default function AccountingDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccountingStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    accountsReceivable: 0,
    accountsPayable: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    bankBalance: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      // Fetch accounting data from API
      // This is a placeholder - replace with actual API calls
      
      // Sample data for demonstration
      setStats({
        totalRevenue: 245680,
        totalExpenses: 89430,
        netProfit: 156250,
        accountsReceivable: 45230,
        accountsPayable: 32150,
        pendingInvoices: 18,
        overdueInvoices: 5,
        bankBalance: 234567
      });

      setRecentTransactions([
        {
          id: 1,
          description: "Sales Invoice #INV-2024-001",
          amount: 12500,
          type: 'income',
          date: "2024-01-15",
          category: "Sales",
          status: "Completed"
        },
        {
          id: 2,
          description: "Supplier Payment - ABC Corp",
          amount: 8700,
          type: 'expense',
          date: "2024-01-14",
          category: "Purchasing",
          status: "Completed"
        },
        {
          id: 3,
          description: "Salary Payment - January",
          amount: 15000,
          type: 'expense',
          date: "2024-01-14",
          category: "Payroll",
          status: "Completed"
        },
        {
          id: 4,
          description: "Customer Payment - XYZ Ltd",
          amount: 23000,
          type: 'income',
          date: "2024-01-13",
          category: "Sales",
          status: "Completed"
        },
        {
          id: 5,
          description: "Invoice #INV-2024-002",
          amount: 8900,
          type: 'income',
          date: "2024-01-12",
          category: "Sales",
          status: "Pending"
        }
      ]);
    } catch (error) {
      console.error("Error fetching accounting data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "revenue",
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "this year"
    },
    {
      id: "expenses",
      title: "Total Expenses",
      value: `₹${stats.totalExpenses.toLocaleString()}`,
      icon: <FaChartPie />,
      color: "danger",
      trend: "this year"
    },
    {
      id: "net-profit",
      title: "Net Profit",
      value: `₹${stats.netProfit.toLocaleString()}`,
      icon: <FaChartLine />,
      color: "primary",
      trend: "profit margin"
    },
    {
      id: "receivable",
      title: "Accounts Receivable",
      value: `₹${stats.accountsReceivable.toLocaleString()}`,
      icon: <FaWallet />,
      color: "warning",
      trend: "outstanding"
    },
    {
      id: "payable",
      title: "Accounts Payable",
      value: `₹${stats.accountsPayable.toLocaleString()}`,
      icon: <FaBuilding />,
      color: "info",
      trend: "pending payments"
    },
    {
      id: "pending-invoices",
      title: "Pending Invoices",
      value: stats.pendingInvoices,
      icon: <FaFileInvoice />,
      color: "warning",
      trend: "to process"
    },
    {
      id: "overdue",
      title: "Overdue Invoices",
      value: stats.overdueInvoices,
      icon: <FaExclamationTriangle />,
      color: "danger",
      trend: "overdue"
    },
    {
      id: "bank-balance",
      title: "Bank Balance",
      value: `₹${stats.bankBalance.toLocaleString()}`,
      icon: <FaWallet />,
      color: "primary",
      trend: "available"
    }
  ];

  const quickActions = [
    { id: "new-invoice", label: "New Invoice", icon: <FaFileInvoice />, path: "/accounting/invoice/new" },
    { id: "new-payment", label: "New Payment", icon: <FaCreditCard />, path: "/accounting/payment/new" },
    { id: "new-expense", label: "Add Expense", icon: <FaMoneyBillWave />, path: "/accounting/expense/new" },
    { id: "chart-of-accounts", label: "Chart of Accounts", icon: <FaBalanceScale />, path: "/chart-of-accounts" },
    { id: "ledger", label: "Ledger", icon: <FaCalculator />, path: "/ledger-accounts" },
    { id: "reports", label: "Financial Reports", icon: <FaChartLine />, path: "/accounting/reports" }
  ];

  const categoryColors: Record<string, string> = {
    'Sales': '#3b82f6',
    'Purchasing': '#f59e0b',
    'Payroll': '#8b5cf6',
    'Operations': '#06b6d4',
    'Maintenance': '#ef4444'
  };

  return (
    <div className={`dashboard accounting-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>💰 Accounting Dashboard</h1>
          <p className="header-subtitle">Real-time financial overview and insights</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/accounting/invoice/new")}>
            <FaPlus /> New Invoice
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/accounting/reports")}>
            <FaDownload /> Reports
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.id} className={`stat-card stat-${stat.color}`}>
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-trend">{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Quick Actions */}
        <div className="card quick-actions">
          <div className="card-header">
            <h3>Quick Actions</h3>
            <span className="badge">Favorites</span>
          </div>
          <div className="actions-grid">
            {quickActions.map((action) => (
              <button 
                key={action.id}
                className="action-btn"
                onClick={() => handleNavigate(action.path)}
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card recent-transactions">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <button className="view-all" onClick={() => handleNavigate("/accounting/ledger")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="transaction-list">
            {loading ? (
              <div className="transaction-item">Loading...</div>
            ) : recentTransactions.length === 0 ? (
              <div className="transaction-item">No recent transactions</div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className="transaction-description">{transaction.description}</div>
                    <div className="transaction-meta">
                      <span className="transaction-category" style={{ 
                        backgroundColor: categoryColors[transaction.category] || '#94a3b8' 
                      }}>
                        {transaction.category}
                      </span>
                      <span className="transaction-date">{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="transaction-amount">
                    <span className={`amount ${transaction.type === 'income' ? 'income' : 'expense'}`}>
                      {transaction.type === 'income' ? '+' : '-'} ₹{transaction.amount.toLocaleString()}
                    </span>
                    <span className={`transaction-status status-${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="card financial-metrics">
          <div className="card-header">
            <h3>Financial Health</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaBalanceScale /></div>
              <div className="metric-info">
                <span className="metric-label">Profit Margin</span>
                <span className="metric-value">64%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaPercent /></div>
              <div className="metric-info">
                <span className="metric-label">Expense Ratio</span>
                <span className="metric-value">36%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaClock /></div>
              <div className="metric-info">
                <span className="metric-label">Avg. Collection Days</span>
                <span className="metric-value">32 days</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Payment Success Rate</span>
                <span className="metric-value">95%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="card financial-overview">
          <div className="card-header">
            <h3>Financial Overview</h3>
            <span className="badge">This Month</span>
          </div>
          <div className="overview-grid">
            <div className="overview-item">
              <div className="overview-label">Revenue</div>
              <div className="overview-value positive">₹{stats.totalRevenue.toLocaleString()}</div>
              <div className="overview-change positive">↑ 12.5%</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">Expenses</div>
              <div className="overview-value negative">₹{stats.totalExpenses.toLocaleString()}</div>
              <div className="overview-change negative">↑ 8.3%</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">Net Profit</div>
              <div className="overview-value positive">₹{stats.netProfit.toLocaleString()}</div>
              <div className="overview-change positive">↑ 15.7%</div>
            </div>
            <div className="overview-item">
              <div className="overview-label">Cash Flow</div>
              <div className="overview-value positive">₹{stats.bankBalance.toLocaleString()}</div>
              <div className="overview-change positive">↑ 5.2%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}