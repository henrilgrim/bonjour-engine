import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CallControls } from "./CallControls";
import { Call } from "@/types/softphone";
import { useSoftphone } from "@/hooks/use-softphone";
import { cn } from "@/lib/utils";
import { MicOff } from "lucide-react";

interface CallItemProps {
  call: Call;
  isActive?: boolean;
}

export function CallItem({ call, isActive }: CallItemProps) {
  const { formatDuration, getCallStatusText } = useSoftphone();

  const getStatusVariant = (status: Call['status']) => {
    switch (status) {
      case 'incoming':
        return 'default';
      case 'outgoing':
        return 'secondary';
      case 'active':
        return 'success';
      case 'hold':
        return 'warning';
      case 'ended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: Call['status']) => {
    switch (status) {
      case 'incoming':
        return 'border-blue-500/20 bg-blue-500/5';
      case 'outgoing':
        return 'border-orange-500/20 bg-orange-500/5';
      case 'active':
        return 'border-success/20 bg-success/5';
      case 'hold':
        return 'border-warning/20 bg-warning/5';
      case 'ended':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return '';
    }
  };

  return (
    <div 
      className={cn(
        "bg-gradient-to-r from-card to-card/80 border border-border/30 rounded-xl p-4 transition-all duration-300 shadow-sm hover:shadow-md",
        isActive && "ring-2 ring-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20",
        getStatusColor(call.status)
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm truncate text-foreground">
              {call.name || call.number}
            </span>
            {call.isMuted && (
              <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-full border border-destructive/20">
                <MicOff className="h-3 w-3" />
                <span className="text-xs font-bold">MUDO</span>
              </div>
            )}
          </div>
          
          {call.name && (
            <div className="text-xs text-muted-foreground mb-2 font-mono">
              {call.number}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(call.status)} className="text-xs font-semibold">
              {getCallStatusText(call.status)}
            </Badge>
            
            {call.status === 'active' && (
              <div className="flex items-center gap-1 text-xs text-success font-mono">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {formatDuration(call.duration)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <CallControls call={call} isActive={isActive} />
        </div>
      </div>
    </div>
  );
}