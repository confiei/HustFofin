import { useState, useEffect } from "react"
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

  // Gerador dinâmico de flocos de neve realistas no background
  useEffect(() => {
    const snowContainer = document.getElementById("snow-container")
    if (!snowContainer) return

    snowContainer.innerHTML = ""
    const count = 55 // Quantidade de flocos para o efeito realista
    for (let i = 0; i < count; i++) {
      const flake = document.createElement("div")
      flake.className = "absolute rounded-full bg-white pointer-events-none animate-snow"
      
      const size = Math.random() * 3 + 1.5 // Tamanho entre 1.5px e 4.5px
      const left = Math.random() * 100 // Posição horizontal em %
      const duration = Math.random() * 6 + 4 // Velocidade de queda (4s a 10s)
      const delay = Math.random() * 5 // Atraso inicial aleatório
      const opacity = Math.random() * 0.7 + 0.3 // Opacidade variada

      flake.style.width = `${size}px`
      flake.style.height = `${size}px`
      flake.style.left = `${left}%`
      flake.style.top = `-10px`
      flake.style.opacity = `${opacity}`
      flake.style.animationDuration = `${duration}s`
      flake.style.animationDelay = `${delay}s`
      flake.style.boxShadow = `0 0 ${size * 2}px rgba(255, 255, 255, 0.8)`

      snowContainer.appendChild(flake)
    }
  }, [])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#09050b] overflow-hidden select-none" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
      {/* Estilos globais e animações customizadas para a neve e efeitos roxos */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) translateX(0px);
          }
          50% {
            transform: translateY(50vh) translateX(15px);
          }
          100% {
            transform: translateY(105vh) translateX(-15px);
          }
        }
        .animate-snow {
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 8s ease-in-out infinite;
        }
        .hover-card-effect {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-card-effect:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 20px 40px -15px rgba(168, 85, 247, 0.35);
          border-color: rgba(168, 85, 247, 0.4);
        }
      `}</style>

      {/* Container da neve caindo na tela toda */}
      <div id="snow-container" className="absolute inset-0 z-0 overflow-hidden pointer-events-none" />

      {/* Barra de controle da janela do Electron */}
      <div className="absolute top-0 left-0 right-0 z-50 flex h-10 items-center justify-end px-2" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {typeof window !== 'undefined' && (window as any).electronAPI && (
          <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button onClick={() => (window as any).electronAPI.window.minimize()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-purple-950/60 hover:text-purple-200">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/></svg>
            </button>
            <button onClick={() => (window as any).electronAPI.window.maximize()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-purple-950/60 hover:text-purple-200">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </button>
            <button onClick={() => (window as any).electronAPI.window.close()} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/80 hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Background dinâmico roxo com gradientes e animações suaves */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-600/30 shadow-lg shadow-purple-600/20 ring-4 ring-purple-500/20 backdrop-blur-md transition-transform duration-300 hover:scale-105 overflow-hidden p-0">
            <img 
              src="https://raw.githubusercontent.com/confiei/assets/main/49e6cc3e76ca0fd7cde13258ec92bf1f.gif" 
              alt="Icon" 
              className="h-full w-full object-cover" 
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-violet-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">HustFofin</h1>
          <p className="mt-2 text-sm text-purple-300/70 font-medium tracking-wide">Feito com 💜 por Mv</p>
        </div>

        {etapa === "inicio" && (
          <Card className="border-purple-500/20 bg-purple-950/40 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 hover-card-effect">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-purple-100">Bem-vindo!</CardTitle>
              <CardDescription className="text-purple-300/70">
                Nenhuma conta encontrada. Como deseja adicionar sua primeira conta?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleScan}
                className="w-full h-14 bg-purple-600 text-white hover:bg-purple-500 text-base shadow-lg shadow-purple-600/25 transition-all duration-300 hover:scale-[1.01]"
              >
                <ScanLine size={20} className="mr-3" />
                Buscar automaticamente
              </Button>
              <p className="text-xs text-center text-purple-300/60">
                Procura tokens no Discord instalado no seu PC
              </p>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-purple-500/20" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#120a17] px-3 text-purple-300/60 rounded-full">ou</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setEtapa("manual")}
                className="w-full h-12 border-purple-500/30 bg-purple-900/20 text-purple-100 hover:bg-purple-800/40 hover:border-purple-400 transition-all duration-300"
              >
                <KeyRound size={18} className="mr-3" />
                Adicionar manualmente
              </Button>
            </CardContent>
          </Card>
        )}

        {etapa === "scanning" && (
          <Card className="border-purple-500/20 bg-purple-950/40 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 hover-card-effect">
            <CardContent className="flex flex-col items-center py-16">
              <div className="relative mb-6">
                <Loader2 size={48} className="animate-spin text-purple-400" />
                <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />
              </div>
              <h3 className="text-lg font-semibold text-purple-100">Buscando tokens...</h3>
              <p className="mt-2 text-sm text-purple-300/70 text-center">
                Verificando Discord, Discord Canary, Discord PTB...
              </p>
            </CardContent>
          </Card>
        )}

        {etapa === "resultados" && (
          <Card className="border-purple-500/20 bg-purple-950/40 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 hover-card-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-100">
                <Search size={20} className="text-purple-400" />
                Tokens Encontradas
              </CardTitle>
              <CardDescription className="text-purple-300/70">
                {tokensEncontradas.length > 0
                  ? `${tokensEncontradas.length} conta(s) encontrada(s). Selecione quais deseja adicionar.`
                  : "Nenhuma token válida encontrada no sistema."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tokensEncontradas.length > 0 ? (
                <>
                  <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                    {tokensEncontradas.map((token, i) => (
                      <div
                        key={i}
                        onClick={() => toggleToken(i)}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                          token.selected
                            ? "border-purple-500/60 bg-purple-600/15 shadow-md shadow-purple-950"
                            : "border-purple-500/10 bg-purple-950/20 opacity-60 hover:opacity-80"
                        }`}
                      >
                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                          token.selected ? "bg-purple-600 border-purple-500" : "border-purple-500/30"
                        }`}>
                          {token.selected && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        {token.avatar ? (
                          <img
                            src={token.avatarUrl || `https://cdn.discordapp.com/avatars/${token.id}/${token.avatar}.png?size=32`}
                            alt=""
                            className="h-8 w-8 rounded-full ring-1 ring-purple-500/30"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                            <span className="text-xs font-bold text-purple-200">
                              {(token.username || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-purple-100 truncate">
                              {token.username || "Conta desconhecida"}
                            </p>
                            {token.badges && token.badges.length > 0 && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                {token.badges.map((badge) => (
                                  <Tooltip key={badge.name}>
                                    <TooltipTrigger asChild>
                                      <img src={badge.url} alt={badge.tooltip} className="h-4 w-4" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs bg-purple-900 border-purple-500/30 text-purple-100">{badge.tooltip}</TooltipContent>
                                  </Tooltip>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-purple-300/60 truncate">{token.source} • {token.token}</p>
                        </div>
                        <CheckCircle size={16} className={token.valid ? "text-emerald-400" : "text-rose-400"} />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleAddSelected}
                    disabled={salvando || !tokensEncontradas.some((t) => t.selected)}
                    className="w-full bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all duration-300"
                  >
                    {salvando ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Plus size={16} className="mr-2" />
                    )}
                    Adicionar {tokensEncontradas.filter((t) => t.selected).length} conta(s)
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <XCircle size={32} className="text-purple-400/40 mb-3" />
                  <p className="text-sm text-purple-300/70 mb-4 text-center">
                    Não foi possível encontrar tokens. Tente adicionar manualmente.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => setEtapa("manual")}
                className="w-full border-purple-500/30 bg-purple-900/20 text-purple-100 hover:bg-purple-800/40 hover:border-purple-400 transition-all duration-300"
              >
                <KeyRound size={16} className="mr-2" />
                Adicionar manualmente
              </Button>

              {tokensEncontradas.length === 0 && (
                <Button
                  variant="ghost"
                  onClick={handleScan}
                  className="w-full text-purple-300/70 hover:text-purple-100 hover:bg-purple-900/20"
                >
                  Tentar novamente
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {etapa === "manual" && (
          <Card className="border-purple-500/20 bg-purple-950/40 backdrop-blur-2xl shadow-2xl shadow-purple-950/50 hover-card-effect">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-100">
                <KeyRound size={20} className="text-purple-400" />
                Adicionar Token
              </CardTitle>
              <CardDescription className="text-purple-300/70">Insira o token da sua conta Discord</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">Nome da conta</label>
                <Input
                  placeholder="Ex: Minha conta principal"
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  className="border-purple-500/30 bg-purple-900/20 text-purple-100 placeholder:text-purple-400/40 focus-visible:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">Token</label>
                <Input
                  placeholder="Cole o token aqui"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="border-purple-500/30 bg-purple-900/20 text-purple-100 font-mono placeholder:text-purple-400/40 focus-visible:ring-purple-500"
                  type="password"
                />
              </div>
              <Button
                onClick={handleManualAdd}
                disabled={manualAdding || !manualLabel.trim() || !manualToken.trim()}
                className="w-full bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/25 transition-all duration-300"
              >
                {manualAdding ? (
                  <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                  <Plus size={16} className="mr-2" />
                )}
                Adicionar Conta
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEtapa("inicio")}
                className="w-full text-purple-300/70 hover:text-purple-100 hover:bg-purple-900/20"
              >
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}