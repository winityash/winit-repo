import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const limit = searchParams.get('limit') || '100';
  return proxyRequest('/api/uom-settings?skip=' + skip + '&limit=' + limit);
}


