const express = require('express');
const { sql, poolPromise } = require('./database');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.get('/clubs', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM table_club ORDER BY nom_club');
        res.render('clubs', { clubs: result.recordset, editClub: null });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/clubs/edit/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const clubsResult = await pool.request().query('SELECT * FROM table_club ORDER BY nom_club');
        const editResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM table_club WHERE id = @id');
        
        res.render('clubs', { clubs: clubsResult.recordset, editClub: editResult.recordset[0] });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/clubs/add', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('nom_club', sql.VarChar, req.body.nom_club)
            .query('INSERT INTO table_club (nom_club) VALUES (@nom_club)');
        res.redirect('/clubs');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/clubs/update/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nom_club', sql.VarChar, req.body.nom_club)
            .query('UPDATE table_club SET nom_club = @nom_club WHERE id = @id');
        res.redirect('/clubs');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/clubs/delete/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM table_footballers WHERE id_club = @id; DELETE FROM table_club WHERE id = @id;');
        res.redirect('/clubs');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/footballers', async (req, res) => {
    try {
        const search = req.query.search || '';
        const pool = await poolPromise;
        
        const clubsResult = await pool.request().query('SELECT * FROM table_club ORDER BY nom_club');
        
        let query = `
            SELECT f.*, c.nom_club 
            FROM table_footballers f
            LEFT JOIN table_club c ON f.id_club = c.id
        `;
        
        const request = pool.request();
        if (search) {
            query += ` WHERE f.nom LIKE @search OR f.prenom LIKE @search`;
            request.input('search', sql.VarChar, `${search}%`);
        }
        query += ` ORDER BY f.nom, f.prenom`;
        
        const footballersResult = await request.query(query);
        
        res.render('footballers', { 
            footballers: footballersResult.recordset, 
            clubs: clubsResult.recordset,
            search: search,
            editFootballer: null 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/footballers/edit/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const clubsResult = await pool.request().query('SELECT * FROM table_club ORDER BY nom_club');
        const footballersResult = await pool.request().query(`
            SELECT f.*, c.nom_club FROM table_footballers f 
            LEFT JOIN table_club c ON f.id_club = c.id ORDER BY f.nom
        `);
        const editResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM table_footballers WHERE id = @id');
            
        res.render('footballers', { 
            footballers: footballersResult.recordset, 
            clubs: clubsResult.recordset,
            search: '',
            editFootballer: editResult.recordset[0] 
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/footballers/add', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('prenom', sql.VarChar, req.body.prenom)
            .input('nom', sql.VarChar, req.body.nom)
            .input('id_club', sql.Int, req.body.id_club || null)
            .query('INSERT INTO table_footballers (prenom, nom, id_club) VALUES (@prenom, @nom, @id_club)');
        res.redirect('/footballers');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/footballers/update/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('prenom', sql.VarChar, req.body.prenom)
            .input('nom', sql.VarChar, req.body.nom)
            .input('id_club', sql.Int, req.body.id_club || null)
            .query('UPDATE table_footballers SET prenom = @prenom, nom = @nom, id_club = @id_club WHERE id = @id');
        res.redirect('/footballers');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/footballers/delete/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM table_footballers WHERE id = @id');
        res.redirect('/footballers');
    } catch (err) {
        res.status(500).send(err.message);
    }
});


app.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const statsQuery = `
            SELECT 
                c.nom_club,
                COUNT(f.id) AS total_joueurs
            FROM table_club c
            LEFT JOIN table_footballers f ON c.id = f.id_club
            GROUP BY c.id, c.nom_club
            ORDER BY total_joueurs DESC, c.nom_club ASC
        `;
        
        const result = await pool.request().query(statsQuery);
        const stats = result.recordset;
        
        let maxClub = null;
        let minClub = null;
        
        if (stats.length > 0) {
            maxClub = stats[0];
            minClub = stats[stats.length - 1];
        }
        
        res.render('stats', { stats, maxClub, minClub });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => {
    console.log('Application lancée sur http://localhost:3000');
});