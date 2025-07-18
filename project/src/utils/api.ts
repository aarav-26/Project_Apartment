import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  register: (userData: any) =>
    api.post('/auth/register', userData),
};

// Flats API
export const flatAPI = {
  getAll: () => api.get('/flats'),
  getById: (id: number) => api.get(`/flats/${id}`),
  create: (data: any) => api.post('/flats', data),
  update: (id: number, data: any) => api.put(`/flats/${id}`, data),
  delete: (id: number) => api.delete(`/flats/${id}`),
};

// Residents API
export const residentAPI = {
  getAll: () => api.get('/residents'),
  getByFlat: (flatId: number) => api.get(`/residents/flat/${flatId}`),
  create: (data: any) => api.post('/residents', data),
  update: (id: number, data: any) => api.put(`/residents/${id}`, data),
  delete: (id: number) => api.delete(`/residents/${id}`),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getPending: () => api.get('/maintenance/pending'),
  create: (data: any) => api.post('/maintenance', data),
  updatePayment: (id: number, data: any) => api.put(`/maintenance/${id}/payment`, data),
  delete: (id: number) => api.delete(`/maintenance/${id}`),
};

// Complaints API
export const complaintAPI = {
  getAll: () => api.get('/complaints'),
  create: (data: any) => api.post('/complaints', data),
  updateStatus: (id: number, data: any) => api.put(`/complaints/${id}`, data),
  delete: (id: number) => api.delete(`/complaints/${id}`),
};

//inquiryAPI
export const inquiryAPI = {
  getAll: () => fetch('/api/contact/inquiries', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  }).then(res => res.json())
};

// Visitors API
export const visitorAPI = {
  getAll: () => api.get('/visitors'),
  checkIn: (data: any) => api.post('/visitors', data),
  checkOut: (id: number) => api.put(`/visitors/${id}/checkout`),
};

// Staff API
export const staffAPI = {
  getAll: () => api.get('/staff'),
  create: (data: any) => api.post('/staff', data),
  update: (id: number, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: number) => api.delete(`/staff/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

// Work Orders API
export const workOrderAPI = {
  getAll: () => api.get('/work-orders'),
  create: (data: any) => api.post('/work-orders', data),
  updateStatus: (id: number, data: any) => api.put(`/work-orders/${id}/status`, data),
  delete: (id: number) => api.delete(`/work-orders/${id}`),
};

// Inventory API
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  create: (data: any) => api.post('/inventory', data),
  updateStock: (id: number, data: any) => api.put(`/inventory/${id}/stock`, data),
  getRequests: () => api.get('/inventory/requests'),
  createRequest: (data: any) => api.post('/inventory/requests', data),
  updateRequestStatus: (id: number, data: any) => api.put(`/inventory/requests/${id}`, data),
};

// Labor Payments API
export const laborPaymentAPI = {
  getAll: () => api.get('/labor-payments'),
  create: (data: any) => api.post('/labor-payments', data),
  updateStatus: (id: number, data: any) => api.put(`/labor-payments/${id}/status`, data),
};

// Contact API
export const contactAPI = {
  submitInquiry: (data: any) => api.post('/contact/inquiry', data),
  getInquiries: () => api.get('/contact/inquiries'),
  updateInquiry: (id: number, data: any) => api.put(`/contact/inquiries/${id}`, data),
  submitVacancyApplication: (data: any) => api.post('/contact/vacancy-application', data),
  getVacancyApplications: () => api.get('/contact/vacancy-applications'),
  updateApplication: (id: number, data: any) => api.put(`/contact/vacancy-applications/${id}`, data),
};

export default api;