import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: [
      "tabs",
      "scripting",
      "sidePanel",
      "storage",
      "contextMenus"
    ],
    side_panel: {
      default_path: "sidepanel.html"
    },
  },

});
