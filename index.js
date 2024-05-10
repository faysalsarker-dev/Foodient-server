const express = require("express");

const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

//

// midleware

// app.use(
//   cors({
//     origin: ["http://localhost:5173/", "http://localhost:5173/"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3liiwir.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodCollection = client.db("food_collection").collection("food");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.DB_SECRET, { expiresIn: "1h" });
      res
        .cookie("token", token, {
          httpOnly: true,
          //   secure: true,
          //   sameSite: none,
        })
        .send({ success: true });
    });

    app.post("/addfood", async (req, res) => {
      const data = req.body;
      console.log(data);
      const result = await foodCollection.insertOne(data);
      res.send(result);
    });

    app.get("/allfood", async (req, res) => {
      const result = await foodCollection.find().toArray();
      res.send(result);
    });

    app.get('/food/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await foodCollection.findOne(query).toArray()
      res.send(result)
    })

    app.get("/Available-Foods", async (req, res) => {
      const query = {Status:'available'}
      const result = await foodCollection.find(query).toArray()
      res.send(result)
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("sercer is running");
});
app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
