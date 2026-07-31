import { useState } from "react"
import { Info, X, Clock, ChevronDown, Calendar, Mail } from "lucide-react"

export default function PaginaAnalytics() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  const items = [
    {
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M5.04 0L0 18.96 18.96 24 24 5.04 5.04 0zM9.6 7.68l6.72 1.68-1.68 6.72-6.72-1.68L9.6 7.68z" />
        </svg>
      ),
      title: "Roblox Sniper",
      desc: "Usernames raros",
      extra: "Tente resgatar um nome de usuário raro e disponível no Roblox de forma automatizada."
    },
    {
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.011c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
      title: "Discord Sniper",
      desc: "Ogu",
      extra: "Ferramenta para monitorar e garantir nomes de usuário no Discord rapidamente."
    },
    {
      icon: <Mail size={14} />,
      title: "Temp Email",
      desc: "Emails temporários",
      extra: "Gere um endereço de e-mail temporário para receber códigos de verificação e cadastros rápidos com total privacidade."
    }
  ]

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-transparent">
      <style>{`
        @keyframes softPulseIcon {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.18);
          }
        }
        .animate-soft-pulse-icon {
          animation: softPulseIcon 2s ease-in-out infinite;
        }
      `}</style>

      <div className="absolute inset-0 flex items-center justify-center p-6">
        {/* Card Modal Principal */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/90 p-8 pt-10 text-center shadow-2xl shadow-zinc-950/50 transition-all duration-300 hover:border-zinc-700 hover:shadow-zinc-900/40 max-w-sm w-full">
          {/* Botão "Saiba mais" no topo do canto direito do modal */}
          <button
            onClick={() => setIsOpen(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-md transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800 active:scale-95 group"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
              <Info size={10} className="animate-soft-pulse-icon" />
            </span>
            Saiba mais
          </button>

          <div className="space-y-2 w-full mt-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Em Breve
            </h1>
            <p className="text-xs text-zinc-400">
              Esta seção está em desenvolvimento. Novidades chegarão em breve.
            </p>
          </div>
        </div>

        {/* Modal Flutuante com Backdrop Centralizado para fechar ao clicar fora */}
        {isOpen && (
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                    <Clock size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white leading-tight">O que está chegando</h2>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5">
                      <Calendar size={11} />
                      <span>14 de agosto de 2026</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 transition-all duration-200 hover:bg-red-500 hover:text-white active:scale-95"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-left text-xs text-zinc-300 max-h-[60vh] overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const isExpanded = expandedIndex === index
                  return (
                    <div key={index} className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
                            {item.icon}
                          </div>
                          <div>
                            <span className="font-semibold text-white block mb-0.5">{item.title}</span>
                            <p className="text-zinc-400">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 transition-transform duration-200 hover:bg-zinc-800 mt-0.5"
                        >
                          <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400 animate-in fade-in slide-in-from-top-1 duration-200">
                          {item.extra}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}