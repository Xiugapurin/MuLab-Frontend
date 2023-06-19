import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Collection from "./collection";
import Playlist from "./playlist";
import "./home.css";
import DownIcon from "../../asset/icons/down.svg";
import YTIcon from "../../asset/icons/youtube.svg";
import SliderIcon from "../../asset/icons/sliders.svg";
import CloseIcon from "../../asset/icons/close.svg";
import PlayIcon from "../../asset/icons/play.svg";
import PlaylistIcon from "../../asset/icons/playlist.svg";
import CDIcon from "../../asset/icons/cd.svg";
import ShuffleIcon from "../../asset/icons/shuffle.svg";
import AddIcon from "../../asset/icons/add.svg";
import ResizableTextArea from "../../components/resizableTextarea";
const { ipcRenderer } = window.require("electron");

export default function Home() {
  const navigate = useNavigate();

  const onDownloadButtonClick = () => {
    navigate("/download");
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddModalInputOpen, setIsAddModalInputOpen] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState("");
  const [focusedID, setFocusedID] = useState(0);
  const [previewedPlaylists, setPreviewedPlaylists] = useState(null);
  const [focusedPlaylistIndex, setFocusedPlaylistIndex] = useState(0);
  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };
  const previewPlaylist = () => {
    try {
      ipcRenderer.send("getPlaylistData");

      ipcRenderer.on("getPlaylistDataResponse", (event, response) => {
        if (response.success) {
          setPreviewedPlaylists(response.jsonDataArray);
          setIsAddModalOpen(true);
        } else {
          toast.error("無法獲取播放清單資訊");
        }
      });
    } catch (error) {
      toast.error("無法獲取播放清單資訊");
    }
  };
  const openAddModalInput = () => {
    setIsAddModalInputOpen(true);
  };
  const closeAddModalInput = () => {
    setNewPlaylistTitle("");
    setIsAddModalInputOpen(false);
  };
  const onAddModalInputChange = (event) => {
    setNewPlaylistTitle(event.target.value);
  };
  const onAddModalInputSubmit = async () => {
    const toastID = toast.info("正在創建新播放清單", { autoClose: false });
    try {
      ipcRenderer.send("saveAudioToNewPlaylist", focusedID, newPlaylistTitle);

      ipcRenderer.on("saveAudioToNewPlaylistResponse", (event, response) => {
        if (response.success) {
          toast.update(toastID, {
            render: "已創建新播放清單並成功保存音訊",
            type: toast.TYPE.SUCCESS,
            autoClose: 3000,
          });
          setIsAddModalOpen(false);
        } else {
          toast.update(toastID, {
            render: "創建新播放清單時發生錯誤",
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      });
    } catch (error) {
      toast.update(toastID, {
        render: "創建新播放清單時發生錯誤",
        type: toast.TYPE.ERROR,
        autoClose: 3000,
      });
    } finally {
      closeAddModalInput();
    }
  };
  const onAddButtonClick = () => {
    const toastID = toast.info("正在將音訊儲存至播放清單", {
      autoClose: false,
    });
    ipcRenderer.send(
      "saveExistedAudioToExistedPlaylist",
      focusedID,
      previewedPlaylists[focusedPlaylistIndex].id
    );

    ipcRenderer.on(
      "saveExistedAudioToExistedPlaylistResponse",
      (event, response) => {
        if (response.success) {
          toast.update(toastID, {
            render: response.message,
            type: toast.TYPE.SUCCESS,
            autoClose: 3000,
          });
          closeAddModal();
          setFocusedPlaylistIndex(0);
        } else {
          toast.update(toastID, {
            render: response.message,
            type: toast.TYPE.ERROR,
            autoClose: 3000,
          });
        }
      }
    );
  };

  // 歌曲刪除或編輯
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  const [isDeletePlaylistModalOpen, setIsDeletePlaylistModalOpen] =
    useState(false);
  const openDeletePlaylistModal = () => {
    setIsDeletePlaylistModalOpen(true);
  };
  const closeDeletePlaylistModal = () => {
    setIsDeletePlaylistModalOpen(false);
  };
  const [isDeleteFullPlaylistModalOpen, setIsDeleteFullPlaylistModalOpen] =
    useState(false);
  const openDeleteFullPlaylistModal = () => {
    setIsDeleteFullPlaylistModalOpen(true);
  };
  const closeDeleteFullPlaylistModal = () => {
    setIsDeleteFullPlaylistModalOpen(false);
  };

  const deleteAudioByID = async () => {
    try {
      setIsProcessing(true);
      const success = await ipcRenderer.invoke("deleteAudioByID", focusedID);
      if (success) {
        setShouldRefresh(true);
        toast.info("歌曲已刪除", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } else {
        toast.error("刪除失敗，請稍後再試", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }
    } catch (error) {
      toast.error("刪除失敗，請稍後再試", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } finally {
      setIsProcessing(false);
      closeDeleteModal();
    }
  };

  const deletePlaylistByID = async () => {
    try {
      setIsProcessing(true);
      const success = await ipcRenderer.invoke("deletePlaylistByID", focusedID);
      if (success) {
        setShouldRefresh(true);
        toast.info("播放清單已刪除", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } else {
        toast.error("刪除失敗，請稍後再試", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }
    } catch (error) {
      toast.error("刪除失敗，請稍後再試", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } finally {
      setIsProcessing(false);
      closeDeletePlaylistModal();
    }
  };

  const deleteFullPlaylistByID = async () => {
    try {
      setIsProcessing(true);
      const success = await ipcRenderer.invoke(
        "deleteFullPlaylistByID",
        focusedID
      );
      if (success) {
        setShouldRefresh(true);
        toast.info("播放清單已刪除", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } else {
        toast.error("刪除失敗，請稍後再試", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }
    } catch (error) {
      toast.error("刪除失敗，請稍後再試", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } finally {
      setIsProcessing(false);
      closeDeleteFullPlaylistModal();
    }
  };

  // 歌曲資訊編輯
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [focusedTitle, setFocusedTitle] = useState("");
  const [focusedAuthor, setFocusedAuthor] = useState("");
  const openEditModal = () => {
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const onEditTitleSubmit = async () => {
    try {
      setIsProcessing(true);
      const success = await ipcRenderer.invoke(
        "editAudioTitleAndAuthorByID",
        focusedID,
        focusedTitle,
        focusedAuthor
      );
      if (success) {
        setShouldRefresh(true);
        toast.success("歌曲資訊更新成功", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      } else {
        toast.error("更新失敗，請稍後再試", {
          position: toast.POSITION.BOTTOM_CENTER,
        });
      }
    } catch (error) {
      toast.error("更新失敗，請稍後再試", {
        position: toast.POSITION.BOTTOM_CENTER,
      });
    } finally {
      setIsProcessing(false);
      closeEditModal();
    }
  };

  const onEditTitleCancel = () => {
    setFocusedTitle("");
    closeEditModal();
  };

  // 其他功能
  const [isSettingMenuOpen, setIsSettingMenuOpen] = useState(false);
  const toggleSettingMenu = () => {
    if (isSortMenuOpen) setIsSortMenuOpen(false);
    setIsSettingMenuOpen(!isSettingMenuOpen);
  };

  // 歌曲排序
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isTimeReverse, setIsTimeReverse] = useState(true);
  const toggleSortMenu = () => {
    if (isSettingMenuOpen) setIsSettingMenuOpen(false);
    setIsSortMenuOpen(!isSortMenuOpen);
  };
  const toggleTimeReverse = () => {
    setIsTimeReverse(!isTimeReverse);
    setShouldRefresh(true);
  };

  // 首頁切換
  const [homeSwitch, setHomeSwitch] = useState(true);
  const onSwitchButtonClick = () => {
    setHomeSwitch(!homeSwitch);
    setIsSettingMenuOpen(false);
    setIsSortMenuOpen(false);
  };

  // 播放按鈕
  const handlePlayAllButtonClick = () => {
    ipcRenderer.send("getMusicLibraryAudioIDList", isTimeReverse);

    ipcRenderer.on("getMusicLibraryAudioIDListResponse", (event, data) => {
      if (data.success) {
        const audioIDList = data.audioIds; // 獲取音訊 ID 陣列

        // 導航至 /player 並傳遞音訊 ID 陣列作為參數
        navigate("/player", { state: { audioIDList } });
      } else {
        console.error("Failed to get music library audio.");
      }
    });
  };

  const handleRandomPlayAllButtonClick = () => {
    ipcRenderer.send("getMusicLibraryAudioIDList", isTimeReverse);

    ipcRenderer.on("getMusicLibraryAudioIDListResponse", (event, data) => {
      if (data.success) {
        const audioIDList = data.audioIds; // 獲取音訊 ID 陣列

        const randomIndex = Math.floor(Math.random() * audioIDList.length);
        navigate("/player", {
          state: {
            audioIDList,
            initRandom: true,
            initIndex: randomIndex,
          },
        });
      } else {
        console.error("Failed to get music library audio.");
      }
    });
  };

  return (
    <div className="home-container">
      {isAddModalOpen && (
        <div className="home-playlist-preview-modal">
          <div className="home-playlist-preview-container">
            <div className="home-playlist-preview-header">
              <div className="home-playlist-preview-header-title">
                選擇播放清單
              </div>
              <img
                onClick={closeAddModal}
                className="home-playlist-preview-close-button-img"
                src={CloseIcon}
                alt="Go Back Icon"
              />
            </div>
            <div className="home-playlist-preview">
              {previewedPlaylists &&
                previewedPlaylists.map((playlist, index) => (
                  <div
                    className={`home-playlist-preview-item ${
                      index === focusedPlaylistIndex ? "active" : ""
                    }`}
                    key={playlist.id}
                    onClick={() => {
                      setFocusedPlaylistIndex(index);
                    }}
                  >
                    <div className="home-playlist-preview-item-thumbnail">
                      <img
                        className="home-playlist-preview-item-thumbnail-img"
                        src={`data:image/jpeg;base64, ${playlist.thumbnailBase64}`}
                        alt="thumbnail"
                      />
                    </div>
                    <div className="home-playlist-preview-item-info">
                      <div className="home-playlist-preview-item-title">
                        {playlist.title}
                      </div>
                      <div className="home-playlist-preview-item-count">
                        {playlist.idList.length} 首歌曲
                      </div>
                    </div>
                  </div>
                ))}
              {!isAddModalInputOpen && (
                <div
                  className="home-playlist-preview-new-button"
                  onClick={openAddModalInput}
                >
                  <img src={AddIcon} alt="Add" />
                  <div>新增播放清單</div>
                </div>
              )}
              {isAddModalInputOpen && (
                <div className="home-playlist-preview-new-input-section">
                  <div className="home-playlist-preview-new-input-title">
                    標題
                  </div>
                  <input
                    className="home-playlist-preview-new-input"
                    type="text"
                    placeholder="輸入播放清單名稱"
                    value={newPlaylistTitle}
                    onChange={onAddModalInputChange}
                    maxLength={20}
                  />
                  <div className="home-playlist-preview-new-input-limit">
                    {newPlaylistTitle.length}/20
                  </div>
                </div>
              )}
            </div>
            <div className="home-playlist-preview-button-group">
              <div
                className="home-playlist-preview-button submit"
                onClick={
                  isAddModalInputOpen ? onAddModalInputSubmit : onAddButtonClick
                }
              >
                {isAddModalInputOpen ? "創建並加入" : "加入此清單"}
              </div>
              <div
                className="home-playlist-preview-button"
                onClick={
                  isAddModalInputOpen ? closeAddModalInput : closeAddModal
                }
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="home-modal">
          <div className="home-modal-container">
            <div>
              <div className="home-modal-header">
                <div className="home-modal-title">刪除歌曲確認</div>
                <img
                  className="home-modal-close-button"
                  src={CloseIcon}
                  alt="Close"
                  onClick={closeDeleteModal}
                />
              </div>
              <div className="home-modal-text" style={{ margin: "4vh 0" }}>
                確定要刪除此歌曲嗎？
                <br />
                此操作無法回復
              </div>
            </div>
            <div className="home-modal-button-group">
              <div
                className="home-modal-button submit"
                onClick={isProcessing ? null : deleteAudioByID}
              >
                確定
              </div>
              <div
                className="home-modal-button"
                onClick={isProcessing ? null : closeDeleteModal}
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}
      {isDeletePlaylistModalOpen && (
        <div className="home-modal">
          <div className="home-modal-container">
            <div>
              <div className="home-modal-header">
                <div className="home-modal-title">刪除播放清單確認</div>
                <img
                  className="home-modal-close-button"
                  src={CloseIcon}
                  alt="Close"
                  onClick={closeDeletePlaylistModal}
                />
              </div>
              <div className="home-modal-text" style={{ margin: "4vh 0" }}>
                確定要刪除此播放清單嗎？
                <br />
                此操作無法回復
              </div>
            </div>
            <div className="home-modal-button-group">
              <div
                className="home-modal-button submit"
                onClick={isProcessing ? null : deletePlaylistByID}
              >
                確定
              </div>
              <div
                className="home-modal-button"
                onClick={isProcessing ? null : closeDeletePlaylistModal}
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}
      {isDeleteFullPlaylistModalOpen && (
        <div className="home-modal">
          <div className="home-modal-container">
            <div>
              <div className="home-modal-header">
                <div className="home-modal-title">刪除播放清單確認</div>
                <img
                  className="home-modal-close-button"
                  src={CloseIcon}
                  alt="Close"
                  onClick={closeDeleteFullPlaylistModal}
                />
              </div>
              <div className="home-modal-text" style={{ margin: "4vh 0" }}>
                確定要將此清單以及清單內的所有歌曲一併刪除嗎？
                <br />
                此操作無法回復
              </div>
            </div>
            <div className="home-modal-button-group">
              <div
                className="home-modal-button submit"
                onClick={isProcessing ? null : deleteFullPlaylistByID}
              >
                確定
              </div>
              <div
                className="home-modal-button"
                onClick={isProcessing ? null : closeDeleteFullPlaylistModal}
              >
                取消
              </div>
            </div>
          </div>
        </div>
      )}
      {isEditModalOpen && (
        <div className="home-modal">
          <div className="home-modal-container">
            <div className="home-modal-header">
              <div></div>
              <img
                className="home-modal-close-button"
                src={CloseIcon}
                alt="Close"
                onClick={closeEditModal}
              />
            </div>

            <div className="home-modal-input-group">
              <div className="home-modal-input-group-title">更改歌曲名稱</div>
              <ResizableTextArea
                defaultHeight={"20vh"}
                placeholder={focusedTitle}
                value={focusedTitle}
                maxLength={50}
                setValue={setFocusedTitle}
              />
              <div className="home-modal-input-limit">
                <span
                  style={{
                    color: focusedTitle.length > 50 ? "red" : "inherit",
                  }}
                >
                  {focusedTitle.length}
                </span>
                /50
              </div>
            </div>
            <div className="home-modal-input-group">
              <div className="home-modal-input-group-title">更改演奏者資訊</div>
              <ResizableTextArea
                defaultHeight={"10vh"}
                placeholder={focusedAuthor}
                value={focusedAuthor}
                maxLength={30}
                setValue={setFocusedAuthor}
              />
              <div className="home-modal-input-limit">
                <span
                  style={{
                    color: focusedAuthor.length > 30 ? "red" : "inherit",
                  }}
                >
                  {focusedAuthor.length}
                </span>
                /50
              </div>
            </div>
            <div className="home-modal-button-group">
              <div
                className="home-modal-button submit"
                onClick={onEditTitleSubmit}
              >
                確定
              </div>
              <div className="home-modal-button" onClick={onEditTitleCancel}>
                取消
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="home-function-bar">
        <div className="home-switch-button" onClick={toggleSettingMenu}>
          <div className="home-title">{homeSwitch ? "音樂庫" : "播放清單"}</div>
          <img className="home-switch-img" src={DownIcon} alt="View Playlist" />
          {isSettingMenuOpen && (
            <div className="home-menu setting-menu">
              {homeSwitch && (
                <>
                  <div
                    className="home-menu-item setting-menu-item"
                    onClick={handlePlayAllButtonClick}
                  >
                    <img
                      className="home-menu-item-img"
                      src={PlayIcon}
                      alt="Play"
                    />
                    <div>播放全部</div>
                  </div>
                  <div
                    className="home-menu-item setting-menu-item"
                    onClick={handleRandomPlayAllButtonClick}
                  >
                    <img
                      className="home-menu-item-img"
                      src={ShuffleIcon}
                      alt="Random Play"
                    />
                    <div>隨機播放全部</div>
                  </div>
                </>
              )}
              <div
                className="home-menu-item setting-menu-item"
                onClick={onDownloadButtonClick}
              >
                <img
                  className="home-menu-item-img"
                  src={YTIcon}
                  alt="Download"
                />
                <div>下載新的音訊</div>
              </div>
              <div
                className="home-menu-item setting-menu-item"
                onClick={onSwitchButtonClick}
              >
                <img
                  className="home-menu-item-img"
                  src={homeSwitch ? PlaylistIcon : CDIcon}
                  alt="Playlist"
                />
                <div>{homeSwitch ? "查看播放清單" : "查看音樂庫"}</div>
              </div>
            </div>
          )}
        </div>
        <div className="home-sort-button-container">
          <div className="home-sort-button" onClick={toggleSortMenu}>
            <p>排序</p>
            <img
              className="home-sort-button-img"
              src={SliderIcon}
              alt="Download Icon"
            />
          </div>
          {isSortMenuOpen && (
            <div className="home-menu sort-menu">
              <div
                className="home-menu-item"
                onClick={toggleTimeReverse}
              >{`依時間 ${isTimeReverse ? "(最新)" : "(最舊)"}`}</div>
              <div className="home-menu-item">{`依作者 (無)`}</div>
            </div>
          )}
        </div>
      </div>

      {homeSwitch ? (
        <Collection
          setFocusedID={setFocusedID}
          shouldRefresh={shouldRefresh}
          setShouldRefresh={setShouldRefresh}
          previewPlaylist={previewPlaylist}
          openDeleteModal={openDeleteModal}
          setFocusedTitle={setFocusedTitle}
          setFocusedAuthor={setFocusedAuthor}
          openEditModal={openEditModal}
          isTimeReverse={isTimeReverse}
        />
      ) : (
        <Playlist
          setFocusedID={setFocusedID}
          shouldRefresh={shouldRefresh}
          setShouldRefresh={setShouldRefresh}
          openDeletePlaylistModal={openDeletePlaylistModal}
          openDeleteFullPlaylistModal={openDeleteFullPlaylistModal}
          isTimeReverse={isTimeReverse}
        />
      )}

      <ToastContainer
        autoClose={3000}
        position={toast.POSITION.BOTTOM_CENTER}
      />
    </div>
  );
}
