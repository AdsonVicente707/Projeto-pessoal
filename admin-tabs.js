// Admin Panel Tab Management
document.addEventListener('DOMContentLoaded', function () {
    console.log('🔧 Admin tab manager loaded');

    // Setup admin tabs
    const adminTabs = document.querySelectorAll('.admin-tab');

    adminTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const tabName = this.dataset.tab;
            console.log('📑 Switching to tab:', tabName);

            // Remove active class from all tabs
            adminTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });

            // Show selected tab content
            const targetContent = document.getElementById(`admin-${tabName}-tab`);
            if (targetContent) {
                targetContent.style.display = 'block';
                targetContent.classList.add('active');

                // Load data for the tab
                if (tabName === 'users' && typeof window.loadAdminUsers === 'function') {
                    console.log('👥 Loading users...');
                    window.loadAdminUsers();
                } else if (tabName === 'dashboard' && typeof window.loadAdminDashboard === 'function') {
                    console.log('📊 Loading dashboard...');
                    window.loadAdminDashboard();
                } else if (tabName === 'themes' && typeof window.loadAdminThemes === 'function') {
                    console.log('🎨 Loading themes...');
                    window.loadAdminThemes();
                }
            }
        });
    });

    console.log('✅ Admin tabs initialized');
});
