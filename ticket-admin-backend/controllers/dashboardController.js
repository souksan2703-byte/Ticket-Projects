const { sql, getPool } = require('../config/db');

const SOLD_DATE_SQL = 'COALESCE(tc.soldAt, tc.created)';

function buildDateFilter(request, from, to, dateExpr = SOLD_DATE_SQL) {
    let where = '';
    if (from) {
        request.input('from', sql.Date, from);
        where += ` AND ${dateExpr} >= @from`;
    }
    if (to) {
        request.input('to', sql.Date, to);
        where += ` AND ${dateExpr} < DATEADD(day, 1, @to)`;
    }
    return where;
}

// GET /api/dashboard/summary
// ກາດສະຫຼຸບ 4 ອັນ: Today's sales, Tickets sold this month, Active, OFF
// (ຄ່ານີ້ຕຶງກັບ "ມື້ນີ້"/"ເດືອນນີ້" ແທ້ໆສະເໝີ ບໍ່ຜູກກັບຕົວກອງວັນທີ່ເທິງໜ້າ Dashboard)
async function getSummary(req, res) {
    try {
        const pool = await getPool();

        const salesResult = await pool.request().query(`
            SELECT ISNULL(SUM(m.Price), 0) AS todaysSales
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0
                AND CAST(${SOLD_DATE_SQL} AS date) = CAST(GETDATE() AS date)
        `);

        const monthResult = await pool.request().query(`
            SELECT COUNT(*) AS ticketsSoldThisMonth
            FROM TicketCode tc
            WHERE tc.status = 0
                AND YEAR(${SOLD_DATE_SQL}) = YEAR(GETDATE())
                AND MONTH(${SOLD_DATE_SQL}) = MONTH(GETDATE())
        `);

        const statusResult = await pool.request().query(`
            SELECT
                SUM(CASE WHEN RTRIM(Status) = 'Open' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN RTRIM(Status) = 'OFF' THEN 1 ELSE 0 END) AS offCount
            FROM TicketCodeMaster
        `);

        res.json({
            todaysSales: salesResult.recordset[0].todaysSales || 0,
            ticketsSoldThisMonth: monthResult.recordset[0].ticketsSoldThisMonth || 0,
            active: statusResult.recordset[0].active || 0,
            off: statusResult.recordset[0].offCount || 0,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນສະຫຼຸບບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/dashboard/sold-by-event?from=&to= -> ຈຳນວນຕົ໋ວທີ່ຂາຍໄດ້ ແຍກຕາມອີເວັນ (ສຳລັບແຖບສີດ້ານເທິງ)
async function getSoldByEvent(req, res) {
    try {
        const { from, to } = req.query;
        const pool = await getPool();
        const request = pool.request();
        const dateFilter = buildDateFilter(request, from, to);

        const result = await request.query(`
            SELECT m.Title AS name, COUNT(*) AS value
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0 ${dateFilter}
            GROUP BY m.Title
            ORDER BY COUNT(*) DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/dashboard/ticket-mix?from=&to= -> ເອົາແຕ່ 2 ອີເວັນທີ່ຂາຍດີທີ່ສຸດ ມາຄິດເປັນ % ທຽບກັນເອງ (ສຳລັບ pie chart)
async function getTicketMix(req, res) {
    try {
        const { from, to } = req.query;
        const pool = await getPool();
        const request = pool.request();
        const dateFilter = buildDateFilter(request, from, to);

        const result = await request.query(`
            SELECT TOP 2 m.Title AS name, COUNT(*) AS count
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0 ${dateFilter}
            GROUP BY m.Title
            ORDER BY COUNT(*) DESC
        `);

        const rows = result.recordset;
        const total = rows.reduce((sum, r) => sum + r.count, 0) || 1;
        const colors = ['#2563EB', '#F97316'];

        res.json(
            rows.map((r, i) => ({
                name: r.name,
                value: Math.round((r.count / total) * 100),
                color: colors[i] || '#9CA3AF',
            }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

// GET /api/dashboard/transactions?from=&to= -> ລາຍຮັບລາຍວັນຂອງ 2 ອີເວັນທີ່ຂາຍດີທີ່ສຸດ (ສຳລັບ line chart)
// ຖ້າບໍ່ລະບຸໄລຍະວັນທີ່ ຈະໃຊ້ 7 ວັນຫຼ້າສຸດເປັນຄ່າເລີ່ມຕົ້ນ
async function getTransactionSeries(req, res) {
    try {
        let { from, to } = req.query;
        const pool = await getPool();

        if (!from || !to) {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 6);
            from = from || sevenDaysAgo.toISOString().slice(0, 10);
            to = to || today.toISOString().slice(0, 10);
        }

        // ຫາ 2 ອີເວັນທີ່ຂາຍດີທີ່ສຸດໃນຊ່ວງນີ້ກ່ອນ
        const topEventsResult = await pool.request()
            .input('from', sql.Date, from)
            .input('to', sql.Date, to)
            .query(`
                SELECT TOP 2 m.Title AS name
                FROM TicketCode tc
                JOIN TicketCodeMaster m ON m.tickid = tc.tickid
                WHERE tc.status = 0
                    AND ${SOLD_DATE_SQL} >= @from AND ${SOLD_DATE_SQL} < DATEADD(day, 1, @to)
                GROUP BY m.Title
                ORDER BY COUNT(*) DESC
            `);

        const topEvents = topEventsResult.recordset.map((r) => r.name);

        if (topEvents.length === 0) {
            return res.json({ events: [], series: [] });
        }

        const request2 = pool.request().input('from', sql.Date, from).input('to', sql.Date, to);
        topEvents.forEach((name, i) => request2.input(`ev${i}`, sql.NVarChar(100), name));
        const dataResult2 = await request2.query(`
            SELECT
                CONVERT(varchar(10), ${SOLD_DATE_SQL}, 23) AS date,
                m.Title AS eventName,
                SUM(m.Price) AS revenue
            FROM TicketCode tc
            JOIN TicketCodeMaster m ON m.tickid = tc.tickid
            WHERE tc.status = 0
                AND ${SOLD_DATE_SQL} >= @from AND ${SOLD_DATE_SQL} < DATEADD(day, 1, @to)
                AND m.Title IN (${topEvents.map((_, i) => `@ev${i}`).join(',')})
            GROUP BY CONVERT(varchar(10), ${SOLD_DATE_SQL}, 23), m.Title
        `);

        // ຕື່ມທຸກວັນໃນຊ່ວງໃຫ້ຄົບ (ແມ່ນວັນໃດບໍ່ມີການຂາຍເລີຍ ກໍ່ໃຫ້ເປັນ 0 ຈະໄດ້ກຣາບເສັ້ນຕໍ່ເນື່ອງບໍ່ຂາດຊ່ວງ)
        const byDate = {};
        dataResult2.recordset.forEach((row) => {
            const dateKey = row.date;
            if (!byDate[dateKey]) byDate[dateKey] = {};
            byDate[dateKey][row.eventName] = row.revenue;
        });

        const series = [];
        const cursor = new Date(from);
        const endDate = new Date(to);
        while (cursor <= endDate) {
            const dateKey = cursor.toISOString().slice(0, 10);
            const entry = { date: dateKey };
            topEvents.forEach((name) => {
                entry[name] = byDate[dateKey]?.[name] || 0;
            });
            series.push(entry);
            cursor.setDate(cursor.getDate() + 1);
        }

        res.json({ events: topEvents, series });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'ດຶງຂໍ້ມູນບໍ່ສຳເລັດ', error: err.message });
    }
}

module.exports = { getSummary, getSoldByEvent, getTicketMix, getTransactionSeries };
