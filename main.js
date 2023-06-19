// main.js
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const isDev = require("electron-is-dev");

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000/");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile("./build/index.html");
  }
}

// 監聽來自 React 的 windowControl 訊息
ipcMain.on("windowControl", (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return;

  switch (action) {
    case "minimize":
      window.minimize();
      break;
    case "maximize":
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
      break;
    case "close":
      window.close();
      break;
    // 可添加其他自定義的動作
    default:
      break;
  }
});

// 取得音樂庫音樂數量，並返還第一頁的音樂資料
ipcMain.on(
  "getMusicLibraryAudioItemCount",
  (event, itemsPerPage, isReverse) => {
    const saveFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Default"
    );

    if (!fs.existsSync(saveFolderPath)) {
      fs.mkdirSync(saveFolderPath, { recursive: true });
    }

    fs.readdir(saveFolderPath, (err, files) => {
      if (err) {
        console.error("Failed to read directory:", err);
        event.reply("getMusicLibraryAudioItemCountResponse", {
          success: false,
        });
      } else {
        const jsonFiles = files.filter(
          (file) => path.extname(file) === ".json"
        );

        // 根據 isReverse 參數來決定排序的順序
        if (isReverse) {
          jsonFiles.sort((a, b) => b.localeCompare(a));
        } else {
          jsonFiles.sort((a, b) => a.localeCompare(b));
        }

        const totalDataCount = jsonFiles.length;
        const firstPageData = jsonFiles.slice(0, itemsPerPage).map((file) => {
          const filePath = path.join(saveFolderPath, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");
          try {
            const jsonData = JSON.parse(fileContent);
            return jsonData;
          } catch (error) {
            console.error(`Failed to parse JSON file '${file}':`, error);
            return null;
          }
        });

        event.reply("getMusicLibraryAudioItemCountResponse", {
          success: true,
          totalDataCount,
          jsonDataArray: firstPageData,
        });
      }
    });
  }
);

// 返還指定頁數的音樂資料
ipcMain.on(
  "getMusicLibraryAudioByPage",
  (event, page, itemsPerPage, isReverse) => {
    const saveFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Default"
    );

    if (!fs.existsSync(saveFolderPath)) {
      fs.mkdirSync(saveFolderPath, { recursive: true });
    }

    fs.readdir(saveFolderPath, (err, files) => {
      if (err) {
        console.error("Failed to read directory:", err);
        event.reply("getMusicLibraryAudioByPageResponse", { success: false });
      } else {
        const jsonFiles = files.filter(
          (file) => path.extname(file) === ".json"
        );

        // 根據 isReverse 參數來決定排序的順序
        if (isReverse) {
          jsonFiles.sort((a, b) => b.localeCompare(a));
        } else {
          jsonFiles.sort((a, b) => a.localeCompare(b));
        }

        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        const jsonDataArray = [];

        for (let i = startIdx; i < endIdx && i < jsonFiles.length; i++) {
          const file = jsonFiles[i];
          const filePath = path.join(saveFolderPath, file);
          const fileContent = fs.readFileSync(filePath, "utf-8");

          try {
            const jsonData = JSON.parse(fileContent);
            jsonDataArray.push(jsonData);
          } catch (error) {
            console.error(`Failed to parse JSON file '${file}':`, error);
          }
        }

        event.reply("getMusicLibraryAudioByPageResponse", {
          success: true,
          jsonDataArray,
        });
      }
    });
  }
);

// 取得音樂庫的所有音樂資料的 ID List
ipcMain.on("getMusicLibraryAudioIDList", (event, isReverse) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );

  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getMusicLibraryAudioIDListResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      // 根據 isReverse 參數來決定排序的順序
      if (isReverse) {
        jsonFiles.sort((a, b) => b.localeCompare(a));
      } else {
        jsonFiles.sort((a, b) => a.localeCompare(b));
      }

      const audioIds = jsonFiles.map((file) => {
        const fileId = path.basename(file, ".json");
        return fileId;
      });

      event.reply("getMusicLibraryAudioIDListResponse", {
        success: true,
        audioIds,
      });
    }
  });
});

