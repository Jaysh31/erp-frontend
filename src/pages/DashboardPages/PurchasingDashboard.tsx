/* ============================================================
   PURCHASING DASHBOARD
   PREMIUM ERP UI
   ============================================================ */

import React, { useEffect, useState } from "react";
import {
  FaFileInvoice,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaDollarSign,
  FaUsers,
  FaBoxes,
  FaShoppingCart,
  FaArrowRight,
  FaExclamationTriangle,
  FaSyncAlt,
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./PurchasingDashboard.css";

/* ============================================================
   TYPES
   ============================================================ */

interface PurchaseInvoice {
  id?: number | string;
  invoiceNumber: string;
  supplier_name?: string;
  supplier?: string;
  status?: string;
  grand_total?: number | string;
  total?: number | string;
  net_total?: number | string;
  posting_date?: string;
  created_at?: string;
}


interface GRN {
  id?: number | string;
  grn_no?: string;
  supplier_name?: string;
  status?: string;
  received_qty?: number | string;
  rejected_qty?: number | string;
  posting_date?: string;
  created_at?: string;
}

interface PurchaseOrder {
  id?: number | string;
  po_no?: string;
  supplier_name?: string;
  status?: string;
  grand_total?: number | string;
  total?: number | string;
  posting_date?: string;
  created_at?: string;
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

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend: string;
  path: string;
}

/* ============================================================
   HELPERS
   ============================================================ */

const getArrayData = (response: any): any[] => {
  const data =
    response?.data?.data?.records ??
    response?.data?.data?.data ??
    response?.data?.data ??
    response?.data?.records ??
    [];

  return Array.isArray(data) ? data : [];
};

const getNumber = (value: any): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
};

const normalizeStatus = (status?: string): string => {
  return String(status || "").trim().toLowerCase();
};

/* ============================================================
   COMPONENT
   ============================================================ */

