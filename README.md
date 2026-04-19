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

Treningsokt, Ovelse_per_okt og Sett henger veldig tett sammen der når man registrerer en økt lager den en økt i Treningsokt, så for hver øvelse i økten lager den en Ovelse_per_okt som er linket til Treningsokt og til Ovelse. For hvert sett i øvelsen lager den et sett i Sett og linker med Ovelse, sånn at alle henger sammen.

## Sider
Appen består av hovedsaklig 3 sider som brukeren er på:
- Dashboard (/dashboard)
- Ny økt (/ny_økt)
- Hjem (/)

### Dashboard
Dashboard er siden for å vise frem alle tidligere økter for en bruker, det gjør den gjennom routen `/api/okter`
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
### Ny økt
Ny økt er siden for å registrere en ny økt for en bruker, det gjør den gjennom routen `/api/registrer_okt`   
Denne routen lager tar in dato, start, slutt, ovelser. Der start og slutt blir ikke brukt enda og er bare `null`, og ovelser er en array med alle øvelsene og sett linket til de.  
For å legge de til i databasen lager vi først en treningsøkt til brukeren med
```js 
const okt = db.prepare("INSERT INTO treningsokt (bruker_id, dato, start, slutt) VALUES (?, ?, ?, ?)").run(bruker.id, dato, start, slutt);
```
Så looper vi gjennom alle øktene og lager en ovelse_per_okt for hver av øvelsene
```js
const ovelsePerOkt = db.prepare("INSERT INTO ovelse_per_okt (treningsokt_id, ovelse_id, rekkefolge) VALUES (?, ?, ?)").run(okt.lastInsertRowid, ovelse.id, i + 1);
```
Vi gjør det på den måten sånn at vi har de i riktig rekkefølge som vi kan sortere etter når vi henter ut dataen til dashboard-et  
Så looper vi gjennom hvert sett for hver øvelse og lager det i databasen
```js
db.prepare("INSERT INTO Sett (ovelseokt_id, reps, vekt, sett_nr) VALUES (?, ?, ?, ?)").run(ovelsePerOkt.lastInsertRowid, settData.reps, settData.vekt, j + 1);
```

For at øvelsene skal linke til riktige øvelser i databasen har jeg en route `/api/ovelser`  
```js
app.get("/api/ovelser", (req, res) => {
    const rows = db.prepare("SELECT id, navn FROM ovelse").all();
    res.json(rows);
});
```
Denne henter gir bare alle ovelse_per_okt kobler seg til riktig av de ferdigdefinerte øvelsene 

### Hjem
Hjem-siden er veldig basic og er egentlig bare en side for å la brukeren gå mellom /dashboard og /ny_økt, jeg har denne for å gjøre det lettere å linke til andre sider hvis jeg lager flere.

## Atuh
Jeg har prøvd å lage en basic måte å authentisere, gjennom sessions og cookies. Jeg har en file som heter `auth-check.js` som har 2 jobber, den første er å se om brukeren er logget in ved hjelp av routen `/api/auth/loggedin` som returner true eller false basert på om brukeren er logget in eller ikke.
```js
app.get("/api/auth/loggedin", (req, res) => {
    const bruker = getUserFromSession(req);
    if (!bruker) {
        return res.json(false);
    }
    res.json(true);
});
```
der `getUserFromSession` er
```js
function getUserFromSession(req) {
    const sessionId = getSession(req);

    try {
        const session = db.prepare("SELECT bruker FROM session WHERE session = ?").get(sessionId);
        if (!session) return null;

        const bruker = db.prepare("SELECT * FROM bruker WHERE id = ?").get(session.bruker);
        return bruker || null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
``` 
som ser om sessionen er i databasen, og hvis den er, ser den hvilke bruker som eier den sessioen, sessionen er lagret som en cookie på brukeren sin pc og vi bruker `getSession` får å hente den ut fra req, som er dataen brukeren sender med når den sender en fetch request.
```js
function getSession(req) {
    const cookie = req.headers.cookie;
    if (!cookie) return null;

    const match = cookie.match(/sessionId=([^;]+)/);
    return match ? match[1] : null;
}
```

/auth mappen i public består av 2 sider, loggin og registrer  
Hvis brukeren er ikke logget in vil den bare kunne gå på de 2 sidene  
På registreringssiden er alt man trenger for å lage en bruker: et brukernavn, et navn og et passord som blir hashet før det blir lagret i databasen fordi i følge GDPR skal man ikke lagre noe data om en bruker som man ikke trenger
```js
app.post("/api/auth/loggin", express.json(), (req, res) => {
    const { brukernavn, passord } = req.body;

    try {
        const bruker = db.prepare("SELECT * FROM bruker WHERE brukernavn = ?").get(brukernavn);
        if (!bruker) {
            return res.status(404).json({ error: "Bruker ikke funnet" });
        }

        if (hashPassword(passord) !== bruker.passord) {
            return res.status(404).json({ error: "Feil brukernavn eller passord" });
        }

        const sessionId = newSession(bruker);
        res.cookie("sessionId", sessionId, { httpOnly: true, sameSite: "Strict" });

        return res.status(201).json({ message: `Innlogget som ${bruker.brukernavn}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Noe gikk galt innloging." });
    }

});

app.get("/api/auth/loggut", (req, res) => {
    const bruker = getUserFromSession(req);
    if (!bruker) {
        return res.status(401).json({ error: "Ikke innlogget" });
    }
    
    try {
        removeSession(bruker)
        return res.status(201).json({ message: `Fjernet alle sessions for ${bruker.brukernavn}` });
    } catch (err) {
        res.status(500).json({ error: "Noe gikk galt ved ut-loggingen." });
    }
});
```
Logg ut routen sletter alle sessions for en bruker gjennom 
```js
function removeSession(bruker) {
    db.prepare("DELETE FROM session WHERE bruker = ?").run(bruker.id);
}
```
