/**
 * Test script for Trade Monitoring System
 * Run this after starting the server to test monitor functionality
 */

import axios from "axios";

const BASE_URL = "http://localhost:8901/api";
let authToken = "";
let testTradeId = "";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}→ ${msg}${colors.reset}`),
};

// Helper function to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Test 1: Create a market order and verify monitor starts
 */
async function testMarketOrderMonitor() {
  log.step("Test 1: Creating market order...");
  
  try {
    const response = await axios.post(
      `${BASE_URL}/trade/signal`,
      {
        symbol: "TEST_MARKET",
        orderType: "market",
        direction: "buy",
        quantity: 10,
        stopLoss: 90,
        target: 110,
        notes: "Test market order",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    testTradeId = response.data.trade._id;
    log.success(`Market order created: ${testTradeId}`);

    // Wait a bit for monitor to start
    await wait(2000);

    // Check monitor status
    const statusResponse = await axios.get(`${BASE_URL}/trade/monitors/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const monitor = statusResponse.data.monitors.find(
      (m) => m.tradeId === testTradeId
    );

    if (monitor && monitor.isRunning) {
      log.success(`Monitor is running for trade ${testTradeId}`);
      log.info(`  Status: ${monitor.status}`);
      log.info(`  Last Price: ${monitor.lastPrice}`);
      log.info(`  Stop Loss: ${monitor.stopLoss}`);
      log.info(`  Target: ${monitor.target}`);
    } else {
      log.error("Monitor not found or not running");
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 2: Update trade and verify monitor updates
 */
async function testMonitorUpdate() {
  log.step("Test 2: Updating trade parameters...");

  try {
    await axios.put(
      `${BASE_URL}/trade/${testTradeId}`,
      {
        stopLoss: 85,
        target: 115,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    log.success("Trade updated");

    // Wait a bit
    await wait(1000);

    // Check monitor status
    const statusResponse = await axios.get(`${BASE_URL}/trade/monitors/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const monitor = statusResponse.data.monitors.find(
      (m) => m.tradeId === testTradeId
    );

    if (monitor) {
      log.success("Monitor updated successfully");
      log.info(`  New Stop Loss: ${monitor.stopLoss}`);
      log.info(`  New Target: ${monitor.target}`);
    } else {
      log.error("Monitor not found");
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 3: Create a limit order and verify it's in pending
 */
async function testLimitOrderMonitor() {
  log.step("Test 3: Creating limit order...");

  try {
    const response = await axios.post(
      `${BASE_URL}/trade/signal`,
      {
        symbol: "TEST_LIMIT",
        orderType: "limit",
        direction: "buy",
        limitPrice: 200,
        quantity: 5,
        stopLoss: 180,
        target: 230,
        notes: "Test limit order",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    const limitTradeId = response.data.trade._id;
    log.success(`Limit order created: ${limitTradeId}`);

    // Wait a bit
    await wait(2000);

    // Check monitor status
    const statusResponse = await axios.get(`${BASE_URL}/trade/monitors/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const monitor = statusResponse.data.monitors.find(
      (m) => m.tradeId === limitTradeId
    );

    if (monitor && monitor.status === "pending") {
      log.success("Limit order monitor is running in pending state");
      log.info(`  Status: ${monitor.status}`);
      log.info(`  Entry Price: ${monitor.entryPrice}`);
    } else {
      log.error("Monitor not in expected pending state");
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 4: Close trade and verify monitor stops
 */
async function testMonitorRemoval() {
  log.step("Test 4: Closing trade...");

  try {
    await axios.post(
      `${BASE_URL}/trade/${testTradeId}/close`,
      {
        exitPrice: 105,
        reason: "manual",
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    log.success("Trade closed");

    // Wait a bit
    await wait(2000);

    // Check monitor status
    const statusResponse = await axios.get(`${BASE_URL}/trade/monitors/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const monitor = statusResponse.data.monitors.find(
      (m) => m.tradeId === testTradeId
    );

    if (!monitor) {
      log.success("Monitor successfully removed after trade closure");
    } else {
      log.error("Monitor still exists after closure");
    }

    log.info(`Total active monitors: ${statusResponse.data.totalMonitors}`);
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Test 5: Get monitor statistics
 */
async function testMonitorStats() {
  log.step("Test 5: Fetching monitor statistics...");

  try {
    const response = await axios.get(`${BASE_URL}/trade/monitors/status`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const stats = response.data;
    log.success("Monitor statistics retrieved");
    log.info(`  Total Monitors: ${stats.totalMonitors}`);
    log.info(`  Active Monitors: ${stats.activeMonitors}`);
    log.info(`  Pending Monitors: ${stats.pendingMonitors}`);
    log.info(`  Running Monitors: ${stats.runningMonitors}`);

    if (stats.monitors.length > 0) {
      log.info("\n  Active Monitors:");
      stats.monitors.forEach((m, i) => {
        log.info(`    ${i + 1}. ${m.symbol} (${m.status}) - Last: ${m.lastPrice}`);
      });
    }
  } catch (error) {
    log.error(`Failed: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("  Trade Monitoring System - Test Suite");
  console.log("=".repeat(60) + "\n");

  // Check if auth token is provided
  if (process.argv.length < 3) {
    log.error("Please provide auth token as argument");
    log.info("Usage: node testMonitor.js YOUR_AUTH_TOKEN");
    process.exit(1);
  }

  authToken = process.argv[2];
  log.info("Starting tests...\n");

  try {
    await testMarketOrderMonitor();
    await wait(3000);

    await testMonitorUpdate();
    await wait(3000);

    await testLimitOrderMonitor();
    await wait(3000);

    await testMonitorStats();
    await wait(3000);

    await testMonitorRemoval();
    await wait(2000);

    console.log("\n" + "=".repeat(60));
    log.success("All tests completed!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
  }
}

// Run tests
runTests();

