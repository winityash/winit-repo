const fs = require('fs');
const path = require('path');

const routes = [
  { name: 'uom-conversion-rules', path: '/api/uom-conversion-rules' },
  { name: 'uom-settings', path: '/api/uom-settings', noPost: true },
  { name: 'quantity-deviation-rules', path: '/api/quantity-deviation-rules', noPost: true, noDelete: true },
  { name: 'site-validation-rules', path: '/api/site-validation-rules' },
  { name: 'business-rules', path: '/api/business-rules' },
  { name: 'escalation-contacts', path: '/api/escalation-contacts' },
  { name: 'escalation-matrix', path: '/api/escalation-matrix' },
  { name: 'system-configuration', path: '/api/system-configuration' },
  { name: 'users', path: '/api/users' },
  { name: 'communication-templates', path: '/api/communication-templates' },
  { name: 'template-placeholders', path: '/api/template-placeholders', noDelete: true, noPut: true }
];

const baseDir = path.join(__dirname, '../app/api/settings');

function generateListRoute(route) {
  return `import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const skip = searchParams.get('skip') || '0';
  const limit = searchParams.get('limit') || '100';
  return proxyRequest('${route.path}?skip=' + skip + '&limit=' + limit);
}

${!route.noPost ? `export async function POST(request) {
  const body = await request.json();
  return proxyRequest('${route.path}', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}` : ''}
`;
}

function generateDetailRoute(route) {
  return `import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request, { params }) {
  return proxyRequest('${route.path}/' + params.id);
}

${!route.noPut ? `export async function PUT(request, { params }) {
  const body = await request.json();
  return proxyRequest('${route.path}/' + params.id, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}` : ''}

${!route.noDelete ? `export async function DELETE(request, { params }) {
  return proxyRequest('${route.path}/' + params.id, {
    method: 'DELETE'
  });
}` : ''}
`;
}

routes.forEach(route => {
  const routeDir = path.join(baseDir, route.name);
  const detailDir = path.join(routeDir, '[id]');

  // Create directories
  if (!fs.existsSync(routeDir)) {
    fs.mkdirSync(routeDir, { recursive: true });
  }
  if (!fs.existsSync(detailDir)) {
    fs.mkdirSync(detailDir, { recursive: true });
  }

  // Write list route
  fs.writeFileSync(
    path.join(routeDir, 'route.js'),
    generateListRoute(route)
  );

  // Write detail route
  fs.writeFileSync(
    path.join(detailDir, 'route.js'),
    generateDetailRoute(route)
  );

  console.log(`✓ Created routes for ${route.name}`);
});

// Special route for system-configuration/key/[key]
const keyDir = path.join(baseDir, 'system-configuration', 'key', '[key]');
if (!fs.existsSync(keyDir)) {
  fs.mkdirSync(keyDir, { recursive: true });
}

fs.writeFileSync(
  path.join(keyDir, 'route.js'),
  `import { proxyRequest } from '@/lib/api/proxyHelper';

export async function GET(request, { params }) {
  return proxyRequest('/api/system-configuration/key/' + params.key);
}
`
);

console.log('✓ All routes generated successfully!');
