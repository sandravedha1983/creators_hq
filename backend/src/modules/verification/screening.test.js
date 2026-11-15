const { validateApplication } = require('./screening');

const creator = {
  full_name: 'Creator Example',
  niche: 'Cooking',
  location: 'Toronto',
  website: 'https://creator.example',
  portfolio: 'https://creator.example/work',
  social_links: { instagram: 'https://instagram.com/creator' }
};

const pdf = (overrides = {}) => ({
  originalname: 'evidence.pdf',
  mimetype: 'application/pdf',
  size: 12,
  buffer: Buffer.from('%PDF-1.7\n', 'ascii'),
  ...overrides
});

describe('verification screening', () => {
  it('accepts complete Creator applications but never auto-approves', () => {
    const result = validateApplication('creator', creator, [pdf()]);

    expect(result.valid).toBe(true);
    expect(result.result.outcome).toBe('manual_review_required');
    expect(result.result.checks.automated_approval).toBe(false);
    expect(result.result.flags).toContain('external_identity_and_website_accessibility_not_verified');
  });

  it('rejects spoofed document types even when the file extension or MIME claims PDF', () => {
    const result = validateApplication('creator', creator, [pdf({ buffer: Buffer.from('not a pdf') })]);

    expect(result.valid).toBe(false);
    expect(result.result.checks.document_type_and_size).toBe(false);
    expect(result.errors).toContain('A document does not match its declared file type.');
  });

  it('flags mismatched Brand email and website domains for Admin review', () => {
    const result = validateApplication('brand', {
      company_name: 'Example Inc',
      business_email: 'CONTACT@EXAMPLE.ORG',
      website: 'https://different.example',
      industry: 'Retail',
      description: 'A company description',
      representative_name: 'Representative'
    }, [pdf()]);

    expect(result.valid).toBe(true);
    expect(result.application.business_email).toBe('contact@example.org');
    expect(result.result.flags).toContain('business_email_domain_mismatch');
  });

  it('rejects malformed or non-HTTP URLs', () => {
    const result = validateApplication('creator', { ...creator, website: 'javascript:alert(1)' }, [pdf()]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('website must be a valid HTTP(S) URL.');
  });
});
