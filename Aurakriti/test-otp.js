import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// Import models
const MONGODB_URI = 'mongodb://vikramjeetfilms:Vikram2026@ac-2wyoavy-shard-00-00.9wtwozy.mongodb.net:27017,ac-2wyoavy-shard-00-01.9wtwozy.mongodb.net:27017,ac-2wyoavy-shard-00-02.9wtwozy.mongodb.net:27017/?ssl=true&replicaSet=atlas-7te2z5-shard-0&authSource=admin&appName=hackathon';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, lowercase: true },
  password: String,
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
});

const otpSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  codeHash: String,
  purpose: String,
  expiresAt: Date,
  sentAt: Date,
  isUsed: Boolean,
  attempts: Number,
});

const User = mongoose.model('User', userSchema);
const Otp = mongoose.model('OtpTest', otpSchema);

async function testOtpCreation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Create test user
    console.log('\nCreating test user...');
    const testEmail = `test-${Date.now()}@example.com`;
    const user = await User.create({
      name: 'Test User',
      email: testEmail,
      password: 'hashedPassword123',
      role: 'user',
    });
    console.log('✓ User created:', user._id);

    // Create test OTP
    console.log('\nCreating OTP record...');
    const otp = Math.random().toString().slice(2, 8);
    console.log('Generated OTP:', otp);

    const codeHash = await bcryptjs.hash(otp, 12);
    console.log('Hashed OTP:', codeHash);

    const now = new Date();
    const otpRecord = await Otp.create({
      user: user._id,
      codeHash,
      purpose: 'verification',
      sentAt: now,
      expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
      isUsed: false,
      attempts: 0,
    });
    console.log('✓ OTP record created:', otpRecord._id);

    // Verify OTP was saved
    console.log('\nVerifying OTP record in database...');
    const savedOtp = await Otp.findById(otpRecord._id);
    if (savedOtp) {
      console.log('✓ OTP record found in DB:', savedOtp._id);
    } else {
      console.log('✗ OTP record NOT found in DB');
    }

    // Query by user and purpose
    console.log('\nQuerying OTP by user and purpose...');
    const queriedOtp = await Otp.findOne({ user: user._id, purpose: 'verification', isUsed: false });
    if (queriedOtp) {
      console.log('✓ OTP found by query:', queriedOtp._id);
    } else {
      console.log('✗ OTP NOT found by query');
    }

    // Test OTP verification
    console.log('\nTesting OTP verification...');
    const isValid = await bcryptjs.compare(otp, queriedOtp.codeHash);
    console.log('✓ OTP verification:', isValid ? 'VALID' : 'INVALID');

    // Cleanup
    console.log('\nCleaning up test data...');
    await User.deleteOne({ _id: user._id });
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log('✓ Test data cleaned up');

    console.log('\n✓ ALL TESTS PASSED');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error);
    process.exit(1);
  }
}

testOtpCreation();
