import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CentralNotification } from "./types";

interface NotificationStore {
    notifications: CentralNotification[];
    isVisible: boolean;
    isFocused: boolean;
    viewedMessages: Set<string>;
    previewedMessages: Set<string>;
    
    addNotification: (notification: Omit<CentralNotification, "id" | "timestamp">) => string;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    setPageVisibility: (isVisible: boolean, isFocused: boolean) => void;
    markMessageAsViewed: (messageId: string) => void;
    isMessageViewed: (messageId: string) => boolean;
    markMessageAsPreviewed: (messageId: string) => void;
    isMessagePreviewed: (messageId: string) => boolean;
    clear: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            notifications: [],
            isVisible: true,
            isFocused: true,
            viewedMessages: new Set<string>(),
            previewedMessages: new Set<string>(),

            addNotification: (notification) => {
                const id = crypto.randomUUID();
                const newNotification: CentralNotification = {
                    ...notification,
                    id,
                    timestamp: new Date(),
                };

                set((state) => ({
                    notifications: [...state.notifications, newNotification],
                }));

                return id;
            },

            removeNotification: (id) =>
                set((state) => ({
                    notifications: state.notifications.filter(n => n.id !== id),
                })),

            clearAll: () => set({ notifications: [] }),

            setPageVisibility: (isVisible, isFocused) =>
                set({ isVisible, isFocused }),

            markMessageAsViewed: (messageId) =>
                set((state) => ({
                    viewedMessages: new Set([...state.viewedMessages, messageId]),
                })),

            isMessageViewed: (messageId) => get().viewedMessages.has(messageId),

            markMessageAsPreviewed: (messageId) =>
                set((state) => ({
                    previewedMessages: new Set([...state.previewedMessages, messageId]),
                })),

            isMessagePreviewed: (messageId) => get().previewedMessages.has(messageId),

            clear: () =>
                set({
                    notifications: [],
                    isVisible: true,
                    isFocused: true,
                    viewedMessages: new Set<string>(),
                    previewedMessages: new Set<string>(),
                }),
        }),
        {
            name: "notifications-store",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                notifications: state.notifications.slice(-50),
                viewedMessages: Array.from(state.viewedMessages).slice(-100),
                previewedMessages: Array.from(state.previewedMessages).slice(-100),
            }),
            merge: (persistedState: any, currentState) => ({
                ...currentState,
                ...persistedState,
                viewedMessages: new Set(persistedState?.viewedMessages || []),
                previewedMessages: new Set(persistedState?.previewedMessages || []),
            }),
        }
    )
);