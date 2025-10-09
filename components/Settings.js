'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Upload, Filter, Settings as SettingsIcon,
  UserPlus, Phone, Mail, MessageCircle, Users,
  AlertCircle, Clock, DollarSign, Package, Truck, CheckCircle,
  X, Save, Loader, Search
} from 'lucide-react';
import {
  priceToleranceApi,
  uomConversionApi,
  uomSettingsApi,
  quantityDeviationApi,
  siteValidationApi,
  businessRulesApi,
  escalationContactsApi,
  escalationMatrixApi,
  systemConfigApi,
  usersApi,
  communicationTemplatesApi,
  templatePlaceholdersApi
} from '../lib/api/settingsApi';
import Toast from './Toast';
import Dialog from './Dialog';

export default function Settings() {
  const [activeValidationTab, setActiveValidationTab] = useState('price-tolerance');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Data states
  const [priceToleranceRules, setPriceToleranceRules] = useState([]);
  const [uomConversionRules, setUomConversionRules] = useState([]);
  const [uomSettings, setUomSettings] = useState(null);
  const [quantityDeviationRules, setQuantityDeviationRules] = useState([]);
  const [siteValidationRules, setSiteValidationRules] = useState([]);
  const [businessRules, setBusinessRules] = useState([]);
  const [escalationContacts, setEscalationContacts] = useState([]);
  const [escalationMatrix, setEscalationMatrix] = useState([]);
  const [systemConfig, setSystemConfig] = useState([]);
  const [users, setUsers] = useState([]);
  const [commTemplates, setCommTemplates] = useState([]);
  const [templatePlaceholders, setTemplatePlaceholders] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [modalType, setModalType] = useState('');
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // User management states
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [visibleUserCount, setVisibleUserCount] = useState(5);

  // Dialog state
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  const validationTabs = [
    { id: 'price-tolerance', label: 'Price Tolerance' },
    { id: 'uom-conversion', label: 'UOM Conversion' },
    { id: 'quantity-deviation', label: 'Quantity Deviation' },
    { id: 'site-validation', label: 'Site Validation' },
    { id: 'other-rules', label: 'Other Rules' },
    { id: 'escalation-contacts', label: 'Escalation Contacts' },
    { id: 'escalation-matrix', label: 'Escalation Matrix' },
    { id: 'template-placeholders', label: 'Template Placeholders' }
  ];

  // Load data based on active tab
  useEffect(() => {
    loadTabData();
  }, [activeValidationTab]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadSystemConfig();
    loadCommTemplates();
  }, []);

  const loadTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeValidationTab) {
        case 'price-tolerance':
          const ptData = await priceToleranceApi.getAll();
          setPriceToleranceRules(Array.isArray(ptData) ? ptData : []);
          break;
        case 'uom-conversion':
          const [uomRules, uomSet] = await Promise.all([
            uomConversionApi.getAll(),
            uomSettingsApi.get()
          ]);
          setUomConversionRules(Array.isArray(uomRules) ? uomRules : []);
          setUomSettings(uomSet);
          break;
        case 'quantity-deviation':
          const qdData = await quantityDeviationApi.getAll();
          setQuantityDeviationRules(Array.isArray(qdData) ? qdData : []);
          break;
        case 'site-validation':
          const svData = await siteValidationApi.getAll();
          setSiteValidationRules(Array.isArray(svData) ? svData : []);
          break;
        case 'other-rules':
          const brData = await businessRulesApi.getAll();
          setBusinessRules(Array.isArray(brData) ? brData : []);
          break;
        case 'escalation-contacts':
          const ecData = await escalationContactsApi.getAll();
          setEscalationContacts(Array.isArray(ecData) ? ecData : []);
          break;
        case 'escalation-matrix':
          const emData = await escalationMatrixApi.getAll();
          setEscalationMatrix(Array.isArray(emData) ? emData : []);
          break;
        case 'template-placeholders':
          const tpData = await templatePlaceholdersApi.getAll();
          setTemplatePlaceholders(Array.isArray(tpData) ? tpData : []);
          break;
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersApi.getAll();
      const sortedData = Array.isArray(data) ? data.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateA - dateB; // ascending order
      }) : [];
      setUsers(sortedData);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const loadSystemConfig = async () => {
    try {
      const data = await systemConfigApi.getAll();
      setSystemConfig(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading system config:', err);
    }
  };

  const loadCommTemplates = async () => {
    try {
      const data = await communicationTemplatesApi.getAll();
      setCommTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Generic delete handler
  const handleDelete = async (api, id, reloadFunc) => {
    setDialogConfig({
      isOpen: true,
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      type: 'confirm',
      title: 'Confirm Delete',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.delete(id);
          await reloadFunc();
          showToast('Deleted successfully', 'success');
        } catch (err) {
          showToast('Error deleting item: ' + err.message, 'error');
        }
      }
    });
  };

  // Generic create/update handlers
  const openModal = (type, mode, item = null) => {
    setModalType(type);
    setModalMode(mode);
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setModalMode('create');
    setCurrentEditItem(null);
  };

  const handleFormSubmit = async (e, api, reloadFunc) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    // Convert numeric fields
    Object.keys(data).forEach(key => {
      if (['tolerance_percentage', 'min_amount', 'max_amount', 'conversion_factor',
           'max_deviation_percentage', 'auto_approval_threshold_percentage',
           'min_order_quantity', 'max_order_quantity', 'priority_level',
           'wait_time_minutes', 'template_id', 'escalation_contact_id'].includes(key)) {
        data[key] = parseFloat(data[key]) || 0;
      }
      if (key === 'is_active' || key === 'is_enabled' || key === 'allow_uom_mismatch' || key === 'auto_convert_uom') {
        data[key] = data[key] === 'true' || data[key] === 'on';
      }
    });

    // Add confirmation for updates
    if (modalMode === 'edit') {
      setDialogConfig({
        isOpen: true,
        message: 'Are you sure you want to update this item?',
        type: 'confirm',
        title: 'Confirm Update',
        showCancel: true,
        confirmText: 'Update',
        cancelText: 'Cancel',
        onConfirm: async () => {
          try {
            await api.update(currentEditItem.id, data);
            showToast('Updated successfully', 'success');
            closeModal();
            await reloadFunc();

            // Also reload users/templates/config if they were modified
            if (modalType === 'user') {
              await loadUsers();
            } else if (modalType === 'comm-template') {
              await loadCommTemplates();
            }
          } catch (err) {
            showToast('Error saving: ' + err.message, 'error');
          }
        }
      });
      return;
    }

    // Create mode - no confirmation needed
    try {
      await api.create(data);
      showToast('Created successfully', 'success');
      closeModal();
      await reloadFunc();

      // Also reload users/templates/config if they were modified
      if (modalType === 'user') {
        await loadUsers();
      } else if (modalType === 'comm-template') {
        await loadCommTemplates();
      }
    } catch (err) {
      showToast('Error saving: ' + err.message, 'error');
    }
  };

  // Render Price Tolerance Tab
  const renderPriceToleranceTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Price Tolerance Settings</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Configure price tolerance percentages per customer/channel</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('price-tolerance', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Rule
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer/Channel</th>
                <th>Tolerance (%)</th>
                <th>Min Amount</th>
                <th>Max Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {priceToleranceRules.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    No price tolerance rules found
                  </td>
                </tr>
              ) : (
                priceToleranceRules.map((rule) => (
                  <tr key={rule.id}>
                    <td>{rule.customer_channel}</td>
                    <td>{rule.tolerance_percentage}%</td>
                    <td>{rule.min_amount}</td>
                    <td>{rule.max_amount}</td>
                    <td>{rule.currency}</td>
                    <td>
                      <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('price-tolerance', 'edit', rule)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(priceToleranceApi, rule.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render UOM Conversion Tab
  const renderUOMConversionTab = () => (
    <div>
      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>UOM Conversion Rules</h4>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>Configure unit of measurement conversion rules</p>

      <div className="grid-2">
        <div style={{ background: 'var(--muted)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h5 style={{ fontWeight: 600, margin: 0 }}>Standard Conversions</h5>
            <button
              className="btn btn-primary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => openModal('uom-conversion', 'create')}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <Loader style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : uomConversionRules.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--muted-foreground)' }}>
                No conversion rules found
              </p>
            ) : (
              uomConversionRules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'white',
                    padding: '0.75rem',
                    borderRadius: 'var(--border-radius)',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span>1 {rule.from_uom} = {rule.conversion_factor} {rule.to_uom}</span>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.5rem' }}
                      onClick={() => openModal('uom-conversion', 'edit', rule)}
                    >
                      <Edit style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '0.25rem 0.5rem' }}
                      onClick={() => handleDelete(uomConversionApi, rule.id, loadTabData)}
                    >
                      <Trash2 style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: 'var(--muted)', padding: '1.5rem', borderRadius: 'var(--border-radius-lg)' }}>
          <h5 style={{ fontWeight: 600, marginBottom: '1rem' }}>Tolerance Settings</h5>
          {uomSettings && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = {
                allow_uom_mismatch: formData.get('allow_uom_mismatch') === 'on',
                auto_convert_uom: formData.get('auto_convert_uom') === 'on',
                conversion_tolerance_percentage: parseFloat(formData.get('conversion_tolerance_percentage')),
                fallback_uom: formData.get('fallback_uom')
              };
              uomSettingsApi.update(uomSettings.id, data)
                .then(() => {
                  showToast('Settings updated successfully', 'success');
                  loadTabData();
                })
                .catch(err => showToast('Error: ' + err.message, 'error'));
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)' }}>Allow UOM Mismatch</label>
                  <input
                    type="checkbox"
                    name="allow_uom_mismatch"
                    defaultChecked={uomSettings.allow_uom_mismatch}
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)' }}>Auto-convert UOM</label>
                  <input
                    type="checkbox"
                    name="auto_convert_uom"
                    defaultChecked={uomSettings.auto_convert_uom}
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '0.25rem' }}>
                    Conversion Tolerance (%)
                  </label>
                  <input
                    type="number"
                    name="conversion_tolerance_percentage"
                    defaultValue={uomSettings.conversion_tolerance_percentage}
                    className="form-input"
                    style={{ width: '100%' }}
                    step="0.1"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-sm)', display: 'block', marginBottom: '0.25rem' }}>
                    Fallback UOM
                  </label>
                  <input
                    type="text"
                    name="fallback_uom"
                    defaultValue={uomSettings.fallback_uom}
                    className="form-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                  <Save style={{ width: '16px', height: '16px' }} />
                  Save Settings
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // Render Quantity Deviation Tab
  const renderQuantityDeviationTab = () => (
    <div>
      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Quantity Deviation Rules</h4>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem' }}>Configure acceptable quantity deviation thresholds</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : quantityDeviationRules.length > 0 ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          const rule = quantityDeviationRules[0];
          const data = {
            max_deviation_percentage: parseFloat(formData.get('max_deviation_percentage')),
            auto_approval_threshold_percentage: parseFloat(formData.get('auto_approval_threshold_percentage')),
            min_order_quantity: parseFloat(formData.get('min_order_quantity')),
            max_order_quantity: parseFloat(formData.get('max_order_quantity')),
            is_active: formData.get('is_active') === 'on'
          };
          quantityDeviationApi.update(rule.id, data)
            .then(() => {
              showToast('Settings updated successfully', 'success');
              loadTabData();
            })
            .catch(err => showToast('Error: ' + err.message, 'error'));
        }}>
          <div className="grid-2">
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>
                Maximum Deviation (%)
              </label>
              <input
                type="number"
                name="max_deviation_percentage"
                defaultValue={quantityDeviationRules[0].max_deviation_percentage}
                className="form-input"
                style={{ width: '100%' }}
                step="0.1"
              />
              <small className="text-muted">Acceptable quantity difference from order</small>
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>
                Auto-approval Threshold (%)
              </label>
              <input
                type="number"
                name="auto_approval_threshold_percentage"
                defaultValue={quantityDeviationRules[0].auto_approval_threshold_percentage}
                className="form-input"
                style={{ width: '100%' }}
                step="0.1"
              />
              <small className="text-muted">Deviations below this are auto-approved</small>
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>
                Minimum Order Quantity
              </label>
              <input
                type="number"
                name="min_order_quantity"
                defaultValue={quantityDeviationRules[0].min_order_quantity}
                className="form-input"
                style={{ width: '100%' }}
              />
              <small className="text-muted">Reject orders below this quantity</small>
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500, display: 'block', marginBottom: '0.25rem' }}>
                Maximum Order Quantity
              </label>
              <input
                type="number"
                name="max_order_quantity"
                defaultValue={quantityDeviationRules[0].max_order_quantity}
                className="form-input"
                style={{ width: '100%' }}
              />
              <small className="text-muted">Flag orders above this quantity</small>
            </div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
            <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Rule Active</label>
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={quantityDeviationRules[0].is_active !== false}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary">
              <Save style={{ width: '16px', height: '16px' }} />
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <p style={{ textAlign: 'center', padding: '2rem' }}>No quantity deviation rules found</p>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--warning-light)', borderRadius: 'var(--border-radius)', borderLeft: '4px solid var(--warning)' }}>
        <strong>Note:</strong> Quantity deviations exceeding the maximum threshold will require manual approval from the KAM.
      </div>
    </div>
  );

  // Render Site Validation Tab
  const renderSiteValidationTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Site Validation Rules</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Configure valid delivery sites and validation rules</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('site-validation', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Site
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Site Code</th>
                <th>Site Name</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {siteValidationRules.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No site validation rules found
                  </td>
                </tr>
              ) : (
                siteValidationRules.map((site) => (
                  <tr key={site.id}>
                    <td style={{ fontWeight: 600 }}>{site.site_code}</td>
                    <td>{site.site_name}</td>
                    <td>
                      <span className={`badge ${site.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {site.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{new Date(site.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('site-validation', 'edit', site)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(siteValidationApi, site.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Other Rules Tab
  const renderOtherRulesTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Business Rules</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Configure Sugar Tax, FOC eligibility, Near expiry, and other business rules</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('business-rule', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Rule
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Rule Name</th>
                <th>Rule Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {businessRules.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No business rules found
                  </td>
                </tr>
              ) : (
                businessRules.map((rule) => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: 600 }}>{rule.rule_name}</td>
                    <td>
                      <span className="badge badge-info">{rule.rule_type}</span>
                    </td>
                    <td>
                      <span className={`badge ${rule.is_enabled ? 'badge-success' : 'badge-warning'}`}>
                        {rule.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>{new Date(rule.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('business-rule', 'edit', rule)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(businessRulesApi, rule.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Escalation Contacts Tab
  const renderEscalationContactsTab = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Escalation Contact Mapping</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Manage escalation contacts for different customer groups, regions, and issue types</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('escalation-contact', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Contact
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer Group</th>
                <th>Region</th>
                <th>Issue Type</th>
                <th>Contact Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Channel</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {escalationContacts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No escalation contacts found
                  </td>
                </tr>
              ) : (
                escalationContacts.map((contact) => (
                  <tr key={contact.id}>
                    <td style={{ fontWeight: 500 }}>{contact.customer_group_id}</td>
                    <td>{contact.region_id}</td>
                    <td>
                      <span className="badge badge-warning">
                        {contact.issue_type}
                      </span>
                    </td>
                    <td>{contact.contact_name}</td>
                    <td>{contact.role}</td>
                    <td>{contact.email}</td>
                    <td>
                      <span className={`badge ${
                        contact.preferred_channel === 'Email' ? 'badge-info' :
                        contact.preferred_channel === 'WhatsApp' ? 'badge-success' :
                        'badge-secondary'
                      }`}>
                        {contact.preferred_channel}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('escalation-contact', 'edit', contact)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(escalationContactsApi, contact.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Escalation Matrix Tab
  const renderEscalationMatrixTab = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Escalation Matrix</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Define escalation rules based on issue type, priority, and wait time</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('escalation-matrix', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Rule
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Issue Type</th>
                <th>Priority Level</th>
                <th>Wait Time (min)</th>
                <th>Channel</th>
                <th>Template ID</th>
                <th>Contact ID</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {escalationMatrix.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                    No escalation matrix rules found
                  </td>
                </tr>
              ) : (
                escalationMatrix.map((rule) => (
                  <tr key={rule.id}>
                    <td style={{ fontWeight: 600 }}>{rule.issue_type}</td>
                    <td>
                      <span className={`badge ${
                        rule.priority_level === 1 ? 'badge-danger' :
                        rule.priority_level === 2 ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        Level {rule.priority_level}
                      </span>
                    </td>
                    <td>{rule.wait_time_minutes}</td>
                    <td>
                      <span className="badge badge-secondary">{rule.channel}</span>
                    </td>
                    <td>{rule.template_id || '-'}</td>
                    <td>{rule.escalation_contact_id || '-'}</td>
                    <td>
                      <span className={`badge ${rule.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('escalation-matrix', 'edit', rule)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(escalationMatrixApi, rule.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Template Placeholders Tab
  const renderTemplatePlaceholdersTab = () => (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h4 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Template Placeholders</h4>
          <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Define dynamic placeholders for communication templates</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openModal('template-placeholder', 'create')}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          Add Placeholder
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Loader style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Placeholder Key</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templatePlaceholders.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    No template placeholders found
                  </td>
                </tr>
              ) : (
                templatePlaceholders.map((placeholder) => (
                  <tr key={placeholder.id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {placeholder.placeholder_key}
                    </td>
                    <td>{placeholder.placeholder_description}</td>
                    <td>
                      <span className={`badge ${placeholder.is_active ? 'badge-success' : 'badge-warning'}`}>
                        {placeholder.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', marginRight: '0.25rem' }}
                        onClick={() => openModal('template-placeholder', 'edit', placeholder)}
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem' }}
                        onClick={() => handleDelete(templatePlaceholdersApi, placeholder.id, loadTabData)}
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderValidationTabContent = () => {
    switch (activeValidationTab) {
      case 'price-tolerance':
        return renderPriceToleranceTab();
      case 'uom-conversion':
        return renderUOMConversionTab();
      case 'quantity-deviation':
        return renderQuantityDeviationTab();
      case 'site-validation':
        return renderSiteValidationTab();
      case 'other-rules':
        return renderOtherRulesTab();
      case 'escalation-contacts':
        return renderEscalationContactsTab();
      case 'escalation-matrix':
        return renderEscalationMatrixTab();
      case 'template-placeholders':
        return renderTemplatePlaceholdersTab();
      default:
        return null;
    }
  };

  // Render modal based on type
  const renderModal = () => {
    if (!showModal) return null;

    const renderFormFields = () => {
      switch (modalType) {
        case 'price-tolerance':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Customer/Channel *
                </label>
                <input
                  type="text"
                  name="customer_channel"
                  defaultValue={currentEditItem?.customer_channel || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Tolerance Percentage *
                </label>
                <input
                  type="number"
                  name="tolerance_percentage"
                  defaultValue={currentEditItem?.tolerance_percentage || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Min Amount *
                </label>
                <input
                  type="number"
                  name="min_amount"
                  defaultValue={currentEditItem?.min_amount || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Max Amount *
                </label>
                <input
                  type="number"
                  name="max_amount"
                  defaultValue={currentEditItem?.max_amount || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Currency *
                </label>
                <select
                  name="currency"
                  defaultValue={currentEditItem?.currency || 'AED'}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="AED">AED</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'uom-conversion':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  From UOM *
                </label>
                <input
                  type="text"
                  name="from_uom"
                  defaultValue={currentEditItem?.from_uom || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  To UOM *
                </label>
                <input
                  type="text"
                  name="to_uom"
                  defaultValue={currentEditItem?.to_uom || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Conversion Factor *
                </label>
                <input
                  type="number"
                  name="conversion_factor"
                  defaultValue={currentEditItem?.conversion_factor || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  step="0.01"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'site-validation':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Site Code *
                </label>
                <input
                  type="text"
                  name="site_code"
                  defaultValue={currentEditItem?.site_code || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Site Name *
                </label>
                <input
                  type="text"
                  name="site_name"
                  defaultValue={currentEditItem?.site_name || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>
            </>
          );

        case 'business-rule':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Rule Name *
                </label>
                <input
                  type="text"
                  name="rule_name"
                  defaultValue={currentEditItem?.rule_name || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Rule Type *
                </label>
                <select
                  name="rule_type"
                  defaultValue={currentEditItem?.rule_type || ''}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="customer_credit">Customer Credit</option>
                  <option value="payment_terms">Payment Terms</option>
                  <option value="business_logic">Business Logic</option>
                  <option value="data_completeness">Data Completeness</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Enabled</label>
                <input
                  type="checkbox"
                  name="is_enabled"
                  defaultChecked={currentEditItem?.is_enabled !== false}
                  style={{ width: '16px', height: '16px' }}
                />
              </div>
            </>
          );

        case 'escalation-contact':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Customer Group ID *
                </label>
                <input
                  type="text"
                  name="customer_group_id"
                  defaultValue={currentEditItem?.customer_group_id || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Region ID *
                </label>
                <input
                  type="text"
                  name="region_id"
                  defaultValue={currentEditItem?.region_id || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Issue Type *
                </label>
                <input
                  type="text"
                  name="issue_type"
                  defaultValue={currentEditItem?.issue_type || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  name="contact_name"
                  defaultValue={currentEditItem?.contact_name || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Role *
                </label>
                <input
                  type="text"
                  name="role"
                  defaultValue={currentEditItem?.role || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={currentEditItem?.email || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={currentEditItem?.phone || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Preferred Channel *
                </label>
                <select
                  name="preferred_channel"
                  defaultValue={currentEditItem?.preferred_channel || ''}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Select Channel</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="MS Teams">MS Teams</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'escalation-matrix':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Issue Type *
                </label>
                <input
                  type="text"
                  name="issue_type"
                  defaultValue={currentEditItem?.issue_type || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Priority Level * (1-5)
                </label>
                <input
                  type="number"
                  name="priority_level"
                  defaultValue={currentEditItem?.priority_level || 1}
                  className="form-input"
                  style={{ width: '100%' }}
                  min="1"
                  max="5"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Wait Time (minutes) *
                </label>
                <input
                  type="number"
                  name="wait_time_minutes"
                  defaultValue={currentEditItem?.wait_time_minutes || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  min="0"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Channel *
                </label>
                <select
                  name="channel"
                  defaultValue={currentEditItem?.channel || ''}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Select Channel</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="MS Teams">MS Teams</option>
                  <option value="Phone Call">Phone Call</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Template ID *
                </label>
                <input
                  type="number"
                  name="template_id"
                  defaultValue={currentEditItem?.template_id || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Escalation Contact ID *
                </label>
                <input
                  type="number"
                  name="escalation_contact_id"
                  defaultValue={currentEditItem?.escalation_contact_id || 0}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'user':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  defaultValue={currentEditItem?.full_name || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={currentEditItem?.email || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Role *
                </label>
                <select
                  name="role"
                  defaultValue={currentEditItem?.role || ''}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Admin">Admin</option>
                  <option value="CS Lead">CS Lead</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>
              {modalMode === 'edit' && currentEditItem?.last_active && (
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Last Active
                  </label>
                  <input
                    type="text"
                    value={new Date(currentEditItem.last_active).toLocaleString()}
                    className="form-input"
                    style={{ width: '100%', background: 'var(--muted)', cursor: 'not-allowed' }}
                    readOnly
                    disabled
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'comm-template':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Template Name *
                </label>
                <input
                  type="text"
                  name="template_name"
                  defaultValue={currentEditItem?.template_name || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Channel *
                </label>
                <select
                  name="channel"
                  defaultValue={currentEditItem?.channel || ''}
                  className="filter-select"
                  style={{ width: '100%' }}
                  required
                >
                  <option value="">Select Channel</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="MS Teams">MS Teams</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Subject Line
                </label>
                <input
                  type="text"
                  name="subject_line"
                  defaultValue={currentEditItem?.subject_line || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Message Template *
                </label>
                <textarea
                  name="message_template"
                  defaultValue={currentEditItem?.message_template || ''}
                  className="form-input"
                  style={{ width: '100%', minHeight: '100px' }}
                  required
                />
              </div>
              {modalMode === 'edit' && currentEditItem?.usage_count !== undefined && (
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Usage Count
                  </label>
                  <input
                    type="number"
                    value={currentEditItem.usage_count}
                    className="form-input"
                    style={{ width: '100%', background: 'var(--muted)', cursor: 'not-allowed' }}
                    readOnly
                    disabled
                  />
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        case 'template-placeholder':
          return (
            <>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Placeholder Key *
                </label>
                <input
                  type="text"
                  name="placeholder_key"
                  defaultValue={currentEditItem?.placeholder_key || ''}
                  className="form-input"
                  style={{ width: '100%' }}
                  placeholder="e.g., {customer_name}"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500, marginBottom: '0.25rem' }}>
                  Description *
                </label>
                <textarea
                  name="placeholder_description"
                  defaultValue={currentEditItem?.placeholder_description || ''}
                  className="form-input"
                  style={{ width: '100%', minHeight: '60px' }}
                  placeholder="Describe what this placeholder represents"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--muted)', borderRadius: 'var(--border-radius)' }}>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>Active</label>
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={currentEditItem?.is_active !== false}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </>
          );

        default:
          return null;
      }
    };

    const getModalTitle = () => {
      const action = modalMode === 'create' ? 'Add' : 'Edit';
      const typeLabel = modalType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      return `${action} ${typeLabel}`;
    };

    const getApiForType = () => {
      switch (modalType) {
        case 'price-tolerance': return priceToleranceApi;
        case 'uom-conversion': return uomConversionApi;
        case 'site-validation': return siteValidationApi;
        case 'business-rule': return businessRulesApi;
        case 'escalation-contact': return escalationContactsApi;
        case 'escalation-matrix': return escalationMatrixApi;
        case 'user': return usersApi;
        case 'comm-template': return communicationTemplatesApi;
        case 'template-placeholder': return templatePlaceholdersApi;
        default: return null;
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: 'var(--border-radius-lg)',
          padding: '1.5rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>{getModalTitle()}</h3>
            <button
              onClick={closeModal}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          <form onSubmit={(e) => handleFormSubmit(e, getApiForType(), loadTabData)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {renderFormFields()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <Save style={{ width: '16px', height: '16px' }} />
                {modalMode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Validation Rules Configuration */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Validation Rules Configuration</h3>
            <p>Configure validation rules for price tolerance, UOM conversion, and other business rules</p>
          </div>
        </div>
        <div className="card-content">
          {/* Error Display */}
          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              background: 'var(--danger-light)',
              borderRadius: 'var(--border-radius)',
              borderLeft: '4px solid var(--danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle style={{ width: '20px', height: '20px', color: 'var(--danger)' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <nav style={{ display: 'flex', gap: '2rem', marginBottom: '-1px', flexWrap: 'wrap' }}>
              {validationTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveValidationTab(tab.id)}
                  style={{
                    padding: '0.75rem 0',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    color: activeValidationTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)',
                    borderBottom: activeValidationTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {renderValidationTabContent()}
        </div>
      </div>

      {/* User Management */}
      <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>User Management</h3>
              <p>Manage user roles and permissions</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => openModal('user', 'create')}
            >
              <UserPlus style={{ width: '16px', height: '16px' }} />
              Add User
            </button>
          </div>
          <div className="card-content">
            {/* Search Bar */}
            <div style={{ marginBottom: '1rem', position: 'relative', maxWidth: '400px' }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '16px',
                height: '16px',
                color: '#6c757d'
              }} />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="form-input"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem'
                }}
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter users based on search term
                    const filteredUsers = users.filter(user =>
                      user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                    );

                    // Limit visible users
                    const visibleUsers = filteredUsers.slice(0, visibleUserCount);

                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                            {userSearchTerm ? 'No users match your search' : 'No users found'}
                          </td>
                        </tr>
                      );
                    }

                    return visibleUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div>{user.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{user.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'Admin' ? 'badge-danger' :
                            user.role === 'CS Lead' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${user.is_active ? 'badge-success' : 'badge-warning'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.5rem' }}
                            onClick={() => openModal('user', 'edit', user)}
                          >
                            <Edit style={{ width: '14px', height: '14px' }} />
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>

            {/* View More Button */}
            {(() => {
              const filteredUsers = users.filter(user =>
                user.full_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
              );

              if (filteredUsers.length > visibleUserCount) {
                return (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setVisibleUserCount(prev => prev + 5)}
                    >
                      View More ({filteredUsers.length - visibleUserCount} remaining)
                    </button>
                  </div>
                );
              } else if (visibleUserCount > 5 && filteredUsers.length <= visibleUserCount) {
                return (
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setVisibleUserCount(5)}
                    >
                      Show Less
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
      </div>

      {/* System Configuration */}
      <div className="card">
          <div className="card-header">
            <div className="card-header-content">
              <h3>System Configuration</h3>
              <p>Global system settings and preferences</p>
            </div>
          </div>
          <div className="card-content">
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              try {
                const updates = systemConfig.map(config => {
                  const newValue = formData.get(`config_${config.id}`);
                  return systemConfigApi.update(config.id, {
                    config_value: newValue,
                    config_type: config.config_type,
                    description: config.description
                  });
                });
                await Promise.all(updates);
                showToast('All configurations updated successfully', 'success');
                loadSystemConfig();
              } catch (err) {
                showToast('Error updating configurations: ' + err.message, 'error');
              }
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start'
              }}>
                {systemConfig.map((config) => (
                  <div key={config.id} style={{
                    padding: '1rem',
                    background: 'var(--muted)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border)'
                  }}>
                    <label style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.5rem',
                      color: '#333'
                    }}>
                      {config.config_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    <input
                      type={config.config_type === 'integer' ? 'number' : 'text'}
                      name={`config_${config.id}`}
                      defaultValue={config.config_value}
                      className="form-input"
                      style={{ width: '100%', marginBottom: '0.5rem' }}
                    />
                    {config.description && (
                      <small className="text-muted" style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        {config.description}
                      </small>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    loadSystemConfig();
                    showToast('Configuration reset to current values', 'success');
                  }}
                >
                  Reset
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save style={{ width: '16px', height: '16px' }} />
                  Update All
                </button>
              </div>
            </form>
          </div>
      </div>

      {/* Communication Templates */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-content">
            <h3>Communication Templates</h3>
            <p>Manage notification templates for escalation workflows</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => openModal('comm-template', 'create')}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            Add Template
          </button>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {commTemplates.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                No communication templates found
              </p>
            ) : (
              commTemplates.map((template) => (
                <div key={template.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--border-radius)', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>{template.template_name}</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{template.channel}</p>
                    </div>
                    <span className={`badge ${
                      template.channel === 'Email' ? 'badge-info' :
                      template.channel === 'WhatsApp' ? 'badge-success' :
                      'badge-secondary'
                    }`} style={{ fontSize: '0.625rem' }}>
                      {template.channel}
                    </span>
                  </div>
                  {template.subject_line && (
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500 }}>
                      {template.subject_line}
                    </div>
                  )}
                  <div style={{ background: 'var(--muted)', padding: '0.75rem', borderRadius: 'var(--border-radius)', fontSize: '0.75rem', marginBottom: '0.75rem', whiteSpace: 'pre-line', maxHeight: '100px', overflow: 'auto' }}>
                    {template.message_template}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ color: 'var(--muted-foreground)' }}>Used {template.usage_count || 0} times</small>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => openModal('comm-template', 'edit', template)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(communicationTemplatesApi, template.id, loadCommTemplates)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {renderModal()}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Dialog */}
      <Dialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig({ isOpen: false, message: '', onConfirm: null })}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type || 'info'}
        showCancel={dialogConfig.showCancel}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
      />
    </div>
  );
}
