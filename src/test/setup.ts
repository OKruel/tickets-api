import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

//* PACKAGES USED
//* 1 - supertest
// Simulate http requests to api endpoints so we 
// can add headers, body and expect a response.
//* 2 - mongodb-memory-server
// It is a instance of a IN MEMORY mongo database so we 
// do not need to connect to the real mongoDB of the app.
//* 3 - mongoose
// It is the tool to connect to the IN MEMORY mongo database.

//* THE BOOT UP OF THE APPLICATION
// We separeted the boot up of the application in two files: Index.ts and App.ts
// The App.ts holds all the middlewares, routes and logic of the application.
// The Index.ts holds all the mandatory configs for the app to work, like DB
// connections, Nats Server connection, environment variables. After all those
// configs are in place then the Index.ts starts to listen to connections.
//* Index.ts configs to boot up
// 1 - Environment Variables
// 2 - MongoDB Connection
// 3 - Nats Server Connection

//* THE TEST STRATEGY
// The tests must run INDEPENDENTLY from the APP itself, so we simulate 
// the APP necessities to boot up.
// SUPERTEST will import the app.ts instead of index.ts and simulate any 
// necessary conditions for the app to boot up as if it is listening.
//* THE TEST SETUP FILE
// THIS FILE holds a INITIAL TEST SETUP simulating ALL the necessities 
// to the app boot up and some HELPER FUNCTIONS. 
// This file will be executed before all the tests.
//* 1 - Before all tests:
// 1.1 - Set the necessary environment variables.
// 1.2 - Create a instance of mongoDB in memory database 
// 1.3 - Connect mongoose to the mongoDB instance
// 2 - Before each test clean up all collections in mongoDB
// 3 - After all tests close the mongoDB and all mongoose conections
//* 2 - Helper Functions
// 2.1 - Register In and return the cookie JWT


//Adding a global function to NODE JS to be used in other files
declare global {
    namespace NodeJS {
        interface Global {
            signin(): string[]
        }
    }
}
//! 3 - INDEX.ST BOOT UP - Nats Server Connection
// Jest allow us to mock some functions, and we are mocking the function with
// the real connection to the Nats Server. To mock a function we have to create a folder
// in the src directory with the name of __mock__ so Jest can pick it up.
// Inside we create a file with the same name of the file we want to mock.
// Inside that file we simulate the function we want to mock.
jest.mock('../nats-wrapper.ts');

//Helper function to simulate a signed in user.
global.signin = () => {
    // Build a JWT payload. Email and ID
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),//Generate a random mongoose ID
        email: 'test@test.com'
    }
    // Create a JWT
    const token = jwt.sign(payload, process.env.JWT_KEY!)
    // Build session object
    const session = { jwt: token }
    // Turn the session into JSON
    const sessionJSON = JSON.stringify(session);
    // Take JSON and enconde as base64
    const base64 = Buffer.from(sessionJSON).toString('base64');
    // Returns a string that contains the cookie in the enconded base64 data.
    // Return the array of strings with the cookie because supertest expects an array.
    return [`express:sess=${base64}`];
};

// Runs BEFORE ALL TESTS.
let mongo: any;
beforeAll(async () => {
    //! 1 - INDEX.ST BOOT UP - Environment Variables
    process.env.JWT_KEY = 'kjhksjdh'
    //! 2 - INDEX.ST BOOT UP - MongoDB Connection
    // 1.2 Create a instance of mongoDB in memory database
    mongo = new MongoMemoryServer();
    const mongoUri = await mongo.getUri(); //Get the string connection
    // 1.3 - Connection mongoose library to mongoDB
    mongoose.connect(mongoUri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })
});
// Runs before EACH TEST
beforeEach(async () => {
    //Cleaning all mocks
    jest.clearAllMocks();
    // 2 - Clean up mongoDB by deleting all collections.
    // a) Get all collections
    const collections = await mongoose.connection.db?.collections();
    // b) If a collection exists loop and delete all collections
    if (collections) {
        for (let collection of collections) {
            await collection.deleteMany({});
        };
    }
});
// Runs AFTER ALL TESTS
afterAll(async () => {
    // 3 - After all tests close the mongoDB and all mongoose conections
    // Stop MongoDB instance
    await mongo.stop();
    // Close mongoose library connection with mongoDG
    mongoose.connection.close();
});

