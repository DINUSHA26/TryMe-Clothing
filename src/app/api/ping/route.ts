export const dynamic = "force-dynamic";

export function GET() {
  return new Response("PONG_TEST_OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}
