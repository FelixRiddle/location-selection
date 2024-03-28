import { Express } from "express";
import axios from "axios";

import PortSeeker from "felixriddle.port-seeker";
import {
    AppNames,
    AppServerType,
    ServersLocation,
} from "felixriddle.my-types";
import {
    serversEnv,
    backdoorServerAccessUrl,
    expressAuthenticationUrl,
    realEstateUrl,
    SERVERS_DEFAULT_LOCATION,
} from "felixriddle.configuration-mappings";

import AppServer from "./AppServer";

const {
    BACKDOOR_SERVER_ACCESS_KEYWORD,
    EXPRESS_AUTHENTICATION_KEYWORD,
    REAL_ESTATE_KEYWORD,
} = serversEnv;

export interface LocationSelectionOptions {
    filePath: string,
    cb?: (location: string) => void
}

/**
 * Location selection
 * 
 * Features:
 * 
 * - Update location urls
 * This update project's local environment variables to that of the file app_server.json
 * 
 * - Server urls
 * These functions have the name of the repositories they fetch the url from the environment
 * or use the default if it fails.
 * 
 * - Location selector(selectLocation)
 * You give an express instance to this function and it automatically makes three attempts
 * to start a server at a given port:
 * 1) Use env.SERVER_PORT
 * 2) Use the default server port
 * 3) Use an ephemeral port
 * This third step does extra things like:
 * * Updates app_server.json
 * * Sends discovery request to every server, this tells other servers that the url of
 * a server has changed.
 */
export default class LocationSelection {
    serverType: AppNames;
    options: LocationSelectionOptions;
    debug: boolean = false;
    
    /**
     * 
     * cb:
     * The callback is called after the server is listening to.
     * The callback receives the URL location of the server
     */
    constructor(serverType: AppNames, options: LocationSelectionOptions = {
        filePath: new AppServer().filePath(),
        cb: undefined,
    }) {
        this.serverType = serverType;
        this.options = options;
    }
    
    // --- Environment ---
    // Use the environment to store servers location
    /**
     * Update location urls to those that are on the app server file
     */
    updateLocationUrls() {
        const appServer: AppServer = new AppServer();
        
        const servers: AppServerType = appServer.servers();
        
        process.env[EXPRESS_AUTHENTICATION_KEYWORD] = servers["express-authentication"];
        process.env[BACKDOOR_SERVER_ACCESS_KEYWORD] = servers["backdoor-server-access"];
        process.env[REAL_ESTATE_KEYWORD] = servers["express-real-estate"];
    }
    
    /**
     * Alias for update
     */
    envUpdateLocationUrls() {
        this.updateLocationUrls();
    }
    
    /**
     * Set default location on environment variables
     */
    envSetDefaultLocations() {
        process.env[EXPRESS_AUTHENTICATION_KEYWORD] = SERVERS_DEFAULT_LOCATION["express-authentication"];
        process.env[BACKDOOR_SERVER_ACCESS_KEYWORD] = SERVERS_DEFAULT_LOCATION["backdoor-server-access"];
        process.env[REAL_ESTATE_KEYWORD] = SERVERS_DEFAULT_LOCATION["express-real-estate"];
    }
    
