onmessage = ({data}) => {
  debugger;
  postMessage(`received in new thread (webworker): ${data}`)
}