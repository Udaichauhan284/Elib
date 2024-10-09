import { config } from "./src/config/config";
import app from "./src/app";
import connectDB from "./src/config/db";

const startServer = async () => {
  const PORT = config.port || 3000;
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is started and listening on ${PORT}`);
  });
};
startServer();
