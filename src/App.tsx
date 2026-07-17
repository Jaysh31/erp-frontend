import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminThemeProvider } from './admin-theme/AdminThemeContext';
import { ModuleProvider } from './context/ModuleContext'; // Import ModuleProvider

import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPages/DashboardPage";
import ItemGroupForm from "./pages/Setup/Itemgroupform";
import ItemGroupList from "./pages/Setup/Itemgrouplist";
import Itemlist from "./pages/Setup/Itemlist";
import ItemForm from "./pages/Setup/Itemform";
import ItemAttributeList from "./pages/Setup/ItemAttributeList";
import ItemAttributeForm from "./pages/Setup/ItemAttributeForm";
import WarehouseForm from "./pages/Setup/WarehouseForm";
import WarehouseList from "./pages/Setup/WarehouseList";
import BrandForm from "./pages/Setup/BrandForm";
import BrandList from "./pages/Setup/BrandList";
import UOMForm from "./pages/Setup/UOMForm";
import UOMList from "./pages/Setup/UOMList";
import Settings from "./pages/Settings";
import BOMPage from "./pages/BOMPage";
import NewBOMPage from "./pages/Newbompage";
import JobCardManagement from "./pages/JobCardManagement";
import JobCardForm from "./pages/JobCardForm";
import Stockentry from "./pages/Stockentry";
// import StockentryForm from "./pages/StockentryForm";


import HomePage from "./pages/HomePage";

import SalesOrder from "./pages/SalesOrder";
import CreateSalesOrder from './pages/CreateSalesOrder';
import SalesInvoice from "./pages/SalesInvoice";
import CreateSalesInvoice from './pages/CreateSalesInvoice';


import CompanyList from "./pages/CompanyList";
import AddCompanyForm from "./pages/AddCompanyForm";
import LetterHeadList from "./pages/LetterHeadList";
import AddLetterHeadForm from "./pages/AddLetterHeadForm";
import QuotationPage from "./pages/QuotationPage";
import CreateQuotationPage from "./pages/CreateQuotation";


import PriceList from "./pages/PriceList";
import ItemPrice from "./pages/ItemPrice";
import PricingRule from "./pages/PricingRule";
import CouponCode from "./pages/CouponCode";
import Supplier from "./pages/Supplier";
import AddSupplier from "./pages/AddSupplier";
import SupplierGroup from "./pages/SupplierGroup";
import Contacts from "./pages/Contacts";
import MaterialRequest from "./pages/MaterialRequest";
import PurchaseOrder from "./pages/PurchaseOrder";
import RequestForQuotation from "./pages/RequestForQuotation";
import NewSupplierQuotation from "./pages/NewSupplierQuotation";
import SupplierQuotation from "./pages/SupplierQuotation";
import PurchaseInvoice from "./pages/PurchaseInvoice";
// import NewPurchaseInvoice from "./pages/NewPurchaseInvoice";
import Accounts from "./pages/Accounts";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import LedgerAccounts from "./pages/LedgerAccounts";
import DeliveryChallan from "./pages/Delivery_Challan";
import DeliveryChallanForm from "./pages/CreateDeliveryChallan";
// import { StatusBadge } from "./components/StatusBadge";
// import { SummaryCards } from "./pages/components/SummaryCards";
import OutstandingDashboard from "./pages/OutstandingDashboard";
import CustomerPayments from "./pages/CustomerPayments";
import WorkOrderForm from "./pages/WorkOrderForm";
import WorkOrderList from "./pages/WorkOrder";
import Workstation from "./pages/Workstation";
import NewWorkstation from "./pages/NewWorkstation";
import OperationListing from "./pages/Setup/OperationListing";
import OperationQuickAdd from "./pages/Setup/OperationQuickAdd";
import LeadManagement from "./pages/LeadManagement";
import LeadForm from "./pages/LeadForm";
import StockentryForm2 from "./pages/StockentryForm2";
import PurchaseOrderForm from "./pages/PurchaseOrderForm";
import SalesDashboard from "./pages/DashboardPages/SalesDashboard";
import PurchasingDashboard from "./pages/DashboardPages/PurchasingDashboard";
import AccountingDashboard from "./pages/DashboardPages/AccountingDashboard";
import SetupDashboard from "./pages/DashboardPages/SetupDashboard";
import OrganizationDashboard from "./pages/DashboardPages/OrganizationDashboard";
import ToolsDashboard from "./pages/DashboardPages/ToolsDashboard";
import ReportsDashboard from "./pages/DashboardPages/ReportsDashboard";
import StockDashboard from "./pages/DashboardPages/StockDashboard";
import QualityDashboard from "./pages/DashboardPages/QualityDashboard";
import GRNForm from "./pages/GRNForm";
import GRNList from "./pages/GRNList";
import PurchaseInvoiceForm from "./pages/PurchaseBillForm";
import UserManagement from "./pages/UserManagement/UserManagement";
import Employee from "./pages/Setup/Employee";
import EmployeeForm from "./pages/Setup/EmployeeForm";
// import Stock from "./pages/Stock";

