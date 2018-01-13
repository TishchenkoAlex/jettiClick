import { IO } from './index';

export function userSocketsEmit(user: string, event: string, payload: any) {
  Object.keys(IO.sockets.connected).map(k => {
    const socket = IO.sockets.connected[k];
    console.log('socket.handshake.query.user', socket.handshake.query.user);
    if (socket.handshake.query.user === user) { socket.emit(event, payload); } else {
      console.log('NOT FOUND EMIT', socket.handshake);
      socket.emit(event, payload);
    }
  });
}
