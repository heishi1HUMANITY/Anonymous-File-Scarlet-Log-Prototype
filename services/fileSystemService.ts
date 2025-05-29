

// Fix: Import PlayerStoryState instead of PlayerState, and necessary Initial* types
import { FileSystemStructure, FileSystemItem, FileSystemNodeType, FileNode, DirectoryNode, PlayerStoryState, InitialFileSystemStructure, InitialFileSystemItem, InitialDirectoryNode, InitialFileNode } from '../types';

// Helper to navigate to a path and get the node
export function getNodeFromPath(path: string, fsState: FileSystemStructure): FileSystemItem | null {
  const parts = path.split('/').filter(p => p);
  let currentNode: FileSystemItem | FileSystemStructure = fsState['/']; // Start at root

  if (path === '/') return fsState['/'];

  for (const part of parts) {
    if (!currentNode || (currentNode as DirectoryNode).type !== FileSystemNodeType.DIRECTORY) {
      return null; // Invalid path component or trying to cd into a file
    }
    const children = (currentNode as DirectoryNode).children;
    if (!children || !children[part]) {
      return null; // Path does not exist
    }
    currentNode = children[part];
  }
  return currentNode as FileSystemItem;
}

// Fix: Add helper function to get nodes from InitialFileSystemStructure
export function getInitialNodeFromPath(path: string, initialFs: InitialFileSystemStructure): InitialFileSystemItem | null {
  const parts = path.split('/').filter(p => p);
  
  if (path === '/') {
    // Ensure the root entry itself is returned, not its children property or undefined
    return initialFs['/'] || null; 
  }

  let currentNodeFromInitial: InitialFileSystemItem | undefined = initialFs['/'];

  if (!currentNodeFromInitial) return null; // Root must exist

  // Ensure root is directory-like for traversal, unless it's the direct target and not '/'
  if (parts.length > 0 && (!('children' in currentNodeFromInitial) || !currentNodeFromInitial.children)) {
      return null; // Cannot traverse if root is not a directory structure with children
  }

  for (const part of parts) {
    if (!currentNodeFromInitial || typeof currentNodeFromInitial !== 'object' || !('children' in currentNodeFromInitial) || !(currentNodeFromInitial as InitialDirectoryNode).children) {
      return null; 
    }
    const children = (currentNodeFromInitial as InitialDirectoryNode).children;
    if (!children || !children[part]) {
      return null; 
    }
    currentNodeFromInitial = children[part];
  }
  return currentNodeFromInitial || null;
}

// Helper to resolve a path (handles .. and .)
export function resolvePath(currentPath: string, targetPath: string): string {
  if (targetPath.startsWith('/')) {
    // Absolute path
    const parts = targetPath.split('/').filter(p => p);
    return '/' + parts.join('/');
  }

  // Relative path
  const currentParts = currentPath.split('/').filter(p => p);
  const targetParts = targetPath.split('/').filter(p => p);
  let newParts = [...currentParts];

  for (const part of targetParts) {
    if (part === '..') {
      if (newParts.length > 0) {
        newParts.pop();
      }
    } else if (part !== '.') {
      newParts.push(part);
    }
  }
  return '/' + newParts.join('/') || '/';
}

export function listDirectoryContents(path: string, fsState: FileSystemStructure): string {
  const node = getNodeFromPath(path, fsState);
  if (!node) {
    return `Error: Path not found: ${path}`;
  }
  if (node.type !== FileSystemNodeType.DIRECTORY) {
    return `Error: Not a directory: ${path}`;
  }
  const items = Object.keys(node.children).map(name => {
    return node.children[name].type === FileSystemNodeType.DIRECTORY ? `${name}/` : name;
  });
  if (items.length === 0) {
    return "(empty directory)";
  }
  return items.join('\n');
}

export function readFileContents(filePath: string, fsState: FileSystemStructure): string {
  const node = getNodeFromPath(filePath, fsState);
  if (!node) {
    return `Error: File not found: ${filePath}`;
  }
  if (node.type !== FileSystemNodeType.FILE) {
    return `Error: Not a file: ${filePath}`;
  }
  const fileNode = node as FileNode;
  if (fileNode.isEncrypted) {
    return 'Error: File is encrypted. Use `decrypt` command.';
  }
  return fileNode.content;
}

// Updated changeDirectory: takes currentPath and fsStateForValidation
// Returns newPath or an error, but doesn't modify playerState directly.
export function changeDirectory(
  targetPath: string, 
  currentPath: string, 
  fsStateForValidation: FileSystemStructure
): { newPath: string; error?: string } {
  const resolvedTargetPath = resolvePath(currentPath, targetPath);
  const node = getNodeFromPath(resolvedTargetPath, fsStateForValidation);

  if (!node) {
    return { newPath: currentPath, error: `cd: no such file or directory: ${targetPath}` };
  }
  if (node.type !== FileSystemNodeType.DIRECTORY) {
    return { newPath: currentPath, error: `cd: not a directory: ${targetPath}` };
  }
  return { newPath: resolvedTargetPath }; // Return the resolved path on success
}