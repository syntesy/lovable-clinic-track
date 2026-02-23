import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAcademyNotifications, useUnreadNotificationCount, useMarkNotificationRead } from "@/hooks/useAcademyNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function AcademyNotificationBell() {
  const navigate = useNavigate();
  const { data: count = 0 } = useUnreadNotificationCount();
  const { data: notifications = [] } = useAcademyNotifications(5);
  const markRead = useMarkNotificationRead();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] bg-destructive text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h4 className="text-sm font-semibold">Notificações</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">Nenhuma notificação.</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full text-left p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${!n.is_read ? "bg-primary/5" : ""}`}
                onClick={() => {
                  if (!n.is_read) markRead.mutate(n.id);
                  if (n.link_url) navigate(n.link_url);
                  setOpen(false);
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { navigate("/academy/notificacoes"); setOpen(false); }}>
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
