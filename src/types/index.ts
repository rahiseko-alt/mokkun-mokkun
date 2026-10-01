export type ElementType = 'rectangle' | 'image' | 'button' | 'text'

export interface BaseElement {
  id: string
  pageId: string
  type: ElementType
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  createdAt: string
  updatedAt: string
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle'
  colorKey: string // e.g. "赤", "青", "黄"
  colorHex: string // e.g. "#fee2e2"
  borderColor: string // e.g. "#f87171"
  textColor: string // e.g. "#991b1b"
}

export interface ImageElement extends BaseElement {
  type: 'image'
  src: string
  fileName: string
  keepAspectRatio: boolean
}

export interface ButtonElement extends BaseElement {
  type: 'button'
  label: string
  targetPageId: string | null
}

export interface TextElement extends BaseElement {
  type: 'text'
  text: string
  fontSize: number // px
}

export type CanvasElement = RectangleElement | ImageElement | ButtonElement | TextElement

export interface IdentifierSet {
  id: string
  projectId: string
  depth: number // 1-indexed: 1, 2, 3...
  tokens: string[]
}

export interface Page {
  id: string
  projectId: string
  parentPageId: string | null
  identifierToken: string
  identifierPath: string // e.g. "A", "B-竹", "B-竹-地"
  displayName: string
  depth: number
  order: number
  comment: string
  elements: CanvasElement[]
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  identifierSets: IdentifierSet[]
  createdAt: string
  updatedAt: string
}

export interface ProjectState {
  project: Project
  pages: Page[]
  currentPageId: string
}

export interface Snapshot {
  id: string
  projectId: string
  createdAt: string // e.g. "2026/10/01 09:18"
  serializedProjectState: ProjectState
}
