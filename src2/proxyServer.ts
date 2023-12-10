import net from 'net';
import { ProxyLogger } from './proxy/ProxyLogger';

export class ProxyServer {
  private server: net.Server;

  constructor(private port: number, private redisPort: number) {
    this.server = new net.Server({ allowHalfOpen: false }, (connection) =>
      this.onConnection(connection)
    );
  }

  private onConnection(connection: net.Socket) {
    const redisConnection = net.createConnection({
      port: this.redisPort,
      host: 'localhost',
    });

    const sw = new ProxyLogger(redisConnection);
    connection.pipe(sw).pipe(connection);
  }

  start(){
    const pingConnection = net.createConnection({
      port: this.redisPort,
      host: 'localhost',
    }, () => {
      this.server.listen(this.port, () => {
        console.log('listening...')
      });
    });

    pingConnection.on('error', () => {
      console.log('restart...');
      setTimeout(() => {
        this.start();
      }, 5000);
    });

    pingConnection.on('end', () => {
      console.log('closed...');
      this.server.close();
      setTimeout(() => {
        this.start();
      }, 5000);
    })
  }
}
