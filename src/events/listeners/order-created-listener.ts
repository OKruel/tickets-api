import { Listener, OrderCreatedEvent, Subjects } from '@okmptickets/shared';
import { queueGroupName } from './queue-group-name';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket-model';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

class OrderCreatedListener extends Listener<OrderCreatedEvent>{

    subject: Subjects.OrderCreated = Subjects.OrderCreated;

    queueGroupName = queueGroupName;

    async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
        // console.log(`[LISTENING TO EVENT ORDER:CREATED] CHANNEL: ${msg.getSubject()} - QUEUE GROUP: ${queueGroupName} - MESSAGE#${msg.getSequence()}: ${msg.getData()}`);
        //Find the ticket associated with Order in the Database
        const ticket = await Ticket.findById(data.ticket.id);
        //If do not find the Ticket throw an error
        if (!ticket) {
            throw new Error('Ticket not found!');
        };
        //Update and save the ticket in DB with the OrderId 
        const updatedTicket = await ticket.set({
            orderId: data.id
        }).save();
        //Publish an event telling the ticket was updated
        await new TicketUpdatedPublisher(this.client).publish({
            id: updatedTicket.id,
            title: updatedTicket.title,
            price: updatedTicket.price,
            userId: updatedTicket.userId,
            version: updatedTicket.version,
            orderId: updatedTicket.orderId
        });
        console.log('[PUBLISH EVENT -> TICKET:UPDATED]');
        //Tell Nats Server that we receive the message
        msg.ack();
    };
};

export { OrderCreatedListener }