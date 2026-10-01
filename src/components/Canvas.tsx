import React, { useState, useRef, useEffect } from 'react'
import {
  CanvasElement,
  RectangleElement,
  ImageElement,
  ButtonElement,
} from '../types'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '../constants'
import { ArrowRight, Plus } from 'lucide-react'

interface CanvasProps {
  elements: CanvasElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (updated: CanvasElement) => void
  onButtonClick: (button: ButtonElement) => void
  isMobile?: boolean
}

type DragMode = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onButtonClick,
  isMobile = false,
}) => {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragStartElementState, setDragStartElementState] = useState<{
    x: number
    y: number
    width: number
    height: number
  } | null>(null)

  const canvasRef = useRef<HTMLDivElement | null>(null)
  const [viewportWidth, setViewportWidth] = useState(360)
  const [zoom, setZoom] = useState(1)
  const dragScale = useRef(1)
  const sceneWidth = isMobile ? Math.max(360, ...elements.map(el => el.x + el.width + 32)) : 1400
  const sceneHeight = Math.max(isMobile ? 560 : 1000, ...elements.map(el => el.y + el.height + 32))
  const scale = isMobile ? Math.min(1, viewportWidth / sceneWidth) * zoom : 1

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
    onSelectElement(element.id)
    dragScale.current = scale
    setDragMode(mode)
    setDragStartPos({ x: e.clientX, y: e.clientY })
    setDragStartElementState({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
    })
  }

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragMode || !dragStartElementState || !selectedElement) return

      const dx = (e.clientX - dragStartPos.x) / dragScale.current
      const dy = (e.clientY - dragStartPos.y) / dragScale.current

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

      onUpdateElement({
        ...selectedElement,
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH),
        updatedAt: new Date().toISOString(),
      })
    }

    const handlePointerUp = () => {
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
      onSelectElement(null)
    }
  }

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

    if (isMobile) return <button aria-label="右下をドラッグしてサイズ変更" style={{ ...handleStyle, bottom: '-14px', right: '-14px', cursor: 'nwse-resize' }} onPointerDown={(e) => handlePointerDown(e, el, 'se')}>↘</button>
    return (
      <>
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
      {isMobile && <div className="canvas-view-controls" aria-label="キャンバスの表示">
        <span>表示 {Math.round(scale * 100)}%</span>
        <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} aria-label="縮小">−</button>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} aria-label="拡大">＋</button>
        <button onClick={() => { setZoom(1); canvasRef.current?.scrollTo?.(0, 0) }}>幅に合わせる</button>
      </div>}
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
        {elements.length === 0 && <div className="canvas-empty">
          <span className="canvas-empty-icon">＋</span>
          <strong>ここに画面をつくりましょう</strong>
          <p>{isMobile ? '右上の「操作」' : '右の操作パネル'}の「四角」で領域を配置。<br />「ボタン」から次のページをつくれます。</p>
        </div>}
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
                  {btn.label}
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
                  {btn.targetPageId ? <ArrowRight size={isMobile ? 18 : 14} /> : <Plus size={isMobile ? 18 : 14} />}
                </button>

                {isSelected && renderResizeHandles(btn)}
              </div>
            )
          }

          return null
        })}
      </div>
      </div>
    </div>
    </div>
  )
}
