export interface Call {
  id: string;
  number: string;
  name?: string;
  status: 'incoming' | 'outgoing' | 'active' | 'hold' | 'ended';
  startTime: Date;
  duration: number;
  isMuted: boolean;
}

export interface SoftphoneConfig {
  enabled: boolean;
  sipServer?: string;
  username?: string;
  password?: string;
}

export interface SoftphoneState {
  isRegistered: boolean;
  isConnecting: boolean;
  calls: Call[];
  activeCallId: string | null;
  config: SoftphoneConfig;
  volume: number;
  isMinimized: boolean;
}