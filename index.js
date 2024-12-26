require('dotenv').config();
const express=require ('express')
const cors=require ('cors')
const app=express()
const port=process.env.PORT || 5000
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//middleware 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8q3cu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const FoodCollection = client.db('Fooddb').collection('FoodCollection');
    const RequestCollection = client.db('Fooddb').collection('Request');
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    //get all food item in db
    app.post('/foods',async(req,res)=>{
      const newFood=req.body
      console.log(newFood);
      const result=await FoodCollection.insertOne(newFood)
      res.send(result)
    })

    //get food in server port and implement search
  app.get('/foods', async (req, res) => {
    const { searchParams } = req.query;
    console.log("Search parameter received:", searchParams);

    let option = { status: "available" }; // Default filter to include only available items

    // Add search condition if `searchParams` is provided
    if (searchParams && searchParams.trim() !== "") {
        option.FoodName = { $regex: searchParams, $options: "i" };
    }

    try {
        const result = await FoodCollection.find(option).toArray();
        console.log("Filtered Results:", result);
        res.send(result);
    } catch (error) {
        console.error("Error fetching foods:", error);
        res.status(500).send({ error: "Failed to fetch foods" });
    }
});


   //new top rated route to show in home
   app.get('/foods/top', async (req, res) => {
    let option = { status: "available" };
    try {
        const cursor = FoodCollection.find(option)
            .sort({ FoodQuantity: -1 }) // Sort by FoodQuantity in ascending order
            .limit(6); // Limit the number of results to 6
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});




// Request food: Insert request and update food status
app.post("/foods/request", async (req, res) => {
  const {
    foodId,
    FoodName,
    FoodImage,
    PickUpLocation,
    ExpiredDate,
    Notes,
    donatorEmail,
    donatorName,
    requesterEmail,
  } = req.body;

  try {
    // Update food status to "not available"
    const foodUpdateResult = await FoodCollection.updateOne(
      { _id: new ObjectId(foodId) },
      { $set: { status: "not available" } }
    );

    if (foodUpdateResult.modifiedCount === 0) {
      return res
        .status(400)
        .send({ success: false, message: "Failed to update food status." });
    }

    // Insert the request into RequestCollection
    const requestResult = await RequestCollection.insertOne({
      foodId,
      FoodName,
      FoodImage,
      PickUpLocation,
      ExpiredDate,
      Notes,
      donatorEmail,
      donatorName,
      requesterEmail,
      requestDate: new Date(),
    });

    res.send({ success: true, requestId: requestResult.insertedId });
  } catch (error) {
    console.error("Error handling food request:", error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});

// Get requested foods for a specific user
app.get("/foods/request", async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).send({ success: false, message: "User email is required." });
  }

  try {
    const userRequests = await RequestCollection.find({ requesterEmail: userEmail }).toArray();
    res.send(userRequests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

//get specific user added food item from fooddb
app.get("/foods/user", async (req, res) => {
  const { userEmail } = req.query;

  if (!userEmail) {
    return res.status(400).send({ success: false, message: "User email is required." });
  }

  try {
    // Find all food entries associated with the given email
    const userFoods = await FoodCollection.find({ userEmail: userEmail}).toArray();
    res.send(userFoods);
  } catch (error) {
    console.error("Error fetching user foods:", error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});



//update food 
//get id from db


app.get('/foods/user/:id', async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const food = await FoodCollection.findOne(filter);

  if (food) {
    res.status(200).send(food);
  } else {
    res.status(404).send({ message: 'Food not found' });
  }
});
app.put('/foods/user/:id', async (req, res) => { 
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: req.body
    };

    const result = await FoodCollection.updateOne(filter, updatedDoc, options);
    res.status(200).send(result); // Always return a proper response
  } catch (error) {
    console.error('Error updating food:', error);
    res.status(500).send({ message: 'Failed to update food' });
  }
});


  
  
  
  //go to specific food 
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await FoodCollection.findOne(query);
      res.send(result);
  })
  
  
  
  //delete food
   app.delete('/foods/:id',async (req,res)=>{
    const id=req.params.id
    const query= {_id:new ObjectId(id)}
    const result=await FoodCollection.deleteOne(query)
    res.send(result);
  })

  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('Food server is running')
  })
  
  
  app.listen(port,()=>{
      console.log(`Food server is running on port:${port}`);
      
  })