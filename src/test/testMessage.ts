import colors from "./colors";

/**
 * Print a test message
 * 
 * An expression is considered successful if it is not falsy
 * 
 * @param expression 
 * @param testName 
 */
export function testMessage(expression: any, testName: string) {
    const message = `${testName}...`;
    if(expression) {
        console.log(message, colors.fg.green, 'Ok', colors.fg.white);
    } else {
        console.log(message, colors.fg.red, 'Error', colors.fg.white);
    }
}
