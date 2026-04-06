const form = document.querySelector("#ny_bruker_form")

form.addEventListener("submit", async function(event) {
    event.preventDefault()

    const navn = document.querySelector("#navn").value
    const brukernavn = document.querySelector("#brukernavn").value
    // const epost = document.querySelector("#epost").value
    const passord = document.querySelector("#password").value
    console.log(navn,brukernavn,passord)
    
    const bruker = { navn, brukernavn, passord }

    const response = await fetch("/api/auth/registrer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bruker)
    });

    if (response.ok) {
        alert("Bruker registrert!");
    } else {
        alert("Det skjedde en feil ved registrering av brukerene.");
    }

})