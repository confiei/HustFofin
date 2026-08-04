"use client";

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Plus, CheckCircle, XCircle, KeyRound, ScanLine, Sparkles, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { api } from "@/lib/api-client"
import type { Badge } from "@/types/discord"

interface ScannedToken {
  token: string
  fullToken?: string
  source: string
  username?: string
  id?: string
  avatar?: string
  avatarUrl?: string | null
  badges?: Badge[]
  valid: boolean
  selected: boolean
}

interface OnboardingProps {
  onComplete: () => void
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [isLoadingIntro, setIsLoadingIntro] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [etapa, setEtapa] = useState<"inicio" | "scanning" | "resultados" | "manual">("inicio")
  const [tokensEncontradas, setTokensEncontradas] = useState<ScannedToken[]>([])
  const [salvando, setSalvando] = useState(false)
  const [manualLabel, setManualLabel] = useState("")
  const [manualToken, setManualToken] = useState("")
  const [manualAdding, setManualAdding] = useState(false)

  // Tempo restante em segundos para o carregamento (ajustado para ser mais rápido: 2.5 segundos)[cite: 13, 15]
  const [timeLeft, setTimeLeft] = useState(2.5)

  // Rotação de textos restrita aos dois solicitados[cite: 13, 15]
  const rotationTexts = ["Christian © 2026", "Não tente copiar"]
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [fadeText, setFadeText] = useState(true)

