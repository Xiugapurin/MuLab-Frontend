import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./player.css";
import BackIcon from "../../asset/icons/go-back.svg";
import CloseIcon from "../../asset/icons/close.svg";
import NextIcon from "../../asset/icons/next.svg";
import PrevIcon from "../../asset/icons/prev.svg";
import ShuffleIcon from "../../asset/icons/shuffle-w.svg";
import LoadingImage from "../../asset/images/loading.jpg";
import AudioFunction from "./audioFunction";
import LoadingText from "../../components/loadingText";
import TitleContainer from "./titleContainer";
const { ipcRenderer } = window.require("electron");

// 解碼 base64 字串為 Blob URL
const decodeBase64 = (base64String) => {
  const decodedString = atob(base64String);
  const bytes = new Uint8Array(decodedString.length);
  for (let i = 0; i < decodedString.length; i++) {
    bytes[i] = decodedString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: "audio/mp3" });
  return URL.createObjectURL(blob);
};

// 生成隨機播放清單
const generateRandomPlaylist = (length, index) => {
  const playlist = [...Array(length).keys()];

  // 進行初始洗牌
  for (let i = playlist.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
  }

  // 將 currentIndex 插入到 initIndex 的位置
  const currentIndex = playlist.indexOf(index);
  if (currentIndex !== -1) {
    playlist[currentIndex] = playlist[index];
    playlist[index] = index;
  }

  return playlist;
};

const getNextIndex = (currentIndex, length, isNext) => {
  // 根據 isNext 判斷是下一首還是上一首
  let nextIndex;

  if (isNext) {
    // 連續播放模式
    nextIndex = (currentIndex + 1) % length;
  } else {
    nextIndex = currentIndex - 1 < 0 ? length - 1 : currentIndex - 1;
  }

  return nextIndex;
};

