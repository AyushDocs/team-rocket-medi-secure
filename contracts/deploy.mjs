#!/usr/bin/env node
/**
 * Sanjeevni Deployment Manager
 * Handles compilation, deployment, and contract sync with validation
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONTRACTS_DIR = join(__dirname, '..', 'contracts');
const FRONTEND_DIR = join(__dirname, '..', 'frontend');

const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(level, message) {
    console.log(`${COLORS[level]}${message}${COLORS.reset}`);
}

const contracts = [
    'Patient',
    'Doctor',
    'Hospital',
    'Insurance',
    'Marketplace',
    'PatientDetails',
    'HandoffManager'
];

function run(command, options = {}) {
    try {
        log('blue', `[EXEC] ${command}`);
        return execSync(command, {
            cwd: CONTRACTS_DIR,
            stdio: 'inherit',
            ...options
        });
    } catch (error) {
        log('red', `[ERROR] Command failed: ${command}`);
        if (options.exitOnError !== false) {
            process.exit(1);
        }
        throw error;
    }
}

function checkGanache() {
    log('blue', 'Checking Ganache...');
    try {
        const result = execSync(
            'curl -s -X POST -H "Content-Type: application/json" --data \'{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}\' http://127.0.0.1:8545',
            { timeout: 5000 }
        );
        const response = JSON.parse(result.toString());
        if (response.result) {
            log('green', `Ganache running (block: ${parseInt(response.result, 16)})`);
            return true;
        }
    } catch (e) {
        log('red', 'Ganache not running on port 8545');
        log('blue', 'Please start Ganache and try again');
        process.exit(1);
    }
}

function compile() {
    log('blue', 'Compiling contracts...');
    run('npx truffle compile');
    log('green', 'Compilation successful');
}

function deploy() {
    log('blue', 'Deploying contracts...');
    run('npx truffle migrate --reset --network development');
    log('green', 'Deployment successful');
}

function syncToFrontend() {
    log('blue', 'Syncing contracts to frontend...');
    
    const destDir = join(FRONTEND_DIR, 'contracts');
    if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
    }
    
    const contractsSrc = join(CONTRACTS_DIR, 'build', 'contracts');
    
    let synced = 0;
    for (const contract of contracts) {
        const src = join(contractsSrc, `${contract}.json`);
        if (existsSync(src)) {
            copyFileSync(src, join(destDir, `${contract}.json`));
            synced++;
        }
    }
    
    const addressData = { network: 'development', deployedAt: new Date().toISOString() };
    writeFileSync(join(destDir, 'addresses.json'), JSON.stringify(addressData, null, 2));
    
    log('green', `Synced ${synced} contracts to frontend`);
}

function validate() {
    log('blue', 'Validating deployment...');
    
    let allDeployed = true;
    const buildDir = join(CONTRACTS_DIR, 'build', 'contracts');

    for (const contract of contracts) {
        const artifactFile = join(buildDir, `${contract}.json`);
        if (!existsSync(artifactFile)) {
            console.log(`${COLORS.red}✗${COLORS.reset} ${contract.padEnd(20)} ARTIFACT NOT FOUND`);
            allDeployed = false;
            continue;
        }

        const artifactData = JSON.parse(readFileSync(artifactFile, 'utf8'));
        const networkId = artifactData.networks?.['1337'] || artifactData.networks?.['5777'];
        const address = networkId?.address;
        
        if (address) {
            console.log(`${COLORS.green}✓${COLORS.reset} ${contract.padEnd(20)} ${address}`);
        } else {
            console.log(`${COLORS.red}✗${COLORS.reset} ${contract.padEnd(20)} NOT DEPLOYED ON DETECTED NETWORK`);
            allDeployed = false;
        }
    }
    
    console.log('═'.repeat(50));

    
    if (!allDeployed) {
        log('red', 'Validation failed - some contracts not deployed');
        process.exit(1);
    }
    
    log('green', 'All contracts validated');
}

function healthCheck() {
    log('blue', 'Running health check...');
    
    try {
        run('npx truffle exec scripts/seed_data.js --network development', { exitOnError: false });
        log('green', 'Health check passed');
    } catch (e) {
        log('yellow', 'Health check warnings - verify manually');
    }
}

function status() {
    log('blue', 'Checking contract status...');
    
    const contractsSrc = join(CONTRACTS_DIR, 'build', 'contracts');
    
    console.log('\nContract Build Status:');
    console.log('─'.repeat(40));
    
    for (const contract of contracts) {
        const artifact = join(contractsSrc, `${contract}.json`);
        if (existsSync(artifact)) {
            const data = JSON.parse(readFileSync(artifact, 'utf8'));
            const networks = Object.keys(data.networks || {});
            console.log(`${COLORS.green}✓${COLORS.reset} ${contract.padEnd(20)} ${networks.length} network(s)`);
        } else {
            console.log(`${COLORS.red}✗${COLORS.reset} ${contract.padEnd(20)} NOT BUILT`);
        }
    }
    
    console.log('─'.repeat(40));
    
    const addressFile = join(CONTRACTS_DIR, 'build', 'contracts', 'Address.json');
    if (existsSync(addressFile)) {
        const data = JSON.parse(readFileSync(addressFile, 'utf8'));
        const devNetwork = data.networks?.['1337'] || data.networks?.['5777'];
        if (devNetwork) {
            log('green', `Deployed on network: ${devNetwork.address}`);
        }
    }
}

function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'deploy';
    
    console.log('\n' + COLORS.cyan + '╔════════════════════════════════════════════════════════════╗');
    console.log('║          SANJEEVNI DEPLOYMENT MANAGER                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝' + COLORS.reset + '\n');
    
    switch (command) {
        case 'deploy':
            checkGanache();
            compile();
            deploy();
            syncToFrontend();
            validate();
            break;
            
        case 'compile':
            compile();
            break;
            
        case 'migrate':
            checkGanache();
            deploy();
            break;
            
        case 'sync':
            syncToFrontend();
            break;
            
        case 'validate':
            validate();
            break;
            
        case 'status':
            status();
            break;
            
        case 'health':
            healthCheck();
            break;
            
        case 'all':
            checkGanache();
            compile();
            deploy();
            syncToFrontend();
            validate();
            healthCheck();
            break;
            
        case 'help':
            console.log(`
Usage: node deploy.mjs [command]

Commands:
  deploy      Full deployment (compile + deploy + sync + validate)
  compile     Only compile contracts
  migrate     Only deploy contracts (requires Ganache)
  sync        Only sync compiled contracts to frontend
  validate    Validate deployment addresses
  status      Show contract build/deploy status
  health      Run health check
  all         Full deployment + validation + health check
  help        Show this message

Examples:
  node deploy.mjs deploy
  node deploy.mjs status
            `);
            break;
            
        default:
            log('red', `Unknown command: ${command}`);
            log('blue', 'Run "node deploy.mjs help" for usage');
            process.exit(1);
    }
}

main();
