import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ExternalLink, Zap, Filter, Edit2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Curation() {
  const { user } = useAuth();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [filterRegion, setFilterRegion] = useState<string>("global");

  const { data: contentItems, isLoading: itemsLoading } = trpc.content.getRecent.useQuery({
    limit: 100,
  });

  const { data: sources } = trpc.sources.getAll.useQuery();
  const analyzeContentMutation = trpc.content.analyzeWithAI.useMutation();

  const handleAnalyzeContent = async (item: any) => {
    try {
      await analyzeContentMutation.mutateAsync({
        contentItemId: item.id,
        title: item.title,
        description: item.description || "",
        content: item.content || "",
      });
      toast.success("Conteúdo analisado com sucesso!");
    } catch (error) {
      toast.error("Erro ao analisar conteúdo");
      console.error(error);
    }
  };

  const impactColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  };

  const maturityColors: Record<string, string> = {
    advanced: "bg-purple-100 text-purple-800",
    intermediate: "bg-blue-100 text-blue-800",
    beginner: "bg-green-100 text-green-800",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Curadoria de Conteúdo</h1>
          <p className="text-muted-foreground mt-2">
            Selecione e analise conteúdo com IA para o próximo episódio
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {["global", "brasil", "usa", "china"].map((region) => (
                <Button
                  key={region}
                  variant={filterRegion === region ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRegion(region)}
                  className="capitalize"
                >
                  {region === "usa" ? "EUA" : region.charAt(0).toUpperCase() + region.slice(1)}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Items */}
        <Card>
          <CardHeader>
            <CardTitle>Itens de Conteúdo Disponíveis</CardTitle>
            <CardDescription>
              {contentItems?.length || 0} itens coletados das fontes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !contentItems || contentItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum conteúdo disponível no momento. Configure as fontes RSS primeiro.
              </div>
            ) : (
              <div className="space-y-3">
                {contentItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(selectedItems.filter((id) => id !== item.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm hover:underline flex items-center gap-1"
                        >
                          {item.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {new Date(item.fetchedAt).toLocaleDateString("pt-BR")}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Editar item"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyzeContent(item)}
                          disabled={analyzeContentMutation.isPending}
                          className="whitespace-nowrap"
                          title="Analisar com IA"
                        >
                          {analyzeContentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Zap className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Deletar item"
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

        {/* Sources Overview */}
        {sources && sources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fontes Monitoradas</CardTitle>
              <CardDescription>{sources.length} fontes ativas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((source: any) => (
                  <div key={source.id} className="p-3 border rounded-lg text-sm">
                    <div className="font-medium truncate">{source.name}</div>
                    <div className="text-xs text-muted-foreground mt-1 capitalize">
                      {source.region === "usa" ? "EUA" : source.region}
                    </div>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {source.sourceType}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
