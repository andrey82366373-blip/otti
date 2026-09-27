/**
 * Где запущен сайт: на своём компьютере или на хостинге (Vercel, Render).
 * На хостинге всегда нужна облачная база (DATABASE_URL) и свой BETTER_AUTH_SECRET.
 */
export function hostingName(): "vercel" | "render" | null {
  if (process.env.VERCEL) return "vercel";
  if (process.env.RENDER) return "render";
  return null;
}

export function isHosted(): boolean {
  return hostingName() !== null;
}

/** Код коммита, из которого собрана эта версия (если хостинг его сообщает). */
export function deployedCommit(): string | undefined {
  return (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.RENDER_GIT_COMMIT)?.slice(0, 7);
}
