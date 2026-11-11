const {
  createBrowserBindingSecret,
  createOAuthState,
  getCookieValue,
  isValidOAuthState,
  serializeOAuthStateCookie
} = require('./oauthState');

describe('OAuth browser binding and state', () => {
  const stateCookie = 'creatorshq_google_oauth_state';
  const bindingCookie = 'creatorshq_google_oauth_binding';

  it('creates unpredictable browser binding secrets and bound states', () => {
    const binding = createBrowserBindingSecret();
    const otherBinding = createBrowserBindingSecret();
    const state = createOAuthState(binding);

    expect(binding).toMatch(/^[a-f0-9]{64}$/);
    expect(otherBinding).not.toBe(binding);
    expect(state).toMatch(/^[a-f0-9]{128}$/);
    expect(createOAuthState(otherBinding)).not.toBe(state);
  });

  it('accepts OAuth state only with its original state and browser-binding cookies', () => {
    const binding = createBrowserBindingSecret();
    const state = createOAuthState(binding);
    const cookies = `${stateCookie}=${state}; ${bindingCookie}=${binding}`;

    expect(isValidOAuthState(state, cookies, stateCookie, bindingCookie)).toBe(true);
    expect(isValidOAuthState(createOAuthState(binding), cookies, stateCookie, bindingCookie)).toBe(false);
    expect(isValidOAuthState(state, `${stateCookie}=${state}`, stateCookie, bindingCookie)).toBe(false);
    expect(isValidOAuthState(state, `${stateCookie}=${state}; ${bindingCookie}=${createBrowserBindingSecret()}`, stateCookie, bindingCookie)).toBe(false);
    expect(isValidOAuthState(['unexpected'], cookies, stateCookie, bindingCookie)).toBe(false);
  });

  it('rejects duplicate cookies and serializes production binding cookies securely', () => {
    const binding = createBrowserBindingSecret();
    const duplicateCookie = `${bindingCookie}=${binding}; ${bindingCookie}=${binding}`;

    expect(getCookieValue(duplicateCookie, bindingCookie)).toBeNull();
    expect(serializeOAuthStateCookie(binding, {
      cookieName: bindingCookie,
      path: '/api/auth',
      secure: true,
      sameSite: 'None',
      maxAge: 600
    })).toContain('Path=/api/auth; Max-Age=600; HttpOnly; SameSite=None; Secure');
    expect(serializeOAuthStateCookie('', {
      cookieName: bindingCookie,
      path: '/api/auth',
      secure: true,
      sameSite: 'None',
      maxAge: 0
    })).toContain('Max-Age=0');
  });
});
