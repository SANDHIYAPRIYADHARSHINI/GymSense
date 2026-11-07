// Native stderr includes this INFO notice. Adapt only MediaPipe's logger,
// preserving all other messages and leaving the shared console untouched.
export function createMediaPipeErrorLogger(logger) {
  const error = logger.error.bind(logger);
  const info = logger.info.bind(logger);
  return (...args) => {
    if (
      args.length === 1 &&
      typeof args[0] === "string" &&
      args[0].trim() ===
        "INFO: Created TensorFlow Lite XNNPACK delegate for CPU."
    ) {
      info(...args);
    } else {
      error(...args);
    }
  };
}

export function patchMediaPipeLogging(source) {
  const original = "var err = console.error.bind(console);";
  if (source.split(original).length !== 2) {
    throw new Error(
      "MediaPipe stderr initialization changed. Review the logging adapter before updating the SDK.",
    );
  }
  return source.replace(
    original,
    `var err = (${createMediaPipeErrorLogger.toString()})(console);`,
  );
}
