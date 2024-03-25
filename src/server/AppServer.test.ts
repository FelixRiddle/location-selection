import { testMessage } from "../test/testMessage";
import AppServer from "./AppServer";

/**
 * Test server exists
 */
export function testServerExists() {
    const appServer = new AppServer();
    appServer.createFolder();
    
    // Test
    const serverLocation = "http://localhost:38001";
    const serverKey = "express-authentication";
    appServer.upsertServer(serverKey, serverLocation);
    const data = appServer.servers();
    
    testMessage(serverLocation === data[serverKey], "Test server exists");
}
