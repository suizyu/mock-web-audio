/** AudioWorklet 用プロセッサ（Blob URL 経由で audioContext.addModule に渡す） */
export const RECORDER_WORKLET_SOURCE = `
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel && channel.length > 0) {
      this.port.postMessage(channel.slice(0));
    }
    return true;
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`

export const RECORDER_WORKLET_PROCESSOR_NAME = 'recorder-processor'
