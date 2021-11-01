import express, { Request, Response, NextFunction } from 'express';
import { requireAuth, validateRequest } from '@okmptickets/shared';
import { body } from 'express-validator';
import { Ticket } from '../models/ticket-model';
import { TicketCreatedPublisher } from '../events/publishers/ticket-created-publisher';
import { natsWrapper } from '../nats-wrapper';


const router = express.Router();

router.post('/api/tickets',
    requireAuth, [
    body('title').not().isEmpty().withMessage('Title must be provided'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0')

], validateRequest, async (req: Request, res: Response, next: NextFunction) => {

    const { title, price } = req.body;

    const ticket = Ticket.build({ title, price, userId: req.currentUser!.id });

    console.log('[Ticket] Current user -> ', req.currentUser)

    await ticket.save();

    await new TicketCreatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version
    });
    console.log('[PUBLISH EVENT -> TICKET:CREATED]');

    res.status(201).send(ticket);
});

export { router as createTicketsRoute };