/**
 * Health Check API Route
 * 
 * GET /api/health
 * Returns health status of the frontend service
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Access Management Frontend',
    timestamp: new Date().toISOString(),
  });
}
