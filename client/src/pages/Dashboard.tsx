import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Podcast, BookOpen, Share2, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { format, addDays, isTuesday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: overview, isLoading } = trpc.dashboard.getOverview.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin">⏳</div>
        </div>
      </DashboardLayout>
    );
  }

  const upcomingEpisode = overview?.upcomingEpisode;
  const statusColors: Record<string, string> = {
    planning: "bg-blue-100 text-blue-800",
    curation: "bg-yellow-100 text-yellow-800",
    scripting: "bg-purple-100 text-purple-800",
    review: "bg-orange-100 text-orange-800",
    published: "bg-green-100 text-green-800",
  };

  const statusLabels: Record<string, string> = {
    planning: "Planejamento",
    curation: "Curadoria",
    scripting: "Roteirização",
    review: "Revisão",
    published: "Publicado",
  };

  // Generate next 8 weeks of editorial calendar (biweekly Tuesdays at 7 AM)
  const generateEditorialCalendar = () => {
    const calendar = [];
    let currentDate = new Date();
    
    for (let i = 0; i < 8; i++) {
      // Find next Tuesday
      while (!isTuesday(currentDate)) {
        currentDate = addDays(currentDate, 1);
      }
      
      if (i > 0 && i % 2 === 0) {
        calendar.push({
          date: new Date(currentDate),
          episodeNumber: Math.floor(i / 2),
          isLive: true,
        });
      }
      
      currentDate = addDays(currentDate, 14); // Move to next biweekly Tuesday
    }
    
    return calendar;
  };

  const editorialCalendar = generateEditorialCalendar();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.name || "Curador"}</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie a produção de conteúdo do eAI BR? de forma centralizada
          </p>
        </div>

        {/* Upcoming Episode Card */}
        {upcomingEpisode && (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Podcast className="h-5 w-5" />
                    Próximo Episódio
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(upcomingEpisode.scheduledDate), "EEEE, d 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </CardDescription>
                </div>
                <Badge className={statusColors[upcomingEpisode.status as keyof typeof statusColors]}>
                  {statusLabels[upcomingEpisode.status as keyof typeof statusLabels]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Progresso da Curadoria</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round((upcomingEpisode.curationProgress as any) * 100)}%
                  </span>
                </div>
                <Progress value={(upcomingEpisode.curationProgress as any) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" className="w-full">
                  <Zap className="h-4 w-4 mr-1" />
                  Curar
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Roteiro
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Blog
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Share2 className="h-4 w-4 mr-1" />
                  Social
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fontes Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalSources || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Monitoradas ativamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pilares Editoriais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalPillars || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Categorias de conteúdo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Episódios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.recentEpisodes?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Últimos 10 episódios</p>
            </CardContent>
          </Card>
        </div>

        {/* Editorial Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário Editorial
            </CardTitle>
            <CardDescription>
              Próximas lives às terças-feiras às 7h AM (formato quinzenal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {editorialCalendar.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="font-semibold text-sm">
                    {format(item.date, "d MMM", { locale: ptBR })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(item.date, "EEEE", { locale: ptBR })}
                  </div>
                  <div className="text-xs font-medium mt-2 text-primary">
                    Ep. {item.episodeNumber}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    🔴 7:00 AM
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Episodes */}
        {overview?.recentEpisodes && overview.recentEpisodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Episódios Recentes</CardTitle>
              <CardDescription>Últimas produções</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overview.recentEpisodes.slice(0, 5).map((episode: any) => (
                  <div
                    key={episode.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{episode.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(episode.scheduledDate), "d 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                    <Badge className={statusColors[episode.status as keyof typeof statusColors]}>
                      {statusLabels[episode.status as keyof typeof statusLabels]}
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
