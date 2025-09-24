import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Call, SoftphoneState, SoftphoneConfig } from "@/types/softphone";

interface SoftphoneStore extends SoftphoneState {
  // Actions
  setConfig: (config: SoftphoneConfig) => void;
  setRegistered: (registered: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  addCall: (call: Call) => void;
  updateCall: (callId: string, updates: Partial<Call>) => void;
  removeCall: (callId: string) => void;
  setActiveCall: (callId: string | null) => void;
  setVolume: (volume: number) => void;
  setMinimized: (minimized: boolean) => void;
  
  // Call actions
  makeCall: (number: string, name?: string) => void;
  answerCall: (callId: string) => void;
  endCall: (callId: string) => void;
  holdCall: (callId: string) => void;
  unholdCall: (callId: string) => void;
  muteCall: (callId: string) => void;
  unmuteCall: (callId: string) => void;
  transferCall: (callId: string, number: string) => void;
  
  clear: () => void;
}

export const useSoftphoneStore = create<SoftphoneStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isRegistered: false,
      isConnecting: false,
      calls: [],
      activeCallId: null,
      config: {
        enabled: false,
      },
      volume: 0.8,
      isMinimized: false,

      // Basic setters
      setConfig: (config) => set({ config }),
      setRegistered: (isRegistered) => set({ isRegistered }),
      setConnecting: (isConnecting) => set({ isConnecting }),
      setActiveCall: (activeCallId) => set({ activeCallId }),
      setVolume: (volume) => set({ volume }),
      setMinimized: (isMinimized) => set({ isMinimized }),

      // Call management
      addCall: (call) =>
        set((state) => ({
          calls: [...state.calls, call],
          activeCallId: call.id,
        })),

      updateCall: (callId, updates) =>
        set((state) => ({
          calls: state.calls.map((call) =>
            call.id === callId ? { ...call, ...updates } : call
          ),
        })),

      removeCall: (callId) =>
        set((state) => ({
          calls: state.calls.filter((call) => call.id !== callId),
          activeCallId:
            state.activeCallId === callId ? null : state.activeCallId,
        })),

      // Call actions
      makeCall: (number, name) => {
        const call: Call = {
          id: `call-${Date.now()}`,
          number,
          name,
          status: 'outgoing',
          startTime: new Date(),
          duration: 0,
          isMuted: false,
        };

        get().addCall(call);

        // Simulate call connection
        setTimeout(() => {
          get().updateCall(call.id, { status: 'active' });
        }, 2000);
      },

      answerCall: (callId) => {
        get().updateCall(callId, { status: 'active', startTime: new Date() });
      },

      endCall: (callId) => {
        get().updateCall(callId, { status: 'ended' });
        setTimeout(() => {
          get().removeCall(callId);
        }, 1000);
      },

      holdCall: (callId) => {
        get().updateCall(callId, { status: 'hold' });
      },

      unholdCall: (callId) => {
        get().updateCall(callId, { status: 'active' });
      },

      muteCall: (callId) => {
        get().updateCall(callId, { isMuted: true });
      },

      unmuteCall: (callId) => {
        get().updateCall(callId, { isMuted: false });
      },

      transferCall: (callId, number) => {
        // Simulate call transfer
        get().updateCall(callId, { status: 'ended' });
        setTimeout(() => {
          get().removeCall(callId);
        }, 1000);
      },

      clear: () =>
        set({
          isRegistered: false,
          isConnecting: false,
          calls: [],
          activeCallId: null,
          config: { enabled: false },
          volume: 0.8,
          isMinimized: false,
        }),
    }),
    {
      name: "softphone-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        config: state.config,
        volume: state.volume,
        isMinimized: state.isMinimized,
      }),
    }
  )
);