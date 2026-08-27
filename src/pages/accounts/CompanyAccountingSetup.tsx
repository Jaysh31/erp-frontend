import React, { useState } from 'react';

// ---------- TYPES (same as before) ----------
type Step = 1 | 2 | 3 | 4 | 5;

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  openingBalance: number;
}

interface CostCenter {
  id: string;
  name: string;
  description: string;
}

interface TaxMaster {
  id: string;
  name: string;
  rate: number;
  type: 'GST' | 'VAT' | 'CST' | 'Other';
}

interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' | 'Inventory';
  openingBalance: number;
  group?: string;
}

interface OpeningBalanceEntry {
  category: 'Cash' | 'Bank' | 'Inventory' | 'Customers' | 'Suppliers' | 'Assets' | 'Loans';
  accounts: { name: string; amount: number }[];
}

interface FormData {
  companyName: string;
  gstin: string;
  pan: string;
  cin: string;
  currency: string;
  financialYearStart: string;
  financialYearEnd: string;
  address: string;
  state: string;
  country: string;
  chartOfAccounts: ChartAccount[];
  bankAccounts: BankAccount[];
  costCenters: CostCenter[];
  taxMasters: TaxMaster[];
  paymentTerms: string[];
  currencies: string[];
  openingBalances: OpeningBalanceEntry[];
  manufacturing: {
    rawMaterialAccount: string;
    wipAccount: string;
    finishedGoodsAccount: string;
    productionCostCenter: string;
    defaultGST: string;
    inventoryValuation: 'FIFO' | 'LIFO' | 'Weighted Average';
    costingMethod: 'Standard' | 'Actual';
  };
}

// ---------- DEFAULT DATA (unchanged) ----------
const defaultChartAccounts: ChartAccount[] = [
  { id: '1', code: '101', name: 'Raw Materials', type: 'Inventory', openingBalance: 0, group: 'Inventory' },
  { id: '2', code: '102', name: 'Work in Progress', type: 'Inventory', openingBalance: 0, group: 'Inventory' },
  { id: '3', code: '103', name: 'Finished Goods', type: 'Inventory', openingBalance: 0, group: 'Inventory' },
  { id: '4', code: '201', name: 'Cash', type: 'Asset', openingBalance: 0, group: 'Current Assets' },
  { id: '5', code: '202', name: 'Bank Account', type: 'Asset', openingBalance: 0, group: 'Current Assets' },
  { id: '6', code: '203', name: 'Accounts Receivable', type: 'Asset', openingBalance: 0, group: 'Current Assets' },
  { id: '7', code: '301', name: 'Accounts Payable', type: 'Liability', openingBalance: 0, group: 'Current Liabilities' },
  { id: '8', code: '401', name: 'Capital', type: 'Equity', openingBalance: 0, group: 'Equity' },
  { id: '9', code: '501', name: 'Sales Revenue', type: 'Revenue', openingBalance: 0, group: 'Revenue' },
  { id: '10', code: '601', name: 'Cost of Goods Sold', type: 'Expense', openingBalance: 0, group: 'Expenses' },
];

const defaultBankAccounts: BankAccount[] = [
  { id: 'b1', name: 'Current Account', accountNumber: '1234567890', bankName: 'HDFC Bank', openingBalance: 0 },
];

const defaultCostCenters: CostCenter[] = [
  { id: 'c1', name: 'Production', description: 'Manufacturing unit' },
  { id: 'c2', name: 'Administration', description: 'Admin & HR' },
];

const defaultTaxMasters: TaxMaster[] = [
  { id: 't1', name: 'GST 18%', rate: 18, type: 'GST' },
  { id: 't2', name: 'VAT 5%', rate: 5, type: 'VAT' },
];

const defaultOpeningBalances: OpeningBalanceEntry[] = [
  { category: 'Cash', accounts: [{ name: 'Cash in Hand', amount: 0 }] },
  { category: 'Bank', accounts: [{ name: 'HDFC Current', amount: 0 }] },
  { category: 'Inventory', accounts: [{ name: 'Raw Materials', amount: 0 }, { name: 'WIP', amount: 0 }, { name: 'Finished Goods', amount: 0 }] },
  { category: 'Customers', accounts: [{ name: 'Customer A', amount: 0 }] },
  { category: 'Suppliers', accounts: [{ name: 'Supplier X', amount: 0 }] },
  { category: 'Assets', accounts: [{ name: 'Machinery', amount: 0 }] },
  { category: 'Loans', accounts: [{ name: 'Bank Loan', amount: 0 }] },
];

