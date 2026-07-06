import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminThemeProvider } from './admin-theme/AdminThemeContext';
import { ModuleProvider } from './context/ModuleContext'; // Import ModuleProvider

import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/DashboardPage";
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
import StockentryForm from "./pages/StockentryForm";


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
import NewPurchaseInvoice from "./pages/NewPurchaseInvoice";
import WorkOrderForm from "./pages/WorkOrderForm";
import WorkOrderList from "./pages/WorkOrder";
import Workstation from "./pages/Workstation";
import NewWorkstation from "./pages/NewWorkstation";
import OperationListing from "./pages/Setup/OperationListing";
import OperationQuickAdd from "./pages/Setup/OperationQuickAdd";
import LeadManagement from "./pages/LeadManagement";
import LeadForm from "./pages/LeadForm";


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
              <Route path="/supplier/new" element={<AddSupplier />} />
              <Route path="/supplier-group" element={<SupplierGroup />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/material-request" element={<MaterialRequest />} />
              <Route path="/purchase-order" element={<PurchaseOrder />} />
              <Route path="/request-for-quotation" element={<RequestForQuotation />} />
              <Route path="/supplier-quotation" element={<SupplierQuotation />} />
              <Route path="/supplier-quotation/new" element={<NewSupplierQuotation />} />
              <Route path="/purchase-invoice" element={<PurchaseInvoice />} />
              <Route path="/purchase-invoice/new" element={<NewPurchaseInvoice />} />
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
              <Route path="/stock-entry/new" element={<StockentryForm />} />
              <Route path="/stock-entry/:id" element={<StockentryForm />} />
              {/* Item Routes */}
              <Route path="/item-list" element={<Itemlist />} />
              <Route path="/item/:id" element={<ItemForm />} />
              <Route path="/item-attribute" element={<ItemAttributeList />} />
              <Route path="/item-attribute/new" element={<ItemAttributeForm />} />
              <Route path="/item-attribute/:id" element={<ItemAttributeForm />} />

              {/* Organization Routes */}
              <Route path="/company" element={<CompanyList />} />
              <Route path="/company/new" element={<AddCompanyForm />} />
              <Route path="/company/:id" element={<AddCompanyForm />} />
              <Route path="/letter-head" element={<LetterHeadList />} />
              <Route path="/letter-head/new" element={<AddLetterHeadForm />} />
              <Route path="/letter-head/:id" element={<AddLetterHeadForm />} />

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



              {/* operation Routes */}


// In your router configuration:
              <Route path="/operations" element={<OperationListing />} />
              <Route path="/operation/new" element={<OperationQuickAdd />} />
              <Route path="/operation/:id" element={<OperationQuickAdd />} />
              <Route path="/operation/:id/edit" element={<OperationQuickAdd />} />


              {/* UOM Routes */}
              <Route path="/uom" element={<UOMList />} />
              <Route path="/uom/new" element={<UOMForm />} />
              <Route path="/uom/:id" element={<UOMForm />} />

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