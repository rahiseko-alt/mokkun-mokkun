import { ProjectState, Snapshot } from '../types'
import {
  STORAGE_KEY_CURRENT_PROJECT,
  STORAGE_KEY_SNAPSHOTS,
} from '../constants'
import { createInitialProject } from './projectService'

export function saveCurrentProjectToStorage(state: ProjectState): boolean {
  try {
    const serialized = JSON.stringify(state)
    localStorage.setItem(STORAGE_KEY_CURRENT_PROJECT, serialized)
    return true
  } catch (error) {
    console.error('Failed to save project state to localStorage:', error)
    return false
  }
}

export function loadCurrentProjectFromStorage(): ProjectState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_PROJECT)
    if (raw) {
      const parsed = JSON.parse(raw) as ProjectState
      if (parsed && parsed.project && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Failed to load project state from localStorage:', error)
  }
  return createInitialProject()
}

export function saveSnapshotsToStorage(snapshots: Snapshot[]): boolean {
  try {
    const serialized = JSON.stringify(snapshots)
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, serialized)
    return true
  } catch (error) {
    console.error('Failed to save snapshots to localStorage:', error)
    return false
  }
}

export function loadSnapshotsFromStorage(): Snapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNAPSHOTS)
    if (raw) {
      const parsed = JSON.parse(raw) as Snapshot[]
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Failed to load snapshots from localStorage:', error)
  }
  return []
}
