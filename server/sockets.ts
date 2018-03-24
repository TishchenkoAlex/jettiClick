import { IO } from './index';

export function userSocketsEmit(user: string, event: string, payload: any) {
  Object.keys(IO.sockets.connected).map(k => {
    const socket = IO.sockets.connected[k];
    if (socket.handshake.query.user === user) { socket.emit(event, payload); } else { socket.emit(event, payload); }
  });
}
