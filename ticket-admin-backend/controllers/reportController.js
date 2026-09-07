const { sql, getPool } = require('../config/db');

// ใช้ soldAt เป็นหลัก ถ้าไม่มี (ข้อมูลเก่า) ให้ fallback ไปที่ created แทน
const SOLD_DATE_SQL = 'COALESCE(tc.soldAt, tc.created)';

function buildDateFilter(request, from, to) {
    let where = '';
    if (from) {
        request.input('from', sql.Date, from);
        where += ` AND ${SOLD_DATE_SQL} >= @from`;
    }
    if (to) {
        request.input('to', sql.Date, to);
        // รวมทั้งวันของ "to" ด้วย เลยบวกไป 1 วันแล้วใช้ '<'
        where += ` AND ${SOLD_DATE_SQL} < DATEADD(day, 1, @to)`;
    }
    return where;
}

// GET /api/reports/summary?from=&to=
async function getSummary(req, res) {
    try {
        const { from, to } = req.query;
        const pool = await getPool();
        const request = pool.request();
        const dateFilter = buildDateFilter(request, from, to);

        const result = await request.query(`
            SELECT
                ISNULL(SUM(m.Price), 0) AS totalRevenue,
                COUNT(DISTINCT tc.owner) AS totalBuyers,
                COUNT(*) AS ticketsSold
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0 ${dateFilter}
        `);

        const bestSellerResult = await pool.request()
            .input('from2', sql.Date, from || null)
            .input('to2', sql.Date, to || null)
            .query(`
                SELECT TOP 1 m.Title AS eventName, COUNT(*) AS soldCount
                FROM TicketCode tc
                JOIN TicketCodeMaster m ON m.tickid = tc.tickid
                WHERE tc.status = 0
                    ${from ? `AND ${SOLD_DATE_SQL} >= @from2` : ''}
                    ${to ? `AND ${SOLD_DATE_SQL} < DATEADD(day, 1, @to2)` : ''}
                GROUP BY m.Title
                ORDER BY COUNT(*) DESC
            `);

        const row = result.recordset[0];
        res.json({
            totalRevenue: row.totalRevenue || 0,
            totalBuyers: row.totalBuyers || 0,
            ticketsSold: row.ticketsSold || 0,
            bestSellingEvent: bestSellerResult.recordset[0]?.eventName || '-',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลสรุปไม่สำเร็จ', error: err.message });
    }
}

// GET /api/reports/revenue-by-event?from=&to=
async function getRevenueByEvent(req, res) {
    try {
        const { from, to } = req.query;
        const pool = await getPool();
        const request = pool.request();
        const dateFilter = buildDateFilter(request, from, to);

        const result = await request.query(`
            SELECT m.Title AS name, SUM(m.Price) AS revenue
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0 ${dateFilter}
            GROUP BY m.Title
            ORDER BY SUM(m.Price) DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลรายได้แยกตามอีเวนต์ไม่สำเร็จ', error: err.message });
    }
}

// GET /api/reports/transactions?from=&to=
async function getTransactions(req, res) {
    try {
        const { from, to } = req.query;
        const pool = await getPool();
        const request = pool.request();
        const dateFilter = buildDateFilter(request, from, to);

        const result = await request.query(`
            SELECT
                tc.code, m.Title AS eventName, tc.owner, tc.tranid, m.Price AS price
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0 ${dateFilter}
            ORDER BY ${SOLD_DATE_SQL} DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ดึงข้อมูลรายการขายไม่สำเร็จ', error: err.message });
    }
}

module.exports = { getSummary, getRevenueByEvent, getTransactions };
