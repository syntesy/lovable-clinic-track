import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAcademyProduct, useCourseModules } from "@/hooks/useAcademyProducts";
import {
  useEnrollmentForProduct, useLessonProgressForProduct,
  useUpdateLessonProgress, getSignedVideoUrl, getSignedFileUrl,
} from "@/hooks/useAcademyEnrollments";
import { ArrowLeft, BookOpen, Check, CheckCircle, Lock, Play, FileDown } from "lucide-react";
import { toast } from "sonner";

const CoursePlayerPage = () => {
  const { productId, lessonId } = useParams<{ productId: string; lessonId?: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading: loadingProduct } = useAcademyProduct(productId);
  const { data: modules = [] } = useCourseModules(productId);
  const { data: enrollment, isLoading: loadingEnrollment } = useEnrollmentForProduct(productId);
  const { data: progressList = [] } = useLessonProgressForProduct(productId);
  const updateProgress = useUpdateLessonProgress();

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Flatten lessons
  const allLessons = modules.flatMap(m =>
    (m.lessons || []).map(l => ({ ...l, moduleName: m.title, moduleId: m.id }))
  );

  const currentLesson = lessonId
    ? allLessons.find(l => l.id === lessonId)
    : allLessons[0];

  const completedLessonIds = new Set(progressList.filter(p => p.completed).map(p => p.lesson_id));
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter(l => completedLessonIds.has(l.id)).length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const hasAccess = enrollment?.access_status === 'active';

  // Load signed video URL
  const loadVideo = useCallback(async () => {
    if (!currentLesson?.video_url || !hasAccess) {
      setVideoUrl(null);
      return;
    }
    setLoadingVideo(true);
    try {
      const url = await getSignedVideoUrl(currentLesson.video_url);
      setVideoUrl(url);
    } catch {
      setVideoUrl(null);
    } finally {
      setLoadingVideo(false);
    }
  }, [currentLesson?.id, currentLesson?.video_url, hasAccess]);

  useEffect(() => { loadVideo(); }, [loadVideo]);

  const handleMarkComplete = () => {
    if (!currentLesson || !productId) return;
    updateProgress.mutate({
      lessonId: currentLesson.id,
      completed: true,
      productId,
    });
  };

  const handleMarkIncomplete = () => {
    if (!currentLesson || !productId) return;
    updateProgress.mutate({
      lessonId: currentLesson.id,
      completed: false,
      productId,
    });
  };

  if (loadingProduct || loadingEnrollment) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  if (!product) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Curso não encontrado</div>;
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h2>
            <p className="text-muted-foreground mb-4">Você não possui acesso a este curso.</p>
            <Button onClick={() => navigate(`/academy/marketplace/${productId}`)}>Ver no Marketplace</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCurrentLessonComplete = currentLesson ? completedLessonIds.has(currentLesson.id) : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-80 xl:w-96 border-r bg-card overflow-y-auto lg:h-screen lg:sticky lg:top-0">
          <div className="p-4 border-b">
            <Button variant="ghost" size="sm" className="mb-2" onClick={() => navigate('/academy/minhas-compras')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Minhas Compras
            </Button>
            <h2 className="font-bold text-foreground truncate">{product.title}</h2>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <span>{completedCount}/{totalLessons} aulas</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </div>

          <nav className="p-2">
            {modules.map(mod => (
              <div key={mod.id} className="mb-3">
                <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {mod.title}
                </p>
                {mod.lessons?.map(lesson => {
                  const isActive = lesson.id === currentLesson?.id;
                  const isDone = completedLessonIds.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                      onClick={() => navigate(`/academy/curso/${productId}/aula/${lesson.id}`)}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <Play className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="truncate">{lesson.title}</span>
                      {lesson.duration_seconds && (
                        <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                          {Math.ceil(lesson.duration_seconds / 60)}min
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto">
              {/* Video Player */}
              {currentLesson.video_url && (
                <div className="mb-6">
                  {loadingVideo ? (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Carregando vídeo...</p>
                    </div>
                  ) : videoUrl ? (
                    <video
                      ref={videoRef}
                      key={videoUrl}
                      src={videoUrl}
                      controls
                      controlsList="nodownload"
                      onContextMenu={e => e.preventDefault()}
                      className="w-full rounded-lg aspect-video bg-black"
                      onEnded={handleMarkComplete}
                    />
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Vídeo indisponível</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lesson Info */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {currentLesson.moduleName}
                  </p>
                  <h1 className="text-2xl font-bold text-foreground">{currentLesson.title}</h1>
                </div>
                <Button
                  variant={isCurrentLessonComplete ? "outline" : "default"}
                  size="sm"
                  onClick={isCurrentLessonComplete ? handleMarkIncomplete : handleMarkComplete}
                  disabled={updateProgress.isPending}
                >
                  {isCurrentLessonComplete ? (
                    <><CheckCircle className="w-4 h-4 mr-2" /> Concluída</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Marcar como concluída</>
                  )}
                </Button>
              </div>

              {/* No video fallback */}
              {!currentLesson.video_url && (
                <Card className="mb-6">
                  <CardContent className="py-8 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">Esta aula não possui vídeo.</p>
                  </CardContent>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {(() => {
                  const idx = allLessons.findIndex(l => l.id === currentLesson.id);
                  const prev = idx > 0 ? allLessons[idx - 1] : null;
                  const next = idx < allLessons.length - 1 ? allLessons[idx + 1] : null;
                  return (
                    <>
                      <Button
                        variant="outline"
                        disabled={!prev}
                        onClick={() => prev && navigate(`/academy/curso/${productId}/aula/${prev.id}`)}
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                      </Button>
                      <Button
                        disabled={!next}
                        onClick={() => next && navigate(`/academy/curso/${productId}/aula/${next.id}`)}
                      >
                        Próxima →
                      </Button>
                    </>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">Nenhuma aula encontrada</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
