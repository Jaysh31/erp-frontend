// SalesDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShoppingCart, FaMoneyBillWave, FaUsers, FaChartLine,
  FaFileInvoice, FaClipboardList, FaCheckCircle, FaClock,
  FaExclamationTriangle, FaPlus, FaArrowRight, FaPercent,
  FaUserFriends, FaTruck, FaDollarSign
  } from "react-icons/fa";
import { BsGraphUp } from "react-icons/bs";
import "./SalesDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';
import api from "../../services/api";

interface SalesStats {
  totalOrders: number;
  totalRevenue: number;
  openOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  overdueOrders: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface RecentOrder {
  id: number;
  customer_name: string;
  total_amount: number;
  status: string;
  order_date: string;
  items_count: number;
}

export default function SalesDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats>({
    totalOrders: 0,
    totalRevenue: 0,
    openOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    overdueOrders: 0,
    averageOrderValue: 0,
    conversionRate: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
//   const [topProducts, setTopProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      // Fetch sales orders
      const response = await api.get("/sales-order");
      if (response.data.success === 1) {
        const orders = response.data.data.records || response.data.data || [];
        
        // Calculate stats
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);
        const openOrders = orders.filter((o: any) => o.status === "Draft" || o.status === "Submitted").length;
        const completedOrders = orders.filter((o: any) => o.status === "Completed").length;
        const cancelledOrders = orders.filter((o: any) => o.status === "Cancelled").length;
        
        setStats({
          totalOrders,
          totalRevenue,
          openOrders,
          completedOrders,
          cancelledOrders,
          overdueOrders: 0,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
          conversionRate: totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0
        });

        setRecentOrders(orders.slice(0, 5).map((o: any) => ({
          id: o.id,
          customer_name: o.customer_name || 'Unknown Customer',
          total_amount: o.total_amount || 0,
          status: o.status || 'Draft',
          order_date: o.order_date || o.created_at,
          items_count: o.items?.length || 0
        })));
      }
    } catch (error) {
      console.error("Error fetching sales data:", error);
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
      id: "revenue",
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "total sales"
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
      id: "conversion",
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: <FaChartLine />,
      color: "success",
      trend: "success rate"
    },
    {
      id: "customers",
      title: "Active Customers",
      value: "245",
      icon: <FaUsers />,
      color: "info",
      trend: "this month"
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
    { id: "new-quotation", label: "New Quotation", icon: <FaFileInvoice />, path: "/quotation/new" },
    { id: "new-order", label: "New Sales Order", icon: <FaShoppingCart />, path: "/sales-order/new" },
    { id: "new-invoice", label: "New Invoice", icon: <FaFileInvoice />, path: "/sales-invoice/new" },
    { id: "customer-list", label: "Customers", icon: <FaUsers />, path: "/customers" },
    { id: "price-list", label: "Price List", icon: <FaDollarSign />, path: "/price-list" },
    { id: "sales-report", label: "Sales Report", icon: <BsGraphUp />, path: "/sales-report" }
  ];

  const statusColors: Record<string, string> = {
    'Draft': '#94a3b8',
    'Submitted': '#3b82f6',
    'Approved': '#f59e0b',
    'Completed': '#22c55e',
    'Cancelled': '#ef4444'
  };

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
        {/* Sales Distribution */}
        <div className="card sales-distribution">
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
        <div className="card recent-orders">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="view-all" onClick={() => handleNavigate("/sales-order")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="order-list">
            {loading ? (
              <div className="order-item">Loading...</div>
            ) : recentOrders.length === 0 ? (
              <div className="order-item">No recent orders</div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="order-item" onClick={() => handleNavigate(`/sales-order/${order.id}`)}>
                  <div className="order-info">
                    <div className="order-customer">{order.customer_name}</div>
                    <div className="order-meta">
                      <span className="order-status" style={{ backgroundColor: statusColors[order.status] || '#94a3b8' }}>
                        {order.status}
                      </span>
                      <span className="order-date">{new Date(order.order_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="order-amount">
                    <span className="amount-value">₹{order.total_amount.toLocaleString()}</span>
                    <span className="order-items">{order.items_count} items</span>
                  </div>
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
                <span className="metric-label">Order Value</span>
                <span className="metric-value">₹{Math.round(stats.averageOrderValue).toLocaleString()}</span>
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
              <div className="metric-icon"><FaUserFriends /></div>
              <div className="metric-info">
                <span className="metric-label">Active Customers</span>
                <span className="metric-value">245</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaTruck /></div>
              <div className="metric-info">
                <span className="metric-label">Pending Delivery</span>
                <span className="metric-value">{stats.openOrders}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="card top-products">
          <div className="card-header">
            <h3>Top Selling Products</h3>
            <span className="badge">This Month</span>
          </div>
          <div className="product-list">
            <div className="product-item">
              <div className="product-rank">#1</div>
              <div className="product-info">
                <div className="product-name">Premium Widget</div>
                <div className="product-sales">Sold: 145 units</div>
              </div>
              <div className="product-revenue">₹45,230</div>
            </div>
            <div className="product-item">
              <div className="product-rank">#2</div>
              <div className="product-info">
                <div className="product-name">Eco-Friendly Pack</div>
                <div className="product-sales">Sold: 112 units</div>
              </div>
              <div className="product-revenue">₹32,450</div>
            </div>
            <div className="product-item">
              <div className="product-rank">#3</div>
              <div className="product-info">
                <div className="product-name">Smart Device Pro</div>
                <div className="product-sales">Sold: 98 units</div>
              </div>
              <div className="product-revenue">₹28,760</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}