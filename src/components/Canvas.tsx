import React, { useState, useRef, useEffect } from 'react'
import {
  CanvasElement,
  RectangleElement,
  ImageElement,
  ButtonElement,
  TextElement,
  Stroke,
  DrawTool,
} from '../types'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '../constants'
import { ArrowRight, Plus, X, MousePointer2, Pencil, Eraser } from 'lucide-react'

interface CanvasProps {
  elements: CanvasElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (updated: CanvasElement) => void
  onButtonClick: (button: ButtonElement) => void
  onUpdateButtonLabel: (label: string) => void
  onDeleteElement: () => void
  strokes: Stroke[]
  onAddStroke: (points: number[]) => void
  onRemoveStrokes: (ids: string[]) => void
  tool: DrawTool
  onChangeTool: (tool: DrawTool) => void
  isMobile?: boolean
}

const TOOLS: { key: DrawTool; label: string; Icon: typeof Pencil }[] = [
  { key: 'select', label: '選択', Icon: MousePointer2 },
  { key: 'pen', label: '鉛筆', Icon: Pencil },
  { key: 'eraser', label: '消しゴム', Icon: Eraser },
]
const ERASER_RADIUS = 14
const toPath = (points: number[]) => points.reduce((d, v, i) => d + (i % 2 === 0 ? `${i === 0 ? 'M' : ' L'}${v}` : ` ${v}`), '')

