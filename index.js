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
  //   app.get('/foods', async (req, res) => {
  //     const { searchParams } = req.query;
  //     console.log("Search parameter received:", searchParams); 
  //     let option = {};
  
  //     if (searchParams && searchParams.trim() !== "") {
  //         option = { FoodName: { $regex: searchParams, $options: "i" } };
  //     }
  
  //     try {
  //         const result = await FoodCollection.find(option).toArray();
  //         console.log("Filtered Results:", result); 
  //         res.send(result);
  //     } catch (error) {
  //         console.error("Error fetching movies:", error);
  //         res.status(500).send({ error: "Failed to fetch movies" });
  //     }
  // });
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

//requested food
app.post("/foods/request", async (req, res) => {
  const { foodId } = req.body;

  try {
    // Update the status of the food
    const result = await FoodCollection.updateOne(
      { _id: new ObjectId(foodId) },
      { $set: { status: "not available" } }
    );

    if (result.modifiedCount > 0) {
      res.send({ success: true });
    } else {
      res.status(400).send({ success: false, message: "Failed to update status" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});


app.post("/foods/request", async (req, res) => {
  // const { foodId } = req.body;

  // try {
  //   // Validate the foodId format
  //   if (!ObjectId.isValid(foodId)) {
  //     return res.status(400).send({ success: false, message: "Invalid food ID" });
  //   }

  //   // Update the status of the food to "not available"
  //   const result = await FoodCollection.updateOne(
  //     { _id: new ObjectId(foodId) },
  //     { $set: { status: "not available" } }
  //   );

  //   if (result.modifiedCount > 0) {
  //     res.send({ success: true, message: "Food status updated successfully." });
  //   } else {
  //     res.status(404).send({ success: false, message: "Food not found or already updated." });
  //   }
  // } catch (error) {
  //   console.error("Error updating food status:", error);
  //   res.status(500).send({ success: false, message: "Internal Server Error" });
  // }
  const newRequest=req.body
  console.log(newRequest);
  const result=await RequestCollection.insertOne(newRequest)
  res.send(result)
});

// app.get("/foods/request", async (req, res) => {
//   try {
//     // Fetch all foods with status 'not available'
//     const result = await FoodCollection.find({ status: "not available" }).toArray();
//     if (result.length > 0) {
//       res.send(result); // Send the data to the client
//     } else {
//       res.status(404).send({ success: false, message: "No requested foods found." });
//     }
//   } catch (error) {
//     console.error("Error fetching requested foods:", error);
//     res.status(500).send({ success: false, message: "Internal Server Error" });
//   }
// });


app.get("/foods/request", async (req, res) => {
  const { userEmail } = req.query; // Get the logged-in user's email from the query parameter
console.log(userEmail);

  if (!userEmail) {
    return res.status(400).send({ success: false, message: "User email is required." });
  }

  try {
    // Fetch all foods with status 'not available' and userEmail as the logged-in user's email
    const result = await FoodCollection.find({
      status: "not available",
      userEmail: userEmail, // Filter by userEmail
    }).toArray();

    if (result.length > 0) {
      // Send the filtered data to the client only once
      return res.send(result);
    } else {
      // Avoid sending another response if we already sent one
      return res.status(404).send({ success: false, message: "No requested foods found for this user." });
    }
  } catch (error) {
    // Catch any errors and ensure only one response is sent
    console.error("Error fetching requested foods:", error);
    return res.status(500).send({ success: false, message: "Internal Server Error" });
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