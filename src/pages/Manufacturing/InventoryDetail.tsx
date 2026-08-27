// InventoryDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaBoxes,
  FaWarehouse,
  FaDollarSign,
  FaCalendarAlt,
  FaTruck,
  FaClipboardList,
  FaIndustry,
  FaChartBar,
  FaHistory,
  FaCube,
  FaTag,
  FaBarcode,
  FaAlignLeft,

  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaFileInvoice,
  FaReceipt,
  FaSpinner,
  FaLayerGroup,
  FaCheck,
  FaTimes,
  FaUser,
  FaBuilding,
} from "react-icons/fa";
import "./InventoryDetail.css";
import { useAdminTheme } from "../../admin-theme/AdminThemeContext";
import api from "../../services/api";

// ─── Types ───────────────────────────────────────────────────────────────

interface InventoryDetailResponse {
  success: number;
  message: string;
  data: {
    item_details: ItemDetails;
    current_inventory: CurrentInventory[];
    grn_history: GRNHistory[];
    purchase_order_history: PurchaseOrderHistory[];
    sales_invoice_history: SalesInvoiceHistory[];
    summary: Summary;
  };
  meta: {
    item_code: string;
    item_name: string;
    total_transactions: number;
    date_range: string;
  };
}

interface ItemDetails {
  id: number;
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  standard_rate: number;
  valuation_rate: number;
  description: string;
  brand: string | null;
  HSN: string;
}

interface CurrentInventory {
  id: number;
  warehouse_Id: number;
  warehouse_name: string;
  actual_qty: number;
  projected_qty: number;
  ordered_qty: number;
  reserved_qty: number;
  stock_value: number;
  valuation_rate: number;
  stock_uom: string;
  company: string;
  type: "Internal" | "External";
  last_updated: string;
}

interface GRNHistory {
  grn_id: number;
  grn_number: string;
  transaction_date: string;
  item_code: string;
  item_name: string;
  qty: number;
  accepted_qty: number;
  rejected_qty: number;
  rate: number;
  amount: number;
  uom: string;
  batch_no: string | null;
  expiry_date: string | null;
  supplier_id: number;
  warehouse_id: number;
  warehouse_name: string;
  created_on: string;
  created_by: string;
  type?: "Internal" | "External";
  transaction_type: string;
}

interface PurchaseOrderHistory {
  po_id: number;
  po_number: string;
  order_date: string;
  supplier: string;
  supplier_name: string;
  company: string;
  status: string;
  item_code: string;
  item_name: string;
  ordered_qty: number;
  received_qty: number;
  rate: number;
  amount: number;
  uom: string;
  created_on: string;
  created_by: string;
  transaction_type: string;
}

interface SalesInvoiceHistory {
  sales_id: number;
  transaction_date: string;
  customer: string;
  customer_name: string;
  status: string;
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
  warehouse: string;
  created_on: string;
  created_by: string;
  transaction_type: string;
}

interface Summary {
  total_received: number;
  total_sold: number;
  current_stock: number;
  total_stock_value: number;
  valuation_rate: number;
  transactions_by_source: Record<string, number>;
  daily_movement: Record<string, { received: number; sold: number; net: number }>;
}


