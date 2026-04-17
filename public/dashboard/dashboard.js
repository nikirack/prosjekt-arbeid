const statusHTML = document.getElementById("status");
const gridHTML = document.getElementById("okt-grid");

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
        gridHTML.innerHTML = "";

        for (const okt of okter) {
            const card = document.createElement("article");
            card.className = "card";

            const dato = new Date(okt.dato).toLocaleDateString("no-NO");

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
    } catch (err) {
        console.error(err);
        statusHTML.textContent = "Kunne ikke hente økter. Sjekk konsoll for detaljer.";
    }
}

hentOkter();

