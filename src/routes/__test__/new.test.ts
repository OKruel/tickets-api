import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket-model';
import { natsWrapper } from '../../nats-wrapper';

test('Has a route handler listening to /api/tickets for post requests', async () => {
    const response = await request(app)
        .post('/api/tickets')
        .send({})

    expect(response.status).not.toEqual(404);
});
test('Can only access /api/tickets if user is authenticated', async () => {
    await request(app)
        .post('/api/tickets')
        .send({})
        .expect(401)
});

test('Returns a status different than 401 if the user is sign IN', async () => {
    const response = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({})
    expect(response.status).not.toEqual(401)
});

test('return a error if invalid title is provided', async () => {
    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title: '', price: 10 })
        .expect(400)

    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ price: 10 })
        .expect(400)
});

test('return an error if invalid price is provided', async () => {
    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title: 'valid', price: '' })
        .expect(400)

    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title: 'valid' })
        .expect(400)
});
test('creates a ticket with valid inputs', async () => {
    let tickets = await Ticket.find({});
    expect(tickets.length).toEqual(0);

    const title = 'valid';
    const price = 10

    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title, price })
        .expect(201)

    tickets = await Ticket.find({});
    expect(tickets.length).toEqual(1);
    expect(tickets[0].title).toEqual(title);
    expect(tickets[0].price).toEqual(price);
});
test('when successfully creating a ticket, a event must be published', async () => {
    const title = 'valid';
    const price = 10

    await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title, price })
        .expect(201)

    expect(natsWrapper.client.publish).toHaveBeenCalled();
});