export interface OnlineUser {
  id: string
  userId: string
  userName: string
  userLogin: string
  companyId: string
  companyName: string
  lastSeen: Date
  status: 'online' | 'away' | 'offline'
}

export interface CreateOnlineUserData {
  userId: string
  userName: string
  userLogin: string
  companyId: string
  companyName: string
}