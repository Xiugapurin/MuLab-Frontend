import React from "react";

function ResizableTextArea({ placeholder, value, maxLength, setValue }) {
  // const [textareaHeight, setTextareaHeight] = useState("10vh");

  const handleTextAreaChange = (event) => {
    if (event.nativeEvent.inputType !== "insertLineBreak") {
      setValue(event.target.value);
    }
  };

  // const handleInput = (event) => {
  //   setTextareaHeight(`${event.target.scrollHeight}px`);
  // };

  return (
    <textarea
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      minLength={1}
      onChange={handleTextAreaChange}
      // onInput={handleInput}
      style={{
        height: "10vh",
        width: "100%",
        borderRadius: "4px",
        border: "2px solid #000000",
        boxSizing: "border-box",
        padding: "4px 8px",
        fontSize: "2.5vh",
        fontWeight: "bold",
        fontFamily:
          "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif",
        color: "#000000",
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
}

export default ResizableTextArea;
