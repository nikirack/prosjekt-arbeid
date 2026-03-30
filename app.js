const express = require("express");
const app = express();

const PORT = 3000;

const Database = require("better-sqlite3");
const db = new Database("database.db");

// Det er ikke trykt å lagre passord i databasen, så vi må hashe passordet
const crypto = require("crypto");

function hashPassword(password) {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

const cors = require("cors");
app.use(cors());

// Route for å få ut alle øvelsene 
app.get("/api/ovelser", (req, res) => {
    const rows = db.prepare("SELECT id, navn FROM ovelse").all();
    res.json(rows);
});

// En route for å få antall
app.get("/api/:brukernavn/antall_okter", (req, res) => {
    const { brukernavn } = req.params;

    const bruker = db.prepare("SELECT id FROM bruker WHERE brukernavn = ?").get(brukernavn);
    if (!bruker) {
        return res.status(404).json({ error: "Bruker ikke funnet" });
    }

    const rows = db.prepare("SELECT COUNT(*) as antall_okter FROM treningsokt WHERE bruker_id = ?").get(bruker.id);
    res.json(rows);
});

// En route for å få de siste øktene for en person
app.get("/api/:brukernavn/okter/:antall", (req, res) => {
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

// En route for å registrere nye økter
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

// En route for å lage en ny bruker
app.post("/api/auth/registrer", express.json(), (req, res) => {
    const { navn, brukernavn, passord } = req.body
    if ( !navn || !brukernavn || !passord ){
        return res.status(400).json({ error: "Manglende eller ugyldig data" });
    }

    const hashedPassword = hashPassword(passord)

    try {
        db.prepare("INSERT INTO bruker (brukernavn, navn, passord) VALUES (?,?,?)").run(brukernavn, navn, hashedPassword);
        res.status(201).json({ message: "Bruker laget!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Noe gikk galt ved laging av bruker." });
    }
})

// WIP route for å logge in
app.post("/api/auth/login", express.json(), (req, res) => {
    
})

app.use(express.static("public"));

app.listen(PORT, () => {
    console.log(`Server kjører på http://localhost:${PORT}`);
});