    // --- Location selection ---
    /**
     * Select a location for a given express app
     * 
     * Port priority
     * process.env.SERVER_PORT > Default url port > Random ephemeral port
     * 
     */
    async selectLocation(app: Express, appName: AppNames) {
        
        // --- Ephemeral port ---
        const attempt3 = async () => {
            console.log(`Attempt 3`);
            
            // The original port didn't work?
            // Let's use another one
            const seeker = new PortSeeker();
            const port = await seeker.firstOpen();
            
            // TODO: Set the new port in configuration
            
            // TODO: Make other servers aware of it
            
            // If the server couldn't start then we will try with another port
            const serverInstance = app.listen(port, () => {
                console.log(`Server running at http://${process.env.SERVER_HOST}:${port}`);
            });
            
            serverInstance.on('error', (err) => {
                // console.log(`On error`);
                // console.error(err);
                
                console.log(`Server couldn't start!`);
                console.log(`No more attempts`);
            });
        }
        
        // --- Default port ---
        const attempt2 = async () => {
            console.log(`Attempt 2`);
            
            // Parse url
            const defaultUrl = SERVERS_DEFAULT_LOCATION[appName as keyof ServersLocation];
            const parsedDefaultUrl = new URL(defaultUrl);
            
            const port = parsedDefaultUrl.port;
            
            console.log(`New port: `, port);
            
            const serverInstance = app.listen(port, () => {
                console.log(`Server running at http://${process.env.SERVER_HOST}:${port}`);
            });
            
            serverInstance.on('error', async (err) => {
                // console.log(`On error`);
                // console.error(err);
                
                console.log(`Server couldn't start!`);
                await attempt3();
            });
        }
        
        // --- Environment port ---
        const attempt1 = async () => {
            // Will use 3000 if available, otherwise fall back to a random port
            // Try to open the server
            let unparsedPort = process.env.SERVER_PORT;
            
            console.log(`Attempt 1`);
            
            // If there's no port go to the next attempt
            if(typeof unparsedPort === "undefined") {
                return await attempt2();
            }
            
            // Parse port
            let port: number = parseInt(unparsedPort);
            
            console.log(`Port: `, port);
            
            const instance = app.listen(port, () => {
                console.log(`Server running at http://${process.env.SERVER_HOST}:${port}`);
            });
            
            // To catch errors you have to do this
            // (I didn't know 😭😭)
            return instance.on('error', async (err) => {
                // console.log(`On error`);
                // console.error(err);
                
                console.log(`Server couldn't start!`);
                return await attempt2();
            });
        }
        
        await attempt1();
    }
    
    /**
     * Select location but ephemeral only
     * 
     * @param app 
     */
    async selectEphemeral(app: Express) {
        const seeker = new PortSeeker();
        const port = await seeker.firstOpen();
        
        // TODO: Set the new port in configuration
        
        // TODO: Make other servers aware of it
        
        // If the server couldn't start then we will try with another port
        const serverInstance = app.listen(port, () => {
            console.log(`Server running at http://localhost:${port}`);
        });
        
        serverInstance.on('error', (err) => {
            // console.log(`On error`);
            // console.error(err);
            
            console.log(`Server couldn't start!`);
            console.log(`No more attempts`);
        });
    }
    
    /**
     * Select from file over ephemeral
     * 
     * If this app location is already written in the config file, then use that one, otherwise
     * use an ephemeral port.
     */
    async selectConfigOverEphemeral(app: Express) {
        if(this.debug) {
            console.log(`Select config over ephemeral`);
        }
        
        // Get location from file.
        const appLocation = new AppServer().getServer(this.serverType);
        if(this.debug) {
            console.log(`App location: `, appLocation);
        }
        
        // Server instance will be stored here
        let serverInstance: any = undefined;
        if(appLocation) {
            // Forks
            const location = new URL(appLocation);
            const port = Number(location.port);
            
            serverInstance = app.listen(port, () => {
                console.log(`Server running at ${appLocation}`);
                if(this.options.cb) this.options.cb(appLocation);
            });
        } else {
            // Primary cluster
            console.log(`Primary cluster`);
            
            // Select ephemeral port
            const seeker = new PortSeeker();
            const ephemeralPort = await seeker.firstOpen();
            
            // --- Slight delay between acquiring a port and starting the actual server ---
            // But the chance of error is too tiny, rather make code to try again
            
            // Set the new port in app configuration
            const srv = new AppServer();
            const appLocation = `http://localhost:${ephemeralPort}`;
            srv.upsertServer(this.serverType, appLocation);
            
            // Make other servers aware of changes
            await this.discover();
            
            // Run server
            serverInstance = app.listen(ephemeralPort, () => {
                console.log(`Server running at ${appLocation}`);
                if(this.options.cb) this.options.cb(appLocation);
            });
        }
        
        serverInstance.on('error', (_err: any) => {
            // console.log(`On error`);
            // console.error(err);
            
            console.log(`Server couldn't start!`);
            console.log(`No more attempts`);
        });
    }
    
