const form = document.querySelector("#loggin_form")

form.addEventListener("submit", async function(event) {
    event.preventDefault()

    const brukernavn = document.querySelector("#brukernavn").value
    const passord = document.querySelector("#password").value

    const credentials = { brukernavn, passord }

    const response = await fetch('/api/auth/loggin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify(credentials)
    });

    if (response.ok) {
        window.location.href = '/'
    } else {
        const errorData = await response.json().catch(() => null)
        console.log(errorData)
        const message = errorData?.error || 'Feil ved innlogging. Sjekk brukernavn og passord.'
        alert(message)
    }
})
