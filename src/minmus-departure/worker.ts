self.onmessage = (e) => {
    console.log("Worker received:")
    console.log(e.data);
    self.postMessage({
        answer: 42,
    });
};
