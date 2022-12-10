import { Server } from 'net';

export const tcpPortIsAvailable = (port: number): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const tmpServer = new Server();
    tmpServer.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject('Unexpected server error');
      }
    });
    tmpServer.listen(port, () => {
      tmpServer.close();
      resolve(true);
    });
  });
};

export const assertTcpPortAvailable = async (port: number): Promise<void> => {
  const isAvailable = await tcpPortIsAvailable(port);
  if (!isAvailable) {
    throw new Error(`port ${port} is already taken`);
  }
};
