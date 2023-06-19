import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Reorder } from "framer-motion";
import { getFormatTime } from "../utils/getFormatTime";
import LoadingText from "../components/loadingText";
import "./playlistDetail.css";
import BackIcon from "../asset/icons/go-back.svg";
import EditIcon from "../asset/icons/edit.svg";
import CloseIcon from "../asset/icons/close.svg";
import PlayIcon from "../asset/icons/play-w.svg";
import ShuffleIcon from "../asset/icons/shuffle-w.svg";
import MoreIcon from "../asset/icons/more.svg";
const { ipcRenderer } = window.require("electron");

const PlaylistDetailAudioItem = ({
  audio,
  openDeleteModal,
  setFocusedAudioID,
  onMoveAudioToTheTop,
  onMoveAudioToTheBottom,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsMenuOpen(false);
  };
  const handleMenuClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(false);
  };

  const handleDeleteAudioFromPlaylist = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openDeleteModal();
    setFocusedAudioID(audio.id);
    setIsMenuOpen(false);
  };

  const handleMoveAudioToTheTop = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onMoveAudioToTheTop(audio.id);
    setIsMenuOpen(false);
  };

  const handleMoveAudioToTheBottom = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onMoveAudioToTheBottom(audio.id);
    setIsMenuOpen(false);
  };

  return (
    <div
      className="playlist-detail-audio"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        className="playlist-detail-audio-thumbnail"
        src={`data:image/jpeg;base64, ${audio.thumbnailBase64}`}
        alt="Thumbnail"
      />
      <div className="playlist-detail-audio-info">
        <div className="playlist-detail-audio-title">{audio.title}</div>
        <div className="playlist-detail-audio-author">{audio.author}</div>
      </div>
      {isHovered && (
        <div style={{ position: "relative" }}>
          <img
            className="playlist-detail-audio-more-action-button"
            src={MoreIcon}
            alt="More Actions"
            onPointerDownCapture={handleMenuClick}
          />
          {isMenuOpen && (
            <div className="playlist-detail-audio-more-action-menu">
              <div
                className="playlist-detail-audio-more-action-menu-item"
                onPointerDownCapture={handleMoveAudioToTheTop}
              >
                <div>移至頂端</div>
              </div>
              <div
                className="playlist-detail-audio-more-action-menu-item"
                onPointerDownCapture={handleMoveAudioToTheBottom}
              >
                <div>移至底部</div>
              </div>
              <div
                className="playlist-detail-audio-more-action-menu-item"
                onPointerDownCapture={handleDeleteAudioFromPlaylist}
              >
                <div>移除此歌曲</div>
              </div>
              <div
                className="playlist-detail-audio-more-action-menu-item"
                onPointerDownCapture={handleMenuClose}
              >
                <div>取消</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function PlaylistDetail() {
  const location = useLocation();
  const playlistInfo = location.state?.playlistInfo;
  const [playlistData, setPlaylistData] = useState(null);
  const [playlistDuration, setPlaylistDuration] = useState(0);
  const [playlistTitle, setPlaylistTitle] = useState(playlistInfo.title);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);

  const updatePlaylistIDList = async () => {
    const idList = playlistData.map((audio) => audio.id);
    try {
      const response = await ipcRenderer.invoke("updatePlaylistIDList", {
        playlistID: playlistInfo.id,
        idList,
        thumbnailBase64: playlistData[0].thumbnailBase64,
      });
      return response; // 回傳更新結果
    } catch (error) {
      console.error("Failed to update playlist ID list:", error);
      return false; // 回傳失敗訊息
    }
  };

  const navigate = useNavigate();
  const goBack = async () => {
    // 呼叫更新播放清單 ID 列表的函式
    const updateResult = await updatePlaylistIDList();

    if (!updateResult) {
      console.error("Failed to update playlist ID list");
    }
    navigate("/");
  };

  // 獲取音樂資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ipcRenderer.invoke(
          "getAudioData",
          playlistInfo.idList
        );
        setPlaylistData(response);
        setPlaylistDuration(
          response.reduce((acc, cur) => acc + cur.duration, 0)
        );
      } catch (error) {
        console.error("Failed to fetch audio data:", error);
      }
    };
    fetchData();
  }, [playlistInfo]);

  // 監聽滾動事件
  const handleScroll = () => {
    setIsScrolling(true);

    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    const timeout = setTimeout(() => {
      setIsScrolling(false);
    }, 2000);

    setScrollTimeout(timeout);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [prevTitle, setPrevTitle] = useState(playlistTitle);
  const [warningMessage, setWarningMessage] = useState("");
  const openModal = () => {
    setIsModalOpen(true);
    setPrevTitle(playlistTitle);
  };
  const onPlaylistTitleChange = (e) => {
    setPlaylistTitle(e.target.value);
  };
  const onPlaylistTitleSubmit = async () => {
    if (playlistTitle === "") {
      setWarningMessage("播放清單名稱不能為空");
      return;
    }
    if (playlistTitle === prevTitle) {
      setIsModalOpen(false);
      return;
    }
    try {
      await ipcRenderer.invoke("updatePlaylistTitle", {
        playlistID: playlistInfo.id,
        title: playlistTitle,
      });
      setPrevTitle(playlistTitle);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to update playlist title:", error);
    }
  };
  const onPlaylistTitleCancel = () => {
    setPlaylistTitle(prevTitle);
    setIsModalOpen(false);
    setWarningMessage("");
  };

  // 長按時不觸發點擊事件
  const [isLongPress, setIsLongPress] = useState(false);
  const [pressTimer, setPressTimer] = useState(null);
  const onAudioClick = async (index) => {
    // 呼叫更新播放清單 ID 列表的函式
    const updateResult = await updatePlaylistIDList();

    if (!updateResult) {
      console.error("Failed to update playlist ID list");
    }

    const newPlaylistInfo = {
      ...playlistInfo,
      idList: playlistData.map((audio) => audio.id),
    };

    const audioIDList = playlistData.map((audio) => audio.id);
    navigate("/player", {
      state: { audioIDList, playlistInfo: newPlaylistInfo, initIndex: index },
    });
  };
  const handleMouseDown = () => {
    setPressTimer(setTimeout(() => setIsLongPress(true), 200)); // 設定長按的時間閾值，這裡設為 500 毫秒
  };

  const handleMouseUp = (index) => {
    clearTimeout(pressTimer);
    if (isLongPress) {
      setIsLongPress(false);
    } else {
      onAudioClick(index);
    }
  };

  // 播放按鈕事件
  const onPlayAllButtonClick = async () => {
    // 呼叫更新播放清單 ID 列表的函式
    const updateResult = await updatePlaylistIDList();

    if (!updateResult) {
      console.error("Failed to update playlist ID list");
    }

    const newPlaylistInfo = {
      ...playlistInfo,
      idList: playlistData.map((audio) => audio.id),
    };

    const audioIDList = playlistData.map((audio) => audio.id);
    navigate("/player", {
      state: { audioIDList, playlistInfo: newPlaylistInfo },
    });
  };

  const onRandomPlayAllButtonClick = async () => {
    // 呼叫更新播放清單 ID 列表的函式
    const updateResult = await updatePlaylistIDList();

    if (!updateResult) {
      console.error("Failed to update playlist ID list");
    }

    const audioIDList = playlistData.map((audio) => audio.id);
    const newPlaylistInfo = {
      ...playlistInfo,
      idList: playlistData.map((audio) => audio.id),
    };
    const randomIndex = Math.floor(Math.random() * audioIDList.length);
    navigate("/player", {
      state: {
        audioIDList,
        playlistInfo: newPlaylistInfo,
        initRandom: true,
        initIndex: randomIndex,
      },
    });
  };

  // 更多按鈕點擊事件
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [focusedAudioID, setFocusedAudioID] = useState(0);
  const openDeleteModal = () => {
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };
  const onDeleteAudioFromPlaylist = async () => {
    try {
      const response = await ipcRenderer.invoke("deleteAudioFromPlaylist", {
        playlistID: playlistInfo.id,
        audioID: focusedAudioID,
      });

      if (response.success) {
        if (response.playlistDeleted) {
          navigate("/");
        } else {
          toast.success("已將歌曲從播放清單中移除");
          const newPlaylistData = playlistData.filter(
            (audio) => audio.id !== focusedAudioID
          );
          setPlaylistData(newPlaylistData);
          setPlaylistDuration(
            newPlaylistData.reduce((acc, cur) => acc + cur.duration, 0)
          );
        }
      } else {
        toast.error("移除此歌曲時發生錯誤");
      }
    } catch (error) {
      toast.error("移除此歌曲時發生錯誤");
    } finally {
      closeDeleteModal();
      setFocusedAudioID(0);
    }
  };
  const onMoveAudioToTheTop = (audioID) => {
    const newPlaylistData = playlistData.filter(
      (audio) => audio.id !== audioID
    );
    const audioToMove = playlistData.find((audio) => audio.id === audioID);
    setPlaylistData([audioToMove, ...newPlaylistData]);
  };
  const onMoveAudioToTheBottom = (audioID) => {
    const newPlaylistData = playlistData.filter(
      (audio) => audio.id !== audioID
    );
    const audioToMove = playlistData.find((audio) => audio.id === audioID);
    setPlaylistData([...newPlaylistData, audioToMove]);
  };

  return (
    <div className="playlist-detail-container">
      <div className="playlist-detail-background-1" />
      <div className="playlist-detail-background-2" />
      {!playlistData && (
        <div className="playlist-detail-loading">
          <LoadingText text={"正在載入播放清單"} />
        </div>
      )}
      <div className="player-back-button" onClick={goBack}>
        <img
          className="player-back-button-img"
          src={BackIcon}
          alt="Back Icon"
        />
      </div>
      <div className="playlist-detail-content">
        {playlistData && (
          <>
            {/* Edit Modal */}
            {isModalOpen && (
              <div className="playlist-detail-modal">
                <div className="playlist-detail-modal-container">
                  <div className="playlist-detail-modal-header">
                    <div className="playlist-detail-modal-title">
                      更改播放清單名稱
                    </div>
                    <img
                      className="playlist-detail-modal-close-button"
                      src={CloseIcon}
                      alt="Close"
                      onClick={onPlaylistTitleCancel}
                    />
                  </div>

                  <div className="playlist-detail-modal-input-group">
                    <input
                      className="playlist-detail-modal-input"
                      type="text"
                      placeholder={playlistTitle}
                      value={playlistTitle}
                      maxLength={20}
                      onChange={onPlaylistTitleChange}
                    />
                    <div className="playlist-detail-modal-input-limit">
                      <p style={{ color: "#ff2323" }}>{warningMessage}</p>
                      <p>{playlistTitle.length}/20</p>
                    </div>
                  </div>
                  <div className="playlist-detail-modal-button-group">
                    <div
                      className="playlist-detail-modal-button submit"
                      onClick={onPlaylistTitleSubmit}
                    >
                      確定
                    </div>
                    <div
                      className="playlist-detail-modal-button"
                      onClick={onPlaylistTitleCancel}
                    >
                      取消
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Delete Modal */}
            {isDeleteModalOpen && (
              <div className="playlist-detail-modal">
                <div className="playlist-detail-modal-container">
                  <div className="playlist-detail-modal-header">
                    <div className="playlist-detail-modal-title">
                      移除歌曲確認
                    </div>
                    <img
                      className="playlist-detail-modal-close-button"
                      src={CloseIcon}
                      alt="Close"
                      onClick={closeDeleteModal}
                    />
                  </div>
                  <div className="playlist-detail-modal-text">
                    確定要將此歌曲從播放清單中移除嗎？
                    <br />
                    {playlistData.length === 1 && "(此播放清單會同時被刪除)"}
                  </div>
                  <div className="playlist-detail-modal-button-group">
                    <div
                      className="playlist-detail-modal-button submit"
                      onClick={onDeleteAudioFromPlaylist}
                    >
                      確定
                    </div>
                    <div
                      className="playlist-detail-modal-button"
                      onClick={closeDeleteModal}
                    >
                      取消
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="playlist-detail-left">
              <div className="playlist-detail-thumbnail">
                <img
                  className="playlist-detail-thumbnail-bg-img"
                  src={`data:image/jpeg;base64, ${playlistInfo.thumbnailBase64}`}
                  alt="thumbnail"
                />
                <img
                  className="playlist-detail-thumbnail-img"
                  src={`data:image/jpeg;base64, ${playlistInfo.thumbnailBase64}`}
                  alt="thumbnail"
                />
              </div>
              <div className="playlist-detail-info">
                <div className="playlist-detail-title">
                  <div className="playlist-detail-title-text">
                    {isModalOpen ? prevTitle : playlistTitle}
                  </div>
                  <img
                    className="playlist-detail-title-edit-button"
                    src={EditIcon}
                    alt="Edit Title"
                    onClick={openModal}
                  />
                </div>
                <div className="playlist-detail-info-text">
                  {playlistData.length} 首歌曲
                </div>
                <div className="playlist-detail-info-text">
                  {getFormatTime(playlistDuration)}
                </div>
              </div>
              <div className="playlist-detail-play-button-group">
                <div
                  className="playlist-detail-play-button"
                  onClick={onPlayAllButtonClick}
                >
                  <img src={PlayIcon} alt="Play All" />
                  <p>播放全部</p>
                </div>
                <div
                  className="playlist-detail-play-button"
                  onClick={onRandomPlayAllButtonClick}
                >
                  <img src={ShuffleIcon} alt="Random Play All" />
                  <p>隨機播放全部</p>
                </div>
              </div>
            </div>
            <Reorder.Group
              className={`playlist-detail-right${
                isScrolling ? "" : " non-scrolling"
              }`}
              onScroll={handleScroll}
              values={playlistData}
              onReorder={setPlaylistData}
              initial={false}
            >
              {playlistData.map((audio, index) => (
                <Reorder.Item
                  key={audio.id}
                  value={audio}
                  onMouseDown={handleMouseDown}
                  onMouseUp={() => handleMouseUp(index)}
                >
                  <PlaylistDetailAudioItem
                    audio={audio}
                    openDeleteModal={openDeleteModal}
                    setFocusedAudioID={setFocusedAudioID}
                    onMoveAudioToTheTop={onMoveAudioToTheTop}
                    onMoveAudioToTheBottom={onMoveAudioToTheBottom}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </>
        )}
      </div>

      <ToastContainer
        autoClose={3000}
        position={toast.POSITION.BOTTOM_CENTER}
      />
    </div>
  );
}
