import { Badge } from '@/components/ui/badge';
import { FollowupStatus, STATUS_LABELS } from '@/types/followup';
import { CheckCircle, Clock, XCircle, Ban } from 'lucide-react';

interface FollowupStatusBadgeProps {
  status: FollowupStatus;
}

export function FollowupStatusBadge({ status }: FollowupStatusBadgeProps) {
  const config: Record<FollowupStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    pending: {
      variant: 'secondary',
      icon: <Clock className="h-3 w-3 mr-1" />,
    },
    completed: {
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
    },
    missed: {
      variant: 'destructive',
      icon: <XCircle className="h-3 w-3 mr-1" />,
    },
    cancelled: {
      variant: 'outline',
      icon: <Ban className="h-3 w-3 mr-1" />,
    },
  };

  const { variant, icon } = config[status];

  return (
    <Badge variant={variant} className="flex items-center w-fit">
      {icon}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
