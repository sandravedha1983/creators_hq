const { extractUsername } = require('./social');

describe('social profile URL handling', () => {
  it('extracts usernames only from supported HTTPS profile hosts', () => {
    expect(extractUsername('https://www.instagram.com/creator/', 'instagram')).toBe('creator');
    expect(extractUsername('https://www.linkedin.com/in/creator/', 'linkedin')).toBe('creator');
    expect(extractUsername('https://www.facebook.com/creator/', 'facebook')).toBe('creator');
    expect(extractUsername('https://m.facebook.com/profile.php?id=1234', 'facebook')).toBe('1234');
    expect(extractUsername('https://evil.com/instagram.com/creator/', 'instagram')).toBeNull();
    expect(extractUsername('https://evil.com/creator/', 'facebook')).toBeNull();
    expect(extractUsername('http://www.instagram.com/creator/', 'instagram')).toBeNull();
    expect(extractUsername('https://www.instagram.com/creator/', 'unsupported')).toBeNull();
  });
});
