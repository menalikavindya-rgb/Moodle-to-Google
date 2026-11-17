# Moodle to Google

A small Chrome extension that adds an **Open in Google** button next to Word, Excel, PowerPoint and PDF files on a Moodle site. One click converts the file into a Google Doc, Sheet or Slides file and opens it in a new tab, so you don't need to download it, upload it to Drive and open it by hand.

## Why I built it

My university's Moodle shares course files as Microsoft 365 (SharePoint / OneDrive) links. Without a Microsoft 365 subscription, I had to download every file, upload it to Google Drive and then open it. This extension removes those steps.

## Features

- Adds a button next to file links on Moodle pages
- Works with **SharePoint / OneDrive sharing links** and **normal Moodle file links**
- Converts files with Google Drive's built-in conversion:

| File type | Opens as |
|---|---|
| `.docx`, `.doc` | Google Docs |
| `.xlsx`, `.xls` | Google Sheets |
| `.pptx`, `.ppt` | Google Slides |
| `.pdf` | Google Docs (text recognition by Drive) |

- Names the new Google file after the link text
- Runs entirely in your browser, with no server

## How it works

1. `content.js` runs on your Moodle pages and adds a button next to each file link.
2. When you click it, `background.js` downloads the file using your logged-in browser session.
3. It uploads the file to your Google Drive with the target Google format, so Drive converts it.
4. It opens the converted file in a new tab.

## Requirements

- Google Chrome (the Google login method used does not work in Edge or Brave)
- A Google account
- A Google Cloud project with the Drive API enabled (free, one-time setup)

## Setup

### 1. Download the code

Clone or download this repository to a folder on your computer. Keep the folder in a permanent place, because moving it changes the extension ID.

### 2. Set your Moodle address

Open `manifest.json` and replace both `YOUR-MOODLE-SITE` entries with your Moodle address, for example `moodle.example.edu`:

```json
"https://moodle.example.edu/*"
```

### 3. Load the extension in Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked** and choose the project folder
4. Copy the extension **ID** shown under its name

### 4. Set up Google login (one time)

In [Google Cloud Console](https://console.cloud.google.com):

1. Create a project and enable the **Google Drive API**.
2. Open the **OAuth consent screen** (Google Auth Platform), choose **External**, and fill in the basic details.
3. Under **Audience**, add your own Gmail address as a **test user**. Leave the app in **Testing** mode.
4. Under **Data Access**, add the `drive.file` scope.
5. Create an **OAuth client ID** of type **Chrome extension** and paste the extension ID from step 3.
6. Copy the Client ID it gives you.

### 5. Add your Client ID

In `manifest.json`, replace `PASTE-YOUR-CLIENT-ID.apps.googleusercontent.com` with your Client ID. Then reload the extension in `chrome://extensions`.

### 6. Use it

Open a Moodle course page, refresh it, and click **Open in Google** next to a file. The first time, a Google login popup appears. Google may warn that the app is unverified, which is normal for your own private app. Click **Advanced**, then continue.

## Privacy

- The extension only asks for the `drive.file` permission, so it can only see files it created itself, not the rest of your Drive.
- Files go directly from your browser to your own Google Drive. There is no server and nothing is sent to anyone else.
- Your Client ID and Moodle address stay in your own copy of `manifest.json`. Do not publish your edited copy.

## Limitations

- Complex formatting, macros, some charts and animations may not convert perfectly.
- PDFs often lose their layout when converted to Docs, and scanned PDFs depend on text recognition.
- Files shared as view-only with downloads blocked cannot be fetched.
- You may need to open a SharePoint link once and sign in with your university account first.
- While the Google app is in Testing mode, you may be asked to log in again about once a week.
- Converted files collect in the main folder of your Drive, so delete them when you no longer need them.
- Moodle pages that show a file inside a viewer, instead of linking to it, are not supported yet.

## Troubleshooting

| Problem | What to check |
|---|---|
| No buttons appear | The Moodle address in `manifest.json` matches your site in both places, the extension is reloaded, and the page is refreshed (Ctrl+Shift+R) |
| "Got a web page instead of a file" | Open the file link once in Chrome and sign in, then try again |
| "Access blocked" / `access_denied` | Your Gmail is not listed as a test user in Google Cloud |
| "bad client id" | The Client ID is wrong, or the extension ID given to Google does not match the one in Chrome |

## Roadmap

- [ ] Save as Markdown button, to export files as small `.md` text files for uploading to AI tools
- [ ] Support for pages that load their file list late

## Disclaimer

This is an independent personal project and is not affiliated with Moodle, Google or Microsoft. Please respect your institution's rules and your lecturers' copyright when you copy or convert course material.
