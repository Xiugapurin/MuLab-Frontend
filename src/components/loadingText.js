import React, { useState, useEffect } from "react";

const LoadingText = ({ text }) => {
  const [dots, setDots] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots < 6 ? prevDots + 1 : 1));
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      style={{
        display: "-webkit-box",
        WebkitLineClamp: 1,
        WebkitBoxOrient: "vertical",
        fontWeight: "bold",
      }}
    >
      {text + " .".repeat(dots)}
    </div>
  );
};

export default LoadingText;
