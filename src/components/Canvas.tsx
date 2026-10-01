import React, { useState, useRef, useEffect } from 'react'
import {
  CanvasElement,
  RectangleElement,
  ImageElement,
  ButtonElement,
} from '../types'
import { MIN_ELEMENT_WIDTH, MIN_ELEMENT_HEIGHT } from '../constants'
import { ArrowRight, PlusCircle } from 'lucide-react'

interface CanvasProps {
  elements: CanvasElement[]
  selectedElementId: string | null
  onSelectElement: (id: string | null) => void
  onUpdateElement: (updated: CanvasElement) => void
  onButtonClick: (button: ButtonElement) => void
}

type DragMode = 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null

export const Canvas: React.FC<CanvasProps> = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onButtonClick,
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

  const selectedElement = elements.find((el) => el.id === selectedElementId) || null

  const handleMouseDown = (
    e: React.MouseEvent,
    element: CanvasElement,
    mode: DragMode = 'move'
  ) => {
    e.stopPropagation()
    onSelectElement(element.id)
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
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragMode || !dragStartElementState || !selectedElement) return

      const dx = e.clientX - dragStartPos.x
      const dy = e.clientY - dragStartPos.y

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

    const handleMouseUp = () => {
      setDragMode(null)
      setDragStartElementState(null)
    }

    if (dragMode) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragMode, dragStartPos, dragStartElementState, selectedElement, onUpdateElement])

  // 背景クリックで選択解除
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelectElement(null)
    }
  }

  // 8方向リサイズハンドルの描画
  const renderResizeHandles = (el: CanvasElement) => {
    const handleStyle: React.CSSProperties = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#2563eb',
      border: '1px solid #ffffff',
      borderRadius: '1px',
      zIndex: 10,
    }

    return (
      <>
        {/* 四隅 */}
        <div
          style={{ ...handleStyle, top: '-4px', left: '-4px', cursor: 'nwse-resize' }}
          onMouseDown={(e) => handleMouseDown(e, el, 'nw')}
        />
        <div
          style={{ ...handleStyle, top: '-4px', right: '-4px', cursor: 'nesw-resize' }}
          onMouseDown={(e) => handleMouseDown(e, el, 'ne')}
        />
        <div
          style={{ ...handleStyle, bottom: '-4px', right: '-4px', cursor: 'nwse-resize' }}
          onMouseDown={(e) => handleMouseDown(e, el, 'se')}
        />
        <div
          style={{ ...handleStyle, bottom: '-4px', left: '-4px', cursor: 'nesw-resize' }}
          onMouseDown={(e) => handleMouseDown(e, el, 'sw')}
        />

        {/* 四辺 */}
        <div
          style={{
            ...handleStyle,
            top: '-4px',
            left: 'calc(50% - 4px)',
            cursor: 'ns-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, el, 'n')}
        />
        <div
          style={{
            ...handleStyle,
            bottom: '-4px',
            left: 'calc(50% - 4px)',
            cursor: 'ns-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, el, 's')}
        />
        <div
          style={{
            ...handleStyle,
            top: 'calc(50% - 4px)',
            left: '-4px',
            cursor: 'ew-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, el, 'w')}
        />
        <div
          style={{
            ...handleStyle,
            top: 'calc(50% - 4px)',
            right: '-4px',
            cursor: 'ew-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, el, 'e')}
        />
      </>
    )
  }

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      style={{
        flex: 1,
        height: 'calc(100vh - 112px)',
        backgroundColor: '#ffffff', // 8.1 キャンバス背景は白
        position: 'relative',
        overflow: 'auto',
        cursor: 'default',
        // 微細な方眼背景で位置合わせを補助
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        style={{
          minWidth: '1600px',
          minHeight: '1200px',
          position: 'relative',
        }}
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
                onMouseDown={(e) => handleMouseDown(e, rect, 'move')}
                style={{
                  position: 'absolute',
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.width}px`,
                  height: `${rect.height}px`,
                  backgroundColor: rect.colorHex,
                  border: isSelected ? '2px solid #2563eb' : `1.5px solid ${rect.borderColor}`,
                  borderRadius: '4px',
                  boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
                  cursor: 'move',
                  zIndex: isSelected ? 20 : rect.zIndex,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '4px 6px',
                  boxSizing: 'border-box',
                }}
              >
                {/* 9.3 色名称バッジ（例: 赤、青） */}
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
                onMouseDown={(e) => handleMouseDown(e, img, 'move')}
                style={{
                  position: 'absolute',
                  left: `${img.x}px`,
                  top: `${img.y}px`,
                  width: `${img.width}px`,
                  height: `${img.height}px`,
                  border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  borderRadius: '4px',
                  boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'move',
                  zIndex: isSelected ? 20 : img.zIndex,
                  overflow: 'hidden',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
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
                onMouseDown={(e) => handleMouseDown(e, btn, 'move')}
                style={{
                  position: 'absolute',
                  left: `${btn.x}px`,
                  top: `${btn.y}px`,
                  width: `${btn.width}px`,
                  height: `${btn.height}px`,
                  backgroundColor: '#ffffff',
                  border: isSelected ? '2px solid #2563eb' : '1.5px solid #64748b',
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
                }}
              >
                {/* ボタン名 (11.1) */}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f172a',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 'calc(100% - 24px)',
                  }}
                >
                  {btn.label}
                </span>

                {/* ボタンのアクションアイコン (クリックで遷移 / 子ページ作成) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onButtonClick(btn)
                  }}
                  title={btn.targetPageId ? 'このページへ移動' : 'このボタンからページを作成'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    borderRadius: '4px',
                    backgroundColor: btn.targetPageId ? '#eff6ff' : '#f0fdf4',
                    color: btn.targetPageId ? '#2563eb' : '#16a34a',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {btn.targetPageId ? <ArrowRight size={13} /> : <PlusCircle size={13} />}
                </button>

                {isSelected && renderResizeHandles(btn)}
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
