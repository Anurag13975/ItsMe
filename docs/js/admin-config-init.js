/* ═══════════════════════════════════════════════════════════
   admin-config-init.js  –  Embedded admin password hash
   Fallback when admin-config.json cannot be fetched
   (e.g. file:// protocol).

   To change password:
     1. Open public/generate-hash.html in a browser
     2. Enter new password → copy hash
     3. Replace the hash below AND in public/admin-config.json
   ═══════════════════════════════════════════════════════════ */

// Default password: admin123
window.__ADMIN_HASH__ = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
