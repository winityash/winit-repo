import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request, { params }) {
  return proxyRequest('/api/system-configuration/key/' + params.key);
}
