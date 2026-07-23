import React, { useState, useMemo, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Save,
    Send,
    CheckCircle,
    CreditCard,
    Printer,
    Download,
    Search,
    ChevronDown,
   
    Edit,
    Eye,
    FileText,
    Package,
    Truck,
    Calendar,
    Building,
    User,
    Mail,
    Phone,
    MapPin,
    Hash,
    Tag,
    DollarSign,
    
    Receipt,
    AlertCircle,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type BillStatus = 'draft' | 'submitted' | 'approved' | 'paid' | 'partial';

type TaxType = 'cgst' | 'sgst' | 'igst' | 'vat' | 'none';

interface LineItem {
    id: string;
    itemCode: string;
    description: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    taxableAmount: number;
    taxRate: number;
    taxType: TaxType;
    taxAmount: number;
    totalAmount: number;
}

interface Supplier {
    id: string;
    name: string;
    gstin: string;
    pan: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    email: string;
    phone: string;
    contactPerson: string;
}

interface PurchaseOrder {
    id: string;
    poNumber: string;
    date: string;
    totalAmount: number;
}

interface SupplierBill {
    id: string;
    billNumber: string;
    billDate: string;
    dueDate: string;
    supplier: Supplier;
    purchaseOrder: PurchaseOrder | null;
    lineItems: LineItem[];
    subTotal: number;
    totalDiscount: number;
    totalTax: number;
    shippingCharges: number;
    otherCharges: number;
    grandTotal: number;
    currency: string;
    paymentTerms: string;
    notes: string;
    status: BillStatus;
    createdAt: string;
    updatedAt: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSuppliers: Supplier[] = [
    {
        id: 'sup_001',
        name: 'Precision Steel & Alloys Pvt Ltd',
        gstin: '22AABCD1234E1Z5',
        pan: 'AABCD1234E',
        address: 'Plot No. 45, MIDC Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411021',
        country: 'India',
        email: 'accounts@precisionsteel.com',
        phone: '+91 20 4123 4567',
        contactPerson: 'Mr. Rajesh Kumar',
    },
    {
        id: 'sup_002',
        name: 'Rajesh Electricals & Controls',
        gstin: '27BBCDE5678F1Z6',
        pan: 'BBCDE5678F',
        address: 'Shop No. 12, Electronic Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India',
        email: 'info@rajeshelectricals.com',
        phone: '+91 22 2345 6789',
        contactPerson: 'Mr. Suresh Raj',
    },
    {
        id: 'sup_003',
        name: 'National Bearings & Tools Co.',
        gstin: '19CCCDE7890G1Z7',
        pan: 'CCCDE7890G',
        address: 'Industrial Estate, Phase II',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600032',
        country: 'India',
        email: 'sales@nationalbearings.com',
        phone: '+91 44 3456 7890',
        contactPerson: 'Ms. Priya Srinivasan',
    },
];

const mockPurchaseOrders: PurchaseOrder[] = [
    { id: 'po_001', poNumber: 'PO-2026-0042', date: '2026-07-15', totalAmount: 1250000 },
    { id: 'po_002', poNumber: 'PO-2026-0038', date: '2026-07-10', totalAmount: 875000 },
    { id: 'po_003', poNumber: 'PO-2026-0035', date: '2026-07-05', totalAmount: 2450000 },
];

const mockBill: SupplierBill = {
    id: 'bill_001',
    billNumber: 'INV-2026-0789',
    billDate: '2026-07-20',
    dueDate: '2026-08-19',
    supplier: mockSuppliers[0],
    purchaseOrder: mockPurchaseOrders[0],
    lineItems: [
        {
            id: 'li_001',
            itemCode: 'RM-1024',
            description: 'Stainless Steel Sheet 304 Grade - 2mm x 4ft x 8ft',
            hsnCode: '7219.22',
            quantity: 500,
            unit: 'kg',
            unitPrice: 1850,
            discountPercent: 5,
            discountAmount: 46250,
            taxableAmount: 878750,
            taxRate: 18,
            taxType: 'igst',
            taxAmount: 158175,
            totalAmount: 1036925,
        },
        {
            id: 'li_002',
            itemCode: 'RM-1056',
            description: 'Aluminum Alloy 6061 - T6 Plates - 6mm x 2ft x 4ft',
            hsnCode: '7606.92',
            quantity: 200,
            unit: 'kg',
            unitPrice: 2450,
            discountPercent: 8,
            discountAmount: 39200,
            taxableAmount: 450800,
            taxRate: 18,
            taxType: 'igst',
            taxAmount: 81144,
            totalAmount: 531944,
        },
        {
            id: 'li_003',
            itemCode: 'COMP-078',
            description: 'Industrial Servo Motor - 5kW, 3-Phase, 415V',
            hsnCode: '8501.51',
            quantity: 10,
            unit: 'units',
            unitPrice: 32500,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 325000,
            taxRate: 18,
            taxType: 'igst',
            taxAmount: 58500,
            totalAmount: 383500,
        },
    ],
    subTotal: 1654550,
    totalDiscount: 85450,
    totalTax: 297819,
    shippingCharges: 25000,
    otherCharges: 5000,
    grandTotal: 1982919,
    currency: 'INR',
    paymentTerms: 'Net 30',
    notes: 'Delivery completed on 18th July 2026. Quality inspection passed.',
    status: 'draft',
    createdAt: '2026-07-20T10:30:00Z',
    updatedAt: '2026-07-20T10:30:00Z',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const getStatusConfig = (status: BillStatus) => {
    const configs = {
        draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit },
        submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
        approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
        paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: CreditCard },
        partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
    };
    return configs[status] || configs.draft;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// ---------- Status Badge ----------
const StatusBadge: React.FC<{ status: BillStatus }> = ({ status }) => {
    const config = getStatusConfig(status);
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.color}`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

// ---------- Form Input ----------
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
    icon?: React.ReactNode;
}

const FormInput: React.FC<FormInputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} ${icon ? 'pl-10' : 'px-4'} py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:border-transparent ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};

// ---------- Form Select ----------
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
    error?: string;
    icon?: React.ReactNode;
}

const FormSelect: React.FC<FormSelectProps> = ({ label, options, error, icon, className = '', ...props }) => {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
                <select
                    className={`w-full appearance-none rounded-lg border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} ${icon ? 'pl-10' : 'px-4'} py-2.5 pr-10 text-sm transition-shadow focus:outline-none focus:ring-2 focus:border-transparent bg-white ${className}`}
                    {...props}
                >
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
};

// ---------- Line Item Row ----------
interface LineItemRowProps {
    item: LineItem;
    index: number;
    onUpdate: (id: string, field: keyof LineItem, value: any) => void;
    onRemove: (id: string) => void;
    currency: string;
}

const LineItemRow: React.FC<LineItemRowProps> = ({ item, index, onUpdate, onRemove, currency }) => {
    const handleChange = (field: keyof LineItem, value: any) => {
        onUpdate(item.id, field, value);
    };

    // Auto-calculate on change
    const recalc = useCallback(() => {
        const qty = item.quantity || 0;
        const price = item.unitPrice || 0;
        const discountPct = item.discountPercent || 0;
        const taxRate = item.taxRate || 0;

        const grossAmount = qty * price;
        const discountAmount = (grossAmount * discountPct) / 100;
        const taxableAmount = grossAmount - discountAmount;
        const taxAmount = (taxableAmount * taxRate) / 100;
        const totalAmount = taxableAmount + taxAmount;

        // Update calculated fields
        onUpdate(item.id, 'discountAmount', discountAmount);
        onUpdate(item.id, 'taxableAmount', taxableAmount);
        onUpdate(item.id, 'taxAmount', taxAmount);
        onUpdate(item.id, 'totalAmount', totalAmount);
    }, [item.id, item.quantity, item.unitPrice, item.discountPercent, item.taxRate, onUpdate]);

    // Recalc when any input changes
    React.useEffect(() => {
        recalc();
    }, [item.quantity, item.unitPrice, item.discountPercent, item.taxRate, recalc]);

    return (
        <div className="grid grid-cols-12 gap-2 items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
            {/* Index */}
            <div className="col-span-1 text-center text-xs text-gray-400 font-medium">
                #{index + 1}
            </div>

            {/* Item Code */}
            <div className="col-span-1">
                <input
                    type="text"
                    value={item.itemCode}
                    onChange={(e) => handleChange('itemCode', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Code"
                />
            </div>

            {/* Description */}
            <div className="col-span-2">
                <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Description"
                />
            </div>

            {/* HSN */}
            <div className="col-span-1">
                <input
                    type="text"
                    value={item.hsnCode}
                    onChange={(e) => handleChange('hsnCode', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="HSN"
                />
            </div>

            {/* Qty */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-right"
                    min="0"
                    step="1"
                />
            </div>

            {/* Unit */}
            <div className="col-span-1">
                <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleChange('unit', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Unit"
                />
            </div>

            {/* Unit Price */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-right"
                    min="0"
                    step="0.01"
                />
            </div>

            {/* Discount % */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.discountPercent}
                    onChange={(e) => handleChange('discountPercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-right"
                    min="0"
                    max="100"
                    step="0.5"
                />
            </div>

            {/* Tax Rate */}
            <div className="col-span-1">
                <input
                    type="number"
                    value={item.taxRate}
                    onChange={(e) => handleChange('taxRate', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-right"
                    min="0"
                    step="0.5"
                />
            </div>

            {/* Total */}
            <div className="col-span-1 text-right">
                <span className="text-sm font-semibold text-gray-800">
                    {formatCurrency(item.totalAmount || 0, currency)}
                </span>
            </div>

            {/* Actions */}
            <div className="col-span-1 text-center">
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Remove item"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT: SupplierBillForm
// ============================================================================

const SupplierBillForm: React.FC = () => {
    // State
    const [bill, setBill] = useState<SupplierBill>(mockBill);
    const [activeTab, setActiveTab] = useState<'details' | 'items' | 'summary'>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSupplierSelector, setShowSupplierSelector] = useState(false);

    // Derived totals
    const totals = useMemo(() => {
        const items = bill.lineItems;
        const subTotal = items.reduce((sum, item) => sum + item.taxableAmount + item.discountAmount, 0);
        const totalDiscount = items.reduce((sum, item) => sum + item.discountAmount, 0);
        const totalTax = items.reduce((sum, item) => sum + item.taxAmount, 0);
        const grandTotal = subTotal - totalDiscount + totalTax + bill.shippingCharges + bill.otherCharges;

        return { subTotal, totalDiscount, totalTax, grandTotal };
    }, [bill.lineItems, bill.shippingCharges, bill.otherCharges]);

    // Update bill totals
    React.useEffect(() => {
        setBill((prev) => ({
            ...prev,
            subTotal: totals.subTotal,
            totalDiscount: totals.totalDiscount,
            totalTax: totals.totalTax,
            grandTotal: totals.grandTotal,
        }));
    }, [totals]);

    // Handlers
    const handleBillChange = <K extends keyof SupplierBill>(field: K, value: SupplierBill[K]) => {
        setBill((prev) => ({ ...prev, [field]: value }));
    };

    const handleLineItemUpdate = (id: string, field: keyof LineItem, value: any) => {
        setBill((prev) => ({
            ...prev,
            lineItems: prev.lineItems.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            ),
        }));
    };

    const handleAddLineItem = () => {
        const newItem: LineItem = {
            id: generateId(),
            itemCode: '',
            description: '',
            hsnCode: '',
            quantity: 1,
            unit: 'kg',
            unitPrice: 0,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 0,
            taxRate: 18,
            taxType: 'igst',
            taxAmount: 0,
            totalAmount: 0,
        };
        setBill((prev) => ({
            ...prev,
            lineItems: [...prev.lineItems, newItem],
        }));
    };

    const handleRemoveLineItem = (id: string) => {
        if (bill.lineItems.length <= 1) {
            // Don't remove the last item
            return;
        }
        setBill((prev) => ({
            ...prev,
            lineItems: prev.lineItems.filter((item) => item.id !== id),
        }));
    };

    const handleStatusChange = (newStatus: BillStatus) => {
        setBill((prev) => ({ ...prev, status: newStatus }));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            handleStatusChange('submitted');
            alert('Bill submitted successfully!');
        }, 1000);
    };

    const handleSave = () => {
        alert('Bill saved as draft!');
    };

    const handleApprove = () => {
        handleStatusChange('approved');
        alert('Bill approved!');
    };

    const handlePay = () => {
        handleStatusChange('paid');
        alert('Bill marked as paid!');
    };

    // Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* ========== HEADER ========== */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <Receipt size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Supplier Bill</h1>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-sm text-gray-500">#{bill.billNumber}</span>
                                <span className="text-gray-300">|</span>
                                <StatusBadge status={bill.status} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Save size={16} />
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Send size={16} />
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                        {bill.status === 'submitted' && (
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 shadow-sm shadow-green-200"
                            >
                                <CheckCircle size={16} />
                                Approve
                            </button>
                        )}
                        {(bill.status === 'approved' || bill.status === 'submitted') && (
                            <button
                                onClick={handlePay}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-sm shadow-emerald-200"
                            >
                                <CreditCard size={16} />
                                Mark Paid
                            </button>
                        )}
                        <button className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                            <Printer size={16} />
                            Print
                        </button>
                        <button className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                            <Download size={16} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* ========== TABS ========== */}
                <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
                    {[
                        { id: 'details', label: 'Bill Details', icon: FileText },
                        { id: 'items', label: 'Line Items', icon: Package },
                        { id: 'summary', label: 'Summary & Actions', icon: DollarSign },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                    }`}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ========== TAB CONTENT ========== */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200 overflow-hidden">
                    {/* ---------- TAB: Details ---------- */}
                    {activeTab === 'details' && (
                        <div className="p-6 md:p-8 space-y-8">
                            {/* Bill Header */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <FormInput
                                    label="Bill Number"
                                    value={bill.billNumber}
                                    onChange={(e) => handleBillChange('billNumber', e.target.value)}
                                    icon={<Hash size={16} />}
                                />
                                <FormInput
                                    label="Bill Date"
                                    type="date"
                                    value={bill.billDate}
                                    onChange={(e) => handleBillChange('billDate', e.target.value)}
                                    icon={<Calendar size={16} />}
                                />
                                <FormInput
                                    label="Due Date"
                                    type="date"
                                    value={bill.dueDate}
                                    onChange={(e) => handleBillChange('dueDate', e.target.value)}
                                    icon={<Calendar size={16} />}
                                />
                                <FormSelect
                                    label="Payment Terms"
                                    value={bill.paymentTerms}
                                    onChange={(e) => handleBillChange('paymentTerms', e.target.value)}
                                    options={[
                                        { value: 'Net 15', label: 'Net 15' },
                                        { value: 'Net 30', label: 'Net 30' },
                                        { value: 'Net 45', label: 'Net 45' },
                                        { value: 'Net 60', label: 'Net 60' },
                                        { value: 'On Delivery', label: 'On Delivery' },
                                    ]}
                                    icon={<Tag size={16} />}
                                />
                            </div>

                            {/* Supplier & PO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Supplier Card */}
                                <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Building size={16} className="text-blue-600" />
                                            Supplier Details
                                        </h3>
                                        <button
                                            onClick={() => setShowSupplierSelector(!showSupplierSelector)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                        >
                                            <Search size={12} />
                                            Change
                                        </button>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="font-medium text-gray-800">{bill.supplier.name}</p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            {bill.supplier.address}, {bill.supplier.city}, {bill.supplier.state} - {bill.supplier.pincode}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {bill.supplier.email}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Phone size={14} className="text-gray-400" />
                                            {bill.supplier.phone}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Tag size={14} className="text-gray-400" />
                                            GSTIN: {bill.supplier.gstin} | PAN: {bill.supplier.pan}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <User size={14} className="text-gray-400" />
                                            Contact: {bill.supplier.contactPerson}
                                        </p>
                                    </div>
                                </div>

                                {/* PO Card */}
                                <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                        <FileText size={16} className="text-blue-600" />
                                        Purchase Order Reference
                                    </h3>
                                    {bill.purchaseOrder ? (
                                        <div className="space-y-1.5">
                                            <p className="font-medium text-gray-800">PO #{bill.purchaseOrder.poNumber}</p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                Date: {formatDate(bill.purchaseOrder.date)}
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <DollarSign size={14} className="text-gray-400" />
                                                Total: {formatCurrency(bill.purchaseOrder.totalAmount, bill.currency)}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-sm text-gray-400">No PO linked to this bill</p>
                                            <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                                                + Link Purchase Order
                                            </button>
                                        </div>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <FormSelect
                                            label=""
                                            value={bill.purchaseOrder?.id || ''}
                                            onChange={(e) => {
                                                const po = mockPurchaseOrders.find(p => p.id === e.target.value);
                                                handleBillChange('purchaseOrder', po || null);
                                            }}
                                            options={[
                                                { value: '', label: 'Select PO...' },
                                                ...mockPurchaseOrders.map(p => ({ value: p.id, label: `${p.poNumber} - ${formatCurrency(p.totalAmount, bill.currency)}` })),
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes / Remarks</label>
                                <textarea
                                    value={bill.notes}
                                    onChange={(e) => handleBillChange('notes', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                                    placeholder="Add any additional notes..."
                                />
                            </div>
                        </div>
                    )}

                    {/* ---------- TAB: Items ---------- */}
                    {activeTab === 'items' && (
                        <div className="p-6 md:p-8">
                            {/* Table Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Package size={16} className="text-blue-600" />
                                    Line Items
                                    <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {bill.lineItems.length} items
                                    </span>
                                </h3>
                                <button
                                    onClick={handleAddLineItem}
                                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Plus size={16} />
                                    Add Item
                                </button>
                            </div>

                            {/* Column Headers */}
                            <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-gray-50 rounded-t-xl border border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-1">Code</div>
                                <div className="col-span-2">Description</div>
                                <div className="col-span-1">HSN</div>
                                <div className="col-span-1 text-right">Qty</div>
                                <div className="col-span-1">Unit</div>
                                <div className="col-span-1 text-right">Price</div>
                                <div className="col-span-1 text-right">Disc %</div>
                                <div className="col-span-1 text-right">Tax %</div>
                                <div className="col-span-1 text-right">Total</div>
                                <div className="col-span-1 text-center">Action</div>
                            </div>

                            {/* Line Items */}
                            <div className="border-x border-b border-gray-200 rounded-b-xl overflow-hidden">
                                {bill.lineItems.length === 0 ? (
                                    <div className="py-12 text-center text-gray-400">
                                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No line items added yet</p>
                                        <button
                                            onClick={handleAddLineItem}
                                            className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                            + Add your first item
                                        </button>
                                    </div>
                                ) : (
                                    bill.lineItems.map((item, index) => (
                                        <LineItemRow
                                            key={item.id}
                                            item={item}
                                            index={index}
                                            onUpdate={handleLineItemUpdate}
                                            onRemove={handleRemoveLineItem}
                                            currency={bill.currency}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Item Totals Summary */}
                            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(totals.subTotal, bill.currency)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Total Discount:</span>
                                    <span className="font-medium text-red-600">-{formatCurrency(totals.totalDiscount, bill.currency)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500">Total Tax:</span>
                                    <span className="font-medium">{formatCurrency(totals.totalTax, bill.currency)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-base font-bold text-gray-800">
                                    <span>Grand Total:</span>
                                    <span className="text-blue-600">{formatCurrency(totals.grandTotal, bill.currency)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ---------- TAB: Summary ---------- */}
                    {activeTab === 'summary' && (
                        <div className="p-6 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Totals Breakdown */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-6">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                            <DollarSign size={16} className="text-blue-600" />
                                            Financial Summary
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Subtotal</span>
                                                <span className="font-medium">{formatCurrency(totals.subTotal, bill.currency)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Discount</span>
                                                <span className="font-medium text-red-600">-{formatCurrency(totals.totalDiscount, bill.currency)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Tax (Total)</span>
                                                <span className="font-medium">{formatCurrency(totals.totalTax, bill.currency)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Shipping Charges</span>
                                                <span className="font-medium">{formatCurrency(bill.shippingCharges, bill.currency)}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Other Charges</span>
                                                <span className="font-medium">{formatCurrency(bill.otherCharges, bill.currency)}</span>
                                            </div>
                                            <div className="flex justify-between py-3 text-lg font-bold">
                                                <span className="text-gray-800">Grand Total</span>
                                                <span className="text-blue-600">{formatCurrency(totals.grandTotal, bill.currency)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Extra Charges Edit */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormInput
                                            label="Shipping Charges"
                                            type="number"
                                            value={bill.shippingCharges}
                                            onChange={(e) => handleBillChange('shippingCharges', parseFloat(e.target.value) || 0)}
                                            icon={<Truck size={16} />}
                                        />
                                        <FormInput
                                            label="Other Charges"
                                            type="number"
                                            value={bill.otherCharges}
                                            onChange={(e) => handleBillChange('otherCharges', parseFloat(e.target.value) || 0)}
                                            icon={<Plus size={16} />}
                                        />
                                    </div>
                                </div>

                                {/* Right: Status & Actions */}
                                <div className="space-y-6">
                                    {/* Status Card */}
                                    <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-6">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                            <AlertCircle size={16} className="text-blue-600" />
                                            Bill Status
                                        </h3>
                                        <div className="flex items-center gap-3 mb-4">
                                            <StatusBadge status={bill.status} />
                                            <span className="text-xs text-gray-400">
                                                Updated: {formatDate(bill.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Created</span>
                                                <span className="text-gray-700">{formatDate(bill.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Bill Date</span>
                                                <span className="text-gray-700">{formatDate(bill.billDate)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Due Date</span>
                                                <span className="text-gray-700">{formatDate(bill.dueDate)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Payment Terms</span>
                                                <span className="text-gray-700">{bill.paymentTerms}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-6">
                                        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                                            <CheckCircle size={16} className="text-blue-600" />
                                            Quick Actions
                                        </h3>
                                        <div className="space-y-2">
                                            <button
                                                onClick={handleSubmit}
                                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Send size={16} />
                                                Submit for Approval
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Save size={16} />
                                                Save as Draft
                                            </button>
                                            <button className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                                <Eye size={16} />
                                                Preview Bill
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ========== FOOTER ========== */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-4">
                        <span>Bill ID: {bill.id}</span>
                        <span>•</span>
                        <span>Currency: {bill.currency}</span>
                        <span>•</span>
                        <span>Items: {bill.lineItems.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Need help?</span>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">Contact Support</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierBillForm;