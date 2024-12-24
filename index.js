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
      let option = {};
  
      if (searchParams && searchParams.trim() !== "") {
          option = { FoodName: { $regex: searchParams, $options: "i" } };
      }
  
      try {
          const result = await FoodCollection.find(option).toArray();
          console.log("Filtered Results:", result); 
          res.send(result);
      } catch (error) {
          console.error("Error fetching movies:", error);
          res.status(500).send({ error: "Failed to fetch movies" });
      }
  });

   //new top rated route to show in home
   app.get('/foods/top', async (req, res) => {
    try {
        const cursor = FoodCollection.find()
            .sort({ FoodQuantity: -1 }) // Sort by FoodQuantity in ascending order
            .limit(6); // Limit the number of results to 6
        const result = await cursor.toArray();
        res.send(result);
    } catch (error) {
        console.error('Error fetching foods:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});



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