const Player = () => {
  const location = useLocation();
  const {
    playlistInfo = null,
    audioIDList,
    initIndex = 0,
    initRandom = false,
  } = location.state || {};
  const [audioData, setAudioData] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(initIndex);
  const [actualAudioIndex, setActualAudioIndex] = useState(initIndex);
  const [isNextRandom, setIsNextRandom] = useState(initRandom);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [randomizedList, setRandomizedList] = useState([]);
  const navigate = useNavigate();

  const goBack = () => {
    playlistInfo
      ? navigate("/playlistDetail", {
          state: { playlistInfo },
        })
      : navigate("/");
  };

  useEffect(() => {
    const playlist = generateRandomPlaylist(audioIDList.length, initIndex);

    setRandomizedList(playlist);
  }, [audioIDList, initIndex]);

  const toggleRandom = () => {
    if (!isNextRandom) {
      // 生成隨機播放清單
      const playlist = generateRandomPlaylist(
        audioIDList.length,
        actualAudioIndex
      );
      setRandomizedList(playlist);
    }

    setIsNextRandom((prevIsRandom) => !prevIsRandom);
  };

  // 獲取音樂資料
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await ipcRenderer.invoke("getAudioData", audioIDList);
        setAudioData(response);
      } catch (error) {
        console.error("Failed to fetch audio data:", error);
      }
    };
    fetchData();
  }, [audioIDList]);

  // 監聽標題變化並設置 shouldAnimate 狀態
  const audioTitleRef = useRef(null);
  const [titleWidth, setTitleWidth] = useState(0);
  const handleTitleResize = () => {
    if (audioTitleRef.current) {
      const { scrollWidth } = audioTitleRef.current;
      setTitleWidth(scrollWidth);
      const clientWidth = window.innerWidth * 0.4; // 視窗寬度的 40%
      if (scrollWidth > clientWidth) {
        setShouldAnimate(true);
      } else {
        setShouldAnimate(false);
      }
    }
  };

  // 在取得音樂資料後進行編碼並設定檔案連結，進行隨機播放清單的建立
  useEffect(() => {
    if (audioData && audioData.length > 0) {
      const url = decodeBase64(audioData[actualAudioIndex].audioBase64);
      setAudioUrl(url);
      handleTitleResize();
    }
  }, [audioData, actualAudioIndex]);

  // 監聽視窗大小變化和初始化時的標題變化
  useEffect(() => {
    window.addEventListener("resize", handleTitleResize);
    handleTitleResize();

    return () => {
      window.removeEventListener("resize", handleTitleResize);
    };
  }, []);

  // 播放下一首或上一首
  const handleNextPreviousButtonClick = (isNext) => {
    setAudioData((prevAudioData) => {
      const totalSongs = prevAudioData.length;

      // 根據 isNext 判斷是下一首還是上一首
      let nextIndex;

      if (isNextRandom) {
        // 使用隨機播放清單切換下一首
        nextIndex = getNextIndex(currentAudioIndex, totalSongs, isNext);
        const actualIndex = randomizedList[nextIndex];
        setActualAudioIndex(actualIndex);
      } else {
        // 使用正常的索引切換下一首
        nextIndex = getNextIndex(actualAudioIndex, totalSongs, isNext);
        setActualAudioIndex(nextIndex);
      }

      setCurrentAudioIndex(nextIndex);

      return prevAudioData;
    });
  };

  // 檔案連結改變時釋放資源
  useEffect(() => {
    return () => {
      // 清理資源
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // 監聽鼠標
  const [isMouseMove, setIsMouseMove] = useState(false);
  const playerContainerRef = useRef(null);
  const playerBackgroundRef = useRef(null);
  const buttonHideTimeoutRef = useRef(null);
  useEffect(() => {
    const playerContainer = playerContainerRef.current;

    // 調整background的rotate角度
    playerContainer.addEventListener("mousemove", handleMouseMove);
    return () => {
      playerContainer.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleMouseMove = (event) => {
    // 鼠標移動時顯示音樂控制按鈕
    setIsMouseMove(true);
    clearTimeout(buttonHideTimeoutRef.current);
    buttonHideTimeoutRef.current = setTimeout(() => {
      setIsMouseMove(false);
    }, 2000);

    const playerContainer = playerContainerRef.current;
    const playerBackground = playerBackgroundRef.current;

    // 取得游標的垂直位置
    const mouseY = event.clientY;
    const containerHeight = playerContainer.offsetHeight;
    const yMoveRange = 20;

    // 計算背景的垂直移動距離
    const yMoveDistance =
      -(mouseY / containerHeight) * yMoveRange * 2 + yMoveRange;

    // 調整背景的垂直移動
    playerBackground.style.transform = `translateY(${yMoveDistance}px)`;
  };

  // 播放清單預覽
  const containerRef = useRef(null);
  const [isPlaylistModalOpen, setPlaylistModalOpen] = useState(false);
  const openModal = () => {
    setPlaylistModalOpen(true);
  };

  const closeModal = () => {
    setPlaylistModalOpen(false);
  };

  // 開啟播放清單預覽時滾動到目前播放的歌曲
  useEffect(() => {
    if (isPlaylistModalOpen && containerRef.current) {
      containerRef.current.scrollTo(0, 72 * (actualAudioIndex - 1));
    }
  }, [isPlaylistModalOpen, actualAudioIndex]);

  return (
    <div className="player-container" ref={playerContainerRef}>
      <div className="player-background" ref={playerBackgroundRef} />
      <div className="player-back-button" onClick={goBack}>
        <img
          className="player-back-button-img"
          src={BackIcon}
          alt="Back Icon"
        />
      </div>
      {audioData ? (
        <div className="audio-container">
          <div className="audio-container-center">
            <div className="audio-container-head">
              <div
                className={`audio-button ${isMouseMove ? "visible" : ""}`}
                onClick={() => handleNextPreviousButtonClick(false)}
              >
                <img
                  className="audio-button-img"
                  src={PrevIcon}
                  alt="Prev Icon"
                />
              </div>
              <div className="audio-thumbnail">
                <img
                  className="audio-thumbnail-bg-img"
                  src={`data:image/jpeg;base64, ${audioData[actualAudioIndex].thumbnailBase64}`}
                  alt="thumbnail"
                />
                <img
                  className="audio-thumbnail-img"
                  src={`data:image/jpeg;base64, ${audioData[actualAudioIndex].thumbnailBase64}`}
                  alt="thumbnail"
                />
              </div>
              <div
                className={`audio-button ${isMouseMove ? "visible" : ""}`}
                onClick={() => handleNextPreviousButtonClick(true)}
              >
                <img
                  className="audio-button-img"
                  src={NextIcon}
                  alt="Next Icon"
                />
              </div>
            </div>
            <div className="audio-info">
              <TitleContainer width={titleWidth}>
                <div className="audio-title-container">
                  <div
                    className={`audio-title-move ${
                      shouldAnimate ? "animate" : ""
                    }`}
                  >
                    <div className={"audio-title"} ref={audioTitleRef}>
                      {audioData[actualAudioIndex].title}
                    </div>
                  </div>
                </div>
              </TitleContainer>
              <div className="audio-author">
                {audioData[actualAudioIndex].author}
              </div>
            </div>
          </div>
          {isPlaylistModalOpen && (
            <div className="audio-playlist-modal">
              <div ref={containerRef} className="audio-playlist-container">
                <div className="audio-playlist-header">
                  <div className="audio-playlist-header-title">
                    目前播放清單
                  </div>
                  <img
                    onClick={closeModal}
                    className="audio-playlist-close-button-img"
                    src={CloseIcon}
                    alt="Go Back Icon"
                  />
                </div>
                <div className="audio-playlist">
                  {audioData.map((audio, index) => (
                    <div
                      className={`audio-playlist-item ${
                        index === actualAudioIndex ? "active" : ""
                      }`}
                      key={audio.id}
                      onClick={() => setActualAudioIndex(index)}
                    >
                      <div className="audio-playlist-item-thumbnail">
                        <img
                          className="audio-playlist-item-thumbnail-img"
                          src={`data:image/jpeg;base64, ${audio.thumbnailBase64}`}
                          alt="thumbnail"
                        />
                      </div>
                      <div className="audio-playlist-item-info">
                        <div className="audio-playlist-item-title">
                          {audio.title}
                        </div>
                        <div className="audio-playlist-item-author">
                          {audio.author}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="audio-playlist-footer">
                  <div
                    className="audio-playlist-footer-button"
                    onClick={toggleRandom}
                  >
                    <img
                      className="audio-playlist-footer-button-img"
                      src={ShuffleIcon}
                      style={{ marginRight: "16px" }}
                      alt="random play"
                    />
                    <div>{isNextRandom ? "關閉隨機播放" : "開啟隨機播放"}</div>
                  </div>
                  <div className="audio-playlist-footer-button-group">
                    <img
                      className="audio-playlist-footer-control-button"
                      src={PrevIcon}
                      alt="prev"
                      onClick={() => handleNextPreviousButtonClick(false)}
                    />
                    <img
                      className="audio-playlist-footer-control-button"
                      src={NextIcon}
                      alt="next"
                      onClick={() => handleNextPreviousButtonClick(true)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {audioUrl && (
            <AudioFunction
              audioUrl={audioUrl}
              toNext={() => handleNextPreviousButtonClick(true)}
              openModal={openModal}
            />
          )}
        </div>
      ) : (
        <div className="audio-container-center">
          <div className="audio-thumbnail">
            <img
              className="audio-thumbnail-img"
              src={LoadingImage}
              alt="thumbnail"
            />
          </div>
          <div className="audio-info">
            <LoadingText text={"正在努力加載歌單"} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Player;
