const statusHTML = document.getElementById("status");
const gridHTML = document.getElementById("okt-grid");

// Laget en function for det for å gjøre det lettere å gjøre endringer
function nyCard(okt) {
    const card = document.createElement("article");
    card.className = "card";
    // Konverterer dato til norsk format, måtte gjøre det fordi den viste det på den amerikanse måten for meg
    const dato = new Date(okt.dato).toLocaleDateString("no-NO");
    // Legger det til sånn at det vises hvis det er en tom økt
    let ovelserHtml = "<p>Ingen øvelser funnet</p>";
    if (Array.isArray(okt.ovelse) && okt.ovelse.length > 0) {
        ovelserHtml = `<div class="ovelser">`;
        for (const ovelse of okt.ovelse) {
            ovelserHtml += `<h4>${ovelse.navn}</h4>`;
            if (Array.isArray(ovelse.sett) && ovelse.sett.length > 0) {
                ovelserHtml += "<ul>";
                for (const sett of ovelse.sett) {
                    ovelserHtml += `<li>${sett.reps} reps x ${sett.vekt} kg</li>`;
                }
                ovelserHtml += "</ul>";
            } else {
                ovelserHtml += "<p>Ingen sett registrert.</p>";
            }
        }
        ovelserHtml += "</div>";
    }
    card.innerHTML = `
        <h3>${dato}</h3>
        ${ovelserHtml}
    `;
    gridHTML.appendChild(card);
}

// Funksjon som henter og viser alle treningsøkter
async function hentOkter() {
    try {
        statusHTML.textContent = "Henter økter...";
        const res = await fetch("/api/okter/");

        if (!res.ok) {
            console.log("Error ved henting av data");
        }

        const okter = await res.json();

        if (!Array.isArray(okter) || okter.length === 0) {
            statusHTML.textContent = "Fant ingen økter for brukeren.";
            return;
        }

        statusHTML.textContent = `Viser ${okter.length} siste økter`;
        gridHTML.innerHTML = ""; // Tømmer tidligere innhold selvom det egentlig ikke skal være noe der

        for (const okt of okter) {
            nyCard(okt)
        }
    } catch (err) {
        console.error(err);
        statusHTML.textContent = "Kunne ikke hente økter. Sjekk konsoll for detaljer.";
    }
}

hentOkter();

