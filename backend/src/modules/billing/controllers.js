const { supabase } = require('../../config/supabase');

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_')) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'inr', plan = 'pro' } = req.body;
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    if (plan !== 'pro') return res.status(400).json({ success: false, message: 'Unsupported subscription plan.' });
    if (!stripe) {
      return res.status(503).json({ success: false, message: 'Payments are not configured.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: currency.toLowerCase(),
      metadata: { userId: req.user.id, plan }
    });
    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    return next(error);
  }
};

const processPayment = async (req, res, next) => {
  try {
    const { amount, plan = 'pro', currency = 'INR', paymentToken } = req.body;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    if (plan !== 'pro') return res.status(400).json({ success: false, message: 'Unsupported subscription plan.' });
    if (!stripe || typeof paymentToken !== 'string' || !paymentToken.startsWith('pi_')) {
      return res.status(503).json({ success: false, message: 'A verified payment authorization is required.' });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentToken);
    if (
      intent.status !== 'succeeded' ||
      intent.amount !== Math.round(numericAmount * 100) ||
      intent.currency.toLowerCase() !== currency.toLowerCase() ||
      intent.metadata.userId !== req.user.id ||
      intent.metadata.plan !== plan
    ) {
      return res.status(400).json({ success: false, message: 'Payment authorization does not match this account or purchase.' });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('transactions')
      .insert({
        sender_id: req.user.id,
        recipient_id: req.user.id,
        amount: numericAmount,
        currency: currency.toUpperCase(),
        status: 'paid'
      })
      .select()
      .single();
    if (paymentError) throw paymentError;

    const { error: profileError } = await req.supabase
      .from('profiles')
      .update({ plan: plan.toLowerCase() })
      .eq('id', req.user.id);
    if (profileError) throw profileError;

    return res.status(201).json({
      success: true,
      message: `Subscription successfully upgraded to ${plan.toUpperCase()}`,
      plan: plan.toLowerCase(),
      data: payment
    });
  } catch (error) {
    return next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { data: history, error } = await req.supabase
      .from('transactions')
      .select('*')
      .or(`sender_id.eq.${req.user.id},recipient_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, data: history || [] });
  } catch (error) {
    return next(error);
  }
};

module.exports = { processPayment, createPaymentIntent, getHistory };
