'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'android' | 'ios' | 'other' | null

export function InstallPwaButton() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)

  useEffect(() => {
    // Already running as installed PWA — hide button
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    const isAndroid = /android/i.test(ua)
    setPlatform(isIos ? 'ios' : isAndroid ? 'android' : 'other')

    // Android: capture the install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Don't render if already installed or not a relevant platform
  if (installed || platform === 'other' || platform === null) return null

  async function handleClick() {
    if (platform === 'ios') {
      setShowIosModal(true)
      return
    }
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
    }
  }

  const gold = '#c9a050'

  return (
    <>
      {/* Install button */}
      <button
        onClick={handleClick}
        style={{
          width: '100%', background: `${gold}12`, border: `1px solid ${gold}44`,
          borderRadius: 10, padding: '13px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', textAlign: 'left', marginBottom: 12,
        }}
      >
        <span className="material-icons-outlined" style={{ fontSize: 22, color: gold, flexShrink: 0 }}>
          install_mobile
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: gold }}>Instalar como app</div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
            {platform === 'ios'
              ? 'Adicionar à tela de início do iPhone'
              : 'Instalar no Android com um toque'}
          </div>
        </div>
        <span className="material-icons-outlined" style={{ fontSize: 18, color: gold, flexShrink: 0 }}>
          chevron_right
        </span>
      </button>

      {/* iOS instruction modal */}
      {showIosModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 16px 32px',
          }}
          onClick={() => setShowIosModal(false)}
        >
          <div
            style={{
              background: '#1a1a1a', border: `1px solid ${gold}`,
              borderRadius: 16, padding: '24px 24px 28px', width: '100%', maxWidth: 440,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: gold, letterSpacing: 1 }}>
                INSTALAR NO IPHONE
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }}
              >
                <span className="material-icons-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Steps */}
            {[
              {
                icon: 'ios_share',
                text: 'Toque no botão de compartilhar',
                sub: 'Ícone de caixa com seta, na barra inferior do Safari',
              },
              {
                icon: 'add_box',
                text: 'Toque em "Adicionar à Tela de Início"',
                sub: 'Role a lista de opções para baixo até encontrar',
              },
              {
                icon: 'check_circle',
                text: 'Toque em "Adicionar" no canto superior direito',
                sub: 'O app aparecerá na sua tela de início',
              },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: i < 2 ? 18 : 0, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `${gold}20`, border: `1px solid ${gold}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span className="material-icons-outlined" style={{ fontSize: 18, color: gold }}>{step.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e8e8e8', marginBottom: 3 }}>{step.text}</div>
                  <div style={{ fontSize: 11, color: '#666', lineHeight: 1.4 }}>{step.sub}</div>
                </div>
              </div>
            ))}

            {/* Divider + note */}
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid #2a2a2a', textAlign: 'center' }}>
              <span style={{ fontSize: 10, color: '#555' }}>
                Funciona somente no Safari — se estiver em outro navegador, abra no Safari primeiro
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
