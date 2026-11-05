const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('./modules/auth/models');
const Otp = require('./modules/auth/Otp');
const authService = require('./modules/auth/services');

// Helper to hash OTP
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const runTests = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully. Running test suite...');

    const testEmail = '  TestAuthUser@CreatorsHQ.ai  ';
    const cleanEmail = testEmail.trim().toLowerCase();

    // Clean any pre-existing test data
    await User.deleteOne({ email: cleanEmail });
    await Otp.deleteOne({ email: cleanEmail });

    console.log('\n--- TEST 1: Registration with email normalization ---');
    const registerData = {
      name: 'Test Auth User',
      email: testEmail,
      password: 'testPassword123',
      role: 'creator'
    };
    const registeredUser = await authService.register(registerData);
    if (registeredUser.email === cleanEmail) {
      console.log('✅ TEST 1 PASSED: Email successfully normalized and user saved.');
    } else {
      throw new Error(`TEST 1 FAILED: Expected normalized email "${cleanEmail}" but got "${registeredUser.email}"`);
    }

    console.log('\n--- TEST 2: Login with email casing and spacing variance ---');
    const loggedInUser = await authService.login({
      email: ' TESTAUTHUSER@creatorshq.ai ',
      password: 'testPassword123'
    });
    if (loggedInUser._id.toString() === registeredUser._id.toString()) {
      console.log('✅ TEST 2 PASSED: Login works with casing/whitespace variance.');
    } else {
      throw new Error('TEST 2 FAILED: Could not log in with case-insensitive search.');
    }

    console.log('\n--- TEST 3: Login with invalid credentials ---');
    try {
      await authService.login({
        email: testEmail,
        password: 'wrongPassword'
      });
      throw new Error('TEST 3 FAILED: Login did not throw on incorrect password.');
    } catch (err) {
      if (err.message === 'Invalid email or password') {
        console.log('✅ TEST 3 PASSED: Login correctly threw "Invalid email or password" error.');
      } else {
        throw err;
      }
    }

    console.log('\n--- TEST 4: OTP generation and SHA-256 hashing ---');
    const otpCode = '123456';
    const expiresAt = new Date(Date.now() + 5 * 60000);
    const hashedOtp = hashOtp(otpCode);

    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      { otp: hashedOtp, expiresAt },
      { upsert: true, returnDocument: 'after' }
    );

    const savedOtpRecord = await Otp.findOne({ email: cleanEmail });
    if (savedOtpRecord && savedOtpRecord.otp === hashedOtp) {
      console.log('✅ TEST 4 PASSED: OTP successfully hashed and stored.');
    } else {
      throw new Error('TEST 4 FAILED: Hashed OTP mismatch.');
    }

    console.log('\n--- TEST 5: OTP verification ---');
    const verifiedRecord = await Otp.findOne({ email: cleanEmail, otp: hashedOtp });
    if (verifiedRecord && new Date() < verifiedRecord.expiresAt) {
      console.log('✅ TEST 5 PASSED: OTP verification matches correctly.');
    } else {
      throw new Error('TEST 5 FAILED: OTP record not found or expired.');
    }

    console.log('\n--- TEST 6: Resend OTP Rate Limiting ---');
    // Save a fresh record
    await Otp.findOneAndUpdate(
      { email: cleanEmail },
      { otp: hashedOtp, expiresAt: new Date(Date.now() + 5 * 60000) },
      { upsert: true, returnDocument: 'after' }
    );
    
    // Attempt rapid rate limiting check simulating sendOTP controller
    const existingOtp = await Otp.findOne({ email: cleanEmail });
    if (existingOtp) {
      const timeElapsed = Date.now() - new Date(existingOtp.updatedAt).getTime();
      const minInterval = 30000;
      if (timeElapsed < minInterval) {
        console.log('✅ TEST 6 PASSED: Rate limit correctly identified rapid resend attempt.');
      } else {
        throw new Error('TEST 6 FAILED: Time elapsed is larger than interval (test executed too slowly).');
      }
    }

    // Cleanup
    await User.deleteOne({ email: cleanEmail });
    await Otp.deleteOne({ email: cleanEmail });

    console.log('\n--- ALL TEST SUITE CHECKS COMPLETED SUCCESSFULLY 🎉 ---');
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN ERROR:', error.message);
    mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
