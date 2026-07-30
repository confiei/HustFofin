import { useState, useRef, useEffect } from "react"
import {
  ShoppingBag,
  Search,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowRight,
  UserCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Bell,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Check,
  ExternalLink,
  MessageSquare,
  Send,
  Minimize2,
  User,
  LogOut,
  UserPlus,
  LogIn,
  Loader2,
  ShieldAlert,
  Camera,
  EyeOff,
  FolderOpen,
  ZoomIn,
  ZoomOut
} from "lucide-react"

interface AccountItem {
  id: string
  title: string
  category: string
  price: number
  images: string[]
  seller: string
  verified: boolean
  description: string
}

interface NotificationItem {
  id: string
  author: string
  authorAvatar?: string
  content: string
  images: string[]
  time: string
  read: boolean
}

interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: "client" | "admin"
  content: string
  timestamp: string
}

interface ChatConversation {
  id: string
  clientName: string
  clientAvatar: string
  status: "Aberto" | "Em atendimento" | "Resolvido" | "Arquivado"
  unreadCount: number
  lastMessage: string
  lastTime: string
  isOnline: boolean
  typing?: boolean
  messages: Message[]
}

interface UserAccount {
  username: string
  password?: string
  avatarUrl?: string
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"todos" | "menor-preco" | "maior-preco">("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [notificacao, setNotificacao] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<AccountItem | null>(null)
  
  const [modalGaleriaAberto, setModalGaleriaAberto] = useState(false)
  const [itemGaleria, setItemGaleria] = useState<AccountItem | null>(null)
  const [indiceFotoAtual, setIndiceFotoAtual] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(1)

  const [modalNotificacoesAberto, setModalNotificacoesAberto] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const [chatAberto, setChatAberto] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [adminUsernameInput, setAdminUsernameInput] = useState("")
  const [adminPasswordInput, setAdminPasswordInput] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminLoginError, setAdminLoginError] = useState("")
  
