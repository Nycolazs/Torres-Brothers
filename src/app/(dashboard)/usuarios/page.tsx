'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw, ShieldX, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/LoadingSkeleton';
import { USER_ACCESS_STATUS_LABELS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { UserProfile } from '@/types';
import { listUserProfiles, updateUserAccessStatus } from '@/services/userService';

export default function UsuariosPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setFetching(true);
    try {
      const data = await listUserProfiles();
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }

    fetchUsers();
  }, [fetchUsers, isAdmin, loading, router, user]);

  const pendingUsers = useMemo(
    () => users.filter((profile) => profile.accessStatus === 'pending'),
    [users]
  );
  const approvedUsers = useMemo(
    () => users.filter((profile) => profile.accessStatus === 'approved'),
    [users]
  );
  const rejectedUsers = useMemo(
    () => users.filter((profile) => profile.accessStatus === 'rejected'),
    [users]
  );

  const handleStatusChange = async (
    targetUser: UserProfile,
    accessStatus: 'approved' | 'rejected'
  ) => {
    if (!user) return;

    setActionUid(targetUser.uid);
    try {
      await updateUserAccessStatus(targetUser.uid, accessStatus, user.uid);
      toast.success(
        accessStatus === 'approved'
          ? 'Usuário aprovado com sucesso.'
          : 'Acesso removido com sucesso.'
      );
      await fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar o usuário.');
    } finally {
      setActionUid(null);
    }
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Aprove cadastros pendentes e remova acessos quando precisar.
          </p>
        </div>

        <Button variant="outline" onClick={fetchUsers} disabled={fetching}>
          <RefreshCw className={`mr-2 h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
          Recarregar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprovados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{approvedUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{rejectedUsers.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fila de aprovação</CardTitle>
        </CardHeader>
        <CardContent>
          {fetching ? (
            <TableSkeleton />
          ) : pendingUsers.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Nenhum usuário pendente"
              description="Todos os cadastros já foram analisados."
            />
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.uid}
                  className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium">{pendingUser.name}</p>
                    <p className="text-sm text-muted-foreground">{pendingUser.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Cadastro em {formatDate(pendingUser.createdAt)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(pendingUser, 'approved')}
                      disabled={actionUid === pendingUser.uid}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(pendingUser, 'rejected')}
                      disabled={actionUid === pendingUser.uid}
                    >
                      <ShieldX className="mr-2 h-4 w-4" />
                      Negar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {fetching ? (
            <TableSkeleton />
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Nenhum usuário encontrado"
                description="Os cadastros aparecerão aqui assim que forem criados."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((listedUser) => {
                  const isMainAdmin = listedUser.role === 'admin';
                  const isBusy = actionUid === listedUser.uid;

                  return (
                    <TableRow key={listedUser.uid}>
                      <TableCell className="font-medium">{listedUser.name}</TableCell>
                      <TableCell>{listedUser.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {USER_ACCESS_STATUS_LABELS[listedUser.accessStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isMainAdmin ? 'default' : 'outline'}>
                          {isMainAdmin ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(listedUser.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {listedUser.accessStatus !== 'approved' && !isMainAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(listedUser, 'approved')}
                              disabled={isBusy}
                            >
                              Aprovar
                            </Button>
                          )}

                          {listedUser.accessStatus !== 'rejected' && !isMainAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(listedUser, 'rejected')}
                              disabled={isBusy}
                            >
                              Tirar acesso
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
