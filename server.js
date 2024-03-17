const express = require("express");
const app = express();
app.use(express.json());
const mysql = require("mysql2");
const nodemailer = require("nodemailer");
const twilio = require("twilio");

const connection = mysql.createConnection({
  host: "192.99.34.118",
  user: "codewithx_db_user",
  password: "Project2023",
  database: "codewithx_Project",
});

const port = 8080;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }

  console.log("Connected to the database!");
});

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

// login Endpoint
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  connection.query(
    "SELECT * FROM salesRep WHERE NIC = ? AND password = ?",
    [username, password],
    (err, results) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      if (results.length === 0) {
        res.status(403).json({ message: "Incorrect username or password" });
        return;
      }

      res.status(200).json({ message: "Login successful", results });
    }
  );
});

//list all the shops
app.get("/shops", (req, res) => {
  const salesRepresentativeId = req.query.SRID;

  const query = `
    SELECT s.*
    FROM salesRepRoute AS srr
    JOIN route AS r ON srr.Rcode = r.Rcode
    JOIN shop AS s ON r.Rcode = s.Rcode
    WHERE srr.SRID = ?
  `;

  connection.query(query, [salesRepresentativeId], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    res.status(200).json(results);
  });
});

// list all the shop locations
app.get("/routes", (req, res) => {
  const salesRepresentativeId = req.query.SRID;

  const query = `
    SELECT r.*
    FROM salesRepRoute AS srr
    JOIN route AS r ON srr.Rcode = r.Rcode
    JOIN salesRep AS sr ON srr.SRID = sr.SRID
    WHERE sr.SRID = ?
  `;

  connection.query(query, [salesRepresentativeId], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    res.status(200).json(results);
  });
});

// register customer
app.post("/register", (req, res) => {
  const {
    firstName,
    lastName,
    address,
    shopName,
    NICNumber,
    mobileNumber,
    email,
    location,
  } = req.body;

  connection.query(
    "INSERT INTO shop (SID, email, shop_name, location, address, Fname, Lname, phoneNo, NIC) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      Math.floor(Math.random() * (100000 - 0)) + 0,
      email,
      shopName,
      location,
      address,
      firstName,
      lastName,
      mobileNumber,
      NICNumber,
    ],
    (err) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      res.status(200).json({ message: "Customer registered successfully" });
    }
  );
});

// reset password salesRep
app.post("/resetPassword", (req, res) => {
  const { NIC, oldPassword, newPassword } = req.body;

  // check if the current password is correct
  connection.query(
    "SELECT * FROM salesRep WHERE NIC = ? AND password = ?",
    [NIC, oldPassword],
    (err, results) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      if (results.length === 0) {
        res.status(403).json({ message: "Incorrect current password" });
        return;
      }

      // update the password
      connection.query(
        "UPDATE salesRep SET password = ? WHERE NIC = ?",
        [newPassword, NIC],
        (err) => {
          if (err) {
            console.error("Error connecting to database:", err);
            res.status(500).json({ message: "Internal server error" });
            return;
          }

          res.status(200).json({ message: "Password updated successfully" });
        }
      );
    }
  );
});

// reset password password value in the salesRep if the NIC aand SRID are correct
// reset value should be empty
app.post("/forgotPassword", (req, res) => {
  const { NIC, SRID } = req.body;

  console.log(NIC, SRID);

  connection.query(
    "SELECT * FROM salesRep WHERE NIC = ? AND SRID = ?",
    [NIC, SRID],
    (err, results) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      console.log(results);

      if (results.length === 0) {
        res.status(403).json({ message: "Incorrect NIC or SRID" });
        return;
      }

      // update the password
      connection.query(
        "UPDATE salesRep SET password = ? WHERE NIC = ?",
        ["", NIC],
        (err) => {
          if (err) {
            console.error("Error connecting to database:", err);
            res.status(500).json({ message: "Internal server error" });
            return;
          }

          res.status(200).json({ message: "Password reset successfully" });
        }
      );
    }
  );
});

// daily item list
app.get("/dailyItemList", (req, res) => {
  const { SRID } = req.query;

  const query = `
    SELECT s.*
    FROM salesRep AS sr
    JOIN stock AS s ON sr.stockID = s.stockID
    WHERE sr.SRID = ?
  `;

  connection.query(query, [SRID], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    res.status(200).json(results);
  });
});

// list all the products
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM product", (err, results) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    res.status(200).json(results);
  });
});

// list all the categories
app.get("/categories", (req, res) => {
  connection.query("SELECT * FROM category", (err, results) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    res.status(200).json(results);
  });
});

// list all manufacturers based on the category ID
app.get("/manufacturers", (req, res) => {
  const { categoryID } = req.query;

  connection.query(
    "SELECT * FROM manufacturer WHERE categoryID = ?",
    [categoryID],
    (err, results) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }
      res.status(200).json(results);
    }
  );
});

// Retrieve products by category ID and manufacturer ID
app.get("/productsByCategoryAndManufacturer", (req, res) => {
  const { categoryID, manufacturerID } = req.query;

  const query = `
    SELECT p.* 
    FROM product p
    JOIN productMunufacture pm ON p.PID = pm.PID
    WHERE p.categoryID = ? AND pm.MID = ?
  `;

  connection.query(query, [categoryID, manufacturerID], (err, results) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }
    res.status(200).json(results);
  });
});

