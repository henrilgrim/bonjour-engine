export type Department = { id: string; name: string }
export type Queue = { id: string; name: string; priority: number }
export type Company = {
    id?: number
    accountcode: string
    server?: string
    [k: string]: any
}
export interface User {
    id: string;
    name: string;
    extension: string;
    login: string;
    password: string;
    status: string;
    company_info: Company;
    queue_info: Queue;
    department_info: Department;
    token: string;
}

export interface Ticket {
    id: string;
    sequence: string;
    linkedid: string;
    type_call: string;
    origin: string;
    duration: string;
    effective_seconds: string;
    status_call: string;
    destination: string;
    starttime_call: string;
    starttime_call_f: string;
    endtime_call: string;
    endtime_call_f: string;
    answertime: string;
    callerid: string;
    uniqueid: string;
    sigame: string;
    group_origin_type: string;
    group_origin: string;
    group_destination_type: string;
    group_destination: string;
    queue_abandoned: string;
    queue_agent_connected: string;
    ringing_agents_no_answer: string;
    audiorecord: string;
}

export interface TicketData {
    id: string;
    linkedid: string;
    origin: string;
    destination: string;
    hasAudio: boolean;
    duration: number;
    status: TicketStatus;

    dateAndHour: string;
}

export interface TicketStatus {
    color: string
    text: string
}

export interface Reason {
    id: string;
    name: string;
    productivePause: boolean;
    timePause: number;
    needsApproval: boolean;
}

export interface AgentOperation {
    _id: string;
    agent_id: string;
    accountcode: string;
    date_event: string;
    type_operation: {
        reason: string;
        correlation_type_id: string | null;
        type: string;
    },
    createdAt: string;
    updatedAt: string;
}

export type PairedPause = {
    id: string
    reason: string
    startedAt: string
    endedAt: string
    durationInSeconds: number
}

export type BreakItem = {
    id: string
    startTime: string
    endTime: string
    reason: string
    duration: string
    status: string
    exceeded: boolean
}