const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'VotreMotDePasse',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME || 'FootClubDB',
    options: {
        encrypt: true,
        trustServerCertificate: true 
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Connecté à SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Échec de la connexion à la base de données: ', err);
        process.exit(1);
    });

module.exports = { sql, poolPromise };