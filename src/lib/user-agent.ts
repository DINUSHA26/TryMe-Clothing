/**
 * Utility to parse User-Agent headers into readable browser, OS, and device details.
 */
export interface ParsedUserAgent {
  browser: string;
  os: string;
  device: string;
  deviceType: "desktop" | "mobile" | "tablet";
}

export function parseUserAgent(uaString: string | null | undefined): ParsedUserAgent {
  if (!uaString) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
      device: "Unknown Device",
      deviceType: "desktop",
    };
  }

  const ua = uaString;

  // Detect OS
  let os = "Unknown OS";
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.2/i.test(ua)) os = "Windows 8";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) {
    const match = ua.match(/Mac OS X ([\d_]+)/);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (/iPhone/i.test(ua)) {
    const match = ua.match(/OS ([\d_]+)/);
    os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  } else if (/iPad/i.test(ua)) {
    const match = ua.match(/OS ([\d_]+)/);
    os = match ? `iPadOS ${match[1].replace(/_/g, ".")}` : "iPadOS";
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android ([\d.]+)/);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  }

  // Detect Browser
  let browser = "Unknown Browser";
  if (/Edg\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/Edg\/([\d.]+)/i);
    browser = `Edge ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/Chrome\/([\d.]+)/i.test(ua) && !/Chromium|OPR/i.test(ua)) {
    const match = ua.match(/Chrome\/([\d.]+)/i);
    browser = `Chrome ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/Firefox\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/Firefox\/([\d.]+)/i);
    browser = `Firefox ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/Safari\/([\d.]+)/i.test(ua) && !/Chrome|Android/i.test(ua)) {
    const match = ua.match(/Version\/([\d.]+)/i);
    browser = `Safari ${match ? match[1].split(".")[0] : ""}`.trim();
  } else if (/OPR\/([\d.]+)/i.test(ua)) {
    const match = ua.match(/OPR\/([\d.]+)/i);
    browser = `Opera ${match ? match[1].split(".")[0] : ""}`.trim();
  }

  // Detect Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/iPad|Tablet/i.test(ua)) {
    deviceType = "tablet";
  } else if (/iPhone|Android.*Mobile|Mobile/i.test(ua)) {
    deviceType = "mobile";
  }

  // Readable summary device name
  let device = `${browser} on ${os}`;
  if (deviceType === "mobile" && /iPhone/i.test(ua)) {
    device = `iPhone (${browser})`;
  } else if (deviceType === "tablet" && /iPad/i.test(ua)) {
    device = `iPad (${browser})`;
  } else if (deviceType === "mobile" && /Android/i.test(ua)) {
    device = `Android (${browser})`;
  }

  return {
    browser,
    os,
    device,
    deviceType,
  };
}
