import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, RefreshCw, Trash2, ExternalLink, Edit2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function RSSManagement() {
  const { user } = useAuth();
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceName, setNewSourceName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: sources, isLoading: sourcesLoading, refetch } = trpc.rss.getSources.useQuery();
  const { data: status } = trpc.rss.getStatus.useQuery();

  const syncAllMutation = trpc.rss.syncAll.useMutation();
  const syncSourceMutation = trpc.rss.syncSource.useMutation();
  const createSourceMutation = trpc.sources.create.useMutation();

  const handleAddSource = async () => {
    if (!newSourceUrl || !newSourceName) {
      toast.error("Preencha nome e URL");
      return;
    }

    try {
      await createSourceMutation.mutateAsync({
        name: newSourceName,
        url: newSourceUrl,
        sourceType: "rss",
        region: "global",
      });

      setNewSourceUrl("");
      setNewSourceName("");
      await refetch();
      toast.success("Fonte adicionada com sucesso!");
    } catch (error) {
      toast.error("Erro ao adicionar fonte");
      console.error(error);
    }
  };

  const handleSyncAll = async () => {
    try {
      const result = await syncAllMutation.mutateAsync();
      toast.success(`${result.totalAdded} novos itens coletados!`);
      await refetch();
    } catch (error) {
      toast.error("Erro ao sincronizar fontes");
      console.error(error);
    }
  };

  const handleSyncSource = async (sourceId: number) => {
    try {
      const result = await syncSourceMutation.mutateAsync({ sourceId });
      if (result.itemsAdded > 0) {
        toast.success(`${result.itemsAdded} itens coletados!`);
      } else {
        toast.info("Nenhum item novo encontrado");
      }
      await refetch();
    } catch (error) {
      toast.error("Erro ao sincronizar fonte");
      console.error(error);
    }
  };

  const regionColors: Record<string, string> = {
    brasil: "bg-green-100 text-green-800",
    usa: "bg-blue-100 text-blue-800",
    china: "bg-red-100 text-red-800",
    global: "bg-purple-100 text-purple-800",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Fontes RSS</h1>
          <p className="text-muted-foreground mt-2">
            Configure e monitore as fontes de conteúdo para coleta automática
          </p>
        </div>

        {/* Sync Status */}
        {status && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">Status de Sincronização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Total de fontes:</span>
                <span className="font-semibold">{status.totalSources}</span>
              </div>
              <div className="flex justify-between">
                <span>Fontes ativas:</span>
                <span className="font-semibold">{status.activeSources}</span>
              </div>
              {status.lastSync && (
                <div className="flex justify-between">
                  <span>Última sincronização:</span>
                  <span className="font-semibold">
                    {format(new Date(status.lastSync), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sincronização</CardTitle>
            <CardDescription>
              Sincronize manualmente as fontes RSS para coletar novo conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSyncAll}
              disabled={syncAllMutation.isPending}
              className="w-full"
            >
              {syncAllMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar Todas as Fontes
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Sincronização automática ocorre a cada 30 minutos
            </p>
          </CardContent>
        </Card>

        {/* Add New Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Nova Fonte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Nome da Fonte</label>
              <Input
                placeholder="ex: MIT Technology Review"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">URL do Feed RSS</label>
              <Input
                placeholder="https://example.com/feed.xml"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddSource}
              disabled={createSourceMutation.isPending}
              className="w-full"
            >
              {createSourceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Adicionar Fonte
            </Button>
          </CardContent>
        </Card>

        {/* Sources List */}
        <Card>
          <CardHeader>
            <CardTitle>Fontes Configuradas</CardTitle>
            <CardDescription>{sources?.length || 0} fontes ativas</CardDescription>
          </CardHeader>
          <CardContent>
            {sourcesLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !sources || sources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma fonte configurada. Adicione uma para começar.
              </div>
            ) : (
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {source.name}
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {source.url}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            className={regionColors[source.region as keyof typeof regionColors]}
                          >
                            {source.region === "usa" ? "EUA" : source.region.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {source.sourceType}
                          </Badge>
                        </div>
                        {source.lastFetched && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Última coleta:{" "}
                            {format(new Date(source.lastFetched), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(source.id)}
                          title="Editar fonte"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncSource(source.id)}
                          disabled={syncSourceMutation.isPending}
                          title="Sincronizar fonte"
                        >
                          {syncSourceMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Deletar fonte"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              O sistema coleta automaticamente conteúdo de todas as fontes RSS configuradas a cada
              30 minutos.
            </p>
            <p>
              Cada item coletado é analisado por IA para classificação automática por tema,
              nível de maturidade e impacto prático.
            </p>
            <p>
              Você pode sincronizar manualmente a qualquer momento para obter o conteúdo mais
              recente imediatamente.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
