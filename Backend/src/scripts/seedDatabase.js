/**
 * seedDatabase.js
 *
 * Database initialization and schema verification script for UniShowcase.
 * 
 * Usage:
 *   node src/scripts/seedDatabase.js
 *
 * Actions:
 *   1. Verifies database connectivity.
 *   2. Ensures indexes for User, Project, Invitation, Like, Follower, and Notification models.
 *   3. Seeds an initial Administrator user if none exists.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Project = require('../models/Project');
const Invitation = require('../models/Invitation');
const Like = require('../models/Like');
const Follower = require('../models/Follower');
const Notification = require('../models/Notification');

const ADMIN_NAME = process.env.INITIAL_ADMIN_NAME || 'System Administrator';
const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@university.edu';

async function initDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/net_centric_app';
  console.log('🚀 Starting UniShowcase Database Initialization...');
  console.log(`📡 Connecting to MongoDB: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully.');

    // 1. Sync & create indexes
    console.log('📦 Building collection indexes...');
    await Promise.all([
      User.init(),
      Project.init(),
      Invitation.init(),
      Like.init(),
      Follower.init(),
      Notification.init()
    ]);
    console.log('✅ All model indexes synchronized.');

    // 2. Ensure initial Admin account exists
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });
    if (!adminExists) {
      const admin = await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'Admin',
        isVerified: true,
        profilePicture: ''
      });
      console.log(`👑 Initial Administrator created: ${admin.email} (${admin.name})`);
    } else {
      console.log(`ℹ️ Administrator account already exists: ${adminExists.email}`);
    }

    // 3. Count documents
    const [userCount, projectCount, inviteCount] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Invitation.countDocuments()
    ]);

    console.log('\n📊 Database Status Overview:');
    console.log(`   - Users:        ${userCount}`);
    console.log(`   - Projects:     ${projectCount}`);
    console.log(`   - Invitations:  ${inviteCount}`);
    console.log('\n✨ Database initialization completed successfully!');

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed.');
    process.exit(0);
  }
}

initDatabase();
