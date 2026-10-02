// Same rule the backend enforces on PATCH /users/me, for <input pattern>.
// Browsers compile `pattern` with the `v` flag, which requires escaping
// - ( ) inside a character class.
export const PHONE_PATTERN = "[0-9+\\-\\(\\) ]{7,20}";