const defaultManufacturing = {
  rawMaterialAccount: 'Raw Materials',
  wipAccount: 'Work in Progress',
  finishedGoodsAccount: 'Finished Goods',
  productionCostCenter: 'Production',
  defaultGST: 'GST 18%',
  inventoryValuation: 'FIFO' as const,
  costingMethod: 'Standard' as const,
};

// ---------- MAIN COMPONENT ----------
const AccountingSetupWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    companyName: 'ABC Manufacturing Pvt Ltd',
    gstin: '22AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    cin: 'U12345MH2026PTC123456',
    currency: 'INR',
    financialYearStart: '2026-04-01',
    financialYearEnd: '2027-03-31',
    address: '123 Industrial Estate, City, State - 123456',
    state: 'Maharashtra',
    country: 'India',
    chartOfAccounts: defaultChartAccounts,
    bankAccounts: defaultBankAccounts,
    costCenters: defaultCostCenters,
    taxMasters: defaultTaxMasters,
    paymentTerms: ['Net 30', 'Net 60'],
    currencies: ['INR', 'USD'],
    openingBalances: defaultOpeningBalances,
    manufacturing: defaultManufacturing,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState<{ category: string; index: number } | null>(null);

  // ---------- HANDLERS ----------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const nextStep = () => { if (currentStep < 5) setCurrentStep((s) => (s + 1) as Step); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep((s) => (s - 1) as Step); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Setup Data:', formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  // Helper: get grouped accounts
  const groupedAccounts = formData.chartOfAccounts.reduce((acc, account) => {
    const group = account.group || 'Other';
    if (!acc[group]) acc[group] = [];
    acc[group].push(account);
    return acc;
  }, {} as Record<string, ChartAccount[]>);

  const totalOpeningBalance = formData.chartOfAccounts.reduce((sum, acc) => sum + acc.openingBalance, 0);
 
  // ---------- RENDER STEP CONTENT (unchanged) ----------
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="step-content">
            <h2>Company Information</h2>
            <div className="field-group">
              <div className="field">
                <label>Company Name</label>
                <input name="companyName" value={formData.companyName} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>GSTIN</label>
                <input name="gstin" value={formData.gstin} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>PAN</label>
                <input name="pan" value={formData.pan} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>CIN</label>
                <input name="cin" value={formData.cin} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleInputChange}>
                  <option>INR</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </div>
              <div className="field">
                <label>Financial Year Start</label>
                <input type="date" name="financialYearStart" value={formData.financialYearStart} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>Financial Year End</label>
                <input type="date" name="financialYearEnd" value={formData.financialYearEnd} onChange={handleInputChange} />
              </div>
              <div className="field full">
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} />
              </div>
              <div className="field">
                <label>State</label>
                <input name="state" value={formData.state} onChange={handleInputChange} />
              </div>
              <div className="field">
                <label>Country</label>
                <input name="country" value={formData.country} onChange={handleInputChange} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <h2>Chart of Accounts</h2>
            <div className="account-groups">
              {Object.entries(groupedAccounts).map(([group, accounts]) => (
                <details key={group} open>
                  <summary>{group} <span className="count">{accounts.length}</span></summary>
                  <table className="table-accounts">
                    <thead>
                      <tr><th>Code</th><th>Name</th><th>Type</th><th>Opening Balance</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {accounts.map((acc) => (
                        <tr key={acc.id}>
                          <td><input value={acc.code} onChange={(e) => updateAccount(acc.id, 'code', e.target.value)} /></td>
                          <td><input value={acc.name} onChange={(e) => updateAccount(acc.id, 'name', e.target.value)} /></td>
                          <td>
                            <select value={acc.type} onChange={(e) => updateAccount(acc.id, 'type', e.target.value as ChartAccount['type'])}>
                              <option>Asset</option><option>Liability</option><option>Equity</option><option>Revenue</option><option>Expense</option><option>Inventory</option>
                            </select>
                          </td>
                          <td><input type="number" step="0.01" value={acc.openingBalance} onChange={(e) => updateAccount(acc.id, 'openingBalance', parseFloat(e.target.value) || 0)} /></td>
                          <td><button className="btn-remove" onClick={() => removeAccount(acc.id)}><i className="fas fa-trash"></i></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              ))}
            </div>
            <div className="actions">
              <button className="btn-add" onClick={addAccount}><i className="fas fa-plus"></i> Add Ledger</button>
              <button className="btn-add" onClick={() => alert('Import from CSV')}><i className="fas fa-upload"></i> Import Chart</button>
              <button className="btn-add" onClick={resetAccounts}><i className="fas fa-undo"></i> Reset Default</button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="step-content">
            <h2>Banking & Tax</h2>
            <div className="sub-section">
              <h3><i className="fas fa-university"></i> Bank Accounts</h3>
              <table className="table-bank">
                <thead><tr><th>Name</th><th>Account Number</th><th>Bank Name</th><th>Opening Balance</th><th>Action</th></tr></thead>
                <tbody>
                  {formData.bankAccounts.map((bank) => (
                    <tr key={bank.id}>
                      <td><input value={bank.name} onChange={(e) => updateBank(bank.id, 'name', e.target.value)} /></td>
                      <td><input value={bank.accountNumber} onChange={(e) => updateBank(bank.id, 'accountNumber', e.target.value)} /></td>
                      <td><input value={bank.bankName} onChange={(e) => updateBank(bank.id, 'bankName', e.target.value)} /></td>
                      <td><input type="number" step="0.01" value={bank.openingBalance} onChange={(e) => updateBank(bank.id, 'openingBalance', parseFloat(e.target.value) || 0)} /></td>
                      <td><button className="btn-remove" onClick={() => removeBank(bank.id)}><i className="fas fa-trash"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn-add" onClick={addBank}><i className="fas fa-plus"></i> Add Bank</button>
            </div>
            <div className="sub-section">
              <h3><i className="fas fa-percent"></i> Tax Masters</h3>
              <table className="table-tax">
                <thead><tr><th>Name</th><th>Rate (%)</th><th>Type</th><th>Action</th></tr></thead>
                <tbody>
                  {formData.taxMasters.map((tax) => (
                    <tr key={tax.id}>
                      <td><input value={tax.name} onChange={(e) => updateTax(tax.id, 'name', e.target.value)} /></td>
                      <td><input type="number" step="0.01" value={tax.rate} onChange={(e) => updateTax(tax.id, 'rate', parseFloat(e.target.value) || 0)} /></td>
                      <td>
                        <select value={tax.type} onChange={(e) => updateTax(tax.id, 'type', e.target.value as TaxMaster['type'])}>
                          <option>GST</option><option>VAT</option><option>CST</option><option>Other</option>
                        </select>
                      </td>
                      <td><button className="btn-remove" onClick={() => removeTax(tax.id)}><i className="fas fa-trash"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn-add" onClick={addTax}><i className="fas fa-plus"></i> Add Tax</button>
            </div>
            <div className="sub-section">
              <h3><i className="fas fa-layer-group"></i> Cost Centers</h3>
              <table className="table-cost">
                <thead><tr><th>Name</th><th>Description</th><th>Action</th></tr></thead>
                <tbody>
                  {formData.costCenters.map((cc) => (
                    <tr key={cc.id}>
                      <td><input value={cc.name} onChange={(e) => updateCostCenter(cc.id, 'name', e.target.value)} /></td>
                      <td><input value={cc.description} onChange={(e) => updateCostCenter(cc.id, 'description', e.target.value)} /></td>
                      <td><button className="btn-remove" onClick={() => removeCostCenter(cc.id)}><i className="fas fa-trash"></i></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn-add" onClick={addCostCenter}><i className="fas fa-plus"></i> Add Cost Center</button>
            </div>
            <div className="sub-section">
              <h3><i className="fas fa-file-invoice"></i> Payment Terms & Currencies</h3>
              <div className="inline-group">
                <label>Payment Terms (comma separated)</label>
                <input value={formData.paymentTerms.join(', ')} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value.split(',').map(s => s.trim()) })} />
              </div>
              <div className="inline-group">
                <label>Currencies (comma separated)</label>
                <input value={formData.currencies.join(', ')} onChange={(e) => setFormData({ ...formData, currencies: e.target.value.split(',').map(s => s.trim()) })} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="step-content">
            <h2>Opening Balances</h2>
            <div className="ob-cards">
              {formData.openingBalances.map((entry, idx) => (
                <div key={entry.category} className="ob-card" onClick={() => setDialogOpen({ category: entry.category, index: idx })}>
                  <div className="ob-icon"><i className={`fas fa-${getCategoryIcon(entry.category)}`}></i></div>
                  <div className="ob-info">
                    <span className="ob-category">{entry.category}</span>
                    <span className="ob-total">{entry.accounts.reduce((sum, a) => sum + a.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            {isDialogOpen && (
              <div className="dialog-overlay" onClick={() => setDialogOpen(null)}>
                <div className="dialog" onClick={(e) => e.stopPropagation()}>
                  <h3>{isDialogOpen.category} Opening Balance</h3>
                  {formData.openingBalances[isDialogOpen.index].accounts.map((acc, i) => (
                    <div key={i} className="dialog-field">
                      <label>{acc.name}</label>
                      <input type="number" step="0.01" value={acc.amount} onChange={(e) => {
                        const newAmount = parseFloat(e.target.value) || 0;
                        const updated = [...formData.openingBalances];
                        updated[isDialogOpen.index].accounts[i].amount = newAmount;
                        setFormData({ ...formData, openingBalances: updated });
                      }} />
                    </div>
                  ))}
                  <button className="btn-close-dialog" onClick={() => setDialogOpen(null)}>Done</button>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="step-content">
            <h2>Review & Finish</h2>
            <div className="review-grid">
              <div className="review-item"><strong>Company:</strong> {formData.companyName}</div>
              <div className="review-item"><strong>GSTIN:</strong> {formData.gstin}</div>
              <div className="review-item"><strong>FY:</strong> {formData.financialYearStart} – {formData.financialYearEnd}</div>
              <div className="review-item"><strong>Ledgers:</strong> {formData.chartOfAccounts.length}</div>
              <div className="review-item"><strong>Banks:</strong> {formData.bankAccounts.length}</div>
              <div className="review-item"><strong>Taxes:</strong> {formData.taxMasters.length}</div>
              <div className="review-item"><strong>Total Opening Balance:</strong> {totalOpeningBalance.toFixed(2)}</div>
            </div>
            <div className="manufacturing-config">
              <h3>⚙️ Manufacturing Configuration</h3>
              <div className="config-grid">
                <div><span>Raw Material Account:</span> {formData.manufacturing.rawMaterialAccount}</div>
                <div><span>WIP Account:</span> {formData.manufacturing.wipAccount}</div>
                <div><span>Finished Goods Account:</span> {formData.manufacturing.finishedGoodsAccount}</div>
                <div><span>Production Cost Center:</span> {formData.manufacturing.productionCostCenter}</div>
                <div><span>Default GST:</span> {formData.manufacturing.defaultGST}</div>
                <div><span>Inventory Valuation:</span> {formData.manufacturing.inventoryValuation}</div>
                <div><span>Costing Method:</span> {formData.manufacturing.costingMethod}</div>
              </div>
            </div>
            <button className="btn-submit" onClick={handleSubmit}><i className="fas fa-check-circle"></i> Complete Setup</button>
            {showSuccess && <div className="success-banner"><i className="fas fa-check-circle"></i> Setup saved successfully!</div>}
          </div>
        );

      default:
        return null;
    }
  };

  // ---------- HELPER FUNCTIONS (unchanged) ----------
  const updateAccount = (id: string, field: keyof ChartAccount, value: any) => {
    setFormData(prev => ({
      ...prev,
      chartOfAccounts: prev.chartOfAccounts.map(acc => acc.id === id ? { ...acc, [field]: value } : acc)
    }));
  };
  const removeAccount = (id: string) => {
    setFormData(prev => ({ ...prev, chartOfAccounts: prev.chartOfAccounts.filter(acc => acc.id !== id) }));
  };
  const addAccount = () => {
    const newId = (Math.max(...formData.chartOfAccounts.map(a => parseInt(a.id)), 0) + 1).toString();
    setFormData(prev => ({
      ...prev,
      chartOfAccounts: [...prev.chartOfAccounts, { id: newId, code: '', name: '', type: 'Asset', openingBalance: 0, group: 'Other' }]
    }));
  };
  const resetAccounts = () => {
    setFormData(prev => ({ ...prev, chartOfAccounts: defaultChartAccounts }));
  };

  const updateBank = (id: string, field: keyof BankAccount, value: any) => {
    setFormData(prev => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };
  const removeBank = (id: string) => {
    setFormData(prev => ({ ...prev, bankAccounts: prev.bankAccounts.filter(b => b.id !== id) }));
  };
  const addBank = () => {
    const newId = 'b' + (formData.bankAccounts.length + 1);
    setFormData(prev => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, { id: newId, name: '', accountNumber: '', bankName: '', openingBalance: 0 }]
    }));
  };

  const updateTax = (id: string, field: keyof TaxMaster, value: any) => {
    setFormData(prev => ({
      ...prev,
      taxMasters: prev.taxMasters.map(t => t.id === id ? { ...t, [field]: value } : t)
    }));
  };
  const removeTax = (id: string) => {
    setFormData(prev => ({ ...prev, taxMasters: prev.taxMasters.filter(t => t.id !== id) }));
  };
  const addTax = () => {
    const newId = 't' + (formData.taxMasters.length + 1);
    setFormData(prev => ({
      ...prev,
      taxMasters: [...prev.taxMasters, { id: newId, name: '', rate: 0, type: 'GST' }]
    }));
  };

  const updateCostCenter = (id: string, field: keyof CostCenter, value: any) => {
    setFormData(prev => ({
      ...prev,
      costCenters: prev.costCenters.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };
  const removeCostCenter = (id: string) => {
    setFormData(prev => ({ ...prev, costCenters: prev.costCenters.filter(c => c.id !== id) }));
  };
  const addCostCenter = () => {
    const newId = 'c' + (formData.costCenters.length + 1);
    setFormData(prev => ({
      ...prev,
      costCenters: [...prev.costCenters, { id: newId, name: '', description: '' }]
    }));
  };

  const getCategoryIcon = (cat: string) => {
    const map: Record<string, string> = {
      Cash: 'coins',
      Bank: 'university',
      Inventory: 'box',
      Customers: 'users',
      Suppliers: 'truck',
      Assets: 'building',
      Loans: 'hand-holding-usd',
    };
    return map[cat] || 'circle';
  };

  // ---------- RENDER ----------
  return (
    <div className="wizard-container">
      {/* Header */}
      <div className="wizard-header">
        <div className="brand">
          <i className="fas fa-cubes"></i>
          <div><h1>Accounting Setup</h1><span>Manufacturing ERP Wizard</span></div>
        </div>
        <div className="header-status">
          <i className="fas fa-circle-check"></i> Step {currentStep} of 5
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        {[1, 2, 3, 4, 5].map(step => (
          <div key={step} className={`step ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
            <div className="step-circle">{currentStep > step ? <i className="fas fa-check"></i> : step}</div>
            <div className="step-label">
              {step === 1 && 'Company'}
              {step === 2 && 'Accounts'}
              {step === 3 && 'Banking'}
              {step === 4 && 'Balances'}
              {step === 5 && 'Review'}
            </div>
            {step < 5 && <div className="step-line"></div>}
          </div>
        ))}
      </div>

      {/* Main Content – Full width, no sidebar */}
      <div className="wizard-body">
        <div className="main-panel">
          <form onSubmit={(e) => e.preventDefault()}>
            {renderStepContent()}
          </form>
          {/* Navigation */}
          <div className="nav-buttons">
            <button className="btn-outline" onClick={() => alert('Discard changes?')}>Cancel</button>
            <button className="btn-outline" onClick={prevStep} disabled={currentStep === 1}>Previous</button>
            <button className="btn-outline" onClick={() => alert('Draft saved')}>Save Draft</button>
            {currentStep < 5 ? (
              <button className="btn-primary" onClick={nextStep}>Next →</button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit}>Complete</button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* ---------- GLOBAL STYLES ---------- */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Roboto, sans-serif; background: #f0f4f9; padding: 24px; }
        .wizard-container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 32px; box-shadow: 0 20px 60px rgba(0,0,0,0.06); overflow: hidden; }
        .wizard-header { background: linear-gradient(135deg, #0b2a44, #1c4e7a); padding: 24px 36px; display: flex; justify-content: space-between; align-items: center; color: white; flex-wrap: wrap; gap: 12px; }
        .brand { display: flex; align-items: center; gap: 14px; }
        .brand i { font-size: 32px; color: #7fc9f0; }
        .brand h1 { font-size: 24px; font-weight: 600; margin:0; }
        .brand span { font-size: 14px; opacity: 0.7; display: block; }
        .header-status { background: rgba(255,255,255,0.12); padding: 6px 18px; border-radius: 40px; font-size: 14px; display: flex; align-items: center; gap: 8px; }

        /* Stepper */
        .stepper { display: flex; align-items: center; justify-content: space-between; padding: 24px 36px 16px; background: #fafcff; border-bottom: 1px solid #eef2f6; }
        .step { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #94a3b8; position: relative; flex: 1; }
        .step .step-circle { width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #1e293b; transition: 0.2s; }
        .step.active .step-circle { background: #1c4e7a; color: white; }
        .step.completed .step-circle { background: #15803d; color: white; }
        .step .step-label { font-weight: 500; white-space: nowrap; }
        .step-line { flex: 1; height: 2px; background: #e2e8f0; margin: 0 8px; }
        .step.active .step-line, .step.completed .step-line { background: #1c4e7a; }

        /* Body – full width, no sidebar */
        .wizard-body { padding: 32px 36px 40px; background: #f8fafc; }
        .main-panel { background: white; border-radius: 20px; padding: 28px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }

        /* Step Content */
        .step-content { }
        .step-content h2 { font-size: 22px; font-weight: 600; color: #0b2a44; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }
        .field-group { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 24px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field.full { grid-column: 1 / -1; }
        .field label { font-size: 13px; font-weight: 500; color: #334155; }
        .field input, .field textarea, .field select { padding: 8px 12px; border: 1px solid #d1d9e6; border-radius: 8px; font-size: 14px; background: #fafcff; transition: 0.15s; }
        .field input:focus, .field textarea:focus, .field select:focus { border-color: #1c4e7a; outline: none; box-shadow: 0 0 0 3px rgba(28,78,122,0.1); }

        /* Accounts groups */
        .account-groups details { margin-bottom: 12px; border: 1px solid #eef2f6; border-radius: 10px; padding: 8px 12px; background: #fafcff; }
        .account-groups summary { font-weight: 600; cursor: pointer; padding: 6px 0; color: #0b2a44; }
        .account-groups summary .count { background: #e2e8f0; padding: 2px 10px; border-radius: 20px; font-size: 12px; margin-left: 10px; }
        .table-accounts { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 8px; }
        .table-accounts th { text-align: left; padding: 6px 4px; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .table-accounts td { padding: 4px 2px; vertical-align: middle; }
        .table-accounts input, .table-accounts select { width: 100%; padding: 4px 6px; border: 1px solid #d1d9e6; border-radius: 6px; background: white; font-size: 13px; }
        .btn-remove { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 2px 6px; border-radius: 4px; }
        .btn-remove:hover { color: #b91c1c; background: #fee2e2; }
        .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
        .btn-add { background: #f1f5f9; border: 1px dashed #94a3b8; padding: 6px 16px; border-radius: 8px; cursor: pointer; font-weight: 500; color: #1e293b; transition: 0.15s; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
        .btn-add:hover { background: #e2e8f0; }

        /* Banking & Tax tables */
        .sub-section { margin-top: 24px; border-top: 1px solid #eef2f6; padding-top: 20px; }
        .sub-section h3 { font-size: 16px; font-weight: 600; color: #0b2a44; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .table-bank, .table-tax, .table-cost { width: 100%; border-collapse: collapse; font-size: 13px; }
        .table-bank th, .table-tax th, .table-cost th { text-align: left; padding: 6px 4px; color: #475569; border-bottom: 1px solid #e2e8f0; }
        .table-bank td, .table-tax td, .table-cost td { padding: 4px 2px; vertical-align: middle; }
        .table-bank input, .table-tax input, .table-cost input { width: 100%; padding: 4px 6px; border: 1px solid #d1d9e6; border-radius: 6px; background: white; font-size: 13px; }
        .inline-group { display: flex; gap: 12px; align-items: center; margin: 6px 0; }
        .inline-group label { font-weight: 500; min-width: 140px; }
        .inline-group input { flex: 1; padding: 6px 12px; border: 1px solid #d1d9e6; border-radius: 6px; }

        /* Opening Balance Cards */
        .ob-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }
        .ob-card { background: #fafcff; border: 1px solid #eef2f6; border-radius: 12px; padding: 16px; cursor: pointer; transition: 0.15s; display: flex; align-items: center; gap: 14px; }
        .ob-card:hover { border-color: #1c4e7a; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .ob-icon { font-size: 28px; color: #1c4e7a; width: 40px; text-align: center; }
        .ob-info { display: flex; flex-direction: column; }
        .ob-category { font-weight: 600; font-size: 14px; color: #0b2a44; }
        .ob-total { font-size: 16px; font-weight: 700; color: #1c4e7a; }
        .dialog-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .dialog { background: white; border-radius: 20px; padding: 32px; min-width: 400px; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
        .dialog h3 { margin-bottom: 20px; }
        .dialog-field { display: flex; align-items: center; gap: 16px; margin: 8px 0; }
        .dialog-field label { min-width: 120px; font-weight: 500; }
        .dialog-field input { flex: 1; padding: 6px 12px; border: 1px solid #d1d9e6; border-radius: 6px; }
        .btn-close-dialog { margin-top: 16px; background: #1c4e7a; color: white; border: none; padding: 8px 24px; border-radius: 8px; cursor: pointer; }

        /* Review */
        .review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 16px; border-radius: 12px; }
        .review-item { font-size: 14px; }
        .manufacturing-config { margin-top: 24px; background: #f1f9f0; padding: 16px 20px; border-radius: 12px; border-left: 4px solid #15803d; }
        .manufacturing-config h3 { margin-bottom: 12px; color: #0b2a44; }
        .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 20px; font-size: 14px; }
        .config-grid span { font-weight: 500; color: #475569; }

        .btn-submit { background: #0b2a44; color: white; border: none; padding: 12px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; cursor: pointer; transition: 0.2s; margin-top: 20px; display: inline-flex; align-items: center; gap: 10px; }
        .btn-submit:hover { background: #1c4e7a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(11,42,68,0.2); }
        .success-banner { margin-top: 16px; background: #dcfce7; color: #166534; padding: 12px 20px; border-radius: 10px; display: flex; align-items: center; gap: 10px; border: 1px solid #bbf7d0; }

        /* Navigation */
        .nav-buttons { display: flex; gap: 12px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #eef2f6; flex-wrap: wrap; align-items: center; }
        .btn-outline { background: transparent; border: 1px solid #d1d9e6; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-weight: 500; color: #1e293b; transition: 0.15s; }
        .btn-outline:hover { background: #f1f5f9; }
        .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary { background: #1c4e7a; border: none; color: white; padding: 8px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.15s; margin-left: auto; }
        .btn-primary:hover { background: #0b2a44; }

        /* Responsive */
        @media (max-width: 640px) {
          .field-group { grid-template-columns: 1fr; }
          .step-label { display: none; }
          .stepper { gap: 0; }
          .wizard-header { flex-direction: column; align-items: flex-start; }
          .nav-buttons { flex-wrap: wrap; }
          .btn-primary { margin-left: 0; }
          .ob-cards { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default AccountingSetupWizard;