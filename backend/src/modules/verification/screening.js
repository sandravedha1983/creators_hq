const URL_FIELDS = ['website', 'portfolio'];
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png'
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const normalizeUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const validEmail = (value) =>
  typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const magicBytesMatch = (file) => {
  if (!Buffer.isBuffer(file.buffer)) return false;
  if (file.mimetype === 'application/pdf') return file.buffer.subarray(0, 1024).includes(Buffer.from('%PDF-', 'ascii'));
  if (file.mimetype === 'image/png') return file.buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (file.mimetype === 'image/jpeg') {
    return file.buffer.length >= 3 &&
      file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
  }
  return false;
};

const validateApplication = (role, data, files) => {
  const errors = [];
  const flags = [];
  const application = { ...data };
  let urlFormatValid = true;
  let emailFormatValid = true;
  const documentChecksValid = files.every(file =>
    ALLOWED_CONTENT_TYPES.has(file.mimetype) &&
    file.size > 0 &&
    file.size <= MAX_FILE_SIZE &&
    magicBytesMatch(file)
  );

  if (role === 'creator' && !application.full_name && application.name) {
    application.full_name = application.name;
  }

  for (const [field, value] of Object.entries(application)) {
    if (typeof value === 'string') {
      application[field] = value.trim();
      if (value.length > 3000) errors.push(`${field.replaceAll('_', ' ')} is too long.`);
    }
  }

  if (!files.length) errors.push('At least one supporting document is required.');
  if (files.length > MAX_FILES) errors.push(`Upload no more than ${MAX_FILES} documents.`);
  for (const file of files) {
    if (!ALLOWED_CONTENT_TYPES.has(file.mimetype)) errors.push('Documents must be PDF, JPEG, or PNG files.');
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) errors.push('Each document must be between 1 byte and 10 MB.');
    if (!magicBytesMatch(file)) errors.push('A document does not match its declared file type.');
  }

  const requiredFields = role === 'creator'
    ? ['full_name', 'niche', 'location']
    : ['company_name', 'business_email', 'website', 'industry', 'description', 'representative_name'];
  let requiredFieldsValid = true;
  for (const field of requiredFields) {
    if (typeof application[field] !== 'string' || !application[field].trim()) {
      requiredFieldsValid = false;
      errors.push(`${field.replaceAll('_', ' ')} is required.`);
    }
  }

  if (role === 'brand' && application.business_email && !validEmail(application.business_email)) {
    emailFormatValid = false;
    errors.push('business email must be valid.');
  } else if (role === 'brand' && application.business_email) {
    application.business_email = application.business_email.toLowerCase();
  }

  for (const field of URL_FIELDS) {
    if (!application[field]) continue;
    const normalized = normalizeUrl(application[field]);
    if (!normalized) {
      urlFormatValid = false;
      errors.push(`${field} must be a valid HTTP(S) URL.`);
    }
    else application[field] = normalized;
  }

  if (application.social_links !== undefined) {
    if (!application.social_links || typeof application.social_links !== 'object' || Array.isArray(application.social_links)) {
      urlFormatValid = false;
      errors.push('social links must be an object of platform URLs.');
    } else {
      const normalizedLinks = {};
      for (const [platform, link] of Object.entries(application.social_links)) {
        if (!link) continue;
        const normalized = normalizeUrl(link);
        if (!normalized) {
          urlFormatValid = false;
          errors.push(`${platform} social link must be a valid HTTP(S) URL.`);
        }
        else normalizedLinks[platform] = normalized;
      }
      application.social_links = normalizedLinks;
    }
  }

  if (role === 'brand' && application.business_email && normalizeUrl(application.website)) {
    const emailDomain = application.business_email.trim().toLowerCase().split('@')[1];
    const websiteDomain = new URL(normalizeUrl(application.website)).hostname.toLowerCase().replace(/^www\./, '');
    if (emailDomain !== websiteDomain) flags.push('business_email_domain_mismatch');
  }

  flags.push('external_identity_and_website_accessibility_not_verified');
  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    application,
    result: {
      outcome: errors.length ? 'needs_attention' : 'manual_review_required',
      flags: [...new Set(flags)],
      checks: {
        required_fields: requiredFieldsValid,
        email_format: emailFormatValid,
        url_format: urlFormatValid,
        document_type_and_size: documentChecksValid,
        website_accessibility: 'not_checked',
        identity_ownership: 'manual_review_required',
        automated_approval: false
      }
    }
  };
};

module.exports = {
  ALLOWED_CONTENT_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
  normalizeUrl,
  validEmail,
  validateApplication
};
