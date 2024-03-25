import express from "express";

import LocationSelection from "../../server/LocationSelection";

const serverConfigRouter = express.Router();

serverConfigRouter.get("/update", (req, res) => {
    try {
        console.log(`GET /server_config/update`);
        
        const loc = new LocationSelection();
        loc.updateLocationUrls();
        
        return res.send({
            serversUpdated: true,
            messages: []
        });
    } catch(err) {
        console.error(err);
        
        return res.send({
            serversUpdated: false,
            messages: []
        });
    }
})

export default serverConfigRouter;
