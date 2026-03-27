const express = require("express");
const app = express();

const PORT = 3000;

const Database = require("better-sqlite3");
const db = new Database("database.db");

const cors = require("cors");
app.use(cors());

app.get("/api/ovelser", (req, res) => {
    const rows = db.prepare("SELECT id, navn FROM ovelse").all();
    res.json(rows);
});

app.get("/api/okter/:brukernavn/:antall", (req, res) => {
    const { brukernavn, antall } = req.params;

    try {
        const bruker = db.prepare("SELECT id FROM bruker WHERE brukernavn = ?").get(brukernavn);
        if (!bruker) {
            return res.status(404).json({ error: "Bruker ikke funnet" });
        }

        const okter = db.prepare("SELECT * FROM treningsokt WHERE bruker_id = ? ORDER BY dato DESC LIMIT ?").all(bruker.id, antall)
        // console.log(okter)

        for(const okt of okter) {
            const ovelser = db.prepare(`
                SELECT ovelse_per_okt.id, Ovelse.navn
                FROM ovelse_per_okt
                JOIN ovelse ON Ovelse_per_okt.ovelse_id = Ovelse.id
                WHERE Ovelse_per_okt.treningsokt_id = ?
                ORDER BY ovelse_per_okt.rekkefolge
            `).all(okt.id);
            
            okt.ovelse = ovelser
            // console.log(ovelser)

            for(const ovelse of ovelser) {
                const sett = db.prepare("SELECT reps,vekt FROM sett WHERE ovelseokt_id = ? ORDER BY sett_nr").all(ovelse.id)
                // console.log(sett)
                ovelse.sett = sett
            }
        }
        res.json(okter)

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Feil ved henting av økter" });
    }
});

app.post("/api/registrer_okt", express.json(), (req, res) => {
    const { brukernavn, dato, start, slutt, ovelser } = req.body;
    if (!brukernavn || !dato || !Array.isArray(ovelser)) { // || !start || !slutt
        return res.status(400).json({ error: "Manglende eller ugyldig data" });
    }

    try {
        const bruker = db.prepare("SELECT * FROM bruker WHERE brukernavn = ?").get(brukernavn);
        const okt = db.prepare("INSERT INTO treningsokt (bruker_id, dato, start, slutt) VALUES (?, ?, ?, ?)").run(bruker.id, dato,start,slutt)

        for (let i = 0; i < ovelser.length; i++) {
            const ovelseData = ovelser[i];
            
            const ovelse = db.prepare("SELECT id FROM ovelse WHERE navn = ?").get(ovelseData.navn)
            const ovelsePerOkt = db.prepare("INSERT INTO ovelse_per_okt (treningsokt_id, ovelse_id, rekkefolge) VALUES (?, ?, ?)").run(okt.lastInsertRowid, ovelse.id, i + 1)

            for (let j = 0; j < ovelseData.sett.length; j++) {
                const settData = ovelseData.sett[j];
                db.prepare("INSERT INTO Sett (ovelseokt_id, reps, vekt, sett_nr) VALUES (?, ?, ?, ?)").run(ovelsePerOkt.lastInsertRowid, settData.reps, settData.vekt, j + 1);
            }
        }
        res.status(201).json({ message: "Økt lagret i databasen!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Noe gikk galt ved lagring av økten." });
    }
});


app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});