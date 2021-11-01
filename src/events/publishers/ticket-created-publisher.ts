import { Publisher, TicketCreatedEvent, Subjects } from '@okmptickets/shared';


class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;
};

export { TicketCreatedPublisher };