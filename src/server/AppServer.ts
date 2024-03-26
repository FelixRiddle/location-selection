import fs from "node:fs";

import {
    // Interface
    AppServerType,
    // Interface indexes
    AppNames
} from "felixriddle.my-types";
import { appDataFolderPath } from "felixriddle.configuration-mappings";

/**
 * app_server.json file abstraction
 */
export default class AppServer {
    constructor() {
        
    }
    
    /**
     * Folder path
     * 
     * @returns 
     */
    #folderPath() {
        const filePath = appDataFolderPath();
        return `${filePath}/config`
    }
    
    /**
     * Get file path
     */
    filePath(): string {
        const folderPath = this.#folderPath();
        return `${folderPath}/app_server.json`;
    }
    
    /**
     * Create folder
     */
    createFolder() {
        try {
            fs.mkdirSync(this.#folderPath());
        } catch(err) {
            // Folder exists
        }
    }
    
    // --- Operations ---
    /**
     * Insert or update a server
     */
    upsertServer(serverName: AppNames, serverLocation: string) {
        try {
            const fileData = fs.readFileSync(this.filePath(), 'utf-8');
            const servers: AppServerType = JSON.parse(fileData);
            
            // Update server
            servers[serverName] = serverLocation;
            
            fs.writeFileSync(this.filePath(), JSON.stringify(servers));
        } catch(err) {
            // Case of failing we have to create the file altogether
            const servers: AppServerType = { };
            
            // Insert server
            servers[serverName] = serverLocation;
            
            fs.writeFileSync(this.filePath(), JSON.stringify(servers));
        }
    }
    
    /**
     * Get server
     * 
     * In case of failing create the file if it doesn't exists.
     */
    getServer(serverName: AppNames): string | undefined {
        try {
            // TODO: File path should change depending on a variable called 'Precision'
            const fileData = fs.readFileSync(this.filePath(), 'utf-8');
            const servers: AppServerType = JSON.parse(fileData);
            
            // Update server
            return servers[serverName];
        } catch(err) {
            // Case of failing create the file why not
            const servers: AppServerType = { };
            
            fs.writeFileSync(this.filePath(), JSON.stringify(servers));
        }
    }
    
    /**
     * Get file data
     */
    servers(): AppServerType {
        const fileData = fs.readFileSync(this.filePath(), 'utf-8');
        const servers: AppServerType = JSON.parse(fileData);
        return servers;
    }
}
