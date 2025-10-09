# LPO Analysis Dashboard

A Next.js dashboard application for monitoring email processing system performance with real-time metrics and analytics.

## Features

- Real-time processing status monitoring
- Performance metrics and KPI tracking
- Interactive bar charts and data tables
- Email processing details modal
- Responsive design with professional business styling

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# API Configuration
API_BASE_URL=https://your-api-domain.com
API_TIMEOUT=10000

# Dashboard API Endpoints
DASHBOARD_PERFORMANCE_ENDPOINT=/dashboard/performance-chart
QUEUE_STATUS_ENDPOINT=/queue/status

# API Headers
NGROK_SKIP_BROWSER_WARNING=true

# Default Values
DEFAULT_METRIC_TYPE=processing_time
DEFAULT_DAYS=7
DEFAULT_INCLUDE_EMAIL_DETAILS=true

# Environment
NODE_ENV=development

# Refresh Intervals (in milliseconds)
CHART_REFRESH_INTERVAL=30000
TABLE_REFRESH_INTERVAL=60000
```

### Public Environment Variables (Optional)

For client-side configuration, you can also add these to `.env.local`:

```env
# Client-side refresh intervals
NEXT_PUBLIC_CHART_REFRESH_INTERVAL=30000
NEXT_PUBLIC_TABLE_REFRESH_INTERVAL=60000
```

### Environment Variable Descriptions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_BASE_URL` | Base URL for the backend API | - | Yes |
| `API_TIMEOUT` | Request timeout in milliseconds | 10000 | No |
| `DASHBOARD_PERFORMANCE_ENDPOINT` | Performance metrics endpoint | `/dashboard/performance-chart` | No |
| `QUEUE_STATUS_ENDPOINT` | Queue status endpoint | `/queue/status` | No |
| `NGROK_SKIP_BROWSER_WARNING` | Skip ngrok browser warning | `true` | No |
| `DEFAULT_METRIC_TYPE` | Default metric type for queries | `processing_time` | No |
| `DEFAULT_DAYS` | Default number of days for data | `7` | No |
| `DEFAULT_INCLUDE_EMAIL_DETAILS` | Include email details by default | `true` | No |
| `CHART_REFRESH_INTERVAL` | Bar chart refresh interval (ms) | 30000 | No |
| `TABLE_REFRESH_INTERVAL` | Table data refresh interval (ms) | 60000 | No |

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd piechar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local .env.local.example
   # Edit .env.local with your actual API endpoints
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

The application connects to the following backend endpoints:

- `GET /queue/status` - Fetches current queue processing status
- `GET /dashboard/performance-chart` - Fetches performance metrics with optional query parameters:
  - `metric_type` - Type of metric to retrieve
  - `days` - Number of days of historical data
  - `include_email_details` - Whether to include detailed email information

## Error Handling

- All API requests have configurable timeouts
- Automatic retry logic for failed requests
- Graceful error display to users
- Detailed error logging for debugging

## Development

- Built with Next.js 15 and React 18
- Styled with Tailwind CSS
- Charts powered by Recharts
- Animations using Framer Motion

## Production Deployment

1. Set environment variables in your hosting platform
2. Build the application: `npm run build`
3. Start the production server: `npm start`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting

### Common Issues

1. **API_BASE_URL not configured**: Ensure your `.env.local` file exists and contains the correct API base URL
2. **Request timeouts**: Increase the `API_TIMEOUT` value if requests are taking longer than expected
3. **CORS errors**: Ensure your backend API includes appropriate CORS headers
4. **Data not loading**: Check browser console and server logs for detailed error messages
