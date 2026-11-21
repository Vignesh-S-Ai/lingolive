export interface Participant {
  id: string;
  name: string;
  role: 'local' | 'remote';
  subscribed: boolean;
}