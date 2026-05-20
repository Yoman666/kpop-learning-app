export function speakKorean(text: string) {
  if (typeof window === "undefined" || !text.trim()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const ko = voices.find((v) => v.lang.startsWith("ko"));
  if (ko) u.voice = ko;
  window.speechSynthesis.speak(u);
}
