import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, FileText, Rss, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">eAI BR? Ops</h1>
          <p className="text-xl text-gray-600 mb-8">
            Plataforma de Gestão de Curadoria e Roteirização de Podcasts
          </p>
          <p className="text-gray-500 mb-8">
            Automatize a coleta de conteúdo, curadoria inteligente e geração de roteiros para seu podcast.
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" className="px-8">
              Fazer Login
            </Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Bem-vindo, {user?.name}!</h1>
          <p className="text-lg text-gray-600">Escolha uma seção para começar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dashboard Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/dashboard")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <LayoutDashboard className="h-6 w-6 text-blue-600" />
                <CardTitle>Dashboard</CardTitle>
              </div>
              <CardDescription>Visão geral do próximo episódio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Acompanhe o status de curadoria, calendário editorial e progresso de publicação.
              </p>
            </CardContent>
          </Card>

          {/* Curation Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/curation")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-6 w-6 text-green-600" />
                <CardTitle>Curadoria</CardTitle>
              </div>
              <CardDescription>Selecione e analise conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Revise conteúdo coletado, classifique por tema e selecione itens para o episódio.
              </p>
            </CardContent>
          </Card>

          {/* Script Generation Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/scripts")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-6 w-6 text-purple-600" />
                <CardTitle>Roteiros</CardTitle>
              </div>
              <CardDescription>Gere roteiros de podcast</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Crie roteiros com template fixo e gere conteúdo para blog e redes sociais.
              </p>
            </CardContent>
          </Card>

          {/* RSS Management Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setLocation("/rss")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Rss className="h-6 w-6 text-orange-600" />
                <CardTitle>Fontes RSS</CardTitle>
              </div>
              <CardDescription>Gerencie feeds de conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Configure e monitore coleta automática de feeds das 3 regiões (EUA, China, Brasil).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Como Funciona</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              <strong>1. Coleta Automática:</strong> O sistema coleta continuamente feeds RSS de fontes internacionais (EUA, China) e nacionais (Brasil) a cada 30 minutos.
            </p>
            <p>
              <strong>2. Análise com IA:</strong> Cada item é automaticamente classificado por tema, nível de maturidade e impacto prático.
            </p>
            <p>
              <strong>3. Curadoria Humana:</strong> Você revisa e seleciona os melhores itens para seu episódio.
            </p>
            <p>
              <strong>4. Geração de Roteiro:</strong> Crie roteiros com o template fixo (Radar Global, Tema Central, Ferramenta, Aplicação Prática).
            </p>
            <p>
              <strong>5. Publicação Automática:</strong> Gere conteúdo para blog e 4 plataformas de redes sociais em um clique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
