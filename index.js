const express = require("express");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.send({ message: "User UnAuthorized ", error: true });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      console.log(error);
      return res.send({ message: "User UnAuthorized ", error: true });
    }
    req.decoded = decoded;
    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.pkahof5.mongodb.net/?retryWrites=true&w=majority`;

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
    const featuredCollection = client.db("BloodLink").collection("featured");
    const usersCollection = client.db("BloodLink").collection("users");
    const fundCollection = client.db("BloodLink").collection("fund");
    const donationRequestsCollection = client
      .db("BloodLink")
      .collection("donation-requests");
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send(token);
    });

    app.get("/featured", async (req, res) => {
      const data = await featuredCollection.find().toArray();
      res.send(data);
    });

    app.post("/users", async (req, res) => {
      const data = req.body;
      const result = await usersCollection.insertOne(data);
      res.send(result);
    });
    app.get("/user-role/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.patch("/update-user-status/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data.status);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status:data.status
        },
      };
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });
    app.patch("/update-user-role/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      console.log(data.role);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role:data.role
        },
      };
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });


    //  users Api
    app.get("/all-blood-donation-requests", async (req, res) => {
      const data = await donationRequestsCollection.find().toArray();
      res.send(data);
    });
    app.get("/blood-donation-request/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestsCollection.findOne(query);
      res.send(result);
    });
    app.patch("/update-req-status/:id", async (req, res) => {
      const id = req.params.id;
      const data = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          donationStatus: data.currentStatus,
          donorName: data.donorName,
          donorEmail: data.donorEmail,
        },
      };
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put('/update-blood-donation-request/:id',async (req,res)=>{
      const id=req.params.id;
      const dataForUpdate=req.body;
      const {requesterName,requesterEmail,recipientName,recipientBloodGroup,recipientDistrict,recipientUpazila,hospitalName,fullAddress,donationDate,donationTime,requestMessage,donationStatus}=dataForUpdate;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          requesterName,requesterEmail,recipientName,recipientBloodGroup,recipientDistrict,recipientUpazila,hospitalName,fullAddress,donationDate,donationTime,requestMessage,donationStatus
        },
      };
      const result = await donationRequestsCollection.updateOne(filter, updateDoc, options);
      res.send(result)
    })

    app.delete("/blood-donation-request-delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await donationRequestsCollection.deleteOne(query);
      res.send(result);
    });
    app.get(
      "/blood-donation-individual/:email",
      verifyToken,
      async (req, res) => {
        const email = req.params.email;
        const query = {
          requesterEmail: email,
        };
        const result = await donationRequestsCollection.find(query).toArray();
        res.send(result);
      }
    );

    app.get("/user-status/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });
    app.post("/blood-donation-request", async (req, res) => {
      const data = req.body;
      const result = await donationRequestsCollection.insertOne(data);
      res.send(result);
    });
    app.get("/all-blood-donation-request", async (req, res) => {
      const email = req.query.email;
      if (email) {
        const query = {
          requesterEmail: email,
        };
        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        const skip = page * limit;
        const result = await donationRequestsCollection
          .find(query)
          .skip(skip)
          .limit(limit)
          .toArray();
        res.send(result);
      }
    });
    app.get("/my-bloodDonationCount/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = {
        requesterEmail: email,
      };
      const result = await donationRequestsCollection.find(query).toArray();
      res.send(result);
    });

    //  admin api
    app.get("/all-users", async (req, res) => {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      const skip = page * limit;
      const result = await usersCollection
        .find()
        .skip(skip)
        .limit(limit)
        .toArray();
      res.send(result);
    });
    app.get("/usersCount", verifyToken, async (req, res) => {
      const result = await usersCollection.estimatedDocumentCount();
      res.send({ result });
    });
    app.get("/bloodDonationCount", verifyToken, async (req, res) => {
      const result = await donationRequestsCollection.estimatedDocumentCount();
      res.send({ result });
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running on port: ${port}`);
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});
