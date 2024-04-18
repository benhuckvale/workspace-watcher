import express from "express"
import { WorkspaceWatcher } from "workspace-watcher"

const app = express()

const WORKSPACES_PATH = "workspaces"

const watcher = new WorkspaceWatcher(WORKSPACES_PATH, ["info.json"])

watcher.on("workspace_created", (dir) => {
  console.log(`Got workspace created event: ${dir}`)
})

watcher.on("workspace_deleted", (dir) => {
  console.log(`Got workspace deleted event: ${dir}`)
})

watcher.start()

app.get("/directories", (req, res) => {
  const directoryList = watcher.all_workspaces().map((data) => data.path)
  console.log(`Called /directories. Returning ${directoryList.length} items.`)
  res.json({ directories: directoryList })
})

const server = app.listen(3000, () => {
  console.log("Server is running on port 3000")
})

const currentDirectory = process.cwd()
console.log("Current working directory:", currentDirectory)

process.on("SIGINT", () => {
  watcher.stop()
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})
