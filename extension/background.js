console.log("Background service worker loaded");

// -------- helper: extract Subject from Gmail headers --------
function extractSubject(headers) {
  const h = headers.find(h => h.name === "Subject");
  return h ? h.value : "(no subject)";
}

// -------- message listener --------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "FETCH_EMAILS") return;

  chrome.identity.getAuthToken({ interactive: true }, async (token) => {
    if (chrome.runtime.lastError) {
      console.error("OAuth error:", chrome.runtime.lastError.message);
      sendResponse({ error: chrome.runtime.lastError.message });
      return;
    }

    try {
      // 1️⃣ Fetch list of message IDs
      const listRes = await fetch(
        "https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const listData = await listRes.json();

      if (!listData.messages) {
        sendResponse({ emails: [] });
        return;
      }

      const emails = [];

      // 2️⃣ Fetch each message → extract subject + snippet
      for (const m of listData.messages) {
        const msgRes = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const msgData = await msgRes.json();

        const subject = extractSubject(msgData.payload.headers);
        const body = msgData.snippet || "";

        // 3️⃣ Send to backend for classification
        const classifyRes = await fetch("http://localhost:8000/predict", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: subject,
            body: body,
          }),
        });

        const prediction = await classifyRes.json();

        emails.push({
          subject,
          body,
          prediction,
        });
      }

      // 4️⃣ Send results back to content.js
      sendResponse({ emails });

    } catch (err) {
      console.error("Background error:", err);
      sendResponse({ error: "Background failed" });
    }
  });

  return true; // 🔴 REQUIRED for async sendResponse
});
