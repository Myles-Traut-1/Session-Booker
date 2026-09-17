import { startServer } from '../../index';
import mongoose from 'mongoose';
import type { Server } from 'node:http';

describe('startServer', () => {
    let server: Server;

    afterEach(async () => {
        if (server && server.listening) {
            await new Promise<void>((resolve) => server.close(() => resolve()));
        }
        await mongoose.connection.close();
    });

    it('connects to the database and returns a listening server', async () => {
        server = await startServer();

        expect(server.listening).toBe(true);
        expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
});