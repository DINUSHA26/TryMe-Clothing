/**
 * Contact Information Filtering Utility
 * Blocks phone numbers, emails, and social media links in chat messages
 * CRITICAL: This is server-side security - prevents contact info sharing
 */

// Sri Lankan phone number patterns
const PHONE_PATTERNS = [
  // Mobile numbers: 0712345678, +94712345678, 712345678
  /(\+94|0)?7[0-9]{8}\b/g,
  // Landline numbers: 0112345678, +94112345678
  /(\+94|0)?[1-9][0-9]{8}\b/g,
  // Formatted numbers: 071-234-5678, 071 234 5678, 071.234.5678
  /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
  // International format with spaces: +94 71 234 5678
  /\+94\s*\d{2}\s*\d{3}\s*\d{4}/g,
];

// Email patterns
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;

// Social media patterns (URLs and handles)
const SOCIAL_PATTERNS = [
  // Facebook
  /(facebook\.com|fb\.com|fb\.me)\/[\w.]+/gi,
  /(facebook\.com|fb\.com|fb\.me)\/[\w.]+/gi,
  // Instagram
  /(instagram\.com|instagr\.am)\/[\w.]+/gi,
  // Twitter/X
  /(twitter\.com|x\.com)\/[\w]+/gi,
  // WhatsApp
  /(whatsapp\.com|wa\.me|chat\.whatsapp\.com)\/[\w]+/gi,
  /(wa\.link|whatsapp\.link)\/[\w]+/gi,
  // LinkedIn
  /(linkedin\.com\/in|lnkd\.in)\/[\w-]+/gi,
  // Telegram
  /(t\.me|telegram\.me)\/[\w]+/gi,
  // Viber
  /(viber\.com|vb\.me)\/[\w]+/gi,
  // Generic @handles (may produce false positives, but safer to block)
  /@[a-zA-Z0-9_]{3,}/g,
  // TikTok
  /tiktok\.com\/@[\w]+/gi,
  // YouTube
  /youtube\.com\/(c|channel|user)\/[\w-]+/gi,
];

// Contact sharing phrases
const CONTACT_PHRASES = [
  /call\s+me/gi,
  /contact\s+me/gi,
  /my\s+number/gi,
  /my\s+email/gi,
  /my\s+phone/gi,
  /whatsapp\s+me/gi,
  /dm\s+me/gi,
  /text\s+me/gi,
  /message\s+me\s+on/gi,
  /add\s+me\s+on/gi,
  /reach\s+me\s+at/gi,
  /email\s+me\s+at/gi,
];

/**
 * Violation types
 */
export type ViolationType = 'phone' | 'email' | 'social' | 'phrase';

/**
 * Individual violation details
 */
export interface ContactViolation {
  type: ViolationType;
  matched: string; // Original matched text
  pattern: string; // Pattern description
}

/**
 * Filter result
 */
export interface FilterResult {
  isClean: boolean; // True if no violations found
  filteredContent: string; // Content with blocked items replaced
  violations: ContactViolation[]; // Detailed violation info
  hasBlockedContent: boolean; // True if content was modified
}

/**
 * Filter contact information from message content
 * Returns filtered content and violation details
 */
export function filterContactInfo(content: string): FilterResult {
  let filteredContent = content;
  const violations: ContactViolation[] = [];

  // 1. Filter phone numbers
  PHONE_PATTERNS.forEach((pattern, index) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        violations.push({
          type: 'phone',
          matched: match,
          pattern: `Phone pattern ${index + 1}`,
        });
        filteredContent = filteredContent.replace(match, '[PHONE_BLOCKED]');
      });
    }
  });

  // 2. Filter email addresses
  const emailMatches = content.match(EMAIL_PATTERN);
  if (emailMatches) {
    emailMatches.forEach((match) => {
      violations.push({
        type: 'email',
        matched: match,
        pattern: 'Email address',
      });
      filteredContent = filteredContent.replace(match, '[EMAIL_BLOCKED]');
    });
  }

  // 3. Filter social media URLs and handles
  SOCIAL_PATTERNS.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        violations.push({
          type: 'social',
          matched: match,
          pattern: pattern.toString(),
        });
        filteredContent = filteredContent.replace(match, '[SOCIAL_BLOCKED]');
      });
    }
  });

  // 4. Detect contact phrases (flag only, don't replace)
  CONTACT_PHRASES.forEach((pattern) => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach((match) => {
        violations.push({
          type: 'phrase',
          matched: match,
          pattern: pattern.toString(),
        });
      });
    }
  });

  // Determine if content was actually blocked (not just flagged)
  const hasBlockedContent = violations.some((v) => v.type !== 'phrase');

  return {
    isClean: violations.length === 0,
    filteredContent: hasBlockedContent ? filteredContent : content,
    violations,
    hasBlockedContent,
  };
}

/**
 * Client-side pre-send validation
 * Returns error message if content has blocked items, null if clean
 */
export function validateMessageContent(content: string): string | null {
  const result = filterContactInfo(content);

  if (!result.isClean) {
    const violationTypes = new Set(result.violations.map((v) => v.type));
    const blocked = Array.from(violationTypes)
      .filter((type) => type !== 'phrase')
      .join(', ');

    if (blocked) {
      return `Your message contains blocked content (${blocked}). Please remove contact information and try again.`;
    }

    // If only phrases detected, show warning but allow sending
    if (violationTypes.has('phrase')) {
      return `Warning: Your message may be attempting to share contact information. Please ensure you're not sharing phone numbers, emails, or social media handles.`;
    }
  }

  return null; // Clean message
}

/**
 * Get human-readable violation summary
 */
export function getViolationSummary(violations: ContactViolation[]): string {
  if (violations.length === 0) return 'No violations';

  const counts = violations.reduce(
    (acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    },
    {} as Record<ViolationType, number>
  );

  const parts: string[] = [];
  if (counts.phone) parts.push(`${counts.phone} phone number(s)`);
  if (counts.email) parts.push(`${counts.email} email(s)`);
  if (counts.social) parts.push(`${counts.social} social media link(s)`);
  if (counts.phrase) parts.push(`${counts.phrase} contact phrase(s)`);

  return `Blocked: ${parts.join(', ')}`;
}
