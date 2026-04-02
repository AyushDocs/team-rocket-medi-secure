# Team Rocket Medi Secure

**Team Rocket Medi Secure** is a decentralized healthcare platform designed to empower patients with control over their medical data. By leveraging **Ethereum** and **IPFS**, it ensures that medical records are secure, immutable, and accessible only to authorized parties. The platform integrates a modern web interface for seamless interaction between patients and doctors, including features for file sharing, appointment scheduling, and secure communication.

## 🚀 Features

- **Decentralized File Storage**: Securely upload and store medical records on **IPFS** (InterPlanetary File System), ensuring data permanence and decentralization.
- **Patient-Controlled Access**: Patients own their data. They can grant or revoke access to doctors for specific durations.
- **Role-Based Dashboards**: Custom dashboards for **Patients** and **Doctors** to manage their respective workflows.
- **Secure File Sharing**: Share medical records with doctors or other parties securely.
- **Data Monetization (Optional)**: Patients have the option to voluntarily sell their anonymized data for research purposes.
- **Appointment Scheduling**: Integrated booking system for patients to schedule visits with doctors.
- **Secure Chat**: Real-time, encrypted chat between patients and doctors for consultations.
- **Analytics**: Visual insights into health data and access logs.
- **Wallet Integration**: Seamless login and transaction signing using **MetaMask**.

## 🛠 Technology Stack

### Blockchain & Storage
- **Ethereum (Solidity)**: Smart contracts for access control, identity management, and logic (`Doctor.sol`, `Patient.sol`).
- **IPFS**: Decentralized storage for medical files.
- **Truffle**: Framework for smart contract development and deployment.

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React, TypeScript, App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with Radix UI primitives.
- **Web3 Integration**: `ethers.js`, `web3.js` for interacting with smart contracts.
- **Charts**: `recharts` for analytics visualization.

### Backend
- **Server**: Node.js with [Express](https://expressjs.com/).
- **Storage**: IPFS HTTP Client for interfacing with IPFS nodes.
- **Real-time Services**: **Firebase** for chat and off-chain coordination.

## 📂 Project Structure

```bash
team-rocket-medi-secure/
├── contracts/          # Solidity smart contracts
│   ├── contracts/      # Source files (Doctor.sol, Patient.sol)
│   ├── migrations/     # Deployment scripts
│   └── test/           # Smart contract tests
├── frontend/           # Next.js web application
│   ├── src/app/        # App router pages
│   ├── src/components/ # Reusable UI components
│   └── public/         # Static assets
└── server/             # Express backend server
    ├── index.js        # Main server entry point
    └── package.json    # Backend dependencies
```

## 🏁 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **MetaMask** browser extension
- **Ganache** (for local blockchain testing)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/team-rocket-medi-secure.git
cd team-rocket-medi-secure
```

### 2. Smart Contract Deployment
Navigate to the contracts directory and deploy the contracts to your local blockchain (Ganache).

```bash
cd contracts
npm install
# Ensure Ganache is running on port 8545 (or update truffle-config.js)
truffle migrate --reset
```
*Note: Copy the deployed contract addresses and ABIs to the frontend configuration.*

### 3. Backend Setup
The backend handles IPFS interactions and other API services.

```bash
cd ../server
npm install
npm run dev
```
The server will start on the configured port (default: 3001 or as specified).

### 4. Frontend Setup
Run the Next.js application.

```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛡 Security & Privacy
- **Encryption**: Files are stored on IPFS, but sensitive references and access logic are handled by smart contracts.
- **Ownership**: The private key (MetaMask) is the only way to authorize data access.
- **Transparency**: All access requests and grants are recorded on the Ethereum blockchain.

## 🤝 Contributing
Contributions are welcome! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
