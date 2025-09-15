import { onValue, update, serverTimestamp } from "firebase/database";
import { rtdbRefs } from "@/lib/firebase/realtime";
import { Timestamp } from "firebase/firestore";

export interface PauseRequest {
    agentLogin: string;
    accountcode: string;
    reasonId: string;
    reasonName: string;
    rejectionReason?: string;
    status?: "pending" | "approved" | "rejected";
    createdAt: Timestamp | number;
    respondedAt?: Timestamp | number;
}

const tsToMs = (t: Timestamp | number | undefined): number => {
    if (t == null) return 0;
    if (typeof t === "number") return t;
    const anyTs = t as any;
    if (typeof anyTs.seconds === "number") return anyTs.seconds * 1000;
    return 0;
};

export const listenPauseRequestStatus = (
    accountcode: string,
    agentLogin: string,
    callback: (data: PauseRequest | null) => void
) => {
    const requestRef = rtdbRefs.pauseRequests(accountcode, agentLogin);
    const unsubscribe = onValue(requestRef, (snapshot) => {
        const data = snapshot.val();
        callback(
            data ? ({ accountcode, agentLogin, ...data } as PauseRequest) : null
        );
    });
    return unsubscribe;
};

export const respondPauseRequest = async (
    accountcode: string,
    agentLogin: string,
    params: { status: "approved" | "rejected"; rejectionReason?: string },
    nameWhoResponded: string,
    idWhoResponded: string
) => {
    const { status, rejectionReason } = params;
    await update(rtdbRefs.pauseRequests(accountcode, agentLogin), {
        status,
        rejectionReason: status === "rejected" ? rejectionReason ?? "" : null,
        respondedAt: serverTimestamp(),
        nameWhoResponded: nameWhoResponded,
        idWhoResponded: idWhoResponded,
    });
};

export const listenAllPauseRequests = (
    accountcode: string,
    callback: (list: PauseRequest[] | null) => void
) => {
    const refAll = rtdbRefs.pauses(accountcode);
    return onValue(refAll, (snap) => {
        const val = snap.val() as Record<string, any> | null;
        if (!val) {
            callback(null);
            return;
        }
        const list: PauseRequest[] = Object.entries(val).map(
            ([agentLogin, data]) => ({
                accountcode,
                agentLogin,
                ...data,
            })
        );
        list.sort((a, b) => tsToMs(a.createdAt) - tsToMs(b.createdAt));
        callback(list);
    });
};
