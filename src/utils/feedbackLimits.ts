// ABOUTME: The length bounds a feedback message must satisfy.
// ABOUTME: Shared so the widget and the API cannot disagree about what is valid.

// Short reactions are real feedback — "Goated" says something worth reading.
// The floor only exists to keep an accidental keystroke out of the table.
export const FEEDBACK_MIN_LENGTH = 3;
export const FEEDBACK_MAX_LENGTH = 2000;
