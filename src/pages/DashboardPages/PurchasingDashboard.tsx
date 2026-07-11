// PurchasingDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart, FaMoneyBillWave, FaUsers, FaClipboardList,
  FaFileInvoice, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaPlus, FaArrowRight, FaPercent, FaTruck, FaBoxes,
  FaDollarSign, FaBuilding, FaChartLine
} from "react-icons/fa";
import "./PurchasingDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

export default function PurchasingDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpend: 0,
    openOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    overdueOrders: 0,
    averageOrderValue: 0,
    supplierCount: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchPurchasingData();
  }, []);

  const fetchPurchasingData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/purchase-order");
      if (response.data.success === 1) {
        const orders = response.data.data.records || response.data.data || [];
        const totalOrders = orders.length;
        const totalSpend = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const openOrders = orders.filter((o: any) => o.status === "Draft" || o.status === "Submitted").length;
        const completedOrders = orders.filter((o: any) => o.status === "Completed").length;
        const cancelledOrders = orders.filter((o: any) => o.status === "Cancelled").length;

        setStats({
          totalOrders,
          totalSpend,
          openOrders,
          completedOrders,
          cancelledOrders,
          overdueOrders: 0,
          averageOrderValue: totalOrders > 0 ? totalSpend / totalOrders : 0,
          supplierCount: 45
        });

        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching purchasing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total-orders",
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <FaClipboardList />,
      color: "primary",
      trend: "all orders"
    },
    {
      id: "total-spend",
      title: "Total Spend",
      value: `₹${stats.totalSpend.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "this year"
    },
    {
      id: "open-orders",
      title: "Open Orders",
      value: stats.openOrders,
      icon: <FaClock />,
      color: "warning",
      trend: "pending"
    },
    {
      id: "completed",
      title: "Completed",
      value: stats.completedOrders,
      icon: <FaCheckCircle />,
      color: "info",
      trend: "delivered"
    },
    {
      id: "avg-order",
      title: "Avg Order Value",
      value: `₹${Math.round(stats.averageOrderValue).toLocaleString()}`,
      icon: <FaDollarSign />,
      color: "primary",
      trend: "per order"
    },
    {
      id: "suppliers",
      title: "Suppliers",
      value: stats.supplierCount,
      icon: <FaUsers />,
      color: "info",
      trend: "active"
    },
    {
      id: "overdue",
      title: "Overdue",
      value: stats.overdueOrders,
      icon: <FaExclamationTriangle />,
      color: "danger",
      trend: "delayed"
    },
    {
      id: "cancelled",
      title: "Cancelled",
      value: stats.cancelledOrders,
      icon: <FaExclamationTriangle />,
      color: "danger",
      trend: "cancelled"
    }
  ];

  const quickActions = [
    { id: "new-request", label: "Material Request", icon: <FaClipboardList />, path: "/material-request/new" },
    { id: "new-rfq", label: "New RFQ", icon: <FaFileInvoice />, path: "/request-for-quotation/new" },
    { id: "new-order", label: "Purchase Order", icon: <FaShoppingCart />, path: "/purchase-order/new" },
    { id: "supplier-list", label: "Suppliers", icon: <FaUsers />, path: "/supplier" },
    { id: "price-list", label: "Price List", icon: <FaDollarSign />, path: "/price-list" },
    { id: "purchase-report", label: "Purchase Report", icon: <FaChartLine />, path: "/purchase-report" }
  ];

  const statusColors: Record<string, string> = {
    'Draft': '#94a3b8',
    'Submitted': '#3b82f6',
    'Approved': '#f59e0b',
    'Completed': '#22c55e',
    'Cancelled': '#ef4444'
  };

  return (
    <div className={`dashboard purchasing-dashboard ${theme}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🛒 Purchasing Dashboard</h1>
          <p className="header-subtitle">Real-time procurement overview and insights</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/purchase-order/new")}>
            <FaPlus /> New Purchase Order
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/request-for-quotation/new")}>
            <FaFileInvoice /> New RFQ
          </button>
        </div>
      </div>

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
        {/* Status Distribution */}
        <div className="card status-distribution">
          <div className="card-header">
            <h3>Order Status Distribution</h3>
            <span className="badge">Today</span>
          </div>
          <div className="status-bars">
            {Object.entries({
              'Draft': stats.totalOrders - stats.completedOrders - stats.cancelledOrders - stats.openOrders,
              'Open': stats.openOrders,
              'Completed': stats.completedOrders,
              'Cancelled': stats.cancelledOrders
            }).filter(([_, value]) => value > 0).map(([key, value]) => {
              const percentage = stats.totalOrders > 0 ? Math.round((value / stats.totalOrders) * 100) : 0;
              return (
                <div key={key} className="status-item">
                  <div className="status-label">
                    <span className={`status-dot status-${key.toLowerCase()}`}></span>
                    <span>{key}</span>
                    <span className="status-count">{value}</span>
                  </div>
                  <div className="status-bar-track">
                    <div 
                      className="status-bar-fill" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: statusColors[key] || '#3b82f6' 
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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

        {/* Recent Orders */}
        <div className="card recent-purchase-orders">
          <div className="card-header">
            <h3>Recent Purchase Orders</h3>
            <button className="view-all" onClick={() => handleNavigate("/purchase-order")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="order-list">
            {loading ? (
              <div className="order-item">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="order-item">No recent orders</div>
            ) : (
              recentOrders.map((order: any) => (
                <div key={order.id} className="order-item" onClick={() => handleNavigate(`/purchase-order/${order.id}`)}>
                  <div className="order-info">
                    <div className="order-supplier">{order.supplier_name || 'Unknown Supplier'}</div>
                    <div className="order-meta">
                      <span className="order-status" style={{ backgroundColor: statusColors[order.status] || '#94a3b8' }}>
                        {order.status}
                      </span>
                      <span className="order-date">{new Date(order.order_date || order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="order-amount">
                    <span className="amount-value">₹{order.total_amount?.toLocaleString() || 0}</span>
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
                <span className="metric-label">On-time Delivery</span>
                <span className="metric-value">92%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaTruck /></div>
              <div className="metric-info">
                <span className="metric-label">Orders in Transit</span>
                <span className="metric-value">{stats.openOrders}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaBoxes /></div>
              <div className="metric-info">
                <span className="metric-label">Items Received</span>
                <span className="metric-value">1,284</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}