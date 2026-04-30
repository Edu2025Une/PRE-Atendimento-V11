import { useState, FormEvent } from 'react';
import { useLocation } from 'wouter';
import {
  apiListUsers,
  apiUpdateUser,
  apiDeleteUser,
  apiListTenants,
  apiCreateTenant,
  AppUser,
  Tenant,
} from '@workspace/api-client-react';
import { useAuthContext } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function WhatsAppLogo() {
  return (
    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.136.563 4.14 1.542 5.877L.057 23.943 6.29 22.48A11.942 11.942 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.878 9.878 0 01-5.031-1.372l-.361-.214-3.741.981.998-3.648-.235-.374A9.857 9.857 0 012.106 12c0-5.458 4.436-9.894 9.894-9.894 5.458 0 9.894 4.436 9.894 9.894s-4.436 9.894-9.894 9.894z" />
    </svg>
  );
}

/* ── Users Tab ─────────────────────────────────────────────────────── */

function UsersTab({ token }: { token: string }) {
  const qc = useQueryClient();
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<string>('user');
  const [editName, setEditName] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [actionError, setActionError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', token],
    queryFn: () => apiListUsers(token),
  });

  const users: AppUser[] = data?.data ?? [];

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiUpdateUser(token, id, { active }),
    onSuccess: (res) => {
      if (res.success) {
        setActionError('');
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        setActionError(res.error ?? 'Falha ao atualizar status do usuário.');
      }
    },
    onError: () => setActionError('Erro de rede ao atualizar usuário.'),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiDeleteUser(token, id),
    onSuccess: (res) => {
      if (res.success) {
        setActionError('');
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        setActionError(res.error ?? 'Falha ao excluir usuário.');
      }
    },
    onError: () => setActionError('Erro de rede ao excluir usuário.'),
  });

  function openEdit(u: AppUser) {
    setEditUser(u);
    setEditRole(u.role);
    setEditName(u.name);
    setEditError('');
  }

  async function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditSaving(true);
    setEditError('');
    try {
      const res = await apiUpdateUser(token, editUser.id, {
        name: editName.trim(),
        role: editRole,
      });
      if (res.success) {
        setEditUser(null);
        qc.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        setEditError(res.error ?? 'Falha ao salvar.');
      }
    } catch {
      setEditError('Erro de rede.');
    } finally {
      setEditSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">Carregando usuários...</div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="py-12 text-center text-red-400 text-sm">
        {data?.error ?? 'Erro ao carregar usuários.'}
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <div className="mb-4 bg-red-900/30 border border-red-800 rounded-md px-4 py-2 text-red-400 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="ml-4 text-red-400 hover:text-red-200 text-lg leading-none">×</button>
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Papel</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-slate-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                <td className="px-4 py-3 text-white">{u.name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3 text-slate-400">
                  {u.tenants?.name ?? <span className="text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      u.role === 'admin'
                        ? 'border-purple-500 text-purple-400 bg-purple-900/20'
                        : 'border-slate-600 text-slate-400'
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      u.active
                        ? 'border-green-600 text-green-400 bg-green-900/20'
                        : 'border-red-700 text-red-400 bg-red-900/20'
                    }
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs h-7 px-2"
                      onClick={() => openEdit(u)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggleActive.isPending}
                      className={
                        u.active
                          ? 'border-amber-700 text-amber-400 hover:bg-amber-900/20 text-xs h-7 px-2'
                          : 'border-green-700 text-green-400 hover:bg-green-900/20 text-xs h-7 px-2'
                      }
                      onClick={() => toggleActive.mutate({ id: u.id, active: !u.active })}
                    >
                      {u.active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-800 text-red-400 hover:bg-red-900/20 text-xs h-7 px-2"
                        >
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-400">
                            Tem certeza que deseja excluir <strong>{u.name}</strong>? Essa ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-700 hover:bg-red-600 text-white"
                            onClick={() => deleteUser.mutate(u.id)}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-slate-300">Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300">Papel</Label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full rounded-md border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            {editError && <p className="text-red-400 text-sm">{editError}</p>}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => setEditUser(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={editSaving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {editSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── Tenants Tab ───────────────────────────────────────────────────── */

function TenantsTab({ token }: { token: string }) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-tenants', token],
    queryFn: () => apiListTenants(token),
  });

  const tenants: Tenant[] = data?.data ?? [];

  function slugify(val: string) {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function handleNameChange(val: string) {
    setTenantName(val);
    setTenantSlug(slugify(val));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const res = await apiCreateTenant(token, {
        name: tenantName.trim(),
        slug: tenantSlug.trim(),
      });
      if (res.success) {
        setCreateOpen(false);
        setTenantName('');
        setTenantSlug('');
        qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      } else {
        setCreateError(res.error ?? 'Falha ao criar tenant.');
      }
    } catch {
      setCreateError('Erro de rede.');
    } finally {
      setCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 text-sm">Carregando tenants...</div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="py-12 text-center text-red-400 text-sm">
        {data?.error ?? 'Erro ao carregar tenants.'}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-400">
          {tenants.length} {tenants.length === 1 ? 'tenant' : 'tenants'}
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white text-sm h-8 px-3">
              + Novo tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle>Criar novo tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label className="text-slate-300">Nome *</Label>
                <Input
                  value={tenantName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Minha Empresa"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-slate-300">Slug *</Label>
                <Input
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                  placeholder="minha-empresa"
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-green-500"
                />
                <p className="text-xs text-slate-500">Identificador único, somente letras, números e hífens.</p>
              </div>
              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {creating ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 border-b border-slate-700">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Nome</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Criado em</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                <td className="px-4 py-3 text-white">{t.name}</td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{t.slug}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      t.active
                        ? 'border-green-600 text-green-400 bg-green-900/20'
                        : 'border-red-700 text-red-400 bg-red-900/20'
                    }
                  >
                    {t.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {new Date(t.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                  Nenhum tenant encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Admin Page ────────────────────────────────────────────────────── */

type Tab = 'users' | 'tenants';

export default function AdminPage() {
  const { user, token, logout } = useAuthContext();
  const [tab, setTab] = useState<Tab>('users');
  const [, navigate] = useLocation();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium mb-2">Acesso negado</p>
          <p className="text-slate-500 text-sm">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <WhatsAppLogo />
          </div>
          <span className="font-semibold">PRE-Atendimento</span>
          <span className="text-slate-600">·</span>
          <span className="text-purple-400 font-medium text-sm">Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Dashboard
          </button>
          <span className="text-sm text-slate-400 hidden sm:inline">
            {user.name} <span className="text-slate-600">·</span>{' '}
            <span className="text-purple-400">admin</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
            onClick={logout}
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Painel Administrativo</h2>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie usuários e tenants da plataforma.</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-slate-700">
          <button
            onClick={() => setTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'users'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Usuários
          </button>
          <button
            onClick={() => setTab('tenants')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'tenants'
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Tenants
          </button>
        </div>

        {token && tab === 'users' && <UsersTab token={token} />}
        {token && tab === 'tenants' && <TenantsTab token={token} />}
      </main>
    </div>
  );
}
