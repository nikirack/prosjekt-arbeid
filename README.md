# Treningslogg
## Teknologi
Denne appen bruker node.js med express og sqlite (better-sqlite3)
## Datamodell
![Datamodell](/assets/Datamodell.drawio.png)  
Databasen består av 6 forskjellige tables:
- Bruker
- Session
- Treningsokt
- Ovelse
- Ovelse_per_okt
- Sett

I bruker lagrer vi navn, brukernavn og passord som er hashet med sha256
```js
function hashPassword(password) {
    return crypto
        .createHash("sha256")
        .update(password)
        .digest("hex");
}
```

Session er bare en lang id på 32 karakterer som er linket til en bruker
```js
const sessionId = crypto.randomBytes(32).toString("hex");
```

Ovelse består av ferdigdefinerte øvelser som brukeren ikke kan redigere 

Treningsokt, Ovelse_per_okt og Sett henger veldig tett sammen der når man registrerer en økt lager den en økt i Treningsokt, så for hver øvelse i økten lager den en Ovelse_per_okt som er linket til Treningsokt og til Ovelse. For hvert sett i øvelsen lager den et sett i Sett og linker med Ovelse, sånn at alle henger sammen.¨

## Sider
Appen består av hovedsaklig 3 sider:
- Dashboard (/dashboard)
- Ny økt (/ny_økt)
- Hjem (/)

#### Dashboard
```js
app.get("/api/okter/", (req, res) => {
    try {
        const bruker = getUserFromSession(req);
        if (!bruker) {
            return res.status(401).json({ error: "Ikke innlogget" });
        }

        const okter = db.prepare("SELECT * FROM treningsokt WHERE bruker_id = ? ORDER BY dato").all(bruker.id);

        for (const okt of okter) {
            const ovelser = db.prepare(`
                SELECT ovelse_per_okt.id, Ovelse.navn
                FROM ovelse_per_okt
                JOIN ovelse ON Ovelse_per_okt.ovelse_id = Ovelse.id
                WHERE Ovelse_per_okt.treningsokt_id = ?
                ORDER BY ovelse_per_okt.rekkefolge
            `).all(okt.id);

            okt.ovelse = ovelser;

            for (const ovelse of ovelser) {
                const sett = db.prepare("SELECT reps,vekt FROM sett WHERE ovelseokt_id = ? ORDER BY sett_nr").all(ovelse.id);
                ovelse.sett = sett;
            }
        }
        res.json(okter);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Feil ved henting av økter" });
    }
});
```
Denne routen looper gjennom alle treningsøktene (treningsokt) til en bruker, så looper den gjennom alle øktene og legger til settene i øktene og returner i json format, eksempel outputt:
```json
[
  {
    "id": 26,
    "bruker_id": 10,
    "dato": "2026-04-05",
    "start": null,
    "slutt": null,
    "ovelse": [
      {
        "id": 9,
        "navn": "Russian twist",
        "sett": [
          {
            "reps": 6,
            "vekt": 23
          },
          {
            "reps": 6,
            "vekt": 23
          },
          {
            "reps": 6,
            "vekt": 23
          }
        ]
      }
    ]
  },
]
```