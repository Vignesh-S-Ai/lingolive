import { create } from 'zustand';

export type ParticipantState = {
  localParticipant: any;
  remoteParticipants: any[];
  setLocalParticipant: (p: any) => void;
  addRemoteParticipant: (p: any) => void;
};

export const useParticipantStore = create<ParticipantState>((set) => ({
  localParticipant: null,
  remoteParticipants: [],
  setLocalParticipant: (p: any) => set({ localParticipant: p }),
  addRemoteParticipant: (p: any) =>
    set((state) => ({ remoteParticipants: [...state.remoteParticipants, p] })),
}));