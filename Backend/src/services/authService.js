const User = require('../models/User');
const { generateInviteToken, verifyInviteToken, generateUserToken } = require('../utils/inviteGenerator');

class AuthService {
  async generateInviteLink(role = 'Student', email = '', frontendUrl = 'http://localhost:5173') {
    const validRoles = ['Student', 'Recruiter', 'Admin'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    if (!email) {
      throw new Error('Email is required to send an invitation');
    }
    const normalizedEmail = email.toLowerCase().trim();
    const token = generateInviteToken(role, normalizedEmail);
    const inviteLink = `${frontendUrl}/register?inviteToken=${token}`;

    // Create the Invitation record in the DB
    const Invitation = require('../models/Invitation');
    const invitation = await Invitation.create({
      email: normalizedEmail,
      role,
      token,
      status: 'Pending'
    });

    // Send email using mailer
    const { sendInvitationEmail } = require('../utils/mailer');
    let emailResult = {};
    try {
      emailResult = await sendInvitationEmail(normalizedEmail, role, inviteLink);
    } catch (err) {
      console.error('Failed to send nodemailer email, but invitation logged in DB:', err);
    }

    return { 
      token, 
      inviteLink, 
      role, 
      email: normalizedEmail, 
      invitation,
      previewUrl: emailResult.previewUrl 
    };
  }

  validateInvite(token) {
    if (!token) throw new Error('Invitation token is required');
    const decoded = verifyInviteToken(token);
    if (!decoded) throw new Error('Invalid or expired invitation token');
    return decoded;
  }

  async processUserRegistration({ googleId, name, email, profilePicture, inviteToken, mockRole }) {
    if (!email) {
      throw new Error('Email is required for registration/authentication');
    }
    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      // If inviteToken is passed but user already exists, they are trying to register with a used account
      if (inviteToken) {
        throw new Error('This Google account is already registered. Please log in or use a different Google account to register.');
      }
      if (mockRole && process.env.NODE_ENV === 'development') {
        user.role = mockRole;
      }
      user.googleId = googleId || user.googleId;
      user.isVerified = true;
      await user.save();
      return { user, authToken: generateUserToken(user) };
    }

    // New user registration: requires inviteToken validation or mockRole in dev
    let role = 'Student';
    if (inviteToken) {
      const decodedInvite = this.validateInvite(inviteToken);

      // Strict Security Check 1: Ensure invite token email strictly matches Google authenticated email
      if (decodedInvite.email && decodedInvite.email.toLowerCase().trim() !== normalizedEmail) {
        throw new Error(`Invitation mismatch: This invite token was issued for "${decodedInvite.email}", but you authenticated with "${normalizedEmail}". Please sign in with the invited email address.`);
      }

      // Strict Security Check 2: Atomically verify that the invitation exists, is Pending for this email, and mark Completed
      const Invitation = require('../models/Invitation');
      const invitationRecord = await Invitation.findOneAndUpdate(
        { 
          token: inviteToken, 
          status: 'Pending',
          email: normalizedEmail
        },
        { 
          $set: { status: 'Completed' } 
        },
        { 
          new: true 
        }
      );

      if (!invitationRecord) {
        throw new Error('Invitation token is invalid, expired, or has already been used.');
      }

      role = invitationRecord.role || decodedInvite.role || 'Student';
    } else if (mockRole && process.env.NODE_ENV === 'development') {
      role = mockRole;
    } else {
      throw new Error('Account not found. You must be invited by an Administrator to register.');
    }

    user = await User.create({
      googleId,
      name,
      email: normalizedEmail,
      profilePicture,
      role,
      isVerified: true
    });

    return { user, authToken: generateUserToken(user) };
  }

  async generateBulkInvites(invitationsList, frontendUrl = 'http://localhost:5173') {
    if (!Array.isArray(invitationsList)) {
      throw new Error('Invitations list must be an array');
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const invite of invitationsList) {
      const { email, role } = invite;
      try {
        const res = await this.generateInviteLink(role || 'Student', email, frontendUrl);
        results.push({
          email,
          role,
          success: true,
          previewUrl: res.previewUrl,
          inviteLink: res.inviteLink
        });
        successCount++;
      } catch (err) {
        results.push({
          email,
          role,
          success: false,
          error: err.message
        });
        failedCount++;
      }
    }

    return {
      successCount,
      failedCount,
      results
    };
  }
}

module.exports = new AuthService();
