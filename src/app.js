const express = require("express");
const app = express();
const eventRoutes = require("./routes/eventRoute");
const seatRoutes = require("./routes/seatRoute");


app.use(express.json());

app.use("/events", eventRoutes);
app.use("/seats", seatRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
