import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request, { params }) {
  return proxyRequest('/api/uom-conversion-rules/' + params.id);
}

export async function PUT(request, { params }) {
  const body = await request.json();
  return proxyRequest('/api/uom-conversion-rules/' + params.id, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function DELETE(request, { params }) {
  return proxyRequest('/api/uom-conversion-rules/' + params.id, {
    method: 'DELETE'
  });
}
