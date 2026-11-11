const { supabase } = require('../../config/supabase');

const submitVerification = async (req, res, next) => {
  try {
    const { socialHandle } = req.body;
    const screenshot = req.file ? `/uploads/verification/${req.file.filename}` : req.body.screenshot;
    if (!socialHandle) {
      return res.status(400).json({ success: false, message: 'Social handle is required' });
    }

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .update({
        social_handle: socialHandle,
        verification_screenshot: screenshot || '',
        verification_status: 'pending'
      })
      .eq('id', req.user.id)
      .select('verification_status')
      .single();
    if (error) throw error;

    return res.json({
      success: true,
      message: 'Verification submitted. Awaiting approval',
      data: { status: profile.verification_status }
    });
  } catch (error) {
    return next(error);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('verification_status, verification_code, social_handle')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });

    let verificationCode = profile.verification_code;
    if (!verificationCode) {
      verificationCode = `CREATORSHQ_${Math.floor(1000 + Math.random() * 9000)}`;
      const { error: updateError } = await req.supabase
        .from('profiles')
        .update({ verification_code: verificationCode })
        .eq('id', req.user.id);
      if (updateError) throw updateError;
    }

    return res.json({
      success: true,
      data: {
        verificationStatus: profile.verification_status,
        verificationCode,
        socialHandle: profile.social_handle
      }
    });
  } catch (error) {
    return next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ verification_status: status, is_verified: status === 'verified' })
      .eq('id', req.params.id)
      .select('id, name, email, role, verification_status, is_verified')
      .maybeSingle();
    if (error) throw error;
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({ success: true, message: `Status updated to ${status}`, data: profile });
  } catch (error) {
    return next(error);
  }
};

const generateCode = async (req, res, next) => {
  try {
    const { profileLink } = req.body;
    if (!profileLink) {
      return res.status(400).json({ success: false, message: 'Profile link is required' });
    }

    const code = `CRHQ_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const { error } = await req.supabase
      .from('profiles')
      .update({ verification_code: code, social_handle: profileLink })
      .eq('id', req.user.id);
    if (error) throw error;
    return res.json({ success: true, code });
  } catch (error) {
    return next(error);
  }
};

const checkVerification = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Verification code is required' });

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('verification_code')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    if (!profile || profile.verification_code !== code) {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }

    const { error: updateError } = await req.supabase
      .from('profiles')
      .update({ verification_status: 'verified', is_verified: true })
      .eq('id', req.user.id);
    if (updateError) throw updateError;
    return res.json({ success: true, message: 'Verification successful' });
  } catch (error) {
    return next(error);
  }
};

module.exports = { submitVerification, getStatus, updateStatus, generateCode, checkVerification };
