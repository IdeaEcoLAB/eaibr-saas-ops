import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Copy, CheckCircle2, Edit2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function ScriptGeneration() {
  const { user } = useAuth();
  const [episodeId, setEpisodeId] = useState<number | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const { data: upcomingEpisode } = trpc.episodes.getUpcoming.useQuery();
  const { data: script, isLoading: scriptLoading } = trpc.scripts.getByEpisode.useQuery(
    { episodeId: episodeId || 0 },
    { enabled: !!episodeId }
  );

  const generateScriptMutation = trpc.scripts.generate.useMutation();
  const generateBlogMutation = trpc.blog.generate.useMutation();
  const generateSocialMutation = trpc.social.generateMicrocontents.useMutation();

  const handleGenerateScript = async () => {
    if (!episodeId) {
      toast.error("Selecione um episódio");
      return;
    }

    try {
      // Mock curations - in production, fetch from episode curations
      const mockCurations: Array<{ section: "radar_global" | "tema_central" | "ferramenta" | "aplicacao"; items: Array<{ title: string; description: string; url: string }> }> = [
        {
          section: "radar_global" as const,
          items: [
            {
              title: "OpenAI lança novo modelo GPT-5",
              description: "Novo modelo com capacidades melhoradas",
              url: "https://example.com",
            },
          ],
        },
        {
          section: "tema_central" as const,
          items: [
            {
              title: "IA na Produtividade",
              description: "Como usar IA para aumentar produtividade",
              url: "https://example.com",
            },
          ],
        },
        {
          section: "ferramenta" as const,
          items: [
            {
              title: "Claude 3.5",
              description: "Ferramenta de IA para análise de texto",
              url: "https://example.com",
            },
          ],
        },
        {
          section: "aplicacao" as const,
          items: [
            {
              title: "Caso de Sucesso",
              description: "Empresa aumentou vendas com IA",
              url: "https://example.com",
            },
          ],
        },
      ];

      await generateScriptMutation.mutateAsync({
        episodeId,
        curations: mockCurations,
      });

      toast.success("Roteiro gerado com sucesso!");
    } catch (error) {
      toast.error("Erro ao gerar roteiro");
      console.error(error);
    }
  };

  const handleGenerateBlog = async () => {
    if (!script?.fullScript) {
      toast.error("Gere o roteiro primeiro");
      return;
    }

    try {
      await generateBlogMutation.mutateAsync({
        episodeId: episodeId!,
        podcastScript: script.fullScript,
        episodeTitle: upcomingEpisode?.title || "Episódio",
      });

      toast.success("Conteúdo do blog gerado!");
    } catch (error) {
      toast.error("Erro ao gerar blog");
    }
  };

  const handleGenerateSocial = async () => {
    if (!script?.fullScript) {
      toast.error("Gere o roteiro primeiro");
      return;
    }

    try {
      await generateSocialMutation.mutateAsync({
        episodeId: episodeId!,
        podcastScript: script.fullScript,
        episodeTitle: upcomingEpisode?.title || "Episódio",
      });

      toast.success("Conteúdo para redes sociais gerado!");
    } catch (error) {
      toast.error("Erro ao gerar conteúdo social");
    }
  };

  const copyToClipboard = (text: string | null, section: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success("Copiado para a área de transferência!");
  };

  const downloadMarkdown = () => {
    if (!script?.fullScript) return;

    const content = `# ${upcomingEpisode?.title || "Episódio"}

## Radar Global
${script.radarGlobal}

## Tema Central
${script.temaCentral}

## Ferramenta da Quinzena
${script.ferramentaQuinzena}

## Aplicação Prática
${script.aplicacaoPratica}

---

**Duração estimada:** ${script.estimatedDuration} minutos
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roteiro-ep-${episodeId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geração de Roteiros</h1>
          <p className="text-muted-foreground mt-2">
            Crie roteiros estruturados com o template fixo de 4 seções
          </p>
        </div>

        {/* Episode Selection */}
        {upcomingEpisode && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Próximo Episódio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{upcomingEpisode.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(upcomingEpisode.scheduledDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <Button
                  onClick={() => setEpisodeId(upcomingEpisode.id)}
                  variant={episodeId === upcomingEpisode.id ? "default" : "outline"}
                >
                  {episodeId === upcomingEpisode.id ? "✓ Selecionado" : "Selecionar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Controls */}
        {episodeId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gerar Conteúdo</CardTitle>
              <CardDescription>
                Crie roteiro, blog e conteúdo para redes sociais automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleGenerateScript}
                disabled={generateScriptMutation.isPending}
                className="w-full"
              >
                {generateScriptMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Gerar Roteiro Completo
              </Button>

              {script && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateBlog}
                    disabled={generateBlogMutation.isPending}
                  >
                    {generateBlogMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Gerar Blog
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateSocial}
                    disabled={generateSocialMutation.isPending}
                  >
                    {generateSocialMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Gerar Social
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Script Display */}
        {script && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Roteiro Gerado</CardTitle>
                <CardDescription>
                  Duração estimada: {script.estimatedDuration} minutos
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" title="Editar roteiro">
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={downloadMarkdown} title="Download Markdown">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" title="Deletar roteiro">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="radar" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="radar">Radar Global</TabsTrigger>
                  <TabsTrigger value="tema">Tema Central</TabsTrigger>
                  <TabsTrigger value="ferramenta">Ferramenta</TabsTrigger>
                  <TabsTrigger value="aplicacao">Aplicação</TabsTrigger>
                </TabsList>

                <TabsContent value="radar" className="space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{script.radarGlobal}</Streamdown>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.radarGlobal || "", "radar")}
                  >
                    {copiedSection === "radar" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="tema" className="space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{script.temaCentral}</Streamdown>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.temaCentral || "", "tema")}
                  >
                    {copiedSection === "tema" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="ferramenta" className="space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{script.ferramentaQuinzena}</Streamdown>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.ferramentaQuinzena || "", "ferramenta")}
                  >
                    {copiedSection === "ferramenta" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="aplicacao" className="space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{script.aplicacaoPratica}</Streamdown>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.aplicacaoPratica || "", "aplicacao")}
                  >
                    {copiedSection === "aplicacao" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
