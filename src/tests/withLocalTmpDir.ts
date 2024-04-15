import fs from "fs"
import { join } from "path"

interface WithLocalTmpDirOptions {
  dir?: string
  unsafeCleanup?: boolean
}

/**
 * Executes the provided callback within a temporary directory.
 *
 * @param callback The callback function to execute within the temporary directory.
 * @param options Additional options for configuring the behavior of the temporary directory.
 * @returns A Promise that resolves when the callback execution is complete.
 *
 * Inspired by https://www.npmjs.com/package/with-local-tmp-dir
 */
export default async function withLocalTmpDir(
  callback: (tmpDir: string) => Promise<void>,
  options?: WithLocalTmpDirOptions,
): Promise<void> {
  const tmpDir = await new Promise<string>((resolve, reject) => {
    fs.mkdtemp(
      join(process.cwd(), options?.dir || "", "tmp-"),
      {},
      (err, folder) => {
        if (err) {
          reject(err)
        } else {
          resolve(folder)
        }
      },
    )
  })
  try {
    await callback(tmpDir)
  } finally {
    if (options?.unsafeCleanup !== false) {
      await fs.rm(tmpDir, { recursive: true }, () => {
        // If it does not work, it just leaves the tmp dir undeleted. Not a big issue.
      })
    }
  }
}
