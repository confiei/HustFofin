import { useState } from "react"
import { Palette, Check, Sparkles, ChevronRight, Paintbrush, X, ShieldAlert } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { TEMAS, type ThemeDefinition } from "@/lib/themes"
import { ColorPicker } from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"

const COLOR_PRESETS = [
  "#ffffff",
  "#00ff88",
  "#ff6b6b",
  "#4ecdc4",
  "#ffe66d",
  "#a855f7",
  "#3b82f6",
  "#f43f5e",
]

interface ThemePickerModalProps {
  tema: string
  corPainel: string
  onSelectTema: (temaId: string) => void
  onSelectCor: (cor: string) => void
}

function MiniPreview({ theme, cor }: { theme?: ThemeDefinition; cor?: string }) {
  const bg = theme?.cores.background ?? "#000"
  const fg = theme?.cores.foreground ?? "#e5e5e5"
  const primary = theme?.cores.primary ?? cor ?? "#fff"
  const sidebar = theme?.cores.sidebar ?? "#050505"
  const card = theme?.cores.card ?? "#0a0a0a"
  const border = theme?.cores.border ?? "#1a1a1a"
  const muted = theme?.cores.mutedForeground ?? "#737373"

  return (
    <div
      className="h-full w-full rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105"
      style={{ background: bg }}
    >
      {/* Sidebar */}
      <div className="flex h-full">
        <div className="w-[22%] h-full flex flex-col gap-1 p-1.5" style={{ background: sidebar, borderRight: `1px solid ${border}` }}>
          <div className="h-1.5 w-3/4 rounded-full" style={{ background: primary }} />
          <div className="h-1 w-full rounded-full opacity-40" style={{ background: muted }} />
          <div className="h-1 w-4/5 rounded-full opacity-30" style={{ background: muted }} />
          <div className="h-1 w-full rounded-full opacity-20" style={{ background: muted }} />
        </div>
        {/* Content */}
        <div className="flex-1 p-1.5 flex flex-col gap-1">
          <div className="h-1.5 w-1/3 rounded-full" style={{ background: fg, opacity: 0.8 }} />
          <div className="flex gap-1 flex-1 mt-0.5">
            <div className="flex-1 rounded" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="p-1">
                <div className="h-1 w-3/4 rounded-full mb-0.5" style={{ background: muted, opacity: 0.5 }} />
                <div className="h-2 w-full rounded" style={{ background: primary, opacity: 0.2 }} />
              </div>
            </div>
            <div className="flex-1 rounded" style={{ background: card, border: `1px solid ${border}` }}>
              <div className="p-1">
                <div className="h-1 w-1/2 rounded-full mb-0.5" style={{ background: muted, opacity: 0.5 }} />
                <div className="h-2 w-full rounded" style={{ background: primary, opacity: 0.15 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ThemePickerModal({
  tema,
  corPainel,
  onSelectTema,
  onSelectCor,
}: ThemePickerModalProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"todos" | "mais18">("todos")
  const [isAgeVerified, setIsAgeVerified] = useState(false)

  const activeTema = TEMAS.find((t) => t.id === tema)
  const currentLabel = tema === "custom" ? "Custom" : activeTema?.nome ?? "Padrão"
  const currentDesc = tema === "custom" ? "Sua cor personalizada" : activeTema?.descricao ?? "Tema escuro clássico"

  // Todos os temas aparecem na aba "todos", e apenas os restritos na aba "+18"
  const filteredTemas = TEMAS.filter((t) => {
    if (activeTab === "todos") return true
    if (activeTab === "mais18") return isAgeVerified && (t.id === "seloco" || t.id === "dang" || t.id === "bonita")
    return true
  })

  const handleTabChange = (tab: "todos" | "mais18") => {
    setActiveTab(tab)
  }

  return (
    <>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-4 rounded-xl border border-border bg-secondary/20 p-3 transition-all hover:border-primary/40 hover:bg-secondary/30"
      >
        {/* Mini preview */}
        <div className="h-14 w-24 shrink-0 rounded-lg border border-white/5 overflow-hidden shadow-lg shadow-black/20">
          {tema === "custom" ? (
            <div className="flex h-full w-full items-center justify-center" style={{ background: `linear-gradient(135deg, ${corPainel}15, ${corPainel}05)` }}>
              <div className="h-8 w-8 rounded-full shadow-lg" style={{ backgroundColor: corPainel, boxShadow: `0 0 20px ${corPainel}40` }} />
            </div>
          ) : (
            <MiniPreview theme={activeTema} />
          )}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-foreground">{currentLabel}</p>
          <p className="text-xs text-muted-foreground truncate">{currentDesc}</p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[680px] max-w-[90vw] h-[85vh] max-h-[85vh] p-0 [&>button]:hidden !grid !grid-rows-[auto_auto_1fr] overflow-hidden">
          <div className="shrink-0 p-6 pb-2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles size={14} className="text-primary" />
                </div>
                Escolha um tema
              </DialogTitle>
              <DialogDescription>
                Selecione um tema para personalizar a aparência do painel
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/40 text-muted-foreground transition-all duration-300 hover:bg-destructive/20 hover:text-destructive hover:scale-110 active:scale-95 focus:ring-2 focus:ring-destructive/40 focus:outline-hidden z-10"
            >
              <X size={16} className="transition-transform duration-300 hover:rotate-90" />
              <span className="sr-only">Fechar</span>
            </button>
          </div>

          {/* Apenas as abas Todos e +18 */}
          <div className="px-6 pb-2 border-b border-border/40 flex gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => handleTabChange("todos")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "todos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => handleTabChange("mais18")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === "mais18"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              +18
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
            {/* Aviso de +18 com Blur e botão em estilo danger (vermelho) */}
            {activeTab === "mais18" && !isAgeVerified && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-3 shadow-inner">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Conteúdo Restrito</h3>
                <p className="text-xs text-muted-foreground text-center max-w-[280px] mb-5">
                  Esta seção contém temas com configurações sensíveis ou restritas. Confirme sua idade para prosseguir.
                </p>
                <button
                  onClick={() => setIsAgeVerified(true)}
                  className="px-5 py-2.5 text-xs font-semibold text-destructive-foreground bg-destructive rounded-xl shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95"
                >
                  Eu tenho +18 anos!
                </button>
              </div>
            )}

            <div key={activeTab} className="grid grid-cols-2 gap-3 sm:grid-cols-3 pb-4 animate-in fade-in-50 zoom-in-95 duration-200">
              {/* Custom (Aparece na aba Todos) */}
              {activeTab === "todos" && (
                <button
                  onClick={() => onSelectTema("custom")}
                  className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 ${
                    tema === "custom"
                      ? "border-primary ring-1 ring-primary/30 shadow-lg shadow-primary/5 scale-[1.02]"
                      : "border-border"
                  }`}
                >
                  {tema === "custom" && (
                    <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-md">
                      <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                  {/* Preview area */}
                  <div className="relative h-20 w-full bg-gradient-to-br from-secondary/60 to-secondary/20 flex items-center justify-center overflow-hidden">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/40 transition-all duration-300 group-hover:scale-110"
                        style={tema === "custom" ? {
                          backgroundColor: corPainel,
                          borderStyle: "solid",
                          borderColor: "rgba(255,255,255,0.15)",
                          boxShadow: `0 0 24px ${corPainel}30`,
                        } : undefined}
                      />
                      <Paintbrush size={16} className="text-muted-foreground/60 transition-transform duration-300 group-hover:rotate-12" />
                    </div>
                  </div>
                  <div className="p-3 text-left bg-card/60 transition-colors group-hover:bg-card">
                    <p className="text-xs font-semibold text-foreground">Custom</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Escolha sua cor</p>
                  </div>
                </button>
              )}

              {/* Temas filtrados */}
              {filteredTemas.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTema(t.id)}
                  className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 ${
                    tema === t.id
                      ? "border-primary ring-1 ring-primary/30 shadow-lg shadow-primary/5 scale-[1.02]"
                      : "border-border"
                  }`}
                >
                  {tema === t.id && (
                    <div className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-md">
                      <Check size={10} className="text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                  {/* Mini preview do tema */}
                  <div className="relative h-20 w-full overflow-hidden">
                    <MiniPreview theme={t} />
                  </div>
                  <div className="p-3 text-left bg-card/60 border-t border-border/50 transition-colors group-hover:bg-card">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{t.nome}</p>
                      <div className="flex gap-1 ml-auto">
                        {t.previewColors.map((c, i) => (
                          <div
                            key={i}
                            className="h-3 w-3 rounded-full border border-white/10 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{t.descricao}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Color picker quando Custom está selecionado */}
            {activeTab === "todos" && tema === "custom" && (
              <div className="rounded-xl border border-border bg-secondary/10 p-4 mt-4 animate-in fade-in-50 duration-200">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 block">
                  Cor do Painel
                </label>
                <div className="flex items-start gap-6">
                  <ColorPicker
                    value={corPainel}
                    onChange={onSelectCor}
                    onChangeEnd={onSelectCor}
                  />
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Hex
                      </label>
                      <Input
                        value={corPainel}
                        onChange={(e) => onSelectCor(e.target.value)}
                        className="max-w-[120px] border-border bg-secondary/40 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 block">
                        Presets
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color}
                            onClick={() => onSelectCor(color)}
                            className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 ${
                              corPainel === color
                                ? "border-primary ring-2 ring-primary/30 scale-110"
                                : "border-border"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}