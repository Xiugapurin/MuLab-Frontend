import React, { useState, useEffect, useRef } from "react";
import PlayIcon from "../../asset/icons/play.svg";
import PauseIcon from "../../asset/icons/pause.svg";
import PlaylistIcon from "../../asset/icons/playlist.svg";
import VolumeHighIcon from "../../asset/icons/volume-high.svg";
import VolumeLowIcon from "../../asset/icons/volume-low.svg";
import VolumeOffIcon from "../../asset/icons/volume-off.svg";
import VolumeMuteIcon from "../../asset/icons/volume-mute.svg";
import "./audioFunction.css";

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const AudioFunction = ({ audioUrl, toNext, openModal }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setPlaying(!playing);
  };

  // 處理播放結束後的動作
  const [isNextTriggered, setIsNextTriggered] = useState(false);
  useEffect(() => {
    const handlePlaybackEnd = () => {
      setPlaying(false);
      setCurrentTime(0);

      // 在播放結束後，觸發切換到下一首的動作（僅在未處理過的情況下）
      if (!isNextTriggered) {
        setIsNextTriggered(true);
        toNext();
      }
    };

    if (audioRef.current) {
      audioRef.current.addEventListener("ended", handlePlaybackEnd);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handlePlaybackEnd);
      }
    };
  }, [toNext, isNextTriggered]);

  //----- 處理音訊載入及音訊時間軸的更新 -----//
  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener("timeupdate", updateCurrentTime);
      audioRef.current.addEventListener("loadedmetadata", updateDuration);
      setCurrentTime(0);
      setDuration(0);
      setPlaying(true);
      setIsNextTriggered(false);

      // 音訊載入完成後再播放
      audioRef.current.oncanplaythrough = () => {
        audioRef.current.play();
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener("timeupdate", updateCurrentTime);
        audioRef.current.removeEventListener("loadedmetadata", updateDuration);
      }
    };
  }, [audioUrl]);

  const updateCurrentTime = () => {
    const audio = audioRef.current;
    setCurrentTime(audio.currentTime);
  };

  const updateDuration = () => {
    const audio = audioRef.current;
    setDuration(audio.duration);
  };
  //----- 處理音訊載入及音訊時間軸的更新 -----//

  //----- 處理音量設定 -----//
  const [volume, setVolume] = useState(1);
  const [prevVolume, setPrevVolume] = useState(1);
  const [volumeIcon, setVolumeIcon] = useState(VolumeHighIcon);
  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  const handleVolumeClick = () => {
    if (volume === 0) {
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolume(0);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (volume === 0) {
        setVolumeIcon(VolumeMuteIcon);
      }
      if (volume > 0 && volume <= 0.2) {
        setVolumeIcon(VolumeOffIcon);
      }
      if (volume > 0.2 && volume <= 0.7) {
        setVolumeIcon(VolumeLowIcon);
      }
      if (volume > 0.7) {
        setVolumeIcon(VolumeHighIcon);
      }
    }
  }, [volume]);

  const volumeTrackStyle = {
    background: `linear-gradient(to right, #424242 0%, #424242 ${
      volume * 100
    }%, #ffffff ${volume * 100}%, #ffffff 100%)`,
  };
  //----- 處理音量設定 -----//

  //----- 播放滾輪設定 -----//
  const [isDrag, setIsDrag] = useState(false);
  const [seekTime, setSeekTime] = useState(currentTime);
  const [progress, setProgress] = useState(0);

  const handleSeek = (event) => {
    setSeekTime(event.target.value);
  };

  const handleDragStart = () => {
    setIsDrag(true);
  };

  const handleDragEnd = () => {
    setIsDrag(false);
    audioRef.current.currentTime = seekTime;
  };

  useEffect(() => {
    if (!isDrag) {
      setSeekTime(currentTime);
    }
  }, [currentTime, isDrag]);

  useEffect(() => {
    setProgress(duration > 0 ? (seekTime / duration) * 100 : 0);
  }, [seekTime, duration]);

  const progressTrackStyle = {
    background: `linear-gradient(to right, #fb7589 0%, #fb7589 ${progress}%, #ffffff ${progress}%, #ffffff 100%)`,
  };
  //----- 播放滾輪設定 -----//

  return (
    <div className="audio-function-container">
      <div className="audio-function-button-group">
        <div className="audio-playlist-button" onClick={openModal}>
          <img
            className="audio-playlist-button-img"
            src={PlaylistIcon}
            alt="Playlist Icon"
          />
        </div>
        <div className="audio-function-button" onClick={toggle}>
          <img
            className="audio-function-button-img"
            src={playing ? PauseIcon : PlayIcon}
            alt="play-button-icon"
          />
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-time">{formatTime(seekTime)}</div>
        <input
          className="progress-animate"
          type="range"
          min={0}
          max={duration}
          step={1}
          value={seekTime}
          style={progressTrackStyle}
          onChange={handleSeek}
          onMouseDown={handleDragStart}
          onMouseUp={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        />
        <div className="progress-time">{formatTime(duration)}</div>
      </div>

      <div className="audio-volume-container">
        <div className="audio-volume">
          <img
            className="audio-volume-button-img"
            src={volumeIcon}
            onClick={handleVolumeClick}
            alt="volume"
          />
          <input
            className="audio-volume-input"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            style={volumeTrackStyle}
          />
        </div>
      </div>
    </div>
  );
};

export default AudioFunction;
