import {
    onChildAdded,
    onChildChanged,
    onChildRemoved,
} from "firebase/database";
import { rtdbRefs } from "@/lib/firebase/realtime";
import { Unsubscribe } from "firebase/auth";

type QueueData = Record<string, any>;

export function listenCompanyQueues(
    accountcode: string,
    handler: (queues: { id: string; data: any }[]) => void,
    onError?: (e: unknown) => void
): () => void {
    const baseRef = rtdbRefs.queueMemberStatus(accountcode);
    const queues: QueueData = {};

    const emit = () => {
        const arr = Object.entries(queues).map(([id, data]) => ({ id, data }));
        handler(arr);
    };

    const unsubs: Unsubscribe[] = [];

    unsubs.push(
        onChildAdded(
            baseRef,
            (snap) => {
                queues[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildChanged(
            baseRef,
            (snap) => {
                queues[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildRemoved(
            baseRef,
            (snap) => {
                delete queues[snap.key!];
                emit();
            },
            (e) => onError?.(e)
        )
    );

    return () => unsubs.forEach((u) => u());
}

export function listenCompanyTotalizersQueues(
    accountcode: string,
    handler: (queues: { id: string; data: any }[]) => void,
    onError?: (e: unknown) => void
): () => void {
    const baseRef = rtdbRefs.totalizadoresByQueue(accountcode);
    const queues: QueueData = {};

    const emit = () => {
        const arr = Object.entries(queues).map(([id, data]) => ({ id, data }));
        handler(arr);
    };

    const unsubs: Unsubscribe[] = [];

    unsubs.push(
        onChildAdded(
            baseRef,
            (snap) => {
                queues[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildChanged(
            baseRef,
            (snap) => {
                queues[snap.key!] = snap.val();
                emit();
            },
            (e) => onError?.(e)
        ),
        onChildRemoved(
            baseRef,
            (snap) => {
                delete queues[snap.key!];
                emit();
            },
            (e) => onError?.(e)
        )
    );

    return () => unsubs.forEach((u) => u());
}
