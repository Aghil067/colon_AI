import axios from 'axios';

export async function downloadReport(id) {
  const { data } = await axios.get(`/api/assessments/${id}/report`, { responseType: 'blob' });
  downloadFile(data, `ColonAI_Assessment_${id}.pdf`);
}

export function downloadFile(file, name) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function formatDate(value) {
  return new Date(value).toLocaleString();
}

export function labelName(label) {
  return label?.replaceAll('-', ' ') || 'Classification unavailable';
}

export function sourceName(source) {
  return source === 'public-research' ? 'Public research image (declared)' : 'User-supplied image';
}
