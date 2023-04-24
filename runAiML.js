const { spawn } = require('child_process');
const { aimlPath } = require('./configAiMlPath');

const logOutput = (name) => (data) => console.log(`[${name}] ${data.toString()}`)

function run() {
  const process = spawn('python', [aimlPath]);
  process.stdout.on(
    'data',
    logOutput('stdout')
  );
  process.stderr.on(
    'data',
    logOutput('stderr')
  );
}

(() => {
  try {
    run()
    // process.exit(0)
  } catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
})();