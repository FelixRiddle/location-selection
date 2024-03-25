// Not gonna lie, I think this should be split into another package

// Servers must implement this route at the root part
import express from "express";

import serverConfigRouter from "./server_config";

const serverConfigurationRouter = express.Router();

serverConfigurationRouter.use("/server_config", serverConfigRouter);

export default serverConfigurationRouter;
