import express from 'express';
import 'express-async-errors';
import bodyParser from 'body-parser';
import cookieSession from 'cookie-session';
import { errorHandler, NotFoundError, currentUser } from '@okmptickets/shared';
import { createTicketsRoute } from './routes/new';
import { showTicketsRoute } from './routes/show';
import { allTicketsRoute } from './routes/index';
import { updateTicketRoute } from './routes/update';

const app = express();
app.set('trust proxy', true)
app.use(bodyParser.json());
app.use(cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test'
}));
//Middleware
//Check if the cookie was found in the request and sets a currentUser property with DB info 
app.use(currentUser);
//Routes
app.use(createTicketsRoute);
app.use(showTicketsRoute);
app.use(allTicketsRoute);
app.use(updateTicketRoute);
//If any other routes can be aplied it will throw a 404 not found error in all REST verbs
app.all('*', () => { throw new NotFoundError() });
app.use(errorHandler);

export { app };
