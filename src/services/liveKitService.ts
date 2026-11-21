export const liveKitService = {
  connect: async (roomName: string) => {
    console.log(`Connecting to LiveKit room: ${roomName}`);
  },
  disconnect: async () => {
    console.log('Disconnected from LiveKit');
  },
};