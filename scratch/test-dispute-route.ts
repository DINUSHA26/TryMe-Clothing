import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/admin/disputes/[id]/route';

async function test() {
  const req = new NextRequest('http://localhost:3000/api/admin/disputes/disp_hi6gp60ts3a', {
    headers: {
      'X-User-Id': 'cmnh530ky0000i46zembj0095',
      'X-User-Role': 'ADMIN',
      'X-User-Email': 'admin@fashiondora.com'
    }
  });

  try {
    const params = Promise.resolve({ id: 'Disp_hi6gp60ts3a' });
    const response = await GET(req, { params });
    console.log("STATUS:", response.status);
    const body = await response.json();
    console.log("BODY:", JSON.stringify(body, null, 2));
  } catch (error) {
    console.error("ROUTE ERROR:", error);
  }
}

test();
