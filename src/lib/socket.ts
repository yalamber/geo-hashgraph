import { io } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL;

export const socket = io(URL);
