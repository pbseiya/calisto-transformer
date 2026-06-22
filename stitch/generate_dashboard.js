#!/usr/bin/env node
/**
 * DGA Dashboard Generator using Google Stitch SDK (MCP Tool Client)
 */
import { StitchToolClient } from "@google/stitch-sdk";

const STITCH_API_KEY = process.env.STITCH_API_KEY;

if (!STITCH_API_KEY) {
  console.error("Error: STITCH_API_KEY environment variable is required");
  process.exit(1);
}

const DGA_DASHBOARD_PROMPT = `Create a professional industrial monitoring dashboard for Dissolved Gas Analysis (DGA) sensors with the following features:

LAYOUT:
- Dark theme with navy blue background (#1a1a2e) and card backgrounds (#16213e)
- Header with title "DGA Monitoring Dashboard", last updated timestamp, and connection status indicator
- Top filter panel with device multi-select dropdown, time range picker, and data source toggle
- Main content: 60% left column for charts, 40% right column for data table
- Bottom statistics panel

FILTERS PANEL:
- Device filter: Multi-select dropdown with 21 devices grouped by type (Battery, Transformer, etc.), search box, Select All/Clear All buttons
- Time range: Quick presets (Last 15min, 1hr, 6hr, 24hr, 7days, 30days) and custom date range picker
- Data source toggle: Raw (15 sec) vs Summary (15 min)
- Chart frequency selector: Auto, 15sec, 1min, 5min, 15min, 1hr, 1day

CHARTS (3 stacked line charts):
1. Hydrogen (H2) Trend - Red line (#e74c3c), Y-axis in ppm, threshold lines at 250ppm (orange dashed) and 500ppm (red dashed)
2. Carbon Monoxide (CO) Trend - Blue line (#3498db), threshold lines at 1000ppm and 1500ppm
3. Water Content (WC) Trend - Green line (#2ecc71), threshold lines at 30ppm and 40ppm

Each chart should have:
- Zoom in/out buttons and reset zoom
- Mouse wheel zoom and drag to pan
- Hover tooltip showing device name, value, timestamp
- Toggle individual devices on/off via legend
- Download as PNG button

DATA TABLE (right column):
- Columns: Device | H2 (ppm) | CO (ppm) | WC (ppm) | Status | Last Updated
- Sortable columns
- Color coding: Green (normal), Yellow (warning), Red (danger)
- Click row to highlight device in charts
- Auto-refresh indicator

STATISTICS PANEL (bottom):
- Per-device cards showing: Min/Max/Mean/Median, Standard Deviation, First/Last values, Alarm count, Trend arrow (up/down/stable)

STYLE:
- Modern, clean industrial dashboard design
- Rounded corners on cards
- Subtle shadows and borders
- Responsive layout
- Professional typography with sans-serif fonts
- Color-coded status indicators`;

async function main() {
  console.log("=== DGA Dashboard Generator ===\n");

  const client = new StitchToolClient({ apiKey: STITCH_API_KEY });

  try {
    // 1. Create project
    console.log("1. Creating Stitch project...");
    const createResult = await client.callTool("create_project", {
      title: "DGA Monitoring Dashboard"
    });
    
    const projectName = createResult.name;
    const projectId = projectName.replace("projects/", "");
    console.log(`   Project: ${projectName}\n`);

    // 2. Generate screen
    console.log("2. Generating dashboard screen...");
    const generateResult = await client.callTool("generate_screen_from_text", {
      projectId: projectId,
      prompt: DGA_DASHBOARD_PROMPT,
      deviceType: "DESKTOP"
    });
    
    const screenId = generateResult.id || generateResult.screenId;
    console.log(`   Screen: ${screenId}\n`);

    // 3. Get screen details
    console.log("3. Getting screen details...");
    const screenResult = await client.callTool("get_screen", {
      projectId: projectId,
      screenId: screenId
    });

    const htmlUrl = screenResult.html || screenResult.htmlUrl;
    const imageUrl = screenResult.image || screenResult.imageUrl;

    console.log("\n=== Results ===");
    console.log(`Project: ${projectName}`);
    console.log(`Screen ID: ${screenId}`);
    if (htmlUrl) console.log(`HTML: ${htmlUrl}`);
    if (imageUrl) console.log(`Screenshot: ${imageUrl}`);
    console.log("\nDashboard generation complete!");

  } catch (error) {
    console.error("Error:", error.message);
    if (error.code) console.error("Code:", error.code);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
