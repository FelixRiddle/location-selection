import AppServer from "./server/AppServer";
import LocationSelection from "./server/LocationSelection";
import serverConfigRouter from "./routes/index";

export {
    // Discovery route
    // Add this route to every project and they will know that the environment variables have to be updated.
    serverConfigRouter,
    
    // App server configuration
    AppServer,
    LocationSelection,
}
