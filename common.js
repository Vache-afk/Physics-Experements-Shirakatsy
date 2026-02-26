export {};

// ===============================
// common.js (Firebase + EmailJS)
// Works on GitHub Pages / CDN (no build tools)
// ===============================

// ---------- EmailJS ----------
const EMAILJS_PUBLIC_KEY = "OF8tw55BMFQQIG8OM";
const EMAILJS_SERVICE_ID = "service_xiyprvp";
const EMAILJS_TEMPLATE_ID = "template_rk45mwm";

// EmailJS as ESM (works with type="module")
import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";

let __emailjsReady = false;
try {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  __emailjsReady = true;
} catch (e) {
  console.error("EmailJS init failed:", e);
  __emailjsReady = false;
}

// ---------- Firebase (Modular CDN) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCG_MCPpYlma9bqXkzRwt_3hsyxIL2jeUI",
  authDomain: "physics-experiments-ib.firebaseapp.com",
  projectId: "physics-experiments-ib",
  storageBucket: "physics-experiments-ib.firebasestorage.app",
  messagingSenderId: "283821061038",
  appId: "1:283821061038:web:a8333e9406e4c3ead3ce3f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Global email for pages
window.__currentUserEmail = null;

// Keep auth updated + show status if #authNotice exists
onAuthStateChanged(auth, async (user) => {
  const authNotice = document.getElementById("authNotice");

  if (!user) {
    window.__currentUserEmail = null;
    if (authNotice) authNotice.innerHTML = 'Status: <b>Guest</b> (login to send results).';
    return;
  }

  try { await user.reload(); } catch {}

  if (!user.emailVerified) {
    window.__currentUserEmail = null;
    if (authNotice) {
      authNotice.innerHTML = 'Status: <b>Email not confirmed</b>. Confirm email in <b>index.html</b>.';
    }
    return;
  }

  window.__currentUserEmail = user.email || null;
  if (authNotice) authNotice.innerHTML = `Logged in as: <b>${window.__currentUserEmail}</b>`;
});

// Helper: wait EmailJS
async function waitEmailJSReady(timeoutMs = 3000) {
  if (__emailjsReady) return true;

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 50));
    if (__emailjsReady) return true;
    try {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      __emailjsReady = true;
      return true;
    } catch {}
  }
  return false;
}

// ===============================
// Universal Send Function
// IMPORTANT: Your EmailJS template must have:
//   To: {{email}}
//   Content uses: {{results}} (and optional {{subject}}, {{name}})
// ===============================
window.sendResultsEmail = async function (results, subject = "Physics Experiment Results") {
  const studentEmail = window.__currentUserEmail;

  if (!studentEmail) {
    alert("You are not logged in (or email not confirmed). Please login and confirm email first.");
    return;
  }
  if (!results || results.length === 0) {
    alert("No results to send.");
    return;
  }

  const ok = await waitEmailJSReady();
  if (!ok) {
    alert("Email service not loaded. Refresh page and try again.");
    return;
  }

  const params = {
    email: studentEmail,                       // MUST match template variable {{email}}
    name: studentEmail,                        // optional {{name}}
    results: JSON.stringify(results, null, 2),  // MUST match {{results}}
    subject: subject                           // optional {{subject}}
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
    alert("✅ Results sent to your email!");
  } catch (err) {
    console.error("EmailJS send error:", err);
    alert("❌ Failed to send email. Open console (F12) to see the error.");
  }
};