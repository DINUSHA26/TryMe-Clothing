import dotenv from 'dotenv';
dotenv.config();

import { tokenUtils } from '../src/lib/auth';
import { UserRole } from '@prisma/client';

async function main() {
  const token = tokenUtils.generateAccessToken({
    userId: 'cmnh530ky0000i46zembj0095',
    email: 'admin@fashiondora.com',
    role: UserRole.ADMIN
  });

  console.log("Generated Token:", token);

  const disputeId = "disp_hi6gp60ts3a";
  const url = `http://localhost:3000/api/admin/disputes/${disputeId}`;
  console.log("Fetching url:", url);

  const response = await fetch(url, {
    headers: {
      Cookie: `accessToken=${token}`
    }
  });

  console.log("STATUS:", response.status);
  const text = await response.text();
  console.log("BODY:", text);
}

main().catch(console.error);
