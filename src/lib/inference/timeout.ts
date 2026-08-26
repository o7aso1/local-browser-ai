export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise
      .then((v) => {
        clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(timer)
        reject(e)
      })
  })
}

export type ProgressFn = (p: { progress: number; text: string }) => void

export async function runBootSteps(
  steps: Array<{ progress: number; text: string; run: () => Promise<void> }>,
  onProgress?: ProgressFn,
  timeoutMs = 120_000,
): Promise<void> {
  for (const step of steps) {
    onProgress?.({ progress: step.progress, text: step.text })
    await withTimeout(step.run(), timeoutMs, `انتهت المهلة: ${step.text}`)
  }
}
