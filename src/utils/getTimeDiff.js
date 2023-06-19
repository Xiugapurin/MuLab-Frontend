export function getTimeDiff(time, endTime = new Date()) {
  const startTime = new Date(parseInt(time));
  const timeDiff = endTime.getTime() - startTime.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  let relativeTime;

  if (timeDiff < minute) {
    relativeTime = Math.floor(timeDiff / 1000) + " 秒前";
  } else if (timeDiff < hour) {
    relativeTime = Math.floor(timeDiff / minute) + " 分鐘前";
  } else if (timeDiff < day) {
    relativeTime = Math.floor(timeDiff / hour) + " 小時前";
  } else if (timeDiff < month) {
    relativeTime = Math.floor(timeDiff / day) + " 天前";
  } else if (timeDiff < year) {
    relativeTime = Math.floor(timeDiff / month) + " 個月前";
  } else {
    relativeTime = Math.floor(timeDiff / year) + " 年前";
  }

  return relativeTime;
}
