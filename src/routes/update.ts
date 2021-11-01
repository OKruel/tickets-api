import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validateRequest, requireAuth, NotFoundError, NotAuthorizedError, BadRequestError } from '@okmptickets/shared';
import { Ticket } from '../models/ticket-model';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.put('/api/tickets/:id', requireAuth, [
    body('title').not().isEmpty().withMessage('Title must be provided'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
], validateRequest, async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) { throw new NotFoundError() };
    if (ticket.userId !== req.currentUser!.id) { throw new NotAuthorizedError() };
    if (ticket.orderId) { throw new BadRequestError('Ticket reserved by a costumer can not be edited!') };

    ticket.set({
        title: req.body.title,
        price: req.body.price
    });

    await ticket.save();

    await new TicketUpdatedPublisher(natsWrapper.client).publish({
        id: ticket.id,
        title: ticket.title,
        price: ticket.price,
        userId: ticket.userId,
        version: ticket.version
    });
    console.log('[PUBLISH EVENT -> TICKET:UPDATED]');

    res.send(ticket);
})

export { router as updateTicketRoute };