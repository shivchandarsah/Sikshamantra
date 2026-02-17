import { User } from '../models/user.model.js';

/**
 * User Cleanup Service
 * Automatically deletes unverified users after 10 minutes
 */

class UserCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  /**
   * Start the cleanup service
   * Runs every 2 minutes to check for expired unverified users
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  User cleanup service is already running');
      return;
    }

    console.log('🧹 Starting user cleanup service...');
    console.log('   - Unverified users will be deleted after 10 minutes');
    console.log('   - Cleanup runs every 2 minutes\n');

    // Run cleanup immediately on start
    this.cleanup();

    // Then run every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000); // 2 minutes

    this.isRunning = true;
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.isRunning = false;
      console.log('🛑 User cleanup service stopped');
    }
  }

  /**
   * Perform cleanup of unverified users
   */
  async cleanup() {
    try {
      // Calculate cutoff time (10 minutes ago)
      const cutoffTime = new Date(Date.now() - 10 * 60 * 1000);

      // Find unverified users created more than 10 minutes ago
      const expiredUsers = await User.find({
        isEmailVerified: false,
        role: { $ne: 'admin' }, // Never delete admin accounts
        createdAt: { $lt: cutoffTime }
      });

      if (expiredUsers.length === 0) {
        // Don't log if no users to clean (reduces noise)
        return;
      }

      console.log(`🧹 Found ${expiredUsers.length} unverified user(s) to delete:`);

      // Delete each expired user
      for (const user of expiredUsers) {
        const minutesOld = Math.floor((Date.now() - user.createdAt) / 60000);
        console.log(`   - ${user.email} (${minutesOld} minutes old)`);
        
        await User.findByIdAndDelete(user._id);
      }

      console.log(`✅ Deleted ${expiredUsers.length} unverified user(s)\n`);

    } catch (error) {
      console.error('❌ Error in user cleanup service:', error.message);
    }
  }

  /**
   * Manually trigger cleanup (for testing)
   */
  async manualCleanup() {
    console.log('🧹 Manual cleanup triggered...\n');
    await this.cleanup();
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      cleanupInterval: '2 minutes',
      userExpiration: '10 minutes'
    };
  }
}

// Create singleton instance
const userCleanupService = new UserCleanupService();

export default userCleanupService;
