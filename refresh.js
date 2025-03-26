const axios = require('axios');

async function refreshCookie(roblosecurityCookie) {
    try {
        const response = await axios.get("https://www.roblox.com/home", {
            headers: {
                'Cookie': `.ROBLOSECURITY=${roblosecurityCookie}`
            }
        });

        // Extract the new cookie if it's set in the response headers
        const refreshedCookieData = response.headers['set-cookie']?.toString() || "";

        return {
            success: true,
            refreshedCookie: refreshedCookieData.match(/(_\|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.\|_[A-Za-z0-9]+)/g)?.toString()
        };
    } catch (error) {
        return {
            success: false,
            robloxDebugResponse: error.response?.data
        };
    }
}

module.exports = {
    refreshCookie
};
