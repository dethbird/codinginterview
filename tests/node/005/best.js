function safeJsonParse(str) {
  try {
    return { ok: true, value: JSON.parse(str) };
  } catch (error) {
    return { ok: false, error };
  }
}