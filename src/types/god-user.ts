export interface GodUser {
  id: string
  userId: string
  application: string
  createdAt: Date
  updatedAt: Date
  active: boolean
}

export interface CreateGodUserData {
  userId: string
  application: string
}