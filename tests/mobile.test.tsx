import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, cleanup, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { App } from '../src/App'

const openPanel = () => fireEvent.click(screen.getByRole('button', { name: '操作' }))

const originalWidth = window.innerWidth
beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 })
})
afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
  vi.restoreAllMocks()
})

describe('Mobile editing workflow', () => {
  it('creates a child page from the canvas mark and renames it with the button label', () => {
    const { container } = render(<App />)
    openPanel()
    fireEvent.click(screen.getByTitle('ボタンを追加'))
    const canvasButton = screen.getAllByText('ボタン').find((el) => el.closest('.canvas-region'))!
    fireEvent.pointerDown(canvasButton, { button: 0, pointerId: 1, clientX: 110, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    fireEvent.change(screen.getByRole('textbox', { name: 'ボタン名を直接編集' }), { target: { value: '顧客詳細' } })
    fireEvent.click(screen.getByRole('button', { name: '顧客詳細から子ページ作成' }))
    fireEvent.click(screen.getByRole('button', { name: 'ページを作る' }))
    const location = within(container.querySelector('.mobile-page-location') as HTMLElement)
    expect(location.getByText('A-松')).toBeVisible()
    expect(location.getByText('顧客詳細')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '← 親へ戻る' }))
    expect(screen.getByRole('button', { name: '顧客詳細のページへ移動' })).toBeInTheDocument()
    // ページ名はボタン名の変更に追従する
    const renamed = screen.getByText('顧客詳細', { selector: '.canvas-region *' })
    fireEvent.pointerDown(renamed, { button: 0, pointerId: 1, clientX: 110, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    fireEvent.pointerDown(renamed, { button: 0, pointerId: 1, clientX: 110, clientY: 110 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    fireEvent.change(screen.getByRole('textbox', { name: 'ボタン名を直接編集' }), { target: { value: '顧客一覧' } })
    expect(screen.getByTitle('顧客一覧')).toBeInTheDocument()
    expect(screen.queryByTitle('顧客詳細')).not.toBeInTheDocument()
  })

  it('adds a transparent text element whose font scales when the box is resized', () => {
    const view = render(<App />)
    openPanel()
    fireEvent.click(screen.getByTitle('テキストを追加'))
    const text = view.container.querySelector('.canvas-text') as HTMLElement
    expect(text.style.backgroundColor).toBe('')
    expect(text.style.fontSize).toBe('18px')
    fireEvent.pointerDown(screen.getByRole('button', { name: '右下をドラッグしてサイズ変更' }), { button: 0, pointerId: 1, clientX: 0, clientY: 0 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 0, clientY: 48 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    view.unmount()
    const { container } = render(<App />)
    const reloaded = container.querySelector('.canvas-text') as HTMLElement
    expect(reloaded.style.height).toBe('96px')
    expect(reloaded.style.fontSize).toBe('36px')
  })

  it('edits text directly on the canvas when a selected text is tapped again', () => {
    const { container } = render(<App />)
    openPanel()
    fireEvent.click(screen.getByTitle('テキストを追加'))
    const text = container.querySelector('.canvas-text') as HTMLElement
    fireEvent.pointerDown(text, { button: 0, pointerId: 1, clientX: 90, clientY: 90 })
    fireEvent.pointerUp(window, { pointerId: 1 })
    const input = screen.getByRole('textbox', { name: 'テキストを直接編集' })
    fireEvent.change(input, { target: { value: 'お知らせ' } })
    fireEvent.blur(input)
    expect(screen.queryByRole('textbox', { name: 'テキストを直接編集' })).not.toBeInTheDocument()
    expect(container.querySelector('.canvas-text')).toHaveTextContent('お知らせ')
  })

  it('slides the control panel in and out and saves a restorable snapshot', () => {
    render(<App />)
    const toggle = screen.getByRole('button', { name: '操作' })
    const panel = screen.getByRole('complementary', { name: '操作パネル' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(panel).toHaveAttribute('inert')
    openPanel()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toHaveClass('is-open')
    expect(panel).not.toHaveAttribute('inert')
    expect(within(panel).getByText('ページ一覧 (1)')).toBeInTheDocument()
    fireEvent.click(within(panel).getByRole('button', { name: '保存' }))
    expect(screen.getByRole('status')).toHaveTextContent('構成を保存しました')
    expect(panel).not.toHaveClass('is-open')
    openPanel()
    fireEvent.click(within(panel).getByRole('button', { name: '保存一覧' }))
    expect(screen.getByText(/保存した構成/)).toBeInTheDocument()
  })
})
