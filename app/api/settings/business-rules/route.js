import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const limit = searchParams.get('limit') || '100';
  return proxyRequest('/api/business-rules?skip=' + skip + '&limit=' + limit);
}

export async function POST(request) {
  const body = await request.json();
  return proxyRequest('/api/business-rules', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}
