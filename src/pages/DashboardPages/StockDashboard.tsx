// StockDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBoxes, FaBox, FaWarehouse, FaTruck,
  FaPlus, FaArrowRight, FaClipboardList, FaCheckCircle,
  FaClock, 
  
  FaChartBar, FaChartLine, FaPercent,
  FaExclamationCircle, FaCheckSquare, FaTimesCircle} from "react-icons/fa";
import "./StockDashboard.css";
import { useAdminTheme } from '../../admin-theme/AdminThemeContext';

interface StockStats {
  totalItems: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalWarehouses: number;
  totalStockEntries: number;
  pendingStockEntries: number;
  completedStockEntries: number;
}

interface StockItem {
  id: number;
  name: string;
  sku: string;
  quantity: number;
  warehouse: string;
  status: string;
  value: number;
  reorderLevel: number;
}

interface Warehouse {
  id: number;
  name: string;
  location: string;
  capacity: number;
  used: number;
  status: string;
}

export default function StockDashboard() {
  const { theme } = useAdminTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StockStats>({
    totalItems: 0,
    totalStockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalWarehouses: 0,
    totalStockEntries: 0,
    pendingStockEntries: 0,
    completedStockEntries: 0
  });
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      // Sample data for demonstration
      setStats({
        totalItems: 156,
        totalStockValue: 2456800,
        lowStockItems: 12,
        outOfStockItems: 5,
        totalWarehouses: 8,
        totalStockEntries: 234,
        pendingStockEntries: 18,
        completedStockEntries: 216
      });

      setStockItems([
        {
          id: 1,
          name: "Premium Steel Rods",
          sku: "SR-001",
          quantity: 150,
          warehouse: "Main Warehouse",
          status: "In Stock",
          value: 450000,
          reorderLevel: 50
        },
        {
          id: 2,
          name: "Aluminum Sheets",
          sku: "AS-002",
          quantity: 75,
          warehouse: "Secondary Warehouse",
          status: "Low Stock",
          value: 225000,
          reorderLevel: 100
        },
        {
          id: 3,
          name: "Copper Wire Coils",
          sku: "CW-003",
          quantity: 0,
          warehouse: "Main Warehouse",
          status: "Out of Stock",
          value: 0,
          reorderLevel: 30
        },
        {
          id: 4,
          name: "Plastic Raw Material",
          sku: "PR-004",
          quantity: 200,
          warehouse: "Storage Unit 1",
          status: "In Stock",
          value: 120000,
          reorderLevel: 80
        },
        {
          id: 5,
          name: "Electronic Components",
          sku: "EC-005",
          quantity: 45,
          warehouse: "Main Warehouse",
          status: "Low Stock",
          value: 675000,
          reorderLevel: 60
        }
      ]);

      setWarehouses([
        {
          id: 1,
          name: "Main Warehouse",
          location: "Mumbai, India",
          capacity: 10000,
          used: 7500,
          status: "Active"
        },
        {
          id: 2,
          name: "Secondary Warehouse",
          location: "Pune, India",
          capacity: 5000,
          used: 3200,
          status: "Active"
        },
        {
          id: 3,
          name: "Storage Unit 1",
          location: "Delhi, India",
          capacity: 3000,
          used: 2800,
          status: "Active"
        },
        {
          id: 4,
          name: "Cold Storage",
          location: "Mumbai, India",
          capacity: 2000,
          used: 1500,
          status: "Maintenance"
        }
      ]);

      setRecentTransactions([
        {
          id: 1,
          item: "Premium Steel Rods",
          type: "Inbound",
          quantity: 50,
          date: "2024-01-15T10:30:00",
          user: "Admin",
          status: "Completed"
        },
        {
          id: 2,
          item: "Aluminum Sheets",
          type: "Outbound",
          quantity: 25,
          date: "2024-01-15T09:15:00",
          user: "Production Team",
          status: "Completed"
        },
        {
          id: 3,
          item: "Electronic Components",
          type: "Transfer",
          quantity: 30,
          date: "2024-01-14T16:45:00",
          user: "Warehouse Staff",
          status: "Pending"
        },
        {
          id: 4,
          item: "Plastic Raw Material",
          type: "Inbound",
          quantity: 100,
          date: "2024-01-14T14:20:00",
          user: "Supplier",
          status: "Completed"
        },
        {
          id: 5,
          item: "Copper Wire Coils",
          type: "Outbound",
          quantity: 15,
          date: "2024-01-14T11:00:00",
          user: "Production Team",
          status: "In Progress"
        }
      ]);
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const statCards = [
    {
      id: "total-items",
      title: "Total Items",
      value: stats.totalItems,
      icon: <FaBoxes />,
      color: "primary",
      trend: "inventory items"
    },
    {
      id: "stock-value",
      title: "Total Stock Value",
      value: `₹${(stats.totalStockValue / 100000).toFixed(1)}L`,
      icon: <FaChartBar />,
      color: "success",
      trend: "inventory value"
    },
    {
      id: "low-stock",
      title: "Low Stock Items",
      value: stats.lowStockItems,
      icon: <FaExclamationCircle />,
      color: "warning",
      trend: "needs reorder"
    },
    {
      id: "out-of-stock",
      title: "Out of Stock",
      value: stats.outOfStockItems,
      icon: <FaTimesCircle />,
      color: "danger",
      trend: "unavailable"
    },
    {
      id: "warehouses",
      title: "Warehouses",
      value: stats.totalWarehouses,
      icon: <FaWarehouse />,
      color: "info",
      trend: "storage locations"
    },
    {
      id: "entries",
      title: "Total Entries",
      value: stats.totalStockEntries,
      icon: <FaClipboardList />,
      color: "primary",
      trend: "stock movements"
    },
    {
      id: "pending",
      title: "Pending Entries",
      value: stats.pendingStockEntries,
      icon: <FaClock />,
      color: "warning",
      trend: "in queue"
    },
    {
      id: "completed",
      title: "Completed Entries",
      value: stats.completedStockEntries,
      icon: <FaCheckCircle />,
      color: "success",
      trend: "processed"
    }
  ];

  const quickActions = [
    { id: "new-entry", label: "New Stock Entry", icon: <FaPlus />, path: "/stock-entry/new" },
    { id: "transfer", label: "Stock Transfer", icon: <FaTruck />, path: "/stock-transfer" },
    { id: "warehouse", label: "Warehouse Mgt", icon: <FaWarehouse />, path: "/warehouse" },
    { id: "adjustment", label: "Stock Adjustment", icon: <FaCheckSquare />, path: "/stock-adjustment" },
    { id: "inventory", label: "Inventory Report", icon: <FaChartLine />, path: "/inventory-report" },
    { id: "stock-take", label: "Stock Take", icon: <FaClipboardList />, path: "/stock-take" }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'In Stock': '#22c55e',
      'Low Stock': '#f59e0b',
      'Out of Stock': '#ef4444',
      'Active': '#22c55e',
      'Maintenance': '#f59e0b',
      'Inactive': '#94a3b8',
      'Completed': '#22c55e',
      'Pending': '#f59e0b',
      'In Progress': '#3b82f6'
    };
    return colors[status] || '#94a3b8';
  };

  const getStockIcon = (status: string) => {
    if (status === 'In Stock') return <FaCheckCircle />;
    if (status === 'Low Stock') return <FaExclamationCircle />;
    if (status === 'Out of Stock') return <FaTimesCircle />;
    return <FaBox />;
  };

  return (
    <div className={`dashboard stock-dashboard ${theme}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>📦 Stock Dashboard</h1>
          <p className="header-subtitle">Inventory management and warehouse overview</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={() => handleNavigate("/stock-entry/new")}>
            <FaPlus /> New Stock Entry
          </button>
          <button className="btn-secondary" onClick={() => handleNavigate("/stock-transfer")}>
            <FaTruck /> Transfer
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

        {/* Warehouse Overview */}
        <div className="card warehouse-overview">
          <div className="card-header">
            <h3>Warehouse Overview</h3>
            <span className="badge">{warehouses.length} Facilities</span>
          </div>
          <div className="warehouse-list">
            {warehouses.map((warehouse) => {
              const percentage = Math.round((warehouse.used / warehouse.capacity) * 100);
              return (
                <div key={warehouse.id} className="warehouse-item">
                  <div className="warehouse-info">
                    <div className="warehouse-name">
                      <FaWarehouse /> {warehouse.name}
                    </div>
                    <div className="warehouse-location">{warehouse.location}</div>
                  </div>
                  <div className="warehouse-stats">
                    <div className="warehouse-capacity">
                      {warehouse.used.toLocaleString()} / {warehouse.capacity.toLocaleString()} units
                    </div>
                    <div className="warehouse-bar">
                      <div 
                        className="warehouse-fill" 
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#22c55e'
                        }}
                      />
                    </div>
                    <div className="warehouse-percentage">{percentage}%</div>
                  </div>
                  <div className="warehouse-status">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(warehouse.status) }}>
                      {warehouse.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock Items */}
        <div className="card stock-items">
          <div className="card-header">
            <h3>Stock Items</h3>
            <button className="view-all" onClick={() => handleNavigate("/item-list")}>
              View All <FaArrowRight />
            </button>
          </div>
          <div className="items-list">
            {stockItems.map((item) => (
              <div key={item.id} className="item-row">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-sku">{item.sku}</div>
                </div>
                <div className="item-details">
                  <div className="item-quantity">
                    <span className="qty-value">{item.quantity}</span>
                    <span className="qty-label">units</span>
                  </div>
                  <div className="item-warehouse">{item.warehouse}</div>
                  <div className="item-status">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(item.status) }}>
                      {getStockIcon(item.status)} {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card recent-transactions">
          <div className="card-header">
            <h3>Recent Stock Movements</h3>
            <button className="view-all" onClick={() => handleNavigate("/stock-entry")}>
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
                  <div className="transaction-type">
                    <span className={`type-badge ${transaction.type.toLowerCase()}`}>
                      {transaction.type}
                    </span>
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-item-name">{transaction.item}</div>
                    <div className="transaction-meta">
                      <span className="transaction-qty">{transaction.quantity} units</span>
                      <span className="transaction-user">by {transaction.user}</span>
                      <span className="transaction-date">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-status">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(transaction.status) }}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stock Metrics */}
        <div className="card stock-metrics">
          <div className="card-header">
            <h3>Stock Metrics</h3>
            <span className="badge">Live</span>
          </div>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-icon"><FaPercent /></div>
              <div className="metric-info">
                <span className="metric-label">Stock Accuracy</span>
                <span className="metric-value">98%</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaBoxes /></div>
              <div className="metric-info">
                <span className="metric-label">Items in Stock</span>
                <span className="metric-value">{stats.totalItems - stats.outOfStockItems}</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaClock /></div>
              <div className="metric-info">
                <span className="metric-label">Avg. Processing Time</span>
                <span className="metric-value">2.5 hrs</span>
              </div>
            </div>
            <div className="metric-item">
              <div className="metric-icon"><FaCheckCircle /></div>
              <div className="metric-info">
                <span className="metric-label">Order Fulfillment</span>
                <span className="metric-value">94%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}