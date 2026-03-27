const form = document.querySelector("#økt")
const ny_øvelse_knapp = document.querySelector("#ny_øvelse")
const øvelser_div = document.querySelector("#øvelser")

const brukernavn = "nikolai"

document.querySelector("#dato").valueAsDate = new Date();

let alleØvelser = []

async function øvelser() {
    const res = await fetch("/api/ovelser")
    alleØvelser = await res.json()
}

øvelser()

ny_øvelse_knapp.addEventListener("click", function(event) {
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
        <button type="button" class="legg-til-sett">Legg til sett</button>
    `
    øvelser_div.appendChild(div)

    const input = div.querySelector(".øvelse-input")
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

    leggTilSettBtn.addEventListener("click", () => leggTilSett(settContainer))

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
        </div>
        <button type="button" class="slett-sett">Slett</button>
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
    console.log(dato)



    const øvelser = øvelser_div.querySelectorAll(".øvelse")
    for (let div of øvelser) {
        const navn = div.querySelector(".øvelse-input").value.trim()

        const finnes = alleØvelser.some(øvelse => øvelse.navn === navn)
        if (!finnes) {
            alert(`"${navn}" finnes ikke i listen over gyldige øvelser!`)
            return
        }
    }

    const økter = Array.from(øvelser_div.querySelectorAll(".øvelse")).map(div => {
        const navn = div.querySelector(".øvelse-input").value
        const settData = Array.from(div.querySelectorAll(".sett")).map(settDiv => {
            const reps = settDiv.querySelector("input[name='reps']").value
            const vekt = settDiv.querySelector("input[name='vekt']").value
            return { reps, vekt }
        })
        return { navn, sett: settData }
    })
    
    let treningsøkt = {
        "brukernavn":brukernavn,
        "dato":dato,
        "start":null,
        "slutt":null,
        "ovelser": økter
    }

    console.log("Treningsøkt:", treningsøkt)

    const response = await fetch('/api/registrer_okt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(treningsøkt)
    });

    if (response.ok) {
        alert('Treningsøkten er registrert!');
    } else {
        alert('Det skjedde en feil ved registrering av treningsøkten.');
    }
})