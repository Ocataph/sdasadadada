const axios = require('axios');

async function fetchSessionCSRFToken(roblosecurityCookie) {
    try {
        await axios.post("https://auth.roblox.com/v2/logout", {}, {
            headers: {
                'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
            }
        });
        return null; // Logout successful, CSRF token not needed
    } catch (error) {
        const csrfToken = error.response?.headers["x-csrf-token"];
        if (!csrfToken) {
            console.error("Failed to fetch CSRF token:", error.message);
        }
        return csrfToken || null;
    }
}

async function generateAuthTicket(roblosecurityCookie) {
    try {
        const csrfToken = await fetchSessionCSRFToken(roblosecurityCookie);
        if (!csrfToken) {
            return "Failed to fetch auth ticket";
        }

        const response = await axios.post("https://auth.roblox.com/v1/authentication-ticket", {}, {
            headers: {
                "x-csrf-token": csrfToken,
                "referer": "https://www.roblox.com/madebySynaptrixBitch",
                'Content-Type': 'application/json',
                'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
            }
        });

        return response.headers['rbx-authentication-ticket'] || "Failed to fetch auth ticket";
    } catch (error) {
        console.error("Error generating auth ticket:", error.response?.data || error.message);
        return "Failed to fetch auth ticket";
    }
}

async function redeemAuthTicket(authTicket) {
    try {
        const response = await axios.post("https://auth.roblox.com/v1/authentication-ticket/redeem", {
            "authenticationTicket": authTicket
        }, {
            headers: {
                'RBXAuthenticationNegotiation': '1'
            }
        });

        const refreshedCookieData = response.headers['set-cookie']?.toString() || "";

        return {
            success: true,
            refreshedCookie: refreshedCookieData.match(/(_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-Za-z0-9]+)/g)?.toString()
        };
    } catch (error) {
        console.error("Error redeeming auth ticket:", error.response?.data || error.message);
        return {
            success: false,
            robloxDebugResponse: error.response?.data
        };
    }
}

module.exports = {
    generateAuthTicket,
    redeemAuthTicket
};