export default function InventoryDetail() {
  const { itemCode } = useParams<{ itemCode: string }>();
  const navigate = useNavigate();
  const { theme } = useAdminTheme();
  const [searchParams] = useSearchParams();

  // ─── Type filter (passed in from the list page via ?type=Internal|External) ──
  // If absent (e.g. someone deep-links straight to this page), we show everything.
  const filterType = searchParams.get("type") as "Internal" | "External" | null;

  const [data, setData] = useState<InventoryDetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [] = useState<string>("all");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    itemDetails: true,
    currentInventory: true,
    purchaseOrders: true,
    salesInvoices: true,
    grnHistory: true,
    summary: true,
  });

  // Fetch inventory detail data
  useEffect(() => {
    const fetchInventoryDetail = async () => {
      if (!itemCode) return;
      
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<InventoryDetailResponse>(
          `/inventory/history?item_code=${encodeURIComponent(itemCode)}`
        );
        
        if (response.data.success === 1) {
          setData(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch inventory details");
        }
      } catch (err) {
        console.error("Error fetching inventory details:", err);
        setError("An error occurred while fetching inventory details");
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryDetail();
  }, [itemCode]);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if item is a Product (not Raw Material)
  const isProduct = (itemGroup: string): boolean => {
    if (!itemGroup) return false;
    const productGroups = ["Product", "Finished Goods", "Finished Product", "FG"];
    return productGroups.some(g => itemGroup.toLowerCase().includes(g.toLowerCase()));
  };

  // Check if item is Raw Material
  const isRawMaterial = (itemGroup: string): boolean => {
    if (!itemGroup) return false;
    const rawMaterialGroups = ["Raw Material", "Raw Materials", "Input Material", "RM"];
    return rawMaterialGroups.some(g => itemGroup.toLowerCase().includes(g.toLowerCase()));
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date short
  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'received': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      case 'draft': return '#6b7280';
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Get GRN status indicator
  const getGRNStatus = (grn: GRNHistory) => {
    if (grn.accepted_qty > 0 && grn.rejected_qty === 0) return 'completed';
    if (grn.accepted_qty > 0 && grn.rejected_qty > 0) return 'partial';
    if (grn.rejected_qty > 0) return 'rejected';
    return 'pending';
  };

  if (loading) {
    return (
      <div className={`inv-detail-page ${theme}`}>
        <div className="inv-detail-loading">
          <FaSpinner className="inv-spinner" />
          <p>Loading inventory details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`inv-detail-page ${theme}`}>
        <div className="inv-detail-error">
          <FaExclamationTriangle size={48} />
          <h2>Error Loading Data</h2>
          <p>{error || "No data available"}</p>
          <button onClick={() => navigate(-1)} className="inv-btn-primary">
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const {
    item_details,
    purchase_order_history,
    sales_invoice_history,
    grn_history,
    summary,
    current_inventory,
  } = data;

  // ─── Type-filtered records ──────────────────────────────────────────
  // current_inventory and grn_history each carry a `type` field per record
  // (Internal / External). When the user arrived here from a specific row
  // on the list page (via ?type=...), we only show records matching that type.
  // purchase_order_history / sales_invoice_history don't carry a per-record
  // type in the API response, so they are left unfiltered.
  const filteredCurrentInventory = filterType
    ? current_inventory.filter((inv) => inv.type === filterType)
    : current_inventory;

  const filteredGrnHistory = filterType
    ? grn_history.filter((grn) => grn.type === filterType)
    : grn_history;

  // Recompute stock figures from the filtered set so the header numbers
  // match what's actually shown below (rather than using the type-agnostic
  // `summary.current_stock`, which sums across both types).
  const filteredCurrentStock = filteredCurrentInventory.reduce(
    (sum, inv) => sum + inv.actual_qty,
    0
  );
  const filteredStockValueFromInventory = filteredCurrentInventory.reduce(
    (sum, inv) => sum + inv.stock_value,
    0
  );

  // Calculate Total Stock Value using standard_rate * filtered current_stock
  const totalStockValue = item_details.standard_rate * filteredCurrentStock;
  // Use standard_rate for valuation rate display
  const displayValuationRate = item_details.standard_rate;

  // Check if item is Product or Raw Material
  const isProductItem = isProduct(item_details.item_group);
  const isRawMaterialItem = isRawMaterial(item_details.item_group);

  const clearTypeFilter = () => navigate(`/inventory/detail/${itemCode}`);

  return (
    <div className={`inv-detail-page ${theme}`}>
      <div className="inv-detail-container">
        {/* Header */}
        <div className="inv-detail-header">
          <button className="inv-detail-back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back to Inventory
          </button>

          {/* Active type-filter banner */}
          {filterType && (
            <div className="inv-type-filter-banner">
              <span className={`inv-type-badge ${filterType.toLowerCase()}`}>
                {filterType === "Internal" ? <FaIndustry size={10} /> : <FaTruck size={10} />}
                {filterType}
              </span>
              <span>Showing {filterType} stock only</span>
              <button className="inv-link-btn" onClick={clearTypeFilter}>
                Show all
              </button>
            </div>
          )}

          <div className="inv-detail-header-content">
            <div className="inv-detail-header-left">
              <div className="inv-detail-icon-wrapper">
                <FaCube size={32} />
              </div>
              <div>
                <h1>{item_details.item_name}</h1>
                <div className="inv-detail-badges">
                  <span className="inv-detail-badge">
                    <FaBarcode size={12} /> {item_details.item_code}
                  </span>
                  <span className="inv-detail-badge">
                    <FaLayerGroup size={12} /> {item_details.item_group}
                  </span>
                  <span className="inv-detail-badge">
                    <FaTag size={12} /> {item_details.stock_uom}
                  </span>
                </div>
              </div>
            </div>
            <div className="inv-detail-header-right">
              <div className="inv-detail-stat">
                <label>Total Stock Value</label>
                <span className="inv-detail-stat-value">
                  {formatCurrency(totalStockValue)}
                </span>
              </div>
              <div className="inv-detail-stat">
                <label>Current Stock</label>
                <span className="inv-detail-stat-value">
                  {filteredCurrentStock} {item_details.stock_uom}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="inv-detail-stats-grid">
          <div className="inv-detail-stat-card">
            <div className="inv-detail-stat-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
              <FaBoxes size={20} />
            </div>
            <div className="inv-detail-stat-info">
              <label>Current Stock</label>
              <span>{filteredCurrentStock} {item_details.stock_uom}</span>
            </div>
          </div>
          
          <div className="inv-detail-stat-card">
            <div className="inv-detail-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
              <FaDollarSign size={20} />
            </div>
            <div className="inv-detail-stat-info">
              <label>Total Stock Value</label>
              <span>{formatCurrency(totalStockValue)}</span>
            </div>
          </div>
          
          <div className="inv-detail-stat-card">
            <div className="inv-detail-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
              <FaDollarSign size={20} />
            </div>
            <div className="inv-detail-stat-info">
              <label>Valuation Rate</label>
              <span>{formatCurrency(displayValuationRate)}</span>
            </div>
          </div>
          
          <div className="inv-detail-stat-card">
            <div className="inv-detail-stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
              <FaHistory size={20} />
            </div>
            <div className="inv-detail-stat-info">
              <label>Total Transactions</label>
              <span>{purchase_order_history.length + filteredGrnHistory.length + sales_invoice_history.length}</span>
            </div>
          </div>
        </div>

        {/* Item Details Section */}
        <div className="inv-detail-section">
          <div 
            className="inv-detail-section-header"
            onClick={() => toggleSection('itemDetails')}
          >
            <h2>
              <FaClipboardList size={18} /> Item Details
            </h2>
            <button className="inv-detail-toggle">
              {expandedSections.itemDetails !== false ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          {expandedSections.itemDetails !== false && (
            <div className="inv-detail-section-content">
              <div className="inv-item-details-grid">
                <div className="inv-item-detail-field">
                  <label><FaBarcode size={14} /> Item Code</label>
                  <span>{item_details.item_code}</span>
                </div>
                <div className="inv-item-detail-field">
                  <label><FaTag size={14} /> Item Name</label>
                  <span>{item_details.item_name}</span>
                </div>
                <div className="inv-item-detail-field">
                  <label><FaLayerGroup size={14} /> Item Group</label>
                  <span className="inv-item-group-badge">{item_details.item_group}</span>
                </div>
                <div className="inv-item-detail-field">
                  <label><FaCube size={14} /> Stock UOM</label>
                  <span>{item_details.stock_uom}</span>
                </div>
                <div className="inv-item-detail-field">
                  <label><FaDollarSign size={14} /> Standard Rate</label>
                  <span>{formatCurrency(item_details.standard_rate)}</span>
                </div>
                <div className="inv-item-detail-field">
                  <label><FaDollarSign size={14} /> Valuation Rate</label>
                  <span>{formatCurrency(displayValuationRate)}</span>
                </div>
                {item_details.brand && (
                  <div className="inv-item-detail-field">
                    <label><FaIndustry size={14} /> Brand</label>
                    <span>{item_details.brand}</span>
                  </div>
                )}
                <div className="inv-item-detail-field">
                  <label><FaBarcode size={14} /> HSN Code</label>
                  <span>{item_details.HSN || "N/A"}</span>
                </div>
                <div className="inv-item-detail-field inv-item-detail-full">
                  <label><FaAlignLeft size={14} /> Description</label>
                  <span>{item_details.description || "No description available"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Inventory Section — filtered by type */}
        <div className="inv-detail-section">
          <div
            className="inv-detail-section-header"
            onClick={() => toggleSection('currentInventory')}
          >
            <h2>
              <FaWarehouse size={18} /> Current Inventory ({filteredCurrentInventory.length})
            </h2>
            <button className="inv-detail-toggle">
              {expandedSections.currentInventory !== false ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>

          {expandedSections.currentInventory !== false && (
            <div className="inv-detail-section-content">
              {filteredCurrentInventory.length === 0 ? (
                <div className="inv-detail-empty">
                  <FaWarehouse size={40} />
                  <p>No {filterType ? `${filterType.toLowerCase()} ` : ""}inventory records found</p>
                </div>
              ) : (
                <div className="inv-table-wrap">
                  <table className="inv-table">
                    <thead>
                      <tr>
                        <th>Warehouse</th>
                        <th>Type</th>
                        <th>Actual Qty</th>
                        <th>Projected Qty</th>
                        <th>Ordered Qty</th>
                        <th>Reserved Qty</th>
                        <th>Valuation Rate</th>
                        <th>Stock Value</th>
                        <th>Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCurrentInventory.map((inv) => (
                        <tr key={inv.id}>
                          <td>
                            <span className="inv-warehouse-badge">
                              <FaWarehouse size={10} /> {inv.warehouse_name}
                            </span>
                          </td>
                          <td>
                            <span className={`inv-type-badge ${inv.type.toLowerCase()}`}>
                              {inv.type === "Internal" ? <FaIndustry size={10} /> : <FaTruck size={10} />}
                              {inv.type}
                            </span>
                          </td>
                          <td>{inv.actual_qty} {inv.stock_uom}</td>
                          <td>{inv.projected_qty} {inv.stock_uom}</td>
                          <td>{inv.ordered_qty} {inv.stock_uom}</td>
                          <td>{inv.reserved_qty} {inv.stock_uom}</td>
                          <td>{formatCurrency(inv.valuation_rate)}</td>
                          <td className="inv-td-amount">{formatCurrency(inv.stock_value)}</td>
                          <td>{formatDate(inv.last_updated)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="inv-table-footer-label">Total</td>
                        <td>
                          <strong>{filteredCurrentStock} {item_details.stock_uom}</strong>
                        </td>
                        <td colSpan={3}></td>
                        <td></td>
                        <td className="inv-td-amount">
                          <strong>{formatCurrency(filteredStockValueFromInventory)}</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Purchase Order History Section - Only for Raw Materials */}
        {isRawMaterialItem && (
          <div className="inv-detail-section">
            <div 
              className="inv-detail-section-header"
              onClick={() => toggleSection('purchaseOrders')}
            >
              <h2>
                <FaFileInvoice size={18} /> Purchase Order History ({purchase_order_history.length})
              </h2>
              <button className="inv-detail-toggle">
                {expandedSections.purchaseOrders !== false ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {expandedSections.purchaseOrders !== false && (
              <div className="inv-detail-section-content">
                {purchase_order_history.length === 0 ? (
                  <div className="inv-detail-empty">
                    <FaFileInvoice size={40} />
                    <p>No purchase orders found</p>
                  </div>
                ) : (
                  <div className="inv-table-wrap">
                    <table className="inv-table">
                      <thead>
                        <tr>
                          <th>PO Number</th>
                          <th>Date</th>
                          <th>Supplier</th>
                          <th>Ordered Qty</th>
                          <th>Received Qty</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase_order_history.map((po) => (
                          <tr key={po.po_id}>
                            <td className="inv-td-code">{po.po_number}</td>
                            <td>{formatDate(po.order_date)}</td>
                            <td>{po.supplier_name}</td>
                            <td>{po.ordered_qty} {po.uom}</td>
                            <td>
                              <span className={po.received_qty > 0 ? 'inv-text-success' : 'inv-text-warning'}>
                                {po.received_qty} {po.uom}
                              </span>
                            </td>
                            <td>{formatCurrency(po.rate)}</td>
                            <td className="inv-td-amount">{formatCurrency(po.amount)}</td>
                            <td>
                              <span 
                                className="inv-status-pill"
                                style={{ backgroundColor: getStatusColor(po.status) + '20', color: getStatusColor(po.status) }}
                              >
                                {po.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GRN History Section - Only for Raw Materials — filtered by type */}
        {isRawMaterialItem && (
          <div className="inv-detail-section">
            <div 
              className="inv-detail-section-header"
              onClick={() => toggleSection('grnHistory')}
            >
              <h2>
                <FaTruck size={18} /> GRN History ({filteredGrnHistory.length})
              </h2>
              <button className="inv-detail-toggle">
                {expandedSections.grnHistory !== false ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {expandedSections.grnHistory !== false && (
              <div className="inv-detail-section-content">
                {filteredGrnHistory.length === 0 ? (
                  <div className="inv-detail-empty">
                    <FaTruck size={40} />
                    <p>No {filterType ? `${filterType.toLowerCase()} ` : ""}GRN records found</p>
                  </div>
                ) : (
                  <div className="inv-table-wrap">
                    <table className="inv-table">
                      <thead>
                        <tr>
                          <th>GRN Number</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Supplier</th>
                          <th>Quantity</th>
                          <th>Accepted</th>
                          <th>Rejected</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th>Warehouse</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredGrnHistory.map((grn) => {
                          const status = getGRNStatus(grn);
                          const statusColors = {
                            completed: { bg: '#10b98120', color: '#10b981', label: 'Completed' },
                            partial: { bg: '#f59e0b20', color: '#f59e0b', label: 'Partial' },
                            rejected: { bg: '#ef444420', color: '#ef4444', label: 'Rejected' },
                            pending: { bg: '#6b728020', color: '#6b7280', label: 'Pending' },
                          };
                          const statusInfo = statusColors[status];
                          
                          return (
                            <tr key={grn.grn_id}>
                              <td className="inv-td-code">{grn.grn_number}</td>
                              <td>{formatDate(grn.transaction_date)}</td>
                              <td>
                                {grn.type && (
                                  <span className={`inv-type-badge ${grn.type.toLowerCase()}`}>
                                    {grn.type === "Internal" ? <FaIndustry size={10} /> : <FaTruck size={10} />}
                                    {grn.type}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="inv-supplier-info">
                                  <FaBuilding size={12} />
                                  <span>Supplier #{grn.supplier_id}</span>
                                </div>
                              </td>
                              <td>
                                <span className="inv-qty-badge">
                                  {grn.qty} {grn.uom}
                                </span>
                              </td>
                              <td>
                                <span className="inv-text-success">
                                  <FaCheck size={12} /> {grn.accepted_qty}
                                </span>
                              </td>
                              <td>
                                {grn.rejected_qty > 0 ? (
                                  <span className="inv-text-danger">
                                    <FaTimes size={12} /> {grn.rejected_qty}
                                  </span>
                                ) : (
                                  <span className="inv-text-muted">0</span>
                                )}
                              </td>
                              <td>{formatCurrency(grn.rate)}</td>
                              <td className="inv-td-amount">{formatCurrency(grn.amount)}</td>
                              <td>
                                <span className="inv-warehouse-badge">
                                  <FaWarehouse size={10} /> {grn.warehouse_name}
                                </span>
                              </td>
                              <td>
                                <span 
                                  className="inv-status-pill"
                                  style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                                >
                                  {statusInfo.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sales Invoice History Section - Only for Products */}
        {isProductItem && (
          <div className="inv-detail-section">
            <div 
              className="inv-detail-section-header"
              onClick={() => toggleSection('salesInvoices')}
            >
              <h2>
                <FaReceipt size={18} /> Sales Invoice History ({sales_invoice_history.length})
              </h2>
              <button className="inv-detail-toggle">
                {expandedSections.salesInvoices !== false ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>
            
            {expandedSections.salesInvoices !== false && (
              <div className="inv-detail-section-content">
                {sales_invoice_history.length === 0 ? (
                  <div className="inv-detail-empty">
                    <FaReceipt size={40} />
                    <p>No sales invoices found</p>
                  </div>
                ) : (
                  <div className="inv-table-wrap">
                    <table className="inv-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Quantity</th>
                          <th>Rate</th>
                          <th>Amount</th>
                          <th>Warehouse</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales_invoice_history.map((invoice) => (
                          <tr key={invoice.sales_id}>
                            <td className="inv-td-code">SI-{invoice.sales_id}</td>
                            <td>{formatDateShort(invoice.transaction_date)}</td>
                            <td>
                              <div className="inv-customer-info">
                                <FaUser size={12} />
                                <span>{invoice.customer_name}</span>
                              </div>
                            </td>
                            <td>
                              <span className="inv-qty-badge">
                                {invoice.qty} {invoice.uom}
                              </span>
                            </td>
                            <td>{formatCurrency(invoice.rate)}</td>
                            <td className="inv-td-amount">{formatCurrency(invoice.amount)}</td>
                            <td>
                              <span className="inv-warehouse-badge">
                                <FaWarehouse size={10} /> {invoice.warehouse}
                              </span>
                            </td>
                            <td>
                              <span 
                                className="inv-status-pill"
                                style={{ backgroundColor: getStatusColor(invoice.status) + '20', color: getStatusColor(invoice.status) }}
                              >
                                {invoice.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="inv-table-footer-label">Total</td>
                          <td>
                            <strong>
                              {sales_invoice_history.reduce((sum, inv) => sum + inv.qty, 0)} {item_details.stock_uom}
                            </strong>
                          </td>
                          <td></td>
                          <td className="inv-td-amount">
                            <strong>
                              {formatCurrency(sales_invoice_history.reduce((sum, inv) => sum + inv.amount, 0))}
                            </strong>
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary Section */}
        <div className="inv-detail-section">
          <div 
            className="inv-detail-section-header"
            onClick={() => toggleSection('summary')}
          >
            <h2>
              <FaChartBar size={18} /> Movement Summary
            </h2>
            <button className="inv-detail-toggle">
              {expandedSections.summary !== false ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          </div>
          
          {expandedSections.summary !== false && (
            <div className="inv-detail-section-content">
              {/* Transactions by Source */}
              <div className="inv-summary-grid">
                <div className="inv-summary-card">
                  <h3>Transactions by Source</h3>
                  <div className="inv-summary-list">
                    {Object.entries(summary.transactions_by_source).map(([source, count]) => (
                      <div key={source} className="inv-summary-item">
                        <span className="inv-summary-label">{source}</span>
                        <span className="inv-summary-value">{count} {item_details.stock_uom}</span>
                        <div className="inv-summary-bar">
                          <div 
                            className="inv-summary-bar-fill"
                            style={{ 
                              width: `${(count / (summary.total_received + summary.total_sold || 1)) * 100}%`,
                              backgroundColor: '#4f46e5'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Daily Movement */}
                <div className="inv-summary-card">
                  <h3>Daily Movement</h3>
                  <div className="inv-daily-movement">
                    {Object.entries(summary.daily_movement).map(([date, movement]) => (
                      <div key={date} className="inv-daily-movement-item">
                        <div className="inv-daily-movement-header">
                          <span className="inv-daily-date">
                            <FaCalendarAlt size={12} /> {date}
                          </span>
                          <span className={`inv-daily-net ${movement.net >= 0 ? 'positive' : 'negative'}`}>
                            {movement.net >= 0 ? '+' : ''}{movement.net}
                          </span>
                        </div>
                        <div className="inv-daily-movement-details">
                          <div className="inv-daily-metric">
                            <span className="inv-daily-label">Received</span>
                            <span className="inv-daily-value received">{movement.received}</span>
                          </div>
                          <div className="inv-daily-metric">
                            <span className="inv-daily-label">Sold</span>
                            <span className="inv-daily-value sold">{movement.sold}</span>
                          </div>
                        </div>
                        <div className="inv-daily-movement-bar">
                          <div 
                            className="inv-daily-bar-segment received"
                            style={{ width: `${(movement.received / (movement.received + movement.sold || 1)) * 100}%` }}
                          />
                          <div 
                            className="inv-daily-bar-segment sold"
                            style={{ width: `${(movement.sold / (movement.received + movement.sold || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}