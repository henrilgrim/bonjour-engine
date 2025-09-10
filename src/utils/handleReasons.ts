import { Reason } from "@/types"

export default function handleReasons(reason: any): Reason {
    return {
        id: reason._id,
        name: reason.name,
        productivePause: reason.productivePause,
        timePause: reason.timePause,
        needsApproval: reason.needsApproval ?? false,
    }
}