import UserForm from "./pages/UserManagement/UserForm";
import UserCreate from "./pages/Setup/UserCreate";
import UserRoles from "./pages/Setup/UserRoles";
import RoleForm from "./pages/UserManagement/RoleForm";
import RoleList from "./pages/UserManagement/RoleList";
import ModulePermissions from "./pages/UserManagement/ModulePermissions";
import InventoryList from "./pages/InventoryList";
import QualityInspectionList from "./pages/QualityInspectionList";
import QualityInspectionForm from "./pages/QualityInspectionForm";
import ContactForm from "./pages/ContactForm";
import SubModulePermissions from "./pages/UserManagement/SubModulePermissions";
import ContactForm from "./pages/ContactForm";
import CreateSalesBill from "./pages/CreateSalesInvoice";
import BankDetailsForm from "./pages/BankDetailsForm";


function App() {
  return (
    <AdminThemeProvider>
      <ModuleProvider> {/* Move ModuleProvider here to wrap ALL routes */}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/home" element={<HomePage />} />

            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sales-order" element={<SalesOrder />} />
              <Route path="/sales-invoice" element={<SalesInvoice />} />
              <Route path="/sales-order/new" element={<CreateSalesOrder />} />
              <Route path="/sales-invoice/new" element={<CreateSalesInvoice />} />
              <Route path="/lead" element={<LeadManagement />} />
              <Route path="/leads/new" element={<LeadForm />} />
              <Route path="/leads/:id" element={<LeadForm />} />
              <Route path="/quotation" element={<QuotationPage />} />
              <Route path="/quotation/new" element={<CreateQuotationPage />} />

              <Route path="/price-list" element={<PriceList />} />
              <Route path="/item-price" element={<ItemPrice />} />
              <Route path="/pricing-rule" element={<PricingRule />} />
              <Route path="/coupon-codes" element={<CouponCode />} />
              <Route path="/supplier" element={<Supplier />} />
              <Route path="/supplier/:id" element={<AddSupplier />} />
              <Route path="/supplier/new" element={<AddSupplier />} />
              <Route path="/supplier/:id" element={<AddSupplier />} />
              <Route path="/supplier-group" element={<SupplierGroup />} />
              <Route path="/contacts" element={<Contacts />} />

<Route path="/contacts/new" element={<ContactForm />} />
<Route path="/contacts/edit/:id" element={<ContactForm />} />
<Route path="/contacts/view/:id" element={<ContactForm />} />
              <Route path="/material-request" element={<MaterialRequest />} />
              <Route path="/purchase-order" element={<PurchaseOrder />} />
              <Route path="/request-for-quotation" element={<RequestForQuotation />} />
              <Route path="/supplier-quotation" element={<SupplierQuotation />} />
              <Route path="/supplier-quotation/new" element={<NewSupplierQuotation />} />
              <Route path="/purchase-invoice" element={<PurchaseInvoice />} />
              <Route path="/purchase-invoice/new" element={<PurchaseInvoiceForm />} />
              {/* <
              /* <Route path="/sales" element={<SalesPage />} /> */}
          

              {/* Sales Bill Routes - Added /edit and /view routes */}
              <Route path="/sales-bill" element={<SalesInvoice />} />
              <Route path="/sales-bill/new" element={<CreateSalesBill />} />
              <Route path="/sales-bill/edit/:id" element={<CreateSalesBill />} />
              <Route path="/sales-bill/view/:id" element={<CreateSalesBill />} />
          



              {/* Module Dashboards */}
              <Route path="/dashboard/manufacturing" element={<DashboardPage />} />
              <Route path="/dashboard/sales" element={<SalesDashboard />} />
              <Route path="/dashboard/setup" element={<SetupDashboard />} />
              <Route path="/dashboard/purchasing" element={<PurchasingDashboard />} />
              <Route path="/dashboard/organization" element={<OrganizationDashboard />} />
              <Route path="/dashboard/accounting" element={<AccountingDashboard />} />
              <Route path="/dashboard/tools" element={<ToolsDashboard />} />
              <Route path="/dashboard/reports" element={<ReportsDashboard />} />
              <Route path="/dashboard/stock" element={<StockDashboard />} />
              <Route path="/dashboard/quality" element={<QualityDashboard />} />


              <Route path="/sales-order" element={<SalesOrder />} />
              <Route path="/sales-invoice" element={<SalesInvoice />} />
              <Route path="/sales-order/new" element={<CreateSalesOrder />} />
              <Route path="/sales-order/:id" element={<CreateSalesOrder />} />
              <Route path="/sales-invoice/new" element={<CreateSalesInvoice />} />
              <Route path="/quotation" element={<QuotationPage />} />
              <Route path="/quotation/new" element={<CreateQuotationPage />} />
              <Route path="/quotation/:id" element={<CreateQuotationPage />} />
              <Route path="/price-list" element={<PriceList />} />
              <Route path="/item-price" element={<ItemPrice />} />
              <Route path="/pricing-rule" element={<PricingRule />} />
              <Route path="/coupon-codes" element={<CouponCode />} />
              <Route path="/supplier" element={<Supplier />} />
              <Route path="/supplier/new" element={<AddSupplier />} />
              <Route path="/supplier-group" element={<SupplierGroup />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/material-request" element={<MaterialRequest />} />
              <Route path="/purchase-order" element={<PurchaseOrder />} />
              <Route path="/request-for-quotation" element={<RequestForQuotation />} />
              <Route path="/supplier-quotation" element={<SupplierQuotation />} />
              <Route path="/supplier-quotation/new" element={<NewSupplierQuotation />} />
              <Route path="/purchase-invoice" element={<PurchaseInvoice />} />
              <Route path="/purchase-invoice/new" element={<PurchaseInvoiceForm />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/ledger-accounts" element={<LedgerAccounts />} />
              <Route path="/delivery-challan" element={<DeliveryChallan />} />
              <Route path="/delivery-challan/new" element={<DeliveryChallanForm />} />
              <Route path="/outstanding-receivables" element={<OutstandingDashboard />} />
              <Route path="/customer-payments" element={<CustomerPayments />} />




              {/* <Route path="/sales" element={<SalesPage />} />
            <Route path="/purchase" element={<PurchasePage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} /> */}


              <Route path="/job-card" element={<JobCardManagement />} />
              <Route path="/job-cards/new" element={<JobCardForm />} />
              <Route path="/job-cards/:id" element={<JobCardForm />} />
              {/* Item Group Routes */}
              <Route path="/item-group" element={<ItemGroupList />} />
              <Route path="/item-group/:id" element={<ItemGroupForm />} />
              <Route path="/stock-entry" element={<Stockentry />} />
              <Route path="/stock-entry/new" element={<StockentryForm2 />} />
              <Route path="/stock-entry/:id" element={<StockentryForm2 />} />


              {/* <Route path="/new" element={<Stock />} /> */}



              {/* Inventory Routes */}
              <Route path="/InventoryList" element={<InventoryList />} />

              {/* Inventory Routes */}





              {/* Item Routes */}
              <Route path="/item-list" element={<Itemlist />} />
              <Route path="/item/:id" element={<ItemForm />} />
              <Route path="/item-attribute" element={<ItemAttributeList />} />
              <Route path="/item-attribute/new" element={<ItemAttributeForm />} />
              <Route path="/item-attribute/:id" element={<ItemAttributeForm />} />


              {/* Purchase Order Routes */}
              <Route path="/purchase-order" element={<PurchaseOrder />} />
              <Route path="/purchase-order/new" element={<PurchaseOrderForm />} />
              <Route path="/purchase-order/edit/:id" element={<PurchaseOrderForm />} />
              <Route path="/purchase-order/view/:id" element={<PurchaseOrderForm />} />

              {/* Organization Routes */}
              <Route path="/company" element={<CompanyList />} />
              <Route path="/company/new" element={<AddCompanyForm />} />
              <Route path="/company/:id" element={<AddCompanyForm />} />
              <Route path="/letter-head" element={<LetterHeadList />} />
              <Route path="/letter-head/new" element={<AddLetterHeadForm />} />
              <Route path="/letter-head/:id" element={<AddLetterHeadForm />} />
              <Route path="/module/:moduleId/submodules" element={<SubModulePermissions />} />

              {/* GRN Routes */}
              <Route path="/grn" element={<GRNList />} />
              <Route path="/grn/new" element={<GRNForm />} />
              <Route path="/grn/:id" element={<GRNForm />} />

              {/* Warehouse Routes */}
              <Route path="/warehouse" element={<WarehouseList />} />
              <Route path="/warehouse/new" element={<WarehouseForm />} />
              <Route path="/warehouse/:id" element={<WarehouseForm />} />

              // In your router configuration
              <Route path="/work-order" element={<WorkOrderList />} />
              <Route path="/work-order/new" element={<WorkOrderForm />} />
              <Route path="/work-order/:id" element={<WorkOrderForm />} />

              {/* Brand Routes */}
              <Route path="/brand" element={<BrandList />} />
              <Route path="/brand/new" element={<BrandForm />} />
              <Route path="/brand/:id" element={<BrandForm />} />


              {/* NewWorkstation Routes */}
              <Route path="/NewWorkstation" element={<NewWorkstation />} />

              {/* Employee Routes */}

              <Route path="/employee" element={<Employee />} />
              <Route path="/employee/new" element={<EmployeeForm />} />
              {/* User Management Routes */}
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id" element={<UserForm />} />
              // Add routes
              {/* <Route path="/modules" element={<ModuleList />} />
              <Route path="/module/:moduleId/submodules" element={<SubModulePermissions />} /> */}

              <Route path="/employee/:id" element={<EmployeeForm />} />

              <Route path="/employee/:id" element={<EmployeeForm />} />

              {/* operation Routes */}


// In your router configuration:
              <Route path="/operations" element={<OperationListing />} />
              <Route path="/operation/new" element={<OperationQuickAdd />} />
              <Route path="/operation/:id" element={<OperationQuickAdd />} />
              <Route path="/operation/:id/edit" element={<OperationQuickAdd />} />


              <Route path="/purchase-invoice" element={<PurchaseInvoice />} />
              <Route path="/purchase-invoice/new" element={<PurchaseInvoiceForm />} />
              <Route path="/purchase-invoice/edit/:id" element={<PurchaseInvoiceForm />} />


              {/* User Management Routes */}
              <Route path="/user-management" element={<UserManagement />} />
              <Route path="/user/create" element={<UserCreate />} />
              <Route path="/user/roles/:id" element={<UserRoles />} />

              <Route path="/role" element={<RoleList />} />
              <Route path="/role/new" element={<RoleForm />} />
              <Route path="/role/:id" element={<RoleForm />} />
              <Route path="/role/permissions/:roleId" element={<ModulePermissions />} />

              {/* UOM Routes */}
              <Route path="/uom" element={<UOMList />} />
              <Route path="/uom/new" element={<UOMForm />} />
              <Route path="/uom/:id" element={<UOMForm />} />

              {/* Quality Inspection */}
              <Route path="/quality-inspection" element={<QualityInspectionList />} />
              <Route path="/quality-inspection/new" element={<QualityInspectionForm />} />

              <Route path="/bank-details" element={<BankDetailsForm />} />
              <Route path="/bom" element={<BOMPage />} />
              <Route path="/bom/new" element={<NewBOMPage />} />
              <Route path="/Workstation" element={<Workstation />} />

              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ModuleProvider>
    </AdminThemeProvider>
  );
}

export default App;
