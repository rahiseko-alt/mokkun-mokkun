import React, { useState } from 'react'
import { IdentifierSet } from '../../types'
import { IDENTIFIER_GUIDE_TEXT } from '../../constants'
import { Plus, Trash2, ArrowUp, ArrowDown, AlertCircle, Info, Settings as SettingsIcon } from 'lucide-react'
import { generateUUID } from '../../services/projectService'

interface SettingsModalProps {
  identifierSets: IdentifierSet[]
  projectId: string
  onSave: (updatedSets: IdentifierSet[]) => void
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  identifierSets,
  projectId,
  onSave,
  onClose,
}) => {
  // ローカルステートで編集作業
  const [sets, setSets] = useState<IdentifierSet[]>(() =>
    JSON.parse(JSON.stringify(identifierSets))
  )
  const [activeDepth, setActiveDepth] = useState<number>(1)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [newTokenInput, setNewTokenInput] = useState<string>('')

  const currentSet = sets.find((s) => s.depth === activeDepth) || sets[0]

  // トークンの追加
  const handleAddToken = () => {
    const trimmed = newTokenInput.trim()
    if (!trimmed) return

    if (currentSet.tokens.includes(trimmed)) {
      setErrorMessage('同じ階層に同じ識別子は登録できません。')
      return
    }

    setErrorMessage(null)
    setSets((prev) =>
      prev.map((s) => {
        if (s.depth === activeDepth) {
          return {
            ...s,
            tokens: [...s.tokens, trimmed],
          }
        }
        return s
      })
    )
    setNewTokenInput('')
  }

  // トークンの編集
  const handleUpdateToken = (index: number, value: string) => {
    setErrorMessage(null)
    setSets((prev) =>
      prev.map((s) => {
        if (s.depth === activeDepth) {
          const updatedTokens = [...s.tokens]
          updatedTokens[index] = value
          return {
            ...s,
            tokens: updatedTokens,
          }
        }
        return s
      })
    )
  }

  // トークンの削除
  const handleDeleteToken = (index: number) => {
    setErrorMessage(null)
    setSets((prev) =>
      prev.map((s) => {
        if (s.depth === activeDepth) {
          return {
            ...s,
            tokens: s.tokens.filter((_, i) => i !== index),
          }
        }
        return s
      })
    )
  }

  // トークンの並べ替え (上へ)
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    setSets((prev) =>
      prev.map((s) => {
        if (s.depth === activeDepth) {
          const updated = [...s.tokens]
          const temp = updated[index - 1]
          updated[index - 1] = updated[index]
          updated[index] = temp
          return { ...s, tokens: updated }
        }
        return s
      })
    )
  }

  // トークンの並べ替え (下へ)
  const handleMoveDown = (index: number) => {
    if (index === currentSet.tokens.length - 1) return
    setSets((prev) =>
      prev.map((s) => {
        if (s.depth === activeDepth) {
          const updated = [...s.tokens]
          const temp = updated[index + 1]
          updated[index + 1] = updated[index]
          updated[index] = temp
          return { ...s, tokens: updated }
        }
        return s
      })
    )
  }

  // 新しい階層を追加
  const handleAddNewDepth = () => {
    const nextDepth = sets.length + 1
    const newSet: IdentifierSet = {
      id: generateUUID(),
      projectId,
      depth: nextDepth,
      tokens: ['一', '二', '三'],
    }
    setSets([...sets, newSet])
    setActiveDepth(nextDepth)
  }

  // 保存処理（重複チェック 7.4）
  const handleSave = () => {
    // 全階層で重複チェック
    for (const s of sets) {
      const trimmedTokens = s.tokens.map((t) => t.trim()).filter(Boolean)
      const tokenSet = new Set(trimmedTokens)
      if (tokenSet.size !== trimmedTokens.length) {
        setErrorMessage(`第${s.depth}階層に重複する識別子があります。同じ階層に同じ識別子は登録できません。`)
        setActiveDepth(s.depth)
        return
      }
      if (trimmedTokens.length === 0) {
        setErrorMessage(`第${s.depth}階層には最低1つの識別子が必要です。`)
        setActiveDepth(s.depth)
        return
      }
    }

    onSave(sets)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '640px',
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <SettingsIcon size={20} color="#2563eb" />
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            識別子セット設定
          </h3>
        </div>

        {/* 7.5 推奨ガイド */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#1e40af',
            lineHeight: '1.5',
            marginBottom: '16px',
          }}
        >
          <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{IDENTIFIER_GUIDE_TEXT}</span>
        </div>

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#dc2626',
              marginBottom: '14px',
              fontWeight: 600,
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 階層タブ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {sets.map((s) => (
            <button
              key={s.depth}
              onClick={() => {
                setActiveDepth(s.depth)
                setErrorMessage(null)
              }}
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: activeDepth === s.depth ? 700 : 500,
                color: activeDepth === s.depth ? '#2563eb' : '#64748b',
                backgroundColor: activeDepth === s.depth ? '#eff6ff' : '#f8fafc',
                border: activeDepth === s.depth ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              第{s.depth}階層 ({s.tokens.length})
            </button>
          ))}
          <button
            onClick={handleAddNewDepth}
            title="階層を追加"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
              border: '1px dashed #cbd5e1',
            }}
          >
            <Plus size={13} />
            <span>階層追加</span>
          </button>
        </div>

        {/* トークン追加フォーム */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            placeholder={`第${activeDepth}階層に識別子を追加 (例: 鶴)`}
            value={newTokenInput}
            onChange={(e) => setNewTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddToken()
            }}
            style={{
              flex: 1,
              padding: '7px 12px',
              fontSize: '13px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
            }}
          />
          <button
            onClick={handleAddToken}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              borderRadius: '6px',
            }}
          >
            <Plus size={15} />
            <span>追加</span>
          </button>
        </div>

        {/* トークンリスト */}
        <div
          style={{
            flex: 1,
            maxHeight: '260px',
            overflowY: 'auto',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {currentSet.tokens.map((token, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  width: '24px',
                }}
              >
                #{index + 1}
              </span>

              <input
                type="text"
                value={token}
                onChange={(e) => handleUpdateToken(index, e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '13px',
                  border: '1px solid transparent',
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                }}
                onFocus={(e) => (e.target.style.backgroundColor = '#f1f5f9')}
                onBlur={(e) => (e.target.style.backgroundColor = 'transparent')}
              />

              {/* 並べ替えボタン */}
              <button
                disabled={index === 0}
                onClick={() => handleMoveUp(index)}
                title="上へ移動"
                style={{
                  padding: '4px',
                  borderRadius: '3px',
                  color: index === 0 ? '#cbd5e1' : '#64748b',
                  cursor: index === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <ArrowUp size={14} />
              </button>

              <button
                disabled={index === currentSet.tokens.length - 1}
                onClick={() => handleMoveDown(index)}
                title="下へ移動"
                style={{
                  padding: '4px',
                  borderRadius: '3px',
                  color: index === currentSet.tokens.length - 1 ? '#cbd5e1' : '#64748b',
                  cursor: index === currentSet.tokens.length - 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ArrowDown size={14} />
              </button>

              {/* 削除ボタン */}
              <button
                onClick={() => handleDeleteToken(index)}
                title="削除"
                style={{
                  padding: '4px',
                  borderRadius: '3px',
                  color: '#ef4444',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#475569',
              backgroundColor: '#f1f5f9',
              borderRadius: '6px',
            }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#2563eb',
              borderRadius: '6px',
            }}
          >
            保存する
          </button>
        </div>
      </div>
    </div>
  )
}
