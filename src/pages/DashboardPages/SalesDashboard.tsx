// SalesDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart, FaMoneyBillWave, FaUsers, FaChartLine,
  FaFileInvoice, FaClipboardList,
  FaExclamationTriangle, FaPlus, FaPercent,
   FaTruck, FaDollarSign, FaSpinner
} from "react-icons/fa";
import "./SalesDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface SalesStats {
  totalLeads: number;
  totalQuotations: number;
  totalOrders: number;
  totalRevenue: number;
  totalDeliveryNotes: number;
  totalInvoices: number;
  openOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  draftOrders: number;
  onHoldOrders: number;
  averageOrderValue: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  quotationsByStatus: Record<string, number>;
}

interface RecentActivity {
  id: number;
  type: string;
  name: string;
  customer: string;
  amount: number;
  status: string;
  date: string;
}

// ─── API Response Types ────────────────────────────────────────────────

interface ApiLead {
  id: number;
  lead_name: string;
  company_name: string;
  email_id: string | null;
  mobile_no: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  lead_owner: string;
}

interface ApiLeadResponse {
  success: number;
  data: {
    records: ApiLead[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiQuotation {
  id: number;
  name: string;
  customer_name: string;
  party_name: string;
  transaction_date: string;
  valid_till: string;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  status: string;
  currency: string;
  title: string;
  creation: string;
  items: Array<{
    id: number;
    qty: number;
    uom: string;
    rate: number;
    amount: number;
    item_code: string;
    item_name: string;
  }>;
}

interface ApiQuotationResponse {
  success: number;
  data: {
    records: ApiQuotation[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiSalesOrder {
  id: number;
  customer_name: string;
  customer_id: number;
  status: string;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  transaction_date: string;
  creation: string;
  total_qty: number;
  sales_items: Array<{
    id: number;
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
}

interface ApiSalesOrderResponse {
  success: number;
  data: {
    records: ApiSalesOrder[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiDeliveryNote {
  id: number;
  naming_series: string;
  customer_name: string;
  customer_id: number;
  posting_date: string;
  status: string;
  grand_total: number;
  creation: string;
  items: Array<{
    id: number;
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
}

interface ApiDeliveryNoteResponse {
  success: number;
  data: {
    records: ApiDeliveryNote[];
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiSalesInvoice {
  id: number;
  customer_name: string;
  customer: string;
  posting_date: string;
  due_date: string;
  status: string;
  total: number;
  net_total: number;
  grand_total: number;
  rounded_total: number;
  outstanding_amount: number;
  paid_amount: number;
  creation: string;
  items: Array<{
    item_id: number;
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
}

interface ApiSalesInvoiceResponse {
  success: number;
  data: {
    records: ApiSalesInvoice[];
    total: number;
    page: number;
    limit: number;
  };
}

// ─── Helper functions ──────────────────────────────────────────────────

function getLeadsData(response: ApiLeadResponse): ApiLead[] {
  return response.data?.records || [];
}

function getQuotationsData(response: ApiQuotationResponse): ApiQuotation[] {
  return response.data?.records || [];
}

function getSalesOrdersData(response: ApiSalesOrderResponse): ApiSalesOrder[] {
  return response.data?.records || [];
}

function getDeliveryNotesData(response: ApiDeliveryNoteResponse): ApiDeliveryNote[] {
  return response.data?.records || [];
}

function getSalesInvoicesData(response: ApiSalesInvoiceResponse): ApiSalesInvoice[] {
  return response.data?.records || [];
}

// ─── Component ──────────────────────────────────────────────────────────

export default function SalesDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SalesStats>({
    totalLeads: 0,
    totalQuotations: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalDeliveryNotes: 0,
    totalInvoices: 0,
    openOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    draftOrders: 0,
    onHoldOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    leadsByStatus: {},
    quotationsByStatus: {}
  });
  const [, setRecentActivities] = useState<RecentActivity[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    setError(null);
    try {
      // ─── Fetch all data in parallel ───
      const [
        leadsRes,
        quotationsRes,
        ordersRes,
        deliveryNotesRes,
        invoicesRes
      ] = await Promise.all([
        api.get<ApiLeadResponse>('/lead'),
        api.get<ApiQuotationResponse>('/quotation?page=1&limit=100'),
        api.get<ApiSalesOrderResponse>('/sales-order'),
        api.get<ApiDeliveryNoteResponse>('/delivery-note?&limit=1000'),
        api.get<ApiSalesInvoiceResponse>('/sales-invoice?page=1&limit=1000')
      ]);

      const leads = getLeadsData(leadsRes.data);
      const quotations = getQuotationsData(quotationsRes.data);
      const orders = getSalesOrdersData(ordersRes.data);
      const deliveryNotes = getDeliveryNotesData(deliveryNotesRes.data);
      const invoices = getSalesInvoicesData(invoicesRes.data);

      // ─── Process Leads ──────────────────────────────────────
      const leadsByStatus: Record<string, number> = {};
      leads.forEach(lead => {
        const status = lead.status || 'Unknown';
        leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
      });

      // ─── Process Quotations ─────────────────────────────────
      const quotationsByStatus: Record<string, number> = {};
      quotations.forEach(quotation => {
        const status = quotation.status || 'Unknown';
        quotationsByStatus[status] = (quotationsByStatus[status] || 0) + 1;
      });

      // ─── Process Sales Orders ──────────────────────────────
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + (o.grand_total || 0), 0);
      const openOrders = orders.filter(o => o.status === 'Submitted' || o.status === 'On Hold').length;
      const completedOrders = orders.filter(o => o.status === 'Completed').length;
      const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;
      const draftOrders = orders.filter(o => o.status === 'Draft').length;
      const onHoldOrders = orders.filter(o => o.status === 'On Hold').length;

      // ─── Process Invoices ────────────────────────────────────
      const totalInvoices = invoices.length;

      // ─── Set Stats ────────────────────────────────────────────
      setStats({
        totalLeads: leads.length,
        totalQuotations: quotations.length,
        totalOrders,
        totalRevenue: totalRevenue,
        totalDeliveryNotes: deliveryNotes.length,
        totalInvoices,
        openOrders,
        completedOrders,
        cancelledOrders,
        draftOrders,
        onHoldOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        conversionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0,
        leadsByStatus,
        quotationsByStatus
      });

      // ─── Build Recent Activities ─────────────────────────────
      const recent: RecentActivity[] = [];

      // Add recent leads
      leads.slice(0, 2).forEach(lead => {
        recent.push({
          id: lead.id,
          type: 'Lead',
          name: lead.lead_name,
          customer: lead.company_name || '',
          amount: 0,
          status: lead.status || 'New',
          date: new Date().toISOString()
        });
      });

      // Add recent quotations
      quotations.slice(0, 2).forEach(quotation => {
        recent.push({
          id: quotation.id,
          type: 'Quotation',
          name: quotation.name || `QTN-${quotation.id}`,
          customer: quotation.customer_name,
          amount: quotation.grand_total || 0,
          status: quotation.status || 'Draft',
          date: quotation.creation || quotation.transaction_date
        });
      });

      // Add recent orders
      const sortedOrders = [...orders].sort((a, b) => 
        new Date(b.creation || b.transaction_date).getTime() - new Date(a.creation || a.transaction_date).getTime()
      );
      sortedOrders.slice(0, 3).forEach(order => {
        recent.push({
          id: order.id,
          type: 'Sales Order',
          name: `SO-${order.id}`,
          customer: order.customer_name,
          amount: order.grand_total || 0,
          status: order.status || 'Draft',
          date: order.creation || order.transaction_date
        });
      });

      // Sort by date and limit to 5
      const sortedRecent = recent.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentActivities(sortedRecent.slice(0, 5));

      // ─── Top Customers ──────────────────────────────────────
      const customerMap: Record<string, { name: string; orders: number; total: number }> = {};
      orders.forEach(order => {
        const name = order.customer_name || 'Unknown';
        if (!customerMap[name]) {
          customerMap[name] = { name, orders: 0, total: 0 };
        }
        customerMap[name].orders += 1;
        customerMap[name].total += order.grand_total || 0;
      });
      const sortedCustomers = Object.values(customerMap)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setTopCustomers(sortedCustomers);

    } catch (err: any) {
      console.error("Error fetching sales data:", err);
      setError(err.response?.data?.message || err.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    if (path) {
      navigate(path);
    }
  };



  const statCards = [
    {
      id: "leads",
      title: "Total Leads",
      value: stats.totalLeads,
      icon: <FaUsers />,
      color: "primary",
      trend: "opportunities",
      path: "/lead"
    },
    {
      id: "quotations",
      title: "Quotations",
      value: stats.totalQuotations,
      icon: <FaFileInvoice />,
      color: "info",
      trend: "proposals",
      path: "/quotation"
    },
    {
      id: "orders",
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <FaShoppingCart />,
      color: "primary",
      trend: "sales",
      path: "/sales-order"
    },
    {
      id: "revenue",
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "total sales",
      path: ""
    },
    {
      id: "delivery-notes",
      title: "Delivery Notes",
      value: stats.totalDeliveryNotes,
      icon: <FaTruck />,
      color: "warning",
      trend: "shipments",
      path: "/delivery-challan"
    },
    {
      id: "invoices",
      title: "Invoices",
      value: stats.totalInvoices,
      icon: <FaClipboardList />,
      color: "info",
      trend: "billing",
      path: "/sales-bill"
    },
    {
      id: "avg-order",
      title: "Avg Order Value",
      value: `₹${Math.round(stats.averageOrderValue).toLocaleString()}`,
      icon: <FaDollarSign />,
      color: "primary",
      trend: "per order",
      path: ""
    },
    {
      id: "conversion",
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: <FaChartLine />,
      color: "success",
      trend: "success rate",
      path: ""
    }
  ];

  const quickActions = [
    { id: "new-lead", label: "New Lead", icon: <FaUsers />, path: "/leads/new" },
    { id: "new-quotation", label: "New Quotation", icon: <FaFileInvoice />, path: "/quotation/new" },
    { id: "new-order", label: "New Sales Order", icon: <FaShoppingCart />, path: "/sales-order/new" },
    { id: "new-invoice", label: "New Invoice", icon: <FaClipboardList />, path: "/sales-bill" },
    { id: "new-delivery", label: "New Delivery Note", icon: <FaTruck />, path: "/delivery-challan" },
  ];

  if (loading) {
    return (
      <div className={`dashboard sales-dashboard ${theme}`}>
        <div className="dashboard-header">
          <h1>📊 Sales Dashboard</h1>
          <p className="header-subtitle">Loading sales data...</p>
        </div>
        <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <FaSpinner className="spinner" style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }} />
          <p style={{ marginLeft: '16px' }}>Loading sales data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`dashboard sales-dashboard ${theme}`}>
        <div className="dashboard-header">
          <h1>📊 Sales Dashboard</h1>
          <p className="header-subtitle">Error loading data</p>
        </div>
        <div className="error-container" style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          <FaExclamationTriangle size={48} style={{ marginBottom: '16px' }} />
          <p>{error}</p>
          <button 
            onClick={fetchSalesData}
            style={{ 
              marginTop: '16px', 
              padding: '8px 24px', 
              cursor: 'pointer',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard sales-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📊 Sales Dashboard</h1>
          <p className="header-subtitle">Real-time sales performance and insights</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/sales-order/new")}>
            <FaPlus /> New Sales Order
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/quotation/new")}>
            <FaFileInvoice /> New Quotation
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div 
            key={stat.id} 
            className={`stat-card stat-${stat.color} ${!stat.path ? 'stat-disabled' : ''}`}
            onClick={() => stat.path && handleNavigate(stat.path)}
            style={{ cursor: stat.path ? 'pointer' : 'default' }}
          >
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

     


       

        {/* Top Customers */}
        <div className="card top-customers">
          <div className="card-header">
            <h3>Top Customers</h3>
            <span className="badge">Revenue</span>
          </div>
          <div className="customer-list">
            {topCustomers.length === 0 ? (
              <div className="customer-item">No customers found</div>
            ) : (
              topCustomers.map((customer, index) => (
                <div key={index} className="customer-item">
                  <div className="customer-rank">#{index + 1}</div>
                  <div className="customer-info">
                    <div className="customer-name">{customer.name}</div>
                    <div className="customer-orders">{customer.orders} orders</div>
                  </div>
                  <div className="customer-revenue">₹{customer.total.toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales Metrics */}
        <div className="card sales-metrics">
          <div className="card-header">
            <h3>Sales Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaShoppingCart /></div>
              <div className="metric-info">
                <span className="metric-label">Total Orders</span>
                <span className="metric-value">{stats.totalOrders}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaMoneyBillWave /></div>
              <div className="metric-info">
                <span className="metric-label">Total Revenue</span>
                <span className="metric-value">₹{stats.totalRevenue.toLocaleString()}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaPercent /></div>
              <div className="metric-info">
                <span className="metric-label">Conversion</span>
                <span className="metric-value">{stats.conversionRate}%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaTruck /></div>
              <div className="metric-info">
                <span className="metric-label">Delivery Notes</span>
                <span className="metric-value">{stats.totalDeliveryNotes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        .stat-disabled {
          opacity: 0.6;
          cursor: default !important;
        }
        .stat-disabled:hover {
          transform: none !important;
          box-shadow: none !important;
        }
        .status-dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .status-lead { background-color: #94a3b8; }
        .status-contacted { background-color: #3b82f6; }
        .status-qualified { background-color: #8b5cf6; }
        .status-draft { background-color: #94a3b8; }
        .status-submitted { background-color: #3b82f6; }
        .status-accepted { background-color: #10b981; }
        .status-sent { background-color: #f59e0b; }
        .status-onhold { background-color: #f59e0b; }
        .status-completed { background-color: #22c55e; }
        .status-cancelled { background-color: #ef4444; }
        .status-rejected { background-color: #ef4444; }
        .status-default { background-color: #94a3b8; }
        .status-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .status-subsection h4 {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-item {
          display: flex;
          align-items: center;
          padding: 6px 0;
          font-size: 14px;
        }
        .status-label {
          flex: 1;
        }
        .status-count {
          font-weight: 600;
          margin-left: auto;
        }
        .lead-quotation-status .status-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          .lead-quotation-status .status-section {
            grid-template-columns: 1fr;
          }
        }
        .activity-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #94a3b8;
          margin-top: 2px;
        }
        .activity-amount {
          font-weight: 600;
          color: #1e293b;
        }
        .customer-rank {
          font-weight: 700;
          color: #94a3b8;
          font-size: 14px;
          min-width: 30px;
        }
        .customer-orders {
          font-size: 12px;
          color: #94a3b8;
        }
        .customer-revenue {
          font-weight: 600;
          color: #1e293b;
          margin-left: auto;
        }
        .customer-item {
          display: flex;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          cursor: pointer;
          transition: background 0.2s;
        }
        .customer-item:last-child {
          border-bottom: none;
        }
        .customer-item:hover {
          background: #f8fafc;
        }
        .customer-info {
          flex: 1;
          margin: 0 12px;
        }
        .customer-name {
          font-weight: 500;
          font-size: 14px;
        }
        .type-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          background: #e2e8f0;
          color: #475569;
        }
        .badge {
          background: #e2e8f0;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }
      `}</style>
    </div>
  );
}