import { IO } from './index';

export function userSocketsEmit(user: string | null, event: string, payload: any) {
  Object.keys(IO.sockets.connected).forEach(k => {
    const socket = IO.sockets.connected[k];
    if (!user) socket.emit(event, payload); else
      if (socket.handshake.query.user === user) socket.emit(event, payload);
  });
}
