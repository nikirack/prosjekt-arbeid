const form = document.querySelector("#økt")
const ny_øvelse_knapp = document.querySelector("#ny_øvelse")
const øvelser_div = document.querySelector("#øvelser")

document.querySelector("#dato").valueAsDate = new Date();

let alleØvelser = []

async function øvelser() {
    const res = await fetch("/api/ovelser")
    alleØvelser = await res.json()
}

øvelser()

ny_øvelse_knapp.addEventListener("click", (event) => {
    event.preventDefault()
    leggTilØvelse()
})

function leggTilØvelse() {
    const count = øvelser_div.childElementCount
    const div = document.createElement("div")
    div.classList.add("øvelse")
    const datalistId = `øvelser-list-${count+1}`

    div.innerHTML = `
        <h2>Øvelse ${count + 1}</h2>
        <div class="øvelse-input-row">
            <input type="text" list="${datalistId}" class="øvelse-input" placeholder="Søk øvelse..." required>
            <datalist id="${datalistId}"></datalist>
            <button type="button" class="slett-øvelse">Slett</button>
        </div>
        <div class="sett-container"></div>
        <button type="button" class="legg-til-sett btn-stor">Legg til sett</button>
    `
    øvelser_div.appendChild(div)

    const datalist = div.querySelector("datalist")
    const settContainer = div.querySelector(".sett-container")
    const slettBtn = div.querySelector(".slett-øvelse")
    const leggTilSettBtn = div.querySelector(".legg-til-sett")

    alleØvelser.forEach(øvelse => {
        const option = document.createElement("option")
        option.value = øvelse.navn
        datalist.appendChild(option)
    })

    for (let i = 0; i < 3; i++) {
        leggTilSett(settContainer)
    }

    leggTilSettBtn.addEventListener("click", () => {
        leggTilSett(settContainer)
    })

    slettBtn.addEventListener("click", () => {
        div.remove()
        oppdaterØvelseNummer()
    })
}

function leggTilSett(container) {
    const settNr = container.childElementCount + 1
    const settDiv = document.createElement("div")
    settDiv.classList.add("sett")
    settDiv.innerHTML = `
        <h4>Sett ${settNr}</h4>
        <div class="sett-inputs">
            <input type="number" name="reps" value="6" min="1" placeholder="Reps">
            <input type="number" name="vekt" value="" min="0" placeholder="Vekt (kg)">
            <button type="button" class="slett-sett">Slett</button>
        </div>
    `
    container.appendChild(settDiv)

    const slettSettBtn = settDiv.querySelector(".slett-sett")
    slettSettBtn.addEventListener("click", () => {
        settDiv.remove()
        oppdaterSettNummer(container)
    })
}

function oppdaterØvelseNummer() {
    const øvelser = øvelser_div.querySelectorAll(".øvelse")
    console.log(øvelser)
    øvelser.forEach((div, index) => {
        const h2 = div.querySelector("h2")
        h2.textContent = `Øvelse ${index + 1}`
    })
}

function oppdaterSettNummer(container) {
    const sett = container.querySelectorAll(".sett")
    sett.forEach((div, index) => {
        const h4 = div.querySelector("h4")
        h4.textContent = `Sett ${index + 1}`
    })
}

form.addEventListener("submit", async function(event) {
    event.preventDefault()

    const dato = document.querySelector("#dato").value
    // console.log(dato)

    let økt = []
    const øvelseDivs  = øvelser_div.querySelectorAll(".øvelse")
    for (let div of øvelseDivs) {
        const navn = div.querySelector(".øvelse-input").value.trim()
        // console.log(navn)
        const finnes = alleØvelser.some(øvelse => øvelse.navn === navn)
        if (!finnes) {
            alert(`"${navn}" finnes ikke i listen over gyldige øvelser!`)
            return
        }

        const settArray = []
        const settDivs = div.querySelectorAll(".sett")
        for(let sett of settDivs) {
            const reps = sett.querySelector('input[name="reps"]').value
            const vekt = sett.querySelector('input[name="vekt"]').value
            settArray.push({ reps, vekt })
        }
        økt.push({ navn, settArray })
    }
    
    let treningsøkt = {
        "dato":dato,
        "start":null,
        "slutt":null,
        "ovelser": økt
    }

    console.log(treningsøkt)

    const response = await fetch("/api/registrer_okt", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(treningsøkt)
    });

    if (response.ok) {
        alert("Treningsøkten er registrert!");
        window.location.href = "/";
    } else {
        alert("Det skjedde en feil ved registrering av treningsøkten.");
    }
})

document.getElementById("logout-btn").addEventListener("click", async (event) => {
    event.preventDefault();
    await fetch("/api/auth/loggut");
    window.location.href = "/auth/loggin";
});