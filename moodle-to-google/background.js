// This file does the real work in the background:
// download the file, upload it to Google Drive (converted), open the result.

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "openInGoogle") {
    openInGoogle(message.url, message.name)
      .then(function (result) {
        sendResponse(result);
      })
      .catch(function (error) {
        sendResponse({ ok: false, error: error.message });
      });
    return true; // tells Chrome we will answer later
  }
});

async function openInGoogle(fileUrl, linkText) {
  // Step 1: get permission to use your Google Drive (a login popup shows the first time)
  const tokenResult = await chrome.identity.getAuthToken({ interactive: true });
  const token = tokenResult.token;

  // Step 2: for SharePoint links, add download=1 so we get the file, not a web page
  let downloadUrl = fileUrl;
  if (fileUrl.includes("sharepoint.com")) {
    if (fileUrl.includes("?")) {
      downloadUrl = fileUrl + "&download=1";
    } else {
      downloadUrl = fileUrl + "?download=1";
    }
  }

  // Step 3: download the file using your logged-in session
  const fileResponse = await fetch(downloadUrl, { credentials: "include" });
  if (fileResponse.ok === false) {
    throw new Error("Could not download the file (status " + fileResponse.status + ")");
  }
  const contentType = fileResponse.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    throw new Error("Got a web page instead of a file. Open the link once in Chrome, sign in with your university account, then try again.");
  }
  const fileBlob = await fileResponse.blob();

  // Step 4: find the file type
  // first choice: the ending of the link text, like "Lecture 1.pptx"
  let extension = "";
  const nameLower = linkText.toLowerCase();
  for (const type of ["docx", "doc", "xlsx", "xls", "pptx", "ppt", "pdf"]) {
    if (nameLower.endsWith("." + type)) {
      extension = type;
    }
  }

  // second choice: the letter inside a SharePoint link
  if (extension === "") {
    if (fileUrl.includes("/:p:/")) {
      extension = "pptx";
    } else if (fileUrl.includes("/:w:/")) {
      extension = "docx";
    } else if (fileUrl.includes("/:x:/")) {
      extension = "xlsx";
    } else if (fileUrl.includes("/:b:/")) {
      extension = "pdf";
    }
  }

  // third choice: the ending of the final address (works for Moodle files)
  let finalName = decodeURIComponent(new URL(fileResponse.url).pathname.split("/").pop());
  if (extension === "") {
    extension = finalName.split(".").pop().toLowerCase();
  }

  // Step 5: the name for the new Google file (no .pptx or .docx at the end)
  let nameWithoutExtension = linkText;
  if (nameWithoutExtension === "") {
    nameWithoutExtension = finalName;
  }
  nameWithoutExtension = nameWithoutExtension.replace(/\.(docx|doc|xlsx|xls|pptx|ppt|pdf)$/i, "");

  // Step 6: choose the Google format for this file type
  let googleType = "";
  let originalType = "";

  if (extension === "docx") {
    googleType = "application/vnd.google-apps.document";
    originalType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  } else if (extension === "doc") {
    googleType = "application/vnd.google-apps.document";
    originalType = "application/msword";
  } else if (extension === "pdf") {
    googleType = "application/vnd.google-apps.document";
    originalType = "application/pdf";
  } else if (extension === "xlsx") {
    googleType = "application/vnd.google-apps.spreadsheet";
    originalType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (extension === "xls") {
    googleType = "application/vnd.google-apps.spreadsheet";
    originalType = "application/vnd.ms-excel";
  } else if (extension === "pptx") {
    googleType = "application/vnd.google-apps.presentation";
    originalType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  } else if (extension === "ppt") {
    googleType = "application/vnd.google-apps.presentation";
    originalType = "application/vnd.ms-powerpoint";
  } else {
    throw new Error("This file type is not supported: ." + extension);
  }

  // Step 7: build the upload (details first, then the file itself)
  const boundary = "moodle_to_google_boundary";
  const details = { name: nameWithoutExtension, mimeType: googleType };

  const uploadBody = new Blob([
    "--" + boundary + "\r\n",
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(details) + "\r\n",
    "--" + boundary + "\r\n",
    "Content-Type: " + originalType + "\r\n\r\n",
    fileBlob,
    "\r\n--" + boundary + "--"
  ]);

  // Step 8: upload to Google Drive, Drive converts it
  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "multipart/related; boundary=" + boundary
    },
    body: uploadBody
  });

  if (uploadResponse.ok === false) {
    if (uploadResponse.status === 401) {
      // the saved login expired, clear it so the next click asks again
      await chrome.identity.removeCachedAuthToken({ token: token });
      throw new Error("Google login expired. Click the button again.");
    }
    const errorText = await uploadResponse.text();
    throw new Error("Google upload failed: " + errorText);
  }

  // Step 9: open the converted file in a new tab
  const result = await uploadResponse.json();
  await chrome.tabs.create({ url: result.webViewLink });

  return { ok: true };
}
