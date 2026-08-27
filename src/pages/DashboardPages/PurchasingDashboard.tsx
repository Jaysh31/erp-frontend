// PurchasingDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart, FaMoneyBillWave, FaUsers, 
  FaFileInvoice, FaCheckCircle, FaClock, 
  FaPlus, FaArrowRight, FaPercent, FaTruck, FaBoxes,
  FaDollarSign, FaBuilding
} from "react-icons/fa";
import "./PurchasingDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

// Define types
interface PurchaseInvoice {
  id: number;
  name: string;
  supplier_name: string;
  supplier: string;
  status: string;
  grand_total: number;
  total: number;
  net_total: number;
  total_qty: number;
  posting_date: string;
  creation: string;
  items: any[];
  [key: string]: any;
}

interface GRN {
  id: number;
  grn_number: string;
  grn_date: string;
  supplier_name: string;
  supplier_id: number;
  status: string;
  total_received_qty: number;
  total_accepted_qty: number;
  total_rejected_qty: number;
  [key: string]: any;
}

interface PurchaseOrder {
  id: number;
  name: string;
  title: string;
  supplier_name: string;
  supplier: string;
  status: string;
  grand_total: number;
  total: number;
  net_total: number;
  total_qty: number;
  transaction_date: string;
  [key: string]: any;
}

interface DashboardStats {
  totalInvoices: number;
  totalSpend: number;
  openInvoices: number;
  completedInvoices: number;
  cancelledInvoices: number;
  draftInvoices: number;
  submittedInvoices: number;
  overdueInvoices: number;
  averageOrderValue: number;
  supplierCount: number;
  totalGRNs: number;
  totalPOs: number;
  totalReceivedQty: number;
  totalRejectedQty: number;
}

