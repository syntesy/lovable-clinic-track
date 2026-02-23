import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, CheckCheck } from "lucide-react";
import { useAcademyNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useAcademyNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AcademyNotificationsPage() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useAcademyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Badge variant="secondary" className="mb-4"><Bell className="w-3 h-3 mr-1" />Notificações</Badge>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Notificações</h1>
              <p className="text-muted-foreground">{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" className="gap-1" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <Card
                  key={n.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}
                  onClick={() => {
                    if (!n.is_read) markRead.mutate(n.id);
                    if (n.link_url) navigate(n.link_url);
                  }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                          <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        </div>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
