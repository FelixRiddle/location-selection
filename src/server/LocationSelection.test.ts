import { SERVERS_DEFAULT_LOCATION } from "felixriddle.configuration-mappings";

import { testMessage } from "../test/testMessage";
import LocationSelection from "./LocationSelection";

/**
 * These should fallback to the default
 */
export function locationSelectionFallbackToDefault() {
    const def = SERVERS_DEFAULT_LOCATION['backdoor-server-access'];
    const newUrl = LocationSelection.backdoorServerAccess();
    
    testMessage(
        def === newUrl,
        "Location selection fallback to default"
    );
}
