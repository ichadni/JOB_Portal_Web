// ============================================
// NOTIFICATION SYSTEM - SHARED COMPONENT
// ============================================

const API_URL = 'http://localhost:5001/api';

// ✅ Get auth token
function getAuthToken() {
    return localStorage.getItem('token');
}

// ✅ Fetch all notifications
async function fetchNotifications() {
    try {
        const token = getAuthToken();
        if (!token) return;

        const response = await fetch(`${API_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            window.location.href = '/Auth/Login.html';
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            updateNotificationBadge(data.unreadCount);
            renderNotificationList(data.notifications);
            return data;
        }
    } catch (error) {
        console.error('Fetch notifications error:', error);
    }
}

// ✅ Render notification list
function renderNotificationList(notifications) {
    const container = document.getElementById('notification-list');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-notifications">
                <span class="empty-icon">🔔</span>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? 'read' : 'unread'}" 
             data-id="${notif.id}"
             onclick="handleNotificationClick(${notif.id}, '${notif.link || ''}')">
            <div class="notification-icon">${getNotificationIcon(notif.type)}</div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${timeAgo(notif.created_at)}</div>
            </div>
            ${!notif.read ? '<div class="unread-dot"></div>' : ''}
        </div>
    `).join('');
}

// ✅ Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        'application_status': '📝',
        'job_alert': '💼',
        'profile_update': '👤',
        'system': '🔔',
        'interview': '📅',
        'job_approval': '✅'
    };
    return icons[type] || '🔔';
}

// ✅ Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ✅ Handle notification click
async function handleNotificationClick(id, link) {
    try {
        await markAsRead(id);
        if (link) {
            window.location.href = link;
        }
    } catch (error) {
        console.error('Notification click error:', error);
    }
}

// ✅ Mark a single notification as read
async function markAsRead(id) {
    try {
        const token = getAuthToken();
        if (!token) return;

        await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Update UI
        const item = document.querySelector(`.notification-item[data-id="${id}"]`);
        if (item) {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
        }
        
        // Update badge
        const currentBadge = document.getElementById('notification-badge');
        if (currentBadge) {
            const currentCount = parseInt(currentBadge.textContent) || 0;
            if (currentCount > 0) {
                updateNotificationBadge(currentCount - 1);
            }
        }
    } catch (error) {
        console.error('Mark as read error:', error);
    }
}

// ✅ Mark all as read
async function markAllAsRead() {
    try {
        const token = getAuthToken();
        if (!token) return;

        await fetch(`${API_URL}/notifications/read-all`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        document.querySelectorAll('.notification-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.classList.add('read');
            const dot = item.querySelector('.unread-dot');
            if (dot) dot.remove();
        });
        updateNotificationBadge(0);
    } catch (error) {
        console.error('Mark all as read error:', error);
    }
}

// ✅ Clear all notifications
async function clearAllNotifications() {
    if (!confirm('Delete all notifications?')) return;

    try {
        const token = getAuthToken();
        if (!token) return;

        await fetch(`${API_URL}/notifications/clear-all`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const container = document.getElementById('notification-list');
        if (container) {
            container.innerHTML = `
                <div class="empty-notifications">
                    <span class="empty-icon">🔔</span>
                    <p>No notifications</p>
                </div>
            `;
        }
        updateNotificationBadge(0);
    } catch (error) {
        console.error('Clear all notifications error:', error);
    }
}

// ✅ Time ago helper
function timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return past.toLocaleDateString();
}

// ✅ Toggle notification dropdown
function toggleNotifications() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('open');
        if (dropdown.classList.contains('open')) {
            fetchNotifications();
        }
    }
}

// ✅ Initialize notifications
function initNotifications() {
    if (getAuthToken()) {
        fetchNotifications();
        setInterval(fetchNotifications, 30000);
    }

    // Close dropdown on outside click
    document.addEventListener('click', function(event) {
        const dropdown = document.getElementById('notification-dropdown');
        const bell = document.getElementById('notification-bell');
        if (dropdown && bell) {
            if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
                dropdown.classList.remove('open');
            }
        }
    });
}