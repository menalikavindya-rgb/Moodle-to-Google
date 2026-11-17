// This file runs on your Moodle pages.
// It adds an "Open in Google" button next to every file link.
// It handles Moodle files AND SharePoint (OneDrive) links.

// Step 1: the file types we want buttons for (Moodle file links)
const fileTypes = [".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".pdf"];

// Step 2: look at every link on the page
const allLinks = document.querySelectorAll("a[href]");

for (const link of allLinks) {
  const href = link.href;
  const hrefLower = href.toLowerCase();

  // Step 3: decide if this link is a file link
  let isFileLink = false;

  // Case A: SharePoint sharing links
  // :p: = PowerPoint, :w: = Word, :x: = Excel, :b: = PDF
  if (hrefLower.includes("sharepoint.com/:p:/")) {
    isFileLink = true;
  }
  if (hrefLower.includes("sharepoint.com/:w:/")) {
    isFileLink = true;
  }
  if (hrefLower.includes("sharepoint.com/:x:/")) {
    isFileLink = true;
  }
  if (hrefLower.includes("sharepoint.com/:b:/")) {
    isFileLink = true;
  }

  // Case B: direct Moodle file link, check the ending (ignore anything after the ?)
  if (hrefLower.includes("pluginfile.php")) {
    const pathOnly = hrefLower.split("?")[0];
    for (const type of fileTypes) {
      if (pathOnly.endsWith(type)) {
        isFileLink = true;
      }
    }
  }

  // Case C: Moodle "resource" link, it redirects to the real file
  if (hrefLower.includes("/mod/resource/view.php")) {
    isFileLink = true;
  }

  if (isFileLink === false) {
    continue;
  }

  // Step 4: do not add a second button to the same link
  if (link.dataset.googleButton === "yes") {
    continue;
  }
  link.dataset.googleButton = "yes";

  // Step 5: make the button
  const button = document.createElement("button");
  button.textContent = "Open in Google";
  button.style.marginLeft = "8px";
  button.style.padding = "2px 8px";
  button.style.fontSize = "12px";
  button.style.cursor = "pointer";
  button.style.border = "1px solid #4285f4";
  button.style.borderRadius = "4px";
  button.style.background = "white";
  button.style.color = "#4285f4";

  // Step 6: what happens when the button is clicked
  button.addEventListener("click", async function () {
    button.textContent = "Converting...";
    button.disabled = true;

    const answer = await chrome.runtime.sendMessage({
      action: "openInGoogle",
      url: href,
      name: link.textContent.trim()
    });

    if (answer && answer.ok) {
      button.textContent = "Opened";
    } else {
      button.textContent = "Failed";
      alert("Could not open in Google: " + (answer ? answer.error : "no answer"));
    }

    // put the button back to normal after 3 seconds
    setTimeout(function () {
      button.textContent = "Open in Google";
      button.disabled = false;
    }, 3000);
  });

  // Step 7: put the button right after the link
  link.insertAdjacentElement("afterend", button);
}
