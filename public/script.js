const total_økter_html = document.querySelector("#total-økter")

const brukernavn = "nikolai"


async function endre_total_økter() {
    const res = await fetch(`/api/${brukernavn}/antall_okter`)
    antall_økter = await res.json()
    console.log(antall_økter)
    total_økter_html.textContent = antall_økter["antall_okter"]
}

endre_total_økter()