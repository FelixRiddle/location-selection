import { expressAuthenticationUrl } from "felixriddle.configuration-mappings";

import { testMessage } from "../test/testMessage";
import AppServer from "./AppServer";
import { testServerExists } from "./AppServer.test";
import LocationSelection from "./LocationSelection";
import { locationSelectionFallbackToDefault } from "./LocationSelection.test";

/**
 * Test a location was updated
 */
export function testGetLocationUpdated() {
    const appServer = new AppServer();
    appServer.createFolder();
    
    // Test
    const serverLocation = "http://localhost:38421";
    const serverKey = "express-authentication";
    appServer.upsertServer(serverKey, serverLocation);
    
    // Update servers
    const newLoc = new LocationSelection(serverKey);
    newLoc.updateLocationUrls();
    
    // Fetch that one server
    const actualUrl = expressAuthenticationUrl();
    
    testMessage(serverLocation === actualUrl, "Location updated, fetch from environment");
}

/**
 * Run all tests
 */
export default function serverTestAll() {
    testServerExists();
    testGetLocationUpdated();
    locationSelectionFallbackToDefault();
}
