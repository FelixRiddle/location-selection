import { Express } from "express";

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
    constructor() { }
    
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
