import { Ticket } from '../../../models/ticket-model';
import mongoose from 'mongoose';
import { OrderCreatedEvent, OrderStatus } from '@okmptickets/shared';
import { Message } from 'node-nats-streaming';
import { OrderCreatedListener } from '../order-created-listener';
import { natsWrapper } from '../../../nats-wrapper';

const setup = async () => {
    //Create a listener
    const listener = new OrderCreatedListener(natsWrapper.client);
    //Create and save a Ticket in the DB
    const ticket = await Ticket.build({
        userId: mongoose.Types.ObjectId().toHexString(),
        title: 'Test',
        price: 10
    }).save();
    //Create some FAKE Order Data
    const fakeOrder: OrderCreatedEvent['data'] = {
        id: mongoose.Types.ObjectId().toHexString(),
        status: OrderStatus.Created,
        version: 0,
        userId: mongoose.Types.ObjectId().toHexString(),
        expiresAt: 'ssdfsd',
        ticket: {
            id: ticket.id,
            price: ticket.price
        }
    }
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }
    return { listener, ticket, fakeOrder, msg };
}

test('should update Ticket In the Database with the OrderId ', async () => {
    const { listener, ticket, fakeOrder, msg } = await setup();

    await listener.onMessage(fakeOrder, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket?.orderId).toEqual(fakeOrder.id);
});

test('acknowledge the message to Nats Server ', async () => {
    const { listener, ticket, fakeOrder, msg } = await setup();
    //Call the onMessage function with data and msg
    await listener.onMessage(fakeOrder, msg);
    expect(msg.ack).toHaveBeenCalled();
});

test('Publisher a ticket updated event', async () => {
    const { listener, ticket, fakeOrder, msg } = await setup();

    await listener.onMessage(fakeOrder, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    //Telling Typescript that this is a Jest Mock Function.
    //We can access everything the Mock Function did
    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(fakeOrder.id).toEqual(ticketUpdatedData.orderId);
});