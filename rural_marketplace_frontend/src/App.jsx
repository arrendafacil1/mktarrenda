// src/App.jsx
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { MapPin, Ruler, Info, LogOut, Plus, Edit, Trash2, Search } from 'lucide-react'
import './App.css'

import { api } from './lib/api'            // público: /api/health, /register, /login
import { fetchAuth } from './lib/fetchAuth' // protegido: /api/properties...

// Com proxy do Vite, chamamos sempre caminhos relativos começando por /api
const API_PREFIX = '/api'

// ✅ Banner de debug
const DebugBanner = () => (
  <div
    style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
      padding: "6px 10px", background: "#111", color: "#fff",
      fontSize: 12, fontFamily: "system-ui, sans-serif", opacity: 0.85,
      display: "flex", justifyContent: "space-between", alignItems: "center"
    }}
  >
    <span>✅ React montado — se a página ficar em branco, veja o Console (F12)</span>
    <span style={{ opacity: 0.6 }}>{new Date().toLocaleTimeString()}</span>
  </div>
)

export default function App() {
  console.log('[App] render iniciou…')
  console.log('🌐 Proxy ativo: chamadas via /api/...')

  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Forms
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '', role: 'produtor' })
  const [propertyForm, setPropertyForm] = useState({ name: '', location: '', size_ha: '', details: '', is_available: true })
  const [editingPropertyId, setEditingPropertyId] = useState(null)

  // Health check ao montar
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/health')
        console.log('🔎 /api/health →', data)
      } catch (err) {
        console.error('❌ Falha ao acessar /api/health:', err)
      }
    })()
  }, [])

  // Carregar sessão
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      try { setUser(JSON.parse(savedUser)) }
      catch {
        console.warn('[App] user inválido — limpando…')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  useEffect(() => {
    if (user && token) fetchProperties()
  }, [user, token])

  // Logout (mensagem opcional)
  const handleLogout = (msg = 'Sessão encerrada. Faça login novamente.') => {
    setUser(null)
    setToken(null)
    setProperties([])
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setError(msg)
  }

  // Registro (rota pública)
  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // ajuste para /auth/register se o seu backend usar esse prefixo
      const data = await api.post('/register', authForm)
      alert(data?.message || 'Cadastro criado com sucesso!')
      setAuthMode('login')
      setAuthForm({ username: '', email: '', password: '', role: 'produtor' })
    } catch (err) {
      console.error('[App] /register falhou:', err)
      setError(err?.message || 'Erro ao registrar')
    } finally { setLoading(false) }
  }

  // Login (rota pública)
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // ajuste para /auth/login se o seu backend usar esse prefixo
      const data = await api.post('/login', {
        username: authForm.username,
        password: authForm.password
      })
      setToken(data.access_token)
      setUser(data.user)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setAuthForm({ username: '', email: '', password: '', role: 'produtor' })
    } catch (err) {
      console.error('[App] /login falhou:', err)
      setError(err?.message || 'Credenciais inválidas')
    } finally { setLoading(false) }
  }

  // ===== Rotas protegidas (fetchAuth): auto-logout em 401/403 =====

  const fetchProperties = async () => {
    if (!token) { setError('Sessão expirada. Faça login novamente.'); return }
    setLoading(true); setError('')
    try {
      const data = await fetchAuth(
        `${API_PREFIX}/properties`,
        { headers: { Authorization: `Bearer ${token}` } },
        handleLogout
      )
      setProperties(Array.isArray(data) ? data : (data?.properties ?? []))
    } catch (err) {
      setError(err?.message || 'Erro de conexão com o servidor')
    } finally { setLoading(false) }
  }

  const handlePropertySubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    if (!token) { setLoading(false); setError('Sessão expirada. Faça login novamente.'); return }

    const method = editingPropertyId ? 'PUT' : 'POST'
    const url = editingPropertyId
      ? `${API_PREFIX}/properties/${editingPropertyId}`
      : `${API_PREFIX}/properties`

    try {
      await fetchAuth(
        url,
        {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(propertyForm)
        },
        handleLogout
      )
      alert(editingPropertyId ? 'Propriedade atualizada!' : 'Propriedade cadastrada!')
      setPropertyForm({ name: '', location: '', size_ha: '', details: '', is_available: true })
      setEditingPropertyId(null)
      fetchProperties()
    } catch (err) {
      setError(err?.message || 'Erro de conexão com o servidor')
    } finally { setLoading(false) }
  }

  const handleDeleteProperty = async (id) => {
    if (!confirm('Tem certeza que deseja deletar esta propriedade?')) return
    if (!token) { setError('Sessão expirada. Faça login novamente.'); return }

    setLoading(true)
    try {
      const data = await fetchAuth(
        `${API_PREFIX}/properties/${id}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        },
        handleLogout
      )
      alert(data?.message || 'Propriedade deletada!')
      fetchProperties()
    } catch (err) {
      setError(err?.message || 'Erro de conexão com o servidor')
    } finally { setLoading(false) }
  }

  const handleEditProperty = (property) => {
    setPropertyForm({
      name: property.name,
      location: property.location,
      size_ha: property.size_ha,
      details: property.details || '',
      is_available: property.is_available
    })
    setEditingPropertyId(property.id)
  }

  const handleCancelEdit = () => {
    setPropertyForm({ name: '', location: '', size_ha: '', details: '', is_available: true })
    setEditingPropertyId(null)
  }

  // ---------- RENDER ----------
  if (!user) {
    return (
      <>
        <DebugBanner />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" style={{ paddingTop: 40 }}>
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold text-center text-green-700">🌾 Marketplace Rural</CardTitle>
              <CardDescription className="text-center">Conectando proprietários e produtores rurais</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authMode} onValueChange={setAuthMode}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Registrar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Usuário</Label>
                      <Input id="username" placeholder="Digite seu usuário" value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" placeholder="Digite sua senha" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Usuário</Label>
                      <Input id="reg-username" placeholder="Escolha um usuário" value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input id="reg-email" type="email" placeholder="seu@email.com" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Senha</Label>
                      <Input id="reg-password" type="password" placeholder="Crie uma senha forte" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Tipo de Usuário</Label>
                      <select id="role" className="w-full px-3 py-2 border rounded-md" value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}>
                        <option value="produtor">Produtor Rural</option>
                        <option value="proprietario">Proprietário de Terra</option>
                      </select>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (user.role === 'proprietario') {
    return (
      <>
        <DebugBanner />
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 40 }}>
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-green-700">🌾 Minhas Propriedades</h1>
                <p className="text-gray-600">Bem-vindo, {user.username}!</p>
              </div>
              <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {editingPropertyId ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {editingPropertyId ? 'Editar Propriedade' : 'Cadastrar Nova Propriedade'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePropertySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Propriedade</Label>
                      <Input id="name" placeholder="Ex: Fazenda Santa Maria" value={propertyForm.name} onChange={(e) => setPropertyForm({ ...propertyForm, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Localização</Label>
                      <Input id="location" placeholder="Ex: Goiás, Brasil" value={propertyForm.location} onChange={(e) => setPropertyForm({ ...propertyForm, location: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="size">Tamanho (hectares)</Label>
                      <Input id="size" type="number" step="0.01" placeholder="Ex: 150.5" value={propertyForm.size_ha} onChange={(e) => setPropertyForm({ ...propertyForm, size_ha: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="details">Detalhes</Label>
                      <Textarea id="details" placeholder="Descrição da propriedade, tipo de solo, recursos..." value={propertyForm.details} onChange={(e) => setPropertyForm({ ...propertyForm, details: e.target.value })} rows={4} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="available" checked={propertyForm.is_available} onChange={(e) => setPropertyForm({ ...propertyForm, is_available: e.target.checked })} className="h-4 w-4" />
                      <Label htmlFor="available">Disponível para arrendamento</Label>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={loading}>{loading ? 'Salvando...' : (editingPropertyId ? 'Atualizar' : 'Cadastrar')}</Button>
                      {editingPropertyId && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-800">Suas Propriedades</h2>
                {loading && <p className="text-gray-500">Carregando...</p>}
                {properties.length === 0 && !loading && <p className="text-gray-500">Nenhuma propriedade cadastrada ainda.</p>}
                {properties.map((property) => (
                  <Card key={property.id} className="shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{property.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1"><MapPin className="h-4 w-4" /> {property.location}</CardDescription>
                        </div>
                        <Badge variant={property.is_available ? "default" : "secondary"}>{property.is_available ? 'Disponível' : 'Indisponível'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-gray-700 mb-2">
                        <Ruler className="h-4 w-4" />
                        <span className="font-semibold">{property.size_ha} hectares</span>
                      </div>
                      {property.details && (
                        <div className="flex gap-2 text-gray-600 text-sm">
                          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <p>{property.details}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditProperty(property)} className="flex-1"><Edit className="mr-1 h-4 w-4" /> Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteProperty(property.id)} className="flex-1"><Trash2 className="mr-1 h-4 w-4" /> Deletar</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Produtor
  return (
    <>
      <DebugBanner />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" style={{ paddingTop: 40 }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-green-700">🌾 Propriedades Disponíveis</h1>
              <p className="text-gray-600">Bem-vindo, {user.username}!</p>
            </div>
            <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" /> Sair</Button>
          </div>

          <Card className="mb-6 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input placeholder="Pesquisar por nome ou localização..." className="pl-10" />
                </div>
                <Button onClick={fetchProperties}>Atualizar</Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading && <p className="text-gray-500 col-span-full">Carregando...</p>}
            {properties.length === 0 && !loading && <p className="text-gray-500 col-span-full">Nenhuma propriedade disponível no momento.</p>}
            {properties.map((property) => (
              <Card key={property.id} className="shadow-md hover:shadow-xl transition-all hover:scale-105">
                <CardHeader>
                  <CardTitle className="text-xl">{property.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {property.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-gray-700 mb-3">
                    <Ruler className="h-4 w-4" />
                    <span className="font-semibold">{property.size_ha} hectares</span>
                  </div>
                  {property.details && (
                    <div className="flex gap-2 text-gray-600 text-sm">
                      <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <p className="line-clamp-3">{property.details}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Entrar em Contato</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