// 取得播放清單數量，並返還第一頁的播放清單資料
ipcMain.on("getPlaylistItemCount", (event, itemsPerPage, isReverse) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getPlaylistItemCountResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      // 根據 isReverse 參數來決定排序的順序
      if (isReverse) {
        jsonFiles.sort((a, b) => b.localeCompare(a));
      } else {
        jsonFiles.sort((a, b) => a.localeCompare(b));
      }

      const totalDataCount = jsonFiles.length;
      const firstPageData = jsonFiles.slice(0, itemsPerPage).map((file) => {
        const filePath = path.join(saveFolderPath, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const jsonData = JSON.parse(fileContent);
          return jsonData;
        } catch (error) {
          console.error(`Failed to parse JSON file '${file}':`, error);
          return null;
        }
      });

      event.reply("getPlaylistItemCountResponse", {
        success: true,
        totalDataCount,
        jsonDataArray: firstPageData,
      });
    }
  });
});

// 取得所有播放清單資料
ipcMain.on("getPlaylistData", (event) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getPlaylistDataResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");
      const jsonDataArray = [];

      for (const file of jsonFiles) {
        const filePath = path.join(saveFolderPath, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const jsonData = JSON.parse(fileContent);
          jsonDataArray.push(jsonData);
        } catch (error) {
          console.error(`Failed to parse JSON file '${file}':`, error);
        }
      }

      event.reply("getPlaylistDataResponse", {
        success: true,
        jsonDataArray,
      });
    }
  });
});

// 返還指定頁數的播放清單資料
ipcMain.on("getPlaylistByPage", (event, page, itemsPerPage, isReverse) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getPlaylistByPageResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      // 根據 isReverse 參數來決定排序的順序
      if (isReverse) {
        jsonFiles.sort((a, b) => b.localeCompare(a));
      } else {
        jsonFiles.sort((a, b) => a.localeCompare(b));
      }

      const startIdx = (page - 1) * itemsPerPage;
      const endIdx = startIdx + itemsPerPage;
      const jsonDataArray = [];

      for (let i = startIdx; i < endIdx && i < jsonFiles.length; i++) {
        const file = jsonFiles[i];
        const filePath = path.join(saveFolderPath, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");

        try {
          const jsonData = JSON.parse(fileContent);
          jsonDataArray.push(jsonData);
        } catch (error) {
          console.error(`Failed to parse JSON file '${file}':`, error);
        }
      }

      event.reply("getPlaylistByPageResponse", {
        success: true,
        jsonDataArray,
      });
    }
  });
});

// 將音樂保存至檔案系統
ipcMain.on("saveAudioToMusicLibrary", (event, audioData) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );
  // 確保儲存路徑存在
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  // 以時間為唯一命名
  const now = new Date();
  const fileName = `${now.getTime()}.json`;
  const filePath = path.join(saveFolderPath, fileName);

  audioData.id = now.getTime().toString();

  // 寫檔至指定位置
  fs.writeFile(filePath, JSON.stringify(audioData), (err) => {
    if (err) {
      console.error("Failed to save JSON data:", err);
    } else {
      event.reply("saveAudioToMusicLibraryResponse", { success: true });
    }
  });
});

