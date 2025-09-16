import { firestore } from "@/config/firebase"
import { doc } from "firebase/firestore"

export function getMonitorPanelDoc(accountcode: string) {
	return doc(firestore, "pxtalk_call_center_module", accountcode, "monitor_panel", "main")
}