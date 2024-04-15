import { WorkspacePatterns } from "./WorkspacePatterns"
import fastglob from "fast-glob"

/**
 * Return workspace directory implied by given filePath according to required workspacePatterns.
 *
 * If filePath is one of the files that identifies a workspace, according to
 * the workspacePatterns, return the portion of its path that represents the
 * workspace directory.
 *
 * A defined result here does not necessary mean the directory is a
 * workspace, because there may be other files required. To figure that out
 * the function isWorkspace should instead be used.
 **/
function workspaceDirectoryImplied(
  filePath: string,
  workspacePatterns: WorkspacePatterns,
): string | undefined {
  if (filePath === undefined || workspacePatterns === undefined)
    return undefined

  const regexps = workspacePatterns.regexps
  for (const regexp of regexps) {
    const matchIndex = filePath.search(regexp)
    if (matchIndex !== -1) {
      // If the pattern matches anywhere in the filePath, return the substring up to the match
      let impliedDirectory = filePath.substring(0, matchIndex)
      // Remove trailing slash, if present
      impliedDirectory = impliedDirectory.replace(/\/$/, "")
      return impliedDirectory
    }
  }
  return undefined
}

export { workspaceDirectoryImplied }

/**
 * Return true if the given directory is a workspace directory.
 *
 * This is the case if the workspace directory contains files that match all
 * the workspacePatterns passed into the function.
 **/
function isWorkspace(
  dir: string,
  workspacePatterns: WorkspacePatterns,
): boolean {
  return workspacePatterns.globPatterns.every((pattern) => {
    const files = fastglob.sync(pattern, { cwd: dir })
    if (files === undefined || files.length === undefined) {
      return false
    } else {
      return files.length > 0
    }
  })
}

export { isWorkspace }
