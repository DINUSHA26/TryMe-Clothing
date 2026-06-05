require('dotenv').config();

const client_id = process.env.ZOHO_CLIENT_ID;
const client_secret = process.env.ZOHO_CLIENT_SECRET;
const code = process.env.ZOHO_AUTH_CODE;
const redirect_uri = process.env.ZOHO_REDIRECT_URI;

async function exchange() {
  const url = "https://accounts.zoho.com/oauth/v2/token";
  const params = new URLSearchParams({
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code"
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error exchanging code:", err);
  }
}

exchange();
