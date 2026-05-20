/// <reference types="youtube" />

export {};

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}