  // Referência para o card 3D[cite: 13, 15]
  const cardRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)
  
  // Variáveis para interpolação suave (lerp) sem re-renderizar o componente React a cada frame[cite: 13, 15]
  const mousePos = useRef({ x: 0, y: 0, active: false })
  const currentStyle = useRef({ rx: 0, ry: 0, scale: 1 })

  // Efeito para contagem regressiva em tempo real e rotação dos textos[cite: 13, 15]
  useEffect(() => {
    if (!isLoadingIntro) return

    const startTime = Date.now()
    const totalDuration = 2500 // Duração total reduzida para 2.5 segundos para acelerar o carregamento

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, (totalDuration - elapsed) / 1000)
      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 50)

    // Troca de textos rotativos a cada 1.2 segundos para acompanhar a velocidade[cite: 13, 15]
    const textInterval = setInterval(() => {
      setFadeText(false)
      setTimeout(() => {
        setCurrentTextIndex((prev) => (prev + 1) % rotationTexts.length)
        setFadeText(true)
      }, 200)
    }, 1200)

    return () => {
      clearInterval(interval)
      clearInterval(textInterval)
    }
  }, [isLoadingIntro])

  useEffect(() => {
    // Duração total da tela de carregamento antes do fade out (2.5 segundos)[cite: 13, 15]
    const timer = setTimeout(() => {
      setIsFadingOut(true)
      const fadeTimer = setTimeout(() => {
        setIsLoadingIntro(false)
      }, 500) // tempo correspondente à animação de fade out reduzido[cite: 13, 15]
      return () => clearTimeout(fadeTimer)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Loop de animação contínuo do card 3D[cite: 13, 15]
    const updateMotion = () => {
      const card = cardRef.current
      if (card) {
        const target = mousePos.current
        const curr = currentStyle.current

        const ease = 0.12
        curr.rx += (target.y - curr.rx) * ease
        curr.ry += (target.x - curr.ry) * ease

        const targetScale = target.active ? 1.015 : 1 
        curr.scale += (targetScale - curr.scale) * 0.1

        card.style.transform = `perspective(1000px) rotateX(${curr.rx.toFixed(2)}deg) rotateY(${curr.ry.toFixed(2)}deg) scale3d(${curr.scale.toFixed(4)}, ${curr.scale.toFixed(4)}, 1)`
      }
      rafId.current = requestAnimationFrame(updateMotion)
    }

    rafId.current = requestAnimationFrame(updateMotion)
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = null
      }
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    const mouseX = (e.clientX - rect.left) / width - 0.5
    const mouseY = (e.clientY - rect.top) / height - 0.5
    
    mousePos.current = {
      x: mouseX * 8,
      y: -mouseY * 8,
      active: true,
    }
  }

  const handleMouseEnter = () => {
    mousePos.current.active = true
  }

  const handleMouseLeave = () => {
    mousePos.current = {
      x: 0,
      y: 0,
      active: false,
    }
  }

  const handleScan = async () => {
    setEtapa("scanning")
    try {
      const res = await api.scanTokens()
      const rawResponse = res as any
      const data = (rawResponse.data || []) as Array<ScannedToken>
      const internalTokens = (rawResponse._internal || []) as Array<{ token: string; source: string }>
      
      const tokens = data.map((t, i) => ({
        ...t,
        fullToken: internalTokens[i]?.token || t.token,
        selected: true,
      }))
      setTokensEncontradas(tokens)
      setEtapa("resultados")
    } catch {
      setTokensEncontradas([])
      setEtapa("resultados")
    }
  }

  const toggleToken = (index: number) => {
    setTokensEncontradas((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    )
  }

  const handleAddSelected = async () => {
    const selected = tokensEncontradas.filter((t) => t.selected)
    if (selected.length === 0) return

    setSalvando(true)
    try {
      await api.addScannedTokens(
        selected.map((t) => ({
          token: t.fullToken || t.token,
          username: t.username,
        }))
      )
      onComplete()
    } catch {
    } finally {
      setSalvando(false)
    }
  }

  const handleManualAdd = async () => {
    if (!manualLabel.trim() || !manualToken.trim()) return
    setManualAdding(true)
    try {
      await api.addToken(manualLabel.trim(), manualToken.trim())
      setManualLabel("")
      setManualToken("")
      onComplete()
    } catch {} finally {
      setManualAdding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent overflow-hidden select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');

        @keyframes floatModern {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .animate-float-modern {
          animation: floatModern 4s ease-in-out infinite;
        }

        @keyframes modernPulseOrb {
          0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          70% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
          100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .animate-modern-orb {
          animation: modernPulseOrb 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes titleShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .font-hustrich {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 800;
          letter-spacing: -0.025em;
          background: linear-gradient(270deg, #9ca3af, #d1d5db, #6b7280, #f3f4f6);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleShimmer 6s ease infinite;
        }
        @keyframes fadeInOutCustom {
          0% { opacity: 0; transform: scale(0.95); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
        .animate-fade-in-out-custom {
          animation: fadeInOutCustom 2.5s ease-in-out forwards;
        }
        .fade-out-active {
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        }
        .fade-in-active {
          animation: fadeInApp 0.5s ease-in-out forwards;
        }
        @keyframes fadeInApp {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes nebulaDrift1 {
          0% { transform: translate(-20%, -20%) scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: translate(15%, 20%) scale(1.25) rotate(180deg); opacity: 0.9; }
          100% { transform: translate(-20%, -20%) scale(1) rotate(360deg); opacity: 0.6; }
        }
        @keyframes nebulaDrift2 {
          0% { transform: translate(20%, 10%) scale(1.1) rotate(0deg); opacity: 0.5; }
          50% { transform: translate(-15%, -15%) scale(0.9) rotate(-180deg); opacity: 0.8; }
          100% { transform: translate(20%, 10%) scale(1.1) rotate(-360deg); opacity: 0.5; }
        }
        @keyframes corePulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.4; filter: blur(40px); }
          50% { transform: scale(1.25); opacity: 0.75; filter: blur(55px); }
        }
        .nebula-orb-1 {
          animation: nebulaDrift1 10s ease-in-out infinite alternate;
        }
        .nebula-orb-2 {
          animation: nebulaDrift2 14s ease-in-out infinite alternate;
        }
        .nebula-core {
          animation: corePulseGlow 5s ease-in-out infinite;
        }

        @keyframes borderGlowPulse {
          0%, 100% { border-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 15px rgba(59, 130, 246, 0.1); }
          50% { border-color: rgba(59, 130, 246, 0.6); box-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
        }
        .animate-border-glow {
          animation: borderGlowPulse 4s ease-in-out infinite;
        }
        
        @keyframes shimmerBg {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-effect {
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmerBg 3s infinite;
        }
      `}</style>

      {/* Barra de controle da janela do Electron[cite: 13, 15] */}
      <div className="absolute top-0 left-0 right-0 z-50 flex h-10 items-center justify-end px-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {typeof window !== 'undefined' && (window as any).electronAPI && (
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button onClick={() => (window as any).electronAPI.window.minimize()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-neutral-900 hover:text-neutral-200 hover:scale-105">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
            </button>
            <button onClick={() => (window as any).electronAPI.window.maximize()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-neutral-900 hover:text-neutral-200 hover:scale-105">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </button>
            <button onClick={() => (window as any).electronAPI.window.close()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-all duration-200 hover:bg-neutral-900 hover:text-white hover:scale-105">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
      </div>

      {isLoadingIntro ? (
        <div className={`relative z-25 flex items-center justify-center w-full h-full bg-transparent animate-fade-in-out-custom ${isFadingOut ? 'fade-out-active' : ''}`}>
          {/* Quadrado grande w-56 h-56 contendo o GIF[cite: 13, 15] */}
          <div className="relative flex items-center justify-center w-56 h-56 rounded-3xl bg-transparent border border-blue-500/20 shadow-[0_0_40px_rgba(0,149,255,0.15)] overflow-hidden">
            
            {/* Texto superior esquerdo[cite: 13, 15] */}
            <div className="absolute top-3 left-4 z-20 text-[11px] font-semibold text-blue-200/90 tracking-wide drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
              Feito por Mv
            </div>

            {/* Texto inferior direito rotativo[cite: 13, 15] */}
            <div className="absolute bottom-3 right-4 z-20 text-[11px] font-semibold text-blue-200/90 tracking-wide drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
              <span className={`transition-opacity duration-300 ${fadeText ? 'opacity-100' : 'opacity-0'}`}>
                {rotationTexts[currentTextIndex]}
              </span>
            </div>

            {/* Animação de Nebulosa e Glow Azul Moderno[cite: 13, 15] */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none rounded-3xl">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-blue-500/30 rounded-full nebula-core pointer-events-none" />
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-600/40 to-cyan-400/30 rounded-full blur-xl nebula-orb-1 pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-tr from-indigo-600/30 to-blue-400/40 rounded-full blur-xl nebula-orb-2 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-blue-950/10 to-transparent pointer-events-none" />
            </div>

            {/* Conteúdo interno perfeitamente centralizado com o GIF[cite: 13, 15] */}
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
              <div className="w-16 h-16 mb-2 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-400/40 shadow-xl shadow-blue-950/80 backdrop-blur-md pointer-events-auto overflow-hidden">
                <img 
                  src="https://raw.githubusercontent.com/confiei/assets/main/10.gif" 
                  alt="Loading GIF" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h2 className="text-base font-bold font-hustrich tracking-wider text-blue-100 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">HustRich</h2>
              
              {/* Timer e texto "carregando" */}
              <div className="w-36 mt-2 flex flex-col items-center gap-0.5 pointer-events-auto">
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-200/90 font-semibold drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]">
                  <span>carregando</span>
                  <span>•</span>
                  <span>{timeLeft.toFixed(1)}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 w-full max-w-lg px-6 fade-in-active">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900/50 shadow-xl shadow-black/50 ring-4 ring-neutral-800/30 backdrop-blur-xl overflow-hidden p-0 animate-float-modern" style={{ transform: 'none' }}>
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 overflow-hidden">
                <img 
                  src="https://raw.githubusercontent.com/confiei/assets/main/10.gif" 
                  alt="Logo GIF" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold font-hustrich tracking-wider drop-shadow-[0_0_20px_rgba(156,163,175,0.4)]">HustRich</h1>
            <p className="mt-2 text-sm text-neutral-400 font-medium tracking-wide">Feito com 💙 por Mv | NewEra</p>
          </div>

          {etapa === "inicio" && (
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-2xl overflow-hidden will-change-transform"
              style={{ transformStyle: 'preserve-3d', transition: 'box-shadow 0.3s ease' }}
            >
              <Card className="border-neutral-800 bg-neutral-950/80 backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden animate-border-glow">
                <div className="absolute inset-0 pointer-events-none shimmer-effect opacity-30" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="text-center relative z-20 flex flex-col items-center justify-center w-full" style={{ transform: 'translateZ(35px)' }}>
                  <div className="flex items-center justify-center gap-2 w-full text-center">
                    <img 
                      src="https://raw.githubusercontent.com/confiei/assets/main/blue_fofincr.gif" 
                      alt="Ícone" 
                      className="w-5 h-5 object-contain animate-pulse shrink-0" 
                    />
                    <CardTitle className="text-xl text-neutral-100 m-0 leading-none text-center">Bem Vindo(a)!</CardTitle>
                  </div>
                  <CardDescription className="text-neutral-400 mt-2 text-center w-full">
                    Nenhuma conta encontrada. Como deseja adicionar sua primeira conta?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-20" style={{ transform: 'translateZ(20px)' }}>
                  <div style={{ transform: 'translateZ(25px)' }}>
                    <Button
                      onClick={handleScan}
                      className="w-full h-14 bg-gradient-to-r from-neutral-800 via-neutral-900 to-neutral-800 text-neutral-100 hover:from-neutral-700 hover:to-neutral-800 text-base shadow-lg shadow-black/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-neutral-700/40 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <ScanLine size={20} className="mr-3 text-blue-400 shrink-0" />
                      <span className="relative z-10">Buscar automaticamente</span>
                    </Button>
                  </div>
                  <p className="text-xs text-center text-neutral-400" style={{ transform: 'translateZ(15px)' }}>
                    Procura tokens no Discord instalado no seu PC
                  </p>
                  <div className="relative my-4" style={{ transform: 'translateZ(10px)' }}>
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-neutral-800" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-neutral-950 px-3 text-neutral-400 rounded-full">ou</span>
                    </div>
                  </div>
                  <div style={{ transform: 'translateZ(25px)' }}>
                    <Button
                      variant="outline"
                      onClick={() => setEtapa("manual")}
                      className="w-full h-12 border-neutral-800 bg-neutral-900/50 text-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-700 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <KeyRound size={18} className="mr-3 text-cyan-400 transition-transform duration-300 group-hover:-rotate-12 shrink-0" />
                      <span className="relative z-10">Adicionar manualmente</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {etapa === "scanning" && (
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-2xl overflow-hidden will-change-transform"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card className="border-neutral-800 bg-neutral-950/80 backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden animate-border-glow">
                <div className="absolute inset-0 pointer-events-none shimmer-effect opacity-30" />
                <CardContent className="flex flex-col items-center py-16 relative z-20" style={{ transform: 'translateZ(30px)' }}>
                  <div className="relative mb-6">
                    <Loader2 size={48} className="animate-spin text-blue-400" />
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-100 animate-pulse">Buscando tokens...</h3>
                  <p className="mt-2 text-sm text-neutral-400 text-center">
                    Verificando Discord, Discord Canary, Discord PTB...
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {etapa === "resultados" && (
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-2xl overflow-hidden will-change-transform"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card className="border-neutral-800 bg-neutral-950/80 backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden animate-border-glow">
                <div className="absolute top-4 left-4 z-30" style={{ transform: 'translateZ(40px)' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEtapa("inicio")}
                    className="h-8 px-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80 transition-all duration-200 gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Voltar</span>
                  </Button>
                </div>
                <div className="absolute inset-0 pointer-events-none shimmer-effect opacity-30" />
                <CardHeader className="relative z-20 pt-12 text-center flex flex-col items-center justify-center" style={{ transform: 'translateZ(35px)' }}>
                  <CardTitle className="flex items-center justify-center gap-2 text-neutral-100">
                    <Search size={20} className="text-blue-400 animate-pulse" />
                    Tokens Encontradas
                  </CardTitle>
                  <CardDescription className="text-neutral-400 text-center">
                    {tokensEncontradas.length > 0
                      ? `${tokensEncontradas.length} conta(s) encontrada(s). Selecione quais deseja adicionar.`
                      : "Nenhuma token válida encontrada no sistema."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 relative z-20" style={{ transform: 'translateZ(25px)' }}>
                  {tokensEncontradas.length > 0 ? (
                    <>
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1" style={{ transform: 'translateZ(20px)' }}>
                        {tokensEncontradas.map((token, i) => (
                          <div
                            key={i}
                            onClick={() => toggleToken(i)}
                            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                              token.selected
                                ? "border-blue-500/50 bg-neutral-900/90 shadow-lg shadow-blue-500/10"
                                : "border-neutral-900 bg-neutral-950 opacity-60 hover:opacity-90"
                            }`}
                          >
                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                              token.selected ? "bg-blue-600 border-blue-400 shadow-sm shadow-blue-500/50" : "border-neutral-800"
                            }`}>
                              {token.selected && <span className="text-white text-xs font-bold">✓</span>}
                            </div>
                            {token.avatar ? (
                              <img
                                src={token.avatarUrl || `https://cdn.discordapp.com/avatars/${token.id}/${token.avatar}.png?size=32`}
                                alt=""
                                className="h-8 w-8 rounded-full ring-1 ring-blue-500/30"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-neutral-900 flex items-center justify-center ring-1 ring-neutral-800">
                                <span className="text-xs font-bold text-neutral-200">
                                  {(token.username || "?")[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-neutral-100 truncate">
                                  {token.username || "Conta desconhecida"}
                                </p>
                                {token.badges && token.badges.length > 0 && (
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    {token.badges.map((badge) => (
                                      <Tooltip key={badge.name}>
                                        <TooltipTrigger asChild>
                                          <img src={badge.url} alt={badge.tooltip} className="h-4 w-4" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs bg-neutral-900 border-neutral-800 text-neutral-100">{badge.tooltip}</TooltipContent>
                                      </Tooltip>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400 truncate">{token.source} • {token.token}</p>
                            </div>
                            <CheckCircle size={16} className={token.valid ? "text-emerald-400 animate-pulse" : "text-neutral-600"} />
                          </div>
                        ))}
                      </div>

                      <div style={{ transform: 'translateZ(30px)' }}>
                        <Button
                          onClick={handleAddSelected}
                          disabled={salvando || !tokensEncontradas.some((t) => t.selected)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-blue-400/30"
                        >
                          {salvando ? (
                            <Loader2 size={16} className="animate-spin mr-2" />
                          ) : (
                            <Plus size={16} className="mr-2" />
                          )}
                          Adicionar {tokensEncontradas.filter((t) => t.selected).length} conta(s)
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center py-4" style={{ transform: 'translateZ(20px)' }}>
                      <XCircle size={32} className="text-neutral-600 mb-3" />
                      <p className="text-sm text-neutral-400 mb-4 text-center">
                        Não foi possível encontrar tokens. Tente adicionar manualmente.
                      </p>
                    </div>
                  )}

                  <div style={{ transform: 'translateZ(25px)' }}>
                    <Button
                      variant="outline"
                      onClick={() => setEtapa("manual")}
                      className="w-full border-neutral-800 bg-neutral-900/50 text-neutral-200 hover:bg-neutral-900 hover:text-white hover:border-neutral-700 transition-all duration-300 hover:scale-[1.02]"
                    >
                      <KeyRound size={16} className="mr-2 text-cyan-400 shrink-0" />
                      Adicionar manualmente
                    </Button>
                  </div>

                  {tokensEncontradas.length === 0 && (
                    <div style={{ transform: 'translateZ(15px)' }}>
                      <Button
                        variant="ghost"
                        onClick={handleScan}
                        className="w-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-all duration-200"
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {etapa === "manual" && (
            <div 
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="relative rounded-2xl overflow-hidden will-change-transform"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card className="border-neutral-800 bg-neutral-950/80 backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden animate-border-glow">
                <div className="absolute top-4 left-4 z-30" style={{ transform: 'translateZ(40px)' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEtapa("inicio")}
                    className="h-8 px-2 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/80 transition-all duration-200 gap-1.5"
                  >
                    <ArrowLeft size={16} />
                    <span>Voltar</span>
                  </Button>
                </div>
                <div className="absolute inset-0 pointer-events-none shimmer-effect opacity-30" />
                <CardHeader className="relative z-20 pt-12 text-center flex flex-col items-center justify-center" style={{ transform: 'translateZ(35px)' }}>
                  <CardTitle className="flex items-center justify-center gap-2 text-neutral-100">
                    <KeyRound size={20} className="text-cyan-400 animate-pulse" />
                    Adicionar Token
                  </CardTitle>
                  <CardDescription className="text-neutral-400 text-center">Insira o token da sua conta Discord</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-20" style={{ transform: 'translateZ(25px)' }}>
                  <div className="space-y-2 transition-all duration-300 hover:scale-[1.01]" style={{ transform: 'translateZ(20px)' }}>
                    <label className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Nome da conta
                    </label>
                    <Input
                      placeholder="Ex: Minha conta principal"
                      value={manualLabel}
                      onChange={(e) => setManualLabel(e.target.value)}
                      className="border-neutral-800 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-blue-500/50 focus-visible:border-blue-500 transition-all duration-300 shadow-inner"
                    />
                  </div>
                  <div className="space-y-2 transition-all duration-300 hover:scale-[1.01]" style={{ transform: 'translateZ(20px)' }}>
                    <label className="text-sm font-medium text-neutral-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span> Token
                    </label>
                    <Input
                      placeholder="Cole o token aqui"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="border-neutral-800 bg-neutral-950 text-neutral-100 font-mono placeholder:text-neutral-600 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500 transition-all duration-300 shadow-inner"
                      type="password"
                    />
                  </div>
                  <div style={{ transform: 'translateZ(30px)' }}>
                    <Button
                      onClick={handleManualAdd}
                      disabled={manualAdding || !manualLabel.trim() || !manualToken.trim()}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-blue-400/30 group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {manualAdding ? (
                        <Loader2 size={16} className="animate-spin mr-2" />
                      ) : (
                        <Plus size={16} className="mr-2 transition-transform duration-300 group-hover:rotate-90 shrink-0" />
                      )}
                      <span className="relative z-10">Adicionar Conta</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  )
}