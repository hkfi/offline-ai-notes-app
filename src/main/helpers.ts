import path from 'path'
import fs from 'fs'

export function findPythonPath() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, 'python', 'bin', 'python'),
    // In development
    path.join(__dirname, '..', '..', 'python', 'bin', 'python')
  ]
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      return path
    }
  }
  console.log('Could not find python3, checked', possibilities)
  return
}

export function findSqliteVssVector0Path() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, 'sqlite-vss-darwin-arm64', 'lib', 'vector0'),
    path.join(process.resourcesPath, 'sqlite-vss-darwin-arm64', 'lib', 'vector0.dylib'),
    // In development
    path.join(__dirname, '..', '..', 'sqlite-vss-darwin-arm64', 'lib', 'vector0.dylib'),
    path.join(__dirname, '..', '..', 'sqlite-vss-darwin-arm64', 'lib', 'vector0')
  ]
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      return path
    }
  }
  console.log('Could not find vector0, checked', possibilities)
  return
}

export function findSqliteVssVss0Path() {
  const possibilities = [
    // In packaged app
    path.join(process.resourcesPath, 'sqlite-vss-darwin-arm64', 'lib', 'vss0'),
    path.join(process.resourcesPath, 'sqlite-vss-darwin-arm64', 'lib', 'vss0.dylib'),
    // In development
    path.join(__dirname, '..', '..', 'sqlite-vss-darwin-arm64', 'lib', 'vss0.dylib'),
    path.join(__dirname, '..', '..', 'sqlite-vss-darwin-arm64', 'lib', 'vss0')
  ]
  for (const path of possibilities) {
    if (fs.existsSync(path)) {
      return path
    }
  }
  console.log('Could not find vss0, checked', possibilities)
  return
}
