export const corsOrigin =
  process.env.NODE_ENV === 'development'
    ? ['http://localhost:5173', 'http://localhost:5173/']
    : [
        'https://thehttp.in/',
        'http://localhost:5173',
        'http://localhost:5173/',
      ];

/**
 * @description set of events that we are using in chat app. more to be added as we develop the chat app
 */
export const socketEvent = Object.freeze({
  CONNECTED_EVENT: 'connected',

  DISCONNECT_EVENT: 'disconnect',

  SOCKET_ERROR_EVENT: 'socketError',

  MESSAGE_FROM_SERVER: 'messageFromServer',

  DOWNLOAD: 'download',
  DOWNLOAD_REQUEST_ACK: 'download_request_acknowledgement',
  DOWNLOAD_READY: 'download_ready',
  DOWNLOAD_COMPLETE: 'download_complete',
  DOWNLOAD_ERROR: 'download_error',
});

export const AvailableChatEvents = Object.values(socketEvent);
