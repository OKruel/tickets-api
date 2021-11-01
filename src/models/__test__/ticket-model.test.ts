import { Ticket } from '../ticket-model';

test('Implements Optimistic Concurrency Control', async (done) => {
    //!1 - Create an instance of a ticket;
    const tk = Ticket.build({
        title: 'Atletico Mineiro',
        price: 5000,
        userId: '123'
    });
    //!2 - Save the ticket to database; 
    //The OCC will save the ticket addind a count to the version property
    await tk.save();
    //!3 - Fetch the ticket twice. Both returned tickets will have the all
    // the same ticket properties including the version property
    const firstFetch = await Ticket.findById(tk.id);
    const secondFetch = await Ticket.findById(tk.id);
    //!4 - make 2 separate changes to the ticketes we fetched
    firstFetch!.set({ price: 100 });
    secondFetch!.set({ price: 900 });
    //!5 - Save the first ticket with the changes made
    //The OCC will increase the number of the version propery by 1;
    //So now in the database the ticket, with the SAME ID of firstFetch and secondFetch,
    //should have the property version increased by 1.
    //It should have no problem in saving it.
    await firstFetch!.save();
    //!6 - Save the second Ticket with the changes made
    //Now we will have a problem with version property.
    //Between the 2 tickets, the one who saved it faster to the DB will have the preference.
    //The other will not be able to save the ticket because 
    try {
        await secondFetch!.save();
    } catch (error) {
        return done();
    }

    throw new Error('Should not throw this error');
});

test('Increments the version number if we save it multiple times', async () => {
    //1 - Create and save a ticket to DB
    const tk = await Ticket.build({
        title: 'Atletico Mineiro',
        price: 5000,
        userId: '123'
    }).save();
    expect(tk.version).toEqual(0);
    expect(tk.price).toEqual(5000);
    
    //2 - Fetch the ticket twice. Both returned tickets will have the all
    await tk.set({ price: 6000 }).save();
    expect(tk.version).toEqual(1);
    expect(tk.price).toEqual(6000);
   
    await tk.set({ price: 7000 }).save();
    expect(tk.version).toEqual(2);
    expect(tk.price).toEqual(7000);

});