// Theme Scheduler - Automatic Theme Activation/Deactivation
const Theme = require('../models/themeModel');

class ThemeScheduler {
    constructor() {
        this.checkInterval = null;
    }

    // Start the scheduler (check every hour)
    start() {
        console.log('🕐 Theme Scheduler started');

        // Check immediately on start
        this.checkScheduledThemes();

        // Then check every hour
        this.checkInterval = setInterval(() => {
            this.checkScheduledThemes();
        }, 60 * 60 * 1000); // 1 hour
    }

    // Stop the scheduler
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            console.log('🛑 Theme Scheduler stopped');
        }
    }

    // Check and activate/deactivate themes based on dates
    async checkScheduledThemes() {
        try {
            const now = new Date();
            console.log(`🔍 Checking scheduled themes at ${now.toISOString()}`);

            // Find themes that should be active now
            const themesToActivate = await Theme.find({
                autoActivate: true,
                startDate: { $lte: now },
                $or: [
                    { endDate: { $gte: now } },
                    { endDate: null }
                ],
                isActive: false
            });

            // Activate themes
            for (const theme of themesToActivate) {
                console.log(`✅ Auto-activating theme: ${theme.name}`);
                theme.isActive = true;
                await theme.save();
            }

            // Find themes that should be deactivated
            const themesToDeactivate = await Theme.find({
                autoActivate: true,
                endDate: { $lt: now },
                isActive: true
            });

            // Deactivate expired themes
            for (const theme of themesToDeactivate) {
                console.log(`❌ Auto-deactivating expired theme: ${theme.name}`);
                theme.isActive = false;
                await theme.save();
            }

            if (themesToActivate.length === 0 && themesToDeactivate.length === 0) {
                console.log('ℹ️  No scheduled theme changes at this time');
            }

        } catch (error) {
            console.error('❌ Error in theme scheduler:', error);
        }
    }

    // Manual check (can be called from API)
    async manualCheck() {
        console.log('🔄 Manual theme check triggered');
        await this.checkScheduledThemes();
    }
}

// Create singleton instance
const scheduler = new ThemeScheduler();

module.exports = scheduler;
