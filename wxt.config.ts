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
    action: {
      default_title: "Generate a summary",
      default_icon:{
        16: "icon/16.png",
        48: "icon/48.png",
        128: "icon/128.png"
      }
    },
    side_panel: {
      default_path: "sidepanel.html"
    },
    host_permissions: [
      "http://*/*",
      "https://*/*"
    ],
  },

});