const PurchasingDashboard: React.FC = () => {
  const navigate = useNavigate();

  /* ============================================================
     STATE
     ============================================================ */

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
    totalRejectedQty: 0,
  });

  const [recentInvoices, setRecentInvoices] = useState<
    PurchaseInvoice[]
  >([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  /* ============================================================
     FETCH DASHBOARD DATA
     ============================================================ */

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      /* --------------------------------------------------------
         API CALLS

         Supplier API is intentionally called with limit=1
         because we only need the API's total count.
         -------------------------------------------------------- */

      const [
        invoicesRes,
        grnsRes,
        posRes,
        suppliersRes,
      ] = await Promise.all([
        api.get("/purchase-invoice?limit=1000"),
        api.get("/grn?limit=10000"),
        api.get("/purchase-order?limit=1000"),
        api.get("/supplier?limit=1"),
      ]);

      /* ========================================================
         EXTRACT DATA
         ======================================================== */

      const invoices = getArrayData(invoicesRes);
      const grns = getArrayData(grnsRes);
      const purchaseOrders = getArrayData(posRes);

      /* ========================================================
         SUPPLIER TOTAL

         Supplier API response expected:

         response.data.data.total

         Example:

         {
           success: 1,
           data: {
             records: [...],
             total: 25,
             totalPages: 25
           }
         }
         ======================================================== */

      const supplierApiData = suppliersRes?.data?.data;

      const supplierCount = Number(
        supplierApiData?.total ??
          supplierApiData?.totalRecords ??
          supplierApiData?.count ??
          0
      );

      /* ========================================================
         INVOICE STATISTICS
         ======================================================== */

      const totalInvoices = invoices.length;

      const totalSpend = invoices.reduce(
        (sum: number, invoice: PurchaseInvoice) => {
          const amount = getNumber(
            invoice.grand_total ??
              invoice.total ??
              invoice.net_total ??
              0
          );

          return sum + amount;
        },
        0
      );

      const draftInvoices = invoices.filter(
        (invoice: PurchaseInvoice) =>
          normalizeStatus(invoice.status) === "draft"
      ).length;

      const submittedInvoices = invoices.filter(
        (invoice: PurchaseInvoice) =>
          normalizeStatus(invoice.status) === "submitted"
      ).length;

      const completedInvoices = invoices.filter(
        (invoice: PurchaseInvoice) => {
          const status = normalizeStatus(invoice.status);

          return (
            status === "completed" ||
            status === "paid" ||
            status === "fully paid"
          );
        }
      ).length;

      const cancelledInvoices = invoices.filter(
        (invoice: PurchaseInvoice) =>
          normalizeStatus(invoice.status) === "cancelled"
      ).length;

      const overdueInvoices = invoices.filter(
        (invoice: PurchaseInvoice) =>
          normalizeStatus(invoice.status) === "overdue"
      ).length;

      const openInvoices =
        draftInvoices + submittedInvoices;

      const averageOrderValue =
        totalInvoices > 0
          ? totalSpend / totalInvoices
          : 0;

      /* ========================================================
         GRN STATISTICS
         ======================================================== */

      const totalGRNs = grns.length;

      const totalReceivedQty = grns.reduce(
        (sum: number, grn: GRN) => {
          return (
            sum +
            getNumber(
              grn.received_qty ??
                (grn as any).received_quantity ??
                (grn as any).total_received_qty ??
                0
            )
          );
        },
        0
      );

      const totalRejectedQty = grns.reduce(
        (sum: number, grn: GRN) => {
          return (
            sum +
            getNumber(
              grn.rejected_qty ??
                (grn as any).rejected_quantity ??
                (grn as any).total_rejected_qty ??
                0
            )
          );
        },
        0
      );

      /* ========================================================
         PURCHASE ORDER STATISTICS
         ======================================================== */

      const totalPOs = purchaseOrders.length;

      /* ========================================================
         UPDATE STATS
         ======================================================== */

      setStats({
        totalInvoices,
        totalSpend,
        openInvoices,
        completedInvoices,
        cancelledInvoices,
        draftInvoices,
        submittedInvoices,
        overdueInvoices,
        averageOrderValue,
        supplierCount,
        totalGRNs,
        totalPOs,
        totalReceivedQty,
        totalRejectedQty,
      });

      /* ========================================================
         RECENT INVOICES

         Sort newest first.
         ======================================================== */

      const sortedInvoices = [...invoices].sort(
        (a: PurchaseInvoice, b: PurchaseInvoice) => {
          const dateA = new Date(
            a.posting_date ||
              a.created_at ||
              ""
          ).getTime();

          const dateB = new Date(
            b.posting_date ||
              b.created_at ||
              ""
          ).getTime();

          return dateB - dateA;
        }
      );

      setRecentInvoices(sortedInvoices.slice(0, 5));
    } catch (err: any) {
      console.error(
        "Purchasing dashboard API error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to load purchasing dashboard data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /* ============================================================
     NAVIGATION
     ============================================================ */

  const handleNavigate = (path: string) => {
    if (!path) return;

    navigate(path);
  };

  /* ============================================================
     STAT CARDS

     IMPORTANT:
     Each card uses the "value" property.

     The previous incorrect code used:
       stat.totalSuppliers

     That property does not exist on statCards.

     Correct:
       stat.value
     ============================================================ */

  const statCards: StatCard[] = [
    {
      id: "total-invoices",
      title: "Total Invoices",
      value: stats.totalInvoices,
      icon: <FaFileInvoice />,
      color: "primary",
      trend: "all invoices",
      path: "/purchase-invoice",
    },

    {
      id: "total-spend",
      title: "Total Spend",
      value: `₹${stats.totalSpend.toLocaleString("en-IN")}`,
      icon: <FaMoneyBillWave />,
      color: "success",
      trend: "total value",
      path: "",
    },

    {
      id: "open-invoices",
      title: "Open Invoices",
      value: stats.openInvoices,
      icon: <FaClock />,
      color: "warning",
      trend: `(${stats.draftInvoices} Draft, ${stats.submittedInvoices} Submitted)`,
      path: "",
    },

    {
      id: "completed",
      title: "Completed",
      value: stats.completedInvoices,
      icon: <FaCheckCircle />,
      color: "info",
      trend: "paid & completed",
      path: "",
    },

    {
      id: "avg-order",
      title: "Avg Order Value",
      value: `₹${Math.round(
        stats.averageOrderValue
      ).toLocaleString("en-IN")}`,
      icon: <FaDollarSign />,
      color: "primary",
      trend: "per invoice",
      path: "",
    },

    {
      id: "suppliers",
      title: "Suppliers",
      value: stats.supplierCount,
      icon: <FaUsers />,
      color: "info",
      trend: "active suppliers",
      path: "/supplier",
    },

    {
      id: "grn-total",
      title: "Total GRNs",
      value: stats.totalGRNs,
      icon: <FaBoxes />,
      color: "primary",
      trend: `Received: ${stats.totalReceivedQty} units`,
      path: "/grn",
    },

    {
      id: "po-total",
      title: "Purchase Orders",
      value: stats.totalPOs,
      icon: <FaShoppingCart />,
      color: "success",
      trend: "active POs",
      path: "/purchase-order",
    },
  ];

  /* ============================================================
     STATUS COLORS
     ============================================================ */

  const getStatusClass = (status?: string) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "draft":
        return "draft";

      case "pending":
        return "pending";

      case "submitted":
        return "submitted";

      case "approved":
        return "approved";

      case "processing":
        return "processing";

      case "completed":
      case "paid":
      case "fully paid":
        return "completed";

      case "cancelled":
      case "canceled":
        return "cancelled";

      case "overdue":
        return "overdue";

      default:
        return "default";
    }
  };

  /* ============================================================
     FORMAT DATE
     ============================================================ */

  const formatDate = (date?: string) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /* ============================================================
     FORMAT AMOUNT
     ============================================================ */

  const formatAmount = (
    invoice: PurchaseInvoice
  ) => {
    const amount = getNumber(
      invoice.grand_total ??
        invoice.total ??
        invoice.net_total ??
        0
    );

    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  /* ============================================================
     LOADING STATE
     ============================================================ */

  if (loading) {
    return (
      <div className="purchasing-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner">
            <FaSyncAlt />
          </div>

          <p>Loading purchasing dashboard...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     MAIN UI
     ============================================================ */

  return (
    <div className="purchasing-dashboard">
      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="dashboard-header">
        <div className="dashboard-header-left">
          <div className="dashboard-title-icon">
            <FaShoppingCart />
          </div>

          <div>
            <h1>Purchasing Dashboard</h1>

          </div>
        </div>

        <button
          type="button"
          className={`refresh-button ${
            refreshing ? "refreshing" : ""
          }`}
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
        >
          <FaSyncAlt />

          <span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </span>
        </button>
      </div>

      {/* ======================================================
          ERROR
          ====================================================== */}

      {error && (
        <div className="dashboard-error">
          <FaExclamationTriangle />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => fetchDashboardData()}
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================
          STATISTICS
          ====================================================== */}

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div
            key={stat.id}
            className={`stat-card stat-${stat.color} ${
              !stat.path ? "stat-disabled" : ""
            }`}
            onClick={() =>
              stat.path &&
              handleNavigate(stat.path)
            }
            style={{
              cursor: stat.path
                ? "pointer"
                : "default",
            }}
          >
            <div className="stat-icon">
              {stat.icon}
            </div>

            <div className="stat-content">
              <div className="stat-title">
                {stat.title}
              </div>

              {/* IMPORTANT:
                  Show API-calculated card value */}
              <div className="stat-value">
                {stat.value}
              </div>

              <div className="stat-trend">
                {stat.trend}
              </div>
            </div>

            {stat.path && (
              <div className="stat-arrow">
                <FaArrowRight />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ======================================================
          SECONDARY SUMMARY
          ====================================================== */}

      <div className="dashboard-summary-grid">
        <div className="summary-card">
          <div className="summary-card-header">
            <div>
              <h3>Invoice Overview</h3>
              <p>Current purchase invoice status</p>
            </div>

            <FaFileInvoice />
          </div>

          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">
                Draft
              </span>

              <strong>
                {stats.draftInvoices}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Submitted
              </span>

              <strong>
                {stats.submittedInvoices}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Completed
              </span>

              <strong>
                {stats.completedInvoices}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Overdue
              </span>

              <strong className="danger-text">
                {stats.overdueInvoices}
              </strong>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <div>
              <h3>Goods Receipt</h3>
              <p>GRN quantity summary</p>
            </div>

            <FaBoxes />
          </div>

          <div className="summary-items">
            <div className="summary-item">
              <span className="summary-label">
                Total GRNs
              </span>

              <strong>
                {stats.totalGRNs}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Received Qty
              </span>

              <strong>
                {stats.totalReceivedQty}
              </strong>
            </div>

            <div className="summary-item">
              <span className="summary-label">
                Rejected Qty
              </span>

              <strong className="danger-text">
                {stats.totalRejectedQty}
              </strong>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-card-header">
            <div>
              <h3>Supplier Overview</h3>
              <p>Supplier master information</p>
            </div>

            <FaUsers />
          </div>

          <div className="supplier-total">
            <span>Total Suppliers</span>

            <strong>
              {stats.supplierCount}
            </strong>
          </div>

          <button
            type="button"
            className="summary-action"
            onClick={() =>
              handleNavigate("/supplier")
            }
          >
            View Suppliers
            <FaArrowRight />
          </button>
        </div>
      </div>

      {/* ======================================================
          RECENT PURCHASE INVOICES
          ====================================================== */}

      <div className="recent-section">
        <div className="section-header">
          <div>
            <h2>Recent Purchase Bills</h2>

            <p>
              Latest purchase invoices from the system
            </p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() =>
              handleNavigate("/purchase-invoice")
            }
          >
            View All
            <FaArrowRight />
          </button>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="empty-state">
            <FaFileInvoice />

            <h3>No Purchase Bills Found</h3>

            <p>
              Purchase invoices will appear here
              once they are created.
            </p>
          </div>
        ) : (
          <div className="invoice-table-wrapper">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices.map(
                  (
                    invoice: PurchaseInvoice,
                    index: number
                  ) => (
                    <tr
                      key={
                        invoice.id ??
                        invoice.invoiceNumber ??
                        index
                      }
                    >

                      <td>
                        <div className="supplier-cell">
                          {invoice.supplier_name ||
                            invoice.supplier ||
                            "—"}
                        </div>
                      </td>

                      <td>
                        {formatDate(
                          invoice.posting_date ||
                            invoice.created_at
                        )}
                      </td>

                      <td>
                        <span
                          className={`order-status ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {invoice.status ||
                            "Unknown"}
                        </span>
                      </td>

                      <td>
                        <strong className="amount-cell">
                          {formatAmount(invoice)}
                        </strong>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          QUICK ACTIONS
          ====================================================== */}

      <div className="quick-actions">
        <div className="quick-actions-header">
          <div>
            <h2>Quick Actions</h2>

            <p>
              Access frequently used purchasing modules
            </p>
          </div>
        </div>

        <div className="quick-actions-grid">
          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              handleNavigate("/purchase-invoice")
            }
          >
            <div className="quick-action-icon">
              <FaFileInvoice />
            </div>

            <div>
              <strong>Purchase Invoices</strong>
              <span>
                Manage purchase bills
              </span>
            </div>

            <FaArrowRight />
          </button>

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              handleNavigate("/purchase-order")
            }
          >
            <div className="quick-action-icon">
              <FaShoppingCart />
            </div>

            <div>
              <strong>Purchase Orders</strong>
              <span>
                Manage purchase orders
              </span>
            </div>

            <FaArrowRight />
          </button>

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              handleNavigate("/supplier")
            }
          >
            <div className="quick-action-icon">
              <FaUsers />
            </div>

            <div>
              <strong>Suppliers</strong>
              <span>
                Manage supplier master
              </span>
            </div>

            <FaArrowRight />
          </button>

          <button
            type="button"
            className="quick-action-card"
            onClick={() =>
              handleNavigate("/grn")
            }
          >
            <div className="quick-action-icon">
              <FaBoxes />
            </div>

            <div>
              <strong>GRN</strong>
              <span>
                Manage goods receipts
              </span>
            </div>

            <FaArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasingDashboard;