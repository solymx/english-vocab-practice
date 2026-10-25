export const SPEECH_FALLBACK = "這個瀏覽器不支援語音朗讀（Web Speech API）。請改用 Chrome、Edge 或 Safari。";

let speakToken = 0;

export function isSpeechSupported() {
  return typeof window !== "undefined"
    && typeof window.speechSynthesis !== "undefined"
    && typeof window.SpeechSynthesisUtterance === "function";
}

export function primeVoices() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    window.speechSynthesis.getVoices();
  });
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  const enUs = voices.filter((voice) => /^en-US$/i.test(voice.lang) || /^en-US/i.test(voice.lang));
  const preferred = [/Google US English$/i, /Samantha/i, /Aaron/i, /Nicky/i, /Aria/i, /Jenny/i];
  for (const pattern of preferred) {
    const found = enUs.find((voice) => pattern.test(voice.name));
    if (found) return found;
  }
  return enUs.find((voice) => voice.localService) || enUs[0] || voices.find((voice) => /^en/i.test(voice.lang)) || null;
}

export function cancelSpeech() {
  speakToken += 1;
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speak(text, { rate = 0.92 } = {}) {
  if (!isSpeechSupported()) return false;
  const spoken = String(text || "").trim();
  if (!spoken) return false;
  cancelSpeech();
  const token = speakToken + 1;
  speakToken = token;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(spoken);
  utterance.lang = "en-US";
  utterance.rate = rate;
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  synth.resume();
  window.setTimeout(() => {
    if (token !== speakToken) return;
    synth.speak(utterance);
  }, 40);
  return true;
}
