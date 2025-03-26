document.addEventListener("DOMContentLoaded", function () {
    const authCookieInput = document.getElementById("authCookie");
    const refreshButton = document.getElementById("refreshButton");
    const resultElement = document.getElementById("result");
    const countdownElement = document.getElementById("countdown");
    const refreshButtonIcon = document.getElementById("refreshButtonIcon");

    refreshButton.addEventListener("click", function () {
        const authCookie = authCookieInput.value;
        refreshButton.disabled = true;
        refreshButtonIcon.style.display = "none"; // Hide the refresh icon
        resultElement.textContent = "Please wait, your cookie is generating.";

        fetch("/refresh?cookie=" + encodeURIComponent(authCookie), {
            method: "GET",
        })
            .then((response) => response.json())
            .then((data) => {
                if (data && data.redemptionResult && data.redemptionResult.refreshedCookie) {
                    resultElement.textContent = data.redemptionResult.refreshedCookie;
                } else {
                    resultElement.textContent = "Failed to refresh, try again!";
                }
            })
            .catch((error) => {
                console.error(error);
                resultElement.textContent = "Error occurred while refreshing the cookie. Cookie is Probably Invalid.";
            })
            .finally(() => {
                refreshButton.disabled = false;
                refreshButtonIcon.style.display = "inline"; // Show the icon again
            });
    });

    const copyButton = document.getElementById("copyButton");
    copyButton.addEventListener("click", function () {
        const resultText = resultElement.textContent;
        const textarea = document.createElement("textarea");
        textarea.value = resultText;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        copyButton.textContent = "Copied!";
        setTimeout(function () {
            copyButton.textContent = "Copy";
        }, 1000);
    });
});
