// Settings API utility functions - using Next.js API proxy routes
const headers = {
  'Content-Type': 'application/json'
};

// Helper function for API calls (using local proxy routes)
async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || error.message || 'API request failed');
  }

  return response.json();
}

// ============= Price Tolerance Rules =============
export const priceToleranceApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/price-tolerance-rules?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/price-tolerance-rules/${id}`),
  create: (data) => apiCall('/api/settings/price-tolerance-rules', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/price-tolerance-rules/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/price-tolerance-rules/${id}`, 'DELETE'),
};

// ============= UOM Conversion Rules =============
export const uomConversionApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/uom-conversion-rules?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/uom-conversion-rules/${id}`),
  create: (data) => apiCall('/api/settings/uom-conversion-rules', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/uom-conversion-rules/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/uom-conversion-rules/${id}`, 'DELETE'),
};

// ============= UOM Settings =============
export const uomSettingsApi = {
  get: () => apiCall('/api/settings/uom-settings'),
  update: (id, data) => apiCall(`/api/settings/uom-settings/${id}`, 'PUT', data),
};

// ============= Quantity Deviation Rules =============
export const quantityDeviationApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/quantity-deviation-rules?skip=${skip}&limit=${limit}`),
  update: (id, data) => apiCall(`/api/settings/quantity-deviation-rules/${id}`, 'PUT', data),
};

// ============= Site Validation Rules =============
export const siteValidationApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/site-validation-rules?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/site-validation-rules/${id}`),
  create: (data) => apiCall('/api/settings/site-validation-rules', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/site-validation-rules/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/site-validation-rules/${id}`, 'DELETE'),
};

// ============= Business Rules =============
export const businessRulesApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/business-rules?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/business-rules/${id}`),
  create: (data) => apiCall('/api/settings/business-rules', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/business-rules/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/business-rules/${id}`, 'DELETE'),
};

// ============= Escalation Contacts =============
export const escalationContactsApi = {
  getAll: (customerGroupId = null, regionId = null, skip = 0, limit = 100) => {
    let query = `skip=${skip}&limit=${limit}`;
    if (customerGroupId) query += `&customer_group_id=${customerGroupId}`;
    if (regionId) query += `&region_id=${regionId}`;
    return apiCall(`/api/settings/escalation-contacts?${query}`);
  },
  getById: (id) => apiCall(`/api/settings/escalation-contacts/${id}`),
  create: (data) => apiCall('/api/settings/escalation-contacts', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/escalation-contacts/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/escalation-contacts/${id}`, 'DELETE'),
};

// ============= Escalation Matrix =============
export const escalationMatrixApi = {
  getAll: (issueType = null, skip = 0, limit = 100) => {
    let query = `skip=${skip}&limit=${limit}`;
    if (issueType) query += `&issue_type=${issueType}`;
    return apiCall(`/api/settings/escalation-matrix?${query}`);
  },
  getById: (id) => apiCall(`/api/settings/escalation-matrix/${id}`),
  create: (data) => apiCall('/api/settings/escalation-matrix', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/escalation-matrix/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/escalation-matrix/${id}`, 'DELETE'),
};

// ============= System Configuration =============
export const systemConfigApi = {
  getAll: (configType = null, skip = 0, limit = 100) => {
    let query = `skip=${skip}&limit=${limit}`;
    if (configType) query += `&config_type=${configType}`;
    return apiCall(`/api/settings/system-configuration?${query}`);
  },
  getById: (id) => apiCall(`/api/settings/system-configuration/${id}`),
  getByKey: (key) => apiCall(`/api/settings/system-configuration/key/${key}`),
  create: (data) => apiCall('/api/settings/system-configuration', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/system-configuration/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/system-configuration/${id}`, 'DELETE'),
};

// ============= Users =============
export const usersApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/users?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/users/${id}`),
  create: (data) => apiCall('/api/settings/users', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/users/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/users/${id}`, 'DELETE'),
};

// ============= Communication Templates =============
export const communicationTemplatesApi = {
  getAll: (channel = null, skip = 0, limit = 100) => {
    let query = `skip=${skip}&limit=${limit}`;
    if (channel) query += `&channel=${channel}`;
    return apiCall(`/api/settings/communication-templates?${query}`);
  },
  getById: (id) => apiCall(`/api/settings/communication-templates/${id}`),
  create: (data) => apiCall('/api/settings/communication-templates', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/communication-templates/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/communication-templates/${id}`, 'DELETE'),
};

// ============= Template Placeholders =============
export const templatePlaceholdersApi = {
  getAll: (skip = 0, limit = 100) => apiCall(`/api/settings/template-placeholders?skip=${skip}&limit=${limit}`),
  getById: (id) => apiCall(`/api/settings/template-placeholders/${id}`),
  create: (data) => apiCall('/api/settings/template-placeholders', 'POST', data),
  update: (id, data) => apiCall(`/api/settings/template-placeholders/${id}`, 'PUT', data),
  delete: (id) => apiCall(`/api/settings/template-placeholders/${id}`, 'DELETE'),
};
