/**
 * Contact form → Google Sheet.
 *
 * The site's "Work with me" form posts here; each message becomes a row in the responses sheet.
 *
 * Set up once (about two minutes):
 *   1. Open the responses sheet → Extensions → Apps Script.
 *   2. Replace the editor's contents with this file and save.
 *   3. Deploy → New deployment → type "Web app".
 *        Description: Contact form
 *        Execute as:   Me
 *        Who has access: Anyone
 *      Deploy, allow the permissions it asks for, and copy the Web app URL (…/exec).
 *   4. Put that URL in src/data.js → CONTACT.endpoint (or set VITE_CONTACT_ENDPOINT when building).
 *
 * If you change this script later: Deploy → Manage deployments → edit → Version: New version,
 * so the same URL keeps working.
 */
const SHEET_ID = '1IkcN4WRIyIXN92zdWid1Wytx7JEhRAokzWm-KluVn7A';
const HEADERS = ['Received', 'Name', 'Email', 'Topic', 'Message', 'Sent from'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  // a hidden field people never see; bots fill it in
  if (p.website) return json({ ok: true });
  const name = clean(p.name, 120);
  const email = clean(p.email, 200);
  const message = clean(p.message, 5000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return json({ ok: false, error: 'missing fields' });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow([new Date(), name, email, clean(p.intent, 120), message, clean(p.page, 300)]);
  } finally {
    lock.releaseLock();
  }
  return json({ ok: true });
}

// a quick check that the deployment is live: open the URL in a browser
function doGet() {
  return json({ ok: true, service: 'contact form' });
}

// trim, cap the length, and stop a cell being read as a formula (=, +, -, @)
function clean(v, max) {
  let s = String(v || '').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
