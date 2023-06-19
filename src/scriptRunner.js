const { spawn } = require("child_process");

function runPythonScript(videoUrl, savePath) {
  const pythonScript = "./script/downloadScript.py"; // 您的 Python 腳本路徑

  const pythonProcess = spawn("python", [pythonScript, videoUrl, savePath]);

  pythonProcess.stdout.on("data", (data) => {
    console.log("Python 腳本的輸出:", data.toString());
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("錯誤:", data.toString());
  });
}

module.exports = runPythonScript;
