import { TicketUpdatedEvent, Subjects, Publisher } from '@okmptickets/shared';


class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
    subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
};

export { TicketUpdatedPublisher };