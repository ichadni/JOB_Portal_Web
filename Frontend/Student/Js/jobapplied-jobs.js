// ==================== Backend Base URL ====================
const API_BASE = "http://localhost:5001/api";

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

    loadAppliedJobs();
});

// ==================== Load Applied Jobs ====================
async function loadAppliedJobs() {
    const tableBody = document.getElementById("applied-jobs-body");
    if (!tableBody) {
        console.error("Table body element not found!");
        return;
    }

    tableBody.innerHTML = `<tr><td colspan="4">Loading applications...</td></tr>`;

    console.log("Loading applied jobs...");
    console.log("Token:", localStorage.getItem('token'));
    console.log("User:", JSON.parse(localStorage.getItem('user')));

    try {
        const res = await fetch(`${API_BASE}/student/applied-jobs`, {
            headers: getAuthHeaders()
        });

        console.log("Response status:", res.status);
        const data = await res.json();
        console.log("Response data:", data);

        if (!res.ok) throw new Error(data.error || "Failed to fetch applications");

        const applications = Array.isArray(data) ? data : (data.applications || []);
        console.log("Applications found:", applications.length);

        if (applications.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">You haven't applied to any jobs yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = applications.map(app => {
            console.log("Processing app:", app);
            return `
            <tr>
                <td>${escapeHTML(app.Job ? (app.Job.title || app.Job.job_position) : 'Job Deleted')}</td>
                <td>${escapeHTML(app.Job ? (app.Job.company || app.Job.company_name) : 'N/A')}</td>
                <td>${escapeHTML(app.Job ? app.Job.location : 'N/A')}</td>
                <td><span class="status ${app.status.toLowerCase()}">${escapeHTML(app.status)}</span></td>
            </tr>
        `}).join("");

    } catch (err) {
        console.error("Error loading applied jobs:", err);
        tableBody.innerHTML = `<tr><td colspan="4" style="color:red">${err.message}</td></tr>`;
    }
}

// ==================== Logout Function ====================
document.getElementById("logout").addEventListener("click", async () => {
    try {
        const token = localStorage.getItem("token");
        
        if (token) {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
            } catch (err) {
                console.log("Logout endpoint not available, clearing local storage");
            }
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../Auth/Login.html";
    } catch (err) {
        console.error(err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "../Auth/Login.html";
    }
});