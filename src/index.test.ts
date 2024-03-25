import serverTestAll from "./server/index.test";

/**
 * Test all
 */
export default async function testAll() {
    console.log(`Running all tests`);
    
    serverTestAll();
}
