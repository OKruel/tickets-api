import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

// HOW MONGOOSE BUILDS HIS MODELS
// 1 - The mongoose.Document has the default class implementation 
// which instantiates a object to be saved in the DB.
// 2 - The mongoose.Model OF TYPE MONGOOSE.DOCUMENT has the default class implementation which  
// has a function that returns a mongoose.Document to be save in the DB.

// The ideia here is to insert a custom function in the mongoose.Model 
// to build our own mongoose.Document. This custom function would have our atributtes and will
// return the custom mongoose.Document. A kind of mongoose.Model custom constructor

// 1 - We create/interface the attributes that we want in our Model.
interface TicketAttr {
    title: string;
    price: number;
    userId: string;
}
// 2 - We insert the same attributes into the custom mongoose.Document.
interface TicketDocument extends mongoose.Document {
    title: string;
    price: number;
    userId: string;
    orderId?: string
    //Added because the base mongoose.Document only has __v property 
    //and now that we changed it to "version "in the mongoose.Schema,
    //Typescript will complain that it can not find in the mongoos.Document. 
    version: number;
}
// 3 - We have to create a custom mongoose.Model OF TYPE custom mongoose.Document.
interface TicketModel extends mongoose.Model<TicketDocument> {
    // 4 - In that custom mongoose.Model we create a build function that returns a custom mongoose.Document
    // and receive interfaced attributes so that TS can prevent errors.
    build(attributes: TicketAttr): TicketDocument
}
//Creating the DB Schema and adding option to customize the JSON object
const ticketSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    userId: { type: String, required: true },
    orderId: {type: String }
}, {
    toJSON: { //Transforming the mongoose JSON object to fit a DB commom pattern
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
        }
    }
});
//Exchaging the "__v" document property to "version" to introduce OCC into mongoDB
//It does NOT change anything, it just makes it more human readable.
ticketSchema.set('versionKey', 'version');
//!Adding a plugin to increase the version number everytime a DOCUMENT is saved.
//!It only works if the save() method is used on the DOCUMENT.
//!It implements the OPTIMISTIC CONCURRENCY CONTROL in mongoDB.
ticketSchema.plugin(updateIfCurrentPlugin);
// Adding a static function to the custom mongoose.Schema class.
ticketSchema.statics.build = (attributes: TicketAttr) => {
    return new Ticket(attributes);
};
// Creating the model
const Ticket = mongoose.model<TicketDocument, TicketModel>('Ticket', ticketSchema);
// Exporting the Ticker customized model
export { Ticket };