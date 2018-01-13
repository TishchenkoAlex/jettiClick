import { IO } from './index';

export function userSocketsEmit(user: string, event: string, payload: any) {
  Object.keys(IO.sockets.connected).map(k => {
    const socket = IO.sockets.connected[k];
    console.log('socket.handshake', socket.handshake);
    if (socket.handshake.query.user === user) { socket.emit(event, payload); }
    // socket.emit(event, payload);
  });
}
