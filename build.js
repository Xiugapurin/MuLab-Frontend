const path = require("path");
const builder = require("electron-builder");

builder
  .build({
    projectDir: path.resolve(__dirname),
    config: {
      appId: "MuLab", // 應用程式 ID
      productName: "MuLab", // 應用程式名稱
      copyright: "Copyright © 2023 Xiugapurin", // 授權宣告
      directories: {
        output: "release", // 打包輸出路徑
      },
      nsis: {
        oneClick: false, // 一鍵安裝
        allowToChangeInstallationDirectory: true, // 允許使用者選擇安裝路徑
        createDesktopShortcut: true, // 建立桌面捷徑
        createStartMenuShortcut: true, // 建立開始選單捷徑
        shortcutName: "MuLab", // 捷徑名稱
      },
      // 設定打包後的 icon
      win: {
        icon: path.resolve(__dirname, "icon.png"),
        target: "nsis", // 打包成安裝程式
      },
      // 打包需要用到的原始碼、模組，皆需要寫到 files 內
      files: [
        "build/**/*",
        "node_modules/**/*",
        "package.json",
        "main.js",
        "preload.js",
      ],
      extends: null,
    },
  })
  .then(
    (data) => console.log(data),
    (err) => console.error(err)
  );
