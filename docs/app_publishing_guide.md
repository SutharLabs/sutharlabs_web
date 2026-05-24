# App Store Publishing Guide

Welcome to the SutharLabs Public App Store documentation! Publishing an app makes your software available for all users globally via the external marketplace.

## 1. App Packaging Requirements

Apps are standalone software instances that do not run inside the IDE workspace.

- **Package Format:** Your app must be archived in standard `.zip` format.
- **Manifest:** The root of the `.zip` file must contain an `app.json` manifest detailing the app version, permissions required, and execution entry points.
- **Dependencies:** Include all necessary runtime assets inside the archive.

## 2. Listing Meta-Data

To list an app on the marketplace, you must provide compelling meta-data:
- **Display Name:** A punchy, readable title for your App.
- **Category:** Choose an appropriate category (e.g. Productivity, Finance, Architecture).
- **Material Icon:** Select an appropriate Google Material Icon glyph string (e.g., `smart_toy`, `security`, `database`) that visually represents your App.
- **Tags:** Provide a comma-separated list of SEO tags so users can discover your App in search.

## 3. The Publishing Process

Publishing to the SutharLabs App Store requires Administrator privileges.

1. Navigate to your SutharLabs Developer environment.
2. Ensure you are logged in with an **Admin** level account.
3. On the left sidebar, under **MANAGEMENT**, select **Manage Apps**.
4. In the **Publish New App** pane on the right side:
   - Upload your compiled `.zip` package.
   - Fill out the Display Name, Category, and Material Icon fields.
5. Click **PUBLISH APP**.

The backend will process your payload, construct a database entry, and instantly index your App in the **Live Store Inventory**.

## 4. Unpublishing an App

If you need to revoke an app or deploy an emergency patch:
1. Go back to the **Manage Apps** console.
2. Locate your app in the **Live Store Inventory** list on the left.
3. Click the red Trash icon to instantly purge the app listing and binary from the backend edge network.
