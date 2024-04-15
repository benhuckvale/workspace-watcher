import { workspaceDirectoryImplied, isWorkspace } from "../workspaceUtils"
import { WorkspacePatterns } from "../WorkspacePatterns"
import fastglob from "fast-glob"

describe("workspaceDirectoryImplied", () => {
  beforeEach(() => {
    jest.resetAllMocks() // Reset mock calls between tests
  })

  it("should return parent directory for info.json when file exists", () => {
    const filePath = "path/to/info.json"
    const workspacePatterns = new WorkspacePatterns(["info.json"])
    const impliedDirectory = workspaceDirectoryImplied(
      filePath,
      workspacePatterns,
    )
    expect(impliedDirectory).toBe("path/to")
  })

  it("should return parent directory for logs/*.log when file exists", () => {
    const filePath = "path/to/logs/a.log"
    const workspacePatterns = new WorkspacePatterns(["logs/*.log"])
    expect(workspaceDirectoryImplied(filePath, workspacePatterns)).toBe(
      "path/to",
    )
  })

  it("should return undefined when file does not exist", () => {
    const filePath = "path/to/nonexistent/file.txt"
    const workspacePatterns = new WorkspacePatterns(["info.json"])
    expect(
      workspaceDirectoryImplied(filePath, workspacePatterns),
    ).toBeUndefined()
  })

  it("should return undefined for non-matching pattern when file exists", () => {
    const filePath = "path/to/other/file.txt"
    const workspacePatterns = new WorkspacePatterns(["logs/*.log"])
    expect(
      workspaceDirectoryImplied(filePath, workspacePatterns),
    ).toBeUndefined()
  })

  it("should return undefined when workspacePatterns is empty", () => {
    const filePath = "path/to/info.json"
    const workspacePatterns = new WorkspacePatterns([])
    expect(
      workspaceDirectoryImplied(filePath, workspacePatterns),
    ).toBeUndefined()
  })

  it("should not call fs.existsSync when workspacePatterns is empty", () => {
    const filePath = "path/to/info.json"
    const workspacePatterns = new WorkspacePatterns([])
    workspaceDirectoryImplied(filePath, workspacePatterns)
  })

  it("should return parent directory when there are multiple patterns if a file matching the first pattern is used", () => {
    const patterns = ["info.json", "logs/*.log"]
    const workspacePatterns = new WorkspacePatterns(patterns)
    const filePath = "path/to/info.json"
    const result = workspaceDirectoryImplied(filePath, workspacePatterns)
    expect(result).toBe("path/to")
  })

  it("should return parent directory when there are multiple patterns if a file matching the second pattern is used", () => {
    const patterns = ["info.json", "logs/*.log"]
    const workspacePatterns = new WorkspacePatterns(patterns)
    const filePath = "path/to/logs/a.log"
    const result = workspaceDirectoryImplied(filePath, workspacePatterns)
    expect(result).toBe("path/to")
  })
})

describe("isWorkspace", () => {
  test("should return true when all workspace patterns exist", () => {
    fastglob.sync = jest.fn()
    ;(fastglob.sync as jest.Mock).mockImplementation((pattern: string) => {
      if (pattern == "info.json") {
        return ["info.json"]
      } else if (pattern == "logs/*.log") {
        return ["logs/file1.log", "logs/file2.log"]
      } else {
        return []
      }
    })

    const dir = "/path/to/workspace"
    const patterns = new WorkspacePatterns(["info.json", "logs/*.log"])
    const result = isWorkspace(dir, patterns)
    expect(result).toBe(true)
    expect(fastglob.sync).toHaveBeenCalledTimes(2) // There are two patterns
    expect(fastglob.sync).toHaveBeenCalledWith("info.json", {
      cwd: "/path/to/workspace",
    })
    expect(fastglob.sync).toHaveBeenCalledWith("logs/*.log", {
      cwd: "/path/to/workspace",
    })
  })

  test("should return false when not all workspace patterns exist", () => {
    fastglob.sync = jest.fn()
    ;(fastglob.sync as jest.Mock).mockImplementation((pattern: string) => {
      if (pattern == "info.json") {
        return ["info.json"]
      } else {
        return []
      }
    })

    const dir = "/path/to/workspace"
    const patterns = new WorkspacePatterns(["info.json", "logs/*.log"])
    const result = isWorkspace(dir, patterns)
    expect(result).toBe(false)
    expect(fastglob.sync).toHaveBeenCalledTimes(2) // First call will succeed, but second will not
    expect(fastglob.sync).toHaveBeenCalledWith("info.json", {
      cwd: "/path/to/workspace",
    })
    expect(fastglob.sync).toHaveBeenCalledWith("logs/*.log", {
      cwd: "/path/to/workspace",
    })
  })

  test("should return false when no workspace patterns exist", () => {
    fastglob.sync = jest.fn()
    ;(fastglob.sync as jest.Mock).mockImplementation(() => {
      return []
    })

    const dir = "/path/to/workspace"
    const patterns = new WorkspacePatterns(["info.json", "logs/*.log"])
    const result = isWorkspace(dir, patterns)
    expect(result).toBe(false)
    expect(fastglob.sync).toHaveBeenCalledTimes(1) // Fails on the first
    expect(fastglob.sync).toHaveBeenCalledWith("info.json", {
      cwd: "/path/to/workspace",
    })
  })
})
