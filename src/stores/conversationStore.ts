import { create } from 'zustand';

export type ConversationState = {
  roomId: string;
  participants: any[];
  setRoomId: (id: string) => void;
  addParticipant: (participant: any) => void;
};

export const useConversationStore = create<ConversationState>((set) => ({
  roomId: '',
  participants: [],
  setRoomId: (id: string) => set({ roomId: id }),
  addParticipant: (participant: any) =>
    set((state) => ({ participants: [...state.participants, participant] })),
}));