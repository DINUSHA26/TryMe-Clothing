const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    const res = await fetch('http://localhost:3000/api/products?vendorId=cmnh6fauv0005rpeuoxndo8i8');
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Success:", data.success);
    console.log("Returned products count:", data.data?.products?.length);
    console.log("Products:", JSON.stringify(data.data?.products, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testAPI();
