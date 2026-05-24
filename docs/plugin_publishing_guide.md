# Workspace Plugin Publishing Guide

Welcome to the SutharLabs Workspace Plugin Developer documentation! Internal Workspace Plugins allow you to extend the core developer IDE interface with custom tools, visual nodes, and dynamic capabilities.

## 1. Plugin Requirements

Unlike public App Store apps, Workspace Plugins run seamlessly within the authenticated IDE session of the user. To ensure security and performance, your plugin must adhere to the following:

- **Format:** Plugins must be packaged as `.zip` or `.vsix` files.
- **Entry Point:** The archive must contain an `index.js` file at its root. 
- **Export Schema:** Your plugin must export a default React component, or a standard ES module that hooks into our `PluginEngine`.

## 2. Preparing your Plugin

1. Develop your plugin locally using React and standard ES6 syntax.
2. Ensure you have no tightly coupled external dependencies that clash with the workspace.
3. Compress your compiled files into a `.zip` archive. Ensure the `index.js` file is at the **root** of the zip structure, not inside a nested sub-folder.

## 3. Submitting the Plugin for Installation

Only Administrators can globally install plugins to the workspace.

1. Navigate to your SutharLabs Developer environment.
2. On the left sidebar, under **MANAGEMENT**, click on **Manage Plugins**.
3. Under the **Install Workspace Plugin** section, click `Choose File` and select your packaged `.zip` file.
4. Click **Upload & Install Plugin**.

The backend server will securely process, unpack, and validate your plugin package. Upon success, your plugin will immediately appear in the **INSTALLED PLUGINS** sidebar for all authorized developers!

## 4. Best Practices

- Always prefix your CSS classes with a unique namespace to avoid polluting the global IDE stylesheet.
- Log important operational events using the injected `onAddLog` callback prop provided to your top-level component.
