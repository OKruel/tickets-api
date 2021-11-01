import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket-model';

const id = mongoose.Types.ObjectId().toHexString();

test('returns 404 - Bad Request - if provided id does not exists', async () => {
    await request(app)
        .put(`/api/tickets/${id}`)
        .set('Cookie', global.signin())
        .send({ title: 'supervalid', price: 25 })
        .expect(404)
});
test('returns 401 if user not authenticated', async () => {
    await request(app)
        .put(`/api/tickets/${id}`)
        .send({ title: 'supervalid', price: 25 })
        .expect(401)
});
test('returns 401 if user do not own the ticket', async () => {
    const ticket = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title: 'valid', price: 10 })

    await request(app)
        .put(`/api/tickets/${ticket.body.id}`)
        .set('Cookie', global.signin()) //Generating a new cookie to fake being another user
        .send({ title: 'supervalid', price: 25 })
        .expect(401)

    expect(ticket.body.title).toEqual('valid');
    expect(ticket.body.price).toEqual(10);

});
test('returns 400 if user provides invalid title or price', async () => {
    await request(app)
        .put(`/api/tickets/${id}`)
        .set('Cookie', global.signin())
        .send({ title: '', price: 25 })
        .expect(400)

    await request(app)
        .put(`/api/tickets/${id}`)
        .set('Cookie', global.signin())
        .send({ title: 'supervalid', price: '' })
        .expect(400)
});
test('returns 201 if user successfully update the ticket', async () => {

    const cookie = global.signin();

    const ticket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({ title: 'valid', price: 10 })

    const updatedTicket = await request(app)
        .put(`/api/tickets/${ticket.body.id}`)
        .set('Cookie', cookie)
        .send({ title: 'supervalid', price: 25 })
        .expect(200)

    expect(updatedTicket.body.title).toEqual('supervalid');
    expect(updatedTicket.body.price).toEqual(25);
});
test('After a ticket was successfully updated, a event must be published', async () => {
    const cookie = global.signin();

    const ticket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({ title: 'valid', price: 10 })

    await request(app)
        .put(`/api/tickets/${ticket.body.id}`)
        .set('Cookie', cookie)
        .send({ title: 'supervalid', price: 25 })
        .expect(200)

    expect(natsWrapper.client.publish).toHaveBeenCalled()
});

test('rejects updates if ticket is reserved', async () => {
    const cookie = global.signin();

    const ticket = await request(app)
        .post('/api/tickets')
        .set('Cookie', cookie)
        .send({ title: 'valid', price: 10 })

    const updatedTicket = await Ticket.findById(ticket.body.id);
    await updatedTicket?.set({orderId: mongoose.Types.ObjectId().toHexString()}).save()

    await request(app)
        .put(`/api/tickets/${ticket.body.id}`)
        .set('Cookie', cookie)
        .send({ title: 'supervalid', price: 25 })
        .expect(400)
});