import React, { useState, useEffect } from 'react';
//import { formatDate } from 'react-datepicker/dist/dist/date_utils.js';
import { 
  FaTimes, 
  FaSave, 
  FaMoneyBillWave,
  FaUser,
  FaCalendarAlt,
  FaRupeeSign,
  FaCheckCircle
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

interface PaymentFormData {
  receiptNumber: string;
  customer: string;
  receiptAmount: number;
  outstandingAmount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Cheque' | 'Bank Transfer' | 'UPI' | 'Credit Card' | 'Debit Card';
  amountReceived: number;
  referenceNumber: string;
  transactionNumber: string;
  bankAccount: string;
  notes: string;
}

const CollectPaymentForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get receipt data from location state or URL params
  const [formData, setFormData] = useState<PaymentFormData>({
    receiptNumber: '',
    customer: '',
    receiptAmount: 0,
    outstandingAmount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    amountReceived: 0,
    referenceNumber: '',
    transactionNumber: '',
    bankAccount: '',
    notes: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  // Load receipt data based on URL params
  useEffect(() => {
    // In real app, fetch from API based on receipt number
    const params = new URLSearchParams(location.search);
    const receiptNo = params.get('receipt');
    
    if (receiptNo) {
      // Mock data - replace with API call
      const mockData: PaymentFormData = {
        receiptNumber: receiptNo,
        customer: 'ABC Traders Pvt Ltd',
        receiptAmount: 150000,
        outstandingAmount: 50000,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        amountReceived: 0,
        referenceNumber: '',
        transactionNumber: '',
        bankAccount: '',
        notes: ''
      };
      setFormData(mockData);
      
      // Mock payment history
      setPaymentHistory([
        { date: '2024-01-16', amount: 100000, method: 'Bank Transfer', reference: 'REF-001' }
      ]);
    }
  }, [location]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.receiptNumber) {
      newErrors.receiptNumber = 'Receipt number is required';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (formData.amountReceived <= 0) {
      newErrors.amountReceived = 'Amount must be greater than 0';
    }

    if (formData.amountReceived > formData.outstandingAmount) {
      newErrors.amountReceived = `Amount cannot exceed outstanding amount of ${formatCurrency(formData.outstandingAmount)}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      
      // In real app, save to API
      console.log('Payment submitted:', formData);
      
      setIsSubmitting(false);
      
      // Navigate back to payments list
      navigate('/receivables/customer-payments');
    }
  };

  const handleClose = () => {
    navigate('/receivables/customer-payments');
  };

  const isFullyPaid = formData.outstandingAmount - formData.amountReceived === 0;

  return (
    <div className="collect-payment-modal">
      <div className="collect-payment-content">
        <div className="collect-payment-header">
          <h2>
            <FaMoneyBillWave style={{ marginRight: '8px', color: '#2563eb' }} />
            Collect Payment
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="collect-payment-body">
          {/* Receipt Information */}
          <div className="payment-section">
            <h3>Receipt Information</h3>
            <div className="payment-grid">
              <div className="payment-field">
                <label>Receipt Number</label>
                <input 
                  type="text" 
                  className="payment-input"
                  value={formData.receiptNumber}
                  disabled
                />
              </div>
              <div className="payment-field">
                <label>Customer</label>
                <div className="input-with-icon">
                  <FaUser className="input-icon" />
                  <input 
                    type="text" 
                    className="payment-input"
                    value={formData.customer}
                    disabled
                  />
                </div>
              </div>
              <div className="payment-field">
                <label>Receipt Amount</label>
                <div className="input-with-icon">
                  <FaRupeeSign className="input-icon" />
                  <input 
                    type="text" 
                    className="payment-input"
                    value={formatCurrency(formData.receiptAmount)}
                    disabled
                  />
                </div>
              </div>
              <div className="payment-field">
                <label>Outstanding Amount</label>
                <div className="input-with-icon">
                  <FaRupeeSign className="input-icon" />
                  <input 
                    type="text" 
                    className={`payment-input ${formData.outstandingAmount > 0 ? 'text-red' : 'text-green'}`}
                    value={formatCurrency(formData.outstandingAmount)}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="payment-section">
            <h3>Payment Details</h3>
            <div className="payment-grid">
              <div className="payment-field">
                <label>Payment Date *</label>
                <div className="input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <input 
                    type="date" 
                    className={`payment-input ${errors.paymentDate ? 'error' : ''}`}
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  />
                </div>
                {errors.paymentDate && <span className="error-text">{errors.paymentDate}</span>}
              </div>
              <div className="payment-field">
                <label>Payment Method *</label>
                <select 
                  className={`payment-select ${errors.paymentMethod ? 'error' : ''}`}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                >
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
                {errors.paymentMethod && <span className="error-text">{errors.paymentMethod}</span>}
              </div>
              <div className="payment-field">
                <label>Amount Received *</label>
                <div className="input-with-icon">
                  <FaRupeeSign className="input-icon" />
                  <input 
                    type="number" 
                    className={`payment-input ${errors.amountReceived ? 'error' : ''}`}
                    value={formData.amountReceived}
                    onChange={(e) => setFormData({ ...formData, amountReceived: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                  />
                </div>
                {errors.amountReceived && <span className="error-text">{errors.amountReceived}</span>}
                {isFullyPaid && formData.amountReceived > 0 && (
                  <div className="success-hint">
                    <FaCheckCircle /> This payment will fully clear the outstanding amount.
                    <span className="invoice-ready">Invoice will be ready for generation.</span>
                  </div>
                )}
              </div>
              <div className="payment-field">
                <label>Reference Number</label>
                <input 
                  type="text" 
                  className="payment-input"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="Enter reference number"
                />
              </div>
              <div className="payment-field">
                <label>Transaction Number</label>
                <input 
                  type="text" 
                  className="payment-input"
                  value={formData.transactionNumber}
                  onChange={(e) => setFormData({ ...formData, transactionNumber: e.target.value })}
                  placeholder="Enter transaction number"
                />
              </div>
              <div className="payment-field">
                <label>Bank Account</label>
                <select 
                  className="payment-select"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                >
                  <option value="">Select Bank Account</option>
                  <option value="SBI Current - 12345678901">SBI Current - 12345678901</option>
                  <option value="HDFC Savings - 98765432109">HDFC Savings - 98765432109</option>
                  <option value="ICICI Current - 56789012345">ICICI Current - 56789012345</option>
                </select>
              </div>
              <div className="payment-field full-width">
                <label>Notes</label>
                <textarea 
                  className="payment-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any additional notes..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Payment History */}
          {paymentHistory.length > 0 && (
            <div className="payment-section">
              <h3>Payment History</h3>
              <div className="payment-history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment, index) => (
                      <tr key={index}>
                        <td className="amount">{formatCurrency(payment.amount)}</td>
                        <td>{payment.method}</td>
                        <td>{payment.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><strong>Total Paid</strong></td>
                      <td className="amount">
                        <strong>
                          {formatCurrency(
                            paymentHistory.reduce((sum, p) => sum + p.amount, 0)
                          )}
                        </strong>
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td><strong>Outstanding</strong></td>
                      <td className={`amount ${formData.outstandingAmount - formData.amountReceived > 0 ? 'text-red' : 'text-green'}`}>
                        <strong>
                          {formatCurrency(formData.outstandingAmount - formData.amountReceived)}
                        </strong>
                      </td>
                      <td></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="collect-payment-footer">
          <div className="footer-left">
            <button className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
          </div>
          <div className="footer-right">
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <FaSave /> {isSubmitting ? 'Processing...' : 'Save Payment'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ===== COLLECT PAYMENT MODAL ===== */
        .collect-payment-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .collect-payment-content {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .collect-payment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .collect-payment-header h2 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          color: #1e293b;
        }

        .collect-payment-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .payment-section {
          margin-bottom: 24px;
        }

        .payment-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #f1f5f9;
        }

        .payment-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .payment-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .payment-field.full-width {
          grid-column: 1 / -1;
        }

        .payment-field label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
        }

        .input-with-icon .payment-input {
          padding-left: 36px;
        }

        .payment-input,
        .payment-select,
        .payment-textarea {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #f8fafc;
          color: #1e293b;
          transition: all 0.2s;
          width: 100%;
          font-family: inherit;
        }

        .payment-input:disabled,
        .payment-select:disabled {
          background: #f3f4f6;
          cursor: not-allowed;
        }

        .payment-input:focus,
        .payment-select:focus,
        .payment-textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          background: #ffffff;
        }

        .payment-input.error,
        .payment-select.error {
          border-color: #ef4444;
        }

        .payment-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .payment-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M6 8L1 3h10z' fill='%2364748b'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
        }

        .error-text {
          font-size: 12px;
          color: #ef4444;
          margin-top: 4px;
        }

        .text-red {
          color: #ef4444;
        }

        .text-green {
          color: #10b981;
        }

        .success-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #ecfdf5;
          border: 1px solid #10b981;
          border-radius: 8px;
          color: #10b981;
          font-size: 13px;
          margin-top: 4px;
        }

        .success-hint .invoice-ready {
          font-weight: 600;
          color: #8b5cf6;
        }

        /* Payment History Table */
        .payment-history-table {
          overflow-x: auto;
        }

        .payment-history-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .payment-history-table th {
          padding: 8px 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }

        .payment-history-table td {
          padding: 8px 12px;
          font-size: 14px;
          border-bottom: 1px solid #f1f5f9;
        }

        .payment-history-table .amount {
          font-weight: 500;
        }

        .payment-history-table tfoot td {
          font-weight: 600;
          border-top: 2px solid #e2e8f0;
          padding-top: 12px;
        }

        .collect-payment-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 12px;
        }

        .footer-right {
          display: flex;
          gap: 12px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #2563eb;
          color: #2563eb;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .payment-grid {
            grid-template-columns: 1fr;
          }

          .collect-payment-content {
            margin: 16px;
            max-height: 95vh;
          }

          .collect-payment-footer {
            flex-direction: column;
          }

          .footer-right {
            width: 100%;
          }

          .footer-right button {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectPaymentForm;