onmessage = ({data}) => {
  postMessage(`received in new thread (webworker): ${data}`)
}