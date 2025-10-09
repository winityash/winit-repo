import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_TWO || 'https://e8a4eb9316cc.ngrok-free.app';

export async function GET(request, { params }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-tolerance-rules/${params.id}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price tolerance rule:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch price tolerance rule', error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/price-tolerance-rules/${params.id}`, {
      method: 'PUT',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating price tolerance rule:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to update price tolerance rule', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/price-tolerance-rules/${params.id}`, {
      method: 'DELETE',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting price tolerance rule:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to delete price tolerance rule', error: error.message },
      { status: 500 }
    );
  }
}
