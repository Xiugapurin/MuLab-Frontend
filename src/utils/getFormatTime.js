export function getFormatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const formattedTimeParts = [];
  if (hours > 0) {
    formattedTimeParts.push(`${hours} 小時`);
  }
  if (minutes > 0) {
    formattedTimeParts.push(`${minutes} 分`);
  }
  formattedTimeParts.push(`${remainingSeconds} 秒`);

  return formattedTimeParts.join(" ");
}
