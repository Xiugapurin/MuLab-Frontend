import React, { useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./download.css";
import Base64ToArrayBuffer from "../utils/base64ToArrayBuffer";
import NextIcon from "../asset/icons/next.svg";
import PrevIcon from "../asset/icons/prev.svg";
import HomeIcon from "../asset/icons/home.svg";
import EditIcon from "../asset/icons/edit.svg";
import MP3Icon from "../asset/icons/mp3.svg";
import MP4Icon from "../asset/icons/mp4.svg";
import CDIcon from "../asset/icons/cd-w.svg";
import AddIcon from "../asset/icons/add-w.svg";
import PlaylistIcon from "../asset/icons/playlist-w.svg";
import CloseIcon from "../asset/icons/close.svg";
import ResizableTextArea from "../components/resizableTextarea";
const { ipcRenderer } = window.require("electron");

export default function Download() {
  const [url, setUrl] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  //  輸入網址後送往後端判斷網址類型，並根據類型進行下一步
  const handleNextStepButtonClick = () => {
    const toastID = toast.info("正在檢查連結（等待伺服器回應）", {
      autoClose: false,
    });

    if (url) {
      setIsProcessing(true);
      fetch("https://mulab.onrender.com/api/url_type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })
        .then((response) => response.json())
        .then((data) => {
          setPreviewVideo(data);
          setVideoTitle(data.title);
          const { urlType } = data;

          if (urlType === "video") {
            setCurrentStep(1);
            toast.update(toastID, {
              render: "成功載入影片資訊",
              type: toast.TYPE.SUCCESS,
              autoClose: 3000,
            });
          } else if (urlType === "playlist") {
            setCurrentStep(2);
            toast.update(toastID, {
              render: "成功載入播放清單資訊",
              type: toast.TYPE.SUCCESS,
              autoClose: 3000,
            });
          } else if (urlType === "private") {
            toast.update(toastID, {
              render: "此連結為私人或空白播放清單，無法下載",
              type: toast.TYPE.ERROR,
              autoClose: 3000,
            });
          } else {
            toast.update(toastID, {
              render: "此連結無效，請重新輸入",
              type: toast.TYPE.ERROR,
              autoClose: 3000,
            });
          }
        })
        .catch((error) => {
          toast.update(toastID, {
            render: "無法連接至伺服器",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        })
        .finally(() => {
          setIsProcessing(false);
        });
    } else {
      toast.update(toastID, {
        render: "請輸入連結",
        type: toast.TYPE.ERROR,
        autoClose: 3000,
      });
    }
  };

  const handlePrevStepButtonClick = () => {
    setCurrentStep(0);
  };

  // 下載音訊
  const downloadAudioMP3 = async () => {
    const toastID = toast.info("音訊正在下載中", { autoClose: false });
    setIsProcessing(true);

    fetch("https://mulab.onrender.com/api/get_mp3", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          const { audioBase64 } = data;

          if (audioBase64) {
            toast.update(toastID, {
              render: "音訊下載成功 !",
              type: toast.TYPE.SUCCESS,
              autoClose: 3000,
            });
            const fileName = videoTitle + ".mp3";

            // 彈出儲存視窗
            const file = new File(
              [Base64ToArrayBuffer(audioBase64)],
              fileName,
              {
                type: "audio/mpeg",
              }
            );
            saveAs(file, `${fileName}`);
          } else {
            toast.update(toastID, {
              render: "音訊下載發生錯誤",
              type: toast.TYPE.ERROR,
              autoClose: 3000,
            });
          }
        } else {
          toast.update(toastID, {
            render: "音訊下載失敗",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // 下載影片
  const downloadAudioMP4 = async () => {
    const toastID = toast.info("影片正在下載中", { autoClose: false });
    setIsProcessing(true);
    try {
      const response = await fetch("https://mulab.onrender.com/api/get_mp4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      });

      const data = await response.json();
      const { videoBase64 } = data;

      if (videoBase64) {
        toast.update(toastID, {
          render: "影片下載成功 !",
          type: toast.TYPE.SUCCESS,
          autoClose: 3000,
        });
        const fileName = videoTitle + ".mp4";

        // 彈出儲存視窗
        const file = new File([Base64ToArrayBuffer(videoBase64)], fileName, {
          type: "video/mp4",
        });
        saveAs(file, `${fileName}`);
      } else {
        toast.update(toastID, {
          render: "影片下載發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      }
    } catch (error) {
      toast.update(toastID, {
        render: "伺服器端發生錯誤",
        type: toast.TYPE.ERROR,
        autoClose: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // 儲存至音樂庫單曲
  const saveToMusicLibrary = () => {
    const toastID = toast.info("已開始下載音訊", { autoClose: false });
    setIsProcessing(true);
    // 發送 POST 請求
    fetch("https://mulab.onrender.com/api/get_audio_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })
      .then((response) => response.json())
      .then((result) => {
        // 檢查回傳結果是否成功
        if (result.audioInfo) {
          const { audioBase64, thumbnailBase64, duration, author } =
            result.audioInfo;

          // 將音訊和縮圖存儲於應用程式內部
          const audioData = {
            title: videoTitle,
            duration: duration,
            author: author,
            audioBase64: audioBase64,
            thumbnailBase64: thumbnailBase64,
          };

          toast.update(toastID, {
            render: "下載成功！正在儲存至音樂庫",
            type: toast.TYPE.SUCCESS,
          });

          // 發送保存音訊至音樂庫的請求
          ipcRenderer.send("saveAudioToMusicLibrary", audioData);

          ipcRenderer.on(
            "saveAudioToMusicLibraryResponse",
            (event, response) => {
              if (response.success) {
                toast.update(toastID, {
                  render: "音訊已成功儲存！",
                  type: toast.TYPE.SUCCESS,
                  autoClose: 3000,
                });
              } else {
                toast.update(toastID, {
                  render: "音訊儲存失敗",
                  type: toast.TYPE.ERROR,
                  autoClose: 3000,
                });
              }
            }
          );
        } else {
          toast.update(toastID, {
            render: "音訊下載失敗",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // 將 Youtube 播放清單儲存為壓縮檔
  const downloadPlaylistMP3 = async () => {
    const toastID = toast.info(
      `音訊清單下載中，大約需要 ${previewVideo.listLength * 4} 秒`,
      { autoClose: false }
    );
    setIsProcessing(true);

    fetch("https://mulab.onrender.com/api/get_audio_list_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playlistUrl: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.audioList && data.audioList.length > 0) {
          toast.update(toastID, {
            render: "正在壓縮音訊清單",
            type: toast.TYPE.INFO,
          });
          const audioList = data.audioList;

          const zip = new JSZip();
          const promises = [];

          audioList.forEach((audioData) => {
            const { audioBase64 } = audioData;
            const fileName = audioData.title + ".mp3";

            // 建立 Promise 以將音訊加入到 ZIP 檔案中
            const promise = new Promise((resolve, reject) => {
              zip.file(fileName, Base64ToArrayBuffer(audioBase64));
              resolve();
            });

            promises.push(promise);
          });

          // 等待所有 Promise 完成後，進行 ZIP 檔案下載
          Promise.all(promises).then(() => {
            toast.update(toastID, {
              render: "音訊清單壓縮完成！",
              type: toast.TYPE.SUCCESS,
              autoClose: 3000,
            });
            zip.generateAsync({ type: "blob" }).then((content) => {
              saveAs(content, `${videoTitle}.zip`);
            });
          });
        } else {
          toast.update(toastID, {
            render: "音訊清單下載失敗",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // 將 Youtube 播放清單全部儲存為單曲
  const downloadPlaylistToMusicLibrary = async () => {
    const toastID = toast.info(
      `播放清單下載中，大約需要 ${previewVideo.listLength * 4} 秒`,
      { autoClose: false }
    );
    setIsProcessing(true);

    fetch("https://mulab.onrender.com/api/get_audio_list_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playlistUrl: url }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        if (data && data.audioList && data.audioList.length > 0) {
          toast.update(toastID, {
            render: "播放清單下載完成，正在儲存至音樂庫",
            type: toast.TYPE.INFO,
          });

          // 發送保存音訊至音樂庫的請求
          ipcRenderer.send("saveAudioListToMusicLibrary", data.audioList);

          ipcRenderer.on(
            "saveAudioListToMusicLibraryResponse",
            (event, response) => {
              if (response.success) {
                toast.update(toastID, {
                  render: "播放清單已成功儲存至音樂庫！",
                  type: toast.TYPE.SUCCESS,
                  autoClose: 3000,
                });
              } else {
                toast.update(toastID, {
                  render: "播放清單儲存失敗",
                  type: toast.TYPE.ERROR,
                  autoClose: 3000,
                });
              }
            }
          );
        } else {
          toast.update(toastID, {
            render: "播放清單下載發生錯誤",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch(() => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  // 將 Youtube 播放清單儲存為音樂庫播放清單
  const downloadPlaylistToPlaylist = () => {
    const toastID = toast.info(
      `正在下載播放清單，大約需要 ${previewVideo.listLength * 4} 秒`,
      { autoClose: false }
    );
    setIsProcessing(true);

    // 發送 POST 請求
    fetch("https://mulab.onrender.com/api/get_audio_list_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playlistUrl: url }),
    })
      .then((response) => response.json())
      .then((result) => {
        // 檢查回傳結果是否成功
        if (result.audioList) {
          toast.update(toastID, {
            render: "音訊下載成功！正在保存為新的播放清單",
            type: toast.TYPE.SUCCESS,
          });

          ipcRenderer.send(
            "saveAudioListToPlaylist",
            result.audioList,
            videoTitle
          );

          ipcRenderer.on(
            "saveAudioListToPlaylistResponse",
            (event, response) => {
              if (response.success) {
                toast.update(toastID, {
                  render: "已成功保存為播放清單",
                  type: toast.TYPE.SUCCESS,
                  autoClose: 3000,
                });
              } else {
                toast.update(toastID, {
                  render: "保存至播放清單失敗",
                  type: toast.TYPE.ERROR,
                  autoClose: 3000,
                });
              }
            }
          );
        } else {
          toast.update(toastID, {
            render: "無法獲取音訊清單資訊",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const [isPlaylistPreviewModalOpen, setIsPlaylistPreviewModalOpen] =
    useState(true);
  const [previewedPlaylists, setPreviewedPlaylists] = useState(null);
  const [previewedPlaylistsFocusedIndex, setPreviewedPlaylistsFocusedIndex] =
    useState(0);
  // 預覽播放清單
  const previewPlaylist = () => {
    try {
      ipcRenderer.send("getPlaylistData");

      ipcRenderer.on("getPlaylistDataResponse", (event, response) => {
        if (response.success) {
          if (response.jsonDataArray.length === 0) {
            toast.error("你尚未創建任何播放清單！");
            return;
          }
          setPreviewedPlaylists(response.jsonDataArray);
          setIsPlaylistPreviewModalOpen(true);
        } else {
          toast.error("無法獲取播放清單資訊");
        }
      });
    } catch (error) {
      toast.error("無法獲取播放清單資訊");
    }
  };

  const closePlaylistPreviewModal = () => {
    setIsPlaylistPreviewModalOpen(false);
  };

  const downloadPlaylistToExistedPlaylist = () => {
    const toastID = toast.info(
      `正在下載播放清單，大約需要 ${previewVideo.listLength * 4} 秒`,
      { autoClose: false }
    );
    setIsProcessing(true);

    // 發送 POST 請求
    fetch("https://mulab.onrender.com/api/get_audio_list_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ playlistUrl: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data && data.audioList && data.audioList.length > 0) {
          const { audioList } = data;

          // 呼叫 saveAudioListToMusicLibrary 函式，將 audioList 儲存至預設資料夾
          ipcRenderer.send("saveAudioListToMusicLibrary", audioList);

          ipcRenderer.on(
            "saveAudioListToMusicLibraryResponse",
            (event, response) => {
              if (response.success) {
                // 呼叫 saveAudioListToExistedPlaylist 函式，將 audioList 儲存至現有的播放清單
                ipcRenderer.send(
                  "saveAudioListToExistedPlaylist",
                  audioList,
                  previewedPlaylists[previewedPlaylistsFocusedIndex].id
                );

                ipcRenderer.on(
                  "saveAudioListToExistedPlaylistResponse",
                  (event, response) => {
                    if (response.success) {
                      toast.update(toastID, {
                        render: "音訊已成功儲存至播放清單！",
                        type: toast.TYPE.SUCCESS,
                        autoClose: 3000,
                      });
                    } else {
                      toast.update(toastID, {
                        render: "音訊儲存至播放清單失敗",
                        type: toast.TYPE.ERROR,
                        autoClose: 3000,
                      });
                    }

                    // 清除事件監聽器
                    ipcRenderer.removeAllListeners(
                      "saveAudioListToExistedPlaylistResponse"
                    );
                  }
                );
              } else {
                toast.update(toastID, {
                  render: "音訊儲存至預設資料夾失敗",
                  type: toast.TYPE.ERROR,
                  autoClose: 3000,
                });

                // 清除事件監聽器
                ipcRenderer.removeAllListeners(
                  "saveAudioListToMusicLibraryResponse"
                );
              }
            }
          );
        } else {
          toast.update(toastID, {
            render: "無法獲取音訊清單資訊",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setPreviewedPlaylists(null);
        setPreviewedPlaylistsFocusedIndex(0);
        setIsPlaylistPreviewModalOpen(false);
        setIsProcessing(false);
      });
  };

  const downloadSingleToExistedPlaylist = () => {
    const toastID = toast.info("正在下載音訊，大約需要 4 秒", {
      autoClose: false,
    });
    setIsProcessing(true);

    // 發送 POST 請求
    fetch("https://mulab.onrender.com/api/get_audio_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.audioInfo) {
          const { audioBase64, thumbnailBase64, duration, author } =
            data.audioInfo;

          // 將音訊和縮圖存儲於應用程式內部
          const audioInfo = {
            title: videoTitle,
            duration: duration,
            author: author,
            audioBase64: audioBase64,
            thumbnailBase64: thumbnailBase64,
          };

          // 呼叫 saveAudioToExistedPlaylist 函式，將 audioInfo 儲存至指定的播放清單
          ipcRenderer.send(
            "saveAudioToExistedPlaylist",
            audioInfo,
            previewedPlaylists[previewedPlaylistsFocusedIndex].id
          );

          ipcRenderer.on(
            "saveAudioToExistedPlaylistResponse",
            (event, response) => {
              if (response.success) {
                toast.update(toastID, {
                  render: "音訊已成功儲存至播放清單！",
                  type: toast.TYPE.SUCCESS,
                  autoClose: 3000,
                });
              } else {
                toast.update(toastID, {
                  render: "音訊儲存至播放清單失敗",
                  type: toast.TYPE.ERROR,
                  autoClose: 3000,
                });
              }
            }
          );
        } else {
          toast.update(toastID, {
            render: "無法獲取音訊資訊",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      })
      .catch((error) => {
        toast.update(toastID, {
          render: "伺服器端發生錯誤",
          type: toast.TYPE.ERROR,
          autoClose: 3000,
        });
      })
      .finally(() => {
        setPreviewedPlaylists(null);
        setPreviewedPlaylistsFocusedIndex(0);
        setIsPlaylistPreviewModalOpen(false);
        setIsProcessing(false);
      });
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState(videoTitle);
  const openEditModal = () => {
    setPreviewTitle(videoTitle);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };
  const onEditTitleSubmit = () => {
    console.log("previewTitle:", previewTitle);
    setVideoTitle(previewTitle);
    closeEditModal();
  };

  return (
    <div className="download-container">
      <div className="download-background" />
      <div
        className="download-back-button"
        onClick={() => {
          navigate("/");
        }}
      >
        <img
          className="download-back-button-img"
          src={HomeIcon}
          alt="Back Icon"
        />
      </div>
      {currentStep === 0 && (
        <div className="download-step-container">
          <div className="download-step-title">從 YouTube 新增音訊</div>
          <div className="download-input-container">
            <input
              className="download-input"
              placeholder="輸入 YouTube 影片或播放清單網址"
              value={url || ""}
              onChange={(e) => {
                setUrl(e.target.value);
              }}
            />
            {url && (
              <img
                className="download-input-clear-button"
                src={CloseIcon}
                alt="clear-all icon"
                onClick={() => {
                  setUrl("");
                }}
              />
            )}
          </div>
          <div
            className={`download-step-button ${isProcessing && "disabled"}`}
            onClick={isProcessing ? null : handleNextStepButtonClick}
          >
            <div style={{ marginRight: "4px" }}>下一步</div>
            <img
              className="download-step-button-img"
              src={NextIcon}
              alt="next step Icon"
            />
          </div>
        </div>
      )}
      {currentStep === 1 && previewVideo && (
        <div className="download-step1-container">
          <div className="download-video-step1-left">
            <div className="download-step1-title">下載預覽</div>
            <div className="download-preview-thumbnail">
              <img
                className="download-preview-thumbnail-img"
                src={previewVideo.thumbnailUrl}
                alt="thumbnail"
              />
            </div>
            <div className="download-preview-title">{videoTitle}</div>
            <div className="download-preview-author">{previewVideo.author}</div>
            <div
              className={`download-preview-edit-button ${
                isProcessing && "disabled"
              }`}
              onClick={isProcessing ? null : openEditModal}
            >
              <img src={EditIcon} alt="edit icon" />
              <div>編輯</div>
            </div>
          </div>
          <div className="download-video-step1-right">
            <div style={{ marginBottom: "4vh" }}>
              <div className="download-format-title">選擇格式</div>
              <div
                className={`download-format-button ${
                  isProcessing && "disabled"
                }`}
                onClick={isProcessing ? null : downloadAudioMP3}
              >
                <img
                  className="download-format-button-img"
                  src={MP3Icon}
                  alt="download Icon"
                />
                <div>MP3</div>
              </div>
              <div
                className={`download-format-button ${
                  isProcessing && "disabled"
                }`}
                onClick={isProcessing ? null : downloadAudioMP4}
              >
                <img
                  className="download-format-button-img"
                  src={MP4Icon}
                  alt="download Icon"
                />
                <div>MP4</div>
              </div>
            </div>
            <div style={{ marginBottom: "12vh" }}>
              <div className="download-save-title">儲存到音樂庫</div>
              <div
                className={`download-save-button ${isProcessing && "disabled"}`}
                onClick={isProcessing ? null : saveToMusicLibrary}
              >
                <img
                  className="download-save-button-img"
                  src={CDIcon}
                  alt="CD Icon"
                />
                <div>儲存為單曲</div>
              </div>
              <div
                className={`download-save-button ${isProcessing && "disabled"}`}
                onClick={isProcessing ? null : previewPlaylist}
              >
                <img
                  className="download-save-button-img"
                  src={PlaylistIcon}
                  alt="playlist Icon"
                />
                <div>儲存到現有清單</div>
              </div>
            </div>

            <div
              className={`download-step1-button ${isProcessing && "disabled"}`}
              onClick={isProcessing ? null : handlePrevStepButtonClick}
            >
              <img
                className="download-step-button-img"
                src={PrevIcon}
                alt="prev step Icon"
              />
              <div style={{ marginLeft: "4px" }}>回上一步</div>
            </div>
          </div>
        </div>
      )}
      {currentStep === 2 && previewVideo && (
        <div className="download-step1-container">
          <div className="download-video-step1-left">
            <div className="download-step1-title">下載預覽</div>
            <div className="download-preview-thumbnail">
              <img
                className="download-preview-thumbnail-img"
                src={previewVideo.thumbnailUrl}
                alt="thumbnail"
              />
            </div>
            <div className="download-preview-title">{videoTitle}</div>
            <div className="download-preview-author">
              {`共 ${previewVideo.listLength} 首歌曲`}
            </div>
            <div
              className={`download-preview-edit-button ${
                isProcessing && "disabled"
              }`}
              onClick={isProcessing ? null : openEditModal}
            >
              <img src={EditIcon} alt="edit icon" />
              <div>編輯</div>
            </div>
          </div>
          <div className="download-video-step1-right">
            <div style={{ marginBottom: "4vh" }}>
              <div className="download-format-title">選擇格式</div>
              <div
                className={`download-format-button ${
                  isProcessing && "disabled"
                }`}
                onClick={isProcessing ? null : downloadPlaylistMP3}
              >
                <img
                  className="download-format-button-img"
                  src={MP3Icon}
                  alt="download Icon"
                />
                <div>MP3</div>
              </div>
            </div>
            <div style={{ marginBottom: "12vh" }}>
              <div className="download-save-title">儲存到音樂庫</div>
              <div
                className={`download-save-button ${isProcessing && "disabled"}`}
                onClick={isProcessing ? null : downloadPlaylistToMusicLibrary}
              >
                <img
                  className="download-save-button-img"
                  src={CDIcon}
                  alt="CD Icon"
                />
                <div>全部儲存為單曲</div>
              </div>
              <div
                className={`download-save-button ${isProcessing && "disabled"}`}
                onClick={isProcessing ? null : downloadPlaylistToPlaylist}
              >
                <img
                  className="download-save-button-img"
                  src={PlaylistIcon}
                  alt="playlist Icon"
                />
                <div>儲存為播放清單</div>
              </div>
              <div
                className={`download-save-button ${isProcessing && "disabled"}`}
                onClick={isProcessing ? null : previewPlaylist}
              >
                <img
                  className="download-save-button-img"
                  src={AddIcon}
                  alt="playlist Icon"
                />
                <div>儲存至現有清單</div>
              </div>
            </div>

            <div
              className={`download-step1-button ${isProcessing && "disabled"}`}
              onClick={isProcessing ? null : handlePrevStepButtonClick}
            >
              <img
                className="download-step-button-img"
                src={PrevIcon}
                alt="prev step Icon"
              />
              <div style={{ marginLeft: "4px" }}>回上一步</div>
            </div>
          </div>
        </div>
      )}
      {isPlaylistPreviewModalOpen && previewedPlaylists && (
        <div className="playlist-preview-modal">
          <div className="playlist-preview-container">
            <div className="playlist-preview-header">
              <div className="playlist-preview-header-title">選擇播放清單</div>
              <img
                onClick={closePlaylistPreviewModal}
                className="playlist-preview-close-button-img"
                src={CloseIcon}
                alt="Go Back Icon"
              />
            </div>
            <div className="playlist-preview">
              {previewedPlaylists.map((playlist, index) => (
                <div
                  className={`playlist-preview-item ${
                    index === previewedPlaylistsFocusedIndex ? "active" : ""
                  }`}
                  key={playlist.id}
                  onClick={() => {
                    if (isProcessing) return;
                    setPreviewedPlaylistsFocusedIndex(index);
                  }}
                >
                  <div className="playlist-preview-item-thumbnail">
                    <img
                      className="playlist-preview-item-thumbnail-img"
                      src={`data:image/jpeg;base64, ${playlist.thumbnailBase64}`}
                      alt="thumbnail"
                    />
                  </div>
                  <div className="playlist-preview-item-info">
                    <div className="playlist-preview-item-title">
                      {playlist.title}
                    </div>
                    <div className="playlist-preview-item-count">
                      {playlist.idList.length} 首歌曲
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="playlist-preview-button-group">
              <div
                className={`playlist-preview-button submit ${
                  isProcessing && "disabled"
                }`}
                onClick={() => {
                  if (isProcessing) return;
                  currentStep === 1
                    ? downloadSingleToExistedPlaylist()
                    : downloadPlaylistToExistedPlaylist();
                }}
              >
                加入此清單
              </div>
              <div
                className="playlist-preview-button"
                onClick={closePlaylistPreviewModal}
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="download-title-edit-modal">
          <div className="download-title-edit-modal-container">
            <div className="download-title-edit-modal-header">
              <div></div>
              <img
                className="download-title-edit-modal-close-button"
                src={CloseIcon}
                alt="Close"
                onClick={closeEditModal}
              />
            </div>

            <div className="download-title-edit-modal-input-group">
              <div className="download-title-edit-modal-input-group-title">
                {currentStep === 1 ? "編輯歌曲名稱" : "編輯播放清單名稱"}
              </div>
              <ResizableTextArea
                defaultHeight={"10vh"}
                placeholder={videoTitle}
                value={previewTitle}
                maxLength={50}
                setValue={setPreviewTitle}
              />
              <div className="download-title-edit-modal-input-limit">
                <span
                  style={{
                    color: previewTitle.length > 50 ? "red" : "inherit",
                  }}
                >
                  {previewTitle.length}
                </span>
                /50
              </div>
            </div>
            <div className="download-title-edit-modal-button-group">
              <div
                className="download-title-edit-modal-button submit"
                onClick={onEditTitleSubmit}
              >
                確定
              </div>
              <div
                className="download-title-edit-modal-button"
                onClick={closeEditModal}
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer
        autoClose={3000}
        position={toast.POSITION.BOTTOM_CENTER}
      />
    </div>
  );
}