// 將播放清單內所有音訊保存至音樂庫
ipcMain.on("saveAudioListToMusicLibrary", (event, audioDataArray) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );

  // 確保儲存路徑存在
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  // 儲存所有音訊檔案
  const savePromises = audioDataArray.map((audioData) => {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const fileName = `${now.getTime()}.json`;
      const filePath = path.join(saveFolderPath, fileName);

      audioData.id = now.getTime().toString();

      // 寫檔至指定位置
      fs.writeFile(filePath, JSON.stringify(audioData), (err) => {
        if (err) {
          console.error("Failed to save JSON data:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });

  // 等待所有音訊檔案儲存完成後回覆成功訊息
  Promise.all(savePromises)
    .then(() => {
      event.reply("saveAudioListToMusicLibraryResponse", { success: true });
    })
    .catch((error) => {
      event.reply("saveAudioListToMusicLibraryResponse", {
        success: false,
        error,
      });
    });
});

// 將播放清單保存至檔案系統，並在檔案系統創建對應的播放清單
ipcMain.on("saveAudioListToPlaylist", (event, audioList, playlistTitle) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  // 確保儲存路徑存在
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  if (!fs.existsSync(playlistFolderPath)) {
    fs.mkdirSync(playlistFolderPath, { recursive: true });
  }

  // 創建 playlist 資料
  const now = new Date();
  const playlistID = now.getTime().toString();
  const playlistIDList = [];
  const playlistThumbnailBase64 = audioList[0].thumbnailBase64;

  // 依序處理每個音訊資料
  audioList.forEach((audioData) => {
    const now = new Date();
    audioData.id = now.getTime().toString();
    const fileName = `${audioData.id}.json`;
    const filePath = path.join(saveFolderPath, fileName);

    // 寫檔至指定位置
    fs.writeFile(filePath, JSON.stringify(audioData), (err) => {
      if (err) {
        console.error("Failed to save JSON data:", err);
      } else {
        playlistIDList.push(audioData.id);

        // 當所有音訊資料處理完畢後，儲存 playlist 資料
        if (playlistIDList.length === audioList.length) {
          const playlistFilePath = path.join(
            playlistFolderPath,
            `${playlistID}.json`
          );
          const playlistData = {
            title: playlistTitle,
            idList: playlistIDList,
            id: playlistID,
            thumbnailBase64: playlistThumbnailBase64,
          };

          fs.writeFile(
            playlistFilePath,
            JSON.stringify(playlistData),
            (err) => {
              if (err) {
                console.error("Failed to save playlist JSON data:", err);
              } else {
                event.reply("saveAudioListToPlaylistResponse", {
                  success: true,
                });
              }
            }
          );
        }
      }
    });
  });
});

// 將已存在的音訊保存至全新播放清單
ipcMain.on("saveAudioToNewPlaylist", (event, audioID, playlistTitle) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  // 確保儲存路徑存在
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  if (!fs.existsSync(playlistFolderPath)) {
    fs.mkdirSync(playlistFolderPath, { recursive: true });
  }

  // 讀取音訊資料
  const audioFilePath = path.join(saveFolderPath, `${audioID}.json`);
  fs.readFile(audioFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Failed to read audio JSON data:", err);
      event.reply("saveAudioToNewPlaylistResponse", { success: false });
      return;
    }

    const audioData = JSON.parse(data);
    const now = new Date();
    const playlistID = now.getTime().toString();
    const playlistIDList = [audioID];
    const playlistThumbnailBase64 = audioData.thumbnailBase64;

    const playlistFilePath = path.join(
      playlistFolderPath,
      `${playlistID}.json`
    );
    const playlistData = {
      title: playlistTitle,
      idList: playlistIDList,
      id: playlistID,
      thumbnailBase64: playlistThumbnailBase64,
    };

    fs.writeFile(playlistFilePath, JSON.stringify(playlistData), (err) => {
      if (err) {
        console.error("Failed to save playlist JSON data:", err);
        event.reply("saveAudioToNewPlaylistResponse", { success: false });
      } else {
        event.reply("saveAudioToNewPlaylistResponse", { success: true });
      }
    });
  });
});

