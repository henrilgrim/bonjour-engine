import { Ticket } from "@/types"

export function getCallStatus(ticket: Ticket) {
	const statusList = [
		{
			condition: (t: Ticket) => t.status_call === "ANSWERED" && t.type_call !== "Queue",
			text: "Atendida",
			color: "#43a047",
		},
		{
			condition: (t: Ticket) => t.status_call === "ANSWERED" && t.type_call === "Transferred Call",
			text: "Transferida",
			color: "#43a047",
		},
		{
			condition: (t: Ticket) => t.type_call === "Queue" && t.queue_agent_connected && !["s", "hangup"].includes(t.destination),
			text: "Atendida",
			color: "#43a047",
		},
		{
			condition: (t: Ticket) => t.type_call === "Queue" && t.queue_agent_connected && ["s", "hangup"].includes(t.destination),
			text: "Atendida",
			color: "#43a047",
		},
		{
			condition: (t: Ticket) => t.type_call === "Queue" && t.queue_abandoned && !t.queue_agent_connected,
			text: "Abandonada",
			color: "#d32f2f",
		},
		{
			condition: (t: Ticket) => t.status_call === "NO ANSWER",
			text: "Não Atendida",
			color: "#d32f2f",
		},
		{
			condition: (t: Ticket) => t.status_call === "BUSY" && !t.queue_abandoned,
			text: "Ocupado",
			color: "#edc709",
		},
		{
			condition: (t: Ticket) => t.status_call === "FAILED",
			text: "Não completada",
			color: "#d32f2f",
		},
		{
			condition: (t: Ticket) => t.type_call === "ResetCDR" || !!t.sigame,
			text: "Chamada encaminhada",
			color: "#7fa5e5",
		},
		{
			condition: (t: Ticket) => t.status_call === "CONGESTION",
			text: "Chamada congestionada",
			color: "#d32f2f",
		},
	]

	return statusList.find((s) => s.condition(ticket))
}
