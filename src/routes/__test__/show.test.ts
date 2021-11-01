import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';

test('returns a 404 if ticket not found', async () => {
    const id = mongoose.Types.ObjectId().toHexString();

    await request(app)
        .post(`/api/tickets/${id}`)
        .send()
        .expect(404)

});
test('returns a the ticket if ticket was found', async () => {
    const title = 'valid';
    const price = 10

    const response = await request(app)
        .post('/api/tickets')
        .set('Cookie', global.signin())
        .send({ title, price })
        .expect(201)

    const ticketResponse = await request(app)
        .get(`/api/tickets/${response.body.id}`)
        .send()
        .expect(200)

    expect(ticketResponse.body.title).toEqual(title);
    expect(ticketResponse.body.price).toEqual(price);
});
