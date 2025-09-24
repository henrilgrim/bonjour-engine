import { Button } from "@/components/ui/button";
import { 
  Phone, 
  PhoneOff, 
  Pause, 
  Play, 
  Mic, 
  MicOff, 
  PhoneForwarded 
} from "lucide-react";
import { Call } from "@/types/softphone";
import { useSoftphone } from "@/hooks/use-softphone";
import { cn } from "@/lib/utils";

interface CallControlsProps {
  call: Call;
  isActive?: boolean;
}

export function CallControls({ call, isActive }: CallControlsProps) {
  const { 
    answerCall, 
    endCall, 
    holdCall, 
    unholdCall, 
    muteCall, 
    unmuteCall,
    setActiveCall 
  } = useSoftphone();

  const handleAnswer = () => {
    answerCall(call.id);
    setActiveCall(call.id);
  };

  const handleEnd = () => {
    endCall(call.id);
  };

  const handleToggleHold = () => {
    if (call.status === 'hold') {
      unholdCall(call.id);
      setActiveCall(call.id);
    } else {
      holdCall(call.id);
    }
  };

  const handleToggleMute = () => {
    if (call.isMuted) {
      unmuteCall(call.id);
    } else {
      muteCall(call.id);
    }
  };

  const handleMakeActive = () => {
    if (call.status === 'hold') {
      unholdCall(call.id);
    }
    setActiveCall(call.id);
  };

  if (call.status === 'incoming') {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-success-foreground border-success/20 shadow-md"
          onClick={handleAnswer}
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-md"
          onClick={handleEnd}
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (call.status === 'ended') {
    return (
      <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
        Finalizada
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {!isActive && call.status !== 'outgoing' && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleMakeActive}
          className="h-8 w-8 p-0 border-primary/20 hover:bg-primary/10 hover:border-primary/30"
          title="Tornar ativa"
        >
          <Play className="h-3 w-3" />
        </Button>
      )}
      
      {(call.status === 'active' || call.status === 'hold') && (
        <>
          <Button
            size="sm"
            variant={call.status === 'hold' ? "default" : "outline"}
            onClick={handleToggleHold}
            className={cn(
              "h-8 w-8 p-0",
              call.status === 'hold' 
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" 
                : "border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30"
            )}
            title={call.status === 'hold' ? "Retirar da espera" : "Colocar em espera"}
          >
            {call.status === 'hold' ? (
              <Play className="h-3 w-3" />
            ) : (
              <Pause className="h-3 w-3" />
            )}
          </Button>
          
          <Button
            size="sm"
            variant={call.isMuted ? "default" : "outline"}
            onClick={handleToggleMute}
            className={cn(
              "h-8 w-8 p-0",
              call.isMuted 
                ? "bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70" 
                : "border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/30"
            )}
            title={call.isMuted ? "Desmutar" : "Mutar"}
          >
            {call.isMuted ? (
              <MicOff className="h-3 w-3" />
            ) : (
              <Mic className="h-3 w-3" />
            )}
          </Button>
        </>
      )}
      
      <Button
        size="sm"
        variant="destructive"
        onClick={handleEnd}
        className="h-8 w-8 p-0 bg-gradient-to-r from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 shadow-md"
        title="Encerrar chamada"
      >
        <PhoneOff className="h-3 w-3" />
      </Button>
    </div>
  );
}