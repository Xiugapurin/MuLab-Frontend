import React from "react";
import "./windowControl.css";
import MinimizeIcon from "../asset/icons/window-minimize.svg";
import MaximizeIcon from "../asset/icons/window-maximize.svg";
import CloseIcon from "../asset/icons/window-close.svg";
const { ipcRenderer } = window.require("electron");

export default function WindowControl() {
  const handleWindowControlClick = (action) => {
    ipcRenderer.send("windowControl", action);
  };

  return (
    <div className="title-bar">
      <div className="window-controls">
        <div
          className="window-button minimize"
          onClick={() => {
            handleWindowControlClick("minimize");
          }}
        >
          <img
            className="window-button-img"
            src={MinimizeIcon}
            alt="minimize"
          />
        </div>
        <div
          className="window-button maximize"
          onClick={() => {
            handleWindowControlClick("maximize");
          }}
        >
          <img
            className="window-button-img"
            src={MaximizeIcon}
            alt="maximize"
          />
        </div>
        <div
          className="window-button close"
          onClick={() => {
            handleWindowControlClick("close");
          }}
        >
          <img className="window-button-img" src={CloseIcon} alt="close" />
        </div>
      </div>
    </div>
  );
}
