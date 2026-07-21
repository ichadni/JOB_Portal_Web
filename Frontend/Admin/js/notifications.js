// Common notification functionality for admin panel
class NotificationManager {
    constructor() {
        this.notifBtn = document.getElementById("notifBtn");
        this.notifDropdown = document.getElementById("notifDropdown");
        this.notifList = document.getElementById("notifList");
        this.notifCount = document.getElementById("notifCount");
        
        this.init();
    }

    init() {
        if (!this.notifBtn || !this.notifDropdown) return;

        // Toggle dropdown on button click
        this.notifBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!this.notifBtn.contains(e.target) && !this.notifDropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });

        // Load notifications on init
        this.loadNotifications();
    }

    toggleDropdown() {
        const isVisible = this.notifDropdown.style.display === "block";
        this.notifDropdown.style.display = isVisible ? "none" : "block";
    }

    hideDropdown() {
        this.notifDropdown.style.display = "none";
    }

    async loadNotifications() {
        try {
            const res = await fetchWithAuth("/admin/notifications");
            if (!res) return;

            const data = await res.json();
            this.updateNotificationUI(data);
        } catch (err) {
            console.error("Failed to load notifications:", err);
            this.showErrorState();
        }
    }

    updateNotificationUI(data) {
        // Update count
        this.notifCount.textContent = data.count || 0;

        // Update list
        this.notifList.innerHTML = "";

        if (!data.list || data.list.length === 0) {
            this.notifList.innerHTML = "<li>No notifications</li>";
        } else {
            data.list.forEach(notif => {
                const li = document.createElement("li");
                li.textContent = notif.message;
                li.addEventListener("click", () => {
                    this.handleNotificationClick(notif);
                });
                this.notifList.appendChild(li);
            });
        }
    }

    showErrorState() {
        this.notifList.innerHTML = "<li>Failed to load notifications</li>";
        this.notifCount.textContent = "0";
    }

    handleNotificationClick(notif) {
        // Handle notification click (e.g., mark as read, navigate to relevant page)
        console.log("Notification clicked:", notif);
        this.hideDropdown();
        
        // You can add specific handling based on notification type
        if (notif.actionUrl) {
            window.location.href = notif.actionUrl;
        }
    }

    // Method to refresh notifications (can be called from other scripts)
    refresh() {
        this.loadNotifications();
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.notificationManager = new NotificationManager();
});

// Make it available globally
window.NotificationManager = NotificationManager;