// 將播放清單保存至現有的播放清單
ipcMain.on("saveAudioListToExistedPlaylist", (event, audioList, playlistID) => {
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  const playlistFilePath = path.join(playlistFolderPath, `${playlistID}.json`);

  fs.readFile(playlistFilePath, "utf-8", (err, fileContent) => {
    if (err) {
      console.error("Failed to read playlist file:", err);
      event.reply("saveAudioListToExistedPlaylistResponse", { success: false });
    } else {
      try {
        const playlistData = JSON.parse(fileContent);

        const saveFolderPath = path.join(
          app.getPath("userData"),
          "Downloads/Default"
        );

        // 確保儲存路徑存在
        if (!fs.existsSync(saveFolderPath)) {
          fs.mkdirSync(saveFolderPath, { recursive: true });
        }

        const savePromises = audioList.map((audio) => {
          return new Promise((resolve, reject) => {
            const now = new Date();
            const fileName = `${now.getTime()}.json`;
            const filePath = path.join(saveFolderPath, fileName);

            audio.id = now.getTime().toString();

            fs.writeFile(filePath, JSON.stringify(audio), (err) => {
              if (err) {
                console.error("Failed to save JSON data:", err);
                reject(err);
              } else {
                resolve();
              }
            });
          });
        });

        Promise.all(savePromises)
          .then(() => {
            playlistData.idList.push(...audioList.map((audio) => audio.id));

            fs.writeFile(
              playlistFilePath,
              JSON.stringify(playlistData),
              (err) => {
                if (err) {
                  console.error("Failed to save playlist JSON data:", err);
                  event.reply("saveAudioListToExistedPlaylistResponse", {
                    success: false,
                  });
                } else {
                  event.reply("saveAudioListToExistedPlaylistResponse", {
                    success: true,
                  });
                }
              }
            );
          })
          .catch((error) => {
            console.error("Failed to save audio files:", error);
            event.reply("saveAudioListToExistedPlaylistResponse", {
              success: false,
            });
          });
      } catch (error) {
        console.error("Failed to parse playlist JSON file:", error);
        event.reply("saveAudioListToExistedPlaylistResponse", {
          success: false,
        });
      }
    }
  });
});

// 將音訊保存至現有的播放清單
ipcMain.on("saveAudioToExistedPlaylist", (event, audio, playlistID) => {
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  const playlistFilePath = path.join(playlistFolderPath, `${playlistID}.json`);

  fs.readFile(playlistFilePath, "utf-8", (err, fileContent) => {
    if (err) {
      console.error("Failed to read playlist file:", err);
      event.reply("saveAudioToExistedPlaylistResponse", { success: false });
    } else {
      try {
        const playlistData = JSON.parse(fileContent);

        const saveFolderPath = path.join(
          app.getPath("userData"),
          "Downloads/Default"
        );

        // 確保儲存路徑存在
        if (!fs.existsSync(saveFolderPath)) {
          fs.mkdirSync(saveFolderPath, { recursive: true });
        }

        const now = new Date();
        const fileName = `${now.getTime()}.json`;
        const filePath = path.join(saveFolderPath, fileName);

        audio.id = now.getTime().toString();

        fs.writeFile(filePath, JSON.stringify(audio), (err) => {
          if (err) {
            console.error("Failed to save JSON data:", err);
            event.reply("saveAudioToExistedPlaylistResponse", {
              success: false,
            });
          } else {
            playlistData.idList.push(audio.id);

            fs.writeFile(
              playlistFilePath,
              JSON.stringify(playlistData),
              (err) => {
                if (err) {
                  console.error("Failed to save playlist JSON data:", err);
                  event.reply("saveAudioToExistedPlaylistResponse", {
                    success: false,
                  });
                } else {
                  event.reply("saveAudioToExistedPlaylistResponse", {
                    success: true,
                  });
                }
              }
            );
          }
        });
      } catch (error) {
        console.error("Failed to parse playlist JSON file:", error);
        event.reply("saveAudioToExistedPlaylistResponse", {
          success: false,
        });
      }
    }
  });
});

