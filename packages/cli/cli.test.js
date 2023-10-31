const sinon = require("sinon");
const mocha = require("mocha");
const chai = require("chai");
const exec = require("child_process").exec;
const promisify = require("util").promisify;
const execAsync = promisify(exec);
const path = require('path');
describe("cli", async () => {
  let originalArgv;
  const sandbox = sinon.createSandbox();
  let stdlog;
  beforeEach(() => {
    // Remove all cached modules. The cache needs to be cleared before running
    // each command, otherwise you will see the same results from the command
    // run in your first test in subsequent tests.

    // Each test overwrites process arguments so store the original arguments
    originalArgv = process.argv;
  });

  afterEach(() => {
    sandbox.restore();
    // Set process arguments back to the original value
    process.argv = originalArgv;
  });

  it("should run install command", async () => {
    const filePath = path.resolve(__dirname, "./cli.js");
    const stdlog = await execAsync(`npx ts-node ${filePath} --help`);
    console.log("------------------", stdlog);
  });
});

/**
 * Programmatically set arguments and execute the CLI script
 *
 * @param {...string} args - positional and option arguments for the command to run
 */
async function runCommand(...args) {
  process.argv = [
    "node", // Not used but a value is required at this index in the array
    "cli.js", // Not used but a value is required at this index in the array
    ...args,
  ];

  // Require the yargs CLI script
  return require("./cli");
}
