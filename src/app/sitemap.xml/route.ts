import { NextResponse } from 'next/server';
import { getAppUrl } from '../../lib/env';

export async function GET() {
  const baseUrl = getAppUrl();
  // 301 Permanent Redirect to the unique sitemap for SEO standard compliance
  return NextResponse.redirect(`${baseUrl}/sitemap-primewear.xml`, 301);
}
