import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

export const appsApi = {
  list: () => api.get('/apps').then(r => r.data),
  create: (d: any) => api.post('/apps', d).then(r => r.data),
  delete: (id: string) => api.delete(`/apps/${id}`),
  restart: (id: string) => api.post(`/apps/${id}/restart`).then(r => r.data),
  stop: (id: string) => api.post(`/apps/${id}/stop`).then(r => r.data),
};
export const deploysApi = {
  list: (appId?: string) => api.get('/deploys', { params: { appId } }).then(r => r.data),
  create: (d: any) => api.post('/deploys', d).then(r => r.data),
  rollback: (id: string) => api.post(`/deploys/${id}/rollback`).then(r => r.data),
};
export const pipelinesApi = {
  list: () => api.get('/pipelines').then(r => r.data),
  create: (d: any) => api.post('/pipelines', d).then(r => r.data),
  cancel: (id: string) => api.post(`/pipelines/${id}/cancel`).then(r => r.data),
};
export const metricsApi = { current: () => api.get('/metrics/current').then(r => r.data) };
export const logsApi = { list: (p?: any) => api.get('/logs', { params: p }).then(r => r.data) };
