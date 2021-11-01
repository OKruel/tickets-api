import { Ticket } from '../../../models/ticket-model';
import mongoose from 'mongoose';
import { OrderCancelledEvent } from '@okmptickets/shared';
import { Message } from 'node-nats-streaming';
import { OrderCancelledListener } from '../order-cancelled-listener';
import { natsWrapper } from '../../../nats-wrapper';

const setup = async () => {
    //Create a listener
    const listener = new OrderCancelledListener(natsWrapper.client);
    //Create and save a Ticket in the DB
    const orderId = mongoose.Types.ObjectId().toHexString();
    const ticket = Ticket.build({
        userId: mongoose.Types.ObjectId().toHexString(),
        title: 'Test',
        price: 10
    })
    ticket.orderId = orderId;
    await ticket.save();
    //Create some FAKE Order Data
    const fakeOrder: OrderCancelledEvent['data'] = {
        id: orderId,
        userId: mongoose.Types.ObjectId().toHexString(),
        version: 0,
        ticket: {
            id: ticket.id,
        }
    }
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }
    return { listener, ticket, fakeOrder, msg, orderId };
}

test('should update Ticket In the Database with the OrderId ', async () => {
    const { listener, ticket, fakeOrder, msg, orderId } = await setup();

    await listener.onMessage(fakeOrder, msg);

    const updatedTicket = await Ticket.findById(ticket.id);

    expect(updatedTicket?.orderId).not.toBeDefined();
    expect(msg.ack).toHaveBeenCalled();
});

test('Publisher a ticket updated event', async () => {
    const { listener, ticket, fakeOrder, msg } = await setup();

    await listener.onMessage(fakeOrder, msg);

    expect(natsWrapper.client.publish).toHaveBeenCalled();

    //Telling Typescript that this is a Jest Mock Function.
    //We can access everything the Mock Function did
    const ticketUpdatedData = JSON.parse((natsWrapper.client.publish as jest.Mock).mock.calls[0][1]);

    expect(ticketUpdatedData.orderId).not.toBeDefined();
});