  const [currentClientId, setCurrentClientId] = useState("cliente_user_1")
  const [currentClientName, setCurrentClientName] = useState("Visitante")
  const [currentClientAvatar, setCurrentClientAvatar] = useState("https://cdn.discordapp.com/embed/avatars/0.png")
  const [activeConversationId, setActiveConversationId] = useState<string>("conv_1")
  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register" | "admin">("login")
  
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authAvatarUrl, setAuthAvatarUrl] = useState("")
  const [authError, setAuthError] = useState("")
  const [authSuccess, setAuthSuccess] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const [showProfileModal, setShowProfileModal] = useState(false)
  const [newAvatarInput, setNewAvatarInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [captchaStatus, setCaptchaStatus] = useState<"idle" | "loading" | "success">("idle")

  const [newMessageText, setNewMessageText] = useState("")
  const [adminSearchTerm, setAdminSearchTerm] = useState("")
  const [conversations, setConversations] = useState<ChatConversation[]>([])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalNotificacaoRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversations, activeConversationId, chatAberto])

  useEffect(() => {
    async function fetchNotifications() {
      const timestamp = new Date().getTime()
      let fetchedData = null

      try {
        const response = await fetch(`file:///C:/Users/christian/Pictures/HustRich/HustRich/notifications.json?t=${timestamp}`, { cache: "no-store" })
        if (response.ok) {
          fetchedData = await response.json()
        }
      } catch (error) {}

      if (!fetchedData) {
        try {
          const res = await fetch(`/notifications.json?t=${timestamp}`, { cache: "no-store" })
          if (res.ok) {
            fetchedData = await res.json()
          }
        } catch (e) {}
      }

      if (fetchedData && Array.isArray(fetchedData)) {
        processFetchedData(fetchedData)
      }
    }

    function processFetchedData(newData: NotificationItem[]) {
      try {
        const savedReads = JSON.parse(localStorage.getItem("marketplace_read_notifications") || "{}")
        let savedDeleted = JSON.parse(localStorage.getItem("marketplace_deleted_notifications") || "[]")
        let hasChanges = false

        const processedData = newData.map(n => {
          const previousContent = localStorage.getItem(`marketplace_content_${n.id}`)
          
          if (previousContent !== null && previousContent !== n.content) {
            if (savedReads[n.id]) {
              delete savedReads[n.id]
              hasChanges = true
            }
            if (savedDeleted.includes(n.id)) {
              savedDeleted = savedDeleted.filter((id: string) => id !== n.id)
              hasChanges = true
            }
          }
          
          localStorage.setItem(`marketplace_content_${n.id}`, n.content)

          return {
            ...n,
            read: savedReads[n.id] ? true : false
          }
        })

        if (hasChanges) {
          localStorage.setItem("marketplace_read_notifications", JSON.stringify(savedReads))
          localStorage.setItem("marketplace_deleted_notifications", JSON.stringify(savedDeleted))
        }

        const activeNotifs = processedData.filter(n => !savedDeleted.includes(n.id))

        setNotifications(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(activeNotifs)) {
            return activeNotifs
          }
          return prev
        })
      } catch (err) {
        setNotifications(newData)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalNotificacoesAberto &&
        modalNotificacaoRef.current &&
        !modalNotificacaoRef.current.contains(event.target as Node)
      ) {
        setModalNotificacoesAberto(false)
      }
      if (
        dropdownAberto &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownAberto(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [modalNotificacoesAberto, dropdownAberto])

  const accounts: AccountItem[] = [
    {
      id: "1",
      title: "4k seguidores maioria brasileiro",
      category: "Instagram",
      price: 60.00,
      images: [
        "https://media.discordapp.net/attachments/1532243391314919456/1532243470297858280/listings-1784993764810-10b76cde3c516323-e745483120d566187a2cb55d1ce62120.webp?ex=6a6c246f&is=6a6ad2ef&hm=b4a71cc0a8efd8943c899cdefa57dab1cc2b2b79be24951f3963116be3b03a13&=&format=webp&width=837&height=844"
      ],
      seller: "Mv",
      verified: true,
      description: "Total acesso"
    },
    {
      id: "2",
      title: "3c User Discord",
      category: "Ogu",
      price: 430.00,
      images: [
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532248684719247412/image.png?ex=6a6c294a&is=6a6ad7ca&hm=fc7ffa7adb5ff43acc9f234d2e10beeac9878dfcdc65ba8f408c6a99f9be690b&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532243441273143306/listings-1781616702207-f049054b08e70792-761fd7dcfd653b581c249a60bb986353.webp?ex=6a6c2468&is=6a6ad2e8&hm=5445f4edfd3560bc73ba8114a57d7da32513457134c457a9f8cf2c5af942c6ac&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532243440539271278/listings-1781616702048-f0e9b78dd5f7c13e-a8208766d49755b8ed9a501765ce998e.webp?ex=6a6c2467&is=6a6ad2e7&hm=234e0dd62544b0f4e0df4ad82e4a0cd3f4ccb1c60b6963b0d5772f7727a811e8&"
      ],
      seller: "Mv",
      verified: true,
      description: "Hotmail"
    },
    {
      id: "3",
      title: "Nitro Platina",
      category: "Ogu",
      price: 170.00,
      images: [
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532249729008799944/image.png?ex=6a6c2a43&is=6a6ad8c3&hm=496ba2f6faf0c97cdf479ff23a16f90995bd00136eee4beb6b0291edd59fb2b2&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532246740835504138/listings-1781919008550-247160d7dda4963a-f6323ac97b6b1da59eef6a5d8712147e.webp?ex=6a6c277a&is=6a6ad5fa&hm=477993038d82372402d0790a7f8e18731494fa50a4740ff5b90b4e9093ab92fe&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532246742831988908/listings-1781919008071-3abadb1b72f0d828-8ff73ec46b575a9034f7587c93a76f68.webp?ex=6a6c277b&is=6a6ad5fb&hm=5ddae18443c25e9c9eccdbcb440e42dc577d54eb6f83f0f2d5304af75a1df4e2&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532246749622567013/listings-1781919009014-540bbf4b95e4ac66-5bffa0aeed14dd1c72965853027d2d0c.webp?ex=6a6c277c&is=6a6ad5fc&hm=eaf8ad15b3a66a501076d3d2edbef7b92dba74e300712f67588b668af4635e80&",
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532246759013617817/listings-1781919009685-78d1926b2766c5c9-c2d07d46b09e5c9221110b07adac4a64.webp?ex=6a6c277f&is=6a6ad5ff&hm=90779fc7d45dd931fa9fcf2a95431762452285fb463bb6264a03ef33d0854fee&"
      ],
      seller: "Mv",
      verified: true,
      description: "Sem Og"
    },
    {
      id: "4",
      title: "Discord Bots",
      category: "Servidores",
      price: 24.00,
      images: [
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532244113598971954/a026bf3fbba011c49b940c0a6ba671c7.jpg?ex=6a6c2508&is=6a6ad388&hm=6be0ea841751645ee5cd2a1574d3edb27e3b040f5828d4b59fc7665d8e84e276&"
      ],
      seller: "Mv",
      verified: true,
      description: "Bot para seu servidor feito totalmente por MV, Painel Cl, Tellonym, ETC!"
    },
    {
      id: "5",
      title: "Conta OGU Rara",
      category: "Ogu",
      price: 350.00,
      images: [
        "https://cdn.discordapp.com/attachments/1532243391314919456/1532248684719247412/image.png?ex=6a6c294a&is=6a6ad7ca&hm=fc7ffa7adb5ff43acc9f234d2e10beeac9878dfcdc65ba8f408c6a99f9be690b&"
      ],
      seller: "Mv",
      verified: true,
      description: "Conta OG com emblemas exclusivos."
    }
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredAccounts = accounts
    .filter(item => {
      return (
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.seller.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => {
      if (sortBy === "menor-preco") {
        return a.price - b.price
      }
      if (sortBy === "maior-preco") {
        return b.price - a.price
      }
      return 0
    })

  const totalPages = 2
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    (currentPage - 1) * itemsPerPage + (currentPage === 1 ? 3 : 2)
  )

  function formatMoney(value: number) {
    return value.toFixed(2).replace(".", ",")
  }

  function handleAction(item: AccountItem) {
    setProdutoSelecionado(item)
    setNotificacao(true)
    setTimeout(() => setNotificacao(false), 3000)
    window.open("https://discord.gg/kedJkEu3sH", "_blank")
  }

  function abrirGaleria(item: AccountItem) {
    setItemGaleria(item)
    setIndiceFotoAtual(0)
    setZoomLevel(1)
    setModalGaleriaAberto(true)
  }

  function proximaFoto() {
    if (!itemGaleria) return
    setIndiceFotoAtual((prev) => (prev + 1) % itemGaleria.images.length)
    setZoomLevel(1)
  }

  function fotoAnterior() {
    if (!itemGaleria) return
    setIndiceFotoAtual((prev) => (prev - 1 + itemGaleria.images.length) % itemGaleria.images.length)
    setZoomLevel(1)
  }

  function handleZoomIn() {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3))
  }

  function handleZoomOut() {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1))
  }

  function abrirNotificacoes() {
    const novoEstadoAberto = !modalNotificacoesAberto
    setModalNotificacoesAberto(novoEstadoAberto)

    if (novoEstadoAberto) {
      try {
        const savedReads = JSON.parse(localStorage.getItem("marketplace_read_notifications") || "{}")
        notifications.forEach(n => {
          savedReads[n.id] = true
          localStorage.setItem(`marketplace_content_${n.id}`, n.content)
        })
        localStorage.setItem("marketplace_read_notifications", JSON.stringify(savedReads))
      } catch (e) {}

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  function limparNotificacoes() {
    try {
      const deletedIds = notifications.map(n => n.id)
      const savedDeleted = JSON.parse(localStorage.getItem("marketplace_deleted_notifications") || "[]")
      const updatedDeleted = Array.from(new Set([...savedDeleted, ...deletedIds]))
      localStorage.setItem("marketplace_deleted_notifications", JSON.stringify(updatedDeleted))
    } catch (e) {}
    setNotifications([])
  }

  function removerNotificacao(id: string) {
    try {
      const savedDeleted = JSON.parse(localStorage.getItem("marketplace_deleted_notifications") || "[]")
      savedDeleted.push(id)
      localStorage.setItem("marketplace_deleted_notifications", JSON.stringify(savedDeleted))
    } catch (e) {}
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  function renderContentWithLinks(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all font-medium"
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  const getSortLabel = () => {
    if (sortBy === "menor-preco") return "Menor preço"
    if (sortBy === "maior-preco") return "Maior preço"
    return "Todos"
  }

  function handleRunCaptcha() {
    if (captchaStatus === "success" || captchaStatus === "loading") return
    setCaptchaStatus("loading")

    setTimeout(() => {
      setCaptchaStatus("success")
    }, 1500)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setNewAvatarInput(reader.result)
          setAuthAvatarUrl(reader.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setAuthError("")
    setAuthSuccess("")

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Preencha todos os campos para criar sua conta.")
      return
    }

    if (authPassword.includes(".") || authPassword.includes("_")) {
      setAuthError("A senha não pode conter pontos ou underscores.")
      return
    }

    if (captchaStatus !== "success") {
      setAuthError("Por favor, clique para verificar que você não é um robô.")
      return
    }

    try {
      const existingUsers = JSON.parse(localStorage.getItem("marketplace_users") || "[]")
      const userExists = existingUsers.find((u: UserAccount) => u.username === authUsername)
      
      if (userExists) {
        setAuthError("Este nome de usuário já está cadastrado.")
        return
      }

      const newUser: UserAccount = {
        username: authUsername.trim(),
        password: authPassword,
        avatarUrl: authAvatarUrl.trim() || "https://cdn.discordapp.com/embed/avatars/0.png"
      }

      existingUsers.push(newUser)
      localStorage.setItem("marketplace_users", JSON.stringify(existingUsers))

      setAuthSuccess("Conta criada com sucesso! Faça login para continuar.")
      setTimeout(() => {
        setAuthMode("login")
        setAuthSuccess("")
        setAuthPassword("")
        setAuthAvatarUrl("")
        setCaptchaStatus("idle")
      }, 1500)
    } catch (err) {
      setAuthError("Erro ao salvar os dados da conta.")
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError("")
    setAuthSuccess("")

    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthError("Preencha seu usuário e senha.")
      return
    }

    if (authPassword.includes(".") || authPassword.includes("_")) {
      setAuthError("A senha não pode conter pontos ou underscores.")
      return
    }

    if (captchaStatus !== "success") {
      setAuthError("Por favor, clique para verificar que você não é um robô.")
      return
    }

    try {
      const existingUsers = JSON.parse(localStorage.getItem("marketplace_users") || "[]")
      const foundUser = existingUsers.find((u: UserAccount) => 
        u.username === authUsername.trim() && u.password === authPassword
      )

      if (!foundUser) {
        setAuthError("Usuário ou senha incorretos.")
        return
      }

      const safeUserData = { 
        username: foundUser.username,
        avatarUrl: foundUser.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"
      }

      setIsLoggedIn(true)
      setCurrentUser(safeUserData)
      setCurrentClientName(foundUser.username)
      setCurrentClientAvatar(safeUserData.avatarUrl)
      setCurrentClientId("user_" + foundUser.username)
      setShowAuthModal(false)
      setAuthPassword("")
      setAuthError("")
      setChatAberto(true)
    } catch (err) {
      setAuthError("Erro ao realizar login.")
    }
  }

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError("")
    setAuthSuccess("")

    const p = authPassword.trim()
    let recognizedName = ""

    if (p === "Mvfofo4455") {
      recognizedName = "Mv"
    } else if (p === "Davifofo4455") {
      recognizedName = "Davi"
    }

    if (!recognizedName) {
      setAuthError("Senha de Administrador incorreta!")
      return
    }

    const adminUser: UserAccount = {
      username: recognizedName,
      avatarUrl: "https://cdn.discordapp.com/embed/avatars/0.png"
    }

    setIsLoggedIn(true)
    setCurrentUser(adminUser)
    setCurrentClientName(recognizedName)
    setCurrentClientAvatar(adminUser.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png")
    setCurrentClientId("admin_" + recognizedName.toLowerCase())
    setIsAdminMode(true)
    setShowAuthModal(false)
    setAuthPassword("")
    setAuthError("")
    setChatAberto(true)
  }

  function handleUpdateAvatar(e: React.FormEvent) {
    e.preventDefault()
    if (!newAvatarInput.trim() || !currentUser) return

    const updatedAvatar = newAvatarInput.trim()
    setCurrentClientAvatar(updatedAvatar)
    setCurrentUser({ ...currentUser, avatarUrl: updatedAvatar })

    try {
      const existingUsers = JSON.parse(localStorage.getItem("marketplace_users") || "[]")
      const updatedUsers = existingUsers.map((u: UserAccount) => {
        if (u.username === currentUser.username) {
          return { ...u, avatarUrl: updatedAvatar }
        }
        return u
      })
      localStorage.setItem("marketplace_users", JSON.stringify(updatedUsers))
    } catch (e) {}

    setShowProfileModal(false)
    setNewAvatarInput("")
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setCurrentUser(null)
    setCurrentClientName("Visitante")
    setCurrentClientAvatar("https://cdn.discordapp.com/embed/avatars/0.png")
    setCurrentClientId("cliente_user_1")
    setChatAberto(false)
    setIsAdminMode(false)
  }

  function enviarMensagemChat(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessageText.trim()) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const novaMsg: Message = {
      id: "msg_" + Date.now(),
      senderId: isAdminMode ? "admin" : currentClientId,
      senderName: isAdminMode ? currentClientName : currentClientName,
      senderRole: isAdminMode ? "admin" : "client",
      content: newMessageText.trim(),
      timestamp: timeStr
    }

    setConversations(prev => {
      const exists = prev.find(c => c.id === activeConversationId)
      if (exists) {
        return prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              clientAvatar: currentClientAvatar,
              lastMessage: novaMsg.content,
              lastTime: timeStr,
              messages: [...conv.messages, novaMsg]
            }
          }
          return conv
        })
      } else {
        const novaConv: ChatConversation = {
          id: activeConversationId,
          clientName: currentClientName,
          clientAvatar: currentClientAvatar,
          status: "Aberto",
          unreadCount: 0,
          lastMessage: novaMsg.content,
          lastTime: timeStr,
          isOnline: true,
          messages: [novaMsg]
        }
        return [novaConv, ...prev]
      }
    })

    setNewMessageText("")
  }

  const activeConv = conversations.find(c => c.id === activeConversationId) || conversations[0]

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-neutral-100 p-6 md:p-12 overflow-y-auto relative selection:bg-neutral-800 selection:text-white flex flex-col justify-between"
    >
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neutral-900/10 rounded-full blur-3xl pointer-events-none" />

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="max-w-7xl mx-auto w-full relative z-20">
        <div className="flex items-center justify-between w-full pt-2 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent flex items-center gap-2.5">
              <img src="https://cdn.discordapp.com/attachments/1532243391314919456/1532476462869909614/Shopping_Bags.gif?ex=6a6cfd6c&is=6a6babec&hm=d5c5c3aedb03aef2626fa6abb918eb240d8fdc7f57384941defac655a6c3fee7&" alt="Shopping Bags" className="w-8 h-8 object-contain" />
              Insignias & Contas Marketplace
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && currentUser ? (
              <div className="flex items-center gap-3 bg-black border border-neutral-800 px-4 py-2 rounded-2xl shadow-xl">
                <div 
                  onClick={() => {
                    setNewAvatarInput(currentUser.avatarUrl || "")
                    setShowProfileModal(true)
                  }}
                  className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden flex items-center justify-center text-white text-xs font-bold cursor-pointer relative group"
                  title="Alterar Avatar"
                >
                  <img src={currentUser.avatarUrl || "https://cdn.discordapp.com/embed/avatars/0.png"} alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera size={12} className="text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-neutral-400 block leading-none">Logado como</span>
                  <strong className="text-xs text-white">{currentUser.username}</strong>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                  title="Sair da conta"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login")
                  setShowAuthModal(true)
                  setAuthError("")
                  setAuthSuccess("")
                  setCaptchaStatus("idle")
                }}
                className="bg-white hover:bg-neutral-200 text-black px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-xl shadow-white/10 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <LogIn size={15} />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>

        <div className="w-full border-b border-neutral-900 my-2" />

        <div className="py-4 text-left">
          <p className="text-neutral-400 text-sm max-w-xl">
            Explore ativos digitais exclusivos, contas verificadas e customizações de alto padrão com entrega instantânea.
          </p>
        </div>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-black border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center justify-center mb-4">
              <img src={newAvatarInput || currentClientAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Alterar Avatar</h3>
            <p className="text-xs text-neutral-400 mb-6 text-center">Escolha uma foto do seu computador para usar como seu novo avatar.</p>

            <form onSubmit={handleUpdateAvatar} className="w-full space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderOpen size={16} />
                <span>Escolher foto do PC</span>
              </button>

              <button
                type="submit"
                className="w-full bg-white hover:bg-neutral-200 text-black py-3.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Salvar Novo Avatar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {modalGaleriaAberto && itemGaleria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-black border border-neutral-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{itemGaleria.title}</h4>
                <p className="text-xs text-neutral-400">
                  Foto {indiceFotoAtual + 1} de {itemGaleria.images.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 1}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Diminuir Zoom"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-bold px-1 text-white">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors cursor-pointer"
                    title="Aumentar Zoom"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
                <button 
                  onClick={() => setModalGaleriaAberto(false)}
                  className="w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="relative w-full aspect-[16/10] bg-black rounded-2xl overflow-hidden flex items-center justify-center border border-neutral-900">
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img 
                  src={itemGaleria.images[indiceFotoAtual]} 
                  alt="Detalhe do Anúncio" 
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                  className="max-h-full object-contain"
                />
              </div>

              {itemGaleria.images.length > 1 && (
                <>
                  <button 
                    onClick={fotoAnterior}
                    className="absolute left-3 p-2 rounded-full bg-black/80 hover:bg-neutral-900 text-white backdrop-blur-sm border border-neutral-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={proximaFoto}
                    className="absolute right-3 p-2 rounded-full bg-black/80 hover:bg-neutral-900 text-white backdrop-blur-sm border border-neutral-800 transition-transform active:scale-95 cursor-pointer"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {itemGaleria.images.length > 1 && (
              <div className="flex items-center gap-2 mt-4 overflow-x-auto max-w-full pb-2">
                {itemGaleria.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIndiceFotoAtual(idx)
                      setZoomLevel(1)
                    }}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                      idx === indiceFotoAtual ? 'border-white scale-105' : 'border-neutral-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Miniatura" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {notificacao && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
          <div className="flex items-center gap-3 bg-black border border-neutral-800 text-white px-5 py-3 rounded-2xl shadow-2xl animate-floatUp">
            <div className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-300">
              <Sparkles size={16} className="animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-xs">Redirecionando para o Discord...</p>
              <p className="text-[11px] text-neutral-400">{produtoSelecionado?.title}</p>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative bg-black border border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center">
            
            <button
              onClick={() => {
                setShowAuthModal(false)
                setAuthError("")
                setAuthSuccess("")
                setCaptchaStatus("idle")
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white mb-4 shadow-inner">
              {authMode === "login" && <LogIn size={22} />}
              {authMode === "register" && <UserPlus size={22} />}
              {authMode === "admin" && <ShieldAlert size={22} />}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
              {authMode === "login" && "Acesse sua Conta"}
              {authMode === "register" && "Crie sua Conta"}
              {authMode === "admin" && "Painel Admin"}
            </h3>
            <p className="text-xs text-neutral-400 mb-6 text-center">
              {authMode === "login" && "Entre com seu usuário e senha para acessar o marketplace e o chat."}
              {authMode === "register" && "Preencha os campos abaixo e defina seu avatar para registrar sua conta."}
              {authMode === "admin" && "Insira a senha de administrador (reconhecimento automático para Mv ou Davi)."}
            </p>

            <div className="w-full bg-black p-1.5 rounded-2xl border border-neutral-800 flex items-center mb-6">
              <button
                onClick={() => {
                  setAuthMode("login")
                  setAuthError("")
                  setAuthSuccess("")
                  setCaptchaStatus("idle")
                  setAuthPassword("")
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === "login" ? "bg-neutral-900 text-white shadow-md border border-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setAuthMode("register")
                  setAuthError("")
                  setAuthSuccess("")
                  setCaptchaStatus("idle")
                  setAuthPassword("")
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === "register" ? "bg-neutral-900 text-white shadow-md border border-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                Criar Conta
              </button>
              <button
                onClick={() => {
                  setAuthMode("admin")
                  setAuthError("")
                  setAuthSuccess("")
                  setCaptchaStatus("idle")
                  setAuthPassword("")
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  authMode === "admin" ? "bg-neutral-900 text-amber-400 shadow-md border border-neutral-800" : "text-neutral-400 hover:text-white"
                }`}
              >
                Admin
              </button>
            </div>

            {authError && (
              <div className="w-full bg-red-950/30 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4 text-center font-medium">
                {authError}
              </div>
            )}

            {authSuccess && (
              <div className="w-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs p-3 rounded-xl mb-4 text-center font-medium">
                {authSuccess}
              </div>
            )}

            {authMode === "login" && (
              <form onSubmit={handleLogin} className="w-full space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Nome de Usuário</label>
                  <input
                    type="text"
                    placeholder="Seu usuário"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Senha (sem pontos ou underscores)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 pr-10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} className="animate-fadeIn" /> : <Eye size={16} className="animate-fadeIn" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1 animate-fadeIn">
                  <div 
                    onClick={handleRunCaptcha}
                    className={`w-full bg-black border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3.5 flex items-center justify-between transition-all select-none ${
                      captchaStatus === "success" ? "border-emerald-500/50 bg-emerald-950/10 cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {captchaStatus === "idle" && (
                        <div className="w-6 h-6 rounded-lg border-2 border-neutral-600 bg-black flex items-center justify-center transition-transform hover:scale-110" />
                      )}
                      {captchaStatus === "loading" && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <Loader2 size={20} className="text-blue-400 animate-spin" />
                        </div>
                      )}
                      {captchaStatus === "success" && (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-black shadow-lg animate-fadeIn">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-neutral-200">
                        {captchaStatus === "idle" && "Clique para verificar que você é humano"}
                        {captchaStatus === "loading" && "Verificando segurança..."}
                        {captchaStatus === "success" && "Verificação bem-sucedida"}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <ShieldAlert size={16} className={captchaStatus === "success" ? "text-emerald-400" : "text-neutral-500"} />
                      <span className="text-[9px] text-neutral-500 mt-0.5">Cloudflare Shield</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-white hover:bg-neutral-200 text-black py-3.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
                >
                  <LogIn size={16} />
                  <span>Entrar na Conta</span>
                </button>
              </form>
            )}

            {authMode === "register" && (
              <form onSubmit={handleRegister} className="w-full space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Nome de Usuário</label>
                  <input
                    type="text"
                    placeholder="Escolha um usuário"
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Senha (sem pontos ou underscores)</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Crie uma senha forte"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 pr-10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} className="animate-fadeIn" /> : <Eye size={16} className="animate-fadeIn" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Avatar</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FolderOpen size={15} />
                    <span>Trocar foto do PC</span>
                  </button>
                </div>

                <div className="pt-1 animate-fadeIn">
                  <div 
                    onClick={handleRunCaptcha}
                    className={`w-full bg-black border border-neutral-800 hover:border-neutral-700 rounded-2xl p-3.5 flex items-center justify-between transition-all select-none ${
                      captchaStatus === "success" ? "border-emerald-500/50 bg-emerald-950/10 cursor-default" : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {captchaStatus === "idle" && (
                        <div className="w-6 h-6 rounded-lg border-2 border-neutral-600 bg-black flex items-center justify-center transition-transform hover:scale-110" />
                      )}
                      {captchaStatus === "loading" && (
                        <div className="w-6 h-6 flex items-center justify-center">
                          <Loader2 size={20} className="text-blue-400 animate-spin" />
                        </div>
                      )}
                      {captchaStatus === "success" && (
                        <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-black shadow-lg animate-fadeIn">
                          <Check size={16} strokeWidth={3} />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-neutral-200">
                        {captchaStatus === "idle" && "Clique para verificar que você é humano"}
                        {captchaStatus === "loading" && "Verificando segurança..."}
                        {captchaStatus === "success" && "Verificação bem-sucedida"}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <ShieldAlert size={16} className={captchaStatus === "success" ? "text-emerald-400" : "text-neutral-500"} />
                      <span className="text-[9px] text-neutral-500 mt-0.5">Cloudflare Shield</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-white hover:bg-neutral-200 text-black py-3.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
                >
                  <UserPlus size={16} />
                  <span>Criar Conta Agora</span>
                </button>
              </form>
            )}

            {authMode === "admin" && (
              <form onSubmit={handleAdminLogin} className="w-full space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Senha do Administrador</label>
                  <div className="relative">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="Senha dos Admins (Mv / Davi)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 pr-10 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff size={16} className="animate-fadeIn" /> : <Eye size={16} className="animate-fadeIn" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1 block">O nome será reconhecido automaticamente (Mv ou Davi).</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black py-3.5 px-4 rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
                >
                  <ShieldAlert size={16} />
                  <span>Entrar como Admin</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {chatAberto && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[440px] h-[580px] max-h-[80vh] bg-black border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          
          <div className="bg-black border-b border-neutral-800 px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700 overflow-hidden flex items-center justify-center text-white font-bold text-xs">
                  <img src={isAdminMode ? (activeConv?.clientAvatar || "https://cdn.discordapp.com/embed/avatars/0.png") : currentClientAvatar} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-xs text-white">
                    {isAdminMode ? `Chat: ${activeConv?.clientName || "Cliente"}` : `Suporte (${currentClientName})`}
                  </h4>
                  {isAdminMode && (
                    <span className="bg-amber-500/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded font-semibold">Admin ({currentClientName})</span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">
                  {isAdminMode ? `Status: ${activeConv?.status || "Aberto"}` : "Respondemos em instantes"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setChatAberto(false)}
                className="w-7 h-7 rounded-full bg-neutral-900 hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <Minimize2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {isAdminMode && (
              <div className="w-1/3 bg-black border-r border-neutral-800 flex flex-col">
                <div className="p-2 border-b border-neutral-800">
                  <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-white"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-[10px] text-neutral-500 text-center py-4">Nenhuma conversa ativa.</p>
                  ) : (
                    conversations
                      .filter(c => c.clientName.toLowerCase().includes(adminSearchTerm.toLowerCase()))
                      .map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => setActiveConversationId(conv.id)}
                          className={`p-2.5 border-b border-neutral-900 cursor-pointer transition-colors flex items-center gap-2 ${
                            activeConversationId === conv.id ? 'bg-neutral-900' : 'hover:bg-neutral-950'
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-900 flex-shrink-0 border border-neutral-800">
                            <img src={conv.clientAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-white truncate">{conv.clientName}</span>
                              <span className="text-[9px] text-neutral-500">{conv.lastTime}</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5">{conv.lastMessage}</p>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            <div className="flex-1 flex flex-col bg-black">
              {isAdminMode && (
                <div className="bg-black border-b border-neutral-800 px-3 py-1.5 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Status: <strong className="text-white">{activeConv?.status || "Fechado"}</strong></span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setConversations(prev => prev.map(c => c.id === activeConversationId ? {...c, status: "Em atendimento"} : c))
                      }}
                      className="hover:text-amber-400 transition-colors cursor-pointer font-medium"
                    >
                      Atender
                    </button>
                    <button 
                      onClick={() => {
                        setConversations(prev => prev.filter(c => c.id !== activeConversationId))
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors cursor-pointer font-bold"
                    >
                      Fechar conversa
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {!activeConv || activeConv.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500">
                    <MessageSquare size={32} className="mb-2 opacity-40 animate-pulse" />
                    <p className="text-xs">Envie uma mensagem para iniciar o suporte em tempo real.</p>
                  </div>
                ) : (
                  activeConv.messages.map((msg) => {
                    const isMe = isAdminMode ? msg.senderRole === "admin" : msg.senderRole === "client"
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                          <span className="text-[10px] text-neutral-400 font-medium">{msg.senderName}</span>
                          <span className="text-[9px] text-neutral-600">{msg.timestamp}</span>
                        </div>
                        <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md' 
                            : 'bg-neutral-900 text-neutral-100 rounded-bl-none border border-neutral-800'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={enviarMensagemChat} className="p-3 bg-black border-t border-neutral-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  className="flex-1 bg-black border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!isLoggedIn) {
            setShowAuthModal(true)
            setAuthMode("login")
          } else {
            setChatAberto(!chatAberto)
          }
        }}
        className="fixed bottom-6 right-6 z-50 bg-white hover:bg-neutral-200 text-black p-4 rounded-full shadow-2xl shadow-white/25 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer group"
        title="Abrir Chat de Suporte"
      >
        <MessageSquare size={24} className="animate-pulse" />
      </button>

      <div className="max-w-7xl mx-auto w-full pb-20 relative z-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-neutral-900 pb-6 pt-2">
          <div className="flex flex-wrap items-center gap-3 w-full justify-between">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownAberto(!dropdownAberto)}
                className="flex items-center justify-between bg-black hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-xl px-4 py-3 gap-3 text-xs text-neutral-200 transition-all duration-200 cursor-pointer active:scale-95 group min-w-[170px]"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-neutral-400 group-hover:text-white transition-colors flex-shrink-0" />
                  <span className="font-medium">{getSortLabel()}</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`text-neutral-400 transition-transform duration-300 ${dropdownAberto ? "rotate-180 text-white" : ""}`} 
                />
              </button>

              {dropdownAberto && (
                <div className="absolute left-0 mt-2 w-52 bg-black border border-neutral-800 rounded-2xl p-1.5 shadow-2xl z-50 animate-dropdownSlide">
                  <button
                    onClick={() => {
                      setSortBy("todos")
                      setDropdownAberto(false)
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      sortBy === "todos" 
                        ? "bg-neutral-900 text-white shadow-md" 
                        : "text-neutral-400 hover:text-white hover:bg-neutral-950"
                    }`}
                  >
                    <span>Todos</span>
                    {sortBy === "todos" && <Check size={14} className="text-white" />}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("menor-preco")
                      setDropdownAberto(false)
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      sortBy === "menor-preco" 
                        ? "bg-neutral-900 text-white shadow-md" 
                        : "text-neutral-400 hover:text-white hover:bg-neutral-950"
                    }`}
                  >
                    <span>Menor preço</span>
                    {sortBy === "menor-preco" && <Check size={14} className="text-white" />}
                  </button>

                  <button
                    onClick={() => {
                      setSortBy("maior-preco")
                      setDropdownAberto(false)
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${
                      sortBy === "maior-preco" 
                        ? "bg-neutral-900 text-white shadow-md" 
                        : "text-neutral-400 hover:text-white hover:bg-neutral-950"
                    }`}
                  >
                    <span>Maior preço</span>
                    {sortBy === "maior-preco" && <Check size={14} className="text-white" />}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
              <div className="relative flex-1 transition-all duration-300 focus-within:scale-[1.02]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-transform duration-300" size={16} />
                <input
                  type="text"
                  placeholder="Buscar itens, contas, assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-all duration-300"
                />
              </div>

              <div className="relative" ref={modalNotificacaoRef}>
                <button
                  onClick={abrirNotificacoes}
                  className="relative bg-black hover:bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-200 p-3 rounded-xl transition-all duration-300 flex items-center justify-center cursor-pointer active:scale-95"
                  title="Notificações"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {modalNotificacoesAberto && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-black border border-neutral-800 rounded-3xl p-5 shadow-2xl z-50 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-neutral-300" />
                        <h3 className="font-bold text-sm text-white">Notificações</h3>
                      </div>
                      <button 
                        onClick={() => setModalNotificacoesAberto(false)}
                        className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors cursor-pointer shadow-lg active:scale-95"
                        title="Fechar"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-none">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-neutral-500 text-center py-6">Nenhuma notificação no momento.</p>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            className="p-3.5 rounded-2xl bg-black border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col gap-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-neutral-900 overflow-hidden flex items-center justify-center border border-neutral-800">
                                  <img 
                                    src={notif.authorAvatar || "https://cdn.discordapp.com/embed/avatars/0.png"} 
                                    alt={notif.author} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span className="text-xs font-bold text-white">{notif.author}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-neutral-500">{notif.time}</span>
                                <button
                                  onClick={() => removerNotificacao(notif.id)}
                                  className="text-neutral-500 hover:text-red-400 p-1 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir notificação"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <p className="text-xs text-neutral-200 leading-relaxed break-words">
                              {renderContentWithLinks(notif.content)}
                            </p>

                            {notif.images && notif.images.length > 0 && (
                              <div className="grid grid-cols-1 gap-2 mt-1">
                                {notif.images.map((imgUrl, i) => (
                                  <div key={i} className="rounded-xl overflow-hidden bg-black border border-neutral-800 max-h-48 flex items-center justify-center">
                                    <img src={imgUrl} alt="Anexo" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
                        <button
                          onClick={limparNotificacoes}
                          className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-neutral-800 transition-all cursor-pointer active:scale-95"
                        >
                          Limpar Tudo
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black border border-neutral-800 text-neutral-400 text-xs font-medium">
            <ShieldCheck size={14} className="text-neutral-300" />
            <span>Marketplace Verificado & Seguro</span>
          </div>
        </div>

        {filteredAccounts.length === 0 ? (
          <div className="text-center py-24 bg-black border border-neutral-800 rounded-3xl animate-fadeIn">
            <ShoppingBag size={48} className="mx-auto text-neutral-600 mb-4 animate-pulse" />
            <h3 className="text-lg font-semibold text-neutral-300">Nenhum item encontrado</h3>
            <p className="text-sm text-neutral-500 mt-1">Tente pesquisar por outro termo no catálogo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedAccounts.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-black border border-neutral-800 rounded-[2rem] overflow-hidden hover:border-neutral-600 hover:shadow-2xl transition-all duration-300 flex flex-col transform hover:-translate-y-1.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100"
                    />
                    
                    <div className="absolute top-3 right-3 bg-black/90 backdrop-blur-md border border-neutral-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 shadow-lg">
                      <Star size={12} className="fill-amber-400" />
                      <span>Top Seller</span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 text-xs text-neutral-400">
                          <UserCheck size={13} className="text-neutral-400 flex-shrink-0" />
                          <div className="flex items-center">
                            <span className="truncate">{item.seller}</span>
                            {item.verified && (
                              <img 
                                src="https://cdn.discordapp.com/attachments/1532243391314919456/1532244408831967353/141534c31edfe922c168d5f8cbbd4bda-removebg-preview.png?ex=6a6c254e&is=6a6ad3ce&hm=7b9405f0d397b27b12846e323dc1e5b58e74497d9264eca2a4d4d6dd07118fc8&" 
                                alt="Verificado" 
                                className="w-3.5 h-3.5 object-contain ml-0.5 flex-shrink-0" 
                                title="Vendedor Verificado"
                              />
                            )}
                          </div>
                        </div>
                        <span className="bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-lg text-[10px] font-medium text-neutral-300">
                          {item.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs text-neutral-100 line-clamp-2 group-hover:text-white transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      <button
                        onClick={() => abrirGaleria(item)}
                        className="w-full mt-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Veja mais imagens</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t border-neutral-800 flex items-center justify-between mt-auto">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-semibold text-neutral-400">R$</span>
                        <span className="text-sm font-extrabold text-white">{formatMoney(item.price)}</span>
                      </div>
                      <a
                        href="https://discord.gg/kedJkEu3sH"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleAction(item)}
                        className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all duration-300 cursor-pointer border border-neutral-800"
                      >
                        <span>Comprar</span>
                        <ArrowRight size={13} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-4 mt-10">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 bg-black hover:bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-95"
              >
                <ChevronLeft size={16} />
                <span>Anterior</span>
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      currentPage === page
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-black border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1.5 bg-black hover:bg-neutral-900 border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg active:scale-95"
              >
                <span>Próxima</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes floatUp {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          80% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes dropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-floatUp {
          animation: floatUp 3.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-dropdownSlide {
          animation: dropdownSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}