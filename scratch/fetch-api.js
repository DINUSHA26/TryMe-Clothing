const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "";

const token = jwt.sign({
  userId: 'cmpmksb7a000lz4hlvy0a5lbb',
  email: 'maniduwallet@gmail.com',
  role: 'CUSTOMER'
}, JWT_SECRET);

fetch('http://localhost:3000/api/orders/cmpmm7z820011yf0x3pwmj71c', {
  headers: {
    'Cookie': `accessToken=${token}`
  }
})
.then(res => res.json())
.then(data => console.log('Response:', JSON.stringify(data, null, 2)))
.catch(console.error);
