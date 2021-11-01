import mongoose from 'mongoose';
import { natsWrapper } from './nats-wrapper';
import { app } from './app';
import { OrderCreatedListener } from './events/listeners/order-created-listener';
import { OrderCancelledListener } from './events/listeners/order-cancelled-listener';

const start = async () => {
    //Checking for environment variables
    if (!process.env.JWT_KEY) {
        throw new Error('JWT_KEY must be provided!');
    };
    if (!process.env.MONGO_URI) {
        throw new Error('Mongo URI must be provided')
    }
    if (!process.env.NATS_CLUSTER_ID) {
        throw new Error('NATS_CLUSTER_ID must be provided')
    }
    if (!process.env.NATS_CLIENT_ID) {
        throw new Error('NATS_CLIENT_ID must be provided')
    }
    if (!process.env.NATS_URL) {
        throw new Error('NATS_URL must be provided')
    }
    //Checking for database connections
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true
        });
        console.log('Mongo database connected!');

    } catch (error) { console.error('Mongo DB NOT connected -> ', error); };
    //Checking for Nats Server connection
    try {
        await natsWrapper.connect(
            process.env.NATS_CLUSTER_ID,
            process.env.NATS_CLIENT_ID,
            process.env.NATS_URL
        );
        console.log('Nats server connected!');
        //Gracefully terminating the program if connection is interrupted
        natsWrapper.client.on('close', () => {
            console.log('NATS Connection closed!');
            process.exit();
        });
        process.on('SIGINT', () => natsWrapper.client.close());
        process.on('SIGTERM', () => natsWrapper.client.close());
        //Starting Nats Server Listener for events order:created and order:updated
        new OrderCreatedListener(natsWrapper.client).listen();
        new OrderCancelledListener(natsWrapper.client).listen();

    } catch (error) { console.log('Nats Server not connected -> ', error); };
    //Starting the server
    app.listen(3000, () => console.log('Tickets API online!'));
};

start();

