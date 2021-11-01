import { Listener, OrderCancelledEvent, Subjects } from "@okmptickets/shared";
import { queueGroupName } from "./queue-group-name";
import { Message } from "node-nats-streaming";
import { Ticket } from '../../models/ticket-model';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

class OrderCancelledListener extends Listener<OrderCancelledEvent> {

    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;

    queueGroupName = queueGroupName;

    async onMessage(data: OrderCancelledEvent['data'], msg: Message) {
        // console.log(`[LISTENING TO EVENT ORDER:CANCELLED] CHANNEL: ${msg.getSubject()} - QUEUE GROUP: ${queueGroupName} - MESSAGE#${msg.getSequence()}: ${msg.getData()}`);
        
        const tk = await Ticket.findById(data.ticket.id);
        
        if (!tk) {
            throw new Error('Ticket not found!');
        };
        
        const updatedTicket = await tk.set({
            orderId: undefined
        }).save();
        
        new TicketUpdatedPublisher(this.client).publish({
            userId: updatedTicket.userId,
            orderId: updatedTicket.orderId,
            id: updatedTicket.id,
            title: updatedTicket.title,
            price: updatedTicket.price,
            version: updatedTicket.version,
        });
        console.log('[PUBLISH EVENT -> TICKET:UPDATED]');

        msg.ack();
    };
};

export { OrderCancelledListener };