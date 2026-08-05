"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import { 
  Mail, Copy, RefreshCw, Inbox, Trash2, ArrowLeft, 
  Shield, Sparkles, Clock, AlertCircle, Loader2, CheckCheck, Trash,
  Circle, Radio, Check, CheckSquare, Square, X, AlertTriangle, Download
} from "lucide-react"

interface Message {
  id: string
  from: {
    address: string
    name: string
  }
  subject: string
  intro: string
  createdAt: string
  seen: boolean
  text?: string
  html?: string[]
}

interface Notification {
  id: string
  title: string
  text: string
  type: 'success' | 'info' | 'alert'
}

export default function TempEmailPage() {
  const [account, setAccount] = useState<{ email: string; token: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [extractingMessages, setExtractingMessages] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Estado para controlar o painel flutuante de aviso
  const [showWarningPanel, setShowWarningPanel] = useState(false)
  const warningButtonRef = useRef<HTMLButtonElement>(null)
  const warningPanelRef = useRef<HTMLDivElement>(null)
  const [panelCoordinates, setPanelCoordinates] = useState<{ top: number; right: number } | null>(null)
  
  // Estados de Sincronização Discreta
  const [syncStatus, setSyncStatus] = useState<string>("Sincronizado")
  const [lastSynced, setLastSynced] = useState<string>("Agora mesmo")
  
  // Timer de existência do email temporário (segundos)
  const [emailAgeSeconds, setEmailAgeSeconds] = useState(0)
  
  // Modal de confirmação padrão para exclusão total
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Estados do Modo de Seleção de Emails
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([])
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const previousMessageCountRef = useRef<number>(0)

  // Atualizar a posição do popup com base nas coordenadas do botão
  const updatePanelPosition = useCallback(() => {
    if (warningButtonRef.current) {
      const rect = warningButtonRef.current.getBoundingClientRect()
      setPanelCoordinates({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      })
    }
  }, [])

  // Fechar o painel flutuante ao clicar fora ou redimensionar/rolar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showWarningPanel &&
        warningPanelRef.current &&
        !warningPanelRef.current.contains(event.target as Node) &&
        warningButtonRef.current &&
        !warningButtonRef.current.contains(event.target as Node)
      ) {
        setShowWarningPanel(false)
      }
    }

    const handleResizeOrScroll = () => {
      if (showWarningPanel) {
        updatePanelPosition()
      }
    }

    if (showWarningPanel) {
      updatePanelPosition()
    }

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("resize", handleResizeOrScroll)
    window.addEventListener("scroll", handleResizeOrScroll, true)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", handleResizeOrScroll)
      window.removeEventListener("scroll", handleResizeOrScroll, true)
    }
  }, [showWarningPanel, updatePanelPosition])

  const toggleWarningPanel = () => {
    if (!showWarningPanel) {
      updatePanelPosition()
    }
    setShowWarningPanel((prev) => !prev)
  }

  // Timer para contagem do tempo de existência do email
  useEffect(() => {
    if (!account) return
    const timer = setInterval(() => {
      setEmailAgeSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [account])

  const formatAgeTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins}m ${secs}s`
  }

  const showNotification = (title: string, text: string, type: 'success' | 'info' | 'alert' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification: Notification = { id, title, text, type }
    
    setNotifications([newNotification])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  const generateTempEmail = async () => {
    setLoadingAccount(true)
    setSelectedMessage(null)
    setMessages([])
    setEmailAgeSeconds(0)
    setIsSelectionMode(false)
    setSelectedEmailIds([])

    try {
      setSyncStatus("Gerando...")
      const domainRes = await fetch("https://api.mail.tm/domains")
      const domainsData = await domainRes.json()
      if (!domainsData['hydra:member'] || domainsData['hydra:member'].length === 0) {
        throw new Error("Nenhum domínio disponível no momento.")
      }
      const domain = domainsData['hydra:member'][0].domain

      const randomString = Math.random().toString(36).substring(2, 10)
      const address = `user_${randomString}@${domain}`
      const password = Math.random().toString(36).substring(2, 12) + "A1!"

      const createRes = await fetch("https://api.mail.tm/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password })
      })

      if (!createRes.ok) throw new Error("Erro ao criar conta de email temporário.")

      const tokenRes = await fetch("https://api.mail.tm/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, password })
      })

      const tokenData = await tokenRes.json()
      if (!tokenData.token) throw new Error("Erro ao autenticar na conta.")

      const newAccount = { email: address, token: tokenData.token }
      setAccount(newAccount)
      localStorage.setItem("temp_mail_account", JSON.stringify(newAccount))
      
      showNotification("Sucesso", "Email temporário criado com sucesso!", "success")
      setSyncStatus("Sincronizado")
      setLastSynced("Agora mesmo")
      fetchMessages(tokenData.token, true)
    } catch (error) {
      console.error(error)
      showNotification("Erro", "Falha ao gerar email. Tente novamente.", "alert")
      setSyncStatus("Erro na conexão")
    } finally {
      setLoadingAccount(false)
    }
  }

  const fetchMessages = useCallback(async (token: string, initial = false) => {
    if (!initial) {
      setLoadingMessages(true)
      setSyncStatus("Verificando novos emails...")
    }

    try {
      const res = await fetch("https://api.mail.tm/messages", {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const items: Message[] = data['hydra:member'] || []

      if (previousMessageCountRef.current > 0 && items.length > previousMessageCountRef.current) {
        const latestMsg = items[0]
        showNotification(
          "Novo email recebido", 
          `${latestMsg.from.name || latestMsg.from.address}: ${latestMsg.subject || "Sem assunto"}`, 
          "info"
        )
      }
      previousMessageCountRef.current = items.length
      setMessages(items)
      
      setSyncStatus("Inbox atualizada")
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error)
      setSyncStatus("Falha ao sincronizar")
    } finally {
      if (!initial) {
        setTimeout(() => {
          setLoadingMessages(false)
          setSyncStatus("Sincronizado")
        }, 800)
      }
    }
  }, [])

  const fetchMessageDetails = async (id: string) => {
    if (isSelectionMode) {
      toggleSelectEmail(id)
      return
    }

    if (!account) return
    setLoadingDetails(true)
    try {
      const res = await fetch(`https://api.mail.tm/messages/${id}`, {
        headers: { Authorization: `Bearer ${account.token}` }
      })
      const data = await res.json()
      setSelectedMessage(data)

      if (!data.seen) {
        await fetch(`https://api.mail.tm/messages/${id}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${account.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ seen: true }),
        })
        setMessages((prev) => prev.map((m) => m.id === id ? { ...m, seen: true } : m))
      }
    } catch (error) {
      console.error("Erro ao carregar detalhes da mensagem:", error)
      showNotification("Erro", "Não foi possível carregar o conteúdo.", "alert")
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleExtractMessages = async () => {
    if (!account || messages.length === 0 || extractingMessages) return

    setExtractingMessages(true)
    try {
      const detailedMessages = await Promise.all(
        messages.map(async (msg) => {
          try {
            const res = await fetch(`https://api.mail.tm/messages/${msg.id}`, {
              headers: { Authorization: `Bearer ${account.token}` }
            })
            if (res.ok) {
              const data = await res.json()
              return { ...msg, ...data }
            }
          } catch (e) {
            console.error(`Erro ao buscar detalhes da mensagem ${msg.id}:`, e)
          }
          return msg
        })
      )

      let fileContent = ""
      detailedMessages.forEach((msg, index) => {
        const emailNumber = index + 1
        const senderName = msg.from.name || "Não informado"
        const senderAddress = msg.from.address || "Não informado"
        const subject = msg.subject || "Sem assunto"
        const date = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : "Data não informada"
        const status = msg.seen ? "Lido" : "Não lido"
        const intro = msg.intro || "Sem prévia"

        let fullBody = msg.text || ""
        if (!fullBody && msg.html && msg.html.length > 0) {
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = msg.html[0]
          fullBody = tempDiv.textContent || tempDiv.innerText || "Conteúdo HTML indisponível em texto."
        }
        if (!fullBody) {
          fullBody = intro
        }

        fileContent += `============================================================\n`
        fileContent += `EMAIL #${emailNumber}\n`
        fileContent += `============================================================\n\n`
        fileContent += `Remetente:\n`
        fileContent += `Nome: ${senderName}\n`
        fileContent += `Endereço: ${senderAddress}\n\n`
        fileContent += `Assunto: ${subject}\n\n`
        fileContent += `Data: ${date}\n\n`
        fileContent += `Status:\n${status}\n\n`
        fileContent += `Prévia:\n${intro}\n\n`
        fileContent += `Conteúdo completo:\n${fullBody}\n\n`
        fileContent += `------------------------------------------------------------\n\n`
      })

      const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')

      link.download = `Mv_TempMail_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      showNotification("Sucesso", `${messages.length} ${messages.length === 1 ? 'mensagem abaixada' : 'mensagens abaixadas'} com sucesso!`, "success")
    } catch (error) {
      console.error("Erro ao abaixar mensagens:", error)
      showNotification("Erro", "Não foi possível abaixar as mensagens.", "alert")
    } finally {
      setExtractingMessages(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!account || messages.length === 0) return
    try {
      await Promise.all(
        messages.map((msg) =>
          fetch(`https://api.mail.tm/messages/${msg.id}`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${account.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ seen: true }),
          })
        )
      )
      setMessages((prev) => prev.map((m) => ({ ...m, seen: true })))
      showNotification("Atualizado", "Todos os emails foram marcados como lidos.", "success")
    } catch (error) {
      console.error("Erro ao marcar emails como lidos:", error)
      showNotification("Erro", "Não foi possível marcar os emails como lidos.", "alert")
    }
  }

  const executeDeleteAllMessages = async () => {
    if (!account || messages.length === 0) return

    try {
      await Promise.all(
        messages.map((msg) =>
          fetch(`https://api.mail.tm/messages/${msg.id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${account.token}`,
            },
          })
        )
      )
      setMessages([])
      setSelectedMessage(null)
      previousMessageCountRef.current = 0
      setShowDeleteModal(false)
      showNotification("Excluído", "Todos os emails foram removidos com sucesso.", "success")
    } catch (error) {
      console.error("Erro ao excluir emails:", error)
      showNotification("Erro", "Não foi possível excluir os emails.", "alert")
      setShowDeleteModal(false)
    }
  }

  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false)
      setSelectedEmailIds([])
    } else {
      setIsSelectionMode(true)
    }
  }

  const toggleSelectEmail = (id: string) => {
    setSelectedEmailIds((prev) => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const executeBatchDelete = async () => {
    if (!account || selectedEmailIds.length === 0) return

    const count = selectedEmailIds.length

    try {
      await Promise.all(
        selectedEmailIds.map((id) =>
          fetch(`https://api.mail.tm/messages/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${account.token}`,
            },
          })
        )
      )

      setMessages((prev) => prev.filter(msg => !selectedEmailIds.includes(msg.id)))
      if (selectedMessage && selectedEmailIds.includes(selectedMessage.id)) {
        setSelectedMessage(null)
      }

      previousMessageCountRef.current = messages.length - count
      setSelectedEmailIds([])
      setIsSelectionMode(false)
      setShowBatchDeleteModal(false)

      showNotification("Sucesso", `${count} ${count === 1 ? 'email excluído' : 'emails excluídos'} com sucesso.`, "success")
    } catch (error) {
      console.error("Erro ao excluir emails selecionados:", error)
      showNotification("Erro", "Não foi possível excluir os emails selecionados.", "alert")
      setShowBatchDeleteModal(false)
    }
  }

  useEffect(() => {
    if (!account) return
    const interval = setInterval(() => {
      fetchMessages(account.token)
    }, 8000)
    return () => clearInterval(interval)
  }, [account, fetchMessages])

  const copyToClipboard = () => {
    if (!account) return
    navigator.clipboard.writeText(account.email)
    setCopied(true)
    showNotification("Copiado", "Endereço de email copiado para a área de transferência!", "success")
    setTimeout(() => setCopied(false), 2000)
  }

  const copyEmailContent = () => {
    if (!selectedMessage) return
    const content = selectedMessage.text || selectedMessage.intro || "Sem conteúdo"
    navigator.clipboard.writeText(content)
    showNotification("Copiado", "Conteúdo do email copiado para a área de transferência!", "success")
  }

  return (
    <div className="relative space-y-5">
      {/* Background com gradiente animado suave e tom cinza/neutro discreto */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-neutral-500/5 rounded-full blur-[140px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-neutral-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Sistema de Notificações Moderno */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 md:px-0">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto relative overflow-hidden flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-neutral-800 bg-black/95 text-sm shadow-2xl backdrop-blur-2xl transition-all"
          >
            <div className="flex-1 space-y-0.5 pr-2">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase">{notif.title}</h4>
              <p className="text-xs text-neutral-300 leading-relaxed break-words">{notif.text}</p>
            </div>
            <div className="absolute bottom-0 left-0 h-0.5 bg-neutral-400 w-full opacity-60" />
          </div>
        ))}
      </div>

      {/* Modal de Confirmação Padrão para Exclusão Total */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir todas as mensagens?</h3>
                <p className="text-xs text-neutral-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Você está prestes a apagar permanentemente todas as mensagens recebidas na sua caixa de entrada temporária.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={executeDeleteAllMessages}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Sim, excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Moderno para Exclusão de Selecionados */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir mensagens selecionadas?</h3>
                <p className="text-xs text-neutral-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Você selecionou <span className="font-bold text-white">{selectedEmailIds.length}</span> {selectedEmailIds.length === 1 ? 'email' : 'emails'}. Deseja realmente excluir essas mensagens?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 transition-colors cursor-pointer border border-neutral-800"
              >
                Cancelar
              </button>
              <button
                onClick={executeBatchDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex-1 flex flex-col justify-between relative z-10">
        
        {/* Cabeçalho com overflow visível para permitir o posicionamento livre do botão/popup */}
        <header className="w-full mb-6">
          <div className="relative overflow-visible rounded-3xl border border-border bg-card/40 p-6 md:p-8 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:border-neutral-400/50 hover:shadow-[0_0_20px_rgba(150,150,150,0.1)] group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-neutral-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between gap-4 relative z-10 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex shrink-0">
                  <img 
                    src="https://raw.githubusercontent.com/confiei/assets/main/c4604ba4541a1348122a2df3f65efe60.jpg" 
                    alt="TempMail Icon" 
                    className="h-14 w-14 object-cover rounded-2xl"
                  />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    TempMail
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Proteja sua caixa de entrada principal contra spam de forma elegante.
                  </p>
                </div>
              </div>

              {/* Botão de Aviso */}
              <div className="relative">
                <button
                  ref={warningButtonRef}
                  onClick={toggleWarningPanel}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs md:text-sm transition-all duration-300 shadow-lg shadow-rose-600/25 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-rose-500/30"
                >
                  <AlertTriangle size={16} />
                  <span>Leia, Importante!</span>
                </button>

                {/* Painel Flutuante renderizado via Portal diretamente no document.body com z-index máximo */}
                {showWarningPanel && panelCoordinates && typeof window !== "undefined" && createPortal(
                  <div
                    ref={warningPanelRef}
                    style={{
                      top: `${panelCoordinates.top}px`,
                      right: `${panelCoordinates.right}px`
                    }}
                    className="fixed w-80 sm:w-96 rounded-3xl border border-neutral-800 bg-neutral-950/95 p-5 shadow-2xl backdrop-blur-2xl z-[99999] animate-in fade-in zoom-in-95 duration-200 text-left space-y-3.5 max-w-[calc(100vw-2rem)]"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-2 text-rose-400">
                        <AlertTriangle size={18} />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-white">Aviso Importante</h3>
                      </div>
                      <button
                        onClick={() => setShowWarningPanel(false)}
                        className="p-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30 transition-colors cursor-pointer shadow-md shadow-rose-600/30"
                        title="Fechar painel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed">
                      <p>
                        Este serviço fornece apenas emails temporários para cadastros e uso pessoal.
                      </p>
                      <p className="font-medium text-neutral-200">
                        Eu, Christian, não me responsabilizo pelo uso indevido desta ferramenta ou pelos emails recebidos, enviados ou utilizados por qualquer pessoa.
                      </p>
                      <p className="text-neutral-400 text-[11px] pt-1 border-t border-neutral-900">
                        Todo o uso é de inteira responsabilidade do usuário. Utilize o TempMail de forma consciente e respeitando as leis e os termos dos serviços que utilizar.
                      </p>
                    </div>
                  </div>,
                  document.body
                )}
              </div>

            </div>
          </div>
        </header>

        <main className="space-y-4 md:space-y-5 flex-1 flex flex-col">
          {/* Card Principal do Endereço de Email ou Tela Inicial de Boas-Vindas */}
          {!account ? (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/40 p-8 md:p-12 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center text-center space-y-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-neutral-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="h-16 w-16 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-primary shadow-inner">
                <Mail size={32} className="animate-pulse" />
              </div>

              <div className="space-y-2 max-w-md">
                <h2 className="text-lg md:text-xl font-bold text-foreground">Nenhum email temporário ativo</h2>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Clique em &apos;Novo Email&apos; para criar um email temporário
                </p>
              </div>

              <button
                onClick={generateTempEmail}
                disabled={loadingAccount}
                className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs md:text-sm transition-all duration-300 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={18} className={loadingAccount ? "animate-spin" : ""} />
                <span>Novo Email</span>
              </button>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card/40 p-6 md:p-8 backdrop-blur-2xl shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-neutral-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Seu endereço temporário</span>
                    
                    <div className="flex items-center gap-2">
                      {loadingAccount ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Circle size={6} className="animate-ping fill-amber-400" /> Gerando...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                          <Circle size={6} className="fill-emerald-400 animate-pulse" /> Email ativo
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-secondary/50 text-secondary-foreground border border-border">
                        <Clock size={11} className="text-primary" /> {formatAgeTime(emailAgeSeconds)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    {loadingAccount ? (
                      <div className="flex items-center gap-2.5 text-muted-foreground py-2">
                        <Loader2 className="animate-spin text-primary" size={20} />
                        <span className="text-sm">Configurando caixa de correio...</span>
                      </div>
                    ) : (
                      <span className="text-xl sm:text-2xl lg:text-3xl font-mono font-bold tracking-tight text-foreground select-all break-all drop-shadow-sm">
                        {account?.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={copyToClipboard}
                    disabled={loadingAccount || !account}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs transition-all duration-300 shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {copied ? (
                      <CheckCheck size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                    <span>{copied ? "Copiado!" : "Copiar Email"}</span>
                  </button>

                  <button
                    onClick={generateTempEmail}
                    disabled={loadingAccount}
                    title="Gerar Novo Endereço"
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-card/60 hover:bg-card border border-border text-foreground font-medium text-xs transition-all duration-300 hover:border-neutral-400/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    <RefreshCw size={16} className={loadingAccount ? "animate-spin" : "hover:rotate-180 transition-transform duration-500"} />
                    <span>Novo Email</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Seção da Caixa / Leitor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
            
            {/* Lista de Mensagens (Inbox) - 5 colunas */}
            <div className="lg:col-span-5 rounded-3xl border border-border bg-card/40 backdrop-blur-xl flex flex-col h-[550px] overflow-hidden shadow-2xl transition-all duration-300 hover:border-neutral-400/40">
              
              <div className="p-4 border-b border-border flex items-center justify-between bg-card/20 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Inbox size={18} className="text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Caixa de Entrada</h2>
                  
                  {/* Botão Extrair Mensagens */}
                  <div className="relative group/extract">
                    <button
                      onClick={handleExtractMessages}
                      disabled={messages.length === 0 || extractingMessages}
                      title={messages.length === 0 ? "Nenhuma mensagem disponível para exportar." : "Extrair Mensagens"}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-300 ${
                        messages.length === 0 
                          ? "bg-secondary/20 border-border text-muted-foreground/50 opacity-50 cursor-not-allowed" 
                          : "bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {extractingMessages ? (
                        <Loader2 size={14} className="animate-spin text-primary" />
                      ) : (
                        <Download size={14} />
                      )}
                      <span>{extractingMessages ? "Extraindo mensagens..." : "Extrair Mensagens"}</span>
                    </button>

                    {messages.length === 0 && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover/extract:block z-50 w-64 p-2.5 bg-neutral-950 border border-neutral-800 text-neutral-300 text-[11px] rounded-xl shadow-xl text-center pointer-events-none backdrop-blur-xl">
                        Nenhuma mensagem disponível para exportar.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleSelectionMode}
                    disabled={messages.length === 0}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all disabled:opacity-40 cursor-pointer ${
                      isSelectionMode 
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20" 
                        : "bg-secondary/50 border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {isSelectionMode ? "Concluir" : "Selecionar"}
                  </button>

                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={messages.length === 0 || isSelectionMode}
                    title="Ler todos os emails"
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent hover:border-border transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <CheckCheck size={16} className="hover:scale-110 transition-transform" />
                  </button>

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={messages.length === 0 || isSelectionMode}
                    title="Excluir todos os emails"
                    className="p-2 rounded-xl text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <Trash size={16} className="hover:scale-110 transition-transform" />
                  </button>

                  <button 
                    onClick={() => account && fetchMessages(account.token)}
                    disabled={loadingMessages || !account}
                    title="Atualizar Inbox"
                    className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent hover:border-border transition-all cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw size={16} className={loadingMessages ? "animate-spin text-primary" : "hover:rotate-180 transition-transform duration-500"} />
                  </button>
                </div>
              </div>

              {/* Sub-topo Dinâmico do Modo de Seleção */}
              {isSelectionMode ? (
                <div className="px-4 py-2.5 bg-card/20 border-b border-border flex items-center justify-between text-xs text-foreground">
                  <span className="font-semibold">
                    {selectedEmailIds.length} {selectedEmailIds.length === 1 ? 'email selecionado' : 'emails selecionados'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsSelectionMode(false)
                        setSelectedEmailIds([])
                      }}
                      className="px-2.5 py-1 rounded-lg bg-secondary/50 hover:bg-secondary text-[11px] text-muted-foreground transition-colors border border-border cursor-pointer"
                    >
                      Cancelar seleção
                    </button>
                    <button
                      onClick={() => setShowBatchDeleteModal(true)}
                      disabled={selectedEmailIds.length === 0}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-[11px] font-medium text-white shadow-sm transition-all disabled:opacity-40 cursor-pointer"
                    >
                      Excluir selecionados
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 bg-card/20 border-b border-border flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1.5">
                    <Radio size={11} className={`text-primary ${loadingMessages ? 'animate-ping' : ''}`} />
                    {syncStatus}
                  </span>
                  <span className="text-muted-foreground font-medium">total: {messages.length}</span>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 relative bg-transparent">
                {!account ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                      <Inbox size={20} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-foreground">Caixa de entrada inativa</h3>
                      <p className="text-[11px] text-muted-foreground max-w-[200px]">Crie um email para começar a receber mensagens.</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                      <Clock size={20} className="animate-spin duration-1000" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-semibold text-foreground">Caixa de entrada vazia</h3>
                      <p className="text-[11px] text-muted-foreground max-w-[200px]">Nenhuma mensagem recebida ainda.</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const senderName = msg.from.name || msg.from.address
                    const firstLetter = senderName.charAt(0).toUpperCase()
                    const isSelected = selectedMessage?.id === msg.id
                    const isItemChecked = selectedEmailIds.includes(msg.id)

                    return (
                      <div
                        key={msg.id}
                        onClick={() => fetchMessageDetails(msg.id)}
                        className={`group p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left space-y-2 relative transform animate-in fade-in-50 zoom-in-95 ${
                          isItemChecked
                            ? "bg-secondary/40 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-lg text-foreground scale-[1.01]"
                            : isSelected 
                            ? "bg-secondary/40 border-primary/50 ring-1 ring-primary/20 shadow-lg text-foreground" 
                            : "bg-card/40 border-border hover:border-neutral-400/40 hover:bg-card/60 text-muted-foreground"
                        } ${!msg.seen ? 'border-l-2 border-l-primary shadow-sm' : ''}`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-2.5 truncate">
                            {isSelectionMode && (
                              <div className="flex items-center justify-center shrink-0">
                                <div 
                                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 transform ${
                                    isItemChecked 
                                      ? "bg-emerald-600 border-emerald-500 shadow-md shadow-emerald-600/30 scale-110" 
                                      : "bg-secondary/50 border-border hover:border-muted-foreground"
                                  }`}
                                >
                                  {isItemChecked && (
                                    <Check size={13} className="text-white stroke-[3] transition-transform duration-300 scale-100 animate-in zoom-in-50" />
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="h-6 w-6 rounded-full bg-secondary/50 border border-border text-foreground font-bold flex items-center justify-center text-[10px] shadow-sm shrink-0">
                              {firstLetter}
                            </div>
                            <span className="font-semibold truncate max-w-[120px] text-foreground">
                              {senderName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {!msg.seen ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-primary/20 text-primary border border-primary/30 shadow-sm animate-pulse">
                                Novo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-secondary/50 text-muted-foreground border border-border">
                                Lido
                              </span>
                            )}
                            <span className="font-mono text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                            {msg.subject || "(Sem assunto)"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate pt-0.5">
                            {msg.intro || "Clique para visualizar o conteúdo completo desta mensagem..."}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Visualizador de Email Completo - 7 colunas */}
            <div className="lg:col-span-7 rounded-3xl border border-border bg-card/40 backdrop-blur-xl flex flex-col h-[550px] overflow-hidden shadow-2xl transition-all duration-300 hover:border-neutral-400/40">
              {selectedMessage ? (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                  <div className="p-4 md:p-5 border-b border-border bg-card/20 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className="lg:hidden p-1.5 rounded-xl bg-secondary/50 text-primary hover:bg-secondary transition-colors"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {selectedMessage.subject || "(Sem assunto)"}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <div className="h-5 w-5 rounded-full bg-secondary/50 text-foreground font-bold flex items-center justify-center text-[10px] shrink-0 border border-border">
                          {(selectedMessage.from.name || selectedMessage.from.address).charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">
                          De: <span className="text-foreground font-medium">
                            {selectedMessage.from.name ? `${selectedMessage.from.name} <${selectedMessage.from.address}>` : selectedMessage.from.address}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={copyEmailContent}
                        title="Copiar conteúdo"
                        className="p-2 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border"
                      >
                        <Copy size={15} />
                      </button>

                      <span className="text-xs text-muted-foreground font-mono hidden sm:inline-block bg-secondary/50 px-2.5 py-1 rounded-lg border border-border">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>

                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/50 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground text-xs font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.96] shadow-sm cursor-pointer"
                        title="Fechar mensagem"
                      >
                        <X size={15} className="text-muted-foreground hover:text-foreground transition-colors" />
                        <span>Fechar</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 p-5 overflow-y-auto bg-transparent text-xs text-muted-foreground">
                    {loadingDetails ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="animate-spin text-primary" size={24} />
                        <span>Carregando conteúdo da mensagem...</span>
                      </div>
                    ) : selectedMessage.html && selectedMessage.html.length > 0 ? (
                      <iframe
                        srcDoc={selectedMessage.html[0]}
                        title="Conteúdo do Email"
                        className="w-full h-full bg-white rounded-xl border border-border shadow-inner"
                      />
                    ) : (
                      <div className="whitespace-pre-wrap font-mono text-foreground bg-secondary/20 p-4 rounded-xl border border-border leading-relaxed">
                        {selectedMessage.text || "Conteúdo vazio ou indisponível."}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 animate-in fade-in duration-300 bg-transparent">
                  <div className="h-16 w-16 rounded-3xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground shadow-inner">
                    <Mail size={28} className="animate-pulse" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-sm font-bold text-foreground tracking-wide">Nenhuma mensagem selecionada</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">Clique em qualquer mensagem da sua caixa de entrada ao lado para ler o conteúdo completo em detalhes.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>

        {/* Rodapé / Barra de Status Profissional */}
        <footer className="pt-5 border-t border-border mt-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-medium text-muted-foreground">Todos os direitos reservados. © 2026 Christian</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <span className="text-border">|</span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
            </span>
          </div>
        </footer>

      </div>
    </div>
  )
}