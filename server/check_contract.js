import Web3 from "web3";
const web3 = new Web3("http://localhost:7545");
const addr = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab";
web3.eth.getCode(addr).then(code => {
    console.log("Code at", addr, ":", code === "0x" ? "EMPTY (EOA)" : code.substring(0, 50) + "...");
}).catch(console.error);
