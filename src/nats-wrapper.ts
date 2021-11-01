import nats, { Stan } from 'node-nats-streaming';
//The ideia is:
// Inside of a class, create a function that returns a Promise of the nats connect function.
// instantiate the class and export it so only one intance 
class NatsWrapper {
    // The _client property is only initicated and became a client of the 
    // NATS Server AFTER the connect function is called.
    // That is why it is marked as private. Can only access the property inside the class.
    private _client?: Stan;
    //The get set function in a class is a form of expose the private property of a class after 
    // a certain condition.//!MUITO LEGAL
    get client(){
        if (!this._client) {
            throw new Error('Can not access the NATS client before it connects to the Server')
        }
        return this._client;
    };

    connect(clusterId: string, clientId: string, url: string) {
        this._client = nats.connect(clusterId, clientId, { url });

        return new Promise((resolve, reject) => {
            this.client.on('connect', con => resolve(con))
            this.client.on('error', err => reject(err))
        });
    };
};
//EXPORTING ONE INSTANCE OF THE NATS LIBRARY
export const natsWrapper = new NatsWrapper();