type DragMode = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onButtonClick,
  onUpdateButtonLabel,
  onDeleteElement,
  strokes,
  onAddStroke,
  onRemoveStrokes,
  tool,
  onChangeTool,
  isMobile = false,
}) => {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragStartElementState, setDragStartElementState] = useState<{
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
  } | null>(null)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(360)
  const dragScale = useRef(1)
  // テキストとボタン名は「選択済みの状態でもう一度タップ」で描画画面上で直接編集する
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftStroke, setDraftStroke] = useState<number[] | null>(null)
  const drawLayerRef = useRef<SVGSVGElement | null>(null)
  const tapRef = useRef<{ id: string; wasSelected: boolean; moved: boolean } | null>(null)
  const sceneWidth = isMobile ? Math.max(360, ...elements.map(el => el.x + el.width + 32)) : 1400
  const sceneHeight = Math.max(isMobile ? 560 : 1000, ...elements.map(el => el.y + el.height + 32))
  const scale = isMobile ? Math.min(1, viewportWidth / sceneWidth) : 1

  useEffect(() => {
    if (!canvasRef.current || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width))
    observer.observe(canvasRef.current)
    return () => observer.disconnect()
  }, [])

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null

  const handlePointerDown = (
    e: React.PointerEvent,
    element: CanvasElement,
    mode: DragMode = 'move'
  ) => {
    e.stopPropagation()
    if (e.button !== 0) return
    // タッチでもドラッグできるように
    if (e.target instanceof Element && e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId)
      } catch {
        // ignore if not supported
      }
    }
    tapRef.current = { id: element.id, wasSelected: element.id === selectedElementId, moved: false }
    if (editingId && editingId !== element.id) setEditingId(null)
    onSelectElement(element.id)
    dragScale.current = scale
    setDragMode(mode)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    setDragStartElementState({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.type === 'text' ? element.fontSize : undefined,
    })
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragMode || !dragStartElementState || !selectedElement) return

      const dx = (e.clientX - dragStartPos.x) / dragScale.current
      const dy = (e.clientY - dragStartPos.y) / dragScale.current
      if (tapRef.current && Math.hypot(dx, dy) > 4) tapRef.current.moved = true

      let newX = dragStartElementState.x
      let newY = dragStartElementState.y
      let newW = dragStartElementState.width
      let newH = dragStartElementState.height

      if (dragMode === 'move') {
        newX = Math.max(0, dragStartElementState.x + dx)
        newY = Math.max(0, dragStartElementState.y + dy)
      } else {
        // リサイズ計算
        if (dragMode.includes('e')) {
          newW = Math.max(MIN_ELEMENT_WIDTH, dragStartElementState.width + dx)
        }
        if (dragMode.includes('s')) {
          newH = Math.max(MIN_ELEMENT_HEIGHT, dragStartElementState.height + dy)
        }
        if (dragMode.includes('w')) {
          const possibleW = dragStartElementState.width - dx
          if (possibleW >= MIN_ELEMENT_WIDTH) {
            newW = possibleW
            newX = dragStartElementState.x + dx
          }
        }
        if (dragMode.includes('n')) {
          const possibleH = dragStartElementState.height - dy
          if (possibleH >= MIN_ELEMENT_HEIGHT) {
            newH = possibleH
            newY = dragStartElementState.y + dy
          }
        }
      }

      const resized = dragMode !== 'move' && selectedElement.type === 'text' && dragStartElementState.fontSize
        // テキストは枠の大きさに合わせて文字も拡大縮小する
        ? { fontSize: Math.max(8, Math.round(dragStartElementState.fontSize * newH / dragStartElementState.height)) }
        : {}
      onUpdateElement({
        ...selectedElement,
        ...resized,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
        updatedAt: new Date().toISOString(),
      })
    }

    const handlePointerUp = () => {
      const tap = tapRef.current
      tapRef.current = null
      if (tap && dragMode === 'move' && tap.wasSelected && !tap.moved && (selectedElement?.type === 'text' || selectedElement?.type === 'button')) {
        setEditingId(tap.id)
      }
      setDragMode(null)
      setDragStartElementState(null)
    }

    if (dragMode) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [dragMode, dragStartPos, dragStartElementState, selectedElement, onUpdateElement, scale])

  // 背景クリックで選択解除
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setEditingId(null)
      onSelectElement(null)
    }
  }

  const toScenePoint = (e: React.PointerEvent) => {
    const rect = drawLayerRef.current?.getBoundingClientRect()
    const ratio = rect && rect.width ? sceneWidth / rect.width : 1
    return [Math.round((e.clientX - (rect?.left ?? 0)) * ratio), Math.round((e.clientY - (rect?.top ?? 0)) * ratio)]
  }
  const eraseAt = (x: number, y: number) => {
    const hit = strokes.filter((st) => {
      for (let i = 0; i < st.points.length; i += 2) {
        if (Math.hypot(st.points[i] - x, st.points[i + 1] - y) <= ERASER_RADIUS) return true
      }
      return false
    }).map((st) => st.id)
    if (hit.length) onRemoveStrokes(hit)
  }
  const handleDrawPointerDown = (e: React.PointerEvent) => {
    if (tool === 'select') return
    e.stopPropagation()
    try { (e.target as Element).setPointerCapture?.(e.pointerId) } catch { /* 非対応環境 */ }
    const [x, y] = toScenePoint(e)
    if (tool === 'pen') setDraftStroke([x, y])
    else eraseAt(x, y)
  }
  const handleDrawPointerMove = (e: React.PointerEvent) => {
    if (tool === 'pen' && draftStroke) {
      const [x, y] = toScenePoint(e)
      setDraftStroke((prev) => (prev ? [...prev, x, y] : prev))
    } else if (tool === 'eraser' && e.buttons) {
      const [x, y] = toScenePoint(e)
      eraseAt(x, y)
    }
  }
  const handleDrawPointerUp = () => {
    if (draftStroke) {
      onAddStroke(draftStroke.length === 2 ? [...draftStroke, draftStroke[0] + 0.5, draftStroke[1]] : draftStroke)
      setDraftStroke(null)
    }
  }

  const renderDeleteButton = () => (
    <button
      type="button"
      className="canvas-delete"
      aria-label="選択中の要素を削除"
      title="削除"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onDeleteElement() }}
    ><X size={isMobile ? 16 : 12} /></button>
  )

  // 8方向リサイズハンドルの描画
  const renderResizeHandles = (el: CanvasElement) => {
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: isMobile ? '28px' : '10px',
      height: isMobile ? '28px' : '10px',
      backgroundColor: 'var(--bh-blue)',
      border: '1.5px solid #ffffff',
      borderRadius: '2px',
      zIndex: 30,
      touchAction: 'none',
    }

    if (isMobile) return <>{renderDeleteButton()}<button aria-label="右下をドラッグしてサイズ変更" style={{ ...handleStyle, bottom: '-14px', right: '-14px', cursor: 'nwse-resize' }} onPointerDown={(e) => handlePointerDown(e, el, 'se')}>↘</button></>
    return (
      <>
        {renderDeleteButton()}
        {/* 四隅 */}
        <div
          style={{ ...handleStyle, top: '-5px', left: '-5px', cursor: 'nwse-resize' }}
          onPointerDown={(e) => handlePointerDown(e, el, 'nw')}
        />
        <div
          style={{ ...handleStyle, top: '-5px', right: '-5px', cursor: 'nesw-resize' }}
          onPointerDown={(e) => handlePointerDown(e, el, 'ne')}
        />
        <div
          style={{ ...handleStyle, bottom: '-5px', right: '-5px', cursor: 'nwse-resize' }}
          onPointerDown={(e) => handlePointerDown(e, el, 'se')}
        />
        <div
          style={{ ...handleStyle, bottom: '-5px', left: '-5px', cursor: 'nesw-resize' }}
          onPointerDown={(e) => handlePointerDown(e, el, 'sw')}
        />

        {/* 四辺 */}
        <div
          style={{
            ...handleStyle,
            top: '-5px',
            left: 'calc(50% - 5px)',
            cursor: 'ns-resize',
          }}
          onPointerDown={(e) => handlePointerDown(e, el, 'n')}
        />
        <div
          style={{
            ...handleStyle,
            bottom: '-5px',
            left: 'calc(50% - 5px)',
            cursor: 'ns-resize',
          }}
          onPointerDown={(e) => handlePointerDown(e, el, 's')}
        />
        <div
          style={{
            ...handleStyle,
            top: 'calc(50% - 5px)',
            left: '-5px',
            cursor: 'ew-resize',
          }}
          onPointerDown={(e) => handlePointerDown(e, el, 'w')}
        />
        <div
          style={{
            ...handleStyle,
            top: 'calc(50% - 5px)',
            right: '-5px',
            cursor: 'ew-resize',
          }}
          onPointerDown={(e) => handlePointerDown(e, el, 'e')}
        />
      </>
    )
  }

  return (
    <div className="canvas-region">
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#ffffff',
        position: 'relative',
        overflow: 'auto',
        cursor: 'default',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        touchAction: 'pan-x pan-y',
      }}
    >
      <div style={{ width: sceneWidth * scale, height: sceneHeight * scale }}>
      <div
        style={{ width: sceneWidth, height: sceneHeight, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'top left' }}
        onClick={handleCanvasClick}
      >
        {elements.map((el) => {
          const isSelected = el.id === selectedElementId

          // 1. 四角要素 (9章)
          if (el.type === 'rectangle') {
            const rect = el as RectangleElement
            return (
              <div
                key={rect.id}
                onPointerDown={(e) => handlePointerDown(e, rect, 'move')}
                style={{
                  position: 'absolute',
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundColor: rect.colorHex,
                  border: isSelected ? '2px solid var(--bh-blue)' : `1.5px solid ${rect.borderColor}`,
                  borderRadius: '4px',
                  boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
                  cursor: 'move',
                  zIndex: isSelected ? 20 : rect.zIndex,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px 6px',
                  boxSizing: 'border-box',
                  touchAction: 'none',
                }}
              >
                {/* 色名称バッジ */}
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: rect.textColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: rect.borderColor,
                    }}
                  />
                  <span>{rect.colorKey}</span>
                </div>

                {isSelected && renderResizeHandles(rect)}
              </div>
            )
          }

          // 2. 画像要素 (10章)
          if (el.type === 'image') {
            const img = el as ImageElement
            return (
              <div
                key={img.id}
                onPointerDown={(e) => handlePointerDown(e, img, 'move')}
                style={{
                  position: 'absolute',
                  left: `${img.x}px`,
                  top: `${img.y}px`,
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                  border: isSelected ? '2px solid var(--bh-blue)' : '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'move',
                  zIndex: isSelected ? 20 : img.zIndex,
                  overflow: 'hidden',
                  backgroundColor: 'var(--bh-paper-2)',
                  boxSizing: 'border-box',
                  touchAction: 'none',
                }}
              >
                <img
                  src={img.src}
                  alt={img.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: img.keepAspectRatio ? 'contain' : 'fill',
                    pointerEvents: 'none',
                  }}
                />
                {isSelected && renderResizeHandles(img)}
              </div>
            )
          }

          // 3. ボタン要素 (11, 12章)
          if (el.type === 'button') {
            const btn = el as ButtonElement
            return (
              <div
                key={btn.id}
                onPointerDown={(e) => handlePointerDown(e, btn, 'move')}
                style={{
                  position: 'absolute',
                  left: `${btn.x}px`,
                  top: `${btn.y}px`,
                  width: `${btn.width}px`,
                  height: `${btn.height}px`,
                  backgroundColor: '#ffffff',
                  border: isSelected ? '2px solid var(--bh-blue)' : '1.5px solid #64748b',
                  borderRadius: '6px',
                  boxShadow: isSelected
                    ? '0 0 0 2px rgba(37,99,235,0.25)'
                    : '0 2px 4px rgba(0,0,0,0.06)',
                  cursor: 'move',
                  zIndex: isSelected ? 20 : btn.zIndex,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 8px',
                  boxSizing: 'border-box',
                  gap: '6px',
                  touchAction: 'none',
                }}
              >
                {/* ボタン名 */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--bh-ink)',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {editingId === btn.id ? (
                    <input
                      className="canvas-label-input"
                      aria-label="ボタン名を直接編集"
                      value={btn.label}
                      autoFocus
                      onFocus={(e) => e.currentTarget.select()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateButtonLabel(e.target.value)}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur() }}
                    />
                  ) : btn.label}
                </span>

                {/* 遷移 / 作成トリガー: ドラッグと干渉しないようボタンの下に出す */}
                <button
                  className={'canvas-link-tab' + (btn.targetPageId ? ' is-linked' : '')}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label={btn.targetPageId ? `${btn.label}のページへ移動` : `${btn.label}から子ページ作成`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onButtonClick(btn)
                  }}
                  title={btn.targetPageId ? 'このページへ移動' : 'このボタンからページを作成'}
                >
                  <span className="canvas-link-mark">{btn.targetPageId ? <ArrowRight size={10} strokeWidth={1.5} /> : <Plus size={10} strokeWidth={1.5} />}</span>
                </button>

                {isSelected && editingId !== btn.id && renderResizeHandles(btn)}
              </div>
            )
          }

          // 4. テキスト要素 (背景透明)
          if (el.type === 'text') {
            const txt = el as TextElement
            return (
              <div
                key={txt.id}
                className={'canvas-text' + (isSelected ? ' is-selected' : '')}
                onPointerDown={(e) => handlePointerDown(e, txt, 'move')}
                style={{
                  left: `${txt.x}px`,
                  top: `${txt.y}px`,
                  width: `${txt.width}px`,
                  height: `${txt.height}px`,
                  fontSize: `${txt.fontSize}px`,
                  zIndex: isSelected ? 20 : txt.zIndex,
                }}
              >
                {editingId === txt.id ? (
                  <textarea
                    className="canvas-text-input"
                    aria-label="テキストを直接編集"
                    value={txt.text}
                    autoFocus
                    onFocus={(e) => e.currentTarget.select()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateElement({ ...txt, text: e.target.value, updatedAt: new Date().toISOString() })}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => { if (e.key === 'Escape') e.currentTarget.blur() }}
                    style={{ fontSize: `${txt.fontSize}px` }}
                  />
                ) : <span>{txt.text || ' '}</span>}
                {isSelected && editingId !== txt.id && renderResizeHandles(txt)}
              </div>
            )
          }

          return null
        })}
        {/* 鉛筆の手書き線。鉛筆/消しゴム中だけ描画画面の操作を受け取る */}
        <svg
          ref={drawLayerRef}
          className={'canvas-draw-layer' + (tool !== 'select' ? ' is-active is-' + tool : '')}
          width={sceneWidth}
          height={sceneHeight}
          onPointerDown={handleDrawPointerDown}
          onPointerMove={handleDrawPointerMove}
          onPointerUp={handleDrawPointerUp}
          onPointerCancel={handleDrawPointerUp}
        >
          {strokes.map((st) => <path key={st.id} d={toPath(st.points)} strokeWidth={st.width} />)}
          {draftStroke && <path d={toPath(draftStroke)} strokeWidth={3} />}
        </svg>
      </div>
      </div>
    </div>
      <div className="canvas-tools" role="toolbar" aria-label="描画ツール">
        {TOOLS.map(({ key, label, Icon }) => (
          <button key={key} type="button" aria-pressed={tool === key} aria-label={label} title={label} onClick={() => onChangeTool(key)}><Icon size={18} /></button>
        ))}
      </div>
    </div>
  )
}
