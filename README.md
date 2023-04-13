# CUSC-Donate-Server

This server is designed to facilitate communication with Flutterwave API for transactions.
It works by looping through all the paginated pages returned from Flutterwave APIs and saving them to MongoDB. 
The cached data in MongoDB can be retrieved anytime by calling the '/api/transactions' endpoint.

In the event that the '/api/update' endpoint is called,
the server compares the data from Flutterwave API with the data stored in MongoDB.
If the data doesn't match, the server caches the updated data from Flutterwave API in MongoDB.
