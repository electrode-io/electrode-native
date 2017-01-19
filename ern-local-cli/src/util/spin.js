import cliSpinner from 'cli-spinner';
const Spinner = cliSpinner.Spinner;

// Show a spinner next to a given message for the duration of a promise
// spinner will stop as soon as the promise is completed
//
// msg: The message to display
// prom: The promise to wrap. When promise complete, the spinner will stop
// clean: true if you want the message to disappear once spin stops, false otherwise
export async function spin(msg, prom, clean = false) {
  let spinner = new Spinner(msg);
  spinner.setSpinnerString(18);
  spinner.start();
  try {
    let result = await prom;
    return result;
  }
  finally {
    if (!clean) {
      console.log('\n');
    }
    spinner.stop(clean);
  }
}
