const { requireVerified } = require('./requireVerified');

describe('requireVerified', () => {
  it('allows an active verified user', () => {
    const req = { user: { verificationStatus: 'verified', isVerified: true } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireVerified(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each([
    { verificationStatus: 'pending', isVerified: false },
    { verificationStatus: 'verified', isVerified: false },
    { verificationStatus: 'verified', isVerified: true, isSuspended: true },
    { verificationStatus: 'verified', isVerified: true, isBlocked: true }
  ])('rejects unverified or suspended accounts: %o', user => {
    const req = { user };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    requireVerified(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VERIFICATION_REQUIRED' }));
    expect(next).not.toHaveBeenCalled();
  });
});
