const client_id = "1000.9WJ01ZUUBQ6TT6CA0RPSLM5X31ZM2N";
const client_secret = "0fd6f917a90e06164420d6cb376c0064f107b60d18";
const code = "1000.683f352e6ad07d970d38369f4c84104b.b69c598f8af8f18a0d4fed751be80ce9";
const redirect_uri = "https://tryme.lk/zoho-callback";

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
