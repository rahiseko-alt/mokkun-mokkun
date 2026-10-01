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
  it('creates a named child page and returns to its parent without opening the page list', () => {
    const { container } = render(<App />)
    openPanel()
    fireEvent.click(screen.getByRole('button', { name: /ボタン.*画面をつなぐ/ }))
    openPanel()
    fireEvent.change(screen.getByRole('textbox', { name: 'ボタン名' }), { target: { value: '顧客詳細' } })
    fireEvent.click(screen.getByRole('button', { name: '子ページ作成' }))
    fireEvent.click(screen.getByRole('button', { name: 'ページを作る' }))
    const location = within(container.querySelector('.mobile-page-location') as HTMLElement)
    expect(location.getByText('A-松')).toBeVisible()
    expect(location.getByText('顧客詳細')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: '← 親へ戻る' }))
    fireEvent.pointerDown(screen.getByText('顧客詳細', { selector: '.canvas-region *' }), { button: 0, pointerId: 1, clientX: 110, clientY: 110 })
    openPanel()
    expect(screen.getByRole('button', { name: /移動 \(A-松\)/ })).toBeVisible()
    expect(screen.queryByRole('button', { name: '← 親へ戻る' })).not.toBeInTheDocument()
  })

  it('updates dimensions numerically and retains them after remounting', () => {
    const view = render(<App />)
    openPanel()
    fireEvent.click(screen.getByRole('button', { name: /四角.*領域を作る/ }))
    openPanel()
    fireEvent.click(screen.getByText('位置・サイズを数値で調整'))
    fireEvent.change(screen.getByRole('spinbutton', { name: '幅' }), { target: { value: '280' } })
    view.unmount()
    render(<App />)
    fireEvent.pointerDown(screen.getByText('赤'), { button: 0, pointerId: 1, clientX: 80, clientY: 80 })
    openPanel()
    fireEvent.click(screen.getByText('位置・サイズを数値で調整'))
    expect(screen.getByRole('spinbutton', { name: '幅' })).toHaveValue(280)
  })

  it('slides the control panel in and out and saves a restorable snapshot', () => {
    render(<App />)
    const toggle = screen.getByRole('button', { name: '操作' })
    const panel = screen.getByRole('complementary', { name: '操作パネル' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(panel).not.toHaveClass('is-open')
    expect(panel).toHaveAttribute('inert')
    openPanel()
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(panel).toHaveClass('is-open')
    expect(panel).not.toHaveAttribute('inert')
    expect(within(panel).getByText('ページ一覧 (1)')).toBeInTheDocument()
    expect(within(panel).getByText('ページ識別子')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '操作パネルを閉じる' }))
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(panel).not.toHaveClass('is-open')
    fireEvent.click(screen.getByRole('button', { name: '構成を保存' }))
    expect(screen.getByRole('status')).toHaveTextContent('構成を保存しました')
    fireEvent.click(screen.getByRole('button', { name: 'その他の操作' }))
    fireEvent.click(screen.getByRole('button', { name: '保存一覧' }))
    expect(screen.getByText(/保存した構成/)).toBeInTheDocument()
  })
})
