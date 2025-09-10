import { TicketData, TicketStatus } from '@/types';
import { CallTicket } from '@/types/tableStore';


export function handleTicketV2(ticket: CallTicket): TicketData {
    const normalized = ticket.status.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const new_destination = ticket.destino == 's' ? 'URA' : ticket.destino
    const hasAudio = ticket.real_audiorecord && ticket.real_audiorecord === 'yes'
    
    return {
        id: ticket.banco_id,
        linkedid: ticket.linkedid,
        origin: ticket.origem,
        destination: new_destination,
        hasAudio,
        duration: ticket.TMA,
        status: statusMap[normalized] ?? { color: '#9e9e9e', text: 'Desconhecido' },

        dateAndHour: ticket.chamada_inicio_br,
    }
}

const statusMap: Record<string, TicketStatus> = {
    'ATENDIDA': { color: '#43a047', text: 'Atendida' },
    'ATENDIDA NA FILA': { color: '#43a047', text: 'Atendida na Fila' },

    'ABANDONADA NA FILA': { color: '#d32f2f', text: 'Abandonada na Fila' },
    'NAO ATENDIDA': { color: '#d32f2f', text: 'Não Atendida' },
    'OCUPADA': { color: '#f57c00', text: 'Ocupada' },
    'FALHA': { color: '#d32f2f', text: 'Falha' },

    'BACKGROUND': { color: '#42a5f5', text: 'Chamada de Contexto' },
    'RESET CDR': { color: '#42a5f5', text: 'Chamada de Contexto' },
    'WAITEXTEN': { color: '#42a5f5', text: 'Chamada de Contexto' },

    'CHAMADA CONGESTIONADA': { color: '#d32f2f', text: 'Congestionada' },
    'CHAMADA TRANSFERIDA': { color: '#43a047', text: 'Transferida' }
}


export function getBancoIds(tickets: CallTicket[]): string[] {
    return tickets.map(t => t.banco_id).filter((id): id is string => typeof id === "string" && id.length > 0)
}
