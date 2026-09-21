const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    },
};

let poolPromise;

function getPool() {
    if (!poolPromise) {
        poolPromise = new sql.ConnectionPool(config)
            .connect()
            .then((pool) => {
                console.log('ເຊື່ອມຕໍ່ SQL Server ສຳເລັດ');
                return pool;
            })
            .catch((err) => {
                console.error('ເຊື່ອມຕໍ່ SQL Server ບໍ່ສຳເລັດ:', err);
                poolPromise = null; // ເຜື່ອ retry ຮອບຖັດໄປ
                throw err;
            });
    }
    return poolPromise;
}

module.exports = { sql, getPool };
