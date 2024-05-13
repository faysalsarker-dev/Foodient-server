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
app.use(
  cors({
    origin: ["http://localhost:5173", "https://foodient-ca6e1.web.app"],
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



const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.DB_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    const foodCollection = client.db("food_collection").collection("food");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.DB_SECRET);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const user = req.body;
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
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

    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-req-foods/:email", verifyToken, async (req, res) => {
      console.log(req.user);
      const email = req.params.email;
      if(req.user.email!==email) return res.status(401).send({message: 'unauthorized access'})
      const query = { requestor_email: email };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/manage-my-foods/:email",verifyToken, async (req, res) => {
      console.log(req.user);
      const email = req.params.email;
      if(req.user.email!==email) return res.status(401).send({message: 'unauthorized access'})
      const query = { Doner_email: email };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/delete-food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/update/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const info = {
        $set: {
          ...data,
        },
      };

      const result = await foodCollection.updateOne(query, info, options);
      res.send(result);
    });

    app.patch("/food-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const data = req.body;
      const info = {
        $set: {
          name: data.name,
          img: data.img,
          FoodQuantity: data.FoodQuantity,
          PickupLocation: data.PickupLocation,
          AdditionalNotes: data.AdditionalNotes,
          expiredate: data.expiredate,
          Doner_name: data.Doner_name,
          Doner_email: data.Doner_email,
          Status: data.Status,
          requestor_email: data.requestor_email,
          requestor_name: data.requestor_name,
        },
      };
      console.log(info);
      const result = await foodCollection.updateOne(query, info, options);
      res.send(result);
    });











    app.get('/featured-food',async(req,res)=>{
      const query = {Status:'available'}
      const option = { sort: { FoodQuantity:  -1  } };
      const result = await foodCollection.find(query,option).limit(6).toArray()
      res.send(result);
    })










    app.get("/Available-Foods", async (req, res) => {
      const search = req.query.search;
      const sort = req.query.sort;

      const query = { Status: "available" };
      if (search) {
        query.name = { $regex: search, $options: "i" };
      }

      let option = {};

      if (sort) {
        option = { sort: { expiredate: sort === "ascending" ? 1 : -1 } };
      }
      const result = await foodCollection.find(query, option).toArray();
      res.send(result);
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
