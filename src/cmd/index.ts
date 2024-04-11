import fs from "node:fs";
import { ArgumentParser } from "argparse";

import { appDataFolderPath } from "felixriddle.configuration-mappings";

import AppServer from "../server/AppServer";
import testAll from "../index.test";

const parser = new ArgumentParser({
    description: "Argparse example"
});

parser.add_argument("--test", {
    help: "Execute tests",
    action: "store_true"
});

// --- Prints ---
parser.add_argument("--print-app-directory", {
    help: "Print app directory using the priority",
    action: "store_true"
});

parser.add_argument("--print-property-folder", {
    help: "Print a sample user property folder",
    action: "store_true"
});

/**
 * Execute commands
 */
export default async function executeCommands() {
    const args = parser.parse_args();
    
    // Create folders
    fs.mkdirSync(appDataFolderPath(), { recursive: true });
    
    const appServer = new AppServer();
    appServer.createFolder();
    
    if(args.test) {
        testAll();
    }
    
    // process.exit(0);
};

executeCommands();
