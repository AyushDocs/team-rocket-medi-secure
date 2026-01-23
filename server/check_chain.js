import Web3 from "web3";
const web3 = new Web3("http://localhost:7545");
web3.eth.getChainId().then(console.log).catch(console.error);
