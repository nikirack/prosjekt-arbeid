async function checkAuth() {
    try {
        const response = await fetch("/api/auth/loggedin");
        const isLoggedIn = await response.json();
        
        if (!isLoggedIn) {
            window.location.href = "/auth/loggin/";
        }
    } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = "/auth/loggin/";
    }
}

checkAuth()

document.getElementById("logout-btn").addEventListener("click", async (event) => {
    event.preventDefault();
    await fetch("/api/auth/loggut");
    window.location.href = "/auth/loggin";
});