import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import WindowControl from "./components/windowControl";
import Home from "./pages/home/home";
import Collection from "./pages/home/collection";
import Playlist from "./pages/home/playlist";
import PlaylistDetail from "./pages/playlistDetail";
import Download from "./pages/download";
import Player from "./pages/player/player";

export default function App() {
  return (
    <Router>
      <WindowControl />
      <Routes className="App">
        <Route element={<Home />} path="/"></Route>
        <Route element={<Collection />} path="/collection"></Route>
        <Route element={<Playlist />} path="/playlist"></Route>
        <Route element={<PlaylistDetail />} path="/playlistDetail"></Route>
        <Route element={<Download />} path="/download"></Route>
        <Route element={<Player />} path="/player"></Route>
      </Routes>
    </Router>
  );
}
