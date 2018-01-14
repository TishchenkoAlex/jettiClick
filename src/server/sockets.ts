import { IO } from './index';

export function userSocketsEmit(user: string, event: string, payload: any) {
  console.log('IO.sockets.connected.length', Object.keys(IO.sockets.connected).length);
  Object.keys(IO.sockets.connected).map(k => {
    const socket = IO.sockets.connected[k];
    socket.emit(event, payload);
/*     if (socket.handshake.query.user === user) { socket.emit(event, payload); } else {
      console.log('NOT FOUND EMIT', socket.handshake);
      socket.emit(event, payload);
    } */
  });
}
