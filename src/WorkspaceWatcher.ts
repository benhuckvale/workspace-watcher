import chokidar from "chokidar"
import { WorkspacePatterns } from "./WorkspacePatterns"
import { workspaceDirectoryImplied, isWorkspace } from "./workspaceUtils"

interface WorkspaceEventCallback {
  (dir: string): void
}

interface WorkspaceEventMap {
  workspace_created: WorkspaceEventCallback
  workspace_deleted: WorkspaceEventCallback
}

class WorkspaceWatcher {
  private rootDir: string
  private workspacePatterns: WorkspacePatterns
  private workspaceEventCallbacks: Partial<
    Record<keyof WorkspaceEventMap, WorkspaceEventCallback[]>
  >
  private workspaces: Set<string>
  private fileWatcher: chokidar.FSWatcher | null = null

  constructor(rootDir: string, patterns: string[]) {
    this.rootDir = rootDir
    this.workspacePatterns = new WorkspacePatterns(patterns)
    this.workspaceEventCallbacks = {
      workspace_created: [],
      workspace_deleted: [],
    }
    this.workspaces = new Set()
  }

  public start() {
    // Use chokidar as the underlying file watcher
    this.fileWatcher = chokidar.watch(this.rootDir, {
      ignoreInitial: false,
      depth: 99,
      // Useful to ignore these for now, but needs revising in case the
      // application using WorkspaceWatcher is actually trying to process git
      // workspaces say.
      ignored: ["**/.git", "**/node_modules"],
    })
    this.fileWatcher.on("add", this.handleAdded.bind(this))
    this.fileWatcher.on("unlink", this.handleRemoved.bind(this))
  }

  private async handleAdded(filePath: string) {
    const workspaceDir = workspaceDirectoryImplied(
      filePath,
      this.workspacePatterns,
    )
    if (
      workspaceDir &&
      !this.workspaces.has(workspaceDir) &&
      isWorkspace(workspaceDir, this.workspacePatterns)
    ) {
      // It's a new workspace
      this.workspaces.add(workspaceDir)
      this.emitEvent("workspace_created", workspaceDir)
    }
  }

  private async handleRemoved(filePath: string) {
    const workspaceDir = workspaceDirectoryImplied(
      filePath,
      this.workspacePatterns,
    )
    if (
      workspaceDir &&
      this.workspaces.has(workspaceDir) &&
      !isWorkspace(workspaceDir, this.workspacePatterns)
    ) {
      // Was a workspace but the removed file turned it not into a workspace
      this.workspaces.delete(workspaceDir)
      this.emitEvent("workspace_deleted", workspaceDir)
    }
  }

  private emitEvent(eventName: keyof WorkspaceEventMap, dir: string) {
    const callbacks = this.workspaceEventCallbacks[eventName] || []
    callbacks.forEach((callback) => callback(dir))
  }

  on<Event extends keyof WorkspaceEventMap>(
    eventName: Event,
    callback: WorkspaceEventMap[Event],
  ) {
    if (this.workspaceEventCallbacks[eventName]) {
      this.workspaceEventCallbacks[eventName]?.push(callback)
    }
  }

  all_workspaces(): string[] {
    return Array.from(this.workspaces)
  }

  public stop() {
    if (this.fileWatcher !== null) {
      this.fileWatcher.close()
      this.fileWatcher = null
    } else {
      throw new Error("Underlying file watcher is not running.")
    }
  }
}

export default WorkspaceWatcher