//update the password
app.put("/updatePassword", (req, res) => {
  const { password, NIC } = req.body;

  connection.query(
    "UPDATE sales_rep SET password = ? WHERE NIC = ?",
    [password, NIC],
    (err) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      res.status(200).json({ message: "Password updated successfully" });
    }
  );
});

//list all the products
app.get("/products", (req, res) => {
  connection.query("SELECT * FROM product", (err, results) => {
    if (err) {
      console.error("Error connecting to database:", err);
      res.status(500).json({ message: "Internal server error" });
      return;
    }

    res.status(200).json(results);
  });
});

// send ebill
app.post("/sendEbill", async (req, res) => {
  let tableRows = "";
  let returnTableRows = "";

  req.body.orderList?.forEach((item) => {
    tableRows += `
        <tr>
          <td>${item.productID}</td>
          <td>${item.product}</td>
          <td>Rs.${item.price}</td>
          <td>${item.quantity}</td>
          <td>${item.price * item.quantity}</td>
        </tr>
      `;
  });

  req.body.returnList?.forEach((item) => {
    returnTableRows += `
        <tr>
          <td>${item.productID}</td>
          <td>${item.product}</td>
          <td>Rs.${item.price}</td>
          <td>${item.quantity}</td>
          <td>${item.price * item.quantity}</td>
        </tr>
      `;
  });

  const totalAmount = req.body.total;
  const shopName = req.body.shopName?.shop_name;
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  let testAccount = await nodemailer.createTestAccount();

  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Derana" <derana@test.com>', // sender address
    to: "john@gmail.com", // list of receivers
    subject: "E Bill", // Subject line
    html: `<html>
<head>
  <title>Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
    }
    .logo {
      text-align: center;
      margin-bottom: 20px;
    }
    .company-info {
      text-align: center;
      margin-bottom: 20px;
    }
    .invoice-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .invoice-details-left {
      width: 50%;
    }
    .invoice-details-right {
      width: 50%;
      text-align: right;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table th,
    .table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .table th {
      background-color: #f5f5f5;
    }
    .total {
      font-weight: bold;
      text-align: right;
    }
    .summary {
      text-align: right;
      margin-bottom: 20px;
    }
    .thank-you {
      text-align: center;
      margin-bottom: 20px;
    }
    .reserved {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <img src="https://i.ibb.co/104WpjB/Derana.png" alt="Company Logo" width="220" height="80">
    </div>
    <div class="company-info">
      <p>From Sri Lanka</p>
      <p>Contact Number: 123-456-7890</p>
    </div>
    <div class="invoice-details">
      <div class="invoice-details-left">
        <p>Date: ${currentDate}</p>
        <p>Invoice Number: 12345</p>
        <p>Shop ID: 54321</p>
        <p>Machine ID: 67890</p>
        <p>Cashier Name: John Doe</p>
      </div>
      <div class="invoice-details-right">
        <p>${shopName}</p>
        <p>Time: ${currentTime}</p>
      </div>
    </div>
    <center><h3>Order List</h3></center>
    <table class="table">
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
      ${tableRows}
    </table>
    <br/>
    <hr/>
    <br/>
    <center><h3>Return List</h3></center>
    <table class="table">
      <tr>
        <th>Item</th>
        <th>Description</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
      ${returnTableRows}
    </table>
    <div class="summary">
      <p>Discount: Rs.0.00</p>
      <p class="total">Total Gross Amount: Rs.${totalAmount}</p>
      <p class="total">Total Net Amount: Rs.${totalAmount}</p>
    </div>
    <p>Number of Items: ${req.body.orderList?.length || 0}</p>
    <p>Number of Returns: ${req.body.returnList?.length || 0}</p>
    <div class="thank-you">
      <p>Thank you for your business!</p>
    </div>
    <div class="reserved">
      <p>All rights reserved &copy; 2023</p>
    </div>
  </div>
</body>
</html>
	`, // html body
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  return res.status(200).json({
    message: "Email sent successfully",
    previewURL: nodemailer.getTestMessageUrl(info),
  });
});

// send total using SMS
app.post("/sendTotal", async (req, res) => {
  const accountSid = "";
  const authToken = "";
  const client = twilio(accountSid, authToken);

  try {
    const message = await client.messages.create({
      body: `Total: Rs${req.body.total}. Thank you for your business!`,
      from: "+13613013033",
      to: req.body.shopNumber,
    });

    console.log("SMS sent successfully");
    console.log("Message SID:", message.sid);
    res.status(200).json({
      message: "SMS sent successfully",
      messageSID: message.sid,
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
    res.status(403).json({
      message: "Error sending SMS",
      error: error,
    });
  }
});

// new feedback
app.post("/feedback", async (req, res) => {
  const { SID, comment } = req.body;

  connection.query(
    "INSERT INTO feedback (FID, comment, SID) VALUES (?, ?, ?)",
    [Math.floor(Math.random() * (100000 - 0)) + 0, comment, SID],
    (err) => {
      if (err) {
        console.error("Error connecting to database:", err);
        res.status(500).json({ message: "Internal server error" });
        return;
      }

      res.status(200).json({ message: "Feedback submitted successfully" });
    }
  );
});

// daily item list=stock table
