# bc-listener
BlockChain listener

## Usage
```
const Listener = require('bc-listener');

let listener = new Listener({
    provider,  // implement your own provider based on providers/*
    storage,  // implement your own storage (see defaults/storage.js)
    logger,
    confirmations: 10,
    update_interval: 5000,
    start_height: 0
});
```
