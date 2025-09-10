// Example usage:
// const individualChatId = `${CHAT_INDIVIDUAL_PREFIX}${userId}`
// const groupChatId = `${CHAT_GROUP_PREFIX}${groupId}`

const CHAT_INDIVIDUAL_PREFIX = (agentLogin: string, supervisorId: string) => `ag_${agentLogin}__sup_${supervisorId}`
const CHAT_GROUP_PREFIX = (groupId: string) => `group__${groupId}`

export { CHAT_INDIVIDUAL_PREFIX, CHAT_GROUP_PREFIX }


