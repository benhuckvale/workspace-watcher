import globToRegExp from "glob-to-regexp"

class WorkspacePatterns {
  public globPatterns: string[]
  public regexps: RegExp[]

  constructor(globPatterns: string[]) {
    this.globPatterns = globPatterns
    this.regexps = globPatterns.map((pattern) => {
      // Specify 'g' flag to avoid constraining the regular expression with ^ and $
      return globToRegExp(pattern, { flags: "g", extended: true })
    })
  }
}

export { WorkspacePatterns }
