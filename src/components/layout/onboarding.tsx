"use client";

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, Plus, CheckCircle, XCircle, KeyRound, ScanLine } from "lucide-react"
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
  const [etapa, setEtapa] = useState<"inicio" | "scanning" | "resultados" | "manual">("inicio")
  const [tokensEncontradas, setTokensEncontradas] = useState<ScannedToken[]>([])
  const [salvando, setSalvando] = useState(false)
  const [manualLabel, setManualLabel] = useState("")
  const [manualToken, setManualToken] = useState("")
  const [manualAdding, setManualAdding] = useState(false)

  // Referência para o card 3D
  const cardRef = useRef<HTMLDivElement>(null)
  const rafId = useRef<number | null>(null)
  
  // Variáveis para interpolação suave (lerp) sem re-renderizar o componente React a cada frame
  const mousePos = useRef({ x: 0, y: 0, active: false })
  const currentStyle = useRef({ rx: 0, ry: 0, scale: 1 })

  useEffect(() => {
    // Loop de animação contínuo do card 3D
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000] overflow-hidden select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap');

        @keyframes floatModern {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        .animate-float-modern {
          animation: floatModern 4s ease-in-out infinite;
        }
        @keyframes titleShimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .font-hustrich {
          font-family: 'Cinzel Decorative', cursive, serif;
          background: linear-gradient(270deg, #9ca3af, #d1d5db, #6b7280, #f3f4f6);
          background-size: 300% 300%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: titleShimmer 6s ease infinite;
        }
      `}</style>

      {/* Barra de controle da janela do Electron */}
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

      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900/50 shadow-xl shadow-black/50 ring-4 ring-neutral-800/30 backdrop-blur-xl overflow-hidden p-0 animate-float-modern" style={{ transform: 'none' }}>
            <img 
              src="https://raw.githubusercontent.com/confiei/assets/main/c70e1868e30c04fbdf9d63a1d49226bc.jpg" 
              alt="Icon" 
              className="h-full w-full object-cover" 
            />
          </div>
          <h1 className="text-3xl font-bold font-hustrich tracking-wider drop-shadow-[0_0_20px_rgba(156,163,175,0.4)]">HustRich</h1>
          <p className="mt-2 text-sm text-neutral-400 font-medium tracking-wide">Feito com 💖 por Mv</p>
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
            <Card className="border-neutral-800 bg-black backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden">
              <CardHeader className="text-center relative z-20" style={{ transform: 'translateZ(35px)' }}>
                <CardTitle className="text-xl text-neutral-100">Bem-vindo!</CardTitle>
                <CardDescription className="text-neutral-400">
                  Nenhuma conta encontrada. Como deseja adicionar sua primeira conta?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 relative z-20" style={{ transform: 'translateZ(20px)' }}>
                <div style={{ transform: 'translateZ(25px)' }}>
                  <Button
                    onClick={handleScan}
                    className="w-full h-14 bg-gradient-to-r from-neutral-800 to-neutral-900 text-neutral-100 hover:from-neutral-700 hover:to-neutral-800 text-base shadow-lg shadow-black/50 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-neutral-700/40"
                  >
                    <ScanLine size={20} className="mr-3 transition-transform duration-300 group-hover:rotate-12 text-neutral-300" />
                    Buscar automaticamente
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
                    <span className="bg-black px-3 text-neutral-400 rounded-full">ou</span>
                  </div>
                </div>
                <div style={{ transform: 'translateZ(25px)' }}>
                  <Button
                    variant="outline"
                    onClick={() => setEtapa("manual")}
                    className="w-full h-12 border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <KeyRound size={18} className="mr-3 text-neutral-400" />
                    Adicionar manualmente
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
            <Card className="border-neutral-800 bg-black backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden">
              <CardContent className="flex flex-col items-center py-16 relative z-20" style={{ transform: 'translateZ(30px)' }}>
                <div className="relative mb-6">
                  <Loader2 size={48} className="animate-spin text-neutral-300" />
                  <div className="absolute inset-0 animate-ping rounded-full bg-neutral-800/20" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-100">Buscando tokens...</h3>
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
            <Card className="border-neutral-800 bg-black backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden">
              <CardHeader className="relative z-20" style={{ transform: 'translateZ(35px)' }}>
                <CardTitle className="flex items-center gap-2 text-neutral-100">
                  <Search size={20} className="text-neutral-400" />
                  Tokens Encontradas
                </CardTitle>
                <CardDescription className="text-neutral-400">
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
                              ? "border-neutral-700 bg-neutral-900 shadow-md shadow-black"
                              : "border-neutral-900 bg-neutral-950 opacity-60 hover:opacity-90"
                          }`}
                        >
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                            token.selected ? "bg-neutral-800 border-neutral-600 shadow-sm shadow-black" : "border-neutral-800"
                          }`}>
                            {token.selected && <span className="text-white text-xs font-bold">✓</span>}
                          </div>
                          {token.avatar ? (
                            <img
                              src={token.avatarUrl || `https://cdn.discordapp.com/avatars/${token.id}/${token.avatar}.png?size=32`}
                              alt=""
                              className="h-8 w-8 rounded-full ring-1 ring-neutral-800"
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
                          <CheckCircle size={16} className={token.valid ? "text-emerald-400" : "text-neutral-600"} />
                        </div>
                      ))}
                    </div>

                    <div style={{ transform: 'translateZ(30px)' }}>
                      <Button
                        onClick={handleAddSelected}
                        disabled={salvando || !tokensEncontradas.some((t) => t.selected)}
                        className="w-full bg-gradient-to-r from-neutral-800 to-neutral-900 text-neutral-100 hover:from-neutral-700 hover:to-neutral-800 shadow-lg shadow-black/50 transition-all duration-300 hover:scale-[1.01] border border-neutral-700/40"
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
                    className="w-full border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-900 hover:border-neutral-700 transition-all duration-300 hover:scale-[1.01]"
                  >
                    <KeyRound size={16} className="mr-2 text-neutral-400" />
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
            <Card className="border-neutral-800 bg-black backdrop-blur-2xl shadow-2xl shadow-black relative overflow-hidden">
              <CardHeader className="relative z-20" style={{ transform: 'translateZ(35px)' }}>
                <CardTitle className="flex items-center gap-2 text-neutral-100">
                  <KeyRound size={20} className="text-neutral-400" />
                  Adicionar Token
                </CardTitle>
                <CardDescription className="text-neutral-400">Insira o token da sua conta Discord</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-20" style={{ transform: 'translateZ(25px)' }}>
                <div className="space-y-2" style={{ transform: 'translateZ(20px)' }}>
                  <label className="text-sm font-medium text-neutral-200">Nome da conta</label>
                  <Input
                    placeholder="Ex: Minha conta principal"
                    value={manualLabel}
                    onChange={(e) => setManualLabel(e.target.value)}
                    className="border-neutral-800 bg-neutral-950 text-neutral-100 placeholder:text-neutral-600 focus-visible:ring-neutral-700 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2" style={{ transform: 'translateZ(20px)' }}>
                  <label className="text-sm font-medium text-neutral-200">Token</label>
                  <Input
                    placeholder="Cole o token aqui"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="border-neutral-800 bg-neutral-950 text-neutral-100 font-mono placeholder:text-neutral-600 focus-visible:ring-neutral-700 transition-all duration-200"
                    type="password"
                  />
                </div>
                <div style={{ transform: 'translateZ(30px)' }}>
                  <Button
                    onClick={handleManualAdd}
                    disabled={manualAdding || !manualLabel.trim() || !manualToken.trim()}
                    className="w-full bg-gradient-to-r from-neutral-800 to-neutral-900 text-neutral-100 hover:from-neutral-700 hover:to-neutral-800 shadow-lg shadow-black/50 transition-all duration-300 hover:scale-[1.01] border border-neutral-700/40"
                  >
                    {manualAdding ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Plus size={16} className="mr-2" />
                    )}
                    Adicionar Conta
                  </Button>
                </div>
                <div style={{ transform: 'translateZ(15px)' }}>
                  <Button
                    variant="ghost"
                    onClick={() => setEtapa("inicio")}
                    className="w-full text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-all duration-200"
                  >
                    Voltar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}