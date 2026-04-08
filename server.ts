import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to get Google Sheets client
  const getSheetsClient = () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!email || !key || !spreadsheetId) {
      return null;
    }

    const auth = new JWT({
      email,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return {
      sheets: google.sheets({ version: "v4", auth }),
      spreadsheetId,
    };
  };

  // Config Status Endpoint
  app.get("/api/config-status", (req, res) => {
    res.json({
      googleSheetId: !!process.env.GOOGLE_SHEET_ID,
      googleServiceAccountEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      googlePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    });
  });

  // Proxy for External Jobs (to avoid CORS)
  app.all("/api/external-jobs", async (req, res) => {
    try {
      const response = await fetch("https://script.google.com/a/macros/bullhornconsultants.com/s/AKfycbzpiSLPeRgmbDDKHF9-nkr5_BadLE2dn3mQJprtUB9rpC9N1YGov6lPGJ3N-Ltr1Oorjg/exec", {
        method: req.method,
        headers: req.method === "POST" ? { "Content-Type": "application/json" } : {},
        body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
      });
      if (!response.ok && response.status !== 302) { // Apps Script often redirects
        throw new Error(`External API returned ${response.status}`);
      }
      
      // If it's a GET, we expect JSON.
      if (req.method === "GET") {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          res.json(data);
        } else {
          const text = await response.text();
          console.error("External API returned non-JSON response:", text.substring(0, 200));
          throw new Error("External API returned an invalid response format (expected JSON)");
        }
      } else {
        res.json({ success: true });
      }
    } catch (error: any) {
      console.error("Error proxying external jobs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Routes for Candidates
  app.get("/api/candidates", async (req, res) => {
    try {
      const client = getSheetsClient();
      if (!client) {
        return res.json([]);
      }
      
      const response = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.spreadsheetId,
        range: "Sheet1!A2:R", // Assuming headers are in row 1
      });

      const rows = response.data.values || [];
      const candidates = rows.map((row, index) => ({
        id: (index + 2).toString(), // Row number in sheet as string ID
        date: row[0] || "",
        clientName: row[1] || "",
        skill: row[2] || "",
        remarks: row[3] || "",
        positionId: row[4] || "",
        candidateName: row[5] || "",
        candidatePhone: row[6] || "",
        candidateEmail: row[7] || "",
        experience: row[8] || "",
        noticePeriod: row[9] || "",
        status: row[10] || "Submitted",
        comments: row[11] || "",
        recruiterName: row[12] || "",
        roleName: row[13] || "",
        stageUpdatedDate: row[14] || "",
        source: row[15] || "",
        priority: row[16] || "Medium",
        followUpDate: row[17] || "",
      }));

      res.json(candidates);
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/candidates", async (req, res) => {
    try {
      const client = getSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets integration is not fully configured. Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in the Secrets panel." });
      }
      
      const {
        date,
        clientName,
        skill,
        remarks,
        positionId,
        candidateName,
        candidatePhone,
        candidateEmail,
        experience,
        noticePeriod,
        status,
        comments,
        recruiterName,
        roleName,
        stageUpdatedDate,
        source,
        priority,
        followUpDate,
      } = req.body;

      await client.sheets.spreadsheets.values.append({
        spreadsheetId: client.spreadsheetId,
        range: "Sheet1!A:R",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            date,
            clientName,
            skill,
            remarks,
            positionId,
            candidateName,
            candidatePhone,
            candidateEmail,
            experience,
            noticePeriod,
            status,
            comments,
            recruiterName,
            roleName,
            stageUpdatedDate,
            source,
            priority,
            followUpDate,
          ]],
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error adding candidate:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/candidates/:rowId", async (req, res) => {
    try {
      const client = getSheetsClient();
      if (!client) {
        return res.status(400).json({ error: "Google Sheets integration is not fully configured. Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in the Secrets panel." });
      }
      const { rowId } = req.params;
      const {
        date,
        clientName,
        skill,
        remarks,
        positionId,
        candidateName,
        candidatePhone,
        candidateEmail,
        experience,
        noticePeriod,
        status,
        comments,
        recruiterName,
        roleName,
        stageUpdatedDate,
        source,
        priority,
        followUpDate,
      } = req.body;

      await client.sheets.spreadsheets.values.update({
        spreadsheetId: client.spreadsheetId,
        range: `Sheet1!A${rowId}:R${rowId}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            date,
            clientName,
            skill,
            remarks,
            positionId,
            candidateName,
            candidatePhone,
            candidateEmail,
            experience,
            noticePeriod,
            status,
            comments,
            recruiterName,
            roleName,
            stageUpdatedDate,
            source,
            priority,
            followUpDate,
          ]],
        },
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating candidate:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for missing API routes to prevent falling through to SPA fallback
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
