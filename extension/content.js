console.log("AnzenSurf content script running on Gmail");

// ---------- create floating panel ----------
const panel = document.createElement("div");
panel.style.position = "fixed";
panel.style.top = "80px";
panel.style.right = "20px";
panel.style.width = "300px";
panel.style.maxHeight = "400px";
panel.style.overflowY = "auto";
panel.style.background = "#ffffff";
panel.style.border = "1px solid #ccc";
panel.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
panel.style.padding = "10px";
panel.style.zIndex = "9999";
panel.innerText = "Fetching & classifying emails...";

document.body.appendChild(panel);

// ---------- fetch classified emails ----------
chrome.runtime.sendMessage({ type: "FETCH_EMAILS" }, (response) => {
  console.log("Response from background:", response);

  if (!response || response.error) {
    panel.innerText = "Error fetching emails.";
    return;
  }

  if (!response.emails || response.emails.length === 0) {
    panel.innerText = "No emails found.";
    return;
  }

  // ---------- render results ----------
  panel.innerHTML = "<b>Email Classification</b><hr/>";

  response.emails.forEach((email, idx) => {
    const item = document.createElement("div");
    item.style.marginBottom = "10px";
    item.style.paddingBottom = "8px";
    item.style.borderBottom = "1px solid #eee";

    const labelColor =
      email.prediction.label === "important" ? "red" : "green";

    item.innerHTML = `
      <div style="font-weight:bold;">${email.subject}</div>
      <div style="font-size:12px;color:#555;">${email.body}</div>
      <div style="margin-top:4px;">
        <span style="color:${labelColor};font-weight:bold;">
          ${email.prediction.label.toUpperCase()}
        </span>
        <span style="font-size:12px;color:#777;">
          (${email.prediction.confidence})
        </span>
      </div>
    `;

    panel.appendChild(item);
  });
});
