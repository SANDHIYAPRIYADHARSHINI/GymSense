import type { CoachMessage } from "@/data/exercises";
// Opt-in, on-device voices only. Do not queue repeated cues over one another.
export class CoachSpeech {
  private lastAt = -Infinity;
  private lastMessage: CoachMessage | null = null;
  private ownUtterance: SpeechSynthesisUtterance | null = null;
  speak(message: CoachMessage, now: number): boolean {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof SpeechSynthesisUtterance === "undefined"
    )
      return false;
    if (
      now - this.lastAt < 4500 ||
      (message === this.lastMessage && now - this.lastAt < 8000)
    )
      return true;
    const voice = window.speechSynthesis
      .getVoices()
      .find(
        (item) => item.localService && item.lang.toLowerCase().startsWith("en"),
      );
    if (!voice) return false;
    try {
      this.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.onend = () => {
        if (this.ownUtterance === utterance) this.ownUtterance = null;
      };
      utterance.onerror = () => {
        if (this.ownUtterance === utterance) this.ownUtterance = null;
      };
      this.ownUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      this.lastAt = now;
      this.lastMessage = message;
      return true;
    } catch {
      return false;
    }
  }
  cancel() {
    if (
      this.ownUtterance &&
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    )
      window.speechSynthesis.cancel();
    this.ownUtterance = null;
  }
}
