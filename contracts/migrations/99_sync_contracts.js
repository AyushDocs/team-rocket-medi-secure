const { execSync } = require('child_process');
const path = require('path');

module.exports = function (deployer, network) {
  // We only want to sync on local networks automatically
  if (network === 'development' || network === 'ganache') {
    console.log("\n" + "═".repeat(60));
    console.log("🚀 RUNNING AUTOMATIC FRONTEND SYNC...");
    console.log("═".repeat(60));
    
    try {
      const scriptPath = path.join(__dirname, '..', 'deploy.mjs');
      execSync(`node ${scriptPath} sync`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log("✅ Sync completed successfully.");
    } catch (e) {
      console.error("❌ Sync failed:", e.message);
    }
    console.log("═".repeat(60) + "\n");
  } else {
    console.log(`\nSkipping auto-sync for network: ${network}`);
  }
};
