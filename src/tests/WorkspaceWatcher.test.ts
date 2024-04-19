import fs from "fs"
import path from "path"
import withLocalTmpDir from "./withLocalTmpDir"
import WorkspaceWatcher from "../WorkspaceWatcher"

const pause = (ms: number) => new Promise((res) => setTimeout(res, ms))

describe("WorkspaceWatcher", () => {
  test("should trigger callback after info.json file creation", async () => {
    const createdCallback = jest.fn()
    const deletedCallback = jest.fn()

    // Use withLocalTmpDir to create a temporary directory
    await withLocalTmpDir(async (tmpDir: string) => {
      const watcher = new WorkspaceWatcher(tmpDir, ["info.json"])
      watcher.on("workspace_created", createdCallback)
      watcher.on("workspace_deleted", deletedCallback)
      watcher.start()

      const newDirName = "new_directory"
      const newDirPath = path.join(tmpDir, newDirName)
      fs.mkdirSync(newDirPath)
      await pause(100)

      // Expect
      // - no callbacks to have been called yet
      expect(createdCallback).not.toHaveBeenCalled()
      expect(deletedCallback).not.toHaveBeenCalled()
      // - no workspaces to be registered
      expect(watcher.all_workspaces()).toEqual([])

      // Create the info.json file within the directory
      fs.writeFileSync(newDirPath + "/info.json", "")
      await pause(500)

      // Expect
      // - the callback to have been called with the directory name
      expect(createdCallback).toHaveBeenCalledWith(newDirPath)
      expect(deletedCallback).not.toHaveBeenCalled()
      // - the workspace to be registered
      expect(watcher.all_workspaces()).toEqual([
        {
          cache: new Map<string, any>(),
          path: newDirPath,
        },
      ])

      createdCallback.mockClear()
      deletedCallback.mockClear()

      // Remove the info.json file within the directory
      fs.unlinkSync(path.join(newDirPath + "/info.json"))
      await pause(500)

      // Expect
      // - the callback to have been called with the directory name
      expect(createdCallback).not.toHaveBeenCalled()
      expect(deletedCallback).toHaveBeenCalledWith(newDirPath)
      // - the workspace to no longer be registered
      expect(watcher.all_workspaces()).toEqual([])

      await watcher.stop()
    })
  })
})
