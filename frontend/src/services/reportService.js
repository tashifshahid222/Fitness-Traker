import api from './api';

const get = (type, params) => api.get(`/reports/${type}`, { params }).then((res) => res.data);

async function exportFile(type, format) {
  const path = format === 'pdf' ? '/reports/export/pdf' : '/reports/export/csv';
  const res = await api.get(path, {
    params: { type },
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = format === 'pdf' ? `${type}-report.pdf` : `${type}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default { get, exportFile };