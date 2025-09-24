import { useEffect, useRef } from "react";
import { useSoftphoneStore } from "@/store/softphoneStore";
import { Call } from "@/types/softphone";

export function useSoftphone() {
  const store = useSoftphoneStore();
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Update call durations
  useEffect(() => {
    if (store.calls.some(call => call.status === 'active')) {
      durationInterval.current = setInterval(() => {
        store.calls.forEach(call => {
          if (call.status === 'active') {
            const duration = Math.floor((Date.now() - call.startTime.getTime()) / 1000);
            store.updateCall(call.id, { duration });
          }
        });
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [store.calls, store.updateCall]);

  // Simulate incoming calls (for demo)
  const simulateIncomingCall = (number: string, name?: string) => {
    const call: Call = {
      id: `call-${Date.now()}`,
      number,
      name,
      status: 'incoming',
      startTime: new Date(),
      duration: 0,
      isMuted: false,
    };

    store.addCall(call);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallStatusText = (status: Call['status']): string => {
    switch (status) {
      case 'incoming':
        return 'Recebendo...';
      case 'outgoing':
        return 'Chamando...';
      case 'active':
        return 'Em ligação';
      case 'hold':
        return 'Em espera';
      case 'ended':
        return 'Finalizada';
      default:
        return '';
    }
  };

  return {
    ...store,
    simulateIncomingCall,
    formatDuration,
    getCallStatusText,
  };
}