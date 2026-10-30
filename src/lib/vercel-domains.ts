/**
 * Vercel Domains API Integration
 * Manages custom domain registration, DNS verification, and automatic SSL for multi-tenant vendor storefronts.
 */

const VERCEL_API_URL = "https://api.vercel.com";
const VERCEL_AUTH_TOKEN = process.env.VERCEL_AUTH_TOKEN || process.env.AUTH_BEARER_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: number | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  verified: boolean;
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
  error?: {
    code: string;
    message: string;
  };
}

interface VercelDomainConfigResponse {
  configuredBy?: "CNAME" | "A" | "http-01" | "dns-01" | null;
  nameservers?: string[];
  serviceType?: "external" | "zeit.world" | "na";
  cnames?: string[];
  aValues?: string[];
  conflicts?: any[];
  acceptedChallenges?: string[];
  misconfigured: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Clean domain input (lowercase, strip protocol, trailing slashes, and port)
 */
export function cleanDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .trim();
}

/**
 * Add a custom domain to the Vercel project
 */
export async function addDomainToVercel(domain: string): Promise<{ success: boolean; data?: VercelDomainResponse; error?: string }> {
  const sanitized = cleanDomain(domain);
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    console.warn("Vercel credentials not set; simulating domain addition in sandbox mode.");
    return {
      success: true,
      data: {
        name: sanitized,
        apexName: sanitized.replace(/^www\./, ""),
        projectId: "sandbox-project",
        verified: false,
        verification: [
          {
            type: "CNAME",
            domain: sanitized,
            value: "cname.vercel-dns.com",
            reason: "PENDING",
          },
        ],
      },
    };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(`${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains${teamParam}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: sanitized }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || "Failed to register domain on Vercel" };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error("Error adding domain to Vercel:", err);
    return { success: false, error: err.message || "Failed to connect to Vercel Domains API" };
  }
}

/**
 * Verify DNS configuration of a domain on Vercel
 */
export async function verifyDomainOnVercel(domain: string): Promise<{ verified: boolean; error?: string }> {
  const sanitized = cleanDomain(domain);
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    return { verified: false, error: "Vercel credentials not configured" };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(
      `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${sanitized}/verify${teamParam}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { verified: false, error: data.error?.message || "Verification failed" };
    }
    return { verified: Boolean(data.verified) };
  } catch (err: any) {
    console.error("Error verifying domain on Vercel:", err);
    return { verified: false, error: err.message };
  }
}

/**
 * Get domain configuration and SSL verification details
 */
export async function getDomainConfig(domain: string): Promise<{
  misconfigured: boolean;
  configuredBy?: "CNAME" | "A" | null;
  sslActive: boolean;
  error?: string;
}> {
  const sanitized = cleanDomain(domain);
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    return { misconfigured: true, sslActive: false };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(
      `${VERCEL_API_URL}/v6/domains/${sanitized}/config${teamParam}`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        },
      }
    );

    const data: VercelDomainConfigResponse = await res.json();
    if (!res.ok) {
      return { misconfigured: true, sslActive: false, error: data.error?.message };
    }

    return {
      misconfigured: Boolean(data.misconfigured),
      configuredBy: data.configuredBy || null,
      sslActive: !data.misconfigured,
    };
  } catch (err: any) {
    console.error("Error checking domain config on Vercel:", err);
    return { misconfigured: true, sslActive: false, error: err.message };
  }
}

/**
 * Remove a custom domain from Vercel
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
  const sanitized = cleanDomain(domain);
  if (!VERCEL_AUTH_TOKEN || !VERCEL_PROJECT_ID) {
    return { success: true };
  }

  try {
    const teamParam = VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : "";
    const res = await fetch(
      `${VERCEL_API_URL}/v9/projects/${VERCEL_PROJECT_ID}/domains/${sanitized}${teamParam}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${VERCEL_AUTH_TOKEN}`,
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || "Failed to remove domain from Vercel" };
    }
    return { success: true };
  } catch (err: any) {
    console.error("Error removing domain from Vercel:", err);
    return { success: false, error: err.message };
  }
}
