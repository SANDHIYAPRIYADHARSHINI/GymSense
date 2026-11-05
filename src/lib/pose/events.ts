// Rep counting owns cycle boundaries; coaching consumes these events once by ID.
export type RepEvent = {
  id: number;
  outcome: "counted" | "too-fast" | "too-slow" | "incomplete";
  durationMs: number;
  bottomPauseMs: number;
  completeness: number;
};