export default function PurchasingDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalSpend: 0,
    openInvoices: 0,
    completedInvoices: 0,
    cancelledInvoices: 0,
    draftInvoices: 0,
    submittedInvoices: 0,
    overdueInvoices: 0,
    averageOrderValue: 0,
    supplierCount: 0,
    totalGRNs: 0,
    totalPOs: 0,
    totalReceivedQty: 0,
    totalRejectedQty: 0
  });
  const [recentOrders, setRecentOrders] = useState<PurchaseInvoice[]>([]);
  const [, setRecentGRNs] = useState<GRN[]>([]);
  const [, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all three APIs in parallel
      const [invoicesRes, grnsRes, posRes] = await Promise.all([
        api.get("/purchase-invoice?limit=1000"),
        api.get("/grn?limit=10000"),
        api.get("/purchase-order?limit=1000")
      ]);

      // Process Purchase Invoices
      const invoices = invoicesRes.data?.data?.records || invoicesRes.data?.data || [];
      const invoicesArray = Array.isArray(invoices) ? invoices : [];
      
      // Process GRNs
      const grns = grnsRes.data?.data?.data || grnsRes.data?.data || [];
      const grnsArray = Array.isArray(grns) ? grns : [];
      
      // Process Purchase Orders
      const pos = posRes.data?.data?.records || posRes.data?.data || [];
      const posArray = Array.isArray(pos) ? pos : [];

      // Calculate invoice stats
      const totalInvoices = invoicesArray.length;
      const totalSpend = invoicesArray.reduce((sum: number, o: PurchaseInvoice) => sum + (o.grand_total || o.total || 0), 0);
      const draftInvoices = invoicesArray.filter((o: PurchaseInvoice) => o.status === "Draft").length;
      const submittedInvoices = invoicesArray.filter((o: PurchaseInvoice) => o.status === "Submitted").length;
      const completedInvoices = invoicesArray.filter((o: PurchaseInvoice) => o.status === "Completed" || o.status === "Paid").length;
      const cancelledInvoices = invoicesArray.filter((o: PurchaseInvoice) => o.status === "Cancelled").length;
      const openInvoices = draftInvoices + submittedInvoices;

      // Get unique suppliers from invoices
      const uniqueSuppliers = new Set(invoicesArray.map((o: PurchaseInvoice) => o.supplier_name || o.supplier));
      const supplierCount = uniqueSuppliers.size;

      // Calculate GRN stats
      const totalGRNs = grnsArray.length;
      const totalReceivedQty = grnsArray.reduce((sum: number, g: GRN) => sum + (g.total_received_qty || 0), 0);
      const totalRejectedQty = grnsArray.reduce((sum: number, g: GRN) => sum + (g.total_rejected_qty || 0), 0);

      setStats({
        totalInvoices,
        totalSpend,
        openInvoices,
        completedInvoices,
        cancelledInvoices,
        draftInvoices,
        submittedInvoices,
        overdueInvoices: 0, // You can calculate based on due dates if available
        averageOrderValue: totalInvoices > 0 ? totalSpend / totalInvoices : 0,
        supplierCount,
        totalGRNs,
        totalPOs: posArray.length,
        totalReceivedQty,
        totalRejectedQty
      });

      // Set recent orders (invoices)
      setRecentOrders(invoicesArray.slice(0, 5));
      
      // Set recent GRNs
      setRecentGRNs(grnsArray.slice(0, 5));
      
      // Set purchase orders
      setPurchaseOrders(posArray);

    } catch (error) {
      console.error("Error fetching purchasing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Status color mapping
  const statusColors: Record<string, string> = {
    'Draft': '#94a3b8',
    'Submitted': '#3b82f6',
    'Approved': '#f59e0b',
    'Completed': '#22c55e',
    'Paid': '#22c55e',
    'Cancelled': '#ef4444'
  };

  // Stat cards configuration with real data
  const statCards = [
    {
      id: "total-invoices",
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: <FaFileInvoice />,
      color: "primary",
      trend: "all invoices"
    },
    {
      id: "total-spend",
      title: "Total Spend",
      value: `₹${stats.totalSpend.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "total value"
    },
    {
      id: "open-invoices",
      title: "Open Invoices",
      value: stats.openInvoices,
      icon: <FaClock />,
      color: "warning",
      trend: `(${stats.draftInvoices} Draft, ${stats.submittedInvoices} Submitted)`
    },
    {
      id: "completed",
      title: "Completed",
      value: stats.completedInvoices,
      icon: <FaCheckCircle />,
      color: "info",
      trend: "paid & completed"
    },
    {
      id: "avg-order",
      title: "Avg Order Value",
      value: `₹${Math.round(stats.averageOrderValue).toLocaleString()}`,
      icon: <FaDollarSign />,
      color: "primary",
      trend: "per invoice"
    },
    {
      id: "suppliers",
      title: "Suppliers",
      value: stats.supplierCount,
      icon: <FaUsers />,
      color: "info",
      trend: "active suppliers"
    },
    {
      id: "grn-total",
      title: "Total GRNs",
      value: stats.totalGRNs,
      icon: <FaBoxes />,
      color: "primary",
      trend: `Received: ${stats.totalReceivedQty} units`
    },
    {
      id: "po-total",
      title: "Purchase Orders",
      value: stats.totalPOs,
      icon: <FaShoppingCart />,
      color: "success",
      trend: "active POs"
    }
  ];

  const quickActions = [
    { id: "new-invoice", label: "Purchase Invoice", icon: <FaFileInvoice />, path: "/purchase-invoice/new" },
    { id: "new-order", label: "Purchase Order", icon: <FaShoppingCart />, path: "/purchase-order/new" },
    { id: "new-grn", label: "New GRN", icon: <FaTruck />, path: "/grn/new" },
    { id: "supplier-list", label: "Suppliers", icon: <FaUsers />, path: "/supplier" },
  ];

  return (
    <div className={`dashboard purchasing-dashboard ${theme}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🛒 Purchasing Dashboard</h1>
          <p className="header-subtitle">Real-time procurement overview and insights</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/purchase-invoice/new")}>
            <FaPlus /> New Purchase Invoice
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/purchase-order/new")}>
            <FaShoppingCart /> New Purchase Order
          </button>
        </div>
      </div>

      {/* Stats Grid */}
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

        {/* Recent Purchase Invoices */}
        <div className="card recent-purchase-orders">
          <div className="card-header">
            <h3>Recent Purchase Bill</h3>
            <button className="view-all" onClick={() => handleNavigate("/purchase-invoice")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="order-list">
            {loading ? (
              <div className="order-item">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="order-item">No recent invoices</div>
            ) : (
              recentOrders.map((order: PurchaseInvoice) => (
                <div key={order.id} className="order-item" onClick={() => handleNavigate(`/purchase-invoice/edit/${order.id}`)}>
                  <div className="order-info">
                    <div className="order-supplier">{order.supplier_name || 'Unknown Supplier'}</div>
                    <div className="order-meta">
                      <span className="order-status" style={{ backgroundColor: statusColors[order.status] || '#94a3b8' }}>
                        {order.status}
                      </span>
                      <span className="order-date">
                        {new Date(order.posting_date || order.creation || order.modified).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="order-amount">
                    <span className="amount-value">₹{(order.grand_total || order.total || 0).toLocaleString()}</span>
                    <span className="order-items">{order.items?.length || 0} items</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Procurement Metrics */}
        <div className="card procurement-metrics">
          <div className="card-header">
            <h3>Procurement Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaBuilding /></div>
              <div className="metric-info">
                <span className="metric-label">Active Suppliers</span>
                <span className="metric-value">{stats.supplierCount}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaPercent /></div>
              <div className="metric-info">
                <span className="metric-label">Invoice Completion</span>
                <span className="metric-value">
                  {stats.totalInvoices > 0 
                    ? Math.round((stats.completedInvoices / stats.totalInvoices) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaTruck /></div>
              <div className="metric-info">
                <span className="metric-label">Total GRNs</span>
                <span className="metric-value">{stats.totalGRNs}</span>
              </div>
            </div>
           
          </div>
        </div>
      </div>
    </div>
  );
}