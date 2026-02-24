
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const payload = await request.json();
  console.log('--- WAREHOUSE WEBHOOK RECEIVED ---');
  console.log(JSON.stringify(payload, null, 2));
  console.log('---------------------------------');
  
  return NextResponse.json({
    status: 200,
    msg: 'dispatched'
  });
}
