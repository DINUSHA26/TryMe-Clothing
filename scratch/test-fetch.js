const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

const token = jwt.sign({
  userId: 'cmnh530ky0000i46zembj0095',
  email: 'admin@fashiondora.com',
  role: 'ADMIN'
}, JWT_SECRET, { expiresIn: '7d' });

console.log("Generated Token:", token);

const disputeId = "disp_hi6gp60ts3a";
const url = `http://localhost:3000/api/admin/disputes/${disputeId}`;
console.log("Fetching url:", url);

fetch(url, {
  headers: {
    Cookie: `accessToken=${token}`
  }
})
.then(async (response) => {
  console.log("STATUS:", response.status);
  const text = await response.text();
  console.log("BODY:", text);
})
.catch(console.error);