    // --- Discovery ---
    /**
     * Tell servers to update
     */
    async discover() {
        const servers: AppServerType = new AppServer().servers();
        if(this.debug) {
            console.log(`Servers: `, servers);
        }
        
        // Send a request to every server
        for(const [serverName, url] of Object.entries(servers)) {
            if(this.debug) {
                console.log(`Sending request to: ${url}`);
            }
            
            const body = {
                appName: serverName,
            };
            
            // With axios
            const instance = axios.create({
                baseURL: url,
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            const res = await instance.post("/srv/location/update", body)
                .then((res) => res)
                .catch((err) => {
                    console.log(`Axios error`);
                    // console.error(err);
                    
                    console.log(`Error code: `, err.code);
                    console.log(`Method: `, err.config.method);
                    console.log(`Url: `, err.config.url);
                    if(err.body) {
                        console.log(`Response body: `, err.body);
                    }
                });
        }
    }
    
    /**
     * Select location, but env's 'PORT' over ephemeral.
     * 
     * This is for clustering, so that subsequent clusters can use this function again.
     * 
     * Forks don't have main thread's environment variables.
     * 
     * @deprecated
     */
    async selectEnvOverEphemeral(app: Express) {
        // Check if port exists
        const port = process.env.PORT;
        let serverInstance: any = undefined;
        console.log(`Environment port: `, port);
        if(port) {
            serverInstance = app.listen(port, () => {
                console.log(`Server running at http://localhost:${port}`);
            });
        } else {
            console.log(`This should be only for the primary cluster!`);
            // Select ephemeral port
            const seeker = new PortSeeker();
            const ephemeralPort = await seeker.firstOpen();
            // process.env.PORT = `${ephemeralPort}`;
            // console.log(`Port set, fetch it: `, process.env.PORT);
            
            // --- Slight delay between acquiring a port and starting the actual server ---
            // But the chance of error is too tiny, rather make code to try again
            
            // Set the new port in app configuration
            const srv = new AppServer();
            const appLocation = `http://localhost:${ephemeralPort}`;
            srv.upsertServer(this.serverType, appLocation);
            
            // TODO: Make other servers aware of it
            // This involves sending a request to their server config if they have one
            // 'POST /srv/location/update'
            // { appName: '' }
            
            // Run server
            serverInstance = app.listen(ephemeralPort, () => {
                console.log(`Server running at ${appLocation}`);
                if(this.options.cb) this.options.cb(appLocation);
            });
        }
        
        serverInstance.on('error', (_err: any) => {
            // console.log(`On error`);
            // console.error(err);
            
            console.log(`Server couldn't start!`);
            console.log(`No more attempts`);
        });
    }
    
    // --- Location selection ---
    /**
     * Express authentication or default
     */
    static expressAuthentication() {
        const url = expressAuthenticationUrl();
        if(!url || url === 'undefined') {
            return SERVERS_DEFAULT_LOCATION["express-authentication"];
        }
        
        return url;
    }
    
    /**
     * 
     */
    static backdoorServerAccess() {
        const url = backdoorServerAccessUrl();
        if(!url || url === 'undefined') {
            return SERVERS_DEFAULT_LOCATION["backdoor-server-access"];
        }
        
        return url;
    }
    
    /**
     * 
     */
    static realEstate() {
        const url = realEstateUrl();
        if(!url || url === 'undefined') {
            return SERVERS_DEFAULT_LOCATION["express-real-estate"];
        }
        
        return url;
    }
}