//
ipcMain.on(
  "saveExistedAudioToExistedPlaylist",
  (event, audioID, playlistID) => {
    const playlistFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Playlist"
    );

    const playlistFilePath = path.join(
      playlistFolderPath,
      `${playlistID}.json`
    );

    fs.readFile(playlistFilePath, "utf-8", (err, fileContent) => {
      if (err) {
        console.error("Failed to read playlist file:", err);
        event.reply("saveExistedAudioToExistedPlaylistResponse", {
          success: false,
          message: "無法讀取播放清單檔案",
        });
      } else {
        try {
          const playlistData = JSON.parse(fileContent);

          // 檢查是否已存在相同 ID 的歌曲
          const existingIndex = playlistData.idList.findIndex(
            (id) => id === audioID
          );
          if (existingIndex !== -1) {
            // 若已存在相同 ID 的歌曲，回傳相應的訊息
            event.reply("saveExistedAudioToExistedPlaylistResponse", {
              success: false,
              message: "音訊已存在於播放清單中",
            });
            return;
          }

          playlistData.idList.push(audioID);

          fs.writeFile(
            playlistFilePath,
            JSON.stringify(playlistData),
            (err) => {
              if (err) {
                console.error("Failed to save playlist JSON data:", err);
                event.reply("saveExistedAudioToExistedPlaylistResponse", {
                  success: false,
                  message: "無法儲存播放清單檔案",
                });
              } else {
                event.reply("saveExistedAudioToExistedPlaylistResponse", {
                  success: true,
                  message: "音訊已成功加入播放清單",
                });
              }
            }
          );
        } catch (error) {
          console.error("Failed to parse playlist JSON file:", error);
          event.reply("saveExistedAudioToExistedPlaylistResponse", {
            success: false,
            message: "無法解析播放清單檔案",
          });
        }
      }
    });
  }
);

// 從檔案系統中取得所有音樂 JSON 檔
ipcMain.on("getAllMusicLibraryAudio", (event) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getAllMusicLibraryAudioResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      const jsonDataArray = [];
      jsonFiles.forEach((file) => {
        const filePath = path.join(saveFolderPath, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const jsonData = JSON.parse(fileContent);
          jsonDataArray.push(jsonData);
        } catch (error) {
          console.error(`Failed to parse JSON file '${file}':`, error);
        }
      });

      event.reply("getAllMusicLibraryAudioResponse", {
        success: true,
        jsonDataArray,
      });
    }
  });
});

// 從檔案系統中取得所有播放清單 JSON 檔
ipcMain.on("getAllPlaylist", (event) => {
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );
  if (!fs.existsSync(saveFolderPath)) {
    fs.mkdirSync(saveFolderPath, { recursive: true });
  }

  fs.readdir(saveFolderPath, (err, files) => {
    if (err) {
      console.error("Failed to read directory:", err);
      event.reply("getAllPlaylistResponse", { success: false });
    } else {
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      const jsonDataArray = [];
      jsonFiles.forEach((file) => {
        const filePath = path.join(saveFolderPath, file);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          const jsonData = JSON.parse(fileContent);
          jsonDataArray.push(jsonData);
        } catch (error) {
          console.error(`Failed to parse JSON file '${file}':`, error);
        }
      });

      event.reply("getAllPlaylistResponse", {
        success: true,
        jsonDataArray,
      });
    }
  });
});

// 從檔案系統中根據播放清單 ID 更改播放清單名稱
ipcMain.handle("updatePlaylistTitle", async (event, { playlistID, title }) => {
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  try {
    const playlistFilePath = path.join(
      playlistFolderPath,
      `${playlistID}.json`
    );
    const playlistData = require(playlistFilePath); // 讀取播放清單 JSON 檔案
    playlistData.title = title; // 更新播放清單名稱
    fs.writeFileSync(playlistFilePath, JSON.stringify(playlistData)); // 寫入更新後的內容

    return true; // 回傳成功訊息
  } catch (error) {
    console.error("Failed to update playlist title:", error);
    return false; // 回傳失敗訊息
  }
});

