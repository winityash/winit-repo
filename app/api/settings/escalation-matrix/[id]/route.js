import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request, { params }) {
  return proxyRequest('/api/escalation-matrix/' + params.id);
}

export async function PUT(request, { params }) {
  const body = await request.json();
  return proxyRequest('/api/escalation-matrix/' + params.id, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function DELETE(request, { params }) {
  return proxyRequest('/api/escalation-matrix/' + params.id, {
    method: 'DELETE'
  });
}
