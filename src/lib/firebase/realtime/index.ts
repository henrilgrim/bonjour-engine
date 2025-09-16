import { ref } from "firebase/database"
import { database } from "@/config/firebase"

// Prefixo base do caminho no Realtime Database
const BASE_PATH_PREFIX = "pxtalk_call_center_module"

// Validações
const validateAccountCode = (accountcode: string) => {
	if (!accountcode) throw new Error("Parâmetro 'accountcode' é obrigatório.")
}

const validateUserId = (userId: string) => {
	if (!userId) throw new Error("Parâmetro 'userId' é obrigatório.")
}

// Fábrica de contexto RTDB por accountcode
export const createRtdbContext = (accountcode: string) => {
	validateAccountCode(accountcode)

	const basePath = `${BASE_PATH_PREFIX}/${accountcode}`
	const monitorPanelPath = `${basePath}/monitor_panel`

	const paths = {
		managerPanel: () => `${basePath}/manager_panel`,
		agentPanel: () => `${basePath}/agent_panel`,
		monitorPanel: () => monitorPanelPath,
		usersOnline: () => `${monitorPanelPath}/onlines`,
		userOnline: (userId: string) => {
			validateUserId(userId)
			return `${monitorPanelPath}/onlines/${userId}`
		},
		queueMemberStatus: (accountcode: string) => `QueueMemberStatus/${accountcode}`,
		totalizadoresByQueue: (accountcode: string) => `totalizadoresByQueue/${accountcode}`,
	}

	const refs = {
		usersOnline: () => ref(database, paths.usersOnline()),
		userOnline: (userId: string) => ref(database, paths.userOnline(userId)),
		queueMemberStatus: (accountcode: string) => ref(database, paths.queueMemberStatus(accountcode)),
		totalizadoresByQueue: (accountcode: string) => ref(database, paths.totalizadoresByQueue(accountcode))
	}

	return { paths, refs }
}
