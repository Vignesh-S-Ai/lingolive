export interface ConversationRoom {
  id: string;
  name: string;
  participants: Participant[];
  createdAt: Date;
}