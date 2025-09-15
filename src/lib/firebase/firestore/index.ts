import { firestore } from "@/config/firebase"
import { doc } from "firebase/firestore"

export function getManagerPanelDoc(accountcode: string) {
	return doc(firestore, "pxtalk_call_center_module", accountcode, "manager_panel", "main")
}

export function getAgentPanelDoc(accountcode: string) {
	return doc(firestore, "pxtalk_call_center_module", accountcode, "agent_panel", "main")
}

export function getMonitorPanelDoc(accountcode: string) {
	return doc(firestore, "pxtalk_call_center_module", accountcode, "monitor_panel", "main")
}