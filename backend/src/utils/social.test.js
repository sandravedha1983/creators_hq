const { extractUsername, profileUrl } = require('./social');

describe('social profile URL handling', () => {
  it('extracts usernames only from supported HTTPS profile hosts', () => {
    expect(extractUsername('https://www.instagram.com/creator/', 'instagram')).toBe('creator');
    expect(extractUsername('https://www.linkedin.com/in/creator/', 'linkedin')).toBe('creator');
    expect(extractUsername('https://evil.com/instagram.com/creator/', 'instagram')).toBeNull();
    expect(extractUsername('http://www.instagram.com/creator/', 'instagram')).toBeNull();
    expect(extractUsername('https://www.instagram.com/creator/', 'unsupported')).toBeNull();
  });

  it('constructs profile URLs from encoded usernames', () => {
    expect(profileUrl('instagram', 'creator name')).toBe('https://www.instagram.com/creator%20name/');
  });
});
