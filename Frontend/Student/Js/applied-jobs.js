// ==================== Backend Base URL ====================
const API_BASE = "/api";

// ==================== Utility Functions ====================
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) return {};
    return { 'Authorization': `Bearer ${token}` };
}

// ==================== Auth Check ====================
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token) {
        // Redirect to login if not authenticated
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `../Auth/login.html?redirect=${returnUrl}`;
        return;
    }

    if (user && user.role !== 'student') {
        alert("Access denied. Students only.");
        window.location.href = "../index.html";
        return;
    }

    // Setup logout functionality
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = "../Auth/login.html";
        });
    }



    loadAppliedJobs();
});

// ==================== Load Applied Jobs ====================
async function loadAppliedJobs() {
    const tableBody = document.getElementById("applied-jobs-body");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="4">Loading applications...</td></tr>`;

    try {
        const res = await fetch(`${API_BASE}/student/applied-jobs`, {
            headers: getAuthHeaders()
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch applications");

        const applications = Array.isArray(data) ? data : (data.applications || []);

        if (applications.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">You haven't applied to any jobs yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = applications.map(app => `
            <tr>
                <td>${escapeHTML(app.Job ? (app.Job.title || app.Job.job_position) : 'Job Deleted')}</td>
                <td>${escapeHTML(app.Job ? (app.Job.company || app.Job.company_name) : 'N/A')}</td>
                <td>${escapeHTML(app.Job ? app.Job.location : 'N/A')}</td>
                <td><span class="status ${app.status.toLowerCase()}">${escapeHTML(app.status)}</span></td>
            </tr>
        `).join("");

    } catch (err) {
        tableBody.innerHTML = `<tr><td colspan="4" style="color:red">${err.message}</td></tr>`;
    }
}

