# Workspace Watcher

Workspace Watcher provides tools for monitoring and gathering information from
workspaces on the file system and presenting that information via a set of
convenient functions that could be trivially called by, for example, a server
backend to fulfil the implementation of an API.

The definition of "workspace" here is a collection of files and directories
underneath a parent directory, such that there are consistently certain typical
files or directories that are always present in each workspace.

For example, git workspaces always have a .git directory in them. Thus the
module can navigate the filesystem and identify all such workspaces, monitoring
them for changes and otherwise making its findings available via a set of
functions.

The module treats workspaces, indeed the filesystem in general, as read-only.
It merely inspects it.

To perform the underlying file-watching the
[chokidar](https://github.com/paulmillr/chokidar) module is used which in turn
uses the Node.js core `fs` module.

