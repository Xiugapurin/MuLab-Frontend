import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getTimeDiff } from "../../utils/getTimeDiff";
import "./pagination.css";
import "./card.css";
import MoreIcon from "../../asset/icons/more.svg";
import YTIcon from "../../asset/icons/youtube.svg";
const { ipcRenderer } = window.require("electron");

const PAGE_SIZE = 12; // 每頁顯示的卡片數量
const MAX_VISIBLE_PAGES = 3; // 最多顯示的頁數按鈕數量

const Card = ({
  playlist,
  navigate,
  setFocusedID,
  openDeletePlaylistModal,
  openDeleteFullPlaylistModal,
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

  const handleMenuClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsMenuOpen(false);
  };

  const handleDeletePlaylistButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    openDeletePlaylistModal();
    setFocusedID(playlist.id);
    setIsMenuOpen(false);
  };

  const handleDeleteFullPlaylistButtonClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    openDeleteFullPlaylistModal();
    setFocusedID(playlist.id);
    setIsMenuOpen(false);
  };

  const handleCardClick = (playlistInfo) => {
    navigate("/playlistDetail", { state: { playlistInfo } });
  };

  return (
    <div
      className="card playlist-card"
      onClick={() => handleCardClick(playlist)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-thumbnail">
        <img
          src={`data:image/jpeg;base64, ${playlist.thumbnailBase64}`}
          alt="Thumbnail"
        />
      </div>
      <div className="card-info">
        <div className="card-title">{playlist.title}</div>
        <div className="card-author">{`${playlist.idList.length} 首歌曲`}</div>
      </div>
      <div className="card-time">{getTimeDiff(playlist.id)}</div>
      {isHovered && (
        <>
          <img
            className="card-more-action-button"
            src={MoreIcon}
            alt="More Action"
            onClick={handleMenuClick}
          />
          {isMenuOpen && (
            <div className="card-menu">
              <div
                className="card-menu-item"
                onClick={handleDeletePlaylistButtonClick}
              >
                刪除播放清單
              </div>
              <div
                className="card-menu-item"
                onClick={handleDeleteFullPlaylistButtonClick}
              >
                連同歌曲刪除清單
              </div>
              <div className="card-menu-item" onClick={handleMenuClose}>
                取消
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default function Playlist({
  shouldRefresh,
  setShouldRefresh,
  setFocusedID,
  openDeletePlaylistModal,
  openDeleteFullPlaylistModal,
  isTimeReverse,
}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollTimeout, setScrollTimeout] = useState(null);
  const [playlists, setPlaylists] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  };

  // 發送 IPC 請求取得資料長度
  useEffect(() => {
    ipcRenderer.send("getPlaylistItemCount", PAGE_SIZE, isTimeReverse);

    const handleGetPlaylistItemCountResponse = (event, response) => {
      if (response.success) {
        const totalCount = response.totalDataCount;
        const pages = Math.ceil(totalCount / PAGE_SIZE);
        setPlaylists(response.jsonDataArray);
        setTotalPages(pages);
        setCurrentPage(1);
        setShouldRefresh(false);
        scrollToTop();
      } else {
        console.error("Failed to get JSON data count.");
      }
    };

    // 接收 IPC 回傳的所有 JSON 資料筆數
    ipcRenderer.on(
      "getPlaylistItemCountResponse",
      handleGetPlaylistItemCountResponse
    );

    // 組件卸載時清除事件監聽
    return () => {
      ipcRenderer.removeListener(
        "getPlaylistItemCountResponse",
        handleGetPlaylistItemCountResponse
      );
    };
  }, [shouldRefresh, setShouldRefresh, isTimeReverse]);

  // 計算分頁按鈕的起始和結束位置
  const calculateButtonRange = () => {
    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > MAX_VISIBLE_PAGES) {
      const middleButtonCount = Math.floor(MAX_VISIBLE_PAGES / 2);
      const isNearStart = currentPage <= middleButtonCount;
      const isNearEnd = currentPage >= totalPages - middleButtonCount;

      if (isNearStart) {
        endPage = MAX_VISIBLE_PAGES;
      } else if (isNearEnd) {
        startPage = totalPages - MAX_VISIBLE_PAGES + 1;
      } else {
        startPage = currentPage - middleButtonCount;
        endPage = currentPage + middleButtonCount;
      }
    }

    return { startPage, endPage };
  };

  // 取得起始和結束位置的分頁按鈕
  const { startPage, endPage } = calculateButtonRange();
  const paginationButtons = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => index + startPage
  );

  // 處理頁碼變更
  const handlePageChange = (page) => {
    setCurrentPage(page);

    // 移除之前的事件監聽器
    ipcRenderer.removeAllListeners("getPlaylistByPageResponse");

    // 發送 IPC 請求獲取指定頁碼的資料
    ipcRenderer.send("getPlaylistByPage", page, PAGE_SIZE, isTimeReverse);

    // 接收 IPC 回傳的指定頁碼的 JSON 資料
    ipcRenderer.on("getPlaylistByPageResponse", (event, response) => {
      if (response.success) {
        setPlaylists(response.jsonDataArray);
        scrollToTop();
      } else {
        console.error("Failed to get JSON data for page", currentPage);
      }
    });
  };

  // 監聽滾動事件
  useEffect(() => {
    const container = containerRef.current;

    const handleScroll = () => {
      setIsScrolling(true);

      // 3 秒後恢復透明狀態
      clearTimeout(scrollTimeout);

      // 設置新的計時器
      const newTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 2000);
      setScrollTimeout(newTimeout);
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [scrollTimeout]);

  return (
    <div
      className={`card-container${isScrolling ? "" : " non-scrolling"}`}
      ref={containerRef}
    >
      {playlists &&
        playlists.map((playlist) => (
          <Card
            key={playlist.id}
            playlist={playlist}
            setFocusedID={setFocusedID}
            navigate={navigate}
            openDeletePlaylistModal={openDeletePlaylistModal}
            openDeleteFullPlaylistModal={openDeleteFullPlaylistModal}
          />
        ))}

      {playlists && playlists.length === 0 && (
        <div
          className="card-empty"
          onClick={() => {
            navigate("/download");
          }}
        >
          <div className="card-empty-thumbnail">
            <img
              className="card-empty-thumbnail-img"
              src={YTIcon}
              alt="Thumbnail"
            />
          </div>
          <div className="card-empty-title">
            你尚未創建播放清單
            <br />
            點擊此處來下載音訊
          </div>
        </div>
      )}

      {/* 分頁 */}
      <div className="pagination-button-container">
        {startPage > 1 && (
          <>
            <div
              className="pagination-button"
              onClick={() => handlePageChange(1)}
            >
              {1}
            </div>
            <div className="pagination-dots">...</div>
          </>
        )}
        {paginationButtons.map((page) => (
          <div
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-button${
              currentPage === page ? " active" : ""
            }`}
          >
            {page}
          </div>
        ))}
        {endPage < totalPages && (
          <>
            <div className="pagination-dots">...</div>
            <div
              className="pagination-button"
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
