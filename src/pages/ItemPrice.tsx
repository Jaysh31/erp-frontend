import React, { useState } from 'react';
import { 
  FaSearch, FaPlus, FaEdit, FaTrash,  FaFilter, 
  FaCheckCircle,  FaSave, FaSpinner, FaTimes,
FaCopy,  FaDollarSign,
} from 'react-icons/fa';
import { useAdminTheme } from '../admin-theme/AdminThemeContext';
import toast from 'react-hot-toast';
import './ItemPrice.css';

interface ItemPrice {
  id: string;
  itemCode: string;
  itemName: string;
  uom: string;
  priceList: string;
  rate: number;
  currency: string;
  buying: boolean;
  selling: boolean;
  reference: string;
  validFrom: string;
  validUpto: string;
  createdAt: string;
  updatedAt: string;
}

export default function ItemPrice() {
  
  let theme = 'light';
  try {
    const context = useAdminTheme();
    theme = context.theme;
  } catch (error) {
    console.log('Using default light theme');
  }

  const [filterText, setFilterText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItemPrice, setSelectedItemPrice] = useState<ItemPrice | null>(null);
  const [loading, setLoading] = useState(false);

  const [itemPrices, setItemPrices] = useState<ItemPrice[]>([
    {
      id: '1',
      itemCode: 'ITEM-001',
      itemName: 'Product A',
      uom: 'PCS',
      priceList: 'Standard Selling',
      rate: 1000,
      currency: 'INR',
      buying: false,
      selling: true,
      reference: 'REF-001',
      validFrom: '2026-01-01',
      validUpto: '2026-12-31',
      createdAt: '2026-06-20T10:00:00Z',
      updatedAt: '2026-06-20T10:00:00Z'
    },
    {
      id: '2',
      itemCode: 'ITEM-002',
      itemName: 'Product B',
      uom: 'KG',
      priceList: 'Wholesale',
      rate: 2500,
      currency: 'INR',
      buying: true,
      selling: false,
      reference: 'REF-002',
      validFrom: '2026-01-01',
      validUpto: '2026-12-31',
      createdAt: '2026-06-19T10:00:00Z',
      updatedAt: '2026-06-19T10:00:00Z'
    },
    {
      id: '3',
      itemCode: 'ITEM-003',
      itemName: 'Product C',
      uom: 'LTR',
      priceList: 'Export Pricing',
      rate: 15000,
      currency: 'USD',
      buying: false,
      selling: true,
      reference: 'REF-003',
      validFrom: '2026-01-01',
      validUpto: '2026-12-31',
      createdAt: '2026-06-18T10:00:00Z',
      updatedAt: '2026-06-18T10:00:00Z'
    }
  ]);

  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    uom: 'PCS',
    priceList: 'Standard Selling',
    rate: 0,
    currency: 'INR',
    buying: false,
    selling: true,
    reference: '',
    validFrom: new Date().toISOString().split('T')[0],
    validUpto: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const uomOptions = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'DOZ', 'NOS', 'SQM', 'CBM'];
  const priceListOptions = ['Standard Selling', 'Wholesale', 'Retail', 'Export Pricing', 'Distributor'];
  const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

  const filteredItemPrices = itemPrices.filter(ip => 
    ip.itemCode.toLowerCase().includes(filterText.toLowerCase()) ||
    ip.itemName.toLowerCase().includes(filterText.toLowerCase()) ||
    ip.priceList.toLowerCase().includes(filterText.toLowerCase()) ||
    ip.reference.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleCreate = () => {
    setFormData({
      itemCode: '',
      itemName: '',
      uom: 'PCS',
      priceList: 'Standard Selling',
      rate: 0,
      currency: 'INR',
      buying: false,
      selling: true,
      reference: '',
      validFrom: new Date().toISOString().split('T')[0],
      validUpto: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setShowCreateModal(true);
  };

  const handleEdit = (itemPrice: ItemPrice) => {
    setSelectedItemPrice(itemPrice);
    setFormData({
      itemCode: itemPrice.itemCode,
      itemName: itemPrice.itemName,
      uom: itemPrice.uom,
      priceList: itemPrice.priceList,
      rate: itemPrice.rate,
      currency: itemPrice.currency,
      buying: itemPrice.buying,
      selling: itemPrice.selling,
      reference: itemPrice.reference,
      validFrom: itemPrice.validFrom,
      validUpto: itemPrice.validUpto
    });
    setShowEditModal(true);
  };

  const handleDelete = (itemPrice: ItemPrice) => {
    setSelectedItemPrice(itemPrice);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemCode.trim()) {
      toast.error('Item Code is required');
      return;
    }
    if (!formData.rate || formData.rate <= 0) {
      toast.error('Rate must be greater than 0');
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (showEditModal && selectedItemPrice) {
        setItemPrices(prev => prev.map(ip => 
          ip.id === selectedItemPrice.id 
            ? { ...ip, ...formData, updatedAt: new Date().toISOString() }
            : ip
        ));
        toast.success('Item Price updated successfully!');
      } else {
        const newItemPrice: ItemPrice = {
          id: String(itemPrices.length + 1),
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setItemPrices(prev => [...prev, newItemPrice]);
        toast.success('Item Price created successfully!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
    } catch (error) {
      toast.error('Failed to save item price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`item-price-page ${theme}-theme`}>
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Item Price</h1>
          <span className="badge">{itemPrices.length} Items</span>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleCreate}>
            <FaPlus size={12} /> Add Item Price
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by Item Code, Name, Price List or Reference..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="search-input"
          />
          {filterText && (
            <button className="clear-btn" onClick={() => setFilterText('')}>×</button>
          )}
        </div>
        <div className="filter-wrapper">
          <button 
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter size={12} /> Filter
          </button>
          <span className="result-count">{filteredItemPrices.length} of {itemPrices.length}</span>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="expandable-filters">
          <div className="filter-group">
            <label>Price List</label>
            <select>
              <option value="all">All</option>
              {priceListOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Currency</label>
            <select>
              <option value="all">All</option>
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Type</label>
            <select>
              <option value="all">All</option>
              <option value="selling">Selling</option>
              <option value="buying">Buying</option>
            </select>
          </div>
          <button className="apply-filters">Apply</button>
        </div>
      )}

      {/* Item Price List */}
      <div className="item-price-container">
        {filteredItemPrices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaDollarSign size={48} />
            </div>
            <h3>Log the selling and buying rate of an Item</h3>
            <p>Create your first Item Price</p>
            <button className="btn-primary" onClick={handleCreate}>
              <FaPlus size={12} /> Add Item Price
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="item-price-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>Price List</th>
                  <th>UOM</th>
                  <th>Rate</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemPrices.map((ip) => (
                  <tr key={ip.id} className="item-price-row">
                    <td className="id-cell">{ip.id}</td>
                    <td className="code-cell">
                      <span className="item-code">{ip.itemCode}</span>
                    </td>
                    <td className="name-cell">{ip.itemName}</td>
                    <td className="price-list-cell">
                      <span className="price-list-badge">{ip.priceList}</span>
                    </td>
                    <td className="uom-cell">
                      <span className="uom-badge">{ip.uom}</span>
                    </td>
                    <td className="rate-cell">
                      <span className="rate-value">{ip.currency} {ip.rate.toLocaleString()}</span>
                    </td>
                    <td className="type-cell">
                      <div className="type-badges">
                        {ip.selling && <span className="type-badge selling">Selling</span>}
                        {ip.buying && <span className="type-badge buying">Buying</span>}
                        {!ip.selling && !ip.buying && <span className="type-badge inactive">-</span>}
                      </div>
                    </td>
                    <td className="reference-cell">{ip.reference || '-'}</td>
                    <td>
                      <div className="action-group">
                        <button 
                          className="action-btn edit" 
                          title="Edit"
                          onClick={() => handleEdit(ip)}
                        >
                          <FaEdit size={12} />
                        </button>
                        <button 
                          className="action-btn copy" 
                          title="Duplicate"
                          onClick={() => {
                            const newItemPrice: ItemPrice = {
                              ...ip,
                              id: String(itemPrices.length + 1),
                              itemCode: `${ip.itemCode}-COPY`,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString()
                            };
                            setItemPrices(prev => [...prev, newItemPrice]);
                            toast.success('Item Price duplicated successfully!');
                          }}
                        >
                          <FaCopy size={12} />
                        </button>
                        <button 
                          className="action-btn delete" 
                          title="Delete"
                          onClick={() => handleDelete(ip)}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="list-footer">
        <span>{filteredItemPrices.length} of {itemPrices.length} item prices</span>
        <div className="footer-actions">
          <span className="conversion-badge">
            <FaDollarSign size={11} /> {itemPrices.filter(ip => ip.selling).length} selling
          </span>
        </div>
      </div>

      {/* ====== CREATE/EDIT MODAL (SCROLLABLE) ====== */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateModal(false);
          setShowEditModal(false);
        }}>
          <div className="modal-container create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showEditModal ? 'Edit Item Price' : 'New Item Price'}</h2>
              <button className="modal-close" onClick={() => {
                setShowCreateModal(false);
                setShowEditModal(false);
              }}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body scrollable-body">
              <form onSubmit={handleSubmit}>
                {/* Item Details */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Item Code *</label>
                      <input
                        type="text"
                        value={formData.itemCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                        placeholder="ITEM-001"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Item Name</label>
                      <input
                        type="text"
                        value={formData.itemName}
                        onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                        placeholder="Product Name"
                      />
                    </div>
                  </div>
                </div>

                {/* UOM & Price List */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>UOM *</label>
                      <select
                        value={formData.uom}
                        onChange={(e) => setFormData(prev => ({ ...prev, uom: e.target.value }))}
                        required
                      >
                        {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Price List *</label>
                      <select
                        value={formData.priceList}
                        onChange={(e) => setFormData(prev => ({ ...prev, priceList: e.target.value }))}
                        required
                      >
                        {priceListOptions.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Rate & Currency */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Rate *</label>
                      <input
                        type="number"
                        value={formData.rate}
                        onChange={(e) => setFormData(prev => ({ ...prev, rate: Number(e.target.value) }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Currency</label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                      >
                        {currencies.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reference & Validity */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Reference</label>
                      <input
                        type="text"
                        value={formData.reference}
                        onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                        placeholder="REF-001"
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid From</label>
                      <input
                        type="date"
                        value={formData.validFrom}
                        onChange={(e) => setFormData(prev => ({ ...prev, validFrom: e.target.value }))}
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Valid Upto</label>
                      <input
                        type="date"
                        value={formData.validUpto}
                        onChange={(e) => setFormData(prev => ({ ...prev, validUpto: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Type Toggle */}
                <div className="form-section">
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Type</label>
                      <div className="type-toggle-group">
                        <button
                          type="button"
                          className={`type-toggle ${formData.selling ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, selling: !prev.selling }))}
                        >
                          <FaCheckCircle size={14} /> Selling
                        </button>
                        <button
                          type="button"
                          className={`type-toggle ${formData.buying ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, buying: !prev.buying }))}
                        >
                          <FaCheckCircle size={14} /> Buying
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading && <FaSpinner className="spinning" />}
                    <FaSave size={12} /> {showEditModal ? 'Update' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ====== DELETE MODAL ====== */}
      {showDeleteModal && selectedItemPrice && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Item Price</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body delete-body">
              <div className="delete-icon">
                <FaTrash size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                You are about to delete item price for <strong>{selectedItemPrice.itemCode}</strong>
              </p>
              <p className="delete-warning">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={() => {
                  setItemPrices(prev => prev.filter(ip => ip.id !== selectedItemPrice.id));
                  setShowDeleteModal(false);
                  toast.success('Item Price deleted successfully!');
                }}
              >
                <FaTrash size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}