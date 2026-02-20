const SUBMIT_URL = import.meta.env.VITE_SUBMIT_SCORE_URL;

/**
 * POST quiz results to the configured Supabase Edge Function.
 * Fails silently so the results screen is never blocked.
 *
 * @param {{ score: number, total_questions: number, quiz_version?: string, duration_ms?: number }} payload
 */
export async function submitScore({ score, total_questions, quiz_version, duration_ms }) {
  if (!SUBMIT_URL) {
    console.warn("VITE_SUBMIT_SCORE_URL is not set; score submission skipped.");
    return;
  }
  try {
    const res = await fetch(SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, total_questions, quiz_version, duration_ms }),
    });
    if (!res.ok) {
      console.warn(`Score submission failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.warn("Score submission error:", err);
  }
}