// 從檔案系統中根據播放清單 ID 更改播放清單 ID List 與縮圖
ipcMain.handle(
  "updatePlaylistIDList",
  async (event, { playlistID, idList, thumbnailBase64 }) => {
    const playlistFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Playlist"
    );

    try {
      const playlistFilePath = path.join(
        playlistFolderPath,
        `${playlistID}.json`
      );
      const playlistData = require(playlistFilePath); // 讀取播放清單 JSON 檔案
      playlistData.idList = idList; // 更新播放清單的 idList 屬性
      playlistData.thumbnailBase64 = thumbnailBase64; // 更新播放清單的 thumbnailBase64 屬性
      fs.writeFileSync(playlistFilePath, JSON.stringify(playlistData)); // 寫入更新後的內容

      return true; // 回傳成功訊息
    } catch (error) {
      console.error("Failed to update playlist ID list:", error);
      return false; // 回傳失敗訊息
    }
  }
);

// 從檔案系統中刪除播放清單中的歌曲
ipcMain.handle(
  "deleteAudioFromPlaylist",
  async (event, { playlistID, audioID }) => {
    const playlistFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Playlist"
    );

    try {
      const playlistFilePath = path.join(
        playlistFolderPath,
        `${playlistID}.json`
      );
      const playlistDataBuffer = fs.readFileSync(playlistFilePath);
      const playlistData = JSON.parse(playlistDataBuffer);

      const filteredIDList = playlistData.idList.filter((id) => id !== audioID);

      if (filteredIDList.length === playlistData.idList.length) {
        throw new Error("指定的歌曲在播放清單中找不到");
      }

      if (filteredIDList.length === 0) {
        // 如果刪除後 idList 長度為 0，則同時刪除整個播放清單
        fs.unlinkSync(playlistFilePath);
        return { success: true, playlistDeleted: true };
      }

      playlistData.idList = filteredIDList;
      fs.writeFileSync(playlistFilePath, JSON.stringify(playlistData));
      return { success: true, playlistDeleted: false };
    } catch (error) {
      console.error("Failed to delete audio from playlist:", error);
      return { success: false, playlistDeleted: false };
    }
  }
);

// 從檔案系統中根據 ID List 取得音樂 JSON 檔
ipcMain.handle("getAudioData", (event, audioIDList) => {
  const audioList = [];
  const saveFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );

  // 從檔案系統中讀取音訊資料
  audioIDList.forEach((audioID) => {
    const filePath = path.join(saveFolderPath, `${audioID}.json`);
    try {
      const fileData = fs.readFileSync(filePath, "utf-8");
      const audio = JSON.parse(fileData);

      audioList.push(audio);
    } catch (error) {
      console.error(`Failed to read audio data for ID ${audioID}:`, error);
    }
  });

  // 若找不到任何音訊資料，回傳 null
  if (audioList.length === 0) {
    return null;
  }

  return audioList;
});

// 從檔案系統中根據 Audio ID 更新標題及作者
ipcMain.handle(
  "editAudioTitleAndAuthorByID",
  async (event, audioID, newTitle, newAuthor) => {
    const audioFolderPath = path.join(
      app.getPath("userData"),
      "Downloads/Default"
    );

    try {
      const files = await fs.promises.readdir(audioFolderPath);
      const jsonFiles = files.filter((file) => path.extname(file) === ".json");

      for (const file of jsonFiles) {
        const filePath = path.join(audioFolderPath, file);

        if (file === `${audioID}.json`) {
          const fileContent = await fs.promises.readFile(filePath, "utf-8");
          const jsonData = JSON.parse(fileContent);

          // 更新音訊檔案的標題和作者
          jsonData.title = newTitle;
          jsonData.author = newAuthor;

          await fs.promises.writeFile(
            filePath,
            JSON.stringify(jsonData, null, 2)
          );
          return true; // 回傳成功訊息
        }
      }

      return false; // 沒有找到對應的歌曲，回傳失敗訊息
    } catch (error) {
      console.error("Failed to edit music title and author by ID:", error);
      return false; // 回傳失敗訊息
    }
  }
);

