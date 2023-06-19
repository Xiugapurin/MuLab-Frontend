import styled, { keyframes } from "styled-components";

const marquee = (width) => keyframes`
    0%, 20% {
      transform: translate(0, 0);
    }
    80%, 100% {
      transform: translate(-${width - window.innerWidth * 0.4}px, 0)
    }
  `;

const TitleContainer = styled.div`
  .audio-title-container {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    max-width: 40vw;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .audio-title-move {
    display: flex;
  }

  .audio-title-move.animate {
    animation-name: ${(props) => marquee(props.width)};
    animation-duration: ${(props) =>
      props.width <= 320 ? 5 : (props.width - 320) / 100 + 3}s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    animation-delay: 2s;
  }

  .audio-title-move.animate:hover {
    animation-play-state: paused;
  }

  .audio-title {
    font-size: 24px;
    font-weight: bold;
    color: #000000;
    white-space: nowrap;
    box-sizing: border-box;
  }
`;

export default TitleContainer;