// 從檔案系統中根據音訊 ID 刪除音訊
ipcMain.handle("deleteAudioByID", async (event, audioID) => {
  const audioFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );

  try {
    const files = await fs.promises.readdir(audioFolderPath);
    const jsonFiles = files.filter((file) => path.extname(file) === ".json");

    // 用於存儲需要更新的播放清單
    const playlistsToUpdate = [];

    for (const file of jsonFiles) {
      const filePath = path.join(audioFolderPath, file);

      if (file === `${audioID}.json`) {
        await fs.promises.unlink(filePath); // 刪除對應的 JSON 檔案

        // 檢索播放清單資料夾下的所有播放清單
        const playlistFolderPath = path.join(
          app.getPath("userData"),
          "Downloads/Playlist"
        );
        const playlistFiles = await fs.promises.readdir(playlistFolderPath);
        const playlistJSONFiles = playlistFiles.filter(
          (playlistFile) => path.extname(playlistFile) === ".json"
        );

        for (const playlistFile of playlistJSONFiles) {
          const playlistFilePath = path.join(playlistFolderPath, playlistFile);
          const playlistFileContent = await fs.promises.readFile(
            playlistFilePath,
            "utf-8"
          );
          const playlistData = JSON.parse(playlistFileContent);

          // 檢查播放清單的 idList 屬性是否包含需要刪除的音訊 ID
          if (playlistData.idList.includes(audioID)) {
            // 從 idList 中移除音訊 ID
            playlistData.idList = playlistData.idList.filter(
              (id) => id !== audioID
            );
            playlistsToUpdate.push({
              filePath: playlistFilePath,
              data: playlistData,
            });
          }
        }

        // 更新需要更新的播放清單資料
        for (const playlist of playlistsToUpdate) {
          await fs.promises.writeFile(
            playlist.filePath,
            JSON.stringify(playlist.data, null, 2)
          );

          // 檢查 idList 的長度，如果為 0，則刪除播放清單檔案
          if (playlist.data.idList.length === 0) {
            await fs.promises.unlink(playlist.filePath);
          }
        }

        return true; // 回傳成功訊息
      }
    }

    return false; // 沒有找到對應的歌曲，回傳失敗訊息
  } catch (error) {
    console.error("Failed to delete music by ID:", error);
    return false; // 回傳失敗訊息
  }
});

// 從檔案系統中根據播放清單 ID 刪除播放清單
ipcMain.handle("deletePlaylistByID", async (event, playlistID) => {
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );

  try {
    const playlistFilePath = path.join(
      playlistFolderPath,
      `${playlistID}.json`
    );
    if (fs.existsSync(playlistFilePath)) {
      fs.unlinkSync(playlistFilePath); // 刪除播放清單文件
      return true; // 回傳成功訊息
    } else {
      console.error("Playlist file does not exist.");
      return false; // 回傳失敗訊息
    }
  } catch (error) {
    console.error("Failed to delete playlist:", error);
    return false; // 回傳失敗訊息
  }
});

// 從檔案系統中根據播放清單 ID 刪除播放清單和相關的歌曲
ipcMain.handle("deleteFullPlaylistByID", async (event, playlistID) => {
  const playlistFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Playlist"
  );
  const defaultFolderPath = path.join(
    app.getPath("userData"),
    "Downloads/Default"
  );

  try {
    const playlistFilePath = path.join(
      playlistFolderPath,
      `${playlistID}.json`
    );
    if (fs.existsSync(playlistFilePath)) {
      const playlistData = require(playlistFilePath);
      const idList = playlistData.idList || [];

      // 刪除播放清單文件
      fs.unlinkSync(playlistFilePath);

      // 刪除相關的歌曲文件
      idList.forEach((audioID) => {
        const songFilePath = path.join(defaultFolderPath, `${audioID}.json`);
        if (fs.existsSync(songFilePath)) {
          fs.unlinkSync(songFilePath);
        }
      });

      return true; // 回傳成功訊息
    } else {
      console.error("Playlist file does not exist.");
      return false; // 回傳失敗訊息
    }
  } catch (error) {
    console.error("Failed to delete playlist and associated songs:", error);
    return false; // 回傳失敗訊息
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
